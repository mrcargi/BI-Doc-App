/* ═══════════════════════════════════════════════════════════════
   PBI Docs — app.js (v2 con autenticación)
   ═══════════════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────────────
const state = {
  reportes: [],
  areas: [],
  activeId: null,
  activeTab: 'resumen',
  colFilter: '',
  dirFilter: '',
  searchQ: '',
  user: null,
  token: null,
};

// ── API helpers (with JWT) ────────────────────────────────────
const API = '/api';

function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (state.token) h['Authorization'] = `Bearer ${state.token}`;
  return h;
}

async function apiFetch(path, opts = {}) {
  if (state.token) {
    opts.headers = { ...opts.headers, 'Authorization': `Bearer ${state.token}` };
  }
  const res = await fetch(API + path, opts);
  if (res.status === 401) {
    logout();
    throw new Error('Sesión expirada');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.message || res.statusText);
  }
  return res.json();
}

// ════════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════════
function loadSession() {
  const t = localStorage.getItem('pbi_token');
  const u = localStorage.getItem('pbi_user');
  if (t && u) {
    state.token = t;
    state.user = JSON.parse(u);
    return true;
  }
  return false;
}

function saveSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('pbi_token', token);
  localStorage.setItem('pbi_user', JSON.stringify(user));
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('pbi_token');
  localStorage.removeItem('pbi_user');
  document.getElementById('login-screen').style.display = 'grid';
  document.getElementById('app-shell').style.display = 'none';
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.remove('show');

  if (!email || !pass) { errEl.textContent = 'Ingresa email y contraseña'; errEl.classList.add('show'); return; }

  try {
    const res = await fetch(API + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();
    console.log('Login response status:', res.status, 'data:', JSON.stringify(data).substring(0,300));
    if (!res.ok) {
      errEl.textContent = data.detail || 'Credenciales inválidas';
      errEl.classList.add('show');
      return;
    }
    if (!data.token) {
      errEl.textContent = 'Error: servidor no devolvió token. Revisa la consola (F12).';
      errEl.classList.add('show');
      console.error('Full response:', data);
      return;
    }
    saveSession(data.token, data.user);
    console.log('Token saved:', localStorage.getItem('pbi_token')?.substring(0,30));
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = '';
    await init();
    populateDireccionSelect();
  } catch (e) {
    errEl.textContent = 'Error de conexión: ' + e.message;
    errEl.classList.add('show');
    console.error('Login error:', e);
  }
}

// Login on Enter key
document.getElementById('login-password')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('login-email')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-password').focus(); });

// ════════════════════════════════════════════════════════════════
//  JSON UPLOAD
// ════════════════════════════════════════════════════════════════
function openJsonUpload() {
  document.getElementById('json-input').value = '';
  document.getElementById('json-validation').style.display = 'none';
  document.getElementById('json-preview').style.display = 'none';
  document.getElementById('json-submit-btn').disabled = true;
  document.getElementById('json-modal').classList.add('open');
  document.getElementById('json-input').focus();
}

function closeJsonUpload() {
  document.getElementById('json-modal').classList.remove('open');
}

async function validateJsonInput() {
  const raw = document.getElementById('json-input').value.trim();
  const valEl = document.getElementById('json-validation');
  const prevEl = document.getElementById('json-preview');
  const submitBtn = document.getElementById('json-submit-btn');

  if (!raw) { valEl.innerHTML = '⚠ Pega un JSON primero'; valEl.style.display = 'block'; valEl.style.background = '#fef3c7'; valEl.style.color = '#92400e'; return; }

  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) {
    valEl.innerHTML = `✗ JSON inválido: ${e.message}`;
    valEl.style.display = 'block'; valEl.style.background = '#fef2f2'; valEl.style.color = '#dc2626';
    submitBtn.disabled = true; prevEl.style.display = 'none';
    return;
  }

  try {
    const result = await apiFetch('/validate-json', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(parsed),
    });

    if (result.valid) {
      valEl.innerHTML = '✓ JSON válido' + (result.warnings.length ? ` — ${result.warnings.length} aviso(s): ${result.warnings.join(', ')}` : '');
      valEl.style.background = '#dcfce7'; valEl.style.color = '#166534';
      submitBtn.disabled = false;

      const s = result.summary;
      prevEl.innerHTML = `<div style="background:var(--gray-50);padding:10px 14px;border-radius:8px;font-size:12px;line-height:1.8">
        <strong>${s.name}</strong> <span style="color:var(--text3)">(${s.id})</span><br>
        📋 ${s.tables} tablas · 📊 ${s.columns} columnas · 📐 ${s.measures} medidas · 🔗 ${s.relations} relaciones
        ${result.warnings.length ? '<br><span style="color:#d97706">⚠ ' + result.warnings.join(' · ') + '</span>' : ''}
      </div>`;
      prevEl.style.display = 'block';
    } else {
      valEl.innerHTML = `✗ ${result.errors.length} error(es):<br>` + result.errors.map(e => `  · ${e}`).join('<br>');
      valEl.style.background = '#fef2f2'; valEl.style.color = '#dc2626';
      submitBtn.disabled = true; prevEl.style.display = 'none';
    }
  } catch (e) {
    valEl.innerHTML = `✗ Error: ${e.message}`;
    valEl.style.background = '#fef2f2'; valEl.style.color = '#dc2626';
    submitBtn.disabled = true;
  }
  valEl.style.display = 'block';
}

async function submitJson() {
  const raw = document.getElementById('json-input').value.trim();
  let parsed;
  try { parsed = JSON.parse(raw); } catch { showToast('JSON inválido', '✗'); return; }

  try {
    const result = await apiFetch('/upload-json', {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(parsed),
    });
    showToast(result.message, '✓');
    closeJsonUpload();
    await init();
    if (result.reporte?.id) selectDoc(result.reporte.id);
  } catch (e) {
    showToast(e.message, '✗');
  }
}

// ════════════════════════════════════════════════════════════════
//  USER MANAGEMENT
// ════════════════════════════════════════════════════════════════
function showUserMenu() {
  const m = document.getElementById('user-menu-modal');
  document.getElementById('um-title').textContent = `${state.user.name}`;
  document.getElementById('um-info').innerHTML = `${state.user.email} · <strong>${state.user.role}</strong>`;
  document.getElementById('um-newpass').value = '';

  let adminBtns = `<button class="btn btn-danger" onclick="logout();closeUserMenu()">Cerrar sesión</button>`;
  if (state.user.role === 'admin') {
    adminBtns += ` <button class="btn" onclick="closeUserMenu();openUsersModal()">👥 Usuarios</button>`;
  }
  document.getElementById('um-admin-btns').innerHTML = adminBtns;
  m.classList.add('open');
}

function closeUserMenu() { document.getElementById('user-menu-modal').classList.remove('open'); }

async function saveUserMenu() {
  const pass = document.getElementById('um-newpass').value;
  if (pass) {
    if (pass.length < 6) { showToast('Mínimo 6 caracteres', '⚠️'); return; }
    try {
      await apiFetch('/auth/password', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ password: pass }) });
      showToast('Contraseña actualizada', '✓');
    } catch (e) { showToast(e.message, '✗'); }
  }
  closeUserMenu();
}

async function openUsersModal() {
  document.getElementById('users-modal').classList.add('open');
  try {
    const data = await apiFetch('/users', { headers: authHeaders() });
    const ul = document.getElementById('users-list');
    ul.innerHTML = data.items.map(u => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px">
        <div style="flex:1">
          <strong>${u.name}</strong> <span style="color:var(--text3)">${u.email}</span>
        </div>
        <span class="doc-meta-tag">${u.role}</span>
        <span style="color:${u.is_active ? 'var(--accent)' : '#dc2626'};font-size:10px">${u.is_active ? '● Activo' : '● Inactivo'}</span>
      </div>
    `).join('');
  } catch (e) { showToast(e.message, '✗'); }
}

function closeUsersModal() { document.getElementById('users-modal').classList.remove('open'); }

async function createNewUser() {
  const name = document.getElementById('nu-name').value.trim();
  const email = document.getElementById('nu-email').value.trim();
  const pass = document.getElementById('nu-pass').value;
  const role = document.getElementById('nu-role').value;

  if (!name || !email || !pass) { showToast('Completa todos los campos', '⚠️'); return; }

  try {
    await apiFetch('/users', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ name, email, password: pass, role }),
    });
    showToast(`Usuario ${email} creado`, '✓');
    ['nu-name','nu-email','nu-pass'].forEach(id => document.getElementById(id).value = '');
    openUsersModal(); // refresh list
  } catch (e) { showToast(e.message, '✗'); }
}

// ════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════
async function init() {
  try {
    const [rData, aData] = await Promise.all([
      apiFetch('/reportes'),
      apiFetch('/areas'),
    ]);
    state.reportes = rData.items;
    state.areas    = aData.items;

    // Update user display
    if (state.user) {
      document.getElementById('user-name-display').textContent = `${state.user.name} (${state.user.role})`;
    }

    renderSidebar();
    if (state.reportes.length > 0 && !state.activeId) {
      selectDoc(state.reportes[0].id);
    } else if (state.activeId) {
      renderDoc();
    }
  } catch (e) {
    if (e.message !== 'Sesión expirada') {
      document.getElementById('main-area').innerHTML =
        `<div class="empty-state"><div class="glyph">⚠</div>
         <h2>No se pudo conectar con la API</h2>
         <p>${e.message}</p></div>`;
    }
  }
}

// ════════════════════════════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════════════════════════════
function renderSidebar() {
  // Direction chips
  const dirs = [...new Set(state.areas.map(a => a.nombre))].sort();
  const chipsEl = document.getElementById('dir-chips');
  chipsEl.innerHTML = dirs.map(d =>
    `<button class="dir-chip ${state.dirFilter === d ? 'active' : ''}"
      onclick="setDirFilter('${d}')">${d}</button>`
  ).join('');

  // Filtered list
  const q   = state.searchQ.toLowerCase();
  const filtered = state.reportes.filter(r => {
    const matchQ   = !q || r.name.toLowerCase().includes(q) || (r.area||'').toLowerCase().includes(q) || (r.tags||[]).some(t => t.toLowerCase().includes(q));
    const matchDir = !state.dirFilter || r.direccion === state.dirFilter;
    return matchQ && matchDir;
  });

  const list = document.getElementById('doc-list');
  list.innerHTML = filtered.length === 0
    ? `<div style="padding:16px 14px;font-size:12px;color:rgba(202,255,211,.3);text-align:center">Sin resultados</div>`
    : filtered.map(r => `
    <div class="doc-item ${r.id === state.activeId ? 'active' : ''}" onclick="selectDoc('${r.id}')">
      <div class="doc-item-icon" style="background:${r.color}22;color:${r.color}">${r.emoji||'📄'}</div>
      <div class="doc-item-info">
        <div class="doc-item-name">${r.name}</div>
        <div class="doc-item-meta">${r.area||'—'} · ${(r.tables||[]).length} tablas</div>
        <div class="doc-item-badges">
          ${r.direccion ? `<span class="doc-item-badge">${r.direccion}</span>` : ''}
          ${r.pdfFile   ? `<span class="doc-item-badge" style="color:#CAFFD3">PDF</span>` : ''}
          ${r.estado !== 'activo' ? `<span class="doc-item-badge" style="color:#f5d07a">${r.estado}</span>` : ''}
        </div>
      </div>
    </div>`).join('');

  document.getElementById('doc-count').textContent = `${state.reportes.length} reporte${state.reportes.length !== 1 ? 's' : ''}`;
}

function setDirFilter(dir) {
  state.dirFilter = state.dirFilter === dir ? '' : dir;
  renderSidebar();
}

document.getElementById('search-input').addEventListener('input', e => {
  state.searchQ = e.target.value;
  renderSidebar();
});

// ════════════════════════════════════════════════════════════════
//  SELECT & RENDER DOC
// ════════════════════════════════════════════════════════════════
function selectDoc(id) {
  state.activeId  = id;
  state.activeTab = 'resumen';
  state.colFilter = '';
  renderSidebar();
  renderDoc();
}

const badgeMap = { Texto:'badge-text', Entero:'badge-int', 'Fecha/Hora':'badge-date',
  Calculada:'badge-formula', Decimal:'badge-decimal' };
const typeLabel  = { import:'Import', calc:'Calculada', empty:'Vacía', param:'Parámetro' };
const typeBadge  = { import:'badge-import', calc:'badge-calc', empty:'badge-empty', param:'badge-param' };

function renderDoc() {
  const doc = state.reportes.find(r => r.id === state.activeId);
  document.getElementById('empty-state').style.display = 'none';
  const dv = document.getElementById('doc-view');
  dv.style.display = 'block';
  if (!doc) { dv.innerHTML = ''; return; }

  const totalMeasures = (doc.folders||[]).reduce((s,f) => s + (f.measures||[]).length, 0);

  dv.innerHTML = `
  <div class="doc-header">
    <div class="doc-header-top">
      <h1 class="doc-title">${doc.emoji||'📄'} ${doc.name}</h1>
      <div class="doc-actions">
        <button class="btn btn-primary" onclick="exportExecutivePDF('${doc.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar PDF
        </button>
        <button class="btn" onclick="openEditModal('${doc.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        ${state.user?.role === 'admin' ? `<button class="btn btn-danger" onclick="confirmDelete('${doc.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          Eliminar
        </button>` : ''}
      </div>
    </div>
    <div class="doc-meta">
      <span class="doc-meta-tag">📅 ${doc.createdAt||'—'}</span>
      <span class="doc-meta-tag">🏢 ${doc.area||'—'}</span>
      <span class="doc-meta-tag">📁 ${doc.direccion||'—'}</span>
      <span class="doc-meta-tag" style="font-family:var(--mono)">PBI ${doc.compat||'—'}</span>
      <span class="doc-estado ${doc.estado||'activo'}">${doc.estado||'activo'}</span>
      ${(doc.tags||[]).map(t => `<span class="doc-meta-tag">#${t}</span>`).join('')}
    </div>
    ${doc.desc ? `<p style="margin-top:10px;color:var(--text2);font-size:13px;max-width:100%">${doc.desc}</p>` : ''}
  </div>

  <div class="tabs">
    <button class="tab ${state.activeTab==='resumen' ?'active':''}" onclick="switchTab('resumen')">Resumen</button>
    <button class="tab ${state.activeTab==='modelo'  ?'active':''}" onclick="switchTab('modelo')">Modelo</button>
    <button class="tab ${state.activeTab==='columnas'?'active':''}" onclick="switchTab('columnas')">Columnas</button>
    <button class="tab ${state.activeTab==='medidas' ?'active':''}" onclick="switchTab('medidas')">Medidas DAX</button>
    <button class="tab ${state.activeTab==='fuente'  ?'active':''}" onclick="switchTab('fuente')">Fuente</button>
    <button class="tab ${state.activeTab==='pdf'     ?'active':''}" onclick="switchTab('pdf')">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      Vista PDF${doc.pdfFile ? ' ✓' : ''}
    </button>
  </div>

  ${tabResumen(doc, totalMeasures)}
  ${tabModelo(doc)}
  ${tabColumnas(doc)}
  ${tabMedidas(doc, totalMeasures)}
  ${tabFuente(doc)}
  ${tabPdf(doc)}
  `;
}

// ── Tab builders ───────────────────────────────────────────────
function tabResumen(doc, totalMeasures) {
  const rels = (doc.relations||[]).filter(r => r.active).length;
  return `<div id="tab-resumen" class="tab-content ${state.activeTab==='resumen'?'active':''}">
    <div class="metric-grid">
      <div class="metric-card"><div class="metric-val">${(doc.tables||[]).length}</div><div class="metric-lbl">Tablas</div></div>
      <div class="metric-card"><div class="metric-val">${(doc.columns||[]).length}</div><div class="metric-lbl">Columnas</div></div>
      <div class="metric-card"><div class="metric-val">${totalMeasures}</div><div class="metric-lbl">Medidas DAX</div></div>
      <div class="metric-card"><div class="metric-val">${rels}</div><div class="metric-lbl">Relaciones</div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Tablas del modelo</div></div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Tabla</th><th>Tipo</th><th>Cols</th><th>Filas aprox.</th><th>Descripción</th></tr></thead>
        <tbody>${(doc.tables||[]).map(t => `<tr>
          <td><strong>${t.name}</strong></td>
          <td><span class="badge ${typeBadge[t.type]||''}">${typeLabel[t.type]||t.type}</span></td>
          <td style="font-family:var(--mono)">${t.cols}</td>
          <td style="font-family:var(--mono);color:var(--text3)">${t.rows}</td>
          <td style="color:var(--text2)">${t.desc}</td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>
  </div>`;
}

function tabModelo(doc) {
  return `<div id="tab-modelo" class="tab-content ${state.activeTab==='modelo'?'active':''}">
    <div class="card card-diagram">
      <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
        <div class="card-title">Diagrama de relaciones</div>
        <div style="display:flex;gap:6px;align-items:center">
          <span style="font-size:10px;color:var(--text-3);font-family:var(--mono)">🟢 Activa · 🟡 Hover · Arrastra nodos · Scroll para zoom</span>
          <button class="btn btn-sm" onclick="resetDiagram()">↺ Reset</button>
        </div>
      </div>
      <div id="diagram-container" style="width:100%;height:620px;background:var(--gray-50);border-radius:0 0 var(--rl) var(--rl);overflow:hidden;position:relative;cursor:grab"></div>
    </div>
    <div class="card card-rel">
      <div class="card-header"><div class="card-title">Relaciones</div></div>
      <div class="card-body">
        ${(doc.relations||[]).filter(r=>!r.toTable.includes('Local')).map(r => `
        <div class="rel-row">
          <span class="rel-box">${r.fromTable} · ${r.fromCol}</span>
          <span class="rel-arrow">→</span>
          <span class="rel-box">${r.toTable} · ${r.toCol}</span>
          <span class="rel-tag">${r.card}</span>
          <span class="rel-tag">${r.dir==='BothDirections'?'↔ Ambas':'→ Una'}</span>
          <span class="rel-tag" style="${r.active?'color:var(--accent);background:var(--accent-lt)':'color:var(--text-3)'}">${r.active?'Activa':'Inactiva'}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

function tabColumnas(doc) {
  return `<div id="tab-columnas" class="tab-content ${state.activeTab==='columnas'?'active':''}">
    <div class="filter-bar">
      <span style="font-size:12px;color:var(--text3);font-family:var(--mono)">Tipo:</span>
      ${['','Texto','Entero','Decimal','Fecha/Hora','Calculada'].map(f =>
        `<button class="filter-btn ${state.colFilter===f?'active':''}" onclick="setColFilter('${f}')">${f||'Todos'}</button>`
      ).join('')}
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div class="tbl-wrap"><table id="cols-table">
        <thead><tr><th>#</th><th>Columna</th><th>Tipo</th><th>Descripción</th></tr></thead>
        <tbody>${renderColRows(doc.columns||[], state.colFilter)}</tbody>
      </table></div>
    </div>
  </div>`;
}

function renderColRows(cols, filter) {
  return cols
    .filter(c => !filter || c.t === filter)
    .map((c,i) => `<tr>
      <td style="font-family:var(--mono);color:var(--text3);font-size:11px">${i+1}</td>
      <td><strong>${c.n}</strong></td>
      <td><span class="badge ${badgeMap[c.t]||''}">${c.t}</span></td>
      <td style="color:var(--text2)">${c.d}</td>
    </tr>`).join('');
}

function setColFilter(f) {
  state.colFilter = f;
  const doc = state.reportes.find(r => r.id === state.activeId);
  if (!doc) return;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('active', b.textContent.trim() === (f||'Todos')));
  const tbody = document.querySelector('#cols-table tbody');
  if (tbody) tbody.innerHTML = renderColRows(doc.columns||[], f);
}

function tabMedidas(doc, total) {
  return `<div id="tab-medidas" class="tab-content ${state.activeTab==='medidas'?'active':''}">
    <p style="font-size:13px;color:var(--text3);margin-bottom:14px">
      ${total} medidas en ${(doc.folders||[]).length} carpetas — clic para expandir</p>
    ${(doc.folders||[]).map((f,i) => `
    <div class="folder">
      <div class="folder-hdr" onclick="toggleFolder(${i})" style="border-left-color:${f.color}">
        <span class="folder-dot" style="background:${f.color}"></span>
        <span>${f.name}</span>
        <span class="folder-count">${(f.measures||[]).length} medidas</span>
        <span class="folder-chevron" id="fc-${i}">▶</span>
      </div>
      <div class="folder-body" id="fb-${i}">
        <div class="tbl-wrap"><table>
          <thead><tr><th>Medida</th><th>Descripción</th></tr></thead>
          <tbody>${(f.measures||[]).map(m => `
            <tr><td><strong>${m.n}</strong></td><td style="color:var(--text2)">${m.d}</td></tr>`
          ).join('')}</tbody>
        </table></div>
      </div>
    </div>`).join('')}
  </div>`;
}

function tabFuente(doc) {
  const s = doc.source;
  if (!s) return `<div id="tab-fuente" class="tab-content ${state.activeTab==='fuente'?'active':''}">
    <div class="alert alert-info">Sin información de fuente registrada.</div></div>`;
  return `<div id="tab-fuente" class="tab-content ${state.activeTab==='fuente'?'active':''}">
    <div class="card card-source">
      <div class="card-header"><div class="card-title">Origen de datos</div></div>
      <div class="card-body">
        <div class="source-box">
          <div><span class="key">Conector:</span><span class="val">${s.connector}</span></div>
          <div><span class="key">URL base:</span><span class="url">${s.url}</span></div>
          <div><span class="key">Carpeta:</span><span class="url">${s.folder}</span></div>
          <div><span class="key">Archivos:</span><span class="val">${s.fileType}</span></div>
          <div><span class="key">Modo:</span><span class="val">${s.mode}</span></div>
          <div><span class="key">API:</span><span class="val">${s.api}</span></div>
          <div><span class="key">Servicio:</span><span class="val">${s.user}</span></div>
        </div>
      </div>
    </div>
    <div class="card card-steps">
      <div class="card-header"><div class="card-title">Proceso de transformación</div></div>
      <div class="card-body">
        <ol class="steps">${(s.steps||[]).map(st => `<li>${st}</li>`).join('')}</ol>
      </div>
    </div>
  </div>`;
}

function tabPdf(doc) {
  const hasPdf = !!doc.pdfFile;
  return `<div id="tab-pdf" class="tab-content ${state.activeTab==='pdf'?'active':''}">
    ${hasPdf ? `
    <div class="pdf-viewer-wrap">
      <div class="pdf-viewer-toolbar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f08080" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span class="pdf-name">${doc.pdfFile}</span>
        <div style="flex:1"></div>
        <button class="btn btn-sm" onclick="removePdf('${doc.id}')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          Quitar
        </button>
      </div>
      <iframe class="pdf-viewer-iframe" src="/pdfs/${doc.pdfFile}" title="Vista PDF"></iframe>
    </div>` : `
    <div class="pdf-dropzone" id="drop-zone"
         ondragover="dragOver(event)" ondragleave="dragLeave(event)" ondrop="dropPDF(event,'${doc.id}')">
      <input type="file" accept="application/pdf" onchange="loadPDF(event,'${doc.id}')">
      <div class="pdf-dropzone-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
      </div>
      <h3>Sube el PDF del reporte</h3>
      <p>Arrastra aquí el PDF exportado desde Power BI Desktop<br>o haz clic para seleccionarlo</p>
      <p style="margin-top:10px;font-size:11px;color:var(--text3);font-family:var(--mono)">Archivo → Exportar → Exportar a PDF</p>
    </div>`}
  </div>`;
}

// ── SVG Diagram ────────────────────────────────────────────────
function buildDiagramSVG() { return ''; } // legacy — replaced by renderD3Diagram

// ── D3 Diagram (Organized Layout) ──────────────────────────────
let _d3sim = null;
let _d3anim = null;

function resetDiagram() {
  const doc = state.reportes.find(r => r.id === state.activeId);
  if (doc) renderD3Diagram(doc);
}

function renderD3Diagram(doc) {
  const container = document.getElementById('diagram-container');
  if (!container) return;
  container.innerHTML = '';

  if (typeof d3 === 'undefined') {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-3);font-size:13px">Cargando D3…</div>';
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js';
    s.onload = () => renderD3Diagram(doc);
    document.head.appendChild(s);
    return;
  }

  if (_d3sim) { _d3sim.stop(); _d3sim = null; }
  if (_d3anim) { cancelAnimationFrame(_d3anim); _d3anim = null; }

  // ── Palette ──
  const palette = {
    import: { fill:'#dcfce7', stroke:'#16a34a', hdr:'#16a34a', label:'Import', glow:'rgba(22,163,74,.2)' },
    calc:   { fill:'#dbeafe', stroke:'#2563eb', hdr:'#2563eb', label:'Calculada', glow:'rgba(37,99,235,.2)' },
    empty:  { fill:'#ede9fe', stroke:'#7c3aed', hdr:'#7c3aed', label:'Medidas', glow:'rgba(124,58,237,.2)' },
    param:  { fill:'#fef3c7', stroke:'#d97706', hdr:'#d97706', label:'Parámetro', glow:'rgba(217,119,6,.2)' },
  };
  const getP = t => palette[t.type] || { fill:'#f4f4f5', stroke:'#71717a', hdr:'#71717a', label:'Otro', glow:'rgba(113,113,122,.2)' };

  const tables = (doc.tables||[]).filter(t => !t.name.includes('Local'));
  const relations = (doc.relations||[]).filter(r =>
    !r.fromTable.includes('Local') && !r.toTable.includes('Local')
  );

  const W = container.clientWidth || 800;
  const H = container.clientHeight || 620;
  const NW = 170, NH = 76;

  // ── Split: related vs unrelated ──
  const relatedNames = new Set();
  relations.forEach(r => { relatedNames.add(r.fromTable); relatedNames.add(r.toTable); });

  const relatedTables  = tables.filter(t => relatedNames.has(t.name));
  const orphanTables   = tables.filter(t => !relatedNames.has(t.name));

  // ── Divider X position ──
  const divX = orphanTables.length > 0 ? W * 0.62 : W;
  const leftW = divX;
  const rightW = W - divX;

  // ── Position related tables: star layout ──
  // Find the "fact" table (most relations, type import, most cols)
  const relCounts = {};
  relations.forEach(r => {
    relCounts[r.fromTable] = (relCounts[r.fromTable]||0) + 1;
    relCounts[r.toTable]   = (relCounts[r.toTable]||0)   + 1;
  });
  const factTable = relatedTables.slice().sort((a,b) => {
    const diff = (relCounts[b.name]||0) - (relCounts[a.name]||0);
    if (diff !== 0) return diff;
    return (b.cols||0) - (a.cols||0);
  })[0];

  const centerX = leftW * 0.5;
  const centerY = H * 0.5;
  const orbitR  = Math.min(leftW, H) * 0.34;

  relatedTables.forEach((t, i) => {
    if (factTable && t.name === factTable.name) {
      t.fx = centerX; t.fy = centerY;
      t.x  = centerX; t.y  = centerY;
    } else {
      const others = relatedTables.filter(tt => !factTable || tt.name !== factTable.name);
      const idx    = others.indexOf(t);
      const angle  = (idx / others.length) * Math.PI * 2 - Math.PI / 2;
      const px = centerX + Math.cos(angle) * orbitR;
      const py = centerY + Math.sin(angle) * orbitR;
      t.fx = px; t.fy = py;
      t.x  = px; t.y  = py;
    }
  });

  // ── Position orphan tables: grid on the right ──
  const orphanPadX = 30;
  const orphanPadY = 45;
  const orphanColW = NW + 20;
  const colsRight = Math.max(1, Math.floor((rightW - orphanPadX * 2) / orphanColW));
  orphanTables.forEach((t, i) => {
    const col = i % colsRight;
    const row = Math.floor(i / colsRight);
    const totalColsW = colsRight * orphanColW;
    const startX = divX + (rightW - totalColsW) / 2 + orphanColW / 2;
    const px = startX + col * orphanColW;
    const py = orphanPadY + NH / 2 + row * (NH + 22);
    t.fx = px; t.fy = py;
    t.x  = px; t.y  = py;
  });

  // ── Build D3 data ──
  const nodes = tables.map(t => ({ ...t, id: t.name }));
  const links = relations.map(r => ({
    source: r.fromTable, target: r.toTable,
    fromCol: r.fromCol, toCol: r.toCol,
    card: r.card, active: r.active, dir: r.dir,
  }));

  // ── SVG ──
  const svg = d3.select(container).append('svg')
    .attr('width', W).attr('height', H)
    .style('font-family', "'Geist', sans-serif");

  const defs = svg.append('defs');

  // Arrow markers
  ['active','inactive'].forEach(type => {
    const colors = { active:'#16a34a', inactive:'#a1a1aa' };
    defs.append('marker')
      .attr('id', `arrow-${type}`)
      .attr('viewBox','0 -6 12 12').attr('refX',12).attr('refY',0)
      .attr('markerWidth',7).attr('markerHeight',7).attr('orient','auto')
      .append('path').attr('d','M0,-5L12,0L0,5Z').attr('fill', colors[type]);
  });

  // Dot grid pattern
  defs.append('pattern').attr('id','dot-grid').attr('width',24).attr('height',24)
    .attr('patternUnits','userSpaceOnUse')
    .append('circle').attr('cx',12).attr('cy',12).attr('r',0.6)
    .attr('fill','rgba(113,113,122,0.12)');

  // ── Zoom & Pan ──
  const g = svg.append('g');
  const zoomBehavior = d3.zoom().scaleExtent([0.3, 2.5]).on('zoom', e => g.attr('transform', e.transform));
  svg.call(zoomBehavior);

  // Background
  g.append('rect').attr('width',W*4).attr('height',H*4).attr('x',-W*2).attr('y',-H*2)
    .attr('fill','url(#dot-grid)');

  // ── Divider line ──
  if (orphanTables.length > 0) {
    g.append('line')
      .attr('x1', divX).attr('y1', 0).attr('x2', divX).attr('y2', H)
      .attr('stroke','rgba(113,113,122,0.2)').attr('stroke-width',1).attr('stroke-dasharray','6 4');

    // Section labels
    g.append('text').attr('x', leftW/2).attr('y', 22)
      .attr('text-anchor','middle').attr('font-size',11).attr('font-weight',600)
      .attr('fill','rgba(113,113,122,0.5)').attr('letter-spacing','1.5px')
      .attr('font-family',"'Geist Mono', monospace")
      .text('TABLAS CON RELACIÓN');

    g.append('text').attr('x', divX + rightW/2).attr('y', 22)
      .attr('text-anchor','middle').attr('font-size',11).attr('font-weight',600)
      .attr('fill','rgba(113,113,122,0.5)').attr('letter-spacing','1.5px')
      .attr('font-family',"'Geist Mono', monospace")
      .text('SIN RELACIÓN');
  }

  // ── Links (curved) ──
  const linkGroup = g.append('g');
  const linkPath = linkGroup.selectAll('path').data(links).join('path')
    .attr('fill','none')
    .attr('stroke', d => d.active ? '#16a34a' : '#d1d1d6')
    .attr('stroke-width', d => d.active ? 2.2 : 1.2)
    .attr('stroke-dasharray', d => d.active ? null : '5 3')
    .attr('stroke-opacity', d => d.active ? 0.65 : 0.35)
    .attr('marker-end', d => `url(#arrow-${d.active?'active':'inactive'})`)
    .style('transition','stroke-opacity .25s, stroke-width .25s, stroke .25s');

  // ── Animated particles on active links ──
  const particles = [];
  links.filter(l => l.active).forEach(l => {
    for (let p = 0; p < 2; p++) {
      particles.push({ link: l, offset: p * 0.5, speed: 0.002 + Math.random() * 0.0015 });
    }
  });
  const particleGroup = g.append('g');
  const particleDots = particleGroup.selectAll('circle').data(particles).join('circle')
    .attr('r', 2.5).attr('fill','#22c55e').attr('opacity', 0.6);

  // ── Link labels (col → card → col) ──
  const linkLabelGroup = g.append('g');
  const activeLinkData = links.filter(l => l.active);

  const linkLabelBg = linkLabelGroup.selectAll('rect').data(activeLinkData).join('rect')
    .attr('rx',4).attr('ry',4)
    .attr('fill','#18181b').attr('fill-opacity',0.82)
    .attr('stroke','#16a34a').attr('stroke-width',0.4).attr('stroke-opacity',0.25);

  const linkLabelText = linkLabelGroup.selectAll('text').data(activeLinkData).join('text')
    .attr('text-anchor','middle').attr('dominant-baseline','central')
    .attr('font-size',8.5).attr('fill','#86efac')
    .attr('font-family',"'Geist Mono', monospace").attr('font-weight',500)
    .text(d => `${d.fromCol}  ${d.card}  ${d.toCol}`);

  // ── Node groups ──
  const node = g.append('g').selectAll('g').data(nodes).join('g')
    .attr('cursor','grab')
    .call(d3.drag()
      .on('start', (e,d) => { container.style.cursor='grabbing'; })
      .on('drag',  (e,d) => { d.fx = e.x; d.fy = e.y; d.x = e.x; d.y = e.y; updatePositions(); })
      .on('end',   (e,d) => { container.style.cursor='grab'; })
    );

  // Glow circle (hover)
  node.append('circle').attr('r',0).attr('fill','transparent').attr('class','n-glow');

  // Shadow
  node.append('rect')
    .attr('width',NW+3).attr('height',NH+3).attr('x',-(NW+3)/2).attr('y',-(NH+3)/2).attr('rx',9)
    .attr('fill','rgba(0,0,0,0.08)');

  // Card bg
  node.append('rect')
    .attr('width',NW).attr('height',NH).attr('x',-NW/2).attr('y',-NH/2).attr('rx',8)
    .attr('fill', d => getP(d).fill).attr('stroke', d => getP(d).stroke).attr('stroke-width',1.5)
    .attr('class','n-bg');

  // Header bar
  node.append('rect').attr('width',NW).attr('height',20).attr('x',-NW/2).attr('y',-NH/2).attr('rx',8)
    .attr('fill', d => getP(d).hdr);
  node.append('rect').attr('width',NW).attr('height',10).attr('x',-NW/2).attr('y',-NH/2+10)
    .attr('fill', d => getP(d).hdr);

  // Type label
  const typeIcons = { import:'⬇', calc:'ƒ', empty:'📐', param:'⚙' };
  node.append('text')
    .attr('text-anchor','middle').attr('y',-NH/2+14)
    .attr('font-size',9).attr('font-weight',600).attr('fill','#fff').attr('letter-spacing','0.6px')
    .text(d => `${typeIcons[d.type]||'○'} ${getP(d).label.toUpperCase()}`);

  // Table name
  node.append('text')
    .attr('text-anchor','middle').attr('y',-NH/2+38)
    .attr('font-size',12).attr('font-weight',700).attr('fill','#18181b')
    .text(d => d.name.length > 20 ? d.name.slice(0,19)+'…' : d.name);

  // Meta
  node.append('text')
    .attr('text-anchor','middle').attr('y',-NH/2+54)
    .attr('font-size',9.5).attr('fill','#52525b')
    .attr('font-family',"'Geist Mono', monospace")
    .text(d => `${d.cols} cols · ${d.rows||'—'} filas`);

  // Relation count badge
  node.each(function(d) {
    const count = links.filter(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source;
      const tid = typeof l.target === 'object' ? l.target.id : l.target;
      return (sid===d.name||tid===d.name) && l.active;
    }).length;
    if (count > 0) {
      const el = d3.select(this);
      el.append('circle').attr('cx',NW/2-5).attr('cy',-NH/2+5).attr('r',8)
        .attr('fill', getP(d).hdr).attr('stroke','#fff').attr('stroke-width',1.5);
      el.append('text').attr('x',NW/2-5).attr('y',-NH/2+8.5)
        .attr('text-anchor','middle').attr('font-size',8).attr('font-weight',700).attr('fill','#fff')
        .text(count);
    }
  });

  // ── Tooltip ──
  const tooltip = d3.select(container).append('div')
    .style('position','absolute').style('pointer-events','none')
    .style('background','rgba(24,24,27,0.95)').style('color','#fff')
    .style('padding','12px 16px').style('border-radius','10px')
    .style('font-size','12px').style('opacity',0)
    .style('transition','opacity .2s, transform .2s').style('transform','translateY(4px)')
    .style('max-width','300px').style('z-index',10).style('line-height','1.6')
    .style('border','1px solid rgba(255,255,255,.06)')
    .style('box-shadow','0 8px 32px rgba(0,0,0,.3)');

  // ── Node hover ──
  node.on('mouseenter', function(e,d) {
    const rels = links.filter(l => {
      const sid = typeof l.source==='object'?l.source.id:l.source;
      const tid = typeof l.target==='object'?l.target.id:l.target;
      return sid===d.name||tid===d.name;
    });
    const activeRels = rels.filter(l=>l.active);
    const relHtml = activeRels.map(r => {
      const sid=typeof r.source==='object'?r.source.id:r.source;
      const tid=typeof r.target==='object'?r.target.id:r.target;
      const other=sid===d.name?tid:sid, arrow=sid===d.name?'→':'←';
      return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;padding:1px 0">
        <span style="color:#22c55e;font-weight:700">${arrow}</span>
        <span style="color:#bbf7d0">${other}</span>
        <span style="color:#71717a;font-family:'Geist Mono',monospace;font-size:9px">${r.fromCol} ${r.card} ${r.toCol}</span>
      </div>`;
    }).join('');

    tooltip.html(`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="background:${getP(d).hdr};color:#fff;padding:1px 7px;border-radius:4px;font-size:9px;font-weight:600">${getP(d).label}</span>
        <strong>${d.name}</strong>
      </div>
      <div style="color:#a1a1aa;font-size:11px;margin-bottom:5px">${d.desc||''}</div>
      <div style="display:flex;gap:10px;font-family:'Geist Mono',monospace;font-size:10px;margin-bottom:${activeRels.length?'6':'0'}px">
        <span style="color:#86efac">${d.cols} cols</span>
        <span style="color:#93c5fd">${d.rows||'—'} filas</span>
        <span style="color:#fde68a">${activeRels.length} rel</span>
      </div>
      ${activeRels.length?`<div style="border-top:1px solid rgba(255,255,255,.08);padding-top:5px">
        <div style="font-size:8px;color:#71717a;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Relaciones</div>
        ${relHtml}</div>`:''}
    `)
    .style('opacity',1).style('transform','translateY(0)')
    .style('left', Math.min(e.offsetX+14, W-320)+'px')
    .style('top', Math.max(e.offsetY-14, 8)+'px');

    // Visual highlight
    d3.select(this).select('.n-bg').attr('stroke-width',3);
    d3.select(this).select('.n-glow').attr('r',NW*0.52).attr('fill', getP(d).glow);
    const conn = new Set([d.name]);
    rels.forEach(l => {
      conn.add(typeof l.source==='object'?l.source.id:l.source);
      conn.add(typeof l.target==='object'?l.target.id:l.target);
    });
    node.style('opacity', nd => conn.has(nd.name)?1:0.18);
    linkPath.attr('stroke-opacity', l => {
      const sid=typeof l.source==='object'?l.source.id:l.source;
      const tid=typeof l.target==='object'?l.target.id:l.target;
      return (sid===d.name||tid===d.name)?1:0.06;
    }).attr('stroke-width', l => {
      const sid=typeof l.source==='object'?l.source.id:l.source;
      const tid=typeof l.target==='object'?l.target.id:l.target;
      return (sid===d.name||tid===d.name)?(l.active?3.5:2):(l.active?2.2:1.2);
    });
    particleDots.attr('opacity', p => {
      const sid=typeof p.link.source==='object'?p.link.source.id:p.link.source;
      const tid=typeof p.link.target==='object'?p.link.target.id:p.link.target;
      return (sid===d.name||tid===d.name)?0.9:0.05;
    });
  })
  .on('mouseleave', function() {
    tooltip.style('opacity',0).style('transform','translateY(4px)');
    d3.select(this).select('.n-bg').attr('stroke-width',1.5);
    d3.select(this).select('.n-glow').attr('r',0).attr('fill','transparent');
    node.style('opacity',1);
    linkPath.attr('stroke-opacity', d=>d.active?0.65:0.35).attr('stroke-width', d=>d.active?2.2:1.2);
    particleDots.attr('opacity',0.6);
  });

  // ── Curved link helper ──
  function linkArc(d) {
    const sx=d.source.x||0, sy=d.source.y||0, tx=d.target.x||0, ty=d.target.y||0;
    const dx=tx-sx, dy=ty-sy, dist=Math.sqrt(dx*dx+dy*dy)||1;
    const ox=(dx/dist)*(NW/2+10), oy=(dy/dist)*(NH/2+10);
    const ex=tx-ox, ey=ty-oy;
    const mx=(sx+ex)/2, my=(sy+ey)/2;
    const nx=-(ey-sy), ny=(ex-sx), nl=Math.sqrt(nx*nx+ny*ny)||1;
    const c=0.1;
    return `M${sx},${sy} Q${mx+(nx/nl)*dist*c},${my+(ny/nl)*dist*c} ${ex},${ey}`;
  }

  // ── Static position update (no simulation) ──
  function updatePositions() {
    linkPath.attr('d', d => linkArc(d));
    activeLinkData.forEach((d, i) => {
      const sx=d.source.x||0, sy=d.source.y||0, tx=d.target.x||0, ty=d.target.y||0;
      const mx=(sx+tx)/2, my=(sy+ty)/2;
      linkLabelText.filter((_,j)=>j===i).attr('x',mx).attr('y',my);
      const tn=linkLabelText.filter((_,j)=>j===i).node();
      if(tn){const bb=tn.getBBox();linkLabelBg.filter((_,j)=>j===i)
        .attr('x',bb.x-4).attr('y',bb.y-2).attr('width',bb.width+8).attr('height',bb.height+4);}
    });
    node.attr('transform', d => `translate(${d.x||0},${d.y||0})`);
  }

  // ── No simulation — pure static layout ──
  // D3 forceLink needs resolved references, so resolve manually
  links.forEach(l => {
    if (typeof l.source === 'string') l.source = nodes.find(n => n.id === l.source) || l.source;
    if (typeof l.target === 'string') l.target = nodes.find(n => n.id === l.target) || l.target;
  });

  _d3sim = null;

  // Initial render
  updatePositions();

  // ── Animate particles ──
  function animateParticles() {
    particles.forEach(p => { p.offset = (p.offset + p.speed) % 1; });
    particleDots.each(function(p) {
      const el = linkPath.filter(l => l === p.link).node();
      if (el) {
        const pt = el.getPointAtLength(p.offset * el.getTotalLength());
        d3.select(this).attr('cx', pt.x).attr('cy', pt.y);
      }
    });
    _d3anim = requestAnimationFrame(animateParticles);
  }
  _d3anim = requestAnimationFrame(animateParticles);
}

// ════════════════════════════════════════════════════════════════
//  TAB SWITCH
// ════════════════════════════════════════════════════════════════
function switchTab(tab) {
  state.activeTab = tab;
  const labels = {resumen:'resumen',modelo:'model',columnas:'colum',medidas:'medid',fuente:'fuent',pdf:'pdf'};
  document.querySelectorAll('.tab').forEach(t => {
    const txt = t.textContent.trim().toLowerCase();
    t.classList.toggle('active', txt.includes(labels[tab]||tab));
  });
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const el = document.getElementById('tab-'+tab);
  if (el) el.classList.add('active');
  if (tab === 'modelo') {
    const doc = state.reportes.find(r => r.id === state.activeId);
    if (doc) setTimeout(() => renderD3Diagram(doc), 50);
  }
}

function toggleFolder(i) {
  const body = document.getElementById('fb-'+i);
  const chev = document.getElementById('fc-'+i);
  const open = body.classList.toggle('open');
  if (chev) { chev.textContent = open ? '▼' : '▶'; chev.classList.toggle('open', open); }
}

// ════════════════════════════════════════════════════════════════
//  CREATE / EDIT / DELETE
// ════════════════════════════════════════════════════════════════
function openModal() {
  document.getElementById('modal-title').textContent = 'Nueva documentación';
  document.getElementById('modal-submit').textContent = 'Crear';
  document.getElementById('modal-form').dataset.editId = '';
  ['f-name','f-desc','f-area','f-responsable'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-direccion').value = '';
  document.getElementById('f-estado').value = 'activo';
  document.getElementById('modal').classList.add('open');
  document.getElementById('f-name').focus();
}

function openEditModal(id) {
  const doc = state.reportes.find(r => r.id === id);
  if (!doc) return;
  document.getElementById('modal-title').textContent = 'Editar documentación';
  document.getElementById('modal-submit').textContent = 'Guardar cambios';
  document.getElementById('modal-form').dataset.editId = id;
  document.getElementById('f-name').value = doc.name || '';
  document.getElementById('f-desc').value = doc.desc || '';
  document.getElementById('f-area').value = doc.area || '';
  document.getElementById('f-responsable').value = doc.responsable || '';
  document.getElementById('f-direccion').value = doc.direccion || '';
  document.getElementById('f-estado').value = doc.estado || 'activo';
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

async function submitModal() {
  const name = document.getElementById('f-name').value.trim();
  if (!name) { showToast('El nombre es obligatorio', '⚠️'); return; }

  const payload = {
    name,
    desc:         document.getElementById('f-desc').value.trim(),
    area:         document.getElementById('f-area').value.trim(),
    responsable:  document.getElementById('f-responsable').value.trim(),
    direccion:    document.getElementById('f-direccion').value.trim(),
    estado:       document.getElementById('f-estado').value,
    compat:       document.getElementById('f-compat').value,
  };

  const editId = document.getElementById('modal-form').dataset.editId;
  try {
    let result;
    if (editId) {
      result = await apiFetch(`/reportes/${editId}`, {
        method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload),
      });
      const idx = state.reportes.findIndex(r => r.id === editId);
      if (idx !== -1) state.reportes[idx] = result;
      showToast('Cambios guardados', '✓');
    } else {
      result = await apiFetch('/reportes', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
      });
      state.reportes.push(result);
      showToast('Documentación creada', '✓');
    }
    closeModal();
    renderSidebar();
    selectDoc(result.id);
  } catch(e) {
    showToast(e.message, '✗');
  }
}

async function confirmDelete(id) {
  if (!confirm('¿Eliminar esta documentación? Esta acción no se puede deshacer.')) return;
  try {
    await apiFetch(`/reportes/${id}`, { method: 'DELETE' });
    state.reportes = state.reportes.filter(r => r.id !== id);
    state.activeId = state.reportes.length > 0 ? state.reportes[0].id : null;
    renderSidebar();
    if (state.activeId) { renderDoc(); }
    else {
      document.getElementById('empty-state').style.display = 'flex';
      document.getElementById('doc-view').style.display = 'none';
    }
    showToast('Documentación eliminada', '🗑️');
  } catch(e) {
    showToast(e.message, '✗');
  }
}

// ════════════════════════════════════════════════════════════════
//  PDF
// ════════════════════════════════════════════════════════════════
async function loadPDF(event, docId) {
  const file = event.target.files[0];
  if (!file || file.type !== 'application/pdf') return;
  await uploadPdfFile(file, docId);
}

function dragOver(event) { event.preventDefault(); document.getElementById('drop-zone')?.classList.add('drag-over'); }
function dragLeave(event) { document.getElementById('drop-zone')?.classList.remove('drag-over'); }

async function dropPDF(event, docId) {
  event.preventDefault();
  dragLeave(event);
  const file = event.dataTransfer.files[0];
  if (!file || file.type !== 'application/pdf') { showToast('Solo se aceptan PDFs', '⚠️'); return; }
  await uploadPdfFile(file, docId);
}

async function uploadPdfFile(file, docId) {
  showToast('Subiendo PDF…', '⏳');
  const form = new FormData();
  form.append('file', file);
  try {
    await apiFetch(`/reportes/${docId}/pdf`, { method: 'POST', body: form });
    const doc = state.reportes.find(r => r.id === docId);
    if (doc) doc.pdfFile = `${docId}.pdf`;
    renderSidebar();
    renderDoc();
    showToast('PDF subido correctamente', '✓');
  } catch(e) {
    showToast(e.message, '✗');
  }
}

async function removePdf(docId) {
  if (!confirm('¿Quitar el PDF adjunto?')) return;
  try {
    await apiFetch(`/reportes/${docId}/pdf`, { method: 'DELETE' });
    const doc = state.reportes.find(r => r.id === docId);
    if (doc) doc.pdfFile = null;
    renderSidebar();
    renderDoc();
    showToast('PDF eliminado', '🗑️');
  } catch(e) {
    showToast(e.message, '✗');
  }
}

// ════════════════════════════════════════════════════════════════
//  EXPORT PDF (API-based executive summary)
// ════════════════════════════════════════════════════════════════
async function exportExecutivePDF(docId) {
  showToast('Generando PDF…', '⏳');
  try {
    const res = await fetch(`${API}/reportes/${docId}/export-pdf`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Error al generar PDF');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docId}-resumen-ejecutivo.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('PDF descargado', '✓');
  } catch (e) {
    showToast(e.message, '✗');
  }
}

// ════════════════════════════════════════════════════════════════
//  POPULATE AREAS in modal select
// ════════════════════════════════════════════════════════════════
function populateDireccionSelect() {
  const sel = document.getElementById('f-direccion');
  const dirs = [...new Set(state.areas.map(a => a.nombre))].sort();
  sel.innerHTML = `<option value="">— Sin dirección —</option>` +
    dirs.map(d => `<option value="${d}">${d}</option>`).join('');
}

// ════════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════════
let toastTimer;
function showToast(msg, icon = '✓') {
  clearTimeout(toastTimer);
  document.getElementById('toast-msg').textContent  = msg;
  document.getElementById('toast-icon').textContent = icon;
  const t = document.getElementById('toast');
  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ════════════════════════════════════════════════════════════════
//  KEYBOARD & EVENTS
// ════════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeJsonUpload();
    closeUsersModal();
    closeUserMenu();
  }
});
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});
document.getElementById('json-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('json-modal')) closeJsonUpload();
});
document.getElementById('users-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('users-modal')) closeUsersModal();
});
document.getElementById('user-menu-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('user-menu-modal')) closeUserMenu();
});
document.getElementById('modal-submit').addEventListener('click', submitModal);

// ── Start ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (loadSession()) {
    // Verify token is still valid
    try {
      const me = await apiFetch('/auth/me', { headers: authHeaders() });
      state.user = me;
      localStorage.setItem('pbi_user', JSON.stringify(me));
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app-shell').style.display = '';
      await init();
      populateDireccionSelect();
    } catch {
      logout();
    }
  } else {
    document.getElementById('login-screen').style.display = 'grid';
    document.getElementById('app-shell').style.display = 'none';
  }
});