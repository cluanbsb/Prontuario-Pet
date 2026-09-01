/* ==========================================================
   Prontuário Pet — lógica da aplicação
   Estado, persistência (window.storage), renderização e eventos
   ========================================================== */

let currentUser = null;
let authMode = 'login';
let authError = '';
let authInfo = '';
let userMenuOpen = false;
let animalPickerOpen = false;
let copyState = null; // { entity, selectedIds: Set, targetId: string }
let shareState = null; // { animalId }
let shareError = '';
let editAccountState = null; // { loading, currentEmail }
let editAccountError = '';
let toastMessage = null;
let toastTimer = null;

let settings = { colorTheme:'sapo', font:'classico', wallpaper:'none' };
let pendingSettings = null;
let customizeOpen = false;
let animals = [];

async function saveSettings(){
  try{ await db.collection('usuarios').doc(currentUser.uid).set({ settings }, { merge:true }); }
  catch(e){ console.error('Falha ao salvar preferências', e); }
}
function applySettings(s){
  s = s || settings;
  const theme = COLOR_THEMES.find(t=>t.id===s.colorTheme) || COLOR_THEMES[0];
  const font = FONTS.find(f=>f.id===s.font) || FONTS[0];
  const wallpaper = WALLPAPERS.find(w=>w.id===s.wallpaper) || WALLPAPERS[0];
  const root = document.documentElement.style;
  Object.entries(theme.vars).forEach(([k,v])=> root.setProperty(k, v));
  root.setProperty('--font-display', font.display);
  root.setProperty('--font-body', font.body);
  root.setProperty('--wallpaper-color', wallpaper.color);
  root.setProperty('--wallpaper-image', wallpaper.image);
  root.setProperty('--wallpaper-size', wallpaper.size);
  root.setProperty('--wallpaper-position', wallpaper.position);
}


let selectedId = null;
let activeTab = 'perfil';
let modalState = null; // {entity, mode:'add'|'edit', animalId, recordId}
let confirmState = null; // {message, onConfirm}
let loaded = false;

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function fmtDate(d){
  if(!d) return '—';
  const [y,m,day] = d.split('-');
  return `${day}/${m}/${y}`;
}
function ageFromBirth(d){
  if(!d) return null;
  const birth = new Date(d+'T00:00:00');
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if(now.getDate() < birth.getDate()) months--;
  if(months < 0){ years--; months += 12; }
  if(years < 0) return null;
  if(years === 0) return `${months} m`;
  return months > 0 ? `${years}a ${months}m` : `${years}a`;
}
function formatCurrency(v){
  const n = parseFloat(v);
  if(isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
}

function daysUntil(d){
  if(!d) return null;
  const target = new Date(d+'T00:00:00');
  const now = new Date(todayStr()+'T00:00:00');
  return Math.round((target-now)/86400000);
}

async function loadUserData(){
  try{
    const doc = await db.collection('usuarios').doc(currentUser.uid).get();
    const data = doc.exists ? doc.data() : {};
    const ownAnimals = data.animals || [];
    if(data.settings) settings = { ...settings, ...data.settings };

    // Garante que exista um jeito de outras pessoas te encontrarem pelo e-mail
    // (contas criadas antes desse recurso existir também são preenchidas aqui).
    if(currentUser.email){
      db.collection('email_lookup').doc(currentUser.email.toLowerCase()).set({ uid: currentUser.uid }).catch(()=>{});
    }

    // Busca animais que outras pessoas compartilharam comigo
    let sharedWithMe = [];
    try{
      const sharedSnap = await db.collection('compartilhados').where('sharedWithUid','==',currentUser.uid).get();
      sharedSnap.forEach(docSnap=>{
        sharedWithMe.push({ ...docSnap.data(), id: docSnap.data().id, shareId: docSnap.id, isShared: true });
      });
    }catch(e){ /* sem permissão ou coleção vazia — ignora */ }

    animals = [...ownAnimals, ...sharedWithMe];
  }catch(e){
    animals = [];
  }
  applySettings();
  loaded = true;
  render();
}
async function saveData(){
  try{
    const ownAnimals = animals.filter(a => !a.isShared);
    await db.collection('usuarios').doc(currentUser.uid).set({ animals: ownAnimals }, { merge:true });
    // Sou dono: mantenho a cópia compartilhada em sincronia com o que salvei
    const sharedByMe = ownAnimals.filter(a => a.sharedWithUid);
    await Promise.all(sharedByMe.map(a => syncSharedCopy(a)));
    // Recebi compartilhado: minhas edições vão direto pro documento compartilhado
    const sharedWithMeEdited = animals.filter(a => a.isShared);
    await Promise.all(sharedWithMeEdited.map(a => updateSharedAsRecipient(a)));
  }catch(e){
    console.error('Falha ao salvar dados', e);
  }
}

async function lookupUidByEmail(email){
  try{
    const doc = await db.collection('email_lookup').doc(email.toLowerCase()).get();
    return doc.exists ? doc.data().uid : null;
  }catch(e){
    return null;
  }
}
async function syncSharedCopy(animal){
  if(!animal.sharedWithUid) return;
  const shareId = `${currentUser.uid}_${animal.id}`;
  try{
    await db.collection('compartilhados').doc(shareId).set({
      ...animal,
      ownerUid: currentUser.uid,
      ownerEmail: currentUser.email || '',
      sharedWithUid: animal.sharedWithUid,
      updatedAt: Date.now(),
    });
  }catch(e){ console.error('Falha ao sincronizar compartilhamento', e); }
}
async function updateSharedAsRecipient(animal){
  if(!animal.shareId) return;
  const { isShared, shareId, ...clean } = animal;
  try{
    await db.collection('compartilhados').doc(shareId).set({
      ...clean,
      updatedAt: Date.now(),
    });
  }catch(e){ console.error('Falha ao salvar edição no prontuário compartilhado', e); }
}
async function shareAnimal(animalId, email){
  const targetUid = await lookupUidByEmail(email);
  if(!targetUid){
    return { ok:false, error:'E-mail não encontrado. A pessoa precisa ter uma conta e já ter feito login pelo menos uma vez no app.' };
  }
  if(targetUid === currentUser.uid){
    return { ok:false, error:'Você não pode compartilhar consigo mesmo(a).' };
  }
  const animal = getAnimal(animalId);
  animal.sharedWithUid = targetUid;
  animal.sharedWithEmail = email;
  await syncSharedCopy(animal);
  saveData();
  return { ok:true };
}
async function unshareAnimal(animalId){
  const animal = getAnimal(animalId);
  if(!animal) return;
  const shareId = `${currentUser.uid}_${animal.id}`;
  try{ await db.collection('compartilhados').doc(shareId).delete(); }catch(e){ /* ignora */ }
  delete animal.sharedWithUid;
  delete animal.sharedWithEmail;
  saveData();
}

function openEditAccount(){
  editAccountState = { loading: false, currentEmail: currentUser.email || '' };
  editAccountError = '';
  render();
}

async function saveEditAccount(){
  const newEmailRaw = document.getElementById('edit-account-email').value.trim();
  const currentPassword = document.getElementById('edit-account-password').value;
  if(!newEmailRaw){
    editAccountError = 'Informe um e-mail.'; render(); return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmailRaw)){
    editAccountError = 'E-mail inválido.'; render(); return;
  }
  if(!currentPassword){
    editAccountError = 'Informe sua senha atual para confirmar.'; render(); return;
  }
  editAccountError = '';
  const saveBtn = document.querySelector('[data-action="save-edit-account"]');
  if(saveBtn){ saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }
  try{
    const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPassword);
    await currentUser.reauthenticateWithCredential(cred);

    if(newEmailRaw !== currentUser.email){
      await currentUser.verifyBeforeUpdateEmail(newEmailRaw);
      await db.collection('email_lookup').doc(newEmailRaw.toLowerCase()).set({ uid: currentUser.uid });
    }

    toastMessage = `Enviamos um link de confirmação para ${newEmailRaw}. Confirme por lá para concluir — pode levar alguns minutos até funcionar no login.`;
    editAccountState = null;
    render();
  }catch(e){
    const map = {
      'auth/wrong-password':'Senha atual incorreta.',
      'auth/invalid-credential':'Senha atual incorreta.',
      'auth/email-already-in-use':'Este e-mail já está em uso por outra conta.',
      'auth/invalid-email':'E-mail inválido.',
      'auth/requires-recent-login':'Por segurança, saia e entre novamente antes de editar o cadastro.',
      'auth/too-many-requests':'Muitas tentativas. Aguarde um momento e tente novamente.',
      'auth/operation-not-allowed':'Este tipo de alteração não está habilitado no momento.',
    };
    editAccountError = map[e.code] || `Ocorreu um erro (${e.code || 'desconhecido'}). Tente novamente.`;
    if(saveBtn){ saveBtn.disabled = false; saveBtn.textContent = 'Salvar'; }
    render();
  }
}

