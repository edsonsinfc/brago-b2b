// Gestor Dashboard - Sistema B2B Brago Distribuidora

// Função global para controlar visibilidade da categoria
window.handlePerfilChange = function(perfil) {
  console.log('🔄 handlePerfilChange chamado!');
  console.log('📋 Perfil:', perfil);
  
  const grupoCategoriaAcesso = document.getElementById('grupoCategoriaAcesso');
  const categoriaAcessoSelect = document.getElementById('novoCategoriaAcesso');
  const equipeSelect = document.getElementById('novoEquipe');
  const equipeObrigatorio = document.getElementById('equipeObrigatorio');
  const grupoPodeEditarEquipes = document.getElementById('grupoPodeEditarEquipes');
  
  console.log('📦 Elementos encontrados:', {
    grupoCategoriaAcesso: !!grupoCategoriaAcesso,
    categoriaAcessoSelect: !!categoriaAcessoSelect,
    equipeSelect: !!equipeSelect,
    equipeObrigatorio: !!equipeObrigatorio,
    grupoPodeEditarEquipes: !!grupoPodeEditarEquipes
  });
  
  // Mostrar campo "Pode Editar Equipes" apenas se o usuário logado for admin
  // Verificar se window.currentUserData existe (será definido após login)
  if (grupoPodeEditarEquipes) {
    if (window.currentUserData && window.currentUserData.perfil === 'admin') {
      // Apenas admin vê este campo, e não para perfil admin sendo criado
      grupoPodeEditarEquipes.style.display = (perfil === 'admin') ? 'none' : 'block';
    } else {
      // Não é admin, ocultar campo
      grupoPodeEditarEquipes.style.display = 'none';
    }
  }
  
  if (perfil === 'solicitante') {
    console.log('✅ Perfil é solicitante - MOSTRANDO campo categoria');
    if (equipeSelect) {
      equipeSelect.required = true;
      console.log('  - Equipe required = true');
    }
    if (equipeObrigatorio) {
      equipeObrigatorio.style.display = 'inline';
      console.log('  - Asterisco equipe visível');
    }
    if (grupoCategoriaAcesso) {
      grupoCategoriaAcesso.style.display = 'block';
      console.log('  - 💚 GRUPO CATEGORIA EXIBIDO!');
    }
    if (categoriaAcessoSelect) {
      categoriaAcessoSelect.required = true;
      console.log('  - Categoria required = true');
    }
  } else if (perfil === 'vendedor') {
    console.log('📧 Perfil é vendedor - campos simplificados');
    if (equipeSelect) {
      equipeSelect.required = false;
    }
    if (equipeObrigatorio) {
      equipeObrigatorio.style.display = 'none';
    }
    if (grupoCategoriaAcesso) {
      grupoCategoriaAcesso.style.display = 'none';
    }
    if (categoriaAcessoSelect) {
      categoriaAcessoSelect.required = false;
    }
  } else {
    console.log('❌ Perfil NÃO é solicitante - ESCONDENDO campo categoria');
    if (equipeSelect) {
      equipeSelect.required = false;
    }
    if (equipeObrigatorio) {
      equipeObrigatorio.style.display = 'none';
    }
    if (grupoCategoriaAcesso) {
      grupoCategoriaAcesso.style.display = 'none';
      console.log('  - 🚫 Grupo categoria oculto');
    }
    if (categoriaAcessoSelect) {
      categoriaAcessoSelect.required = false;
    }
  }
};

console.log('✅ window.handlePerfilChange definida!', typeof window.handlePerfilChange);

