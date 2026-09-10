/* ==========================================================
   Prontuário Pet — Renderização principal
   Barra lateral (lista de animais), cabeçalho do animal selecionado
   e as abas Perfil, Vacinas, Medicações, Histórico e Peso & Dieta.
   ========================================================== */

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
        <button class="icon-btn brand-menu-btn" data-action="toggle-user-menu" aria-label="Menu da conta" title="Menu da conta">⋮</button>
      </div>
      ${userMenuOpen ? `
        <div class="user-menu-backdrop" data-action="close-user-menu"></div>
        <div class="user-menu">
          <span class="user-email" title="${escapeAttr(currentUser.email||'')}">${escapeHtml(currentUser.email || 'Minha conta')}</span>
          <button class="menu-item" data-action="open-edit-account">✎ Editar cadastro</button>
          <button class="menu-item" data-action="open-customize">🎨 Personalizar</button>
          <button class="menu-item" data-action="export-data">⬇️ Exportar dados (backup)</button>
          <button class="logout-link" data-action="logout">Sair</button>
        </div>
      ` : ''}
    </div>
    <div class="sidebar-actions">
      <button class="btn-new" data-action="new-animal">+ Novo animal</button>
    </div>
    ${(() => {
      const alerts = overdueVaccineAlerts();
      if(!alerts.length) return '';
      const preview = alerts.slice(0,3).map(al => `${escapeHtml(al.animalName)} — ${escapeHtml(al.vaccineName)}`).join('; ');
      const extra = alerts.length > 3 ? ` e mais ${alerts.length - 3}` : '';
      return `
      <div class="alert-banner" role="alert">
        ⚠️ <strong>${alerts.length} vacina${alerts.length!==1?'s':''} atrasada${alerts.length!==1?'s':''}:</strong> ${preview}${extra}
      </div>`;
    })()}
    <div class="animal-picker-wrap">
      <button class="animal-picker-btn" data-action="toggle-animal-picker" aria-label="Selecionar animal" aria-expanded="${animalPickerOpen}">
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
        <button class="icon-btn" data-action="edit-animal" aria-label="Editar animal" title="Editar animal">✎</button>
        ${!a.isShared ? `<button class="icon-btn" data-action="open-share" aria-label="Compartilhar com outro usuário" title="Compartilhar com outro usuário">🔗</button>` : ''}
        ${!a.isShared ? `<button class="icon-btn" data-action="delete-animal" aria-label="Excluir animal" title="Excluir animal">🗑</button>` : ''}
      </div>
    </div>
    ${a.isShared ? `<div class="shared-banner">🔗 Compartilhado por <strong>${escapeHtml(a.ownerEmail||'outro usuário')}</strong> · vocês dois podem editar</div>` : ''}
    ${!a.isShared && a.sharedWithUid ? `<div class="shared-banner shared-banner-owner">🔗 Compartilhado com <strong>${escapeHtml(a.sharedWithEmail||'')}</strong> · ela(e) também pode editar</div>` : ''}

    <div class="tabs">
      <button class="tab ${activeTab==='perfil'?'active':''}" data-tab="perfil" title="Perfil">
        <span class="tab-icon">🐾</span><span class="tab-label">Perfil</span>
      </button>
      <button class="tab ${activeTab==='vacinas'?'active':''}" data-tab="vacinas" title="Vacinas">
        <span class="tab-icon">💉${vaccines.length ? `<span class="tab-badge">${vaccines.length}</span>` : ''}</span><span class="tab-label">Vacinas</span>
      </button>
      <button class="tab ${activeTab==='medicacoes'?'active':''}" data-tab="medicacoes" title="Medicações">
        <span class="tab-icon">💊${meds.length ? `<span class="tab-badge">${meds.length}</span>` : ''}</span><span class="tab-label">Medicações</span>
      </button>
      <button class="tab ${activeTab==='historico'?'active':''}" data-tab="historico" title="Histórico">
        <span class="tab-icon">📋${history.length ? `<span class="tab-badge">${history.length}</span>` : ''}</span><span class="tab-label">Histórico</span>
      </button>
      <button class="tab ${activeTab==='dieta'?'active':''}" data-tab="dieta" title="Peso &amp; Dieta">
        <span class="tab-icon">📊</span><span class="tab-label">Peso&nbsp;&amp;&nbsp;Dieta</span>
      </button>
    </div>

    ${activeTab==='perfil' ? renderPerfilTab(a) : ''}
    ${activeTab==='vacinas' ? renderVaccinesTab(a, vaccines) : ''}
    ${activeTab==='medicacoes' ? renderMedsTab(a, meds) : ''}
    ${activeTab==='historico' ? renderHistoryTab(a, history) : ''}
    ${activeTab==='dieta' ? renderDietTab(a) : ''}
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
  const q = recordSearch.trim().toLowerCase();
  const filtered = q ? vaccines.filter(v => `${v.name||''} ${v.vet||''} ${v.lot||''} ${v.notes||''}`.toLowerCase().includes(q)) : vaccines;
  const sorted = filtered.slice().sort((x,y)=> (y.dateApplied||'').localeCompare(x.dateApplied||''));
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
  ${vaccines.length > 3 ? `<input type="text" id="record-search" class="search-input" placeholder="Buscar por nome, lote, veterinário..." value="${escapeAttr(recordSearch)}">` : ''}
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
        <button class="icon-btn" data-action="edit-record" data-entity="vaccine" data-id="${v.id}" aria-label="Editar" title="Editar">✎</button>
        <button class="icon-btn" data-action="delete-record" data-entity="vaccine" data-id="${v.id}" aria-label="Excluir" title="Excluir">🗑</button>
      </div>` : ''}
    </div>`;
  }).join('') : `<div class="empty-tab">${q ? 'Nenhum resultado para essa busca.' : 'Nenhuma vacina registrada ainda.'}</div>`}`;
}

function renderMedsTab(a, meds){
  const q = recordSearch.trim().toLowerCase();
  const filtered = q ? meds.filter(m => `${m.name||''} ${m.dose||''} ${m.frequency||''} ${m.purchaseLocation||''} ${m.notes||''}`.toLowerCase().includes(q)) : meds;
  const sorted = filtered.slice().sort((x,y)=> (y.startDate||'').localeCompare(x.startDate||''));
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
  ${meds.length > 3 ? `<input type="text" id="record-search" class="search-input" placeholder="Buscar por nome, dose, local..." value="${escapeAttr(recordSearch)}">` : ''}
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
        <button class="icon-btn" data-action="edit-record" data-entity="medication" data-id="${m.id}" aria-label="Editar" title="Editar">✎</button>
        <button class="icon-btn" data-action="delete-record" data-entity="medication" data-id="${m.id}" aria-label="Excluir" title="Excluir">🗑</button>
      </div>` : ''}
    </div>`;
  }).join('') : `<div class="empty-tab">${q ? 'Nenhum resultado para essa busca.' : 'Nenhuma medicação registrada ainda.'}</div>`}`;
}