function getAnimal(id){ return animals.find(a=>a.id===id); }

function vaccineStatus(v){
  if(!v.nextDue) return null;
  const d = daysUntil(v.nextDue);
  if(d < 0) return 'overdue';
  if(d <= 30) return 'soon';
  return null;
}
function medicationActive(m){
  if(!m.endDate) return true;
  return daysUntil(m.endDate) >= 0;
}
function animalHasAlert(a){
  return (a.vaccines||[]).some(v => vaccineStatus(v) === 'overdue');
}

/* ---------------- Render ---------------- */
function render(){
  document.querySelectorAll('.overlay, .toast').forEach(el => el.remove());
  const app = document.getElementById('app');
  if(!currentUser){
    app.innerHTML = renderLoginScreen();
    attachLoginEvents();
    return;
  }
  if(!loaded){
    app.innerHTML = `<div style="padding:60px;color:var(--ink-soft);font-family:var(--font-body);">Carregando seus dados...</div>`;
    return;
  }
  app.innerHTML = renderSidebar() + renderDetail();
  if(modalState) renderModal();
  if(confirmState) renderConfirm();
  if(customizeOpen) renderCustomizeModal();
  if(copyState) renderCopyModal();
  if(shareState) renderShareModal();
  if(editAccountState) renderEditAccountModal();
  if(toastMessage) renderToast();
  attachEvents();
}


function renderLoginScreen(){
  const titles = { login:'Entrar', signup:'Criar conta', changepw:'Alterar senha', forgotpw:'Recuperar senha' };
  const subs = {
    login:'Acesse seus animais cadastrados.',
    signup:'Crie uma conta para começar a cadastrar seus animais.',
    changepw:'Confirme sua senha atual e escolha uma nova.',
    forgotpw:'Enviaremos um link de redefinição para o seu e-mail.',
  };
  return `
  <div class="login-screen">
    <div class="login-card">
      <img src="icon-192.png" alt="" class="login-icon">
      <p class="eyebrow">Prontuário Pet</p>
      <h1>${titles[authMode]}</h1>
      <p class="sub">${subs[authMode]}</p>
      ${authError ? `<div class="login-error">${escapeHtml(authError)}</div>` : ''}
      ${authInfo ? `<div class="login-info">${escapeHtml(authInfo)}</div>` : ''}
      <div class="field">
        <label>E-mail</label>
        <input type="email" id="auth-email" placeholder="seu@email.com" autocomplete="email">
      </div>
      ${authMode==='forgotpw' ? `
        <button class="btn-primary" style="width:100%;" data-action="forgot-password-submit">Enviar link de redefinição</button>
        <button class="btn-secondary" style="width:100%;margin-top:8px;" data-action="auth-toggle-forgotpw">Voltar para o login</button>
      ` : authMode==='changepw' ? `
        <div class="field">
          <label>Senha atual</label>
          <input type="password" id="auth-current-password" placeholder="Sua senha atual" autocomplete="current-password">
        </div>
        <div class="field">
          <label>Nova senha</label>
          <input type="password" id="auth-new-password" placeholder="Mínimo 6 caracteres" autocomplete="new-password">
        </div>
        <div class="field">
          <label>Confirmar nova senha</label>
          <input type="password" id="auth-new-password-confirm" placeholder="Repita a nova senha" autocomplete="new-password">
        </div>
        <button class="btn-primary" style="width:100%;" data-action="change-password-submit">Alterar senha</button>
        <button class="btn-secondary" style="width:100%;margin-top:8px;" data-action="auth-toggle-changepw">Voltar para o login</button>
      ` : `
        <div class="field">
          <label>Senha</label>
          <input type="password" id="auth-password" placeholder="Mínimo 6 caracteres" autocomplete="${authMode==='login'?'current-password':'new-password'}">
        </div>
        <button class="btn-primary" style="width:100%;" data-action="auth-submit">${authMode==='login'?'Entrar':'Criar conta'}</button>
        <button class="btn-secondary" style="width:100%;margin-top:8px;" data-action="auth-toggle">${authMode==='login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}</button>
        ${authMode==='login' ? `
          <div class="login-links-row">
            <button class="link-btn" data-action="auth-toggle-forgotpw">Esqueci a senha</button>
            <span class="divider-dot">•</span>
            <button class="link-btn" data-action="auth-toggle-changepw">Alterar senha</button>
          </div>
        ` : ''}
      `}
    </div>
  </div>`;
}

function attachLoginEvents(){
  const submitBtn = document.querySelector('[data-action="auth-submit"]');
  if(submitBtn) submitBtn.addEventListener('click', handleAuthSubmit);
  const toggleBtn = document.querySelector('[data-action="auth-toggle"]');
  if(toggleBtn) toggleBtn.addEventListener('click', ()=>{ authMode = authMode==='login' ? 'signup' : 'login'; authError=''; authInfo=''; render(); });
  const toggleChangePwBtn = document.querySelector('[data-action="auth-toggle-changepw"]');
  if(toggleChangePwBtn) toggleChangePwBtn.addEventListener('click', ()=>{ authMode = authMode==='changepw' ? 'login' : 'changepw'; authError=''; authInfo=''; render(); });
  const toggleForgotPwBtn = document.querySelector('[data-action="auth-toggle-forgotpw"]');
  if(toggleForgotPwBtn) toggleForgotPwBtn.addEventListener('click', ()=>{ authMode = authMode==='forgotpw' ? 'login' : 'forgotpw'; authError=''; authInfo=''; render(); });
  const changePwSubmitBtn = document.querySelector('[data-action="change-password-submit"]');
  if(changePwSubmitBtn) changePwSubmitBtn.addEventListener('click', handleChangePassword);
  const forgotPwSubmitBtn = document.querySelector('[data-action="forgot-password-submit"]');
  if(forgotPwSubmitBtn) forgotPwSubmitBtn.addEventListener('click', handleForgotPassword);
  const emailEl = document.getElementById('auth-email');
  ['auth-email','auth-password','auth-current-password','auth-new-password','auth-new-password-confirm'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('keydown', e=>{
      if(e.key!=='Enter') return;
      if(authMode==='changepw') handleChangePassword();
      else if(authMode==='forgotpw') handleForgotPassword();
      else handleAuthSubmit();
    });
  });
  if(emailEl) emailEl.focus();
}