(function() {
  console.log('🚀 Gestor.js carregado!');
  const tokenKey = 'nexus_b2b_token';
  
  // Utilitários
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
  
  function getToken() { return localStorage.getItem(tokenKey); }
  
  function ensureAuth() {
    const token = getToken();
    if (!token) {
      window.location.href = '/login.html';
      return null;
    }
    return token;
  }
  
  function parseJwt(token) {
    try {
      const [, payload] = token.split('.');
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  }
  
  async function api(path, options = {}) {
    const token = ensureAuth();
    if (!token) {
      console.error('❌ Token não encontrado');
      throw new Error('No token');
    }
    
    console.log('🌐 API Request:', path, 'Token presente:', !!token);
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    
    try {
      const response = await fetch(path, { ...options, headers });
      console.log('📨 Response status:', response.status, response.statusText);
      
      if (response.status === 401) {
        console.error('❌ Não autorizado - redirecionando para login');
        localStorage.removeItem(tokenKey);
        
        // Tentar ler a resposta para ver se há mensagem específica
        try {
          const errorData = await response.json();
          if (errorData.requiresRelogin) {
            alert(errorData.error || 'Suas informações foram atualizadas. Por favor, faça login novamente.');
          }
        } catch (e) {
          // Ignorar erro de parse JSON
        }
        
        window.location.href = '/login.html';
        return;
      }
      
      let data;
      try {
        data = await response.json();
        console.log('📦 Response data:', data);
      } catch (jsonError) {
        console.error('❌ Erro ao fazer parse do JSON:', jsonError);
        throw new Error(`Erro no servidor - Status: ${response.status}`);
      }
      
      if (!response.ok) {
        console.error('❌ Erro da API:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          data: data
        });
        throw new Error(data.error || `Erro HTTP ${response.status}: ${response.statusText}`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      throw error;
    }
  }
  
  function showMessage(text, type = 'success') {
    // Remove mensagens existentes
    $$('.message').forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
      ${text}
    `;
    
    const activeTab = $('.tab-content.active');
    activeTab.insertBefore(message, activeTab.firstChild);
    
    setTimeout(() => message.remove(), 5000);
  }
  
  function formatMoney(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
  
  function formatDate(date) {
    try {
      return new Date(date).toLocaleString('pt-BR');
    } catch {
      return date;
    }
  }
  
  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[char]));
  }
  
  // Sistema de Tabs
  function initTabs() {
    const navTabs = $$('.nav-tab');
    if (!navTabs || navTabs.length === 0) {
      console.error('❌ Nenhuma aba de navegação encontrada');
      return;
    }
    
    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        console.log('🔄 Mudando para aba:', targetTab);
        
        // Atualizar tabs ativas
        $$('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Mostrar conteúdo da tab
        $$('.tab-content').forEach(content => content.classList.remove('active'));
        const tabContent = $(`#tab-${targetTab}`);
        if (tabContent) {
          tabContent.classList.add('active');
        } else {
          console.error(`❌ Conteúdo da aba #tab-${targetTab} não encontrado`);
        }
        
        // Carregar dados da tab
        loadTabData(targetTab);
      });
    });
  }
  
  function loadTabData(tab) {
    switch (tab) {
      case 'dashboard':
        carregarDashboard();
        break;
      case 'equipes':
        carregarEquipes();
        break;
      case 'produtos':
        carregarProdutos();
        break;
      case 'galeria':
        carregarGaleria();
        break;
      case 'pedidos':
        carregarPedidos();
        break;
      case 'usuarios':
        carregarUsuarios();
        break;
    }
  }
  
  // === EQUIPES ===
  async function carregarEquipes() {
    console.log('📋 Carregando equipes...');
    try {
      const data = await api('/api/equipes');
      console.log('✅ Equipes carregadas:', data);
      
      const container = $('#equipesCardsContainer');
      if (!container) {
        console.error('❌ Elemento #equipesCardsContainer não encontrado');
        return;
      }
      container.innerHTML = '';
      
      // Atualizar select de saldo
      const selectSaldo = $('#selEquipeSaldo');
      if (selectSaldo) {
        selectSaldo.innerHTML = '<option value="">Selecione uma equipe...</option>';
      }
      
      (data.equipes || []).forEach(equipe => {
        // Criar card para cada equipe
        const card = criarCardEquipe(equipe);
        container.appendChild(card);
        
        // Adicionar ao select de saldo
        if (selectSaldo) {
          const option = document.createElement('option');
          option.value = equipe.id;
          option.textContent = `#${equipe.id} - ${equipe.nome}`;
          selectSaldo.appendChild(option);
        }
      });
    } catch (error) {
      showMessage('Erro ao carregar equipes: ' + error.message, 'error');
    }
  }

  function criarCardEquipe(equipe) {
    const limiteCredito = Number(equipe.limite_credito || equipe.limite_total || 0);
    const limiteDisponivel = Number(equipe.limite_disponivel !== null ? equipe.limite_disponivel : equipe.saldo_atual || 0);
    const utilizado = limiteCredito - limiteDisponivel;
    const percentualUtilizado = limiteCredito > 0 ? (utilizado / limiteCredito) * 100 : 0;
    
    // Determinar status baseado no percentual utilizado
    let statusClass = 'excelente';
    let statusTexto = 'EXCELENTE';
    let progressClass = 'progress-excelente';
    
    if (percentualUtilizado >= 80) {
      statusClass = 'critico';
      statusTexto = 'CRÍTICO';
      progressClass = 'progress-critico';
    } else if (percentualUtilizado >= 50) {
      statusClass = 'atencao';
      statusTexto = 'ATENÇÃO';
      progressClass = 'progress-atencao';
    } else if (percentualUtilizado >= 20) {
      statusClass = 'bom';
      statusTexto = 'BOM';
      progressClass = 'progress-bom';
    }
    
    const card = document.createElement('div');
    card.className = 'equipe-card';
    card.id = `equipe-card-${equipe.id}`;
    
    card.innerHTML = `
      <div class="equipe-card-header" onclick="toggleCardEquipe(${equipe.id})">
        <span class="equipe-id">#${equipe.id}</span>
        <div class="equipe-info">
          <div class="equipe-nome">#${equipe.id} - ${escapeHtml(equipe.nome)}</div>
          <div class="equipe-detalhes">
            ${equipe.codigo_erp ? `<span><i class="fas fa-barcode"></i> ${escapeHtml(equipe.codigo_erp)}</span>` : ''}
            ${equipe.cgc ? `<span><i class="fas fa-file-alt"></i> ${escapeHtml(equipe.cgc)}</span>` : ''}
          </div>
        </div>
        <div class="equipe-status-badge ${statusClass}">
          ${statusTexto} • ${percentualUtilizado.toFixed(0)}%
        </div>
        <div class="equipe-limite-badge">
          <i class="fas fa-wallet"></i> ${formatMoney(limiteCredito)} | <i class="fas fa-minus-circle"></i> ${formatMoney(utilizado)}
        </div>
        <i class="fas fa-chevron-down equipe-expand-icon"></i>
      </div>
      
      <div class="equipe-card-body">
        <div class="equipe-card-content">
          <!-- Estatísticas -->
          <div class="equipe-stats-grid">
            <div class="equipe-stat-box">
              <div class="equipe-stat-label"><i class="fas fa-wallet"></i> Limite Total</div>
              <div class="equipe-stat-value">${formatMoney(limiteCredito)}</div>
            </div>
            <div class="equipe-stat-box">
              <div class="equipe-stat-label"><i class="fas fa-check-circle"></i> Disponível</div>
              <div class="equipe-stat-value">${formatMoney(limiteDisponivel)}</div>
            </div>
            <div class="equipe-stat-box">
              <div class="equipe-stat-label"><i class="fas fa-chart-pie"></i> Utilizado</div>
              <div class="equipe-stat-value">${formatMoney(utilizado)}</div>
              <div class="equipe-progress-bar">
                <div class="equipe-progress-fill ${progressClass}" style="width: ${Math.min(percentualUtilizado, 100)}%"></div>
              </div>
            </div>
          </div>
          
          <!-- Formulário de edição -->
          <div class="equipe-form-grid">
            <div class="form-group">
              <label><i class="fas fa-store"></i> Nome da Equipe</label>
              <input type="text" class="form-input" id="equipe-nome-${equipe.id}" 
                     value="${escapeHtml(equipe.nome)}" placeholder="Nome da equipe">
            </div>
            
            <div class="form-group">
              <label><i class="fas fa-barcode"></i> Código ERP</label>
              <input type="text" class="form-input" id="equipe-codigo-${equipe.id}" 
                     value="${escapeHtml(equipe.codigo_erp || '')}" placeholder="Código ERP">
            </div>
            
            <div class="form-group">
              <label><i class="fas fa-file-alt"></i> CGC/CNPJ</label>
              <input type="text" class="form-input" id="equipe-cgc-${equipe.id}" 
                     value="${escapeHtml(equipe.cgc || '')}" placeholder="CGC ou CNPJ">
            </div>
            
            <div class="form-group">
              <label><i class="fas fa-wallet"></i> Limite de Crédito (R$)</label>
              <input type="number" class="form-input" id="equipe-limite-${equipe.id}" 
                     value="${limiteCredito.toFixed(2)}" step="0.01" min="0" placeholder="0.00">
            </div>
            
            <div class="form-group">
              <label><i class="fas fa-check-circle"></i> Status</label>
              <select class="form-input" id="equipe-status-${equipe.id}">
                <option value="ATIVA" ${equipe.status === 'ATIVA' ? 'selected' : ''}>ATIVA</option>
                <option value="INATIVA" ${equipe.status === 'INATIVA' ? 'selected' : ''}>INATIVA</option>
              </select>
            </div>
          </div>
          
          <!-- Ações -->
          <div class="equipe-actions">
            <button class="btn btn-secondary" onclick="toggleCardEquipe(${equipe.id})">
              <i class="fas fa-times"></i> Cancelar
            </button>
            <button class="btn btn-secondary" onclick="window.abrirModalProdutosEquipe(${equipe.id}, '${escapeHtml(equipe.nome).replace(/'/g, '&apos;')}')">
              <i class="fas fa-box"></i> Gerenciar Produtos
            </button>
            <button class="btn btn-primary" onclick="salvarEquipeCard(${equipe.id})">
              <i class="fas fa-save"></i> Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    `;
    
    return card;
  }

  window.toggleCardEquipe = function(id) {
    const card = $(`#equipe-card-${id}`);
    if (card) {
      card.classList.toggle('expandido');
    }
  };

  window.salvarEquipeCard = async function(id) {
    try {
      const nome = $(`#equipe-nome-${id}`).value.trim();
      const codigo_erp = $(`#equipe-codigo-${id}`).value.trim();
      const cgc = $(`#equipe-cgc-${id}`).value.trim();
      const limite_credito = Number($(`#equipe-limite-${id}`).value);
      const status = $(`#equipe-status-${id}`).value;
      
      if (!nome) {
        throw new Error('Nome da equipe é obrigatório');
      }
      
      const updateData = { 
        nome, 
        codigo_erp: codigo_erp || null, 
        cgc: cgc || null, 
        limite_total: limite_credito || 0,
        status: status || 'ATIVA'
      };
      
      console.log('📝 Salvando equipe:', id, 'Dados:', updateData);
      
      await api(`/api/equipes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      showMessage('Equipe atualizada com sucesso!');
      carregarEquipes();
    } catch (error) {
      showMessage('Erro ao salvar equipe: ' + error.message, 'error');
    }
  };
  
  window.verSaldo = async function() {
    try {
      const equipeId = $('#selEquipeSaldo').value;
      if (!equipeId) {
        showMessage('Selecione uma equipe', 'error');
        return;
      }
      
      const data = await api(`/api/equipes/${equipeId}/saldo`);
      const resultDiv = $('#saldoResult');
      
      if (!resultDiv) {
        showMessage('Elemento saldoResult não encontrado', 'error');
        return;
      }
      
      resultDiv.className = 'message success';
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <i class="fas fa-wallet"></i>
        Saldo atual: ${formatMoney(data.saldo_atual || data.limite_disponivel)} | 
        Limite total: ${formatMoney(data.limite_total || data.limite_credito)}
      `;
    } catch (error) {
      showMessage('Erro ao consultar saldo: ' + error.message, 'error');
    }
  };
  
  // Form nova equipe (agora no modal)
  window.salvarNovaEquipe = async function(e) {
    e.preventDefault();
    
    try {
      const nome = $('#nomeEquipe').value.trim();
      const codigo_erp = $('#codigoErpEquipe').value.trim();
      const cgc = $('#cgcEquipe').value.trim();
      const limite_total = Number($('#limiteEquipe').value);
      const limite_mensal = $('#limiteMensalEquipe').value ? Number($('#limiteMensalEquipe').value) : null;
      
      if (!nome) throw new Error('Nome da equipe é obrigatório');
      if (limite_total <= 0) throw new Error('Limite deve ser maior que zero');
      
      const token = getToken();
      const payload = parseJwt(token);
      const gestor_id = payload?.id;
      
      await api('/api/equipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, codigo_erp, cgc, gestor_id, limite_total, limite_mensal })
      });
      
      showMessage('Equipe criada com sucesso!');
      fecharModalNovaEquipe();
      $('#formNovaEquipeModal').reset();
      carregarEquipes();
    } catch (error) {
      showMessage('Erro ao criar equipe: ' + error.message, 'error');
    }
  };

  // Funções de controle do modal Nova Equipe
  window.abrirModalNovaEquipe = function() {
    const modal = $('#modalNovaEquipe');
    if (modal) {
      modal.classList.add('active');
      $('#nomeEquipe').focus();
    }
  };

  window.fecharModalNovaEquipe = function() {
    const modal = $('#modalNovaEquipe');
    if (modal) {
      modal.classList.remove('active');
      $('#formNovaEquipeModal').reset();
    }
  };

  // Funções de controle do modal Consultar Saldo
  window.abrirModalConsultarSaldo = async function() {
    const modal = $('#modalConsultarSaldo');
    if (modal) {
      modal.classList.add('active');
      
      // Carregar equipes no select
      try {
        const data = await api('/api/equipes');
        const select = $('#consultaEquipeSelect');
        select.innerHTML = '<option value="">Selecione uma equipe...</option>';
        
        (data.equipes || []).forEach(equipe => {
          const option = document.createElement('option');
          option.value = equipe.id;
          option.textContent = `#${equipe.id} - ${equipe.nome}`;
          select.appendChild(option);
        });
      } catch (error) {
        showMessage('Erro ao carregar equipes: ' + error.message, 'error');
      }
    }
  };

  window.fecharModalConsultarSaldo = function() {
    const modal = $('#modalConsultarSaldo');
    if (modal) {
      modal.classList.remove('active');
      $('#consultaEquipeSelect').value = '';
      $('#resultadoConsultaSaldo').style.display = 'none';
    }
  };

  window.consultarSaldoEquipe = async function() {
    const equipeId = $('#consultaEquipeSelect').value;
    const resultDiv = $('#resultadoConsultaSaldo');
    
    if (!equipeId) {
      resultDiv.style.display = 'none';
      return;
    }
    
    try {
      const data = await api(`/api/equipes/${equipeId}/saldo`);
      
      const limiteTotal = Number(data.limite_total || data.limite_credito || 0);
      const limiteDisponivel = Number(data.limite_disponivel || 0);
      const utilizado = limiteTotal - limiteDisponivel;
      const percentualUtilizado = limiteTotal > 0 ? (utilizado / limiteTotal) * 100 : 0;
      
      // Determinar cor da barra de progresso
      let progressClass = 'saldo-progress-fill';
      if (percentualUtilizado >= 80) {
        progressClass += ' danger';
      } else if (percentualUtilizado >= 50) {
        progressClass += ' warning';
      }
      
      // Preencher dados
      $('#consultaLimiteTotal').textContent = formatMoney(limiteTotal);
      $('#consultaLimiteDisponivel').textContent = formatMoney(limiteDisponivel);
      $('#consultaLimiteUtilizado').textContent = formatMoney(utilizado);
      $('#consultaUtilizacao').textContent = percentualUtilizado.toFixed(1) + '%';
      
      // Atualizar cor do valor de utilização
      const utilizacaoEl = $('#consultaUtilizacao');
      utilizacaoEl.className = 'saldo-valor';
      if (percentualUtilizado >= 80) {
        utilizacaoEl.classList.add('danger');
      } else if (percentualUtilizado >= 50) {
        utilizacaoEl.classList.add('warning');
      } else {
        utilizacaoEl.classList.add('success');
      }
      
      // Atualizar barra de progresso
      const progressBar = $('#consultaProgressBar');
      progressBar.className = progressClass;
      progressBar.style.width = Math.min(percentualUtilizado, 100) + '%';
      progressBar.textContent = percentualUtilizado.toFixed(1) + '%';
      
      // Detalhes adicionais
      $('#consultaUltimoReset').textContent = data.ultimo_reset_saldo 
        ? new Date(data.ultimo_reset_saldo).toLocaleDateString('pt-BR')
        : 'Nunca';
      $('#consultaCodigoERP').textContent = data.codigo_erp || 'Não informado';
      $('#consultaCGC').textContent = data.cgc || 'Não informado';
      
      resultDiv.style.display = 'block';
    } catch (error) {
      showMessage('Erro ao consultar saldo: ' + error.message, 'error');
    }
  };

  // Controle de visibilidade para admin
  window.mostrarControlesAdmin = function() {
    const token = getToken();
    const payload = parseJwt(token);
    const isAdmin = payload && payload.perfil === 'admin';
    
    if (isAdmin) {
      const equipesActions = $('#equipesAdminActions');
      const produtosActions = $('#produtosAdminActions');
      
      if (equipesActions) equipesActions.style.display = 'flex';
      if (produtosActions) produtosActions.style.display = 'flex';
    }
  };

  // Função para toggle do formulário de novo produto
  window.toggleFormNovoProduto = function() {
    const card = $('#cardNovoProduto');
    if (card) {
      card.style.display = card.style.display === 'none' ? 'block' : 'none';
    }
  };

  // Fechar modal ao clicar fora
  window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
      if (e.target.id === 'modalNovaEquipe') {
        fecharModalNovaEquipe();
      } else if (e.target.id === 'modalConsultarSaldo') {
        fecharModalConsultarSaldo();
      }
    }
  });
  
  // === PRODUTOS ===
  let produtosState = { 
    page: 1, 
    pageSize: 20, 
    search: '', 
    categoria: '', 
    totalPages: 1,
    sortBy: 'codprod',
    sortOrder: 'asc',
    produtos: []
  };
  
  // Função para ordenar produtos
  function sortProdutos() {
    produtosState.produtos.sort((a, b) => {
      let aVal = a[produtosState.sortBy];
      let bVal = b[produtosState.sortBy];
      
      // Tratamento especial para preços e números
      if (produtosState.sortBy === 'preco' || produtosState.sortBy === 'estoque' || produtosState.sortBy === 'multiplos') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (produtosState.sortBy === 'codprod') {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      } else {
        // Para texto (descricao, categoria, unidade)
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }
      
      if (aVal < bVal) return produtosState.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return produtosState.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  // Função para renderizar tabela de produtos
  function renderProdutosTable() {
    const tbody = $('#tbodyProdutos');
    tbody.innerHTML = '';
    
    produtosState.produtos.forEach(produto => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(produto.codprod)}</td>
        <td>${escapeHtml(produto.descricao)}</td>
        <td>${produto.unidade}</td>
        <td>${produto.multiplos}</td>
        <td>${Number(produto.estoque).toLocaleString('pt-BR')}</td>
        <td>${formatMoney(produto.preco)}</td>
        <td>
          <span class="status info">${produto.categoria}</span>
        </td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="editarProduto(${produto.id})" title="Editar produto">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-success btn-sm" onclick="abrirGerenciarMidias(${produto.id})" title="Gerenciar mídias">
            <i class="fas fa-images"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="excluirProduto(${produto.id})" title="Excluir produto">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
  
  // Função para mudar ordenação ao clicar no cabeçalho
  window.sortProdutosBy = function(column) {
    if (produtosState.sortBy === column) {
      // Inverte a ordem se clicar na mesma coluna
      produtosState.sortOrder = produtosState.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Nova coluna, começa com ascendente
      produtosState.sortBy = column;
      produtosState.sortOrder = 'asc';
    }
    
    sortProdutos();
    renderProdutosTable();
    updateSortIndicators();
  };
  
  // Atualizar indicadores visuais de ordenação
  function updateSortIndicators() {
    // Remover todas as classes de ordenação
    document.querySelectorAll('#tabelaProdutos th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Adicionar classe na coluna ativa
    const activeHeader = document.querySelector(`#tabelaProdutos th[data-sort="${produtosState.sortBy}"]`);
    if (activeHeader) {
      activeHeader.classList.add(`sort-${produtosState.sortOrder}`);
    }
  }
  
  async function carregarProdutos(resetPage = false) {
    try {
      if (resetPage) produtosState.page = 1;
      
      const params = new URLSearchParams({
        page: produtosState.page,
        pageSize: produtosState.pageSize
      });
      
      if (produtosState.search) params.set('search', produtosState.search);
      if (produtosState.categoria) params.set('categoria', produtosState.categoria);
      
      const data = await api(`/api/produtos?${params}`);
      
      // Armazenar produtos para ordenação local
      produtosState.produtos = data.produtos || [];
      
      // Ordenar produtos localmente
      sortProdutos();
      
      renderProdutosTable();
      
      // Atualizar indicadores visuais
      updateSortIndicators();
      
      // Atualizar paginação
      const pagination = data.pagination || {};
      produtosState.totalPages = pagination.totalPages || 1;
      
      $('#produtosPaginaInfo').textContent = 
        `Página ${pagination.page || 1} de ${produtosState.totalPages} (${pagination.total || 0} produtos)`;
      
      $('#produtosPrev').disabled = produtosState.page <= 1;
      $('#produtosNext').disabled = produtosState.page >= produtosState.totalPages;
      
    } catch (error) {
      showMessage('Erro ao carregar produtos: ' + error.message, 'error');
    }
  }
  
  window.buscarProdutos = function() {
    produtosState.search = $('#searchProdutos').value;
    produtosState.categoria = $('#filterCategoria').value;
    carregarProdutos(true);
  };
  
  window.editarProduto = async function(id) {
    try {
      const produto = await api(`/api/produtos/${id}`);
      
      // Preencher modal
      $('#editProdutoId').value = produto.id;
      $('#editCodprod').value = produto.codprod;
      $('#editDescricao').value = produto.nome || produto.descricao;
      $('#editUnidade').value = produto.unidade;
      $('#editMultiplos').value = produto.multiplos;
      $('#editEstoque').value = produto.estoque;
      $('#editPreco').value = produto.preco;
      $('#editNcm').value = produto.ncm || '';
      $('#editCategoria').value = produto.categoria;
      $('#editCategoria_facility').checked = produto.categoria_facility || false;
      $('#editCategoria_manipulacao').checked = produto.categoria_manipulacao || false;
      $('#editFoto').value = produto.foto || '';
      $('#editObservacoes').value = produto.observacoes || '';
      $('#editCont_oba').value = produto.cont_oba || 'N';
      $('#editAcessoEspecifico').value = produto.acesso_especifico || 0;
      
      // Mostrar preview da foto atual se houver
      const fotoAtual = produto.foto_path || produto.foto;
      if (produto.acesso_especifico === 1) {
        $('#editEquipesEspecificasContainer').style.display = 'block';
        
        // Buscar equipes específicas
        try {
          const equipesEspecificas = await api(`/api/produtos/${id}/equipes-especificas`);
          const equipesIds = equipesEspecificas.map(e => e.equipe_id || e.id);
          
          // Marcar checkboxes
          document.querySelectorAll('input[name="edit_equipe_especifica_check"]').forEach(cb => {
            cb.checked = equipesIds.includes(parseInt(cb.value));
          });
        } catch (err) {
          console.error('Erro ao carregar equipes específicas:', err);
        }
      } else {
        $('#editEquipesEspecificasContainer').style.display = 'none';
      }
      
      $('#modalEditarProduto').style.display = 'flex';
    } catch (error) {
      showMessage('Erro ao carregar produto: ' + error.message, 'error');
    }
  };
  
  window.fecharModalProduto = function() {
    $('#modalEditarProduto').style.display = 'none';
  };
  
  window.salvarEdicaoProduto = async function() {
    try {
      const id = $('#editProdutoId').value;
      let fotoPath = null;
      
      // 1. Fazer upload da nova foto se houver
      const fotoUpload = $('#editFotoUpload');
      if (fotoUpload && fotoUpload.files && fotoUpload.files.length > 0) {
        const formData = new FormData();
        formData.append('foto', fotoUpload.files[0]);
        
        console.log('📤 Enviando foto para upload (edição)...');
        
        const uploadResult = await fetch('/api/produtos/upload-foto', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('nexus_b2b_token')}`
          },
          body: formData
        });
        
        console.log('📥 Resposta do upload:', uploadResult.status);
        
        if (!uploadResult.ok) {
          const errorText = await uploadResult.text();
          console.error('❌ Erro no upload:', errorText);
          throw new Error(`Erro ao fazer upload da foto: ${uploadResult.status} - ${errorText}`);
        }
        
        const uploadData = await uploadResult.json();
        fotoPath = uploadData.fotoPath;
        console.log('✅ Foto uploaded com sucesso:', fotoPath);
      }
      
      // 2. Preparar dados do produto
      const dados = {
        codprod: $('#editCodprod').value,
        descricao: $('#editDescricao').value,
        unidade: $('#editUnidade').value,
        multiplos: Number($('#editMultiplos').value),
        estoque: Number($('#editEstoque').value),
        preco: Number($('#editPreco').value),
        ncm: $('#editNcm').value,
        categoria: $('#editCategoria').value,
        categoria_facility: $('#editCategoria_facility').checked,
        categoria_manipulacao: $('#editCategoria_manipulacao').checked,
        foto: $('#editFoto').value || null,
        foto_path: fotoPath,
        observacoes: $('#editObservacoes').value,
        cont_oba: $('#editCont_oba').value,
        acesso_especifico: Number($('#editAcessoEspecifico').value)
      };
      
      // Validar que pelo menos uma categoria está selecionada
      if (!dados.categoria_facility && !dados.categoria_manipulacao) {
        showMessage('Selecione pelo menos uma categoria (Facility ou Manipulação)', 'error');
        return;
      }
      
      // 3. Coletar equipes selecionadas
      // Equipes para contrato OBA
      if (dados.cont_oba === 'S' && window.getEquipesSelecionadasEdit) {
        dados.equipes_contratos = window.getEquipesSelecionadasEdit();
      }
      
      // Equipes com acesso específico
      if (dados.acesso_especifico === 1 && window.getEquipesEspecificasSelecionadasEdit) {
        dados.equipes_especificas = window.getEquipesEspecificasSelecionadasEdit();
        
        if (!dados.equipes_especificas || dados.equipes_especificas.length === 0) {
          showMessage('Selecione pelo menos uma equipe para acesso específico', 'error');
          return;
        }
      }
      
      // 4. Atualizar produto
      await api(`/api/produtos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      // Mensagem com informação sobre equipes
      let mensagem = 'Produto atualizado com sucesso!';
      if (dados.acesso_especifico === 1 && dados.equipes_especificas && dados.equipes_especificas.length > 0) {
        mensagem += ` Disponível apenas para ${dados.equipes_especificas.length} equipe(s) específica(s).`;
      } else {
        mensagem += ' Disponível para todas as equipes.';
      }
      showMessage(mensagem);
      fecharModalProduto();
      carregarProdutos();
    } catch (error) {
      showMessage('Erro ao atualizar produto: ' + error.message, 'error');
    }
  };
  
  window.excluirProduto = async function(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      await api(`/api/produtos/${id}`, { method: 'DELETE' });
      showMessage('Produto excluído com sucesso!');
      carregarProdutos();
    } catch (error) {
      showMessage('Erro ao excluir produto: ' + error.message, 'error');
    }
  };
  
  // ====================================
  // MODAL DE GERENCIAMENTO DE MÍDIAS
  // ====================================
  
  window.abrirGerenciarMidias = async function(produtoId) {
    try {
      const produto = await api(`/api/produtos/${produtoId}`);
      
      $('#midiaProdutoId').value = produtoId;
      $('#produtoNomeMidias').textContent = produto.descricao;
      
      // Resetar para primeira aba
      $$('.tab-button').forEach(btn => btn.classList.remove('active'));
      $$('.tab-content').forEach(content => content.classList.remove('active'));
      $$('.tab-button')[0].classList.add('active');
      $('#abaImagens').classList.add('active');
      
      // Carregar imagens
      carregarImagens(produtoId);
      
      $('#modalGerenciarMidias').style.display = 'flex';
    } catch (error) {
      showMessage('Erro ao abrir mídias: ' + error.message, 'error');
    }
  };
  
  window.fecharModalMidias = function() {
    $('#modalGerenciarMidias').style.display = 'none';
  };
  
  // ====================================
  // GERENCIAMENTO DE ABAS
  // ====================================
  
  window.mudarAba = function(aba) {
    // Atualizar botões
    $$('.tab-button').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.tab-button').classList.add('active');
    
    // Atualizar conteúdo
    $$('.tab-content').forEach(content => content.classList.remove('active'));
    $('#aba' + aba.charAt(0).toUpperCase() + aba.slice(1)).classList.add('active');
    
    // Carregar dados da aba se necessário
    const produtoId = $('#midiaProdutoId').value;
    if (produtoId) {
      if (aba === 'imagens') carregarImagens(produtoId);
      if (aba === 'videos') carregarVideos(produtoId);
      if (aba === 'especificacoes') carregarEspecificacoes(produtoId);
    }
  };
  
  // ====================================
  // GERENCIAMENTO DE IMAGENS
  // ====================================
  
  async function carregarImagens(produtoId) {
    try {
      const produto = await api(`/api/produtos/${produtoId}`);
      const container = $('#listaImagens');
      
      if (!produto.imagens || produto.imagens.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-images"></i>
            <p>Nenhuma imagem cadastrada</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = produto.imagens.map(img => `
        <div class="imagem-item ${img.principal ? 'principal' : ''}">
          <img src="${img.url}" alt="${img.legenda || 'Imagem do produto'}" onerror="this.src='https://via.placeholder.com/200x180?text=Erro'">
          <div class="imagem-info">
            ${img.principal ? '<div class="imagem-badge">Principal</div>' : ''}
            <div class="imagem-legenda">${escapeHtml(img.legenda || '')}</div>
            <div class="imagem-actions">
              ${!img.principal ? `<button class="btn btn-success btn-sm" onclick="definirImagemPrincipal(${produtoId}, ${img.id})" title="Definir como principal">
                <i class="fas fa-star"></i>
              </button>` : ''}
              <button class="btn btn-danger btn-sm" onclick="removerImagem(${produtoId}, ${img.id})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      showMessage('Erro ao carregar imagens: ' + error.message, 'error');
    }
  }
  
  window.abrirModalAdicionarImagem = function() {
    $('#urlNovaImagem').value = '';
    $('#legendaNovaImagem').value = '';
    $('#principalNovaImagem').checked = false;
    $('#modalAdicionarImagem').style.display = 'flex';
  };
  
  window.fecharModalAdicionarImagem = function() {
    $('#modalAdicionarImagem').style.display = 'none';
  };
  
  window.salvarNovaImagem = async function() {
    try {
      const produtoId = $('#midiaProdutoId').value;
      const url = $('#urlNovaImagem').value;
      const legenda = $('#legendaNovaImagem').value;
      const principal = $('#principalNovaImagem').checked;
      
      if (!url) {
        showMessage('URL da imagem é obrigatória', 'error');
        return;
      }
      
      await api(`/api/produtos/${produtoId}/imagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, legenda, principal })
      });
      
      showMessage('Imagem adicionada com sucesso!');
      fecharModalAdicionarImagem();
      carregarImagens(produtoId);
    } catch (error) {
      showMessage('Erro ao adicionar imagem: ' + error.message, 'error');
    }
  };
  
  window.removerImagem = async function(produtoId, imagemId) {
    if (!confirm('Tem certeza que deseja remover esta imagem?')) return;
    
    try {
      await api(`/api/produtos/${produtoId}/imagens/${imagemId}`, { method: 'DELETE' });
      showMessage('Imagem removida com sucesso!');
      carregarImagens(produtoId);
    } catch (error) {
      showMessage('Erro ao remover imagem: ' + error.message, 'error');
    }
  };
  
  window.definirImagemPrincipal = async function(produtoId, imagemId) {
    try {
      await api(`/api/produtos/${produtoId}/imagens/${imagemId}/principal`, { method: 'PUT' });
      showMessage('Imagem principal definida!');
      carregarImagens(produtoId);
    } catch (error) {
      showMessage('Erro ao definir imagem principal: ' + error.message, 'error');
    }
  };
  
  // ====================================
  // GERENCIAMENTO DE VÍDEOS
  // ====================================
  
  async function carregarVideos(produtoId) {
    try {
      const produto = await api(`/api/produtos/${produtoId}`);
      const container = $('#listaVideos');
      
      if (!produto.videos || produto.videos.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-video"></i>
            <p>Nenhum vídeo cadastrado</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = produto.videos.map(video => `
        <div class="video-item">
          <div class="video-info">
            <div class="video-titulo">${escapeHtml(video.titulo || 'Vídeo sem título')}</div>
            <div class="video-url">${escapeHtml(video.url)}</div>
            <span class="video-tipo">${video.tipo}</span>
          </div>
          <div class="video-actions">
            <a href="${video.url}" target="_blank" class="btn btn-info btn-sm" title="Abrir vídeo">
              <i class="fas fa-external-link-alt"></i>
            </a>
            <button class="btn btn-danger btn-sm" onclick="removerVideo(${produtoId}, ${video.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      showMessage('Erro ao carregar vídeos: ' + error.message, 'error');
    }
  }
  
  window.abrirModalAdicionarVideo = function() {
    $('#urlNovoVideo').value = '';
    $('#tituloNovoVideo').value = '';
    $('#tipoNovoVideo').value = 'youtube';
    $('#modalAdicionarVideo').style.display = 'flex';
  };
  
  window.fecharModalAdicionarVideo = function() {
    $('#modalAdicionarVideo').style.display = 'none';
  };
  
  window.salvarNovoVideo = async function() {
    try {
      const produtoId = $('#midiaProdutoId').value;
      const url = $('#urlNovoVideo').value;
      const titulo = $('#tituloNovoVideo').value;
      const tipo = $('#tipoNovoVideo').value;
      
      if (!url) {
        showMessage('URL do vídeo é obrigatória', 'error');
        return;
      }
      
      await api(`/api/produtos/${produtoId}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, titulo, tipo })
      });
      
      showMessage('Vídeo adicionado com sucesso!');
      fecharModalAdicionarVideo();
      carregarVideos(produtoId);
    } catch (error) {
      showMessage('Erro ao adicionar vídeo: ' + error.message, 'error');
    }
  };
  
  window.removerVideo = async function(produtoId, videoId) {
    if (!confirm('Tem certeza que deseja remover este vídeo?')) return;
    
    try {
      await api(`/api/produtos/${produtoId}/videos/${videoId}`, { method: 'DELETE' });
      showMessage('Vídeo removido com sucesso!');
      carregarVideos(produtoId);
    } catch (error) {
      showMessage('Erro ao remover vídeo: ' + error.message, 'error');
    }
  };
  
  // ====================================
  // GERENCIAMENTO DE ESPECIFICAÇÕES
  // ====================================
  
  async function carregarEspecificacoes(produtoId) {
    try {
      const produto = await api(`/api/produtos/${produtoId}`);
      const container = $('#listaEspecificacoes');
      
      if (!produto.especificacoes || produto.especificacoes.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-list"></i>
            <p>Nenhuma especificação cadastrada</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = produto.especificacoes.map(espec => `
        <div class="especificacao-item">
          <div class="especificacao-info">
            <div class="especificacao-atributo">${escapeHtml(espec.atributo)}</div>
            <div class="especificacao-valor">${escapeHtml(espec.valor)}</div>
          </div>
          <div class="especificacao-actions">
            <button class="btn btn-primary btn-sm" onclick="editarEspecificacao(${produtoId}, ${espec.id}, '${escapeHtml(espec.atributo)}', '${escapeHtml(espec.valor)}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="removerEspecificacao(${produtoId}, ${espec.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      showMessage('Erro ao carregar especificações: ' + error.message, 'error');
    }
  }
  
  window.abrirModalAdicionarEspecificacao = function() {
    $('#especId').value = '';
    $('#atributoEspec').value = '';
    $('#valorEspec').value = '';
    $('#tituloModalEspec').textContent = 'Adicionar';
    $('#modalEspecificacao').style.display = 'flex';
  };
  
  window.editarEspecificacao = function(produtoId, especId, atributo, valor) {
    $('#especId').value = especId;
    $('#atributoEspec').value = atributo;
    $('#valorEspec').value = valor;
    $('#tituloModalEspec').textContent = 'Editar';
    $('#modalEspecificacao').style.display = 'flex';
  };
  
  window.fecharModalEspecificacao = function() {
    $('#modalEspecificacao').style.display = 'none';
  };
  
  window.salvarEspecificacao = async function() {
    try {
      const produtoId = $('#midiaProdutoId').value;
      const especId = $('#especId').value;
      const atributo = $('#atributoEspec').value;
      const valor = $('#valorEspec').value;
      
      if (!atributo || !valor) {
        showMessage('Atributo e valor são obrigatórios', 'error');
        return;
      }
      
      if (especId) {
        // Editar
        await api(`/api/produtos/${produtoId}/especificacoes/${especId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ atributo, valor })
        });
        showMessage('Especificação atualizada com sucesso!');
      } else {
        // Adicionar
        await api(`/api/produtos/${produtoId}/especificacoes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ atributo, valor })
        });
        showMessage('Especificação adicionada com sucesso!');
      }
      
      fecharModalEspecificacao();
      carregarEspecificacoes(produtoId);
    } catch (error) {
      showMessage('Erro ao salvar especificação: ' + error.message, 'error');
    }
  };
  
  window.removerEspecificacao = async function(produtoId, especId) {
    if (!confirm('Tem certeza que deseja remover esta especificação?')) return;
    
    try {
      await api(`/api/produtos/${produtoId}/especificacoes/${especId}`, { method: 'DELETE' });
      showMessage('Especificação removida com sucesso!');
      carregarEspecificacoes(produtoId);
    } catch (error) {
      showMessage('Erro ao remover especificação: ' + error.message, 'error');
    }
  };
  
  // Form novo produto
  $('#formNovoProduto').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      let fotoPath = null;
      
      // 1. Fazer upload da foto se houver
      const fotoUpload = $('#fotoUpload');
      if (fotoUpload && fotoUpload.files && fotoUpload.files.length > 0) {
        const formData = new FormData();
        formData.append('foto', fotoUpload.files[0]);
        
        console.log('📤 Enviando foto para upload...');
        
        const uploadResult = await fetch('/api/produtos/upload-foto', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('nexus_b2b_token')}`
          },
          body: formData
        });
        
        console.log('📥 Resposta do upload:', uploadResult.status);
        
        if (!uploadResult.ok) {
          const errorText = await uploadResult.text();
          console.error('❌ Erro no upload:', errorText);
          throw new Error(`Erro ao fazer upload da foto: ${uploadResult.status} - ${errorText}`);
        }
        
        const uploadData = await uploadResult.json();
        fotoPath = uploadData.fotoPath;
        console.log('✅ Foto uploaded com sucesso:', fotoPath);
      }
      
      // 2. Preparar dados do produto
      const dados = {
        codprod: $('#codprod').value,
        descricao: $('#descricao').value,
        unidade: $('#unidade').value,
        multiplos: Number($('#multiplos').value),
        estoque: Number($('#estoque').value),
        preco: Number($('#preco').value),
        ncm: $('#ncm').value,
        categoria: $('#categoria').value,
        categoria_facility: $('#categoria_facility').checked,
        categoria_manipulacao: $('#categoria_manipulacao').checked,
        foto: $('#foto').value || null,
        foto_path: fotoPath,
        observacoes: $('#observacoes').value,
        cont_oba: $('#cont_oba').value,
        acesso_especifico: Number($('#acesso_especifico').value)
      };
      
      // Validar que pelo menos uma categoria está selecionada
      if (!dados.categoria_facility && !dados.categoria_manipulacao) {
        showMessage('Selecione pelo menos uma categoria (Facility ou Manipulação)', 'error');
        return;
      }
      
      // 3. Coletar equipes selecionadas
      // Equipes para contrato OBA (sistema antigo)
      if (dados.cont_oba === 'S' && window.getEquipesSelecionadas) {
        dados.equipes_contratos = window.getEquipesSelecionadas();
      }
      
      // Equipes com acesso específico (novo sistema)
      if (dados.acesso_especifico === 1 && window.getEquipesEspecificasSelecionadas) {
        dados.equipes_especificas = window.getEquipesEspecificasSelecionadas();
        
        if (!dados.equipes_especificas || dados.equipes_especificas.length === 0) {
          showMessage('Selecione pelo menos uma equipe para acesso específico', 'error');
          return;
        }
      }
      
      // 4. Criar produto
      const result = await api('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      // Mensagem com informação sobre equipes
      let mensagem = 'Produto criado com sucesso!';
      if (dados.acesso_especifico === 1 && dados.equipes_especificas && dados.equipes_especificas.length > 0) {
        mensagem += ` Disponível apenas para ${dados.equipes_especificas.length} equipe(s) específica(s).`;
      } else {
        mensagem += ' Disponível para todas as equipes.';
      }
      showMessage(mensagem);
      $('#formNovoProduto').reset();
      $('#equipesSelectorContainer').style.display = 'none';
      $('#equipesEspecificasContainer').style.display = 'none';
      $('#fotoPreview').style.display = 'none';
      carregarProdutos();
    } catch (error) {
      showMessage('Erro ao criar produto: ' + error.message, 'error');
    }
  });
  
  // Paginação produtos
  $('#produtosPrev').addEventListener('click', () => {
    if (produtosState.page > 1) {
      produtosState.page--;
      carregarProdutos();
    }
  });
  
  $('#produtosNext').addEventListener('click', () => {
    if (produtosState.page < produtosState.totalPages) {
      produtosState.page++;
      carregarProdutos();
    }
  });
  
  // === PEDIDOS ===
  let pedidosState = { page: 1, pageSize: 100, status: '', categoria: '', totalPages: 1 };
  let equipesGestor = []; // Equipes que o gestor pode gerenciar
  let equipesFiltradasPedidos = []; // Equipes selecionadas no filtro
  let solicitantesFiltrados = []; // Solicitantes selecionados no filtro
  let todosSolicitantes = []; // Todos os solicitantes disponíveis
  
  // Carregar equipes do gestor para o filtro
  async function carregarEquipesFiltro() {
    console.log('🔄 [EQUIPES] Iniciando carregamento...');
    try {
      const userData = await api('/api/usuarios/me');
      console.log('👤 [EQUIPES] Perfil:', userData.perfil);
      
      // Armazenar dados do usuário globalmente para uso em outras funções
      window.currentUserData = userData;
      
      let equipes = [];
      
      // Admin pode ver todas as equipes, gestor vê apenas suas equipes
      if (userData.perfil === 'admin') {
        console.log('👑 [EQUIPES] Admin detectado - buscando todas as equipes via /api/equipes');
        const equipesData = await api('/api/equipes');
        equipes = equipesData.equipes || [];
        console.log('✅ [EQUIPES] Equipes do admin (todas):', equipes.length);
      } else if (userData.perfil === 'gestor' && userData.equipes && userData.equipes.length > 0) {
        console.log('👔 [EQUIPES] Gestor detectado - usando equipes vinculadas');
        equipes = userData.equipes;
        console.log('✅ [EQUIPES] Equipes do gestor:', equipes.length);
      }
      
      if (equipes.length > 0) {
        equipesGestor = equipes;
        console.log('✅ [EQUIPES] Equipes salvas em equipesGestor:', equipesGestor.length);
        
        // Renderizar checkboxes
        const container = $('#equipesChecklistPedidos');
        console.log('📦 [EQUIPES] Container encontrado?', !!container);
        
        if (container) {
          container.innerHTML = '';
          console.log('🧹 [EQUIPES] Container limpo');
          
          console.log('📋 [EQUIPES] Renderizando', equipesGestor.length, 'equipes:');
          
          equipesGestor.forEach((equipe, idx) => {
            console.log(`   ${idx + 1}. ${equipe.nome} (ID: ${equipe.id})`);
            const div = document.createElement('div');
            div.className = 'equipe-filtro-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `filtro_equipe_${equipe.id}`;
            checkbox.value = equipe.id;
            checkbox.checked = true; // Por padrão, todas selecionadas
            checkbox.onchange = () => {
              atualizarFiltroEquipes();
            };
            
            const label = document.createElement('label');
            label.htmlFor = `filtro_equipe_${equipe.id}`;
            label.textContent = equipe.nome;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
          });
          
          console.log('✅ [EQUIPES] Checkboxes adicionados ao container');
          console.log('📊 [EQUIPES] Itens no container:', container.children.length);
          
          // Carregar filtro salvo do localStorage, ou selecionar todas por padrão
          const filtroSalvo = localStorage.getItem('pedidos_equipes_filtro');
          console.log('💾 [EQUIPES] Filtro salvo no localStorage:', filtroSalvo);
          
          if (filtroSalvo) {
            try {
              equipesFiltradasPedidos = JSON.parse(filtroSalvo);
              // Desmarcar todas primeiro
              const allCheckboxes = document.querySelectorAll('#equipesChecklistPedidos input[type="checkbox"]');
              allCheckboxes.forEach(cb => cb.checked = false);
              // Marcar apenas as salvas
              equipesFiltradasPedidos.forEach(id => {
                const checkbox = $(`#filtro_equipe_${id}`);
                if (checkbox) checkbox.checked = true;
              });
              atualizarContadorEquipes();
            } catch (e) {
              console.error('Erro ao carregar filtro salvo:', e);
              // Em caso de erro, selecionar todas
              selecionarTodasPorPadrao();
            }
          } else {
            // Se não tem filtro salvo, selecionar todas por padrão
            selecionarTodasPorPadrao();
          }
        } else {
          console.error('❌ [EQUIPES] Container #equipesChecklistPedidos não encontrado!');
        }
      } else {
        console.log('⚠️ [EQUIPES] Nenhuma equipe disponível para o filtro');
        console.log('   - Perfil:', userData.perfil);
      }
    } catch (error) {
      console.error('❌ [EQUIPES] Erro ao carregar equipes:', error);
    }
  }
  
  // Função auxiliar para selecionar todas por padrão
  function selecionarTodasPorPadrao() {
    equipesFiltradasPedidos = equipesGestor.map(e => e.id);
    localStorage.setItem('pedidos_equipes_filtro', JSON.stringify(equipesFiltradasPedidos));
    atualizarContadorEquipes();
    atualizarBadgeEquipes();
  }
  
  // Atualizar o filtro de equipes
  function atualizarFiltroEquipes() {
    const checkboxes = document.querySelectorAll('#equipesChecklistPedidos input[type="checkbox"]');
    equipesFiltradasPedidos = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.value));
    
    // Salvar no localStorage
    localStorage.setItem('pedidos_equipes_filtro', JSON.stringify(equipesFiltradasPedidos));
    
    atualizarContadorEquipes();
    atualizarBadgeEquipes(); // Nova UI
    carregarPedidos(); // Recarregar pedidos com o novo filtro
  }
  
  // Atualizar contador de equipes selecionadas
  function atualizarContadorEquipes() {
    const contador = $('#equipesFiltradasCount');
    if (contador) {
      const total = equipesGestor.length;
      const selecionadas = equipesFiltradasPedidos.length;
      
      if (selecionadas === 0) {
        contador.textContent = `Todas as ${total} equipes (nenhum filtro aplicado)`;
      } else {
        contador.textContent = `${selecionadas} de ${total} equipes selecionadas`;
      }
    }
  }
  
  // Selecionar todas as equipes
  window.selecionarTodasEquipesFiltro = function() {
    const checkboxes = document.querySelectorAll('#equipesChecklistPedidos input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    atualizarFiltroEquipes();
  };
  
  // Limpar filtro de equipes
  window.limparEquipesFiltro = function() {
    const checkboxes = document.querySelectorAll('#equipesChecklistPedidos input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    atualizarFiltroEquipes();
  };
  
  // === FILTRO DE SOLICITANTES ===
  
  // Toggle do filtro de solicitantes
  window.toggleFiltroSolicitantes = function() {
    const content = $('#solicitantesFilterContent');
    const icon = $('#iconSolicitantesToggle');
    
    if (content && icon) {
      const isVisible = content.style.display !== 'none';
      content.style.display = isVisible ? 'none' : 'block';
      icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  };
  
  // Carregar solicitantes para o filtro
  async function carregarSolicitantesFiltro() {
    try {
      // Buscar todos os usuários solicitantes (sem limite de paginação)
      const data = await api('/api/usuarios?perfil=solicitante&ativo=1&pageSize=1000');
      const solicitantes = (data.usuarios || []).filter(u => u.perfil === 'solicitante');
      
      console.log('✅ Solicitantes carregados para filtro:', solicitantes.length);
      
      if (solicitantes.length > 0) {
        todosSolicitantes = solicitantes;
        
        // Mostrar o card de filtro
        const filtroCard = $('#filtroSolicitantesPedidos');
        if (filtroCard) {
          filtroCard.style.display = 'block';
        }
        
        // Renderizar checkboxes
        const container = $('#solicitantesChecklistPedidos');
        if (container) {
          container.innerHTML = '';
          
          solicitantes.forEach(solicitante => {
            const div = document.createElement('div');
            div.className = 'solicitante-filtro-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `filtro_solicitante_${solicitante.id}`;
            checkbox.value = solicitante.id;
            checkbox.checked = true; // Por padrão, todos selecionados
            checkbox.onchange = () => {
              atualizarFiltroSolicitantes();
            };
            
            const label = document.createElement('label');
            label.htmlFor = `filtro_solicitante_${solicitante.id}`;
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'solicitante-info';
            
            const nomeSpan = document.createElement('div');
            nomeSpan.className = 'solicitante-nome';
            nomeSpan.textContent = solicitante.nome;
            
            const equipeSpan = document.createElement('div');
            equipeSpan.className = 'solicitante-equipe';
            
            // Buscar nomes das equipes do solicitante
            if (solicitante.equipes && solicitante.equipes.length > 0) {
              const equipesNomes = solicitante.equipes.map(e => e.nome).join(', ');
              equipeSpan.textContent = equipesNomes;
            } else {
              equipeSpan.textContent = 'Sem equipe';
            }
            
            infoDiv.appendChild(nomeSpan);
            infoDiv.appendChild(equipeSpan);
            label.appendChild(infoDiv);
            
            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
          });
          
          // Carregar filtro salvo do localStorage, ou selecionar todos por padrão
          const filtroSalvo = localStorage.getItem('pedidos_solicitantes_filtro');
          if (filtroSalvo) {
            try {
              solicitantesFiltrados = JSON.parse(filtroSalvo);
              // Desmarcar todos primeiro
              const allCheckboxes = document.querySelectorAll('#solicitantesChecklistPedidos input[type=\"checkbox\"]');
              allCheckboxes.forEach(cb => cb.checked = false);
              // Marcar apenas os salvos
              solicitantesFiltrados.forEach(id => {
                const checkbox = $(`#filtro_solicitante_${id}`);
                if (checkbox) checkbox.checked = true;
              });
              atualizarContadorSolicitantes();
            } catch (e) {
              console.error('Erro ao carregar filtro de solicitantes salvo:', e);
              selecionarTodosSolicitantesPorPadrao();
            }
          } else {
            selecionarTodosSolicitantesPorPadrao();
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar solicitantes:', error);
    }
  }
  
  // Função auxiliar para selecionar todos solicitantes por padrão
  function selecionarTodosSolicitantesPorPadrao() {
    solicitantesFiltrados = todosSolicitantes.map(s => s.id);
    localStorage.setItem('pedidos_solicitantes_filtro', JSON.stringify(solicitantesFiltrados));
    atualizarContadorSolicitantes();
    atualizarBadgeSolicitantes();
  }
  
  // Atualizar o filtro de solicitantes
  function atualizarFiltroSolicitantes() {
    const checkboxes = document.querySelectorAll('#solicitantesChecklistPedidos input[type=\"checkbox\"]');
    solicitantesFiltrados = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => parseInt(cb.value));
    
    // Salvar no localStorage
    localStorage.setItem('pedidos_solicitantes_filtro', JSON.stringify(solicitantesFiltrados));
    
    atualizarContadorSolicitantes();
    atualizarBadgeSolicitantes(); // Nova UI
    carregarPedidos(); // Recarregar pedidos com o novo filtro
  }
  
  // Atualizar contador de solicitantes selecionados
  function atualizarContadorSolicitantes() {
    const contador = $('#solicitantesFiltradasCount');
    if (contador) {
      const total = todosSolicitantes.length;
      const selecionados = solicitantesFiltrados.length;
      
      if (selecionados === 0) {
        contador.textContent = `Todos os ${total} solicitantes (nenhum filtro aplicado)`;
      } else if (selecionados === total) {
        contador.textContent = 'Todos os solicitantes';
      } else {
        contador.textContent = `${selecionados} de ${total} solicitantes selecionados`;
      }
    }
  }
  
  // Selecionar todos os solicitantes
  window.selecionarTodosSolicitantesFiltro = function() {
    const checkboxes = document.querySelectorAll('#solicitantesChecklistPedidos input[type=\"checkbox\"]');
    checkboxes.forEach(cb => cb.checked = true);
    atualizarFiltroSolicitantes();
  };
  
  // Limpar filtro de solicitantes
  window.limparSolicitantesFiltro = function() {
    const checkboxes = document.querySelectorAll('#solicitantesChecklistPedidos input[type=\"checkbox\"]');
    checkboxes.forEach(cb => cb.checked = false);
    atualizarFiltroSolicitantes();
  };

  // === NOVA UI: CONTROLE DE DROPDOWNS COMPACTOS ===
  
  // Variável para controlar qual dropdown está aberto
  let dropdownAbertoAtual = null;
  
  // Toggle de dropdown de filtro
  window.toggleDropdownFiltro = function(tipo) {
    const dropdown = $(`#dropdown${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    const pill = $(`#btnFiltro${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    
    if (!dropdown || !pill) return;
    
    const estaAberto = dropdown.style.display !== 'none';
    
    // Fechar todos os dropdowns
    document.querySelectorAll('.filter-dropdown').forEach(d => d.style.display = 'none');
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    
    // Se não estava aberto, abre este
    if (!estaAberto) {
      dropdown.style.display = 'block';
      pill.classList.add('active');
      dropdownAbertoAtual = tipo;
    } else {
      dropdownAbertoAtual = null;
    }
  };
  
  // Fechar dropdown ao clicar fora
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.filter-pill-wrapper') && dropdownAbertoAtual) {
      document.querySelectorAll('.filter-dropdown').forEach(d => d.style.display = 'none');
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      dropdownAbertoAtual = null;
    }
  });
  
  // Filtrar lista de equipes (busca)
  window.filtrarListaEquipes = function() {
    const searchTerm = $('#searchEquipes')?.value.toLowerCase() || '';
    const items = document.querySelectorAll('#equipesChecklistPedidos .equipe-filtro-item');
    
    items.forEach(item => {
      const label = item.querySelector('label');
      const text = label?.textContent.toLowerCase() || '';
      item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
  };
  
  // Filtrar lista de solicitantes (busca)
  window.filtrarListaSolicitantes = function() {
    const searchTerm = $('#searchSolicitantes')?.value.toLowerCase() || '';
    const items = document.querySelectorAll('#solicitantesChecklistPedidos .solicitante-filtro-item');
    
    items.forEach(item => {
      const label = item.querySelector('label');
      const text = label?.textContent.toLowerCase() || '';
      item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
    });
  };
  
  // Limpar todos os filtros
  window.limparTodosFiltros = function() {
    limparEquipesFiltro();
    limparSolicitantesFiltro();
    // Resetar status para "Todos"
    const radioTodos = document.querySelector('input[name="filtroStatus"][value=""]');
    if (radioTodos) radioTodos.checked = true;
    atualizarFiltroStatus();
    // Resetar categoria para "Todas"
    const radioTodasCategorias = document.querySelector('input[name="filtroCategoria"][value=""]');
    if (radioTodasCategorias) radioTodasCategorias.checked = true;
    atualizarFiltroCategoria();
  };
  
  // Atualizar filtro de status
  window.atualizarFiltroStatus = function() {
    const radioSelecionado = document.querySelector('input[name="filtroStatus"]:checked');
    const badge = $('#badgeStatus');
    const btnStatus = $('#btnFiltroStatus');
    
    if (radioSelecionado) {
      pedidosState.status = radioSelecionado.value;
      pedidosState.page = 1;
      
      // Salvar no localStorage
      localStorage.setItem('pedidos_status_filtro', radioSelecionado.value);
      
      // Atualizar badge e estilo do pill
      if (radioSelecionado.value === '') {
        if (badge) badge.textContent = '';
        if (btnStatus) btnStatus.classList.remove('active');
      } else {
        if (badge) badge.textContent = '1';
        if (btnStatus) btnStatus.classList.add('active');
      }
      
      atualizarBotaoLimparTodos();
      carregarPedidos();
    }
  };
  
  // Atualizar filtro de categoria
  window.atualizarFiltroCategoria = function() {
    const radioSelecionado = document.querySelector('input[name="filtroCategoria"]:checked');
    const badge = $('#badgeCategoria');
    const btnCategoria = $('#btnFiltroCategoria');
    
    if (radioSelecionado) {
      pedidosState.categoria = radioSelecionado.value;
      pedidosState.page = 1;
      
      // Salvar no localStorage
      localStorage.setItem('pedidos_categoria_filtro', radioSelecionado.value);
      
      // Atualizar badge e estilo do pill
      if (radioSelecionado.value === '') {
        if (badge) badge.textContent = '';
        if (btnCategoria) btnCategoria.classList.remove('active');
      } else {
        if (badge) badge.textContent = '1';
        if (btnCategoria) btnCategoria.classList.add('active');
      }
      
      atualizarBotaoLimparTodos();
      carregarPedidos();
    }
  };
  
  // Atualizar badge de equipes
  function atualizarBadgeEquipes() {
    const badge = $('#badgeEquipes');
    if (badge) {
      const total = equipesGestor.length;
      const count = equipesFiltradasPedidos.length;
      
      // Só mostrar badge se não estiver "todos" selecionados
      if (count > 0 && count < total) {
        badge.textContent = count;
      } else {
        badge.textContent = '';
      }
      
      // Mostrar/ocultar botão "Limpar Todos"
      atualizarBotaoLimparTodos();
    }
  }
  
  // Atualizar badge de solicitantes
  function atualizarBadgeSolicitantes() {
    const badge = $('#badgeSolicitantes');
    if (badge) {
      const total = todosSolicitantes.length;
      const count = solicitantesFiltrados.length;
      
      // Só mostrar badge se não estiver "todos" selecionados
      if (count > 0 && count < total) {
        badge.textContent = count;
      } else {
        badge.textContent = '';
      }
      
      // Mostrar/ocultar botão "Limpar Todos"
      atualizarBotaoLimparTodos();
    }
  }
  
  // Mostrar/ocultar botão "Limpar Todos os Filtros"
  function atualizarBotaoLimparTodos() {
    const btn = $('#btnLimparTodosFiltros');
    if (btn) {
      const totalEquipes = equipesGestor.length;
      const totalSolicitantes = todosSolicitantes.length;
      
      // Filtro ativo apenas se NÃO estiver "todos" selecionados
      const temFiltroEquipe = equipesFiltradasPedidos.length > 0 && equipesFiltradasPedidos.length < totalEquipes;
      const temFiltroSolicitante = solicitantesFiltrados.length > 0 && solicitantesFiltrados.length < totalSolicitantes;
      const temFiltroStatus = pedidosState.status !== '';
      const temFiltroCategoria = pedidosState.categoria !== '';
      
      btn.style.display = (temFiltroEquipe || temFiltroSolicitante || temFiltroStatus || temFiltroCategoria) ? 'inline-flex' : 'none';
    }
  }
  
  // Mostrar barra de filtros se for gestor
  // Mostrar barra de filtros se for gestor
  async function mostrarFiltrosGestor() {
    try {
      const userData = await api('/api/usuarios/me');
      
      // Armazenar dados do usuário globalmente
      window.currentUserData = userData;
      
      const filtrosBar = $('#filtrosAvancadosPedidos');
      
      if (filtrosBar && (userData.perfil === 'admin' || userData.perfil === 'gestor')) {
        filtrosBar.style.display = 'flex';
      }
    } catch (error) {
      console.error('Erro ao verificar perfil do usuário:', error);
    }
  }
  
  async function carregarPedidos() {
    try {
      const params = new URLSearchParams({
        page: pedidosState.page,
        pageSize: pedidosState.pageSize,
        status: pedidosState.status
      });
      
      const data = await api(`/api/pedidos?${params}`);
      const container = $('#pedidosCardsContainer');
      if (!container) {
        console.error('❌ Container de pedidos não encontrado');
        return;
      }
      container.innerHTML = '';
      
      // Filtrar pedidos por equipe se houver filtro aplicado
      let pedidosFiltrados = data.pedidos || [];
      if (equipesFiltradasPedidos.length > 0) {
        pedidosFiltrados = pedidosFiltrados.filter(pedido => 
          equipesFiltradasPedidos.includes(pedido.equipe_id)
        );
      }
      
      // Filtrar pedidos por solicitante se houver filtro aplicado
      if (solicitantesFiltrados.length > 0) {
        pedidosFiltrados = pedidosFiltrados.filter(pedido => 
          solicitantesFiltrados.includes(pedido.criado_por)
        );
      }
      
      // Filtrar pedidos por categoria se houver filtro aplicado
      if (pedidosState.categoria) {
        pedidosFiltrados = pedidosFiltrados.filter(pedido => 
          pedido.solicitante_categoria === pedidosState.categoria
        );
      }
      
      // Atualizar contagem
      const countInfo = $('#pedidosCountInfo');
      if (countInfo) {
        countInfo.textContent = `${pedidosFiltrados.length} ${pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}`;
      }
      
      // Agrupar pedidos por lote_pedido E status
      const pedidosPorLote = {};
      pedidosFiltrados.forEach(pedido => {
        // Chave única: lote + status (para separar pedidos de mesmo lote com status diferentes)
        const loteKey = pedido.lote_pedido 
          ? `${pedido.lote_pedido}-${pedido.status}`
          : `individual-${pedido.id}`;
        
        if (!pedidosPorLote[loteKey]) {
          pedidosPorLote[loteKey] = [];
        }
        pedidosPorLote[loteKey].push(pedido);
      });
      
      // Criar cards (agrupados ou individuais)
      Object.values(pedidosPorLote).forEach(grupoPedidos => {
        const card = grupoPedidos.length > 1 
          ? criarCardPedidoAgrupado(grupoPedidos)
          : criarCardPedido(grupoPedidos[0]);
        container.appendChild(card);
      });
      
      // Atualizar paginação
      const pagination = data.pagination || {};
      pedidosState.totalPages = pagination.totalPages || 1;
      
      const paginaInfo = $('#pedidosPaginaInfo');
      if (paginaInfo) {
        paginaInfo.textContent = 
          `Página ${pagination.page || 1} de ${pedidosState.totalPages} (${pagination.total || 0} pedidos)`;
      }
        
    } catch (error) {
      showMessage('Erro ao carregar pedidos: ' + error.message, 'error');
    }
  }

  function criarCardPedido(pedido) {
    const canApprove = pedido.status === 'PENDENTE_APROVACAO';
    const canReject = pedido.status === 'PENDENTE_APROVACAO';
    
    // Determinar classe de status
    let statusClass = 'warning';
    let statusText = pedido.status;
    let cardClass = '';
    
    if (pedido.status === 'PENDENTE_APROVACAO') {
      statusClass = 'pendente';
      statusText = 'PENDENTE APROVAÇÃO';
      cardClass = 'pendente';
    } else if (pedido.status === 'APROVADO') {
      statusClass = 'aprovado';
      cardClass = 'aprovado';
    } else if (pedido.status === 'CANCELADO' || pedido.status === 'REPROVADO') {
      statusClass = 'cancelado';
      cardClass = 'cancelado';
    } else if (pedido.status === 'EM_SEPARACAO') {
      statusClass = 'em_separacao';
      statusText = 'EM SEPARAÇÃO';
    } else if (pedido.status === 'ENTREGUE') {
      statusClass = 'entregue';
    }
    
    const card = document.createElement('div');
    card.className = `pedido-card ${cardClass}`;
    card.id = `pedido-card-${pedido.id}`;
    
    const dataFormatada = formatDate(pedido.data);
    const valorFormatado = formatMoney(pedido.valor_total);
    
    // Determinar badge de categoria
    let categoriaBadge = '';
    if (pedido.solicitante_categoria === 'facility') {
      categoriaBadge = '<span class="categoria-badge facility" title="Facility"><i class="fas fa-industry"></i> Facility</span>';
    } else if (pedido.solicitante_categoria === 'manipulacao') {
      categoriaBadge = '<span class="categoria-badge manipulacao" title="Manipulação"><i class="fas fa-pills"></i> Manipulação</span>';
    } else if (pedido.solicitante_categoria === 'ambas') {
      categoriaBadge = '<span class="categoria-badge ambas" title="Ambas"><i class="fas fa-layer-group"></i> Ambas</span>';
    }
    
    card.innerHTML = `
      <div class="pedido-card-header">
        <div class="pedido-id">
          <i class="fas fa-hashtag"></i>
          ${pedido.id}
          ${categoriaBadge}
        </div>
        <div class="pedido-main-info">
          <div class="pedido-equipe">${escapeHtml(pedido.equipe_nome || '#' + pedido.equipe_id)}</div>
          <div class="pedido-data">
            <i class="fas fa-calendar"></i>
            ${dataFormatada}
          </div>
        </div>
        <div class="pedido-valor">${valorFormatado}</div>
      </div>
      
      <div class="pedido-card-body">
        <div class="pedido-status-row">
          <span class="pedido-status-badge ${statusClass}">
            ${statusClass === 'pendente' ? '<i class="fas fa-clock"></i>' : ''}
            ${statusClass === 'aprovado' ? '<i class="fas fa-check-circle"></i>' : ''}
            ${statusClass === 'cancelado' ? '<i class="fas fa-times-circle"></i>' : ''}
            ${statusClass === 'entregue' ? '<i class="fas fa-box"></i>' : ''}
            ${statusClass === 'em_separacao' ? '<i class="fas fa-boxes"></i>' : ''}
            ${statusText}
          </span>
        </div>
        
        <div class="pedido-actions">
          <button class="btn btn-info" onclick="abrirDetalhesPedido(${pedido.id})">
            <i class="fas fa-eye"></i> Ver Detalhes
          </button>
          ${canApprove ? `
            <button class="btn btn-success" onclick="aprovarPedido(${pedido.id})">
              <i class="fas fa-check"></i> Aprovar
            </button>
          ` : ''}
          ${canReject ? `
            <button class="btn btn-danger" onclick="rejeitarPedido(${pedido.id})">
              <i class="fas fa-times"></i> Rejeitar
            </button>
          ` : ''}
        </div>
      </div>
    `;
    
    return card;
  }
  
  function criarCardPedidoAgrupado(pedidos) {
    const primeiro = pedidos[0];
    const totalGeral = pedidos.reduce((sum, p) => sum + parseFloat(p.valor_total || 0), 0);
    const statusPrimeiro = primeiro.status;
    
    // Todos os pedidos do lote devem ter o mesmo status
    const todosIgual = pedidos.every(p => p.status === statusPrimeiro);
    
    let statusClass = 'warning';
    let statusText = statusPrimeiro;
    let cardClass = '';
    
    if (statusPrimeiro === 'PENDENTE_APROVACAO') {
      statusClass = 'pendente';
      statusText = 'PENDENTE APROVAÇÃO';
      cardClass = 'pendente';
    } else if (statusPrimeiro === 'APROVADO') {
      statusClass = 'aprovado';
      cardClass = 'aprovado';
    } else if (statusPrimeiro === 'CANCELADO' || statusPrimeiro === 'REPROVADO') {
      statusClass = 'cancelado';
      cardClass = 'cancelado';
    }
    
    const card = document.createElement('div');
    card.className = `pedido-card-grupo ${cardClass}`;
    card.id = `pedido-lote-${primeiro.lote_pedido}`;
    
    const dataFormatada = formatDate(primeiro.data);
    const valorFormatado = formatMoney(totalGeral);
    
    card.innerHTML = `
      <div class="pedido-card-header-grupo">
        <div class="pedido-lote-info">
          <i class="fas fa-layer-group"></i>
          <span class="lote-badge">LOTE: ${pedidos.length} pedidos</span>
        </div>
        <div class="pedido-data">
          <i class="fas fa-calendar"></i>
          ${dataFormatada}
        </div>
        <div class="pedido-valor-total">${valorFormatado}</div>
      </div>
      
      <div class="pedido-status-row">
        <span class="pedido-status-badge ${statusClass}">
          ${statusClass === 'pendente' ? '<i class="fas fa-clock"></i>' : ''}
          ${statusClass === 'aprovado' ? '<i class="fas fa-check-circle"></i>' : ''}
          ${statusClass === 'cancelado' ? '<i class="fas fa-times-circle"></i>' : ''}
          ${statusText}
        </span>
      </div>
      
      <div class="pedidos-agrupados-lista">
        ${pedidos.map(p => `
          <div class="pedido-mini" id="pedido-mini-${p.id}">
            <span class="pedido-mini-id">#${p.id}</span>
            <span class="pedido-mini-equipe">${escapeHtml(p.equipe_nome || 'Equipe #' + p.equipe_id)}</span>
            <span class="pedido-mini-valor">${formatMoney(p.valor_total)}</span>
            <div class="pedido-mini-actions">
              <button class="btn-mini" onclick="abrirDetalhesPedido(${p.id})" title="Ver detalhes">
                <i class="fas fa-eye"></i>
              </button>
              ${statusPrimeiro === 'PENDENTE_APROVACAO' ? `
                <button class="btn-mini btn-success" onclick="event.stopPropagation(); aprovarPedido(${p.id})" title="Aprovar">
                  <i class="fas fa-check"></i>
                </button>
                <button class="btn-mini btn-danger" onclick="event.stopPropagation(); rejeitarPedido(${p.id})" title="Rejeitar">
                  <i class="fas fa-times"></i>
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="pedido-actions-grupo">
        ${statusPrimeiro === 'PENDENTE_APROVACAO' ? `
          <button class="btn btn-success" onclick="aprovarTodoLote('${primeiro.lote_pedido}')">
            <i class="fas fa-check-circle"></i> Aprovar Todos (${pedidos.length})
          </button>
          <button class="btn btn-danger" onclick="rejeitarTodoLote('${primeiro.lote_pedido}')">
            <i class="fas fa-times-circle"></i> Rejeitar Todos
          </button>
        ` : ''}
        <button class="btn btn-info btn-expandir-lote" onclick="expandirLote('${primeiro.lote_pedido}')">
          <i class="fas fa-expand-alt"></i> Expandir Detalhes
        </button>
      </div>
    `;
    
    return card;
  }
  
  window.aprovarTodoLote = async function(lotePedido) {
    if (!confirm('Aprovar TODOS os pedidos deste lote?\n\nApós aprovação:\n• O crédito será debitado de cada equipe\n• O vendedor receberá um email com todos os pedidos')) return;
    
    try {
      // Buscar todos os pedidos do lote
      const response = await api(`/api/pedidos?lote=${lotePedido}`);
      const pedidosDoLote = response.pedidos || [];
      
      // Aprovar cada pedido
      const promises = pedidosDoLote.map(p => 
        api(`/api/pedidos/${p.id}/aprovar`, { 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
      );
      
      await Promise.all(promises);
      
      showMessage(`${pedidosDoLote.length} pedidos aprovados com sucesso! Email enviado ao vendedor.`, 'success');
      carregarDashboard();
      carregarPedidos();
      carregarPedidosPendentes();
    } catch (error) {
      showMessage('Erro ao aprovar lote: ' + error.message, 'error');
    }
  };
  
  window.rejeitarTodoLote = async function(lotePedido) {
    const motivo = prompt('Informe o motivo da rejeição para TODOS os pedidos:');
    if (!motivo || motivo.trim() === '') return;
    
    try {
      // Buscar todos os pedidos do lote
      const response = await api(`/api/pedidos?lote=${lotePedido}`);
      const pedidosDoLote = response.pedidos || [];
      
      // Rejeitar cada pedido
      const promises = pedidosDoLote.map(p => 
        api(`/api/pedidos/${p.id}/rejeitar`, { 
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo_reprovacao: motivo })
        })
      );
      
      await Promise.all(promises);
      
      showMessage(`${pedidosDoLote.length} pedidos rejeitados com sucesso!`, 'success');
      carregarDashboard();
      carregarPedidos();
      carregarPedidosPendentes();
    } catch (error) {
      showMessage('Erro ao rejeitar lote: ' + error.message, 'error');
    }
  };
  
  window.expandirLote = function(lotePedido) {
    const card = document.getElementById(`pedido-lote-${lotePedido}`);
    if (card) {
      const lista = card.querySelector('.pedidos-agrupados-lista');
      const btn = card.querySelector('.btn-expandir-lote');
      
      if (lista && btn) {
        if (lista.style.maxHeight === 'none' || !lista.style.maxHeight) {
          lista.style.maxHeight = '200px';
          btn.innerHTML = '<i class="fas fa-expand-alt"></i> Expandir Detalhes';
        } else {
          lista.style.maxHeight = 'none';
          btn.innerHTML = '<i class="fas fa-compress-alt"></i> Recolher Detalhes';
        }
      }
    }
  };
  
  window.aprovarPedido = async function(id) {
    if (!confirm('Aprovar este pedido?\n\nApós aprovação:\n• O crédito será debitado da equipe\n• O vendedor receberá um email automaticamente')) return;
    
    // Feedback visual imediato
    const pedidoMini = document.getElementById(`pedido-mini-${id}`);
    if (pedidoMini) {
      pedidoMini.style.opacity = '0.5';
      pedidoMini.style.pointerEvents = 'none';
    }
    
    try {
      const result = await api(`/api/pedidos/${id}/aprovar`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      // Animação de sucesso
      mostrarAnimacaoSucesso(id, 'aprovado');
      
      // Mostrar modal bonito centralizado
      mostrarAnimacaoAprovacao(id);
      
      // Aguardar animação antes de recarregar
      setTimeout(() => {
        carregarDashboard();
        carregarPedidos();
        carregarPedidosPendentes();
      }, 3000);
    } catch (error) {
      if (pedidoMini) {
        pedidoMini.style.opacity = '1';
        pedidoMini.style.pointerEvents = 'auto';
      }
      showMessage('Erro ao aprovar pedido: ' + error.message, 'error');
    }
  };
  
  // Função para mostrar animação de sucesso/rejeição
  function mostrarAnimacaoSucesso(pedidoId, tipo) {
    const pedidoMini = document.getElementById(`pedido-mini-${pedidoId}`);
    if (!pedidoMini) return;
    
    // Criar overlay de animação
    const overlay = document.createElement('div');
    overlay.className = 'pedido-animation-overlay';
    
    const icon = document.createElement('div');
    icon.className = tipo === 'aprovado' ? 'animation-check' : 'animation-x';
    icon.innerHTML = tipo === 'aprovado' 
      ? '<i class="fas fa-check-circle"></i>'
      : '<i class="fas fa-times-circle"></i>';
    
    overlay.appendChild(icon);
    pedidoMini.style.position = 'relative';
    pedidoMini.appendChild(overlay);
    
    // Animar
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);
    
    // Remover após animação
    setTimeout(() => {
      overlay.classList.remove('show');
      setTimeout(() => overlay.remove(), 300);
    }, 800);
  }
  
  // Função para mostrar animação de aprovação centralizada
  function mostrarAnimacaoAprovacao(pedidoId) {
    // Criar overlay
    const overlay = document.createElement('div');
    overlay.className = 'success-animation-overlay';
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'success-animation-modal';
    
    // Ícone de check animado
    const icon = document.createElement('div');
    icon.className = 'success-check-icon';
    icon.innerHTML = '<i class="fas fa-check-circle"></i>';
    
    // Título
    const title = document.createElement('h2');
    title.className = 'success-title';
    title.textContent = 'Pedido Aprovado!';
    
    // Conteúdo
    const content = document.createElement('div');
    content.className = 'success-content';
    content.innerHTML = `
      <p class="success-subtitle">Pedido #${pedidoId} aprovado com sucesso!</p>
      <p class="success-info">
        Crédito debitado da equipe<br>
        Email enviado ao vendedor
      </p>
    `;
    
    // Montar modal
    modal.appendChild(icon);
    modal.appendChild(title);
    modal.appendChild(content);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Animar entrada
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }, 2800);
  }
  
  window.rejeitarPedido = async function(id) {
    const motivo = prompt('Informe o motivo da rejeição:');
    if (!motivo || motivo.trim() === '') return;
    
    // Feedback visual imediato
    const pedidoMini = document.getElementById(`pedido-mini-${id}`);
    if (pedidoMini) {
      pedidoMini.style.opacity = '0.5';
      pedidoMini.style.pointerEvents = 'none';
    }
    
    try {
      await api(`/api/pedidos/${id}/rejeitar`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo_reprovacao: motivo })
      });
      
      // Animação de rejeição
      mostrarAnimacaoSucesso(id, 'rejeitado');
      
      // Aguardar animação antes de recarregar
      setTimeout(() => {
        showMessage('Pedido rejeitado com sucesso!', 'success');
        carregarDashboard();
        carregarPedidos();
        carregarPedidosPendentes();
      }, 1000);
    } catch (error) {
      if (pedidoMini) {
        pedidoMini.style.opacity = '1';
        pedidoMini.style.pointerEvents = 'auto';
      }
      showMessage('Erro ao rejeitar pedido: ' + error.message, 'error');
    }
  };
  
  window.cancelarPedido = async function(id) {
    if (!confirm('Cancelar este pedido? O saldo será estornado.')) return;
    
    try {
      await api(`/api/pedidos/${id}/cancelar`, { method: 'POST' });
      showMessage('Pedido cancelado com sucesso!');
      carregarPedidos();
    } catch (error) {
      showMessage('Erro ao cancelar pedido: ' + error.message, 'error');
    }
  };
  
  // === USUÁRIOS ===
  let usuariosState = { page: 1, pageSize: 10, search: '', perfil: '', totalPages: 1 };
  let equipesCache = [];
  
  // Função para renderizar badge visual de equipes
  function renderizarBadgeEquipes(usuario) {
    const qtdEquipes = usuario.equipes?.length || 0;
    const totalEquipes = 13; // Total de equipes no sistema
    
    if (qtdEquipes === 0) {
      return `
        <div class="equipes-badge none" title="Nenhuma equipe atribuída">
          <i class="fas fa-ban"></i>
          <span>Sem equipes</span>
        </div>
      `;
    }
    
    if (qtdEquipes === 1) {
      return `
        <div class="equipes-badge single" title="Gerencia 1 equipe: ${usuario.equipes[0].nome}">
          <i class="fas fa-store"></i>
          <span>1 equipe</span>
        </div>
      `;
    }
    
    if (qtdEquipes >= totalEquipes) {
      return `
        <div class="equipes-badge all" title="Gerencia TODAS as ${qtdEquipes} equipes">
          <i class="fas fa-crown"></i>
          <span>${qtdEquipes} equipes (TODAS)</span>
        </div>
      `;
    }
    
    // Múltiplas equipes
    const nomesEquipes = usuario.equipes.map(eq => eq.nome).join('\n• ');
    return `
      <div class="equipes-badge multiple equipes-list-tooltip" 
           data-equipes="Gerencia ${qtdEquipes} equipes:\n\n• ${nomesEquipes}"
           title="Passe o mouse para ver detalhes">
        <i class="fas fa-building"></i>
        <span>${qtdEquipes} equipes</span>
      </div>
    `;
  }
  
  async function carregarUsuarios() {
    try {
      // Sempre carregar equipes ao abrir a aba de usuários para garantir que os checkboxes sejam preenchidos
      await carregarEquipesParaSelects();
      
      const params = new URLSearchParams({
        page: usuariosState.page,
        pageSize: usuariosState.pageSize
      });
      
      if (usuariosState.search) params.set('q', usuariosState.search);
      if (usuariosState.perfil) params.set('perfil', usuariosState.perfil);
      
      console.log('🔍 ESTADO DE BUSCA:', {
        page: usuariosState.page,
        pageSize: usuariosState.pageSize,
        search: usuariosState.search,
        perfil: usuariosState.perfil,
        url: `/api/usuarios?${params}`
      });
      
      const data = await api(`/api/usuarios?${params}`);
      const container = $('#usuariosCardsContainer');
      if (!container) return;
      
      container.innerHTML = '';
      
      console.log('👥 Usuários carregados:', data.usuarios?.length);
      console.log('📊 Total no servidor:', data.total);
      console.log('📄 Página atual:', data.page, '/', data.totalPages);
      
      (data.usuarios || []).forEach(usuario => {
        const card = criarCardUsuario(usuario);
        container.appendChild(card);
      });
      
      // Atualizar card informativo - buscar TODOS os usuários com notificação
      atualizarInfoNotificacoes();
      
      // Atualizar paginação
      usuariosState.totalPages = data.totalPages || 1;
      
      $('#usuariosPaginaInfo').textContent = 
        `Página ${data.page || 1} de ${usuariosState.totalPages} (${data.total || 0} usuários)`;
      
      $('#usuariosPrev').disabled = usuariosState.page <= 1;
      $('#usuariosNext').disabled = usuariosState.page >= usuariosState.totalPages;
        
    } catch (error) {
      showMessage('Erro ao carregar usuários: ' + error.message, 'error');
    }
  }
  
  // Função para criar card de usuário
  function criarCardUsuario(usuario) {
    const card = document.createElement('div');
    card.className = 'usuario-card';
    card.id = `usuario-card-${usuario.id}`;
    
    const perfilClass = `perfil-${usuario.perfil}`;
    const statusClass = usuario.ativo ? 'ativo' : 'inativo';
    const statusText = usuario.ativo ? 'Ativo' : 'Inativo';
    const statusIcon = usuario.ativo ? 'check-circle' : 'times-circle';
    
    // Equipes display
    let equipesHTML = '';
    if (usuario.equipes && usuario.equipes.length > 0) {
      equipesHTML = usuario.equipes.map(eq => 
        `<span class="usuario-equipe-tag">${eq.nome}</span>`
      ).join('');
    } else {
      equipesHTML = '<span style="color: #9ca3af; font-size: 0.9rem;"><i class="fas fa-ban"></i> Sem equipes atribuídas</span>';
    }
    
    card.innerHTML = `
      <div class="usuario-card-header" onclick="toggleCardUsuario(${usuario.id})">
        <div class="usuario-id">#${usuario.id}</div>
        <div class="usuario-info">
          <div class="usuario-nome">${escapeHtml(usuario.nome)}</div>
          <div class="usuario-email">
            <i class="fas fa-envelope"></i>
            ${escapeHtml(usuario.email)}
          </div>
        </div>
        <div class="usuario-perfil-badge ${perfilClass}">
          ${usuario.perfil}
        </div>
        <div class="usuario-status-badge ${statusClass}">
          <i class="fas fa-${statusIcon}"></i>
          ${statusText}
        </div>
        <i class="fas fa-chevron-down usuario-expand-icon"></i>
      </div>
      
      <div class="usuario-card-body">
        <div class="usuario-card-content">
          <div class="usuario-form-grid">
            <div class="usuario-form-group">
              <label class="usuario-form-label">
                <i class="fas fa-user"></i>
                Nome Completo
              </label>
              <input type="text" class="usuario-form-input" 
                     data-id="${usuario.id}" 
                     data-field="nome" 
                     value="${escapeHtml(usuario.nome)}">
            </div>
            
            <div class="usuario-form-group">
              <label class="usuario-form-label">
                <i class="fas fa-envelope"></i>
                Email
              </label>
              <input type="email" class="usuario-form-input" 
                     data-id="${usuario.id}" 
                     data-field="email" 
                     value="${escapeHtml(usuario.email)}">
            </div>
            
            <div class="usuario-form-group">
              <label class="usuario-form-label">
                <i class="fas fa-lock"></i>
                Nova Senha
              </label>
              <input type="password" class="usuario-form-input" 
                     data-id="${usuario.id}" 
                     data-field="senha" 
                     placeholder="Deixe vazio para manter a senha atual">
            </div>
            
            <div class="usuario-form-group">
              <label class="usuario-form-label">
                <i class="fas fa-id-badge"></i>
                Perfil
              </label>
              <select class="usuario-form-input" 
                      data-id="${usuario.id}" 
                      data-field="perfil"
                      onchange="handlePerfilChangeCard(${usuario.id}, this.value)">
                <option value="admin" ${usuario.perfil === 'admin' ? 'selected' : ''}>Administrador</option>
                <option value="gestor" ${usuario.perfil === 'gestor' ? 'selected' : ''}>Gestor</option>
                <option value="solicitante" ${usuario.perfil === 'solicitante' ? 'selected' : ''}>Solicitante</option>
                <option value="vendedor" ${usuario.perfil === 'vendedor' ? 'selected' : ''}>Vendedor</option>
              </select>
            </div>
            
            <div class="usuario-form-group">
              <label class="usuario-form-label">
                <i class="fas fa-tags"></i>
                Categoria de Acesso
              </label>
              <select class="usuario-form-input" 
                      data-id="${usuario.id}" 
                      data-field="categoria_acesso"
                      id="categoria-${usuario.id}"
                      ${usuario.perfil !== 'solicitante' ? 'disabled' : ''}>
                <option value="">Nenhuma</option>
                <option value="facility" ${usuario.categoria_acesso === 'facility' ? 'selected' : ''}>Facility</option>
                <option value="manipulacao" ${usuario.categoria_acesso === 'manipulacao' ? 'selected' : ''}>Manipulação</option>
                <option value="ambas" ${usuario.categoria_acesso === 'ambas' ? 'selected' : ''}>Ambas</option>
              </select>
            </div>
            
            <div class="usuario-form-group">
              <label class="usuario-form-label">
                <i class="fas fa-bell"></i>
                Notificações por Email
              </label>
              <label class="switch">
                <input type="checkbox" 
                       data-id="${usuario.id}" 
                       data-field="recebe_email_notificacao" 
                       ${usuario.recebe_email_notificacao ? 'checked' : ''}
                       onchange="toggleEmailNotificacao(${usuario.id}, this.checked)">
                <span class="slider round"></span>
              </label>
            </div>
            
            <div class="usuario-form-group" id="grupoPodeEditarEquipes-${usuario.id}" style="${window.currentUserData && window.currentUserData.perfil === 'admin' ? 'display: block;' : 'display: none;'}">
              <label class="usuario-form-label">
                <i class="fas fa-user-shield"></i>
                Pode Editar Equipes
              </label>
              <label class="switch">
                <input type="checkbox" 
                       data-id="${usuario.id}" 
                       data-field="pode_editar_equipes" 
                       ${usuario.pode_editar_equipes ? 'checked' : ''}
                       onchange="togglePodeEditarEquipes(${usuario.id}, this.checked)">
                <span class="slider round"></span>
              </label>
              <small style="color: #6b7280; font-size: 0.85rem; margin-top: 0.5rem; display: block;">
                <i class="fas fa-info-circle"></i> Permite que este usuário crie e edite equipes
              </small>
            </div>
          </div>
          
          <div class="usuario-form-group" style="margin-top: 1rem;">
            <label class="usuario-form-label">
              <i class="fas fa-store"></i>
              Equipes Atribuídas
            </label>
            <div class="usuario-equipes-display">
              ${equipesHTML}
            </div>
            <button class="btn btn-secondary btn-sm" style="margin-top: 0.75rem;" 
                    onclick="abrirModalEquipes(${usuario.id}, ${JSON.stringify(usuario.equipes_ids || []).replace(/"/g, '&quot;')})">
              <i class="fas fa-edit"></i> Editar Equipes
            </button>
          </div>
          
          <div class="usuario-actions">
            <button class="btn btn-success modern-btn" onclick="salvarUsuario(${usuario.id})">
              <i class="fas fa-save"></i>
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    `;
    
    return card;
  }
  
  // Toggle card expandido/recolhido
  window.toggleCardUsuario = function(id) {
    const card = $(`#usuario-card-${id}`);
    if (card) {
      card.classList.toggle('expandido');
    }
  };
  
  // Handler para mudança de perfil dentro do card
  window.handlePerfilChangeCard = function(userId, perfil) {
    const categoriaSelect = $(`#categoria-${userId}`);
    
    if (categoriaSelect) {
      if (perfil === 'solicitante') {
        categoriaSelect.disabled = false;
      } else {
        categoriaSelect.disabled = true;
        categoriaSelect.value = '';
      }
    }
  };
  
  async function carregarEquipesParaSelects() {
    try {
      console.log('🔄 Carregando equipes para checkboxes...');
      const data = await api('/api/equipes');
      equipesCache = data.equipes || [];
      
      console.log('✅ Equipes recebidas da API:', equipesCache.length);
      
      // Atualizar checkboxes do formulário de novo usuário
      const checkboxesContainer = $('#usuariosEquipesCheckboxes');
      console.log('📦 Container encontrado:', !!checkboxesContainer);
      
      if (checkboxesContainer) {
        checkboxesContainer.innerHTML = '';
        
        if (equipesCache.length === 0) {
          console.log('⚠️ Nenhuma equipe disponível no cache');
          checkboxesContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 1rem;">Nenhuma equipe disponível</p>';
        } else {
          console.log('✅ Criando checkboxes para', equipesCache.length, 'equipes');
          equipesCache.forEach(equipe => {
            const div = document.createElement('div');
            div.className = 'equipe-checkbox-item';
            div.innerHTML = `
              <input type="checkbox" id="equipe_${equipe.id}" value="${equipe.id}" 
                     onchange="window.atualizarEquipesSelecionadas()">
              <label for="equipe_${equipe.id}">#${equipe.id} - ${equipe.nome}</label>
            `;
            checkboxesContainer.appendChild(div);
          });
          console.log('✅ Checkboxes criados com sucesso!');
          
          // Resetar checkbox "Selecionar Todas"
          const checkboxTodas = document.getElementById('selecionarTodasEquipes');
          if (checkboxTodas) {
            checkboxTodas.checked = false;
            checkboxTodas.indeterminate = false;
          }
        }
      } else {
        console.error('❌ Container #usuariosEquipesCheckboxes não encontrado no DOM!');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar equipes:', error);
    }
  }
  
  // Função para atualizar tags de equipes selecionadas
  window.atualizarEquipesSelecionadas = function() {
    const tagsContainer = $('#equipesSelecionadas');
    if (!tagsContainer) return;
    
    const checkboxes = document.querySelectorAll('#usuariosEquipesCheckboxes input[type="checkbox"]:checked');
    tagsContainer.innerHTML = '';
    
    checkboxes.forEach(checkbox => {
      const equipeId = parseInt(checkbox.value);
      const equipe = equipesCache.find(e => e.id === equipeId);
      if (equipe) {
        const tag = document.createElement('div');
        tag.className = 'equipe-tag';
        tag.innerHTML = `
          <span>#${equipe.id} - ${equipe.nome}</span>
          <i class="fas fa-times" onclick="window.removerEquipe(${equipe.id})"></i>
        `;
        tagsContainer.appendChild(tag);
      }
    });
    
    // Atualizar estado do checkbox "Selecionar Todas"
    atualizarCheckboxSelecionarTodas();
  };
  
  // Função para remover equipe
  window.removerEquipe = function(equipeId) {
    const checkbox = document.getElementById(`equipe_${equipeId}`);
    if (checkbox) {
      checkbox.checked = false;
      window.atualizarEquipesSelecionadas();
      atualizarCheckboxSelecionarTodas();
    }
  };
  
  // Função para selecionar/desselecionar todas as equipes
  window.toggleTodasEquipes = function(marcar) {
    const checkboxes = document.querySelectorAll('#usuariosEquipesCheckboxes input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = marcar;
    });
    window.atualizarEquipesSelecionadas();
  };
  
  // Função para atualizar estado do checkbox "Selecionar Todas"
  function atualizarCheckboxSelecionarTodas() {
    const checkboxTodas = document.getElementById('selecionarTodasEquipes');
    if (!checkboxTodas) return;
    
    const checkboxes = document.querySelectorAll('#usuariosEquipesCheckboxes input[type="checkbox"]');
    const totalCheckboxes = checkboxes.length;
    const totalMarcados = Array.from(checkboxes).filter(cb => cb.checked).length;
    
    checkboxTodas.checked = totalCheckboxes > 0 && totalMarcados === totalCheckboxes;
    checkboxTodas.indeterminate = totalMarcados > 0 && totalMarcados < totalCheckboxes;
  }
  
  window.salvarUsuario = async function(id) {
    try {
      const perfilSelect = $(`select[data-id="${id}"][data-field="perfil"]`);
      const categoriaSelect = $(`select[data-id="${id}"][data-field="categoria_acesso"]`);
      
      console.log('💾 Salvando usuário ID:', id);
      console.log('   Perfil:', perfilSelect ? perfilSelect.value : 'N/A');
      console.log('   Categoria select encontrado:', !!categoriaSelect);
      console.log('   Categoria disabled:', categoriaSelect ? categoriaSelect.disabled : 'N/A');
      console.log('   Categoria value:', categoriaSelect ? categoriaSelect.value : 'N/A');
      
      const dados = {
        nome: $(`input[data-id="${id}"][data-field="nome"]`).value,
        email: $(`input[data-id="${id}"][data-field="email"]`).value,
        perfil: perfilSelect.value
      };
      
      // Incluir campo de notificação por email
      const emailCheckbox = $(`input[data-id="${id}"][data-field="recebe_email_notificacao"]`);
      if (emailCheckbox) {
        dados.recebe_email_notificacao = emailCheckbox.checked;
        console.log('📧 Recebe email:', dados.recebe_email_notificacao);
      }
      
      // SEMPRE enviar categoria_acesso se for solicitante, mesmo se disabled
      if (dados.perfil === 'solicitante' && categoriaSelect) {
        dados.categoria_acesso = categoriaSelect.value || null;
        console.log('✅ Incluindo categoria_acesso nos dados:', dados.categoria_acesso);
      } else if (dados.perfil !== 'solicitante') {
        // Se mudou de solicitante para outro perfil, limpar categoria
        dados.categoria_acesso = null;
        console.log('🗑️ Limpando categoria_acesso (perfil não é solicitante)');
      }
      
      const senha = $(`input[data-id="${id}"][data-field="senha"]`).value;
      if (senha) dados.senha = senha;
      
      console.log('📤 Enviando dados:', dados);
      
      await api(`/api/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      showMessage('Usuário atualizado com sucesso!');
      carregarUsuarios();
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      showMessage('Erro ao salvar usuário: ' + error.message, 'error');
    }
  };
  
  // Variáveis globais para o modal de equipes
  let usuarioIdEmEdicao = null;
  
  // Abrir modal de equipes
  window.abrirModalEquipes = function(usuarioId, equipesAtuais = []) {
    usuarioIdEmEdicao = usuarioId;
    const modal = $('#modalEquipes');
    const checkboxesContainer = $('#modalEquipesCheckboxes');
    
    if (!modal || !checkboxesContainer) return;
    
    // Limpar e popular checkboxes
    checkboxesContainer.innerHTML = '';
    
    if (equipesCache.length === 0) {
      checkboxesContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 1rem;">Nenhuma equipe disponível</p>';
    } else {
      equipesCache.forEach(equipe => {
        const isChecked = equipesAtuais.includes(equipe.id);
        const div = document.createElement('div');
        div.className = 'equipe-checkbox-item';
        div.innerHTML = `
          <input type="checkbox" id="modal_equipe_${equipe.id}" value="${equipe.id}" 
                 ${isChecked ? 'checked' : ''}
                 onchange="window.atualizarEquipesModal()">
          <label for="modal_equipe_${equipe.id}">#${equipe.id} - ${equipe.nome}</label>
        `;
        checkboxesContainer.appendChild(div);
      });
    }
    
    // Atualizar tags iniciais
    window.atualizarEquipesModal();
    
    // Mostrar modal
    modal.classList.add('active');
  };
  
  // Atualizar tags do modal
  window.atualizarEquipesModal = function() {
    const tagsContainer = $('#modalEquipesSelecionadas');
    if (!tagsContainer) return;
    
    const checkboxes = document.querySelectorAll('#modalEquipesCheckboxes input[type="checkbox"]:checked');
    tagsContainer.innerHTML = '';
    
    if (checkboxes.length === 0) {
      tagsContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; padding: 0.5rem;">Nenhuma equipe selecionada</p>';
    } else {
      checkboxes.forEach(checkbox => {
        const equipeId = parseInt(checkbox.value);
        const equipe = equipesCache.find(e => e.id === equipeId);
        if (equipe) {
          const tag = document.createElement('div');
          tag.className = 'equipe-tag';
          tag.innerHTML = `
            <span>#${equipe.id} - ${equipe.nome}</span>
            <i class="fas fa-times" onclick="window.removerEquipeModal(${equipe.id})"></i>
          `;
          tagsContainer.appendChild(tag);
        }
      });
    }
  };
  
  // Remover equipe do modal
  window.removerEquipeModal = function(equipeId) {
    const checkbox = document.getElementById(`modal_equipe_${equipeId}`);
    if (checkbox) {
      checkbox.checked = false;
      window.atualizarEquipesModal();
    }
  };
  
  // Fechar modal
  window.fecharModalEquipes = function() {
    const modal = $('#modalEquipes');
    if (modal) {
      modal.classList.remove('active');
      usuarioIdEmEdicao = null;
    }
  };
  
  // Salvar equipes do modal
  window.salvarEquipesModal = async function() {
    if (!usuarioIdEmEdicao) {
      console.error('❌ Nenhum usuário em edição');
      return;
    }
    
    try {
      const checkboxes = document.querySelectorAll('#modalEquipesCheckboxes input[type="checkbox"]:checked');
      const equipes_ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
      
      console.log('💾 Salvando equipes do usuário:', usuarioIdEmEdicao);
      console.log('📋 Equipes selecionadas:', equipes_ids);
      console.log('📊 Total de checkboxes marcados:', checkboxes.length);
      
      const dados = { equipes_ids };
      console.log('📦 Objeto sendo enviado:', JSON.stringify(dados, null, 2));
      
      const response = await api(`/api/usuarios/${usuarioIdEmEdicao}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      console.log('✅ Resposta do servidor:', response);
      
      showMessage('Equipes atualizadas com sucesso!');
      fecharModalEquipes();
      carregarUsuarios();
    } catch (error) {
      console.error('❌ Erro ao atualizar equipes:', error);
      showMessage('Erro ao atualizar equipes: ' + error.message, 'error');
    }
  };
  
  window.buscarUsuarios = function() {
    usuariosState.search = $('#usrBusca').value;
    usuariosState.perfil = $('#selFiltroPerfil').value;
    usuariosState.page = 1;
    carregarUsuarios();
  };

  window.toggleEmailNotificacao = async function(id, recebe) {
    try {
      console.log(`🔄 Toggle email notificação - ID: ${id}, Recebe: ${recebe}`);
      
      const result = await api(`/api/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recebe_email_notificacao: recebe })
      });
      
      console.log('✅ Resposta da API:', result);
      
      showMessage(`Notificações por email ${recebe ? 'ativadas' : 'desativadas'} com sucesso!`);
      
      // Atualizar info card
      atualizarInfoNotificacoes();
      atualizarInfoNotificacoes(); // Atualizar o card informativo
    } catch (error) {
      console.error('❌ Erro ao atualizar notificação:', error);
      showMessage('Erro ao atualizar notificações: ' + error.message, 'error');
      // Reverter o checkbox em caso de erro
      const checkbox = document.querySelector(`input[data-id="${id}"][data-field="recebe_email_notificacao"]`);
      if (checkbox) checkbox.checked = !recebe;
    }
  };
  
  window.togglePodeEditarEquipes = async function(id, pode) {
    try {
      console.log(`🔄 Toggle pode editar equipes - ID: ${id}, Pode: ${pode}`);
      
      const result = await api(`/api/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pode_editar_equipes: pode })
      });
      
      console.log('✅ Resposta da API:', result);
      
      showMessage(`Permissão para editar equipes ${pode ? 'concedida' : 'removida'} com sucesso!`);
    } catch (error) {
      console.error('❌ Erro ao atualizar permissão:', error);
      showMessage('Erro ao atualizar permissão: ' + error.message, 'error');
      // Reverter o checkbox em caso de erro
      const checkbox = document.querySelector(`input[data-id="${id}"][data-field="pode_editar_equipes"]`);
      if (checkbox) checkbox.checked = !pode;
    }
  };

  async function atualizarInfoNotificacoes() {
    try {
      console.log('📊 Atualizando info de notificações...');
      // Buscar TODOS os usuários que recebem notificação
      const data = await api('/api/usuarios?pageSize=1000');
      console.log('📥 Dados recebidos:', data.usuarios?.length, 'usuários');
      
      const usuariosComEmail = (data.usuarios || []).filter(u => u.recebe_email_notificacao && u.ativo);
      console.log('✅ Usuários com email ativo:', usuariosComEmail.length);
      
      if (usuariosComEmail.length > 0) {
        console.log('📋 Usuários:', usuariosComEmail.map(u => `${u.nome} (${u.recebe_email_notificacao})`));
      }
      
      const infoDiv = $('#infoUsuariosNotificacao');
      
      if (!infoDiv) {
        console.error('❌ Div #infoUsuariosNotificacao não encontrada!');
        return;
      }
      
      if (usuariosComEmail.length === 0) {
        infoDiv.innerHTML = `
          <p style="margin: 0;">
            <i class="fas fa-exclamation-triangle"></i> 
            <strong>Nenhum usuário está configurado para receber notificações por email</strong>
          </p>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.9;">
            Use o switch na coluna "📧 Email" da tabela acima para ativar notificações para usuários específicos.
          </p>
        `;
      } else {
        const porPerfil = {};
        usuariosComEmail.forEach(u => {
          if (!porPerfil[u.perfil]) porPerfil[u.perfil] = [];
          porPerfil[u.perfil].push(u);
        });
        
        const perfilIcons = {
          admin: 'fa-user-shield',
          gestor: 'fa-user-tie',
          vendedor: 'fa-user-tag',
          solicitante: 'fa-user'
        };
        
        const perfilNomes = {
          admin: 'Administradores',
          gestor: 'Gestores',
          vendedor: 'Vendedores',
          solicitante: 'Solicitantes'
        };
        
        let html = `<p style="margin: 0 0 1rem 0;"><strong><i class="fas fa-check-circle"></i> ${usuariosComEmail.length} usuário(s) recebendo notificações:</strong></p>`;
        
        for (const [perfil, users] of Object.entries(porPerfil)) {
          html += `
            <div style="margin-bottom: 0.75rem;">
              <div style="font-weight: 600; margin-bottom: 0.25rem;">
                <i class="fas ${perfilIcons[perfil]}"></i> ${perfilNomes[perfil]} (${users.length})
              </div>
              <div style="padding-left: 1.5rem; font-size: 0.9rem; opacity: 0.95;">
                ${users.map(u => `${u.nome} (${u.email})`).join('<br>')}
              </div>
            </div>
          `;
        }
        
        infoDiv.innerHTML = html;
      }
    } catch (error) {
      console.error('Erro ao atualizar info notificações:', error);
    }
  }
  
  // Paginação usuários
  $('#usuariosPrev').addEventListener('click', () => {
    if (usuariosState.page > 1) {
      usuariosState.page--;
      carregarUsuarios();
    }
  });
  
  $('#usuariosNext').addEventListener('click', () => {
    if (usuariosState.page < usuariosState.totalPages) {
      usuariosState.page++;
      carregarUsuarios();
    }
  });
  
  // === LOGOUT ===
  window.logout = function() {
    console.log('🚪 Logout chamado');
    localStorage.removeItem(tokenKey);
    window.location.href = '/login.html';
  };
  
  // === DASHBOARD ===
  window.carregarDashboard = async function() {
    try {
      // Buscar dados das equipes
      const resultEquipes = await api('/api/equipes');
      
      // Garantir que equipes é um array
      let equipes = [];
      if (Array.isArray(resultEquipes)) {
        equipes = resultEquipes;
      } else if (resultEquipes && Array.isArray(resultEquipes.equipes)) {
        equipes = resultEquipes.equipes;
      } else if (resultEquipes && Array.isArray(resultEquipes.data)) {
        equipes = resultEquipes.data;
      }
      
      console.log('Total de equipes carregadas:', equipes.length);
      
      // Buscar pedidos dos últimos 30 dias
      const hoje = new Date();
      const trintaDiasAtras = new Date(hoje.setDate(hoje.getDate() - 30));
      const resultPedidos = await api('/api/pedidos?pageSize=100');
      
      // Garantir que todosPedidos é um array
      let todosPedidos = [];
      if (Array.isArray(resultPedidos)) {
        todosPedidos = resultPedidos;
      } else if (resultPedidos && Array.isArray(resultPedidos.pedidos)) {
        todosPedidos = resultPedidos.pedidos;
      } else if (resultPedidos && Array.isArray(resultPedidos.data)) {
        todosPedidos = resultPedidos.data;
      }
      
      console.log('Total de pedidos carregados:', todosPedidos.length);
      
      // Filtrar pedidos dos últimos 30 dias
      const pedidosRecentes = todosPedidos.filter(p => {
        const dataPedido = new Date(p.data);
        return dataPedido >= trintaDiasAtras;
      });
      
      // Calcular totais (apenas pedidos aprovados)
      const totalVendas = pedidosRecentes
        .filter(p => p.status === 'APROVADO')
        .reduce((sum, p) => sum + Number(p.valor_total || 0), 0);
      
      const pedidosPendentes = todosPedidos.filter(p => 
        p.status === 'PENDENTE_APROVACAO'
      ).length;
      
      // Atualizar cards de resumo (com verificação de existência)
      const elemTotalEquipes = $('#totalEquipes');
      const elemTotalPedidos = $('#totalPedidos');
      const elemTotalVendas = $('#totalVendas');
      const elemPedidosPendentes = $('#pedidosPendentes');
      
      if (elemTotalEquipes) elemTotalEquipes.textContent = equipes.length;
      if (elemTotalPedidos) elemTotalPedidos.textContent = pedidosRecentes.length;
      if (elemTotalVendas) {
        elemTotalVendas.textContent = new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(totalVendas);
      }
      if (elemPedidosPendentes) elemPedidosPendentes.textContent = pedidosPendentes;
      
      // Atualizar badge no botão de Pedidos
      const badgePedidosPendentes = $('#badgePedidosPendentes');
      if (badgePedidosPendentes) {
        if (pedidosPendentes > 0) {
          badgePedidosPendentes.textContent = pedidosPendentes;
          badgePedidosPendentes.style.display = 'block';
        } else {
          badgePedidosPendentes.style.display = 'none';
        }
      }
      
      // Renderizar tabela de limites
      const tbody = $('#tbodyDashboard');
      if (!tbody) {
        console.error('Elemento #tbodyDashboard não encontrado');
        return;
      }
      tbody.innerHTML = '';
      
      for (const equipe of equipes) {
        const limiteTotal = Number(equipe.limite_credito || 0);
        const limiteDisponivel = Number(equipe.limite_disponivel || 0);
        const limiteUtilizado = limiteTotal - limiteDisponivel;
        const percUtilizado = limiteTotal > 0 ? (limiteUtilizado / limiteTotal) * 100 : 0;
        
        // Calcular compras da equipe nos últimos 30 dias (apenas pedidos aprovados)
        const pedidosEquipe = pedidosRecentes.filter(p => 
          p.equipe_id === equipe.id && p.status === 'APROVADO'
        );
        const compras30d = pedidosEquipe.reduce((sum, p) => sum + Number(p.valor_total || 0), 0);
        const ticketMedio = pedidosEquipe.length > 0 ? compras30d / pedidosEquipe.length : 0;
        
        // Determinar status
        let statusClass, statusText;
        if (percUtilizado < 50) {
          statusClass = 'excelente';
          statusText = 'Excelente';
        } else if (percUtilizado < 75) {
          statusClass = 'bom';
          statusText = 'Bom';
        } else if (percUtilizado < 90) {
          statusClass = 'atencao';
          statusText = 'Atenção';
        } else {
          statusClass = 'critico';
          statusText = 'Crítico';
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${equipe.nome}</strong></td>
          <td style="text-align: right;">${formatMoney(limiteTotal)}</td>
          <td style="text-align: right;">${formatMoney(limiteDisponivel)}</td>
          <td style="text-align: right;">${formatMoney(limiteUtilizado)}</td>
          <td style="text-align: right;">${formatMoney(compras30d)}</td>
          <td style="text-align: right;">${formatMoney(ticketMedio)}</td>
          <td style="text-align: center;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="progress-bar" style="flex: 1;">
                <div class="progress-fill ${percUtilizado >= 90 ? 'danger' : percUtilizado >= 75 ? 'warning' : ''}" 
                     style="width: ${percUtilizado}%"></div>
              </div>
              <span style="font-weight: 600; min-width: 45px;">${percUtilizado.toFixed(0)}%</span>
            </div>
          </td>
          <td style="text-align: center;">
            <span class="status-badge-dashboard ${statusClass}">${statusText}</span>
          </td>
        `;
        tbody.appendChild(tr);
      }
      
      // Carregar pedidos pendentes
      carregarPedidosPendentes();
      
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      showMessage('Erro ao carregar dashboard: ' + error.message, 'error');
    }
  };
  
  async function carregarPedidosPendentes() {
    try {
      // Buscar apenas pedidos PENDENTE_APROVACAO (os AGUARDANDO já foram aprovados automaticamente)
      const result = await api('/api/pedidos?status=PENDENTE_APROVACAO&pageSize=500');
      
      // Garantir que pedidos é um array
      let pedidos = [];
      if (Array.isArray(result)) {
        pedidos = result;
      } else if (result && Array.isArray(result.pedidos)) {
        pedidos = result.pedidos;
      }
      
      console.log('📋 Pedidos PENDENTE_APROVACAO:', pedidos.length);
      
      const tbody = $('#tbodyPedidosPendentes');
      const section = $('#pedidosPendentesSection');
      
      if (!tbody || !section) {
        console.warn('Elementos de pedidos pendentes não encontrados no DOM');
        return;
      }
      
      if (pedidos.length === 0) {
        section.style.display = 'none';
        return;
      }
      
      section.style.display = 'block';
      tbody.innerHTML = '';
      
      console.log('🔄 Processando pedidos pendentes...');
      for (const pedido of pedidos) {
        console.log('  → Pedido #' + pedido.id + ':', pedido);
        if (!pedido.id) {
          console.warn('Pedido sem ID encontrado:', pedido);
          continue;
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${pedido.id}</strong></td>
          <td>${pedido.equipe_nome || 'N/A'}</td>
          <td style="text-align: right; font-weight: bold; color: #f59e0b;">
            ${formatMoney(pedido.valor_total || 0)}
          </td>
          <td>${pedido.data ? new Date(pedido.data).toLocaleString('pt-BR') : 'N/A'}</td>
          <td>
            <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${pedido.motivo_pendencia || 'Aguardando aprovação'}
            </div>
          </td>
          <td style="text-align: center;">
            <button class="btn btn-sm btn-primary" onclick="abrirModalAprovar(${pedido.id})" 
                    style="background: #22c55e; margin-right: 0.5rem;">
              <i class="fas fa-check"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="abrirModalRejeitar(${pedido.id})">
              <i class="fas fa-times"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="abrirDetalhesPedido(${pedido.id})">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
        console.log('  ✅ Linha adicionada ao tbody para pedido #' + pedido.id);
      }
      console.log('✅ Total de linhas adicionadas:', tbody.children.length);
    } catch (error) {
      console.error('Erro ao carregar pedidos pendentes:', error);
    }
  }
  
  // === GERENCIAMENTO DE PEDIDOS ===
  window.abrirDetalhesPedido = async function(pedidoId) {
    if (!pedidoId || isNaN(pedidoId)) {
      console.error('ID de pedido inválido:', pedidoId);
      return;
    }
    
    try {
      const data = await api(`/api/pedidos/${pedidoId}`);
      renderizarDetalhesPedido(data);
      const modal = $('#modalPedidoDetalhes');
      if (modal) modal.style.display = 'flex';
    } catch (error) {
      showMessage('Erro ao carregar detalhes do pedido: ' + error.message, 'error');
    }
  };
  
  function renderizarDetalhesPedido(data) {
    const { pedido, itens } = data;
    const modalContent = $('#pedidoModalContent');
    
    const valorTotal = formatMoney(pedido.valor_total);
    const dataPedido = new Date(pedido.data).toLocaleString('pt-BR');
    
    // Verificar perfil do usuário
    const token = getToken();
    const payload = parseJwt(token);
    const mostrarRastreamento = payload && payload.perfil !== 'gestor';
    
    let html = `
      <div style="padding: 1rem;">
        <div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div><strong>Pedido:</strong> #${pedido.id}</div>
            <div><strong>Data:</strong> ${dataPedido}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div><strong>Equipe:</strong> ${pedido.equipe_nome}</div>
            <div><strong>Status:</strong> <span class="status-badge status-${pedido.status}">${getStatusLabel(pedido.status)}</span></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div><strong>📋 Código ERP:</strong> ${pedido.codigo_erp || '<span style="color: #9ca3af;">Não informado</span>'}</div>
            <div><strong>🏢 CGC/CNPJ:</strong> ${pedido.cgc || '<span style="color: #9ca3af;">Não informado</span>'}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
            <div><strong>👤 Solicitante:</strong> ${pedido.usuario_nome || '<span style="color: #9ca3af;">Não informado</span>'} ${pedido.usuario_email ? `<span style="color: #6b7280;">(${pedido.usuario_email})</span>` : ''}</div>
          </div>
        </div>
        
        ${mostrarRastreamento ? renderizarRastreamento(pedido) : ''}
        
        <div class="itens-section">
          <h3><i class="fas fa-box-open"></i> Itens do Pedido</h3>
          <table class="pedido-itens-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Produto</th>
                <th style="text-align: center;">Qtd</th>
                <th style="text-align: right;">Valor Unit.</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>`;
    
    for (const item of itens) {
      html += `
        <tr>
          <td class="item-codigo">${item.codprod}</td>
          <td>${item.descricao}</td>
          <td style="text-align: center;">${item.quantidade}</td>
          <td class="item-valor">${formatMoney(item.valor_unitario || 0)}</td>
          <td class="item-valor">${formatMoney((item.valor_unitario || 0) * (item.quantidade || 0))}</td>
        </tr>`;
    }
    
    html += `
            </tbody>
          </table>
          <div class="pedido-total-geral">
            <span class="pedido-total-label">Valor Total:</span>
            <span class="pedido-total-valor">${valorTotal}</span>
          </div>
        </div>`;
    
    if (pedido.motivo_pendencia) {
      html += `
        <div style="margin-top: 2rem; padding: 1rem; background: #fff3cd; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <strong>⚠️ Motivo da Pendência:</strong><br>
          ${pedido.motivo_pendencia}
        </div>`;
    }
    
    if (pedido.observacoes_rastreamento) {
      html += `
        <div style="margin-top: 2rem; padding: 1rem; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <strong>📝 Observações:</strong><br>
          ${pedido.observacoes_rastreamento}
        </div>`;
    }
    
    html += '</div>';
    modalContent.innerHTML = html;
  }
  
  function renderizarRastreamento(pedido) {
    const etapas = [
      {
        titulo: 'Pedido Recebido',
        descricao: 'Pedido recebido e confirmado',
        icon: 'check-circle',
        data: pedido.data_confirmacao,
        concluida: !!pedido.data_confirmacao
      },
      {
        titulo: 'Separação no Estoque',
        descricao: 'Produtos sendo separados',
        icon: 'boxes',
        data: pedido.data_separacao,
        concluida: !!pedido.data_separacao,
        emAndamento: pedido.status === 'EM_SEPARACAO'
      },
      {
        titulo: 'Em Transporte',
        descricao: 'Pedido saiu do estoque',
        icon: 'truck',
        data: pedido.data_transporte,
        concluida: !!pedido.data_transporte,
        emAndamento: pedido.status === 'EM_TRANSPORTE'
      },
      {
        titulo: 'Saiu para Entrega',
        descricao: 'Em rota de entrega',
        icon: 'shipping-fast',
        data: pedido.data_saida,
        concluida: !!pedido.data_saida,
        emAndamento: pedido.status === 'SAIU_ENTREGA'
      },
      {
        titulo: 'Entregue',
        descricao: 'Pedido entregue ao cliente',
        icon: 'check-double',
        data: pedido.data_entrega,
        concluida: !!pedido.data_entrega,
        emAndamento: pedido.status === 'ENTREGUE'
      }
    ];
    
    let html = `
      <div class="rastreamento-section" style="margin-bottom: 2rem;">
        <h3><i class="fas fa-route"></i> Progresso da Entrega</h3>
        <div class="rastreamento-timeline">`;
    
    for (const etapa of etapas) {
      const statusClass = etapa.concluida ? 'concluida' : (etapa.emAndamento ? 'em-andamento' : 'pendente');
      const dataFormatada = etapa.data ? new Date(etapa.data).toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '';
      
      html += `
        <div class="rastreamento-etapa ${statusClass}">
          <div class="rastreamento-icon">
            <i class="fas fa-${etapa.icon}"></i>
          </div>
          <div class="rastreamento-content">
            <div class="rastreamento-titulo">${etapa.titulo}</div>
            <div class="rastreamento-descricao">${etapa.descricao}</div>
            ${dataFormatada ? `<div class="rastreamento-data">${dataFormatada}</div>` : ''}
          </div>
        </div>`;
    }
    
    html += `
        </div>
      </div>`;
    
    return html;
  }
  
  function getStatusLabel(status) {
    const labels = {
      'PENDENTE_APROVACAO': 'Pendente Aprovação',
      'APROVADO': 'Aprovado',
      'AGUARDANDO': 'Aguardando',
      'EM_SEPARACAO': 'Em Separação',
      'EM_TRANSPORTE': 'Em Transporte',
      'SAIU_ENTREGA': 'Saiu para Entrega',
      'ENTREGUE': 'Entregue',
      'CANCELADO': 'Cancelado'
    };
    return labels[status] || status;
  }
  
  window.fecharModalPedidoDetalhes = function() {
    const modal = $('#modalPedidoDetalhes');
    if (modal) modal.style.display = 'none';
  };
  
  // === APROVAÇÃO DE PEDIDOS ===
  let pedidoParaAprovar = null;
  
  window.abrirModalAprovar = async function(pedidoId) {
    if (!pedidoId || isNaN(pedidoId)) {
      console.error('ID de pedido inválido:', pedidoId);
      return;
    }
    
    try {
      const data = await api(`/api/pedidos/${pedidoId}`);
      pedidoParaAprovar = data.pedido;
      
      // Buscar dados da equipe para obter limite disponível
      const equipeData = await api(`/api/equipes`);
      const equipes = Array.isArray(equipeData) ? equipeData : (equipeData.equipes || []);
      const equipe = equipes.find(e => e.id === pedidoParaAprovar.equipe_id);
      
      const valorPedido = Number(pedidoParaAprovar.valor_total);
      const limiteDisponivel = equipe ? Number(equipe.limite_disponivel) : 0;
      const faltante = Math.max(0, valorPedido - limiteDisponivel);
      
      // Preencher campos do modal
      $('#aprovarPedidoId').textContent = pedidoParaAprovar.id;
      $('#aprovarEquipeNome').textContent = pedidoParaAprovar.equipe_nome;
      $('#aprovarPedidoValor').textContent = formatMoney(valorPedido);
      $('#aprovarLimiteDisponivel').textContent = formatMoney(limiteDisponivel);
      $('#aprovarFaltante').textContent = faltante > 0 ? formatMoney(faltante) : 'R$ 0,00';
      $('#aprovarMotivo').textContent = pedidoParaAprovar.motivo_pendencia || 'Não especificado';
      
      // Mostrar/ocultar sugestão de aumento
      const sugestaoEl = $('#sugestaoAumento');
      const valorSugeridoEl = $('#valorSugerido');
      if (faltante > 0) {
        sugestaoEl.style.display = 'block';
        valorSugeridoEl.textContent = formatMoney(faltante);
        $('#aumentarLimiteValor').value = faltante.toFixed(2);
        $('#aumentarLimiteValor').setAttribute('min', faltante.toFixed(2));
      } else {
        sugestaoEl.style.display = 'none';
        $('#aumentarLimiteValor').value = '';
        $('#aumentarLimiteValor').setAttribute('min', '0');
      }
      
      const modal = $('#modalAprovarPedido');
      if (modal) modal.style.display = 'flex';
    } catch (error) {
      showMessage('Erro ao carregar pedido: ' + error.message, 'error');
    }
  };
  
  window.fecharModalAprovar = function() {
    const modal = $('#modalAprovarPedido');
    if (modal) modal.style.display = 'none';
    pedidoParaAprovar = null;
  };
  
  window.confirmarAprovacao = async function() {
    if (!pedidoParaAprovar) return;
    
    try {
      const aumentarLimite = $('#aumentarLimiteValor').value;
      const body = {};
      
      if (aumentarLimite && Number(aumentarLimite) > 0) {
        body.aumentar_limite = Number(aumentarLimite);
      }
      
      await api(`/api/pedidos/${pedidoParaAprovar.id}/aprovar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      showMessage('Pedido aprovado com sucesso!', 'success');
      fecharModalAprovar();
      carregarDashboard();
      carregarPedidos(); // Recarrega a lista de pedidos para mostrar o status atualizado
    } catch (error) {
      showMessage('Erro ao aprovar pedido: ' + error.message, 'error');
    }
  };
  
  // === REJEIÇÃO DE PEDIDOS ===
  let pedidoParaRejeitar = null;
  
  window.abrirModalRejeitar = async function(pedidoId) {
    if (!pedidoId || isNaN(pedidoId)) {
      console.error('ID de pedido inválido:', pedidoId);
      return;
    }
    
    try {
      const data = await api(`/api/pedidos/${pedidoId}`);
      pedidoParaRejeitar = data.pedido;
      
      $('#rejeitarPedidoId').textContent = pedidoParaRejeitar.id;
      $('#rejeitarEquipeNome').textContent = pedidoParaRejeitar.equipe_nome;
      $('#rejeitarPedidoValor').textContent = formatMoney(pedidoParaRejeitar.valor_total);
      $('#rejeitarMotivo').value = '';
      
      const modal = $('#modalRejeitarPedido');
      if (modal) modal.style.display = 'flex';
    } catch (error) {
      showMessage('Erro ao carregar pedido: ' + error.message, 'error');
    }
  };
  
  window.fecharModalRejeitar = function() {
    const modal = $('#modalRejeitarPedido');
    if (modal) modal.style.display = 'none';
    pedidoParaRejeitar = null;
  };
  
  window.confirmarRejeicao = async function() {
    if (!pedidoParaRejeitar) return;
    
    const motivo = $('#rejeitarMotivo').value.trim();
    if (!motivo) {
      showMessage('Por favor, informe o motivo da rejeição', 'error');
      return;
    }
    
    try {
      await api(`/api/pedidos/${pedidoParaRejeitar.id}/rejeitar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
      });
      
      showMessage('Pedido rejeitado', 'success');
      fecharModalRejeitar();
      carregarDashboard();
      carregarPedidos(); // Recarrega a lista de pedidos para mostrar o status atualizado
    } catch (error) {
      showMessage('Erro ao rejeitar pedido: ' + error.message, 'error');
    }
  };

  // === GALERIA (PRODUTOS POR EQUIPE) ===
  let galeriaState = {
    equipeId: null,
    produtosAtribuidos: [],
    produtosDisponiveis: [],
    produtosSelecionados: new Set()
  };

  async function carregarGaleria() {
    try {
      // Carregar equipes no select
      const data = await api('/api/equipes');
      const equipes = data.equipes || data;
      const select = $('#galeriaEquipeSelect');
      
      select.innerHTML = '<option value="">Selecione uma equipe...</option>';
      equipes.forEach(eq => {
        const option = document.createElement('option');
        option.value = eq.id;
        option.textContent = eq.nome;
        select.appendChild(option);
      });

      // Listener para mudança de equipe
      select.addEventListener('change', async (e) => {
        const equipeId = e.target.value;
        if (equipeId) {
          galeriaState.equipeId = equipeId;
          galeriaState.produtosSelecionados.clear();
          await carregarProdutosDaEquipe(equipeId);
          $('#galeriaStats').style.display = 'block';
          $('#galeriaContent').style.display = 'block';
        } else {
          $('#galeriaStats').style.display = 'none';
          $('#galeriaContent').style.display = 'none';
        }
      });

      // Listener para sub-tabs
      $$('.galeria-subtab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          const subtab = e.currentTarget.dataset.subtab;
          $$('.galeria-subtab').forEach(t => t.classList.remove('active'));
          $$('.galeria-subtab-content').forEach(c => c.classList.remove('active'));
          e.currentTarget.classList.add('active');
          $(`#galeria-${subtab}`).classList.add('active');
        });
      });

      // Listener para busca em atribuídos
      const searchAtribuidos = $('#searchAtribuidos');
      if (searchAtribuidos) {
        searchAtribuidos.addEventListener('input', (e) => {
          filtrarProdutosAtribuidos(e.target.value);
        });
      }

      // Listener para busca em disponíveis
      const searchDisponiveis = $('#searchDisponiveis');
      if (searchDisponiveis) {
        searchDisponiveis.addEventListener('input', (e) => {
          filtrarProdutosDisponiveis(e.target.value);
        });
      }

      // Listener para selecionar todos
      const selectAll = $('#selectAllDisponiveis');
      if (selectAll) {
        selectAll.addEventListener('change', (e) => {
          const checkboxes = $$('#tbodyProdutosDisponiveis .product-checkbox');
          checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const produtoId = parseInt(cb.dataset.produtoId);
            if (e.target.checked) {
              galeriaState.produtosSelecionados.add(produtoId);
            } else {
              galeriaState.produtosSelecionados.delete(produtoId);
            }
          });
          atualizarContadorSelecionados();
        });
      }

      // Listener para adicionar selecionados
      const btnAdicionar = $('#btnAdicionarSelecionados');
      if (btnAdicionar) {
        btnAdicionar.addEventListener('click', () => {
          adicionarProdutosSelecionados();
        });
      }

    } catch (error) {
      console.error('Erro ao carregar galeria:', error);
      showMessage('Erro ao carregar galeria: ' + error.message, 'error');
    }
  }

  async function carregarProdutosDaEquipe(equipeId) {
    try {
      // Carregar produtos atribuídos
      const dataAtribuidos = await api(`/api/equipes/${equipeId}/produtos`);
      galeriaState.produtosAtribuidos = dataAtribuidos.produtos || [];

      // Carregar todos os produtos para calcular disponíveis
      const dataTodos = await api('/api/produtos');
      const todosProdutos = dataTodos.produtos || dataTodos;
      
      const idsAtribuidos = new Set(galeriaState.produtosAtribuidos.map(p => p.id));
      galeriaState.produtosDisponiveis = todosProdutos.filter(p => !idsAtribuidos.has(p.id));

      // Atualizar estatísticas
      $('#galeriaAtribuidos').textContent = galeriaState.produtosAtribuidos.length;
      $('#galeriaDisponiveis').textContent = galeriaState.produtosDisponiveis.length;
      $('#galeriaTotal').textContent = todosProdutos.length;

      // Renderizar tabelas
      renderizarProdutosAtribuidos();
      renderizarProdutosDisponiveis();

    } catch (error) {
      console.error('Erro ao carregar produtos da equipe:', error);
      showMessage('Erro ao carregar produtos: ' + error.message, 'error');
    }
  }

  function renderizarProdutosAtribuidos() {
    const tbody = $('#tbodyProdutosAtribuidos');
    tbody.innerHTML = '';

    if (galeriaState.produtosAtribuidos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray-500);">
            <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
            Nenhum produto atribuído a esta equipe
          </td>
        </tr>
      `;
      $('#countAtribuidos').textContent = '';
      return;
    }

    $('#countAtribuidos').textContent = `${galeriaState.produtosAtribuidos.length} produto(s)`;

    galeriaState.produtosAtribuidos.forEach(produto => {
      const tr = document.createElement('tr');
      const imagemUrl = produto.imagem_url || '/images/produtos/sem-imagem.png';
      const dataAtribuicao = produto.data_atribuicao ? new Date(produto.data_atribuicao).toLocaleDateString('pt-BR') : '-';
      
      tr.innerHTML = `
        <td>
          <img src="${imagemUrl}" alt="${produto.descricao}" 
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"
               onerror="this.src='/images/produtos/sem-imagem.png'">
        </td>
        <td><strong>${produto.codigo || '-'}</strong></td>
        <td>${produto.descricao}</td>
        <td style="text-align: right;">${formatMoney(produto.preco || 0)}</td>
        <td>${dataAtribuicao}</td>
        <td style="text-align: center;">
          <button class="btn btn-sm btn-danger" onclick="removerProdutoDaEquipe(${produto.id})" title="Remover">
            <i class="fas fa-times"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderizarProdutosDisponiveis() {
    const tbody = $('#tbodyProdutosDisponiveis');
    tbody.innerHTML = '';

    if (galeriaState.produtosDisponiveis.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray-500);">
            <i class="fas fa-check-circle" style="font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
            Todos os produtos já foram atribuídos a esta equipe
          </td>
        </tr>
      `;
      const selectAll = $('#selectAllDisponiveis');
      if (selectAll) selectAll.checked = false;
      return;
    }

    galeriaState.produtosDisponiveis.forEach(produto => {
      const tr = document.createElement('tr');
      const imagemUrl = produto.imagem_url || '/images/produtos/sem-imagem.png';
      
      tr.innerHTML = `
        <td style="text-align: center;">
          <input type="checkbox" class="product-checkbox" data-produto-id="${produto.id}">
        </td>
        <td>
          <img src="${imagemUrl}" alt="${produto.descricao}" 
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;"
               onerror="this.src='/images/produtos/sem-imagem.png'">
        </td>
        <td><strong>${produto.codigo || '-'}</strong></td>
        <td>${produto.descricao}</td>
        <td style="text-align: right;">${formatMoney(produto.preco || 0)}</td>
        <td style="text-align: center;">
          <button class="btn btn-sm btn-primary" onclick="adicionarProdutoUnico(${produto.id})" title="Adicionar">
            <i class="fas fa-plus"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);

      // Listener para checkbox individual
      const checkbox = tr.querySelector('.product-checkbox');
      checkbox.addEventListener('change', (e) => {
        const produtoId = parseInt(e.target.dataset.produtoId);
        if (e.target.checked) {
          galeriaState.produtosSelecionados.add(produtoId);
        } else {
          galeriaState.produtosSelecionados.delete(produtoId);
        }
        atualizarContadorSelecionados();
      });
    });

    const selectAll = $('#selectAllDisponiveis');
    if (selectAll) selectAll.checked = false;
  }

  function filtrarProdutosAtribuidos(termo) {
    const rows = $$('#tbodyProdutosAtribuidos tr');
    let visiveis = 0;

    rows.forEach(row => {
      const texto = row.textContent.toLowerCase();
      if (texto.includes(termo.toLowerCase())) {
        row.style.display = '';
        visiveis++;
      } else {
        row.style.display = 'none';
      }
    });

    const countElement = $('#countAtribuidos');
    if (countElement) {
      countElement.textContent = visiveis > 0 ? `${visiveis} produto(s)` : '';
    }
  }

  function filtrarProdutosDisponiveis(termo) {
    const rows = $$('#tbodyProdutosDisponiveis tr');
    rows.forEach(row => {
      const texto = row.textContent.toLowerCase();
      row.style.display = texto.includes(termo.toLowerCase()) ? '' : 'none';
    });
  }

  function atualizarContadorSelecionados() {
    const count = galeriaState.produtosSelecionados.size;
    const countElement = $('#countSelecionados');
    if (countElement) {
      countElement.textContent = `${count} selecionado(s)`;
    }
    
    const btn = $('#btnAdicionarSelecionados');
    if (btn) {
      if (count > 0) {
        btn.disabled = false;
        btn.style.opacity = '1';
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
      }
    }
  }

  window.adicionarProdutoUnico = async function(produtoId) {
    if (!galeriaState.equipeId) return;

    try {
      await api(`/api/equipes/${galeriaState.equipeId}/produtos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: produtoId })
      });

      showMessage('Produto adicionado com sucesso!', 'success');
      await carregarProdutosDaEquipe(galeriaState.equipeId);
      
      // Voltar para aba de atribuídos
      const tabAtribuidos = $('.galeria-subtab[data-subtab="atribuidos"]');
      if (tabAtribuidos) tabAtribuidos.click();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      showMessage('Erro ao adicionar produto: ' + error.message, 'error');
    }
  };

  async function adicionarProdutosSelecionados() {
    if (!galeriaState.equipeId || galeriaState.produtosSelecionados.size === 0) return;

    try {
      const produto_ids = Array.from(galeriaState.produtosSelecionados);
      
      await api(`/api/equipes/${galeriaState.equipeId}/produtos/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_ids })
      });

      showMessage(`${produto_ids.length} produto(s) adicionado(s) com sucesso!`, 'success');
      galeriaState.produtosSelecionados.clear();
      await carregarProdutosDaEquipe(galeriaState.equipeId);
      
      // Voltar para aba de atribuídos
      const tabAtribuidos = $('.galeria-subtab[data-subtab="atribuidos"]');
      if (tabAtribuidos) tabAtribuidos.click();
    } catch (error) {
      console.error('Erro ao adicionar produtos:', error);
      showMessage('Erro ao adicionar produtos: ' + error.message, 'error');
    }
  }

  window.removerProdutoDaEquipe = async function(produtoId) {
    if (!galeriaState.equipeId) return;

    if (!confirm('Tem certeza que deseja remover este produto da equipe?')) return;

    try {
      await api(`/api/equipes/${galeriaState.equipeId}/produtos/${produtoId}`, {
        method: 'DELETE'
      });

      showMessage('Produto removido com sucesso!', 'success');
      await carregarProdutosDaEquipe(galeriaState.equipeId);
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      showMessage('Erro ao remover produto: ' + error.message, 'error');
    }
  };

  // Configurar listener do perfil para mostrar/esconder categoria
  function configurarListenerPerfil() {
    const novoPerfilSelect = $('#novoPerfil');
    console.log('🔍 Tentando configurar listener. novoPerfil element:', novoPerfilSelect);
    
    if (novoPerfilSelect) {
      console.log('✅ Event listener sendo adicionado ao novoPerfil');
      novoPerfilSelect.addEventListener('change', function() {
        const perfil = this.value;
        console.log('🔄 Perfil mudou para:', perfil);
        const equipeSelect = $('#novoEquipe');
        const equipeObrigatorio = $('#equipeObrigatorio');
        const grupoCategoriaAcesso = $('#grupoCategoriaAcesso');
        const categoriaAcessoSelect = $('#novoCategoriaAcesso');
        
        console.log('📦 Elementos encontrados:', {
          equipeSelect: !!equipeSelect,
          grupoCategoriaAcesso: !!grupoCategoriaAcesso,
          categoriaAcessoSelect: !!categoriaAcessoSelect
        });
        
        // Se perfil for "solicitante", torna o campo obrigatório
        if (perfil === 'solicitante') {
          if (equipeSelect) equipeSelect.required = true;
          if (equipeObrigatorio) equipeObrigatorio.style.display = 'inline';
          // Mostrar categoria de acesso
          if (grupoCategoriaAcesso) {
            console.log('✅ Mostrando campo categoria de acesso');
            grupoCategoriaAcesso.style.display = 'block';
            if (categoriaAcessoSelect) categoriaAcessoSelect.required = true;
          }
        } else {
          console.log('❌ Escondendo campo categoria de acesso');
          if (equipeSelect) equipeSelect.required = false;
          if (equipeObrigatorio) equipeObrigatorio.style.display = 'none';
          // Esconder categoria de acesso
          if (grupoCategoriaAcesso) {
            grupoCategoriaAcesso.style.display = 'none';
            if (categoriaAcessoSelect) categoriaAcessoSelect.required = false;
          }
        }
      });
    } else {
      console.log('❌ Elemento novoPerfil não encontrado! Tentando novamente em 1s...');
      setTimeout(configurarListenerPerfil, 1000);
    }
  }

  // Carregar e exibir badge de equipes do usuário no cabeçalho
  async function carregarEquipesBadge() {
    try {
      console.log('🏷️ Iniciando carregarEquipesBadge...');
      const token = getToken();
      if (!token) {
        console.log('❌ Token não encontrado');
        return;
      }
      
      const payload = parseJwt(token);
      if (!payload || !payload.id) {
        console.log('❌ Payload inválido');
        return;
      }
      
      console.log('👤 Buscando dados do próprio usuário...');
      // Buscar dados do usuário incluindo equipes
      const usuario = await api('/api/usuarios/me');
      console.log('📦 Usuário recebido:', usuario);
      
      if (!usuario || !usuario.equipes) {
        console.log('❌ Usuário sem equipes');
        return;
      }
      
      const badgeEl = $('#userEquipesBadge');
      if (!badgeEl) {
        console.log('❌ Elemento #userEquipesBadge não encontrado no DOM');
        return;
      }
      console.log('✅ Elemento badge encontrado:', badgeEl);
      
      const totalEquipes = usuario.equipes.length;
      console.log('📊 Total de equipes do usuário:', totalEquipes);
      
      if (totalEquipes === 0) {
        console.log('⚠️ Usuário sem equipes, ocultando badge');
        badgeEl.style.display = 'none';
        return;
      }
      
      // Buscar total de equipes do sistema para determinar se gerencia todas
      const todasEquipes = await api('/api/equipes');
      const totalSistema = todasEquipes.length;
      console.log('📊 Total de equipes no sistema:', totalSistema);
      
      // Determinar classe e texto do badge
      let badgeClass = 'user-equipes-badge';
      let badgeText = '';
      let tooltipText = '';
      
      if (totalEquipes === 1) {
        badgeClass += ' single';
        badgeText = '1 equipe';
        tooltipText = `Gerencia 1 equipe:\n\n• ${usuario.equipes[0].nome}`;
      } else if (totalEquipes === totalSistema) {
        badgeClass += ' all';
        badgeText = `${totalEquipes} equipes (TODAS)`;
        const listaEquipes = usuario.equipes.map(e => `• ${e.nome}`).join('\n');
        tooltipText = `Gerencia todas as ${totalEquipes} equipes:\n\n${listaEquipes}`;
      } else {
        badgeClass += ' multiple';
        badgeText = `${totalEquipes} equipes`;
        const listaEquipes = usuario.equipes.map(e => `• ${e.nome}`).join('\n');
        tooltipText = `Gerencia ${totalEquipes} equipes:\n\n${listaEquipes}`;
      }
      
      badgeEl.className = badgeClass;
      badgeEl.textContent = badgeText;
      badgeEl.setAttribute('data-tooltip', tooltipText);
      badgeEl.style.display = 'inline-block';
      
      console.log('✅ Badge configurado:', { badgeClass, badgeText, tooltipText });
      console.log('✅ Badge exibido com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao carregar badge de equipes:', error);
    }
  }

  // === INICIALIZAÇÃO ===
  document.addEventListener('DOMContentLoaded', () => {
    ensureAuth();
    
    // Função para obter saudação baseada no horário
    function obterSaudacao() {
      const hora = new Date().getHours();
      if (hora >= 5 && hora < 12) {
        return 'Bom dia';
      } else if (hora >= 12 && hora < 18) {
        return 'Boa tarde';
      } else {
        return 'Boa noite';
      }
    }
    
    // Mostrar saudação do usuário e verificar perfil
    const token = getToken();
    const payload = parseJwt(token);
    if (payload) {
      // Atualizar nome no dashboard
      const greetingDashboard = $('#userGreetingDashboard');
      if (greetingDashboard) {
        greetingDashboard.textContent = payload.nome;
      }
      
      // Atualizar saudação baseada no horário
      const saudacaoHorario = $('#saudacaoHorario');
      if (saudacaoHorario) {
        saudacaoHorario.textContent = obterSaudacao();
      }
      
      // Carregar badge de equipes no cabeçalho
      carregarEquipesBadge();
      
      // Mostrar controles de admin se for admin
      mostrarControlesAdmin();
      
      // Se o usuário for GESTOR (não admin), esconder abas de Produtos e Usuários
      if (payload.perfil === 'gestor') {
        const tabProdutos = document.querySelector('#produtosTab');
        const contentProdutos = $('#tab-produtos');
        if (tabProdutos) tabProdutos.style.display = 'none';
        if (contentProdutos) contentProdutos.style.display = 'none';
        console.log('👤 Perfil GESTOR: Menu Produtos oculto');
        
        const tabUsuarios = document.querySelector('#usuariosTab');
        const contentUsuarios = $('#tab-usuarios');
        if (tabUsuarios) tabUsuarios.style.display = 'none';
        if (contentUsuarios) contentUsuarios.style.display = 'none';
        console.log('👤 Perfil GESTOR: Menu Usuários oculto');
        
        // Ocultar aba de Emails (apenas admin)
        const tabEmails = document.querySelector('[data-tab="emails"]');
        const contentEmails = $('#tab-emails');
        if (tabEmails) tabEmails.style.display = 'none';
        if (contentEmails) contentEmails.style.display = 'none';
        console.log('👤 Perfil GESTOR: Menu Emails oculto');
        
        // Gestor não pode criar usuários Admin
        const optionAdmin = $('#novoPerfil option[value="admin"]');
        if (optionAdmin) {
          optionAdmin.style.display = 'none';
          console.log('👤 Perfil GESTOR: Opção Admin oculta no cadastro de usuários');
        }
      }
      
      // Se for ADMIN, garantir que as abas de usuários e produtos estão visíveis
      if (payload.perfil === 'admin') {
        const tabUsuarios = document.querySelector('#usuariosTab');
        const contentUsuarios = $('#tab-usuarios');
        if (tabUsuarios) tabUsuarios.style.display = '';
        if (contentUsuarios) contentUsuarios.style.display = '';
        console.log('👤 Perfil ADMIN: Menu Usuários visível');
        
        const tabProdutos = document.querySelector('#produtosTab');
        const contentProdutos = $('#tab-produtos');
        if (tabProdutos) tabProdutos.style.display = '';
        if (contentProdutos) contentProdutos.style.display = '';
        console.log('👤 Perfil ADMIN: Menu Produtos visível');
      }
    }
    
    initTabs();
    carregarEquipesParaSelects().then(() => {
      loadTabData('dashboard'); // Carregar dashboard inicial
      // Função carregarEquipesParaCheckboxes não existe, já é feita em carregarEquipesParaSelects
      
      // Configurar listener após carregar equipes (garantir que DOM está pronto)
      setTimeout(() => {
        configurarListenerPerfil();
      }, 500);
    });
    
    // Carregar filtro de equipes para pedidos
    carregarEquipesFiltro();
    
    // Carregar filtro de solicitantes para pedidos
    carregarSolicitantesFiltro();
    
    // Restaurar filtro de status salvo
    const statusSalvo = localStorage.getItem('pedidos_status_filtro');
    if (statusSalvo) {
      const radioStatus = document.querySelector(`input[name="filtroStatus"][value="${statusSalvo}"]`);
      if (radioStatus) {
        radioStatus.checked = true;
        pedidosState.status = statusSalvo;
        
        // Atualizar badge
        const badge = $('#badgeStatus');
        const btnStatus = $('#btnFiltroStatus');
        if (statusSalvo === '') {
          if (badge) badge.textContent = '';
          if (btnStatus) btnStatus.classList.remove('active');
        } else {
          if (badge) badge.textContent = '1';
          if (btnStatus) btnStatus.classList.add('active');
        }
      }
    }
    
    // Restaurar filtro de categoria salvo
    const categoriaSalva = localStorage.getItem('pedidos_categoria_filtro');
    if (categoriaSalva) {
      const radioCategoria = document.querySelector(`input[name="filtroCategoria"][value="${categoriaSalva}"]`);
      if (radioCategoria) {
        radioCategoria.checked = true;
        pedidosState.categoria = categoriaSalva;
        
        // Atualizar badge
        const badge = $('#badgeCategoria');
        const btnCategoria = $('#btnFiltroCategoria');
        if (categoriaSalva === '') {
          if (badge) badge.textContent = '';
          if (btnCategoria) btnCategoria.classList.remove('active');
        } else {
          if (badge) badge.textContent = '1';
          if (btnCategoria) btnCategoria.classList.add('active');
        }
      }
    }
    
    // Mostrar barra de filtros (agora para todos os perfis, pois tem filtro de status)
    const filtrosBar = $('#filtrosAvancadosPedidos');
    if (filtrosBar) {
      filtrosBar.style.display = 'flex';
      console.log('✅ Barra de filtros exibida');
    }
    
    // Fechar modal ao clicar fora (com verificações de null)
    const modalEditarProduto = $('#modalEditarProduto');
    if (modalEditarProduto) {
      modalEditarProduto.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
          fecharModalProduto();
        }
      });
    }
    
    const modalPedidoDetalhes = $('#modalPedidoDetalhes');
    if (modalPedidoDetalhes) {
      modalPedidoDetalhes.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
          fecharModalPedidoDetalhes();
        }
      });
    }
    
    // Configurar formulário de novo usuário
    const formNovoUsuario = $('#formNovoUsuario');
    if (formNovoUsuario) {
      formNovoUsuario.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          const perfil = $('#novoPerfil').value;
          const categoria_acesso = $('#novoCategoriaAcesso').value || null;
          
          // Obter equipes selecionadas via checkboxes
          const checkboxes = document.querySelectorAll('#usuariosEquipesCheckboxes input[type="checkbox"]:checked');
          const equipes_ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
        
          // Validação: perfil "solicitante" requer pelo menos uma equipe
          if (perfil === 'solicitante' && equipes_ids.length === 0) {
            throw new Error('Usuários do tipo Solicitante devem estar vinculados a pelo menos uma equipe');
          }
          
          // Validação: perfil "solicitante" requer categoria_acesso
          if (perfil === 'solicitante' && !categoria_acesso) {
            throw new Error('Solicitantes devem ter uma categoria de acesso definida');
          }
          
          const dados = {
            nome: $('#novoNome').value,
            email: $('#novoEmail').value,
            senha: $('#novoSenha').value,
            perfil: perfil,
            equipes_ids: equipes_ids.length > 0 ? equipes_ids : null,
            categoria_acesso: categoria_acesso,
            recebe_email_notificacao: $('#novoRecebeEmail').checked,
            pode_editar_equipes: $('#novoPodeEditarEquipes') ? $('#novoPodeEditarEquipes').checked : false,
            ativo: true
          };
          
          await api('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
          
          showMessage('Usuário criado com sucesso!');
          $('#formNovoUsuario').reset();
          // Limpar seleções de equipes
          document.querySelectorAll('#usuariosEquipesCheckboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
          window.atualizarEquipesSelecionadas();
          // Esconder campo de categoria após reset
          const grupoCategoriaAcesso = $('#grupoCategoriaAcesso');
          if (grupoCategoriaAcesso) {
            grupoCategoriaAcesso.style.display = 'none';
          }
          carregarUsuarios();
        } catch (error) {
          showMessage('Erro ao criar usuário: ' + error.message, 'error');
        }
      });
    }
    
    // Configurar formulário rápido de vendedor
    const formVendedorRapido = $('#formVendedorRapido');
    if (formVendedorRapido) {
      formVendedorRapido.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
          const dados = {
            nome: $('#vendedorNome').value,
            email: $('#vendedorEmail').value,
            senha: 'senha123', // senha padrão
            perfil: 'vendedor',
            equipe_id: null,
            categoria_acesso: null,
            ativo: true
          };
          
          await api('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
          
          showMessage('✅ Vendedor criado com sucesso! Ele receberá emails de pedidos.', 'success');
          $('#formVendedorRapido').reset();
          carregarUsuarios();
        } catch (error) {
          showMessage('❌ Erro ao criar vendedor: ' + error.message, 'error');
        }
      });
    }
    
    const modalAprovarPedido = $('#modalAprovarPedido');
    if (modalAprovarPedido) {
      modalAprovarPedido.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
          fecharModalAprovar();
        }
      });
    }
    
    const modalRejeitarPedido = $('#modalRejeitarPedido');
    if (modalRejeitarPedido) {
      modalRejeitarPedido.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
          fecharModalRejeitar();
        }
      });
    }
  });
  
})();