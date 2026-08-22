/* ==========================================================
   Prontuário Pet — lógica da aplicação
   Estado, persistência (window.storage), renderização e eventos
   ========================================================== */

let currentUser = null;
let authMode = 'login'; // 'login' | 'signup'
let authError = '';

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
  root.setProperty('--wallpaper-bg', wallpaper.bg);
}


let selectedId = null;
let activeTab = 'perfil';
let searchTerm = '';
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
    animals = data.animals || [];
    if(data.settings) settings = { ...settings, ...data.settings };
  }catch(e){
    animals = [];
  }
  applySettings();
  loaded = true;
  render();
}
async function saveData(){
  try{
    await db.collection('usuarios').doc(currentUser.uid).set({ animals }, { merge:true });
  }catch(e){
    console.error('Falha ao salvar dados', e);
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
  attachEvents();
}

function formatCPF(value){
  const digits = String(value||'').replace(/\D/g,'').slice(0,11);
  if(digits.length > 9) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  if(digits.length > 6) return digits.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  if(digits.length > 3) return digits.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  return digits;
}
function isValidCPF(cpf){
  cpf = String(cpf||'').replace(/\D/g,'');
  if(cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for(let i=0;i<9;i++) sum += parseInt(cpf[i],10) * (10-i);
  let rev = 11 - (sum % 11);
  if(rev >= 10) rev = 0;
  if(rev !== parseInt(cpf[9],10)) return false;
  sum = 0;
  for(let i=0;i<10;i++) sum += parseInt(cpf[i],10) * (11-i);
  rev = 11 - (sum % 11);
  if(rev >= 10) rev = 0;
  if(rev !== parseInt(cpf[10],10)) return false;
  return true;
}
function cpfToPseudoEmail(cpfDigits){
  return `cpf${cpfDigits}@prontuariopet.app`;
}

function renderLoginScreen(){
  return `
  <div class="login-screen">
    <div class="login-card">
      <p class="eyebrow">Prontuário Pet</p>
      <h1>${authMode==='login' ? 'Entrar' : 'Criar conta'}</h1>
      <p class="sub">${authMode==='login' ? 'Acesse seus animais cadastrados.' : 'Crie uma conta para começar a cadastrar seus animais.'}</p>
      ${authError ? `<div class="login-error">${escapeHtml(authError)}</div>` : ''}
      <div class="field">
        <label>CPF</label>
        <input type="text" id="auth-cpf" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" autocomplete="off">
      </div>
      <div class="field">
        <label>Senha</label>
        <input type="password" id="auth-password" placeholder="Mínimo 6 caracteres" autocomplete="${authMode==='login'?'current-password':'new-password'}">
      </div>
      <button class="btn-primary" style="width:100%;" data-action="auth-submit">${authMode==='login'?'Entrar':'Criar conta'}</button>
      <button class="btn-secondary" style="width:100%;margin-top:8px;" data-action="auth-toggle">${authMode==='login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}</button>
    </div>
  </div>`;
}

function attachLoginEvents(){
  const submitBtn = document.querySelector('[data-action="auth-submit"]');
  if(submitBtn) submitBtn.addEventListener('click', handleAuthSubmit);
  const toggleBtn = document.querySelector('[data-action="auth-toggle"]');
  if(toggleBtn) toggleBtn.addEventListener('click', ()=>{ authMode = authMode==='login' ? 'signup' : 'login'; authError=''; render(); });
  const cpfEl = document.getElementById('auth-cpf');
  if(cpfEl){
    cpfEl.addEventListener('input', e=>{ e.target.value = formatCPF(e.target.value); });
  }
  ['auth-cpf','auth-password'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('keydown', e=>{ if(e.key==='Enter') handleAuthSubmit(); });
  });
  if(cpfEl) cpfEl.focus();
}

async function handleAuthSubmit(){
  const cpfDigits = document.getElementById('auth-cpf').value.replace(/\D/g,'');
  const password = document.getElementById('auth-password').value;
  if(!cpfDigits || !password){ authError = 'Preencha CPF e senha.'; render(); return; }
  if(!isValidCPF(cpfDigits)){ authError = 'CPF inválido.'; render(); return; }
  if(password.length < 6){ authError = 'A senha deve ter pelo menos 6 caracteres.'; render(); return; }
  authError = '';
  const pseudoEmail = cpfToPseudoEmail(cpfDigits);
  try{
    if(authMode==='login'){
      await auth.signInWithEmailAndPassword(pseudoEmail, password);
    }else{
      const cred = await auth.createUserWithEmailAndPassword(pseudoEmail, password);
      await cred.user.updateProfile({ displayName: formatCPF(cpfDigits) });
    }
  }catch(e){
    authError = translateAuthError(e.code);
    render();
  }
}

function translateAuthError(code){
  const map = {
    'auth/invalid-email':'CPF inválido.',
    'auth/user-not-found':'CPF não encontrado.',
    'auth/wrong-password':'Senha incorreta.',
    'auth/email-already-in-use':'Este CPF já está cadastrado.',
    'auth/weak-password':'A senha deve ter pelo menos 6 caracteres.',
    'auth/invalid-credential':'CPF ou senha incorretos.',
    'auth/too-many-requests':'Muitas tentativas. Aguarde um momento e tente novamente.',
  };
  return map[code] || 'Ocorreu um erro. Tente novamente.';
}

function handleLogout(){
  auth.signOut();
}

function renderSidebar(){
  const filtered = animals.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const list = filtered.length
    ? filtered.map(a => `
      <div class="animal-card ${a.id===selectedId?'active':''}" data-select="${a.id}" tabindex="0" role="button">
        <div class="icon">${a.photo ? `<img src="${a.photo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : (SPECIES_ICON[a.species]||'🐾')}</div>
        <div class="meta">
          <div class="name">${escapeHtml(a.name)}</div>
          <div class="species">${escapeHtml(a.species)}${a.breed? ' · '+escapeHtml(a.breed):''}</div>
        </div>
        ${animalHasAlert(a) ? '<div class="alert-dot" title="Vacina atrasada"></div>' : ''}
      </div>
    `).join('')
    : `<div class="empty-sidebar">${animals.length? 'Nenhum animal encontrado.' : 'Nenhum animal cadastrado ainda. Clique em "Novo animal" para começar.'}</div>`;

  return `
  <aside class="sidebar">
    <div class="brand">
      <p class="eyebrow">Prontuário Pet</p>
      <h1>Meus animais</h1>
      <p class="sub">${animals.length} cadastrado${animals.length!==1?'s':''}</p>
    </div>
    <div class="sidebar-actions" style="display:flex;gap:8px;">
      <button class="btn-new" style="flex:1;width:auto;" data-action="new-animal">+ Novo animal</button>
      <button class="icon-btn" style="width:auto;padding:0 12px;" data-action="open-customize" title="Personalizar aparência">🎨</button>
    </div>
    <div class="search-box">
      <input type="text" placeholder="Buscar pelo nome..." value="${escapeAttr(searchTerm)}" data-action="search">
    </div>
    <div class="animal-list">${list}</div>
    <div class="user-bar">
      <span class="user-email" title="${escapeAttr(currentUser.displayName||'')}">${escapeHtml(currentUser.displayName || 'Minha conta')}</span>
      <button class="logout-link" data-action="logout">Sair</button>
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
        <button class="icon-btn" data-action="delete-animal" title="Excluir animal">🗑</button>
      </div>
    </div>

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
  return `
  <div class="section-head">
    <h3>Vacinas ${total>0 ? `<span class="mono" style="font-size:12.5px;font-weight:500;color:var(--ink-soft);">· total gasto: ${formatCurrency(total)}</span>` : ''}</h3>
    <button class="btn-add" data-action="add-record" data-entity="vaccine">+ Registrar vacina</button>
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
      <div class="rec-actions">
        <button class="icon-btn" data-action="edit-record" data-entity="vaccine" data-id="${v.id}" title="Editar">✎</button>
        <button class="icon-btn" data-action="delete-record" data-entity="vaccine" data-id="${v.id}" title="Excluir">🗑</button>
      </div>
    </div>`;
  }).join('') : `<div class="empty-tab">Nenhuma vacina registrada ainda.</div>`}`;
}

function renderMedsTab(a, meds){
  const sorted = meds.slice().sort((x,y)=> (y.startDate||'').localeCompare(x.startDate||''));
  const total = meds.reduce((sum,m)=> sum + (parseFloat(m.price)||0), 0);
  return `
  <div class="section-head">
    <h3>Medicações ${total>0 ? `<span class="mono" style="font-size:12.5px;font-weight:500;color:var(--ink-soft);">· total gasto: ${formatCurrency(total)}</span>` : ''}</h3>
    <button class="btn-add" data-action="add-record" data-entity="medication">+ Registrar medicação</button>
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
      <div class="rec-actions">
        <button class="icon-btn" data-action="edit-record" data-entity="medication" data-id="${m.id}" title="Editar">✎</button>
        <button class="icon-btn" data-action="delete-record" data-entity="medication" data-id="${m.id}" title="Excluir">🗑</button>
      </div>
    </div>`;
  }).join('') : `<div class="empty-tab">Nenhuma medicação registrada ainda.</div>`}`;
}