async function handleAuthSubmit(){
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if(!email || !password){ authError = 'Preencha e-mail e senha.'; render(); return; }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ authError = 'E-mail inválido.'; render(); return; }
  if(password.length < 6){ authError = 'A senha deve ter pelo menos 6 caracteres.'; render(); return; }
  authError = '';
  try{
    if(authMode==='login'){
      await auth.signInWithEmailAndPassword(email, password);
    }else{
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      db.collection('email_lookup').doc(email.toLowerCase()).set({ uid: cred.user.uid }).catch(()=>{});
    }
  }catch(e){
    authError = translateAuthError(e.code);
    render();
  }
}

async function handleForgotPassword(){
  const email = document.getElementById('auth-email').value.trim();
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ authError = 'E-mail inválido.'; authInfo=''; render(); return; }
  authError = '';
  try{
    await auth.sendPasswordResetEmail(email);
    authInfo = `Enviamos um link de redefinição para ${email}.`;
    render();
  }catch(e){
    authError = translateAuthError(e.code);
    render();
  }
}

async function handleChangePassword(){
  const email = document.getElementById('auth-email').value.trim();
  const currentPassword = document.getElementById('auth-current-password').value;
  const newPassword = document.getElementById('auth-new-password').value;
  const newPasswordConfirm = document.getElementById('auth-new-password-confirm').value;
  if(!email || !currentPassword || !newPassword || !newPasswordConfirm){
    authError = 'Preencha todos os campos.'; render(); return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ authError = 'E-mail inválido.'; render(); return; }
  if(newPassword.length < 6){ authError = 'A nova senha deve ter pelo menos 6 caracteres.'; render(); return; }
  if(newPassword !== newPasswordConfirm){ authError = 'As senhas novas não coincidem.'; render(); return; }
  if(newPassword === currentPassword){ authError = 'A nova senha deve ser diferente da atual.'; render(); return; }
  authError = '';
  try{
    const cred = await auth.signInWithEmailAndPassword(email, currentPassword);
    await cred.user.updatePassword(newPassword);
    toastMessage = 'Senha alterada com sucesso.';
    authMode = 'login';
    // onAuthStateChanged já loga a pessoa automaticamente após o signIn acima.
  }catch(e){
    authError = translateAuthError(e.code);
    render();
  }
}

function translateAuthError(code){
  const map = {
    'auth/invalid-email':'E-mail inválido.',
    'auth/user-not-found':'E-mail não encontrado.',
    'auth/wrong-password':'Senha incorreta.',
    'auth/email-already-in-use':'Este e-mail já está cadastrado.',
    'auth/weak-password':'A senha deve ter pelo menos 6 caracteres.',
    'auth/invalid-credential':'E-mail ou senha incorretos.',
    'auth/too-many-requests':'Muitas tentativas. Aguarde um momento e tente novamente.',
    'auth/requires-recent-login':'Por segurança, faça login novamente antes de alterar a senha.',
  };
  return map[code] || 'Ocorreu um erro. Tente novamente.';
}

function handleLogout(){
  auth.signOut();
}

