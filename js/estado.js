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
let recordSearch = '';
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
    toastMessage = 'Não foi possível salvar as alterações. Verifique sua conexão e tente novamente.';
    render();
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
