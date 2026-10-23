/* ==========================================================
   Prontuário Pet — Estado global, persistência (Firestore) e utilitários
   Variáveis de estado, configurações, sincronização de dados,
   compartilhamento entre contas e funções auxiliares de data/status.
   ========================================================== */

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

let settings = { colorTheme:'sapo', font:'classico', wallpaper:'none', wallpaperOpacity:1 };
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
  root.setProperty('--wallpaper-opacity', s.wallpaperOpacity != null ? s.wallpaperOpacity : 1);
}


let selectedId = null;
let activeTab = 'perfil';
let recordSearch = '';
let searchOpen = false;
let modalState = null; // {entity, mode:'add'|'edit', animalId, recordId}
let confirmState = null; // {message, onConfirm}
let loaded = false;
let loadError = null;

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
  loadError = null;
  try{
    const doc = await db.collection('usuarios').doc(currentUser.uid).get();
    const data = doc.exists ? doc.data() : {};
    let ownAnimals = data.animals || [];
    if(data.settings) settings = { ...settings, ...data.settings };

    // Garante que exista um jeito de outras pessoas te encontrarem pelo e-mail
    // (contas criadas antes desse recurso existir também são preenchidas aqui).
    if(currentUser.email){
      db.collection('email_lookup').doc(currentUser.email.toLowerCase()).set({ uid: currentUser.uid }).catch(()=>{});
    }

    // Para os meus animais que estão compartilhados, busca a versão mais
    // atual no documento compartilhado — pode ter sido editada por quem recebeu.
    ownAnimals = await Promise.all(ownAnimals.map(async (a) => {
      if(!a.sharedWithUid) return a;
      try{
        const shareId = `${currentUser.uid}_${a.id}`;
        const shareDoc = await db.collection('compartilhados').doc(shareId).get();
        if(shareDoc.exists){
          const { ownerUid, ownerEmail, updatedAt, ...latest } = shareDoc.data();
          return { ...latest, sharedWithUid: a.sharedWithUid, sharedWithEmail: a.sharedWithEmail };
        }
      }catch(e){ /* segue com a versão local se a busca falhar */ }
      return a;
    }));

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
    console.error('Falha ao carregar dados do usuário', e);
    animals = [];
    loadError = (e && e.code) ? `Ops, não conseguimos buscar seus dados agora (${e.code}). Confira sua conexão ou tente sair e entrar de novo 🐾` : 'Ops, não conseguimos buscar seus dados agora. Confira sua conexão ou tente sair e entrar de novo 🐾';
  }
  applySettings();
  loaded = true;
  render();
}
async function saveData(){
  // Nunca grave uma lista incompleta após falha no carregamento do Firestore.
  if(!loaded || loadError){
    toastMessage = 'Aguarde o carregamento dos seus dados. Se houver erro, toque em “Tentar de novo” antes de salvar para evitar substituir informações existentes.';
    render();
    return false;
  }
  try{
    const ownAnimals = animals.filter(a => !a.isShared);
    await db.collection('usuarios').doc(currentUser.uid).set({ animals: ownAnimals }, { merge:true });
    // Sou dono: mantenho a cópia compartilhada em sincronia com o que salvei
    const sharedByMe = ownAnimals.filter(a => a.sharedWithUid);
    await Promise.all(sharedByMe.map(a => syncSharedCopy(a)));
    // Recebi compartilhado: minhas edições vão direto pro documento compartilhado
    const sharedWithMeEdited = animals.filter(a => a.isShared);
    await Promise.all(sharedWithMeEdited.map(a => updateSharedAsRecipient(a)));
    return true;
  }catch(e){
    console.error('Falha ao salvar dados', e);
    toastMessage = 'Ops, não conseguimos salvar agora. Respira fundo, confere a conexão e tenta de novo? 🐾';
    render();
    return false;
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
  if(!loaded || loadError){ toastMessage = 'Aguarde o carregamento dos dados antes de compartilhar um prontuário.'; render(); return { ok:false, error:toastMessage }; }
  const animal = getAnimal(animalId);
  if(!animal) return { ok:false, error:'Não foi possível localizar este prontuário. Atualize a tela e tente novamente.' };
  const targetUid = await lookupUidByEmail(email);
  if(!targetUid){
    return { ok:false, error:'E-mail não encontrado. A pessoa precisa ter uma conta e já ter feito login pelo menos uma vez no app.' };
  }
  if(targetUid === currentUser.uid){
    return { ok:false, error:'Você não pode compartilhar consigo mesmo(a).' };
  }
  if(!loaded || loadError){ toastMessage = 'O carregamento dos dados foi interrompido. Tente novamente antes de compartilhar.'; render(); return { ok:false, error:toastMessage }; }
  animal.sharedWithUid = targetUid;
  animal.sharedWithEmail = email;
  await syncSharedCopy(animal);
  saveData();
  return { ok:true };
}
async function unshareAnimal(animalId){
  if(!loaded || loadError){ toastMessage = 'Aguarde o carregamento dos dados antes de alterar o compartilhamento.'; render(); return { ok:false, error:toastMessage }; }
  const animal = getAnimal(animalId);
  if(!animal) return { ok:false, error:'Não foi possível localizar este prontuário. Atualize a tela e tente novamente.' };
  const shareId = `${currentUser.uid}_${animal.id}`;
  const previousUid = animal.sharedWithUid;
  const previousEmail = animal.sharedWithEmail;
  delete animal.sharedWithUid;
  delete animal.sharedWithEmail;
  const saved = await saveData();
  if(!saved){
    if(previousUid) animal.sharedWithUid = previousUid;
    if(previousEmail) animal.sharedWithEmail = previousEmail;
    return { ok:false, error:toastMessage || 'Não foi possível salvar a alteração.' };
  }
  try{
    await db.collection('compartilhados').doc(shareId).delete();
    return { ok:true };
  }catch(e){
    console.error('Falha ao remover a cópia compartilhada', e);
    toastMessage = 'A alteração foi salva, mas não foi possível remover a cópia compartilhada. Verifique a conexão e tente novamente.';
    render();
    return { ok:false, error:toastMessage };
  }
}

function openEditAccount(){
  editAccountState = { loading: false, currentEmail: currentUser.email || '' };
  editAccountError = '';
  render();
}

async function saveEditAccount(){
  const newEmailRaw = document.getElementById('edit-account-email').value.trim();
  const newPassword = document.getElementById('edit-account-new-password').value;
  const newPasswordConfirm = document.getElementById('edit-account-new-password-confirm').value;
  const currentPassword = document.getElementById('edit-account-password').value;
  if(!newEmailRaw){
    editAccountError = 'Informe um e-mail.'; render(); return;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmailRaw)){
    editAccountError = 'E-mail inválido.'; render(); return;
  }
  const wantsPasswordChange = newPassword || newPasswordConfirm;
  if(wantsPasswordChange){
    if(newPassword.length < 6){ editAccountError = 'A nova senha deve ter pelo menos 6 caracteres.'; render(); return; }
    if(newPassword !== newPasswordConfirm){ editAccountError = 'As senhas novas não coincidem.'; render(); return; }
    if(newPassword === currentPassword){ editAccountError = 'A nova senha deve ser diferente da atual.'; render(); return; }
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

    const emailChanged = newEmailRaw !== currentUser.email;
    if(emailChanged){
      await currentUser.verifyBeforeUpdateEmail(newEmailRaw);
      await db.collection('email_lookup').doc(newEmailRaw.toLowerCase()).set({ uid: currentUser.uid });
    }
    if(wantsPasswordChange){
      await currentUser.updatePassword(newPassword);
    }

    if(emailChanged && wantsPasswordChange){
      toastMessage = `Senha alterada. Enviamos um link de confirmação para ${newEmailRaw} — confirme por lá para concluir a troca de e-mail.`;
    }else if(emailChanged){
      toastMessage = `Enviamos um link de confirmação para ${newEmailRaw}. Confirme por lá para concluir — pode levar alguns minutos até funcionar no login.`;
    }else if(wantsPasswordChange){
      toastMessage = 'Senha alterada com sucesso.';
    }else{
      toastMessage = 'Nenhuma alteração para salvar.';
    }
    editAccountState = null;
    render();
  }catch(e){
    const map = {
      'auth/wrong-password':'Senha atual incorreta.',
      'auth/invalid-credential':'Senha atual incorreta.',
      'auth/email-already-in-use':'Este e-mail já está em uso por outra conta.',
      'auth/invalid-email':'E-mail inválido.',
      'auth/weak-password':'A nova senha deve ter pelo menos 6 caracteres.',
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

/* ---------- Humanização (microcopy) ---------- */
function petFirstName(a){
  const n = ((a && a.name) || '').trim();
  return n ? n.split(/\s+/)[0] : 'seu pet';
}
function greetingByHour(){
  const h = new Date().getHours();
  if(h < 5) return 'Boa madrugada';
  if(h < 12) return 'Bom dia';
  if(h < 18) return 'Boa tarde';
  return 'Boa noite';
}
function birthdayInfo(a){
  if(!a || !a.birthDate) return null;
  const parts = String(a.birthDate).split('-');
  if(parts.length < 3) return null;
  const by = parseInt(parts[0],10), bm = parseInt(parts[1],10), bd = parseInt(parts[2],10);
  const now = new Date();
  if(now.getMonth()+1 !== bm || now.getDate() !== bd) return null;
  const years = now.getFullYear() - by;
  return years >= 0 ? { years } : null;
}
function warmSaveMessage(entity, mode, pet){
  const n = petFirstName(pet);
  const welcome = pet && pet.sex === 'Fêmea' ? 'Bem-vinda' : (pet && pet.sex === 'Macho' ? 'Bem-vindo' : 'Bem-vindo(a)');
  const add = {
    animal: `${n} agora faz parte do seu prontuário! ${welcome} 💛`,
    vaccine: `Vacina de ${n} registrada! Mais um passo de cuidado 🐾`,
    medication: `Pronto! O remedinho de ${n} está anotado ✅`,
    healthRecord: `Registro de saúde de ${n} guardado com carinho 📋`,
    weightEntry: `Peso de ${n} registrado! Acompanhando a evolução 📊`,
    foodPurchase: `Compra de ração de ${n} anotada 🛒`,
  };
  const edit = {
    animal: `Dados de ${n} atualizados! ✨`,
    vaccine: `Vacina de ${n} atualizada ✅`,
    medication: `Medicação de ${n} atualizada ✅`,
    healthRecord: `Registro de saúde de ${n} atualizado ✅`,
    weightEntry: `Peso de ${n} atualizado ✅`,
    foodPurchase: `Compra de ração de ${n} atualizada ✅`,
  };
  const table = mode === 'add' ? add : edit;
  return table[entity] || (mode === 'add' ? `Tudo certo! Registro guardado para ${n} 🐾` : `Registro atualizado para ${n} ✅`);
}

function getListKey(entity){
  const map = { vaccine:'vaccines', medication:'medications', healthRecord:'healthRecords', weightEntry:'weightLog', foodPurchase:'foodPurchases' };
  return map[entity] || 'healthRecords';
}

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
function overdueVaccineAlerts(){
  const alerts = [];
  animals.forEach(a=>{
    (a.vaccines||[]).forEach(v=>{
      if(vaccineStatus(v)==='overdue') alerts.push({ animalId:a.id, animalName:a.name, vaccineName:v.name, nextDue:v.nextDue });
    });
  });
  return alerts;
}

/* ---------------- Render ---------------- */