function renderSidebar(){
  const selected = getAnimal(selectedId);
  const cardHtml = (a) => `
      <div class="animal-card ${a.id===selectedId?'active':''}" data-select="${a.id}" tabindex="0" role="button">
        <div class="icon">${a.photo ? `<img src="${a.photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : (SPECIES_ICON[a.species]||'🐾')}</div>
        <div class="meta">
          <div class="name">${escapeHtml(a.name)}</div>
          <div class="species">${escapeHtml(a.species)}${a.breed? ' · '+escapeHtml(a.breed):''}</div>
        </div>
        ${animalHasAlert(a) ? '<div class="alert-dot" title="Vacina atrasada"></div>' : ''}
      </div>`;

  const pickerList = animals.length
    ? animals.map(cardHtml).join('')
    : `<div class="empty-sidebar">Nenhum animal cadastrado ainda. Clique em "Novo animal" para começar.</div>`;

  const pickerLabel = selected
    ? `<div class="icon" style="width:26px;height:26px;font-size:14px;">${selected.photo ? `<img src="${selected.photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">` : (SPECIES_ICON[selected.species]||'🐾')}</div><span>${escapeHtml(selected.name)}</span>`
    : `<span>🐾 Selecionar animal</span>`;

  return `
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-top">
        <div>
          <p class="eyebrow">Prontuário Pet</p>
          <h1>Meus animais</h1>
          <p class="sub">${animals.length} cadastrado${animals.length!==1?'s':''}</p>
        </div>
        <button class="icon-btn brand-menu-btn" data-action="toggle-user-menu" title="Menu da conta">⋮</button>
      </div>
      ${userMenuOpen ? `
        <div class="user-menu-backdrop" data-action="close-user-menu"></div>
        <div class="user-menu">
          <span class="user-email" title="${escapeAttr(currentUser.email||'')}">${escapeHtml(currentUser.email || 'Minha conta')}</span>
          <button class="menu-item" data-action="open-edit-account">✎ Editar cadastro</button>
          <button class="menu-item" data-action="open-customize">🎨 Personalizar</button>
          <button class="logout-link" data-action="logout">Sair</button>
        </div>
      ` : ''}
    </div>
    <div class="sidebar-actions">
      <button class="btn-new" data-action="new-animal">+ Novo animal</button>
    </div>
    <div class="animal-picker-wrap">
      <button class="animal-picker-btn" data-action="toggle-animal-picker">
        ${pickerLabel}
        <span class="chevron">${animalPickerOpen ? '▴' : '▾'}</span>
      </button>
      ${animalPickerOpen ? `
        <div class="user-menu-backdrop" data-action="close-animal-picker"></div>
        <div class="animal-picker-panel">${pickerList}</div>
      ` : ''}
    </div>
  </aside>`;
}

function renderDetail(){
  const a = getAnimal(selectedId);
  if(!a){
    return `
    <main class="detail">
      <div class="empty-state">
        <div class="paw">🐾</div>
        <h2>Selecione ou cadastre um animal</h2>
        <p>Escolha um animal na lista ao lado, ou clique em "Novo animal" para criar um prontuário — com dados básicos, vacinas, medicações e histórico de saúde.</p>
      </div>
    </main>`;
  }

  const vaccines = a.vaccines||[];
  const meds = a.medications||[];
  const history = (a.healthRecords||[]).slice().sort((x,y)=> y.date.localeCompare(x.date));

  const overdueCount = vaccines.filter(v=>vaccineStatus(v)==='overdue').length;
  const soonCount = vaccines.filter(v=>vaccineStatus(v)==='soon').length;
  const activeMedsCount = meds.filter(medicationActive).length;

  return `
  <main class="detail">
    <div class="profile-header">
      <div class="profile-icon">${a.photo ? `<img src="${a.photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">` : (SPECIES_ICON[a.species]||'🐾')}</div>
      <div style="flex:1;min-width:0;">
        <div class="profile-title-row">
          <h2>${escapeHtml(a.name)}</h2>
          ${overdueCount ? `<span class="badge overdue">${overdueCount} vacina(s) atrasada(s)</span>` : ''}
          ${!overdueCount && soonCount ? `<span class="badge soon">${soonCount} vacina(s) em breve</span>` : ''}
          ${activeMedsCount ? `<span class="badge active">${activeMedsCount} medicação(ões) em uso</span>` : ''}
        </div>
        <div class="profile-stats">
          <span class="stat">${escapeHtml(a.species)}${a.breed?' · '+escapeHtml(a.breed):''}</span>
          ${a.birthDate ? `<span class="stat">Idade: <b>${ageFromBirth(a.birthDate)}</b> <span style="opacity:.7">(nasc. ${fmtDate(a.birthDate)})</span></span>` : ''}
          ${a.sex ? `<span class="stat">${a.sex}${a.castrado? ' · castrado(a)':''}</span>` : (a.castrado? `<span class="stat">Castrado(a)</span>`:'')}
          ${a.weight ? `<span class="stat">Peso: <b>${a.weight} kg</b></span>` : ''}
          ${a.color ? `<span class="stat">${escapeHtml(a.color)}</span>` : ''}
          ${a.microchip ? `<span class="stat">Chip: <b>${escapeHtml(a.microchip)}</b></span>` : ''}
        </div>
        ${a.notes ? `<div class="profile-notes">${escapeHtml(a.notes)}</div>` : ''}
      </div>
      <div class="profile-actions">
        <button class="icon-btn" data-action="edit-animal" title="Editar animal">✎</button>
        ${!a.isShared ? `<button class="icon-btn" data-action="open-share" title="Compartilhar com outro usuário">🔗</button>` : ''}
        ${!a.isShared ? `<button class="icon-btn" data-action="delete-animal" title="Excluir animal">🗑</button>` : ''}
      </div>
    </div>
    ${a.isShared ? `<div class="shared-banner">🔗 Compartilhado por <strong>${escapeHtml(a.ownerEmail||'outro usuário')}</strong> · vocês dois podem editar</div>` : ''}
    ${!a.isShared && a.sharedWithUid ? `<div class="shared-banner shared-banner-owner">🔗 Compartilhado com <strong>${escapeHtml(a.sharedWithEmail||'')}</strong> · ela(e) também pode editar</div>` : ''}

    <div class="tabs">
      <button class="tab ${activeTab==='perfil'?'active':''}" data-tab="perfil">Perfil</button>
      <button class="tab ${activeTab==='vacinas'?'active':''}" data-tab="vacinas">Vacinas <span class="count">${vaccines.length}</span></button>
      <button class="tab ${activeTab==='medicacoes'?'active':''}" data-tab="medicacoes">Medicações <span class="count">${meds.length}</span></button>
      <button class="tab ${activeTab==='historico'?'active':''}" data-tab="historico">Histórico <span class="count">${history.length}</span></button>
    </div>

    ${activeTab==='perfil' ? renderPerfilTab(a) : ''}
    ${activeTab==='vacinas' ? renderVaccinesTab(a, vaccines) : ''}
    ${activeTab==='medicacoes' ? renderMedsTab(a, meds) : ''}
    ${activeTab==='historico' ? renderHistoryTab(a, history) : ''}
  </main>`;
}

function renderPerfilTab(a){
  const rows = [
    ['Espécie', a.species],
    ['Raça', a.breed || '—'],
    ['Data de nascimento', a.birthDate ? fmtDate(a.birthDate) : '—'],
    ['Sexo', a.sex || '—'],
    ['Peso', a.weight ? a.weight+' kg' : '—'],
    ['Castrado(a)', a.castrado ? 'Sim' : 'Não'],
    ['Cor / pelagem', a.color || '—'],
    ['Microchip', a.microchip || '—'],
  ];
  return `
  <div class="section-head"><h3>Dados cadastrais</h3></div>
  <div class="rec-card" style="display:block;">
    ${rows.map(([label,val])=>`
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--line);font-size:13.5px;">
        <span style="color:var(--ink-soft);">${label}</span>
        <span class="mono" style="font-weight:500;">${escapeHtml(String(val))}</span>
      </div>
    `).join('')}
  </div>`;
}

function renderVaccinesTab(a, vaccines){
  const sorted = vaccines.slice().sort((x,y)=> (y.dateApplied||'').localeCompare(x.dateApplied||''));
  const total = vaccines.reduce((sum,v)=> sum + (parseFloat(v.price)||0), 0);
  const readOnly = false; // compartilhamento agora permite edição por ambos
  return `
  <div class="section-head">
    <h3>Vacinas ${total>0 ? `<span class="mono" style="font-size:12.5px;font-weight:500;color:var(--ink-soft);">· total gasto: ${formatCurrency(total)}</span>` : ''}</h3>
    <div style="display:flex;gap:8px;">
      ${!readOnly && animals.length>1 && vaccines.length ? `<button class="btn-add" data-action="open-copy" data-entity="vaccine" title="Copiar registros para outro animal">📋 Copiar</button>` : ''}
      ${!readOnly ? `<button class="btn-add" data-action="add-record" data-entity="vaccine">+ Registrar vacina</button>` : ''}
    </div>
  </div>
  ${sorted.length ? sorted.map(v=>{
    const status = vaccineStatus(v);
    const badge = status==='overdue' ? '<span class="badge overdue">Atrasada</span>' : status==='soon' ? '<span class="badge soon">Em breve</span>' : '';
    return `
    <div class="rec-card">
      <div class="rec-main">
        <div class="rec-title-row"><span class="rec-title">${escapeHtml(v.name)}</span>${badge}</div>
        <div class="rec-line">Aplicada em <span class="mono">${fmtDate(v.dateApplied)}</span>${v.nextDue? ` · Próxima dose: <span class="mono">${fmtDate(v.nextDue)}</span>` : ''}</div>
        ${v.lot ? `<div class="rec-line">Lote: <span class="mono">${escapeHtml(v.lot)}</span></div>` : ''}
        ${v.price ? `<div class="rec-line">Valor: <span class="mono">${formatCurrency(v.price)}</span></div>` : ''}
        ${v.vet ? `<div class="rec-line">${escapeHtml(v.vet)}</div>` : ''}
        ${v.notes ? `<div class="rec-notes">${escapeHtml(v.notes)}</div>` : ''}
      </div>
      ${!readOnly ? `
      <div class="rec-actions">
        <button class="icon-btn" data-action="edit-record" data-entity="vaccine" data-id="${v.id}" title="Editar">✎</button>
        <button class="icon-btn" data-action="delete-record" data-entity="vaccine" data-id="${v.id}" title="Excluir">🗑</button>
      </div>` : ''}
    </div>`;
  }).join('') : `<div class="empty-tab">Nenhuma vacina registrada ainda.</div>`}`;
}

function renderMedsTab(a, meds){
  const sorted = meds.slice().sort((x,y)=> (y.startDate||'').localeCompare(x.startDate||''));
  const total = meds.reduce((sum,m)=> sum + (parseFloat(m.price)||0), 0);
  const readOnly = false; // compartilhamento agora permite edição por ambos
  return `
  <div class="section-head">
    <h3>Medicações ${total>0 ? `<span class="mono" style="font-size:12.5px;font-weight:500;color:var(--ink-soft);">· total gasto: ${formatCurrency(total)}</span>` : ''}</h3>
    <div style="display:flex;gap:8px;">
      ${!readOnly && animals.length>1 && meds.length ? `<button class="btn-add" data-action="open-copy" data-entity="medication" title="Copiar registros para outro animal">📋 Copiar</button>` : ''}
      ${!readOnly ? `<button class="btn-add" data-action="add-record" data-entity="medication">+ Registrar medicação</button>` : ''}
    </div>
  </div>
  ${sorted.length ? sorted.map(m=>{
    const active = medicationActive(m);
    return `
    <div class="rec-card">
      <div class="rec-main">
        <div class="rec-title-row"><span class="rec-title">${escapeHtml(m.name)}</span>${active? '<span class="badge active">Em uso</span>':''}</div>
        <div class="rec-line">${m.dose? escapeHtml(m.dose)+' · ':''}${m.frequency? escapeHtml(m.frequency):''}</div>
        <div class="rec-line">Início: <span class="mono">${fmtDate(m.startDate)}</span>${m.endDate? ` · Término: <span class="mono">${fmtDate(m.endDate)}</span>` : ''}</div>
        ${m.price ? `<div class="rec-line">Valor: <span class="mono">${formatCurrency(m.price)}</span></div>` : ''}
        ${m.purchaseLocation ? `<div class="rec-line">Local da compra: ${escapeHtml(m.purchaseLocation)}</div>` : ''}
        ${m.notes ? `<div class="rec-notes">${escapeHtml(m.notes)}</div>` : ''}
      </div>
      ${!readOnly ? `
      <div class="rec-actions">
        <button class="icon-btn" data-action="edit-record" data-entity="medication" data-id="${m.id}" title="Editar">✎</button>
        <button class="icon-btn" data-action="delete-record" data-entity="medication" data-id="${m.id}" title="Excluir">🗑</button>
      </div>` : ''}
    </div>`;
  }).join('') : `<div class="empty-tab">Nenhuma medicação registrada ainda.</div>`}`;
}

function renderHistoryTab(a, history){
  const readOnly = false; // compartilhamento agora permite edição por ambos
  return `
  <div class="section-head">
    <h3>Histórico de saúde</h3>
    ${!readOnly ? `<button class="btn-add" data-action="add-record" data-entity="healthRecord">+ Novo registro</button>` : ''}
  </div>
  ${history.length ? `<div class="timeline">${history.map(h=>`
    <div class="tl-item">
      <div class="tl-dot"></div>
      <div class="tl-head">
        <span class="tl-date">${fmtDate(h.date)}</span>
        <span class="tl-type">${escapeHtml(h.type)}</span>
      </div>
      <div class="tl-desc">${escapeHtml(h.description)}</div>
      <div class="tl-foot">${h.weight? 'Peso: '+h.weight+' kg':''}${h.weight && h.vet? ' · ':''}${h.vet? escapeHtml(h.vet):''}</div>
      ${!readOnly ? `
      <div class="tl-actions">
        <button class="icon-btn" data-action="edit-record" data-entity="healthRecord" data-id="${h.id}" title="Editar">✎</button>
        <button class="icon-btn" data-action="delete-record" data-entity="healthRecord" data-id="${h.id}" title="Excluir">🗑</button>
      </div>` : ''}
    </div>
  `).join('')}</div>` : `<div class="empty-tab">Nenhum registro de saúde ainda.</div>`}`;
}

/* ---------------- Modal ---------------- */
function renderModal(){
  const { entity, mode, recordId } = modalState;
  const cfg = ENTITY_CONFIG[entity];
  let data = {};
  if(mode==='edit'){
    if(entity==='animal') data = {...getAnimal(selectedId)};
    else{
      const a = getAnimal(selectedId);
      const listKey = entity==='vaccine'?'vaccines':entity==='medication'?'medications':'healthRecords';
      data = {...(a[listKey]||[]).find(r=>r.id===recordId)};
    }
  }
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.id = 'overlay';
  wrap.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>${mode==='edit'?'Editar':'Novo(a)'} ${cfg.title}</h3>
        <button class="modal-close" data-action="close-modal">✕</button>
      </div>
      <div class="modal-body">
        ${renderFieldsGrouped(cfg.fields, data)}
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-action="close-modal">Cancelar</button>
        <button class="btn-primary" data-action="save-modal">Salvar</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
}

function renderFieldsGrouped(fields, data){
  let html = '';
  let i = 0;
  while(i < fields.length){
    const f = fields[i];
    if(f.sectionBefore){
      html += `<div class="field-section-label">${f.sectionBefore}</div>`;
    }
    if(f.row && fields[i+1] && fields[i+1].row === f.row){
      html += `<div class="field-row">${renderField(f, data)}${renderField(fields[i+1], data)}</div>`;
      i += 2;
    }else{
      html += renderField(f, data);
      i += 1;
    }
  }
  return html;
}

function renderField(f, data){
  const val = data[f.key] !== undefined && data[f.key] !== null ? data[f.key] : '';
  const req = f.required ? '<span class="required-mark"> *</span>' : '';
  if(f.type==='select'){
    return `<div class="field"><label>${f.label}${req}</label>
      <select data-field="${f.key}">
        <option value="">Selecione...</option>
        ${f.options.map(o=>`<option value="${escapeAttr(o)}" ${val===o?'selected':''}>${o}</option>`).join('')}
      </select></div>`;
  }
  if(f.type==='textarea'){
    return `<div class="field"><label>${f.label}${req}</label><textarea data-field="${f.key}">${escapeHtml(val)}</textarea></div>`;
  }
  if(f.type==='checkbox'){
    return `<div class="field field-check"><input type="checkbox" id="chk-${f.key}" data-field="${f.key}" ${val?'checked':''}><label for="chk-${f.key}" style="margin:0;">${f.label}</label></div>`;
  }
  if(f.type==='image'){
    return `<div class="field">
      <label>${f.label}</label>
      <div class="photo-upload">
        <div class="photo-preview" id="photo-preview">${val ? `<img src="${val}" alt="">` : '<span class="photo-placeholder">🐾</span>'}</div>
        <div class="photo-actions">
          <label class="btn-secondary photo-btn" for="photo-input">Escolher da Galeria</label>
          <input type="file" id="photo-input" accept="image/*" style="display:none;">
          ${val ? '<button type="button" class="btn-secondary" data-action="remove-photo">Remover foto</button>' : ''}
        </div>
      </div>
      <input type="hidden" data-field="photo" value="${escapeAttr(val)}">
    </div>`;
  }
  return `<div class="field"><label>${f.label}${req}</label><input type="${f.type}" ${f.step?`step="${f.step}"`:''} value="${escapeAttr(val)}" data-field="${f.key}"></div>`;
}

function renderConfirm(){
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.id = 'confirm-overlay';
  wrap.innerHTML = `
    <div class="modal" style="max-width:380px;">
      <div class="modal-body" style="padding-top:22px;">
        <p style="margin:0;font-size:14.5px;line-height:1.5;">${confirmState.message}</p>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-action="cancel-confirm">Cancelar</button>
        <button class="btn-primary btn-danger" data-action="confirm-yes">Excluir</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
}

