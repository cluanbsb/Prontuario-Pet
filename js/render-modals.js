/* ==========================================================
   Prontuário Pet — Modais e componentes de formulário
   Modal genérico de registro, confirmação, toast, edição de conta,
   compartilhamento, cópia de registros e personalização visual.
   ========================================================== */

function renderModal(){
  const { entity, mode, recordId } = modalState;
  const cfg = ENTITY_CONFIG[entity];
  let data = {};
  if(mode==='edit'){
    if(entity==='animal') data = {...getAnimal(selectedId)};
    else{
      const a = getAnimal(selectedId);
      const listKey = getListKey(entity);
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
          <div class="field-section-label" style="margin-top:18px;">Alterar senha <span style="font-weight:400;color:var(--ink-soft);text-transform:none;letter-spacing:0;">(opcional)</span></div>
          <div class="field">
            <label>Nova senha</label>
            <div class="password-field-wrap">
              <input type="password" id="edit-account-new-password" placeholder="Deixe em branco para manter a atual" autocomplete="new-password">
              <button type="button" class="password-toggle" data-toggle-password="edit-account-new-password" aria-label="Mostrar senha" title="Mostrar senha">👁</button>
            </div>
          </div>
          <div class="field">
            <label>Confirmar nova senha</label>
            <div class="password-field-wrap">
              <input type="password" id="edit-account-new-password-confirm" placeholder="Repita a nova senha" autocomplete="new-password">
              <button type="button" class="password-toggle" data-toggle-password="edit-account-new-password-confirm" aria-label="Mostrar senha" title="Mostrar senha">👁</button>
            </div>
          </div>
          <div class="field-section-label" style="margin-top:18px;">Confirmação</div>
          <div class="field">
            <label>Senha atual <span style="font-weight:400;color:var(--ink-soft);">(obrigatória para confirmar qualquer alteração)</span></label>
            <div class="password-field-wrap">
              <input type="password" id="edit-account-password" placeholder="Sua senha atual" autocomplete="current-password">
              <button type="button" class="password-toggle" data-toggle-password="edit-account-password" aria-label="Mostrar senha" title="Mostrar senha">👁</button>
            </div>
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


