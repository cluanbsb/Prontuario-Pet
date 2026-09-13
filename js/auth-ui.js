/* ==========================================================
   Prontuário Pet — Autenticação e roteamento de tela
   Tela de login/cadastro, envio do formulário de auth,
   recuperação/troca de senha e logout.
   ========================================================== */

function wirePasswordToggles(){
  document.querySelectorAll('[data-toggle-password]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = document.getElementById(btn.dataset.togglePassword);
      if(!input) return;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.textContent = showing ? '👁' : '🙈';
      btn.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
      btn.setAttribute('title', showing ? 'Mostrar senha' : 'Ocultar senha');
    });
  });
}

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
  const titles = { login:'Entrar', signup:'Criar conta', forgotpw:'Recuperar senha' };
  const subs = {
    login:'Acesse seus animais cadastrados.',
    signup:'Crie uma conta para começar a cadastrar seus animais.',
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
      ` : `
        <div class="field">
          <label>Senha</label>
          <div class="password-field-wrap">
            <input type="password" id="auth-password" placeholder="Mínimo 6 caracteres" autocomplete="${authMode==='login'?'current-password':'new-password'}">
            <button type="button" class="password-toggle" data-toggle-password="auth-password" aria-label="Mostrar senha" title="Mostrar senha">👁</button>
          </div>
        </div>
        <button class="btn-primary" style="width:100%;" data-action="auth-submit">${authMode==='login'?'Entrar':'Criar conta'}</button>
        <button class="btn-secondary" style="width:100%;margin-top:8px;" data-action="auth-toggle">${authMode==='login' ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}</button>
        ${authMode==='login' ? `
          <div class="login-links-row">
            <button class="link-btn" data-action="auth-toggle-forgotpw">Esqueci a senha</button>
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
  const toggleForgotPwBtn = document.querySelector('[data-action="auth-toggle-forgotpw"]');
  if(toggleForgotPwBtn) toggleForgotPwBtn.addEventListener('click', ()=>{ authMode = authMode==='forgotpw' ? 'login' : 'forgotpw'; authError=''; authInfo=''; render(); });
  const forgotPwSubmitBtn = document.querySelector('[data-action="forgot-password-submit"]');
  if(forgotPwSubmitBtn) forgotPwSubmitBtn.addEventListener('click', handleForgotPassword);
  const emailEl = document.getElementById('auth-email');
  ['auth-email','auth-password'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('keydown', e=>{
      if(e.key!=='Enter') return;
      if(authMode==='forgotpw') handleForgotPassword();
      else handleAuthSubmit();
    });
  });
  if(emailEl) emailEl.focus();
  wirePasswordToggles();
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
    'auth/unauthorized-domain':'Este domínio não está autorizado no Firebase para fazer login (comum ao testar fora do site publicado). No site publicado de verdade isso não acontece.',
    'auth/network-request-failed':'Falha de conexão. Verifique sua internet e tente novamente.',
  };
  return map[code] || `Ocorreu um erro (${code || 'desconhecido'}). Tente novamente.`;
}

function handleLogout(){
  auth.signOut();
}