function renderToast(){
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = toastMessage;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ toastMessage = null; render(); }, 2800);
}

function renderEditAccountModal(){
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.id = 'edit-account-overlay';
  wrap.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>Editar cadastro</h3>
        <button class="modal-close" data-action="close-edit-account">✕</button>
      </div>
      <div class="modal-body">
        ${editAccountState.loading ? `<p style="font-size:13.5px;color:var(--ink-soft);">Carregando...</p>` : `
          ${editAccountError ? `<div class="login-error">${escapeHtml(editAccountError)}</div>` : ''}
          <div class="field">
            <label>E-mail</label>
            <input type="email" id="edit-account-email" value="${escapeAttr(editAccountState.currentEmail||'')}" placeholder="seu@email.com" autocomplete="email">
            <p style="font-size:12px;color:var(--ink-soft);margin:6px 0 0;">Ao trocar, você vai receber um e-mail de confirmação no novo endereço — clique no link recebido para concluir.</p>
          </div>
          <div class="field">
            <label>Senha atual <span style="font-weight:400;color:var(--ink-soft);">(para confirmar a alteração)</span></label>
            <input type="password" id="edit-account-password" placeholder="Sua senha atual" autocomplete="current-password">
          </div>
        `}
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-action="close-edit-account">Cancelar</button>
        ${!editAccountState.loading ? `<button class="btn-primary" data-action="save-edit-account">Salvar</button>` : ''}
      </div>
    </div>`;
  document.body.appendChild(wrap);
}

function renderShareModal(){
  const animal = getAnimal(shareState.animalId);
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.id = 'share-overlay';
  wrap.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>Compartilhar ${escapeHtml(animal.name)}</h3>
        <button class="modal-close" data-action="close-share">✕</button>
      </div>
      <div class="modal-body">
        ${animal.sharedWithUid ? `
          <p style="font-size:13.5px;line-height:1.5;margin:0 0 16px;">
            Este prontuário está compartilhado com
            <strong class="mono">${escapeHtml(animal.sharedWithEmail||'')}</strong> — vocês dois podem editar.
          </p>
          <button class="btn-secondary btn-danger" style="width:100%;" data-action="unshare-animal">Parar de compartilhar</button>
        ` : `
          <p style="font-size:13.5px;color:var(--ink-soft);line-height:1.5;margin:0 0 14px;">
            A pessoa poderá ver e editar este prontuário (perfil, vacinas,
            medicações e histórico). Ela precisa já ter uma conta e já ter
            feito login pelo menos uma vez no app.
          </p>
          ${shareError ? `<div class="login-error">${escapeHtml(shareError)}</div>` : ''}
          <div class="field">
            <label>E-mail da pessoa</label>
            <input type="email" id="share-email" placeholder="pessoa@email.com" autocomplete="off">
          </div>
        `}
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-action="close-share">Fechar</button>
        ${!animal.sharedWithUid ? `<button class="btn-primary" data-action="confirm-share">Compartilhar</button>` : ''}
      </div>
    </div>`;
  document.body.appendChild(wrap);
}

