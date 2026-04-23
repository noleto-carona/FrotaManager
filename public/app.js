// ===========================
// STATE
// ===========================
const state = {
  motoristas: [],
  gestores: [],
  encarregados: [],
  placas: [],
  statusList: [],
  ordens: [],
  expandedOrderIds: new Set(), // Rastreia quais ordens estão expandidas na lista principal
  // Modal temp state
  modal: {
    isEdit: false,
    ordemId: null,
    // Array of { id?, placa_id, tipo, numero, modelo, servicos: [{id?, descricao, status_id}] }
    tempPlacas: []
  },
  // Panel state
  panel: {
    servicoId: null
  }
};

// ===========================
// API HELPERS
// ===========================
const api = {
  async get(path) {
    const r = await fetch('/api' + path);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Erro na requisição'); }
    return r.json();
  },
  async post(path, body) {
    const r = await fetch('/api' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Erro ao salvar'); }
    return r.json();
  },
  async put(path, body) {
    const r = await fetch('/api' + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Erro ao atualizar'); }
    return r.json();
  },
  async del(path) {
    const r = await fetch('/api' + path, { method: 'DELETE' });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Erro ao excluir'); }
    return r.json();
  }
};

// ===========================
// TOAST & CUSTOM CONFIRM
// ===========================
let toastTimer;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3000);
}

function customConfirm(message, icon = 'fa-question-circle') {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    const iconEl = document.querySelector('#confirm-modal .confirm-icon i');
    const okBtn = document.getElementById('confirm-btn-ok');
    const cancelBtn = document.getElementById('confirm-btn-cancel');

    msgEl.textContent = message;
    if (iconEl) {
      iconEl.className = `fas ${icon}`;
    }
    modal.style.display = 'flex';

    const onOk = () => {
      cleanup();
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      modal.style.display = 'none';
    };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}

function customPrompt(message, defaultValue = '', options = null) {
  return new Promise((resolve) => {
    const modal = document.getElementById('prompt-modal');
    const msgEl = document.getElementById('prompt-message');
    const inputEl = document.getElementById('prompt-input');
    const selectEl = document.getElementById('prompt-select');
    const okBtn = document.getElementById('prompt-btn-ok');
    const cancelBtn = document.getElementById('prompt-btn-cancel');

    msgEl.textContent = message;
    modal.style.display = 'flex';

    if (options) {
      inputEl.style.display = 'none';
      selectEl.style.display = 'block';
      selectEl.innerHTML = options.map(opt => `<option value="${opt.value}" ${opt.value === defaultValue ? 'selected' : ''}>${opt.label}</option>`).join('');
      setTimeout(() => selectEl.focus(), 100);
    } else {
      inputEl.style.display = 'block';
      selectEl.style.display = 'none';
      inputEl.value = defaultValue;
      setTimeout(() => {
        inputEl.focus();
        inputEl.select();
      }, 100);
    }

    const onOk = () => {
      const val = options ? selectEl.value : inputEl.value;
      cleanup();
      resolve(val);
    };

    const onCancel = () => {
      cleanup();
      resolve(null);
    };

    const onKey = (e) => {
      if (e.key === 'Enter') onOk();
      if (e.key === 'Escape') onCancel();
    };

    const cleanup = () => {
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      inputEl.removeEventListener('keydown', onKey);
      selectEl.removeEventListener('keydown', onKey);
      modal.style.display = 'none';
    };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    inputEl.addEventListener('keydown', onKey);
    selectEl.addEventListener('keydown', onKey);
  });
}

// ===========================
// UTILS
// ===========================
function esc(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function fmtDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function statusBadgeHtml(statusObj) {
  if (!statusObj) return '';
  const cor = statusObj.cor || '#94a3b8';
  const nome = statusObj.nome || '';
  // Fallback para ??? se não houver sigla nem nome
  const sigla = (statusObj.sigla || (nome ? nome.substring(0, 3) : '???')).toUpperCase();
  const text = isDark(cor) ? '#ffffff' : '#1e293b';
  
  return `<span class="status-badge" title="${esc(nome)}" style="background:${esc(cor)};color:${text}">${esc(sigla)}</span>`;
}

function isDark(hex) {
  if (!hex) return true;
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
  return (0.299*r + 0.587*g + 0.114*b) < 140;
}

function getStatus(id) {
  return state.statusList.find(s => s.id === id) || null;
}

// ===========================
// TABS
// ===========================
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active-pane', p.id === 'tab-' + tab));
}

// ===========================
// LOAD DATA
// ===========================
async function loadAll() {
  try {
    const [m, g, e, p, s, o] = await Promise.all([
      api.get('/motoristas'),
      api.get('/gestores'),
      api.get('/encarregados'),
      api.get('/placas'),
      api.get('/status'),
      api.get('/ordens')
    ]);
    state.motoristas = m;
    state.gestores = g;
    state.encarregados = e;
    state.placas = p;
    state.statusList = s;
    state.ordens = o;
    renderAll();
  } catch (err) {
    toast('Erro ao carregar dados: ' + err.message, 'error');
  }
}

async function reloadOrdens() {
  try {
    state.ordens = await api.get('/ordens');
    renderOrdens();
  } catch (err) {
    toast('Erro ao recarregar ordens', 'error');
  }
}

function toggleOrdem(id) {
  const el = document.getElementById(`ordem-${id}`);
  if (el) {
    const isCollapsed = el.classList.contains('collapsed');
    if (isCollapsed) {
      state.expandedOrderIds.add(id);
    } else {
      state.expandedOrderIds.delete(id);
    }
    el.classList.toggle('collapsed');
  }
}

// ===========================
// RENDER ALL TABS
// ===========================
function renderAll() {
  renderMotoristas();
  renderGestores();
  renderEncarregados();
  renderPlacas();
  renderStatus();
  renderOrdens();
}