function renderHistoryTab(a, history){
  return `
  <div class="section-head">
    <h3>Histórico de saúde</h3>
    <button class="btn-add" data-action="add-record" data-entity="healthRecord">+ Novo registro</button>
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
      <div class="tl-actions">
        <button class="icon-btn" data-action="edit-record" data-entity="healthRecord" data-id="${h.id}" title="Editar">✎</button>
        <button class="icon-btn" data-action="delete-record" data-entity="healthRecord" data-id="${h.id}" title="Excluir">🗑</button>
      </div>
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
        ${cfg.fields.map(f => renderField(f, data)).join('')}
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-action="close-modal">Cancelar</button>
        <button class="btn-primary" data-action="save-modal">Salvar</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
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
          <label class="btn-secondary photo-btn" for="photo-input">Escolher foto</label>
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
              <div class="preview" style="background:${w.bg}"></div>
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
  document.querySelectorAll('[data-select]').forEach(el=>{
    el.addEventListener('click', ()=>{ selectedId = el.dataset.select; activeTab='perfil'; render(); });
    el.addEventListener('keydown', e=>{ if(e.key==='Enter'){ selectedId = el.dataset.select; activeTab='perfil'; render(); } });
  });
  const searchInput = document.querySelector('[data-action="search"]');
  if(searchInput){
    searchInput.addEventListener('input', e=>{ searchTerm = e.target.value; render(); searchInput.focus(); searchInput.setSelectionRange(searchTerm.length, searchTerm.length); });
  }
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

  const openCustomizeBtn = document.querySelector('[data-action="open-customize"]');
  if(openCustomizeBtn) openCustomizeBtn.addEventListener('click', ()=>{ pendingSettings = {...settings}; customizeOpen = true; render(); });
  const cancelCustomizeBtn = document.querySelector('[data-action="cancel-customize"]');
  if(cancelCustomizeBtn) cancelCustomizeBtn.addEventListener('click', ()=>{ applySettings(settings); customizeOpen = false; pendingSettings = null; render(); });
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