function renderCopyModal(){
  const entityLabel = copyState.entity === 'vaccine' ? 'vacina(s)' : 'medicação(ões)';
  const listKey = copyState.entity === 'vaccine' ? 'vaccines' : 'medications';
  const source = getAnimal(selectedId);
  const records = (source[listKey] || []).slice().sort((x,y)=>
    (copyState.entity==='vaccine' ? (y.dateApplied||'') : (y.startDate||'')).localeCompare(
     copyState.entity==='vaccine' ? (x.dateApplied||'') : (x.startDate||''))
  );
  const otherAnimals = animals.filter(a => a.id !== selectedId);

  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.id = 'copy-overlay';
  wrap.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>Copiar ${entityLabel}</h3>
        <button class="modal-close" data-action="close-copy">✕</button>
      </div>
      <div class="modal-body">
        <div class="field">
          <label>Copiar para</label>
          <select data-field="copy-target">
            <option value="">Selecione o animal de destino...</option>
            ${otherAnimals.map(a => `<option value="${a.id}" ${copyState.targetId===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Selecione os registros</label>
          <div style="border:1px solid var(--line);border-radius:8px;max-height:260px;overflow-y:auto;">
            ${records.map(r => `
              <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line);cursor:pointer;">
                <input type="checkbox" data-action="toggle-copy-record" data-id="${r.id}" ${copyState.selectedIds.has(r.id)?'checked':''} style="margin-top:3px;">
                <span style="font-size:13.5px;">
                  <strong>${escapeHtml(r.name)}</strong><br>
                  <span class="mono" style="font-size:12px;color:var(--ink-soft);">
                    ${copyState.entity==='vaccine' ? fmtDate(r.dateApplied) : fmtDate(r.startDate)}
                  </span>
                </span>
              </label>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-action="close-copy">Cancelar</button>
        <button class="btn-primary" data-action="confirm-copy" ${(copyState.selectedIds.size===0 || !copyState.targetId) ? 'disabled' : ''}>Copiar ${copyState.selectedIds.size || ''}</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
}


function renderCustomizeModal(){
  const s = pendingSettings || settings;
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.id = 'customize-overlay';
  wrap.innerHTML = `
    <div class="modal modal-wide" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>🎨 Personalizar aparência</h3>
        <button class="modal-close" data-action="cancel-customize">✕</button>
      </div>

      <div class="customize-section">
        <h3 style="font-size:14px;margin:0 0 10px;">Cores</h3>
        <div class="customize-grid">
          ${COLOR_THEMES.map(t => `
            <button type="button" class="swatch ${s.colorTheme===t.id?'selected':''}" data-action="set-theme" data-value="${t.id}">
              <div class="preview theme-preview">
                <span style="background:${t.vars['--forest']}"></span>
                <span style="background:${t.vars['--amber']}"></span>
                <span style="background:${t.vars['--paper']}"></span>
              </div>
              ${t.emoji} ${t.name}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="customize-section">
        <h3 style="font-size:14px;margin:0 0 10px;">Fonte</h3>
        <div class="customize-grid">
          ${FONTS.map(f => `
            <button type="button" class="swatch ${s.font===f.id?'selected':''}" data-action="set-font" data-value="${f.id}">
              <div class="preview font-preview" style="font-family:${f.display}">Aa</div>
              ${f.name}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="customize-section">
        <h3 style="font-size:14px;margin:0 0 10px;">Papel de parede</h3>
        <div class="customize-grid">
          ${WALLPAPERS.map(w => `
            <button type="button" class="swatch ${s.wallpaper===w.id?'selected':''}" data-action="set-wallpaper" data-value="${w.id}">
              <div class="preview" style="background-color:${w.color};background-image:${w.image};background-size:${w.size};background-position:${w.position};"></div>
              ${w.name}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="modal-foot" style="justify-content:space-between;">
        <button class="btn-secondary" data-action="reset-customize">Restaurar padrão</button>
        <div style="display:flex;gap:10px;">
          <button class="btn-secondary" data-action="cancel-customize">Cancelar</button>
          <button class="btn-primary" data-action="save-customize">Salvar</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrap);
}


function attachEvents(){
  const logoutBtn = document.querySelector('[data-action="logout"]');
  if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  const toggleUserMenuBtn = document.querySelector('[data-action="toggle-user-menu"]');
  if(toggleUserMenuBtn) toggleUserMenuBtn.addEventListener('click', ()=>{ userMenuOpen = !userMenuOpen; render(); });
  const closeUserMenuBackdrop = document.querySelector('[data-action="close-user-menu"]');
  if(closeUserMenuBackdrop) closeUserMenuBackdrop.addEventListener('click', ()=>{ userMenuOpen = false; render(); });
  document.querySelectorAll('[data-select]').forEach(el=>{
    el.addEventListener('click', ()=>{ selectedId = el.dataset.select; activeTab='perfil'; animalPickerOpen=false; render(); });
    el.addEventListener('keydown', e=>{ if(e.key==='Enter'){ selectedId = el.dataset.select; activeTab='perfil'; animalPickerOpen=false; render(); } });
  });
  const toggleAnimalPickerBtn = document.querySelector('[data-action="toggle-animal-picker"]');
  if(toggleAnimalPickerBtn) toggleAnimalPickerBtn.addEventListener('click', ()=>{ animalPickerOpen = !animalPickerOpen; render(); });
  const closeAnimalPickerBackdrop = document.querySelector('[data-action="close-animal-picker"]');
  if(closeAnimalPickerBackdrop) closeAnimalPickerBackdrop.addEventListener('click', ()=>{ animalPickerOpen = false; render(); });
  const newBtn = document.querySelector('[data-action="new-animal"]');
  if(newBtn) newBtn.addEventListener('click', ()=>{ modalState = {entity:'animal', mode:'add'}; render(); });

  document.querySelectorAll('[data-tab]').forEach(el=>{
    el.addEventListener('click', ()=>{ activeTab = el.dataset.tab; render(); });
  });

  const editAnimalBtn = document.querySelector('[data-action="edit-animal"]');
  if(editAnimalBtn) editAnimalBtn.addEventListener('click', ()=>{ modalState = {entity:'animal', mode:'edit'}; render(); });

  const delAnimalBtn = document.querySelector('[data-action="delete-animal"]');
  if(delAnimalBtn) delAnimalBtn.addEventListener('click', ()=>{
    const a = getAnimal(selectedId);
    confirmState = { message:`Excluir o prontuário de <b>${escapeHtml(a.name)}</b>? Essa ação não pode ser desfeita.`, onConfirm: ()=>{
      animals = animals.filter(x=>x.id!==selectedId);
      selectedId = null;
      saveData();
    }};
    render();
  });

  document.querySelectorAll('[data-action="add-record"]').forEach(el=>{
    el.addEventListener('click', ()=>{ modalState = {entity: el.dataset.entity, mode:'add'}; render(); });
  });

  const openShareBtn = document.querySelector('[data-action="open-share"]');
  if(openShareBtn) openShareBtn.addEventListener('click', ()=>{ shareState = { animalId: selectedId }; shareError = ''; render(); });
  document.querySelectorAll('[data-action="close-share"]').forEach(el=>{
    el.addEventListener('click', ()=>{ shareState = null; shareError = ''; render(); });
  });
  const shareOverlay = document.getElementById('share-overlay');
  if(shareOverlay) shareOverlay.addEventListener('click', (e)=>{ if(e.target===shareOverlay){ shareState=null; shareError=''; render(); } });
  const shareEmailEl = document.getElementById('share-email');
  if(shareEmailEl) shareEmailEl.focus();
  const confirmShareBtn = document.querySelector('[data-action="confirm-share"]');
  if(confirmShareBtn) confirmShareBtn.addEventListener('click', async ()=>{
    const email = document.getElementById('share-email').value.trim();
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ shareError = 'E-mail inválido.'; render(); return; }
    confirmShareBtn.disabled = true;
    confirmShareBtn.textContent = 'Compartilhando...';
    const result = await shareAnimal(shareState.animalId, email);
    if(result.ok){
      toastMessage = 'Prontuário compartilhado com sucesso.';
      shareState = null;
      shareError = '';
    }else{
      shareError = result.error;
    }
    render();
  });
  const unshareBtn = document.querySelector('[data-action="unshare-animal"]');
  if(unshareBtn) unshareBtn.addEventListener('click', ()=>{
    unshareAnimal(shareState.animalId);
    toastMessage = 'Compartilhamento removido.';
    shareState = null;
    render();
  });

  document.querySelectorAll('[data-action="open-copy"]').forEach(el=>{
    el.addEventListener('click', ()=>{ copyState = { entity: el.dataset.entity, selectedIds: new Set(), targetId: '' }; render(); });
  });
  document.querySelectorAll('[data-action="close-copy"]').forEach(el=>{
    el.addEventListener('click', ()=>{ copyState = null; render(); });
  });
  const copyOverlay = document.getElementById('copy-overlay');
  if(copyOverlay) copyOverlay.addEventListener('click', (e)=>{ if(e.target===copyOverlay){ copyState = null; render(); } });
  document.querySelectorAll('[data-action="toggle-copy-record"]').forEach(el=>{
    el.addEventListener('change', ()=>{
      if(el.checked) copyState.selectedIds.add(el.dataset.id);
      else copyState.selectedIds.delete(el.dataset.id);
      render();
    });
  });
  const copyTargetSelect = document.querySelector('[data-field="copy-target"]');
  if(copyTargetSelect) copyTargetSelect.addEventListener('change', (e)=>{ copyState.targetId = e.target.value; render(); });
  const confirmCopyBtn = document.querySelector('[data-action="confirm-copy"]');
  if(confirmCopyBtn) confirmCopyBtn.addEventListener('click', ()=>{
    const listKey = copyState.entity === 'vaccine' ? 'vaccines' : 'medications';
    const source = getAnimal(selectedId);
    const target = getAnimal(copyState.targetId);
    if(!target) return;
    if(!target[listKey]) target[listKey] = [];
    const toCopy = (source[listKey]||[]).filter(r => copyState.selectedIds.has(r.id));
    toCopy.forEach(r => { target[listKey].push({ ...r, id: uid() }); });
    toastMessage = `${toCopy.length} registro(s) copiado(s) para ${target.name}.`;
    copyState = null;
    saveData();
    render();
  });
  document.querySelectorAll('[data-action="edit-record"]').forEach(el=>{
    el.addEventListener('click', ()=>{ modalState = {entity: el.dataset.entity, mode:'edit', recordId: el.dataset.id}; render(); });
  });
  document.querySelectorAll('[data-action="delete-record"]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const entity = el.dataset.entity, id = el.dataset.id;
      confirmState = { message:'Excluir este registro? Essa ação não pode ser desfeita.', onConfirm: ()=>{
        const a = getAnimal(selectedId);
        const listKey = entity==='vaccine'?'vaccines':entity==='medication'?'medications':'healthRecords';
        a[listKey] = (a[listKey]||[]).filter(r=>r.id!==id);
        saveData();
      }};
      render();
    });
  });

  document.querySelectorAll('[data-action="close-modal"]').forEach(el=>{
    el.addEventListener('click', ()=>{ modalState=null; removeOverlay('overlay'); });
  });
  const saveBtn = document.querySelector('[data-action="save-modal"]');
  if(saveBtn) saveBtn.addEventListener('click', saveModal);

  const photoInput = document.getElementById('photo-input');
  if(photoInput) photoInput.addEventListener('change', handlePhotoInput);
  const removePhotoBtn = document.querySelector('[data-action="remove-photo"]');
  if(removePhotoBtn) removePhotoBtn.addEventListener('click', removePhoto);

  const openEditAccountBtn = document.querySelector('[data-action="open-edit-account"]');
  if(openEditAccountBtn) openEditAccountBtn.addEventListener('click', ()=>{ userMenuOpen = false; openEditAccount(); });
  document.querySelectorAll('[data-action="close-edit-account"]').forEach(el=>{
    el.addEventListener('click', ()=>{ editAccountState = null; editAccountError = ''; render(); });
  });
  const editAccountOverlay = document.getElementById('edit-account-overlay');
  if(editAccountOverlay) editAccountOverlay.addEventListener('click', (e)=>{ if(e.target===editAccountOverlay){ editAccountState=null; editAccountError=''; render(); } });
  const saveEditAccountBtn = document.querySelector('[data-action="save-edit-account"]');
  if(saveEditAccountBtn) saveEditAccountBtn.addEventListener('click', saveEditAccount);

  const openCustomizeBtn = document.querySelector('[data-action="open-customize"]');
  if(openCustomizeBtn) openCustomizeBtn.addEventListener('click', ()=>{ pendingSettings = {...settings}; customizeOpen = true; userMenuOpen = false; render(); });
  document.querySelectorAll('[data-action="cancel-customize"]').forEach(el=>{
    el.addEventListener('click', ()=>{ applySettings(settings); customizeOpen = false; pendingSettings = null; render(); });
  });
  const customizeOverlay = document.getElementById('customize-overlay');
  if(customizeOverlay) customizeOverlay.addEventListener('click', (e)=>{ if(e.target===customizeOverlay){ applySettings(settings); customizeOpen=false; pendingSettings=null; render(); } });
  document.querySelectorAll('[data-action="set-theme"]').forEach(el=>{
    el.addEventListener('click', ()=>{ pendingSettings.colorTheme = el.dataset.value; applySettings(pendingSettings); render(); });
  });
  document.querySelectorAll('[data-action="set-font"]').forEach(el=>{
    el.addEventListener('click', ()=>{ pendingSettings.font = el.dataset.value; applySettings(pendingSettings); render(); });
  });
  document.querySelectorAll('[data-action="set-wallpaper"]').forEach(el=>{
    el.addEventListener('click', ()=>{ pendingSettings.wallpaper = el.dataset.value; applySettings(pendingSettings); render(); });
  });
  const resetCustomizeBtn = document.querySelector('[data-action="reset-customize"]');
  if(resetCustomizeBtn) resetCustomizeBtn.addEventListener('click', ()=>{
    pendingSettings = { colorTheme:'sapo', font:'classico', wallpaper:'none' };
    applySettings(pendingSettings); render();
  });
  const saveCustomizeBtn = document.querySelector('[data-action="save-customize"]');
  if(saveCustomizeBtn) saveCustomizeBtn.addEventListener('click', ()=>{
    settings = {...pendingSettings};
    applySettings(settings);
    saveSettings();
    customizeOpen = false;
    pendingSettings = null;
    render();
  });

  const overlay = document.getElementById('overlay');
  if(overlay) overlay.addEventListener('click', (e)=>{ if(e.target===overlay){ modalState=null; removeOverlay('overlay'); } });

  const confirmCancel = document.querySelector('[data-action="cancel-confirm"]');
  if(confirmCancel) confirmCancel.addEventListener('click', ()=>{ confirmState=null; removeOverlay('confirm-overlay'); });
  const confirmYes = document.querySelector('[data-action="confirm-yes"]');
  if(confirmYes) confirmYes.addEventListener('click', ()=>{
    const cb = confirmState.onConfirm;
    confirmState = null;
    cb();
    render();
  });
  const confirmOverlay = document.getElementById('confirm-overlay');
  if(confirmOverlay) confirmOverlay.addEventListener('click', (e)=>{ if(e.target===confirmOverlay){ confirmState=null; removeOverlay('confirm-overlay'); } });
}