// ===========================
// MOTORISTAS
// ===========================
function renderMotoristas() {
  const el = document.getElementById('lista-motoristas');
  if (!el) return;
  if (!state.motoristas.length) { el.innerHTML = '<div class="empty-msg">Nenhum motorista cadastrado</div>'; return; }
  el.innerHTML = state.motoristas.map(m => `
    <div class="list-item">
      <div class="item-header">
        <span class="item-title"><i class="fas fa-user"></i> ${esc(m.nome)}</span>
        <div class="item-actions">
          <button class="btn btn-xs btn-outline" onclick="editMotorista(${m.id}, '${esc(m.nome)}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-xs btn-danger" onclick="delMotorista(${m.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

async function editMotorista(id, currentNome) {
  const novoNome = await customPrompt('Editar nome do motorista:', currentNome);
  if (novoNome === null || novoNome.trim() === '' || novoNome.trim() === currentNome) return;
  try {
    const updated = await api.put('/motoristas/' + id, { nome: novoNome.trim().toUpperCase() });
    const idx = state.motoristas.findIndex(m => m.id === id);
    if (idx !== -1) state.motoristas[idx] = updated;
    renderMotoristas();
    toast('Motorista atualizado');
  } catch (err) { toast(err.message, 'error'); }
}

async function addMotorista() {
  const inp = document.getElementById('input-motorista');
  const nome = inp.value.trim().toUpperCase();
  if (!nome) return;
  try {
    const m = await api.post('/motoristas', { nome });
    state.motoristas.push(m);
    state.motoristas.sort((a, b) => a.nome.localeCompare(b.nome));
    renderMotoristas();
    inp.value = '';
    toast('Motorista adicionado');
  } catch (err) { toast(err.message, 'error'); }
}

async function delMotorista(id) {
  if (!await customConfirm('Excluir motorista?')) return;
  try {
    await api.del('/motoristas/' + id);
    state.motoristas = state.motoristas.filter(m => m.id !== id);
    renderMotoristas();
    toast('Motorista removido');
  } catch (err) { toast(err.message, 'error'); }
}

// ===========================
// GESTORES
// ===========================
function renderGestores() {
  const el = document.getElementById('lista-gestores');
  if (!el) return;
  if (!state.gestores.length) { el.innerHTML = '<div class="empty-msg">Nenhum gestor cadastrado</div>'; return; }
  el.innerHTML = state.gestores.map(g => `
    <div class="list-item">
      <div class="item-header">
        <span class="item-title"><i class="fas fa-user-tie"></i> ${esc(g.nome)}</span>
        <div class="item-actions">
          <button class="btn btn-xs btn-outline" onclick="editGestor(${g.id}, '${esc(g.nome)}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-xs btn-danger" onclick="delGestor(${g.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

async function editGestor(id, currentNome) {
  const novoNome = await customPrompt('Editar nome do gestor:', currentNome);
  if (novoNome === null || novoNome.trim() === '' || novoNome.trim() === currentNome) return;
  try {
    const updated = await api.put('/gestores/' + id, { nome: novoNome.trim().toUpperCase() });
    const idx = state.gestores.findIndex(g => g.id === id);
    if (idx !== -1) state.gestores[idx] = updated;
    renderGestores();
    toast('Gestor atualizado');
  } catch (err) { toast(err.message, 'error'); }
}

async function addGestor() {
  const inp = document.getElementById('input-gestor');
  const nome = inp.value.trim().toUpperCase();
  if (!nome) return;
  try {
    const g = await api.post('/gestores', { nome });
    state.gestores.push(g);
    state.gestores.sort((a, b) => a.nome.localeCompare(b.nome));
    renderGestores();
    inp.value = '';
    toast('Gestor adicionado');
  } catch (err) { toast(err.message, 'error'); }
}

async function delGestor(id) {
  if (!await customConfirm('Excluir gestor?')) return;
  try {
    await api.del('/gestores/' + id);
    state.gestores = state.gestores.filter(g => g.id !== id);
    renderGestores();
    toast('Gestor removido');
  } catch (err) { toast(err.message, 'error'); }
}

// ===========================
// ENCARREGADOS
// ===========================
function renderEncarregados() {
  const el = document.getElementById('lista-encarregados');
  if (!el) return;
  if (!state.encarregados.length) { el.innerHTML = '<div class="empty-msg">Nenhum encarregado cadastrado</div>'; return; }
  el.innerHTML = state.encarregados.map(e => `
    <div class="list-item">
      <div class="item-header">
        <span class="item-title"><i class="fas fa-hard-hat"></i> ${esc(e.nome)}</span>
        <div class="item-actions">
          <button class="btn btn-xs btn-outline" onclick="editEncarregado(${e.id}, '${esc(e.nome)}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-xs btn-danger" onclick="delEncarregado(${e.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

async function editEncarregado(id, currentNome) {
  const novoNome = await customPrompt('Editar nome do encarregado:', currentNome);
  if (novoNome === null || novoNome.trim() === '' || novoNome.trim() === currentNome) return;
  try {
    const updated = await api.put('/encarregados/' + id, { nome: novoNome.trim().toUpperCase() });
    const idx = state.encarregados.findIndex(e => e.id === id);
    if (idx !== -1) state.encarregados[idx] = updated;
    renderEncarregados();
    toast('Encarregado atualizado');
  } catch (err) { toast(err.message, 'error'); }
}

async function addEncarregado() {
  const inp = document.getElementById('input-encarregado');
  const nome = inp.value.trim().toUpperCase();
  if (!nome) return;
  try {
    const e = await api.post('/encarregados', { nome });
    state.encarregados.push(e);
    state.encarregados.sort((a, b) => a.nome.localeCompare(b.nome));
    renderEncarregados();
    inp.value = '';
    toast('Encarregado adicionado');
  } catch (err) { toast(err.message, 'error'); }
}

async function delEncarregado(id) {
  if (!await customConfirm('Excluir encarregado?')) return;
  try {
    await api.del('/encarregados/' + id);
    state.encarregados = state.encarregados.filter(e => e.id !== id);
    renderEncarregados();
    toast('Encarregado removido');
  } catch (err) { toast(err.message, 'error'); }
}

// ===========================
// PLACAS
// ===========================
function renderPlacas() {
  const el = document.getElementById('lista-placas');
  if (!el) return;
  if (!state.placas.length) { el.innerHTML = '<div class="empty-msg">Nenhuma placa cadastrada</div>'; return; }
  el.innerHTML = state.placas.map(p => `
    <div class="list-item">
      <div class="item-header">
        <span class="item-title"><i class="fas fa-truck"></i> ${esc(p.tipo)} — ${esc(p.numero)}</span>
        <div class="item-actions">
          <button class="btn btn-xs btn-outline" onclick="editPlaca(${p.id})"><i class="fas fa-edit"></i></button>
          <button class="btn btn-xs btn-danger" onclick="delPlaca(${p.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      ${p.modelo ? `<div class="item-desc">${esc(p.modelo)}</div>` : ''}
    </div>
  `).join('');
}

async function editPlaca(id) {
  const p = state.placas.find(x => x.id === id);
  if (!p) return;
  
  const tipo = await customPrompt('Editar tipo:', p.tipo, [
    { value: 'CV', label: 'CV (CAVALO)' },
    { value: 'CR', label: 'CR (CARRETA)' },
    { value: 'TRUCK', label: 'TRUCK' }
  ]);
  if (tipo === null) return;
  
  const numero = await customPrompt('Editar Placa:', p.numero);
  if (numero === null) return;
  
  const modelo = await customPrompt('Editar Marca / Modelo:', p.modelo);
  if (modelo === null) return;
  
  try {
    const updated = await api.put('/placas/' + id, { 
      tipo: tipo.trim().toUpperCase(), 
      numero: numero.trim().toUpperCase(), 
      modelo: modelo.trim().toUpperCase() 
    });
    const idx = state.placas.findIndex(x => x.id === id);
    if (idx !== -1) state.placas[idx] = updated;
    renderPlacas();
    toast('Placa atualizada');
  } catch (err) { toast(err.message, 'error'); }
}

async function addPlaca() {
  const tipo = document.getElementById('input-placa-tipo').value;
  const numero = document.getElementById('input-placa-numero').value.trim().toUpperCase();
  const modelo = document.getElementById('input-placa-modelo').value.trim().toUpperCase();
  if (!tipo || !numero) { toast('Preencha tipo e número', 'error'); return; }
  try {
    const p = await api.post('/placas', { tipo, numero, modelo });
    state.placas.push(p);
    state.placas.sort((a, b) => a.numero.localeCompare(b.numero));
    renderPlacas();
    document.getElementById('input-placa-tipo').value = '';
    document.getElementById('input-placa-numero').value = '';
    document.getElementById('input-placa-modelo').value = '';
    toast('Placa adicionada');
  } catch (err) { toast(err.message, 'error'); }
}

async function delPlaca(id) {
  if (!await customConfirm('Excluir placa?')) return;
  try {
    await api.del('/placas/' + id);
    state.placas = state.placas.filter(p => p.id !== id);
    renderPlacas();
    toast('Placa removida');
  } catch (err) { toast(err.message, 'error'); }
}

// ===========================
// STATUS
// ===========================
function renderStatus() {
  const el = document.getElementById('lista-status');
  if (!el) return;
  if (!state.statusList.length) { el.innerHTML = '<div class="empty-msg">Nenhum status cadastrado</div>'; return; }
  el.innerHTML = state.statusList.map(s => `
    <div class="list-item">
      <div class="item-header">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="status-swatch" style="background:${esc(s.cor)}"></span>
          <span class="status-badge" title="${esc(s.nome)}" style="background:${esc(s.cor)}; color:${isDark(s.cor) ? '#fff' : '#1e293b'}">${esc(s.sigla)}</span>
          <span class="item-title">${esc(s.nome)}</span>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-xs btn-outline" onclick="editStatus(${s.id})" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn btn-xs btn-danger" onclick="delStatus(${s.id})" title="Excluir"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

async function editStatus(id) {
  const s = state.statusList.find(x => x.id === id);
  if (!s) return;

  const novoNome = await customPrompt('Nome do status:', s.nome);
  if (novoNome === null) return;
  if (!novoNome.trim()) { toast('Nome obrigatório', 'error'); return; }

  const novaSigla = await customPrompt('Sigla (3 letras):', s.sigla || s.nome.substring(0, 3).toUpperCase());
  if (novaSigla === null) return;
  const siglaFinal = novaSigla.trim().substring(0, 3).toUpperCase();

  // Para cor, como não temos um color picker no customPrompt simples, podemos manter ou pedir hex
  // Mas para simplificar e não complicar o UI agora, vamos manter a cor ou pedir se o usuário quiser.
  // Por enquanto, vamos focar em Nome e Sigla que é o que o usuário pediu.
  
  try {
    await api.put('/status/' + id, { 
      nome: novoNome.trim().toUpperCase(), 
      sigla: siglaFinal,
      cor: s.cor 
    });
    
    // Atualiza localmente
    s.nome = novoNome.trim().toUpperCase();
    s.sigla = siglaFinal;
    
    // Atualiza as ordens na memória para refletir a mudança de nome/sigla imediatamente
    state.ordens.forEach(o => {
      o.placas.forEach(p => {
        p.servicos.forEach(ser => {
          if (ser.status_id === id) {
            ser.status_nome = s.nome;
            ser.status_sigla = s.sigla;
          }
        });
      });
    });

    renderStatus();
    renderOrdens();
    toast('Status atualizado');
  } catch (err) { toast(err.message, 'error'); }
}

async function addStatus() {
  const nome = document.getElementById('input-status').value.trim().toUpperCase();
  const sigla = document.getElementById('input-status-sigla').value.trim().toUpperCase();
  const cor = document.getElementById('input-status-cor').value;
  
  if (!nome) { toast('Informe o nome do status', 'error'); return; }
  
  try {
    const s = await api.post('/status', { nome, sigla, cor });
    state.statusList.push(s);
    renderStatus();
    document.getElementById('input-status').value = '';
    document.getElementById('input-status-sigla').value = '';
    toast('Status adicionado');
  } catch (err) { toast(err.message, 'error'); }
}

async function delStatus(id) {
  if (!await customConfirm('Excluir status?')) return;
  try {
    await api.del('/status/' + id);
    state.statusList = state.statusList.filter(s => s.id !== id);
    renderStatus();
    toast('Status removido');
  } catch (err) { toast(err.message, 'error'); }
}

// ===========================
// ORDENS — RENDER
// ===========================
function renderOrdens() {
  const el = document.getElementById('lista-ordens');
  if (!el) return;
  if (!state.ordens.length) {
    el.innerHTML = '<div class="empty-msg"><i class="fas fa-clipboard" style="font-size:2rem;opacity:.3"></i><br>Nenhuma ordem. Clique em "Nova Ordem".</div>';
    return;
  }

  // Pegar valores dos filtros
  const fStatus = document.getElementById('filter-status').value;
  const fDate = document.getElementById('filter-date').value; // YYYY-MM-DD
  const fOS = document.getElementById('filter-os').value.trim();

  // Filtrar ordens
  const ordensFiltradas = state.ordens.filter(o => {
    // 1. Filtro por Status
    let hasServicoAtivo = false;
    let totalServicos = 0;

    if (o.placas && o.placas.length > 0) {
      o.placas.forEach(p => {
        p.servicos.forEach(s => {
          totalServicos++;
          const sigla = (s.status_sigla || '').trim().toUpperCase();
          if (sigla !== 'FIN') hasServicoAtivo = true;
        });
      });
    }

    const isFinalizado = totalServicos > 0 && !hasServicoAtivo;

    if (fStatus === 'ativos' && isFinalizado) return false;
    if (fStatus === 'finalizados' && !isFinalizado) return false;

    // 2. Filtro por Data (Previsao)
    if (fDate) {
      // o.previsao é "DD/MM/YY HH:MM"
      if (!o.previsao) return false;
      const parts = o.previsao.split(' ');
      const dParts = parts[0].split('/'); // [DD, MM, YY]
      if (dParts.length === 3) {
        const fullYear = dParts[2].length === 2 ? '20' + dParts[2] : dParts[2];
        const oDateStr = `${fullYear}-${dParts[1]}-${dParts[0]}`; // YYYY-MM-DD
        if (oDateStr !== fDate) return false;
      } else {
        return false;
      }
    }

    // 3. Filtro por Nº OS (o.codigo é OS-XXXX)
    if (fOS) {
      const codeNum = o.codigo.replace('OS-', '');
      if (!codeNum.includes(fOS)) return false;
    }

    return true;
  });

  if (!ordensFiltradas.length) {
    el.innerHTML = '<div class="empty-msg"><i class="fas fa-search" style="font-size:2rem;opacity:.3"></i><br>Nenhuma ordem encontrada para os filtros aplicados.</div>';
    return;
  }

  el.innerHTML = ordensFiltradas.map(o => {
    const firstPlacaNum = o.placas && o.placas.length > 0 ? o.placas[0].numero : '';
    const motoristaNome = o.motorista_nome || 'SEM MOTORISTA';
    
    // Padrão simplificado: Apenas o código da OS
    const osTitle = o.codigo;

    // Determina o status global da Ordem
    let hasNaoFinalizado = false;
    let hasAndamento = false;
    let totalS = 0;

    o.placas.forEach(p => {
      p.servicos.forEach(s => {
        totalS++;
        const sigla = (s.status_sigla || '').trim().toUpperCase();
        if (sigla !== 'FIN') {
          hasNaoFinalizado = true;
        }
        if (sigla === 'AND') {
          hasAndamento = true;
        }
      });
    });
    
    let globalStatusText = 'PEN';
    
    // Prioriza o status manual se definido na ordem
    if (o.status_sigla) {
      globalStatusText = o.status_sigla;
    } else if (totalS > 0) {
      if (!hasNaoFinalizado) {
        globalStatusText = 'FIN';
      } else if (hasAndamento) {
        globalStatusText = 'AND';
      } else {
        globalStatusText = 'PEN';
      }
    }
    
    // Busca o status real no banco de dados pela sigla para pegar a cor e nome corretos
    const realStatus = state.statusList.find(s => (s.sigla || '').toUpperCase() === globalStatusText) || {
      nome: globalStatusText === 'FIN' ? 'FINALIZADO' : (globalStatusText === 'AND' ? 'EM ANDAMENTO' : 'PENDENTE'),
      cor: globalStatusText === 'FIN' ? '#10b981' : (globalStatusText === 'AND' ? '#3b82f6' : '#f59e0b'),
      sigla: globalStatusText
    };

    const textColor = isDark(realStatus.cor) ? '#ffffff' : '#1e293b';
    const globalStatusHtml = `<span class="status-badge" title="${esc(realStatus.nome)}" style="background:${esc(realStatus.cor)}; color:${textColor}; font-size: 0.65rem; width: 42px; justify-content: center; height: 22px; box-shadow: 0 2px 8px ${realStatus.cor}66;">${esc(realStatus.sigla)}</span>`;

    const placasHtml = o.placas.map(p => {
      const tipoUp = (p.tipo || '').toUpperCase();
      const kmLabel = tipoUp === 'CR' ? 'Horímetro' : 'KM';
      const kmHtml = p.km_horimetro != null
        ? `<span style="font-size:0.7rem;color:rgba(255,255,255,0.85);margin-left:6px">${kmLabel}: <b>${p.km_horimetro}</b></span>`
        : '';

      const servicosHtml = p.servicos.map((s, idx) => {
        const obsCount = (s.observacoes || []).length;
        return `
          <div class="servico-item" onclick="openPanel(${s.id}, ${idx + 1})" title="Clique para editar">
            <div class="servico-item-body">
              <div class="servico-desc"><span style="color:#2c7da0;font-weight:800;margin-right:4px">${idx + 1}.</span>${esc(s.descricao)}</div>
              ${obsCount ? `<div class="servico-obs-count"><i class="fas fa-comment-dots"></i> ${obsCount} observaç${obsCount > 1 ? 'ões' : 'ão'}</div>` : ''}
            </div>
            ${statusBadgeHtml({ nome: s.status_nome, sigla: s.status_sigla, cor: s.status_cor })}
          </div>
        `;
      }).join('');

      return `
        <div class="placa-block">
          <div class="placa-label"><i class="fas fa-truck"></i> ${esc(p.tipo)} — ${esc(p.numero)}${p.modelo ? ` <span style="font-weight:400;opacity:0.8">(${esc(p.modelo)})</span>` : ''}${kmHtml}</div>
          ${servicosHtml || '<div style="font-size:0.75rem;color:rgba(255,255,255,0.65);padding:4px 0">Sem serviços</div>'}
        </div>
      `;
    }).join('');

    const obsHtml = o.observacao 
      ? `<div class="ordem-obs priority-active" data-text="${esc(o.observacao)}"><i class="fas fa-sticky-note"></i> ${esc(o.observacao)}</div>` 
      : '';

    const waStatusClass = o.enviada_whatsapp ? 'sent' : 'not-sent';
    const collapsedClass = state.expandedOrderIds.has(o.id) ? '' : 'collapsed';

    return `
      <div class="ordem-card ${collapsedClass} ${waStatusClass}" id="ordem-${o.id}">
        <div class="ordem-header-click" onclick="toggleOrdem(${o.id})">
          <div class="header-main-info" style="gap: 12px; margin-left: 4px;">
            <i class="fas fa-chevron-down expand-icon" style="margin-left: 0;"></i>
            ${globalStatusHtml}
            <div class="ordem-codigo">${esc(osTitle)}</div>
          </div>
          <div class="item-actions" onclick="event.stopPropagation()">
            <button class="btn btn-xs btn-outline" onclick="editOrdem(${o.id})" title="Editar ordem"><i class="fas fa-edit"></i></button>
            <button class="btn btn-xs btn-danger" onclick="delOrdem(${o.id})" title="Excluir ordem"><i class="fas fa-trash"></i></button>
            <button class="btn btn-xs btn-wa ${waStatusClass}" onclick="shareWA(${o.id})" title="WhatsApp"><i class="fab fa-whatsapp"></i></button>
          </div>
        </div>

        <div class="ordem-body">
          <div class="ordem-motorista" style="margin-top:10px"><i class="fas fa-user"></i> ${esc(o.motorista_nome || '—')}</div>
          <div class="ordem-meta">
            Gestor: <b>${esc(o.gestor_nome || '—')}</b> &nbsp;|&nbsp; Encarregado: <b>${esc(o.encarregado_nome || '—')}</b><br>
            ${o.destino ? `Destino: <b>${esc(o.destino)}</b> &nbsp;|&nbsp; ` : ''}
            ${o.situacao ? `Situação: <b>${esc(o.situacao)}</b> &nbsp;|&nbsp; ` : ''}
            ${o.previsao ? `Previsão: <b>${esc(o.previsao)}</b>` : ''}
          </div>
          ${obsHtml}
          ${placasHtml}
          <div class="ordem-footer" style="margin-top:12px;display:flex;justify-content:center">
            <button class="btn btn-wa btn-sm ${waStatusClass}" style="width:100%;justify-content:center" onclick="shareWA(${o.id})">
              <i class="fab fa-whatsapp"></i> Enviar p/ WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function delOrdem(id) {
  if (!await customConfirm('Excluir esta ordem permanentemente?')) return;
  try {
    await api.del('/ordens/' + id);
    state.ordens = state.ordens.filter(o => o.id !== id);
    state.expandedOrderIds.delete(id);
    renderOrdens();
    toast('Ordem excluída');
  } catch (err) { toast(err.message, 'error'); }
}

// ===========================
// WHATSAPP SHARE
// ===========================
function shareWA(ordemId) {
  const o = state.ordens.find(x => x.id === ordemId);
  if (!o) return;

  const p0 = o.placas && o.placas[0];
  const waTitle = p0
    ? `ORDEM DE SERVIÇO — ${o.codigo} - ${p0.numero}`
    : `ORDEM DE SERVIÇO — ${o.codigo}`;

  let msg = `*${waTitle}*\n`;
  msg += `Motorista: ${o.motorista_nome || '—'}\n`;
  if (o.destino) msg += `Destino: ${o.destino}\n`;
  if (o.situacao) msg += `Situação: ${o.situacao}\n`;
  if (o.previsao) msg += `Previsão: ${o.previsao}\n`;
  if (o.observacao) msg += `Obs: ${o.observacao}\n`;
  msg += '\n*SERVIÇOS POR PLACA:*\n';

  o.placas.forEach(p => {
    const tipoUp = (p.tipo || '').toUpperCase();
    const kmLabel = tipoUp === 'CR' ? 'Horímetro' : 'KM';
    const kmStr = p.km_horimetro != null ? ` | ${kmLabel}: ${p.km_horimetro}` : '';
    msg += `\n*${p.tipo} ${p.numero}${p.modelo ? ` (${p.modelo})` : ''}${kmStr}*\n`;
    p.servicos.forEach((s, idx) => {
      const statusLabel = s.status_sigla || s.status_nome || 'S/Status';
      msg += `   *${idx + 1}. ${s.descricao} [${statusLabel}]*\n`;
      if (s.fotos && s.fotos.length) {
        msg += `      _📷 Possui ${s.fotos.length} foto(s)_\n`;
      }
      if (s.observacoes && s.observacoes.length) {
        s.observacoes.forEach(ob => {
          msg += `      _• ${fmtDate(ob.created_at)}: ${ob.texto}_\n`;
        });
      }
    });
  });

  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  
  // Mark as sent in DB
  api.post(`/ordens/${ordemId}/whatsapp`, {}).then(() => {
    toast('Ordem marcada como enviada', 'success');
    reloadOrdens();
  }).catch(err => {
    console.error('Erro ao marcar como enviada:', err);
    toast('Erro ao atualizar status do WhatsApp', 'error');
  });
}

// ===========================
// ORDEM MODAL
// ===========================
function buildSelects(ordem) {
  const fill = (id, arr, selId, label) => {
    const el = document.getElementById(id);
    if (!el) return;
    const options = arr.map(a => `<option value="${a.id}" ${a.id == selId ? 'selected' : ''}>${esc(a.nome)}</option>`).join('');
    el.innerHTML = `<option value="" ${!selId ? 'selected' : ''} disabled>SELECIONE ${label}...</option>` + options;
  };
  fill('modal-motorista', state.motoristas, ordem && ordem.motorista_id, 'MOTORISTA');
  fill('modal-gestor', state.gestores, ordem && ordem.gestor_id, 'GESTOR');
  fill('modal-encarregado', state.encarregados, ordem && ordem.encarregado_id, 'ENCARREGADO');

  // Fill status global
  const statusEl = document.getElementById('modal-status-global');
  if (statusEl) {
    const hasPending = state.modal.tempPlacas.some(p => p.servicos.some(s => {
      const st = state.statusList.find(x => x.id === s.status_id);
      return st && st.sigla !== 'FIN';
    }));

    const options = state.statusList.map(s => {
      const isFin = s.sigla === 'FIN';
      const hasPendingForOption = state.modal.tempPlacas.some(p => p.servicos.some(sv => {
        const st = state.statusList.find(x => x.id === sv.status_id);
        return st && st.sigla !== 'FIN';
      }));

      const disabled = (isFin && hasPendingForOption) ? 'disabled' : '';
      const selected = (ordem && ordem.status_id == s.id) ? 'selected' : '';
      const label = isFin && hasPendingForOption ? `${esc(s.nome)} (BLOQUEADO - HÁ PENDÊNCIAS)` : esc(s.nome);
      return `<option value="${s.id}" ${selected} ${disabled}>${label}</option>`;
    }).join('');

    statusEl.innerHTML = `<option value="" ${!(ordem && ordem.status_id) ? 'selected' : ''} disabled>SELECIONE STATUS...</option>` + options;
    
    // Permission restriction: Only Encarregado or Gestor can change Global Status
    const userRole = localStorage.getItem('userRole');
    
    // Se não houver role definida, vamos assumir GESTOR para teste, 
    // mas o ideal é que o sistema de login defina isso.
    // Para resolver o problema de "não clicável", vamos garantir que só bloqueie se for explicitamente MOTORISTA.
    if (userRole === 'MOTORISTA') {
      statusEl.disabled = true;
      statusEl.style.backgroundColor = '#f1f5f9';
      statusEl.style.cursor = 'not-allowed';
      statusEl.title = 'Apenas Encarregados ou Gestores podem alterar o status global';
    } else {
      statusEl.disabled = false;
      statusEl.style.backgroundColor = '';
      statusEl.style.cursor = '';
      statusEl.title = '';
    }
  }
}

function openNovaOrdem() {
  if (!state.motoristas.length || !state.gestores.length || !state.encarregados.length) {
    toast('Cadastre motoristas, gestores e encarregados antes', 'error'); return;
  }
  if (!state.placas.length) {
    toast('Cadastre pelo menos uma placa antes', 'error'); return;
  }

  state.modal.isEdit = false;
  state.modal.ordemId = null;
  state.modal.tempPlacas = [];

  document.getElementById('modal-title').textContent = 'Nova Ordem de Serviço';
  document.getElementById('modal-ordem-id').value = '';
  document.getElementById('modal-destino').value = '';
  document.getElementById('modal-situacao').value = '';
  document.getElementById('modal-observacao').value = '';
  document.getElementById('placa-picker').style.display = 'none';

  // Set default date and time
  const agora = new Date();
  document.getElementById('modal-previsao-data').value = agora.toISOString().split('T')[0];
  document.getElementById('modal-previsao-hora').value = agora.toTimeString().slice(0, 5);

  buildSelects(null);
  renderModalPlacas();
  toggleModalFields(false); // Reset to expanded
  document.getElementById('ordem-modal').style.display = 'flex';
}

function editOrdem(ordemId) {
  const o = state.ordens.find(x => x.id === ordemId);
  if (!o) return;

  state.modal.isEdit = true;
  state.modal.ordemId = ordemId;
  // Deep copy placas with servicos (carry ids so backend can reconcile)
  state.modal.tempPlacas = o.placas.map(p => ({
    id: p.id,
    placa_id: p.placa_id,
    tipo: p.tipo,
    numero: p.numero,
    modelo: p.modelo,
    km_horimetro: p.km_horimetro,
    servicos: p.servicos.map(s => ({ id: s.id, descricao: s.descricao, status_id: s.status_id }))
  }));

  document.getElementById('modal-title').textContent = 'Editar Ordem — ' + o.codigo;
  document.getElementById('modal-ordem-id').value = o.id;
  document.getElementById('modal-destino').value = o.destino || '';
  document.getElementById('modal-situacao').value = o.situacao || '';
  document.getElementById('modal-observacao').value = o.observacao || '';
  document.getElementById('placa-picker').style.display = 'none';

  // Split date and time from previsao
  if (o.previsao) {
    const parts = o.previsao.split(' ');
    if (parts.length >= 2) {
      // Expecting "DD/MM/YY HH:MM" or similar, but stored in API as "DD/MM/YY HH:MM"
      // Let's try to convert back to YYYY-MM-DD for input[type=date]
      const dParts = parts[0].split('/');
      if (dParts.length === 3) {
        const fullYear = dParts[2].length === 2 ? '20' + dParts[2] : dParts[2];
        document.getElementById('modal-previsao-data').value = `${fullYear}-${dParts[1]}-${dParts[0]}`;
      }
      document.getElementById('modal-previsao-hora').value = parts[1];
    }
  } else {
    const agora = new Date();
    document.getElementById('modal-previsao-data').value = agora.toISOString().split('T')[0];
    document.getElementById('modal-previsao-hora').value = agora.toTimeString().slice(0, 5);
  }

  buildSelects(o);
  renderModalPlacas();
  
  // Se já tiver placas, inicia minimizado para focar nos serviços
  if (state.modal.tempPlacas.length > 0) {
    toggleModalFields(true);
  } else {
    toggleModalFields(false);
  }

  document.getElementById('ordem-modal').style.display = 'flex';
}

function closeOrdemModal() {
  document.getElementById('ordem-modal').style.display = 'none';
}

function toggleModalFields(force) {
  const container = document.getElementById('modal-fields-container');
  const btn = document.getElementById('btn-toggle-modal-fields');
  
  const shouldCollapse = force !== undefined ? force : !container.classList.contains('collapsed');
  
  container.classList.toggle('collapsed', shouldCollapse);
  btn.classList.toggle('collapsed', shouldCollapse);
}

function renderModalPlacas() {
  const container = document.getElementById('modal-placas-container');
  if (!container) return;

  if (!state.modal.tempPlacas.length) {
    container.innerHTML = '<div class="empty-msg" style="padding:12px">Nenhuma placa. Clique em "Adicionar Placa".</div>';
    return;
  }

  const statusOptions = state.statusList.map(s => {
    const sigla = (s.sigla || s.nome.substring(0, 3)).toUpperCase();
    return `<option value="${s.id}">${esc(sigla)} - ${esc(s.nome)}</option>`;
  }).join('');

  container.innerHTML = state.modal.tempPlacas.map((p, pi) => {
    const tipoUp = (p.tipo || '').toUpperCase();
    const kmLabel = tipoUp === 'CR' ? 'Horímetro' : 'KM';
    const kmHtml = p.km_horimetro != null
      ? `<div style="font-size:0.72rem;color:rgba(255,255,255,0.8);margin-top:2px">${kmLabel}: <b>${p.km_horimetro}</b></div>`
      : '';

    const servicosHtml = p.servicos.map((s, si) => {
      const stObj = state.statusList.find(x => x.id === s.status_id);
      return `
        <div class="modal-servico-row">
          <div class="modal-servico-text">
            <span style="color:var(--primary-blue);font-weight:800;margin-right:4px">${si + 1}.</span>
            <span style="font-size:0.8rem">${esc(s.descricao)}</span>
            ${stObj ? statusBadgeHtml(stObj) : ''}
          </div>
          <div class="modal-servico-actions">
            <button class="btn btn-xs btn-outline" onclick="openPanel(${s.id || 'null'}, ${si + 1}, ${pi}, ${si})"><i class="fas fa-camera"></i></button>
            <button class="btn btn-xs btn-danger" onclick="removeServicModal(${pi},${si})"><i class="fas fa-times"></i></button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="modal-placa-block">
        <div class="item-header" style="margin-bottom:8px">
          <div>
            <span style="font-size:0.85rem;font-weight:700"><i class="fas fa-truck"></i> ${esc(p.tipo)} — ${esc(p.numero)}${p.modelo ? ` (${esc(p.modelo)})` : ''}</span>
            ${kmHtml}
          </div>
          <button class="btn btn-xs btn-danger" onclick="removePlacaModal(${pi})"><i class="fas fa-trash"></i> Remover</button>
        </div>
        ${servicosHtml || '<div style="font-size:0.73rem;color:rgba(255,255,255,0.7);padding:4px 0">Sem serviços</div>'}
        <div class="add-servico-form">
          <input type="text" placeholder="Descrição do serviço..." id="new-serv-desc-${pi}">
          <select id="new-serv-status-${pi}">${statusOptions}</select>
          <button class="btn btn-xs" onclick="addServicModal(${pi})"><i class="fas fa-plus"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function togglePlacaPicker() {
  const picker = document.getElementById('placa-picker');
  const isVisible = picker.style.display !== 'none';
  if (isVisible) { picker.style.display = 'none'; return; }

  const usedIds = new Set(state.modal.tempPlacas.map(p => p.placa_id));
  const available = state.placas.filter(p => !usedIds.has(p.id));

  if (!available.length) {
    toast('Todas as placas já foram adicionadas', 'error'); return;
  }

  document.getElementById('placa-picker-list').innerHTML = available.map(p =>
    `<span class="placa-chip" onclick="addPlacaModal(${p.id})"><i class="fas fa-truck"></i> ${esc(p.tipo)} ${esc(p.numero)}${p.modelo ? ` (${esc(p.modelo)})` : ''}</span>`
  ).join('');

  picker.style.display = 'block';
}

function addPlacaModal(placaId) {
  const p = state.placas.find(x => x.id === placaId);
  if (!p) return;

  const tipo = (p.tipo || '').toUpperCase();
  document.getElementById('placa-km-selected-id').value = placaId;

  if (tipo === 'CV' || tipo === 'HR' || tipo === 'CR') {
     document.getElementById('placa-km-label').textContent = (tipo === 'CR' ? 'Horímetro Atual' : 'KM Atual');
     document.getElementById('placa-km-input').value = '';
     document.getElementById('placa-km-form').style.display = 'block';
     document.getElementById('placa-picker-list').style.display = 'none';
     // Auto focus
     setTimeout(() => document.getElementById('placa-km-input').focus(), 100);
   } else {
    // Just add directly if no KM/Horímetro needed
    state.modal.tempPlacas.push({ placa_id: p.id, tipo: p.tipo, numero: p.numero, modelo: p.modelo, km_horimetro: null, servicos: [] });
    document.getElementById('placa-picker').style.display = 'none';
    renderModalPlacas();
    
    // Minimiza os campos principais após adicionar a primeira placa
    if (state.modal.tempPlacas.length === 1) {
      toggleModalFields(true);
    }
  }
}

function confirmAddPlacaModal() {
  const placaId = parseInt(document.getElementById('placa-km-selected-id').value);
  const kmVal = document.getElementById('placa-km-input').value;
  const p = state.placas.find(x => x.id === placaId);
  if (!p) return;

  state.modal.tempPlacas.push({
    placa_id: p.id,
    tipo: p.tipo,
    numero: p.numero,
    modelo: p.modelo,
    km_horimetro: kmVal ? parseFloat(kmVal) : null,
    servicos: []
  });

  cancelKmStep();
  document.getElementById('placa-picker').style.display = 'none';
  renderModalPlacas();
  
  // Minimiza os campos principais após adicionar a primeira placa
  if (state.modal.tempPlacas.length === 1) {
    toggleModalFields(true);
  }
}

function cancelKmStep() {
  document.getElementById('placa-km-form').style.display = 'none';
  document.getElementById('placa-picker-list').style.display = 'block';
  document.getElementById('placa-km-input').value = '';
}

function removePlacaModal(pi) {
  state.modal.tempPlacas.splice(pi, 1);
  renderModalPlacas();
  
  // Se não sobrar nenhuma placa, expande os campos novamente
  if (state.modal.tempPlacas.length === 0) {
    toggleModalFields(false);
  }
}

async function addServicModal(pi) {
  const descEl = document.getElementById(`new-serv-desc-${pi}`);
  const statusEl = document.getElementById(`new-serv-status-${pi}`);
  const desc = descEl ? descEl.value.trim().toUpperCase() : '';
  if (!desc) { toast('Digite a descrição do serviço', 'error'); return; }
  const status_id = statusEl ? parseInt(statusEl.value) : null;
  
  state.modal.tempPlacas[pi].servicos.push({ descricao: desc, status_id });
  
  // Salvamento automático da ordem
  toast('Salvando ordem e vinculando serviço...', 'info');
  const savedOrdem = await saveOrdemSilent();
  
  if (savedOrdem) {
    // Sempre limpa os campos e atualiza a lista no modal, independente da escolha de fotos
    renderModalPlacas();
    
    // Re-build selects to update Global Status validation if needed
    buildSelects(savedOrdem);

    if (await customConfirm('Deseja adicionar fotos para este serviço agora?', 'fa-camera')) {
      // Localiza o ID do serviço que acabamos de salvar
      const placaSalva = savedOrdem.placas[pi];
      const servicoSalvo = placaSalva.servicos[placaSalva.servicos.length - 1];
      
      if (servicoSalvo) {
        openPanel(servicoSalvo.id, placaSalva.servicos.length);
      }
    } else {
      toast('Serviço adicionado. Continue lançando...', 'success');
    }
  }
}

async function saveOrdemSilent() {
  const motorista_id = parseInt(document.getElementById('modal-motorista').value);
  const gestor_id = parseInt(document.getElementById('modal-gestor').value);
  const encarregado_id = parseInt(document.getElementById('modal-encarregado').value);

  if (!motorista_id || !gestor_id || !encarregado_id) { 
    toast('Preencha Motorista, Gestor e Encarregado antes de adicionar itens', 'warning'); 
    return null; 
  }

  // Format date and time for previsao
  const pData = document.getElementById('modal-previsao-data').value;
  const pHora = document.getElementById('modal-previsao-hora').value;
  let previsaoFmt = '';
  if (pData && pHora) {
    const [y, m, d] = pData.split('-');
    previsaoFmt = `${d}/${m}/${y.slice(-2)} ${pHora}`;
  }

    const body = {
      motorista_id,
      gestor_id,
      encarregado_id,
      status_id: parseInt(document.getElementById('modal-status-global').value) || null,
      destino: document.getElementById('modal-destino').value.trim().toUpperCase(),
      situacao: document.getElementById('modal-situacao').value.trim().toUpperCase(),
      previsao: previsaoFmt,
      observacao: document.getElementById('modal-observacao').value.trim().toUpperCase(),
      placas: state.modal.tempPlacas.map(p => ({
        id: p.id || undefined,
        placa_id: p.placa_id,
        km_horimetro: p.km_horimetro,
        servicos: p.servicos.map(s => ({ id: s.id, descricao: s.descricao, status_id: s.status_id }))
      }))
    };

  try {
    let result;
    if (state.modal.isEdit) {
      result = await api.put('/ordens/' + state.modal.ordemId, body);
    } else {
      result = await api.post('/ordens', body);
      state.modal.isEdit = true;
      state.modal.ordemId = result.id;
    }
    
    await reloadOrdens();
    // Atualiza os dados temporários do modal com o que veio do banco (incluindo os IDs novos)
    state.modal.tempPlacas = result.placas.map(p => ({
      id: p.id,
      placa_id: p.placa_id,
      tipo: p.tipo,
      numero: p.numero,
      modelo: p.modelo,
      km_horimetro: p.km_horimetro,
      servicos: p.servicos.map(s => ({ id: s.id, descricao: s.descricao, status_id: s.status_id }))
    }));
    
    return result;
  } catch (err) { 
    toast('Erro ao salvar automaticamente: ' + err.message, 'error');
    return null;
  }
}

function removeServicModal(pi, si) {
  state.modal.tempPlacas[pi].servicos.splice(si, 1);
  renderModalPlacas();
  
  // Re-build selects to update Global Status validation if needed
  const o = state.modal.ordemId ? state.ordens.find(x => x.id === state.modal.ordemId) : null;
  buildSelects(o);
}

async function saveOrdemModal() {
  const motorista_id = parseInt(document.getElementById('modal-motorista').value);
  const gestor_id = parseInt(document.getElementById('modal-gestor').value);
  const encarregado_id = parseInt(document.getElementById('modal-encarregado').value);

  if (!motorista_id) { toast('Selecione um motorista', 'error'); return; }
  if (!gestor_id) { toast('Selecione um gestor', 'error'); return; }
  if (!encarregado_id) { toast('Selecione um encarregado', 'error'); return; }

  if (!state.modal.tempPlacas.length) { toast('Adicione pelo menos uma placa', 'error'); return; }
  const hasServico = state.modal.tempPlacas.some(p => p.servicos.length > 0);
  if (!hasServico) { toast('Adicione pelo menos um serviço', 'error'); return; }

  // Format date and time for previsao
  const pData = document.getElementById('modal-previsao-data').value;
  const pHora = document.getElementById('modal-previsao-hora').value;
  let previsaoFmt = '';
  if (pData && pHora) {
    const [y, m, d] = pData.split('-');
    previsaoFmt = `${d}/${m}/${y.slice(-2)} ${pHora}`;
  }

  const body = {
    motorista_id: parseInt(document.getElementById('modal-motorista').value),
    gestor_id: parseInt(document.getElementById('modal-gestor').value),
    encarregado_id: parseInt(document.getElementById('modal-encarregado').value),
    status_id: parseInt(document.getElementById('modal-status-global').value) || null,
    destino: document.getElementById('modal-destino').value.trim().toUpperCase(),
    situacao: document.getElementById('modal-situacao').value.trim().toUpperCase(),
    previsao: previsaoFmt,
    observacao: document.getElementById('modal-observacao').value.trim().toUpperCase(),
    placas: state.modal.tempPlacas.map(p => ({
      id: p.id || undefined,
      placa_id: p.placa_id,
      km_horimetro: p.km_horimetro,
      servicos: p.servicos.map(s => ({
        id: s.id || undefined,
        descricao: s.descricao,
        status_id: s.status_id || null
      }))
    }))
  };

  const btn = document.getElementById('btn-modal-save');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    if (state.modal.isEdit) {
      const updated = await api.put('/ordens/' + state.modal.ordemId, body);
      const idx = state.ordens.findIndex(o => o.id === state.modal.ordemId);
      if (idx !== -1) state.ordens[idx] = updated;
      toast('Ordem atualizada');
    } else {
      const created = await api.post('/ordens', body);
      state.ordens.unshift(created);
      toast('Ordem criada — ' + created.codigo, 'success');
    }
    renderOrdens();
    closeOrdemModal();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Salvar Ordem';
  }
}

// ===========================
// SERVICE PANEL
// ===========================
async function openPanel(servicoId, idx, pi, si) {
  // Se o servicoId for null, significa que é um serviço novo que ainda não foi salvo no banco.
  // Precisamos avisar o usuário que fotos só podem ser adicionadas a serviços já salvos.
  if (!servicoId || servicoId === 'null') {
    toast('Salve a Ordem de Serviço antes de adicionar fotos', 'warning');
    return;
  }

  state.panel.servicoId = servicoId;
  document.getElementById('panel-servico-id').value = servicoId;
  
  const title = idx ? `Editar Serviço #${idx}` : 'Editar Serviço';
  document.querySelector('#servico-panel .panel-header h4').innerHTML = `<i class="fas fa-wrench"></i> ${title}`;

  // Limpa grid de fotos
  renderFotosGrid([]);

  // Populate status select
  const statusSel = document.getElementById('panel-status');
  statusSel.innerHTML = state.statusList.map(s => {
    const sigla = (s.sigla || s.nome.substring(0, 3)).toUpperCase();
    return `<option value="${s.id}">${esc(sigla)} - ${esc(s.nome)}</option>`;
  }).join('');

  // Permission restriction for service status
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'MOTORISTA') {
    statusSel.disabled = true;
    statusSel.style.backgroundColor = '#f1f5f9';
    statusSel.style.cursor = 'not-allowed';
    statusSel.title = 'Apenas Encarregados ou Gestores podem alterar o status do serviço';
  } else {
    statusSel.disabled = false;
    statusSel.style.backgroundColor = '';
    statusSel.style.cursor = '';
    statusSel.title = '';
  }

  try {
    const s = await api.get('/servicos/' + servicoId);
    document.getElementById('panel-descricao').value = s.descricao || '';
    if (s.status_id) statusSel.value = s.status_id;
    
    renderPanelObs(s.observacoes || []);
    renderFotosGrid(s.fotos || []);

    document.getElementById('panel-obs-input').value = '';
    document.getElementById('obs-char').textContent = '0';
    document.getElementById('servico-panel').style.display = 'flex';
  } catch (err) { toast(err.message, 'error'); }
}

function renderFotosGrid(fotos) {
  const grid = document.getElementById('panel-fotos-grid');
  if (!grid) return;

  grid.innerHTML = '';
  
  // Renderiza fotos existentes
  fotos.forEach(f => {
    const box = document.createElement('div');
    box.className = 'foto-box has-image';
    box.style.backgroundImage = `url(${f.arquivo_path})`;
    box.onclick = () => window.open(f.arquivo_path, '_blank');
    
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-del-foto';
    delBtn.innerHTML = '<i class="fas fa-times"></i>';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteFoto(f.id);
    };
    
    box.appendChild(delBtn);
    grid.appendChild(box);
  });

  // Botão de adicionar se tiver menos de 5
  if (fotos.length < 5) {
    const addBox = document.createElement('div');
    addBox.className = 'foto-box';
    addBox.innerHTML = '<i class="fas fa-plus"></i>';
    addBox.onclick = () => selectPhotoSource();
    grid.appendChild(addBox);
  }
}

async function deleteFoto(fotoId) {
  if (!await customConfirm('Excluir esta foto?')) return;
  try {
    await api.del(`/servicos/${state.panel.servicoId}/fotos/${fotoId}`);
    const s = await api.get('/servicos/' + state.panel.servicoId);
    renderFotosGrid(s.fotos || []);
    toast('Foto excluída');
    await reloadOrdens(); // Atualiza status do WhatsApp na lista principal
  } catch (err) { toast(err.message, 'error'); }
}

// Handler para os inputs de arquivo
async function handleImageSelection(file) {
  if (!file) return;

  // Compressor simples usando Canvas
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Redimensiona para max 1280px (Equilíbrio entre qualidade e peso)
      const maxSide = 1280;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSide) {
          height *= maxSide / width;
          width = maxSide;
        }
      } else {
        if (height > maxSide) {
          width *= maxSide / height;
          height = maxSide;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Converte para Blob (mais leve para upload de arquivos)
      canvas.toBlob((blob) => {
        uploadFotoFile(blob, file.name);
      }, 'image/jpeg', 0.7); // 70% qualidade
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

document.getElementById('input-foto-file').addEventListener('change', async (e) => {
  await handleImageSelection(e.target.files[0]);
  e.target.value = ''; // Limpa input
});

document.getElementById('input-foto-camera').addEventListener('change', async (e) => {
  await handleImageSelection(e.target.files[0]);
  e.target.value = ''; // Limpa input
});

async function selectPhotoSource() {
  document.getElementById('photo-choice-modal').style.display = 'flex';
}

function triggerCamera() {
  document.getElementById('photo-choice-modal').style.display = 'none';
  document.getElementById('input-foto-camera').click();
}

function triggerGallery() {
  document.getElementById('photo-choice-modal').style.display = 'none';
  document.getElementById('input-foto-file').click();
}

async function uploadFotoFile(blob, fileName) {
  try {
    toast('Enviando foto...', 'info');
    
    const formData = new FormData();
    formData.append('foto', blob, fileName);

    const response = await fetch(`/api/servicos/${state.panel.servicoId}/fotos`, {
      method: 'POST',
      body: formData // Envia como Multipart Form Data (Profissional)
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Erro no servidor');
    }
    
    const s = await api.get('/servicos/' + state.panel.servicoId);
    renderFotosGrid(s.fotos || []);
    toast('Foto enviada com sucesso');
    await reloadOrdens(); // Atualiza status do WhatsApp na lista principal
  } catch (err) { 
    console.error('Erro no upload:', err);
    toast('Erro ao salvar foto: ' + err.message, 'error'); 
  }
}

function closePanel() {
  document.getElementById('servico-panel').style.display = 'none';
  state.panel.servicoId = null;
}

function renderPanelObs(obs) {
  const el = document.getElementById('panel-obs-list');
  if (!obs.length) {
    el.innerHTML = '<div style="font-size:0.78rem;color:#94a3b8;padding:8px 0">Nenhuma observação ainda.</div>';
    return;
  }
  el.innerHTML = obs.map(ob => `
    <div class="obs-entry">
      <div class="obs-time"><i class="fas fa-clock"></i> ${fmtDate(ob.created_at)}</div>
      <div class="obs-text">${esc(ob.texto)}</div>
    </div>
  `).join('');
}

async function savePanelServico() {
  const id = state.panel.servicoId;
  if (!id) return;
  const descricao = document.getElementById('panel-descricao').value.trim().toUpperCase();
  const status_id = parseInt(document.getElementById('panel-status').value) || null;
  if (!descricao) { toast('Descrição obrigatória', 'error'); return; }

  try {
    await api.put('/servicos/' + id, { descricao, status_id });
    toast('Serviço atualizado');
    await reloadOrdens();
    
    // Se o modal de Ordem estiver aberto, sincroniza os dados para não perder as alterações no modal
    if (document.getElementById('ordem-modal').style.display === 'flex' && state.modal.ordemId) {
      const updated = state.ordens.find(o => o.id === state.modal.ordemId);
      if (updated) {
        state.modal.tempPlacas = updated.placas.map(p => ({
          id: p.id,
          placa_id: p.placa_id,
          tipo: p.tipo,
          numero: p.numero,
          modelo: p.modelo,
          km_horimetro: p.km_horimetro,
          servicos: p.servicos.map(s => ({ id: s.id, descricao: s.descricao, status_id: s.status_id }))
        }));
        renderModalPlacas();
      }
    }

    closePanel();
  } catch (err) { toast(err.message, 'error'); }
}

async function addObservacao() {
  const id = state.panel.servicoId;
  if (!id) return;
  const inp = document.getElementById('panel-obs-input');
  const texto = inp.value.trim().toUpperCase();
  if (!texto) { toast('Digite a observação', 'error'); return; }
  if (texto.length > 150) { toast('Máximo 150 caracteres', 'error'); return; }

  try {
    const ob = await api.post('/servicos/' + id + '/observacoes', { texto });
    // Append to panel
    const list = document.getElementById('panel-obs-list');
    const placeholder = list.querySelector('div[style]');
    if (placeholder) list.innerHTML = '';
    const entry = document.createElement('div');
    entry.className = 'obs-entry';
    entry.innerHTML = `<div class="obs-time"><i class="fas fa-clock"></i> ${fmtDate(ob.created_at)}</div><div class="obs-text">${esc(ob.texto)}</div>`;
    list.appendChild(entry);
    inp.value = '';
    document.getElementById('obs-char').textContent = '0';
    toast('Observação adicionada');
    
    await reloadOrdens();

    // Sincroniza o modal se estiver aberto
    if (document.getElementById('ordem-modal').style.display === 'flex' && state.modal.ordemId) {
      const updated = state.ordens.find(o => o.id === state.modal.ordemId);
      if (updated) {
        state.modal.tempPlacas = updated.placas.map(p => ({
          id: p.id,
          placa_id: p.placa_id,
          tipo: p.tipo,
          numero: p.numero,
          modelo: p.modelo,
          km_horimetro: p.km_horimetro,
          servicos: p.servicos.map(s => ({ id: s.id, descricao: s.descricao, status_id: s.status_id }))
        }));
        renderModalPlacas();
      }
    }
  } catch (err) { toast(err.message, 'error'); }
}

// ===========================
// EVENT LISTENERS
// ===========================
document.addEventListener('DOMContentLoaded', async () => {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Motoristas
  document.getElementById('btn-add-motorista').addEventListener('click', addMotorista);
  document.getElementById('input-motorista').addEventListener('keydown', e => { if (e.key === 'Enter') addMotorista(); });

  // Gestores
  document.getElementById('btn-add-gestor').addEventListener('click', addGestor);
  document.getElementById('input-gestor').addEventListener('keydown', e => { if (e.key === 'Enter') addGestor(); });

  // Encarregados
  document.getElementById('btn-add-encarregado').addEventListener('click', addEncarregado);
  document.getElementById('input-encarregado').addEventListener('keydown', e => { if (e.key === 'Enter') addEncarregado(); });

  // Placas
  document.getElementById('btn-add-placa').addEventListener('click', addPlaca);

  // Status
  document.getElementById('btn-add-status').addEventListener('click', addStatus);

  // Toggle Filtros
  const toggleBtn = document.getElementById('btn-toggle-filters');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const container = toggleBtn.parentElement;
      const content = document.getElementById('filters-content');
      container.classList.toggle('active');
      content.classList.toggle('collapsed');
    });
  }
  document.getElementById('input-status').addEventListener('keydown', e => { if (e.key === 'Enter') addStatus(); });

  // Ordens
  document.getElementById('btn-nova-ordem').addEventListener('click', openNovaOrdem);

  // Ordem Modal
  document.getElementById('modal-close').addEventListener('click', closeOrdemModal);
  document.getElementById('btn-modal-cancel').addEventListener('click', closeOrdemModal);
  document.getElementById('btn-modal-save').addEventListener('click', saveOrdemModal);
  document.getElementById('btn-add-placa-ordem').addEventListener('click', togglePlacaPicker);

  // Close modal on overlay click
  document.getElementById('ordem-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('ordem-modal')) closeOrdemModal();
  });

  // Service panel
  document.getElementById('panel-close').addEventListener('click', closePanel);
  document.getElementById('btn-panel-save').addEventListener('click', savePanelServico);
  document.getElementById('btn-add-obs').addEventListener('click', addObservacao);
  document.getElementById('panel-obs-input').addEventListener('keydown', e => { if (e.key === 'Enter') addObservacao(); });
  document.getElementById('panel-obs-input').addEventListener('input', e => {
    document.getElementById('obs-char').textContent = e.target.value.length;
  });

  // KM input limit
  document.getElementById('placa-km-input').addEventListener('input', e => {
    if (e.target.value.length > 7) {
      e.target.value = e.target.value.slice(0, 7);
    }
  });

  // Close panel on overlay click
  document.getElementById('servico-panel').addEventListener('click', e => {
    if (e.target === document.getElementById('servico-panel')) closePanel();
  });

  // Load all data
  await loadAll();

  // Listeners para os filtros de busca
  document.getElementById('filter-status').addEventListener('change', renderOrdens);
  
  document.getElementById('filter-date').addEventListener('change', () => {
    // Se escolheu data, limpa o filtro de Nº OS
    const osInput = document.getElementById('filter-os');
    if (osInput.value) {
      osInput.value = '';
    }
    renderOrdens();
  });

  document.getElementById('filter-os').addEventListener('input', (e) => {
    // Se digitou Nº OS, limpa o filtro de data
    const dateInput = document.getElementById('filter-date');
    if (e.target.value.trim() !== '' && dateInput.value) {
      dateInput.value = '';
    }
    renderOrdens();
  });

  document.getElementById('btn-clear-filters').addEventListener('click', () => {
    document.getElementById('filter-status').value = 'ativos';
    document.getElementById('filter-date').value = '';
    document.getElementById('filter-os').value = '';
    renderOrdens();
  });
});