function renderHistoryTab(a, history){
  const readOnly = false; // compartilhamento agora permite edição por ambos
  const q = recordSearch.trim().toLowerCase();
  const filtered = q ? history.filter(h => `${h.type||''} ${h.description||''} ${h.vet||''}`.toLowerCase().includes(q)) : history;
  return `
  <div class="section-head">
    <h3>Histórico de saúde</h3>
    ${!readOnly ? `<button class="btn-add" data-action="add-record" data-entity="healthRecord">+ Novo registro</button>` : ''}
  </div>
  ${history.length > 3 ? `<input type="text" id="record-search" class="search-input" placeholder="Buscar por tipo, descrição, veterinário..." value="${escapeAttr(recordSearch)}">` : ''}
  ${filtered.length ? `<div class="timeline">${filtered.map(h=>`
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
        <button class="icon-btn" data-action="edit-record" data-entity="healthRecord" data-id="${h.id}" aria-label="Editar" title="Editar">✎</button>
        <button class="icon-btn" data-action="delete-record" data-entity="healthRecord" data-id="${h.id}" aria-label="Excluir" title="Excluir">🗑</button>
      </div>` : ''}
    </div>
  `).join('')}</div>` : `<div class="empty-tab">${q ? 'Nenhum resultado para essa busca.' : 'Nenhum registro de saúde ainda.'}</div>`}`;
}

/* ---------------- Peso & Dieta ---------------- */
const LIFE_STAGE_FACTORS = [
  { id:'filhote', label:'Filhote (até 4 meses)', factor:3.0 },
  { id:'filhote2', label:'Filhote (4-12 meses)', factor:2.0 },
  { id:'adulto_castrado', label:'Adulto(a) castrado(a)', factor:1.6 },
  { id:'adulto_inteiro', label:'Adulto(a) não castrado(a)', factor:1.8 },
  { id:'emagrecimento', label:'Em emagrecimento', factor:1.0 },
  { id:'idoso', label:'Idoso(a)', factor:1.4 },
  { id:'gestante', label:'Gestante/lactante', factor:3.0 },
];

function renderWeightChart(entries){
  const w = 600, h = 200, pad = 36;
  if(entries.length < 2){
    return `<div class="empty-tab" style="margin-bottom:16px;">Registre pelo menos 2 pesagens para ver o gráfico de evolução.</div>`;
  }
  const sorted = entries.slice().sort((x,y)=> (x.date||'').localeCompare(y.date||''));
  const weights = sorted.map(e=>parseFloat(e.weight)||0);
  const minW = Math.min(...weights), maxW = Math.max(...weights);
  const range = (maxW - minW) || 1;
  const yFor = (val) => h - pad - ((val - minW) / range) * (h - pad*2);
  const xFor = (i) => pad + (i / (sorted.length - 1)) * (w - pad*2);

  const points = sorted.map((e,i) => `${xFor(i)},${yFor(parseFloat(e.weight)||0)}`).join(' ');
  const dots = sorted.map((e,i) => `<circle cx="${xFor(i)}" cy="${yFor(parseFloat(e.weight)||0)}" r="4" fill="var(--forest)"></circle>`).join('');
  const firstLabel = fmtDate(sorted[0].date);
  const lastLabel = fmtDate(sorted[sorted.length-1].date);

  return `
  <div class="weight-chart-wrap">
    <svg viewBox="0 0 ${w} ${h}" class="weight-chart" preserveAspectRatio="xMidYMid meet">
      <line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="var(--line)" stroke-width="1"></line>
      <text x="${pad}" y="16" font-size="11" fill="var(--ink-soft)" font-family="IBM Plex Mono, monospace">${maxW.toFixed(1)} kg</text>
      <text x="${pad}" y="${h-pad+16}" font-size="11" fill="var(--ink-soft)" font-family="IBM Plex Mono, monospace">${minW.toFixed(1)} kg</text>
      <polyline points="${points}" fill="none" stroke="var(--forest)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></polyline>
      ${dots}
      <text x="${pad}" y="${h-8}" font-size="11" fill="var(--ink-soft)" font-family="IBM Plex Mono, monospace">${firstLabel}</text>
      <text x="${w-pad}" y="${h-8}" font-size="11" fill="var(--ink-soft)" font-family="IBM Plex Mono, monospace" text-anchor="end">${lastLabel}</text>
    </svg>
  </div>`;
}

function renderDietTab(a){
  const readOnly = false;
  const log = (a.weightLog || []).slice().sort((x,y)=> (y.date||'').localeCompare(x.date||''));
  const latestWeight = log.length ? parseFloat(log[0].weight) : (parseFloat(a.weight) || '');
  const purchases = (a.foodPurchases || []).slice().sort((x,y)=> (y.purchaseDate||'').localeCompare(x.purchaseDate||''));

  return `
  <div class="section-head">
    <h3>Evolução de peso</h3>
    <button class="btn-add" data-action="add-record" data-entity="weightEntry">+ Registrar peso</button>
  </div>
  ${renderWeightChart(log)}
  ${log.length ? log.map(entry => `
    <div class="rec-card">
      <div class="rec-main">
        <div class="rec-title-row"><span class="rec-title mono">${parseFloat(entry.weight).toFixed(2)} kg</span></div>
        <div class="rec-line">${fmtDate(entry.date)}</div>
        ${entry.notes ? `<div class="rec-notes">${escapeHtml(entry.notes)}</div>` : ''}
      </div>
      <div class="rec-actions">
        <button class="icon-btn" data-action="edit-record" data-entity="weightEntry" data-id="${entry.id}" aria-label="Editar" title="Editar">✎</button>
        <button class="icon-btn" data-action="delete-record" data-entity="weightEntry" data-id="${entry.id}" aria-label="Excluir" title="Excluir">🗑</button>
      </div>
    </div>
  `).join('') : `<div class="empty-tab">Nenhuma pesagem registrada ainda.</div>`}

  <div class="section-head" style="margin-top:24px;">
    <h3>Compras de ração</h3>
    <button class="btn-add" data-action="add-record" data-entity="foodPurchase">+ Registrar compra</button>
  </div>
  ${purchases.length ? purchases.map(p => `
    <div class="rec-card">
      <div class="rec-main">
        <div class="rec-title-row"><span class="rec-title">${escapeHtml(p.brand||'')}</span></div>
        <div class="rec-line">${fmtDate(p.purchaseDate)}${p.purchaseLocation ? ' · ' + escapeHtml(p.purchaseLocation) : ''}</div>
        ${(p.kg || p.price) ? `<div class="rec-line">${p.kg ? parseFloat(p.kg).toFixed(1) + ' kg' : ''}${p.kg && p.price ? ' · ' : ''}${p.price ? 'R$ ' + parseFloat(p.price).toFixed(2) : ''}</div>` : ''}
      </div>
      <div class="rec-actions">
        <button class="icon-btn" data-action="edit-record" data-entity="foodPurchase" data-id="${p.id}" aria-label="Editar" title="Editar">✎</button>
        <button class="icon-btn" data-action="delete-record" data-entity="foodPurchase" data-id="${p.id}" aria-label="Excluir" title="Excluir">🗑</button>
      </div>
    </div>
  `).join('') : `<div class="empty-tab">Nenhuma compra registrada ainda.</div>`}

  <div class="field-section-label">Calculadora de porção diária</div>
  <div class="diet-calc">
    <div class="field-row">
      <div class="field">
        <label>Peso atual (kg)</label>
        <input type="number" step="0.01" id="calc-weight" value="${escapeAttr(latestWeight)}">
      </div>
      <div class="field">
        <label>Fase / estado</label>
        <select id="calc-stage">
          ${LIFE_STAGE_FACTORS.map(s => `<option value="${s.factor}">${s.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field">
      <label>Energia da ração (kcal por kg — vem na embalagem)</label>
      <input type="number" step="1" id="calc-kcal" placeholder="Ex: 3500" value="3500">
    </div>
    <button class="btn-secondary" style="width:100%;" data-action="calc-portion">Calcular porção diária</button>
    <div id="calc-result"></div>
    <p style="font-size:11.5px;color:var(--ink-soft);margin:10px 0 0;line-height:1.5;">
      Estimativa baseada na fórmula veterinária padrão (RER = 70 × peso^0,75). Serve como ponto de
      partida — confirme com um(a) veterinário(a), especialmente para filhotes, gestantes ou
      condições de saúde específicas.
    </p>
  </div>`;
}