function removeOverlay(id){ const el = document.getElementById(id); if(el) el.remove(); }

function resizeImage(file, maxDim, quality){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = ev=>{
      const img = new Image();
      img.onload = ()=>{
        let w = img.width, h = img.height;
        if(w > h){ if(w > maxDim){ h = Math.round(h * maxDim / w); w = maxDim; } }
        else{ if(h > maxDim){ w = Math.round(w * maxDim / h); h = maxDim; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

async function handlePhotoInput(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){
    alert('Selecione um arquivo de imagem.');
    return;
  }
  try{
    const dataUrl = await resizeImage(file, 400, 0.82);
    const hidden = document.querySelector('#overlay [data-field="photo"]');
    hidden.value = dataUrl;
    const preview = document.getElementById('photo-preview');
    preview.innerHTML = `<img src="${dataUrl}" alt="">`;
    if(!document.querySelector('[data-action="remove-photo"]')){
      const actions = document.querySelector('.photo-actions');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-secondary';
      btn.textContent = 'Remover foto';
      btn.setAttribute('data-action', 'remove-photo');
      btn.addEventListener('click', removePhoto);
      actions.appendChild(btn);
    }
  }catch(err){
    alert('Não foi possível carregar essa foto. Tente outro arquivo.');
  }
}

function removePhoto(){
  if(!confirm('Remover esta foto?')) return;
  const hidden = document.querySelector('#overlay [data-field="photo"]');
  hidden.value = '';
  document.getElementById('photo-preview').innerHTML = '<span class="photo-placeholder">🐾</span>';
  const btn = document.querySelector('[data-action="remove-photo"]');
  if(btn) btn.remove();
}

function saveModal(){
  const { entity, mode, recordId } = modalState;
  const cfg = ENTITY_CONFIG[entity];
  const modalEl = document.querySelector('#overlay .modal');
  const values = {};
  let missingRequired = false;
  cfg.fields.forEach(f=>{
    const el = modalEl.querySelector(`[data-field="${f.key}"]`);
    let v;
    if(f.type==='checkbox') v = el.checked;
    else v = el.value.trim();
    if(f.required && f.type!=='checkbox' && !v){ missingRequired = true; el.style.borderColor='var(--rust)'; }
    values[f.key] = v;
  });
  if(missingRequired) return;

  if(entity==='animal'){
    if(mode==='add'){
      animals.push({ id: uid(), vaccines:[], medications:[], healthRecords:[], ...values });
      selectedId = animals[animals.length-1].id;
    }else{
      const a = getAnimal(selectedId);
      Object.assign(a, values);
    }
  }else{
    const a = getAnimal(selectedId);
    const listKey = entity==='vaccine'?'vaccines':entity==='medication'?'medications':'healthRecords';
    if(!a[listKey]) a[listKey] = [];
    if(mode==='add'){
      a[listKey].push({ id: uid(), ...values });
    }else{
      const rec = a[listKey].find(r=>r.id===recordId);
      Object.assign(rec, values);
    }
  }
  modalState = null;
  saveData();
  render();
}

function escapeHtml(str){
  if(str===undefined || str===null) return '';
  return String(str).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}
function escapeAttr(str){ return escapeHtml(str); }

auth.onAuthStateChanged(user=>{
  currentUser = user;
  authError = '';
  if(user){
    loaded = false;
    render();
    loadUserData();
  }else{
    animals = [];
    settings = { colorTheme:'sapo', font:'classico', wallpaper:'none' };
    loaded = false;
    render();
  }
});
