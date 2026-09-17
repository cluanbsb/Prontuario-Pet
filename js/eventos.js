/* ==========================================================
   Prontuário Pet — Eventos, upload de foto e salvamento
   Ligação dos elementos do DOM às ações, upload de foto para o
   Firebase Storage, salvar/excluir registros e o listener de autenticação.
   ========================================================== */

function attachEvents(){
  wirePasswordToggles();
  const logoutBtn = document.querySelector('[data-action="logout"]');
  if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  const retryLoadBtn = document.querySelector('[data-action="retry-load"]');
  if(retryLoadBtn) retryLoadBtn.addEventListener('click', ()=>{ loaded = false; render(); loadUserData(); });
  const toggleUserMenuBtn = document.querySelector('[data-action="toggle-user-menu"]');
  if(toggleUserMenuBtn) toggleUserMenuBtn.addEventListener('click', ()=>{ userMenuOpen = !userMenuOpen; render(); });
  const closeUserMenuBackdrop = document.querySelector('[data-action="close-user-menu"]');
  if(closeUserMenuBackdrop) closeUserMenuBackdrop.addEventListener('click', ()=>{ userMenuOpen = false; render(); });
  const exportBtn = document.querySelector('[data-action="export-data"]');
  if(exportBtn) exportBtn.addEventListener('click', ()=>{
    try{
      const payload = { exportadoEm: new Date().toISOString(), animais: animals };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prontuario-pet-backup-${todayStr()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toastMessage = 'Backup baixado com sucesso.';
    }catch(e){
      toastMessage = 'Não foi possível gerar o backup.';
    }
    userMenuOpen = false;
    render();
  });
  document.querySelectorAll('[data-select]').forEach(el=>{
    el.addEventListener('click', ()=>{ selectedId = el.dataset.select; activeTab='perfil'; recordSearch=''; searchOpen=false; animalPickerOpen=false; render(); });
    el.addEventListener('keydown', e=>{ if(e.key==='Enter'){ selectedId = el.dataset.select; activeTab='perfil'; recordSearch=''; searchOpen=false; animalPickerOpen=false; render(); } });
  });
  const toggleAnimalPickerBtn = document.querySelector('[data-action="toggle-animal-picker"]');
  if(toggleAnimalPickerBtn) toggleAnimalPickerBtn.addEventListener('click', ()=>{ animalPickerOpen = !animalPickerOpen; render(); });
  const closeAnimalPickerBackdrop = document.querySelector('[data-action="close-animal-picker"]');
  if(closeAnimalPickerBackdrop) closeAnimalPickerBackdrop.addEventListener('click', ()=>{ animalPickerOpen = false; render(); });
  const newBtn = document.querySelector('[data-action="new-animal"]');
  if(newBtn) newBtn.addEventListener('click', ()=>{ modalState = {entity:'animal', mode:'add'}; render(); });

  document.querySelectorAll('[data-tab]').forEach(el=>{
    el.addEventListener('click', ()=>{ activeTab = el.dataset.tab; recordSearch=''; searchOpen=false; render(); });
  });

  const toggleSearchBtn = document.querySelector('[data-action="toggle-search"]');
  if(toggleSearchBtn) toggleSearchBtn.addEventListener('click', ()=>{
    searchOpen = !searchOpen;
    if(!searchOpen) recordSearch = '';
    render();
  });

  const recordSearchEl = document.getElementById('record-search');
  if(recordSearchEl){
    recordSearchEl.addEventListener('input', ()=>{ recordSearch = recordSearchEl.value; render(); });
    if(document.activeElement !== recordSearchEl){
      recordSearchEl.focus();
      recordSearchEl.selectionStart = recordSearchEl.selectionEnd = recordSearchEl.value.length;
    }
  }

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

  const calcBtn = document.querySelector('[data-action="calc-portion"]');
  if(calcBtn) calcBtn.addEventListener('click', ()=>{
    const weight = parseFloat(document.getElementById('calc-weight').value);
    const factor = parseFloat(document.getElementById('calc-stage').value);
    const kcalPerKg = parseFloat(document.getElementById('calc-kcal').value);
    const resultEl = document.getElementById('calc-result');
    if(!weight || weight <= 0){
      resultEl.innerHTML = `<div class="login-error" style="margin-top:12px;">Informe o peso atual.</div>`;
      return;
    }
    if(!kcalPerKg || kcalPerKg <= 0){
      resultEl.innerHTML = `<div class="login-error" style="margin-top:12px;">Informe a energia da ração (kcal/kg).</div>`;
      return;
    }
    const rer = 70 * Math.pow(weight, 0.75);
    const der = rer * factor;
    const kcalPerGram = kcalPerKg / 1000;
    const gramsPerDay = der / kcalPerGram;
    resultEl.innerHTML = `
      <div class="calc-result-box">
        <div class="calc-result-value">${gramsPerDay.toFixed(0)} g/dia</div>
        <div class="calc-result-sub">≈ ${der.toFixed(0)} kcal/dia · divida em 2-3 refeições</div>
      </div>`;
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
    const listKey = getListKey(copyState.entity);
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
        const listKey = getListKey(entity);
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

let photoUploading = false;
let cropState = null; // estado do recorte de foto, fora do ciclo normal de render()

function handlePhotoInput(e){
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if(!file) return;
  if(!file.type.startsWith('image/')){
    alert('Selecione um arquivo de imagem.');
    return;
  }
  openCropModal(file);
}

function openCropModal(file){
  const reader = new FileReader();
  reader.onload = ev=>{
    const img = new Image();
    img.onload = ()=>{
      const viewport = 280;
      const minScale = Math.max(viewport / img.naturalWidth, viewport / img.naturalHeight);
      const scale = minScale;
      const displayedW = img.naturalWidth * scale, displayedH = img.naturalHeight * scale;
      cropState = {
        dataUrl: ev.target.result,
        naturalW: img.naturalWidth, naturalH: img.naturalHeight,
        viewport, minScale, maxScale: minScale * 3, scale,
        left: (viewport - displayedW) / 2, top: (viewport - displayedH) / 2,
      };
      renderCropModal();
    };
    img.onerror = () => alert('Não foi possível ler essa imagem. Tente outro arquivo.');
    img.src = ev.target.result;
  };
  reader.onerror = () => alert('Não foi possível ler o arquivo.');
  reader.readAsDataURL(file);
}

function cancelCropModal(){
  const overlay = document.getElementById('crop-overlay');
  if(overlay) overlay.remove();
  cropState = null;
}

function confirmCropAndUpload(){
  const cs = cropState;
  if(!cs) return;
  const img = new Image();
  img.onload = ()=>{
    const outputSize = 500;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize; canvas.height = outputSize;
    const ctx = canvas.getContext('2d');
    const sx = -cs.left / cs.scale;
    const sy = -cs.top / cs.scale;
    const sSize = cs.viewport / cs.scale;
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);
    canvas.toBlob(blob=>{
      const overlay = document.getElementById('crop-overlay');
      if(overlay) overlay.remove();
      cropState = null;
      if(!blob){ alert('Não foi possível processar a imagem. Tente novamente.'); return; }
      uploadPhotoBlob(blob);
    }, 'image/jpeg', 0.85);
  };
  img.onerror = () => alert('Não foi possível processar a imagem.');
  img.src = cs.dataUrl;
}

function withTimeout(promise, ms, message){
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

async function uploadPhotoBlob(blob){
  const preview = document.getElementById('photo-preview');
  const prevHtml = preview ? preview.innerHTML : '';
  try{
    photoUploading = true;
    if(preview) preview.innerHTML = '<span class="photo-placeholder">⏳</span>';
    const path = `fotos/${currentUser.uid}/${uid()}.jpg`;
    const ref = storage.ref().child(path);
    await withTimeout(ref.put(blob, { contentType: 'image/jpeg' }), 25000, 'Tempo esgotado ao enviar a foto. Verifique sua conexão.');
    const url = await withTimeout(ref.getDownloadURL(), 15000, 'Tempo esgotado ao obter o link da foto.');
    const hidden = document.querySelector('#overlay [data-field="photo"]');
    if(hidden) hidden.value = url;
    if(preview) preview.innerHTML = `<img src="${url}" alt="">`;
    if(!document.querySelector('[data-action="remove-photo"]')){
      const actions = document.querySelector('.photo-actions');
      if(actions){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-secondary';
        btn.textContent = 'Remover foto';
        btn.setAttribute('data-action', 'remove-photo');
        btn.addEventListener('click', removePhoto);
        actions.appendChild(btn);
      }
    }
  }catch(err){
    console.error('Falha ao enviar foto', err);
    if(preview) preview.innerHTML = prevHtml;
    const code = (err && (err.code || err.message)) || 'desconhecido';
    alert(`Não foi possível enviar essa foto (${code}). Verifique sua internet e tente novamente.`);
  }finally{
    photoUploading = false;
  }
}

function wireCropInteractions(){
  const viewport = document.getElementById('crop-viewport');
  const img = document.getElementById('crop-img');
  const zoomSlider = document.getElementById('crop-zoom');
  if(!viewport || !img) return;

  function clampPosition(){
    const displayedW = cropState.naturalW * cropState.scale;
    const displayedH = cropState.naturalH * cropState.scale;
    const minLeft = Math.min(0, cropState.viewport - displayedW);
    const minTop = Math.min(0, cropState.viewport - displayedH);
    cropState.left = Math.max(minLeft, Math.min(0, cropState.left));
    cropState.top = Math.max(minTop, Math.min(0, cropState.top));
  }

  function applyStyle(){
    const displayedW = cropState.naturalW * cropState.scale;
    const displayedH = cropState.naturalH * cropState.scale;
    img.style.width = displayedW + 'px';
    img.style.height = displayedH + 'px';
    img.style.left = cropState.left + 'px';
    img.style.top = cropState.top + 'px';
  }

  let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
  viewport.addEventListener('pointerdown', e=>{
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    startLeft = cropState.left; startTop = cropState.top;
    viewport.style.cursor = 'grabbing';
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', e=>{
    if(!dragging) return;
    cropState.left = startLeft + (e.clientX - startX);
    cropState.top = startTop + (e.clientY - startY);
    clampPosition();
    applyStyle();
  });
  const endDrag = ()=>{ dragging = false; viewport.style.cursor = 'grab'; };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  if(zoomSlider){
    zoomSlider.addEventListener('input', ()=>{
      const newScale = parseFloat(zoomSlider.value);
      const oldScale = cropState.scale;
      const centerNatX = (cropState.viewport / 2 - cropState.left) / oldScale;
      const centerNatY = (cropState.viewport / 2 - cropState.top) / oldScale;
      cropState.scale = newScale;
      cropState.left = cropState.viewport / 2 - centerNatX * newScale;
      cropState.top = cropState.viewport / 2 - centerNatY * newScale;
      clampPosition();
      applyStyle();
    });
  }
}

function renderCropModal(){
  const cs = cropState;
  const displayedW = cs.naturalW * cs.scale;
  const displayedH = cs.naturalH * cs.scale;
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.id = 'crop-overlay';
  wrap.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" style="max-width:340px;">
      <div class="modal-head">
        <h3>Ajustar foto</h3>
        <button class="modal-close" data-action="cancel-crop">✕</button>
      </div>
      <div class="modal-body">
        <div class="crop-viewport" id="crop-viewport">
          <img id="crop-img" src="${cs.dataUrl}" alt="" style="width:${displayedW}px;height:${displayedH}px;left:${cs.left}px;top:${cs.top}px;">
        </div>
        <div class="crop-zoom-row">
          <span aria-hidden="true">🔍</span>
          <input type="range" id="crop-zoom" min="${cs.minScale}" max="${cs.maxScale}" step="0.001" value="${cs.scale}" aria-label="Zoom da foto">
        </div>
        <p style="font-size:12px;color:var(--ink-soft);text-align:center;margin-top:10px;">Arraste para posicionar · use o controle para dar zoom</p>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-action="cancel-crop">Cancelar</button>
        <button class="btn-primary" data-action="confirm-crop">Usar esta foto</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  wireCropInteractions();
  wrap.querySelectorAll('[data-action="cancel-crop"]').forEach(b => b.addEventListener('click', cancelCropModal));
  wrap.querySelector('[data-action="confirm-crop"]').addEventListener('click', confirmCropAndUpload);
}

function removePhoto(){
  if(!confirm('Remover esta foto?')) return;
  const hidden = document.querySelector('#overlay [data-field="photo"]');
  const oldUrl = hidden.value;
  hidden.value = '';
  document.getElementById('photo-preview').innerHTML = '<span class="photo-placeholder">🐾</span>';
  const btn = document.querySelector('[data-action="remove-photo"]');
  if(btn) btn.remove();
  if(oldUrl && oldUrl.includes('firebasestorage')){
    storage.refFromURL(oldUrl).delete().catch(()=>{ /* melhor esforço — ignora falha */ });
  }
}

function saveModal(){
  if(photoUploading){
    toastMessage = 'Aguarde a foto terminar de enviar antes de salvar.';
    render();
    return;
  }
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
      animals.push({ id: uid(), vaccines:[], medications:[], healthRecords:[], weightLog:[], foodPurchases:[], ...values });
      selectedId = animals[animals.length-1].id;
    }else{
      const a = getAnimal(selectedId);
      Object.assign(a, values);
    }
  }else{
    const a = getAnimal(selectedId);
    const listKey = getListKey(entity);
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

