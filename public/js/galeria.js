// Galeria de Produtos - Sistema B2B Brago Distribuidora
(function() {
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
    if (!token) throw new Error('No token');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    
    try {
      const response = await fetch(path, { ...options, headers });
      
      if (response.status === 401) {
        localStorage.removeItem(tokenKey);
        
        try {
          const errorData = await response.json();
          if (errorData.requiresRelogin) {
            alert(errorData.error || 'Suas informações foram atualizadas. Por favor, faça login novamente.');
          }
        } catch (e) {}
        
        window.location.href = '/login.html';
        return;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Erro HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value || 0);
  }

  // Estado da galeria com filtros inteligentes
  let state = {
    produtos: [],
    produtosFiltrados: [],
    equipes: [],
    userPerfil: null,
    userNome: null,
    userCategoriaAcesso: null,
    isLoading: false,
    isRendering: false,
    viewMode: 'grid', // 'grid' ou 'list'
    carrinho: [],
    filters: {
      searchTerm: '',
      categoriaAcesso: '',
      estoque: '',
      equipe: ''
    }
  };


  // Obter categoria de acesso do produto
  function getProdutoCategoriaAcesso(produto) {
    if (produto.categoria_facility && produto.categoria_manipulacao) {
      return 'ambas';
    } else if (produto.categoria_facility) {
      return 'facility';
    } else if (produto.categoria_manipulacao) {
      return 'manipulacao';
    }
    return null;
  }

  // Renderizar badge de categoria
  function renderCategoriaBadge(categoria) {
    if (!categoria) return '';
    
    const badges = {
      facility: '<span class="badge badge-facility"><i class="fas fa-industry"></i> Facility</span>',
      manipulacao: '<span class="badge badge-manipulacao"><i class="fas fa-pills"></i> Manipulação</span>',
      ambas: '<span class="badge badge-ambas"><i class="fas fa-layer-group"></i> Ambas</span>'
    };
    
    return badges[categoria] || '';
  }

  // Renderizar badge de estoque
  function renderEstoqueBadge(produto) {
    const estoque = Number(produto.estoque) || 0;
    if (estoque > 0) {
      return '<span class="badge badge-estoque">Em Estoque</span>';
    }
    return '<span class="badge badge-sem-estoque">Sem Estoque</span>';
  }

  // Renderizar produtos
  function renderProdutos(produtos) {
    if (state.isRendering) {
      console.log('Já está renderizando, ignorando chamada duplicada');
      return;
    }
    
    state.isRendering = true;
    
    const container = $('#productsContainer');
    const loading = $('#loadingState');
    const emptyState = $('#emptyState');
    
    loading.style.display = 'none';
    
    // Atualizar stats
    $('#productsCount').textContent = state.produtos.length;
    $('#filteredCount').textContent = produtos.length;
    
    if (produtos.length === 0) {
      container.style.display = 'none';
      emptyState.style.display = 'block';
      state.isRendering = false;
      return;
    }
    
    emptyState.style.display = 'none';
    container.style.display = state.viewMode === 'grid' ? 'grid' : 'flex';
    container.className = state.viewMode === 'grid' ? 'products-grid' : 'products-list';
    container.innerHTML = '';
    
    // Criar fragmento para performance
    const fragment = document.createDocumentFragment();
    
    produtos.forEach(produto => {
      const card = document.createElement('div');
      card.className = `product-card ${state.viewMode === 'list' ? 'list-view' : ''}`;
      
      const categoriaAcesso = getProdutoCategoriaAcesso(produto);
      const imagemUrl = produto.foto_path || produto.foto || '';
      const estoque = Number(produto.estoque) || 0;
      
      card.innerHTML = `
        <div class="product-image-container">
          <div class="product-badges">
            ${renderCategoriaBadge(categoriaAcesso)}
            ${renderEstoqueBadge(produto)}
          </div>
          ${imagemUrl 
            ? `<img src="${imagemUrl}" 
                 alt="${produto.descricao}" 
                 class="product-image"
                 loading="lazy"
                 onerror="this.parentElement.querySelector('.product-badges').insertAdjacentHTML('afterend', '<div class=\\'product-image-placeholder\\'>📦</div>'); this.remove();">` 
            : '<div class="product-image-placeholder">📦</div>'}
        </div>
        <div class="product-info">
          <div class="product-code">${produto.codprod || 'SEM CÓDIGO'}</div>
          <div class="product-name">${produto.descricao}</div>
          <div class="product-meta">
            <div class="meta-item">
              <i class="fas fa-box"></i>
              <span>${estoque > 0 ? `${estoque} ${produto.unidade || 'UN'}` : 'Sob consulta'}</span>
            </div>
            ${produto.multiplos ? `
            <div class="meta-item">
              <i class="fas fa-layer-group"></i>
              <span>Múltiplos de ${produto.multiplos}</span>
            </div>
            ` : ''}
          </div>
          <div class="product-actions">
            <button class="btn-add-cart" data-produto-id="${produto.id}">
              <i class="fas fa-cart-plus"></i>
              Adicionar
            </button>
            <button class="btn-details" data-produto-id="${produto.id}" title="Ver detalhes">
              <i class="fas fa-info-circle"></i>
            </button>
          </div>
        </div>
      `;
      
      // Adicionar eventos
      const btnAddCart = card.querySelector('.btn-add-cart');
      const btnDetails = card.querySelector('.btn-details');
      
      btnAddCart.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        adicionarAoCarrinho(produto.id);
      });
      
      btnDetails.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        verDetalhes(produto.id);
      });
      
      fragment.appendChild(card);
    });
    
    container.appendChild(fragment);
    state.isRendering = false;
  }

  // Filtrar produtos com filtros inteligentes
  function filtrarProdutos() {
    let filtrados = [...state.produtos];
    
    // Filtro de busca
    if (state.filters.searchTerm) {
      const search = state.filters.searchTerm.toLowerCase();
      filtrados = filtrados.filter(p => 
        p.descricao.toLowerCase().includes(search) ||
        (p.codprod && p.codprod.toLowerCase().includes(search))
      );
    }
    
    // Filtro de categoria de acesso
    if (state.filters.categoriaAcesso) {
      filtrados = filtrados.filter(p => {
        const categoria = getProdutoCategoriaAcesso(p);
        
        // Produtos "ambas" aparecem em todos os filtros
        if (categoria === 'ambas') return true;
        
        // Se filtrou por "ambas", mostra apenas produtos que são ambas
        if (state.filters.categoriaAcesso === 'ambas') {
          return categoria === 'ambas';
        }
        
        // Caso contrário, comparação normal
        return categoria === state.filters.categoriaAcesso;
      });
    }
    
    // Filtro de disponibilidade
    if (state.filters.estoque) {
      filtrados = filtrados.filter(p => {
        const estoque = Number(p.estoque) || 0;
        if (state.filters.estoque === 'com-estoque') {
          return estoque > 0;
        } else if (state.filters.estoque === 'sem-estoque') {
          return estoque === 0;
        }
        return true;
      });
    }
    
    // Filtro de equipe/loja
    if (state.filters.equipe) {
      const equipeId = parseInt(state.filters.equipe);
      console.log('🔍 Filtro de equipe ativado:', equipeId);
      
      filtrados = filtrados.filter(p => {
        console.log(`Produto: ${p.descricao}, acesso_especifico: ${p.acesso_especifico}, equipes_com_acesso:`, p.equipes_com_acesso);
        
        // Se o produto não tem acesso específico, está disponível para todos
        if (!p.acesso_especifico) {
          console.log(`  ✅ Produto disponível para todos (acesso_especifico = 0)`);
          return true;
        }
        
        // Se tem acesso específico, verificar se a equipe tem acesso
        if (p.equipes_com_acesso && Array.isArray(p.equipes_com_acesso)) {
          const temAcesso = p.equipes_com_acesso.includes(equipeId);
          console.log(`  ${temAcesso ? '✅' : '❌'} Equipe ${equipeId} ${temAcesso ? 'TEM' : 'NÃO TEM'} acesso`);
          return temAcesso;
        }
        
        console.log(`  ❌ Sem array de equipes`);
        return false;
      });
      
      console.log(`📊 Após filtro de equipe: ${filtrados.length} produtos`);
    }
    
    state.produtosFiltrados = filtrados;
    renderProdutos(filtrados);
    atualizarFilterPills();
  }

  // Atualizar pills de filtros ativos
  function atualizarFilterPills() {
    const pillsContainer = $('#activePills');
    const btnClear = $('#btnClearFilters');
    const pills = [];
    
    if (state.filters.searchTerm) {
      pills.push({
        label: `🔍 "${state.filters.searchTerm}"`,
        filter: 'searchTerm'
      });
    }
    
    if (state.filters.categoriaAcesso) {
      const labels = {
        facility: '<i class="fas fa-industry"></i> Facility',
        manipulacao: '<i class="fas fa-pills"></i> Manipulação',
        ambas: '<i class="fas fa-layer-group"></i> Ambas'
      };
      pills.push({
        label: labels[state.filters.categoriaAcesso],
        filter: 'categoriaAcesso'
      });
    }
    
    if (state.filters.estoque) {
      const labels = {
        'com-estoque': '<i class="fas fa-check-circle"></i> Com Estoque',
        'sem-estoque': '<i class="fas fa-times-circle"></i> Sem Estoque'
      };
      pills.push({
        label: labels[state.filters.estoque],
        filter: 'estoque'
      });
    }
    
    if (state.filters.equipe) {
      const equipe = state.equipes.find(e => e.id === parseInt(state.filters.equipe));
      if (equipe) {
        pills.push({
          label: `<i class="fas fa-store"></i> ${equipe.nome}`,
          filter: 'equipe'
        });
      }
    }
    
    if (pills.length > 0) {
      pillsContainer.style.display = 'flex';
      btnClear.style.display = 'inline-flex';
      
      pillsContainer.innerHTML = pills.map(pill => `
        <div class="filter-pill">
          ${pill.label}
          <i class="fas fa-times" data-filter="${pill.filter}"></i>
        </div>
      `).join('');
      
      // Adicionar eventos de remoção
      pillsContainer.querySelectorAll('.fa-times').forEach(icon => {
        icon.addEventListener('click', () => {
          const filter = icon.dataset.filter;
          state.filters[filter] = '';
          
          // Resetar o input/select correspondente
          if (filter === 'searchTerm') {
            $('#searchInput').value = '';
          } else if (filter === 'categoriaAcesso') {
            $('#categoriaAcessoFilter').value = '';
          } else if (filter === 'estoque') {
            $('#estoqueFilter').value = '';
          } else if (filter === 'equipe') {
            $('#equipeFilter').value = '';
          }
          
          filtrarProdutos();
        });
      });
    } else {
      pillsContainer.style.display = 'none';
      btnClear.style.display = 'none';
    }
  }

  // Limpar todos os filtros
  function limparFiltros() {
    state.filters = {
      searchTerm: '',
      categoriaAcesso: '',
      estoque: '',
      equipe: ''
    };
    
    $('#searchInput').value = '';
    $('#categoriaAcessoFilter').value = '';
    $('#estoqueFilter').value = '';
    $('#equipeFilter').value = '';
    
    filtrarProdutos();
  }

  // Carregar equipes
  async function carregarEquipes() {
    try {
      const data = await api('/api/equipes');
      state.equipes = data.equipes || data;
      
      // Preencher select de equipes
      const select = $('#equipeFilter');
      if (select && state.equipes.length > 0) {
        state.equipes.forEach(equipe => {
          const option = document.createElement('option');
          option.value = equipe.id;
          option.textContent = equipe.nome;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar equipes:', error);
    }
  }

  // Carregar produtos
  async function carregarProdutos() {
    if (state.isLoading) {
      console.log('Já está carregando produtos, ignorando chamada duplicada');
      return;
    }
    
    state.isLoading = true;
    
    try {
      console.log('🔄 Carregando produtos da galeria...');
      const data = await api('/api/produtos/galeria?pageSize=1000');
      console.log('📦 Resposta da API:', data);
      
      state.produtos = data.produtos || data;
      
      console.log(`✅ ${state.produtos.length} produtos carregados`);
      
      if (!Array.isArray(state.produtos)) {
        console.error('❌ Produtos não é um array:', state.produtos);
        throw new Error('Formato de resposta inválido');
      }
      
      // Processar equipes_com_acesso para array
      state.produtos.forEach(p => {
        if (p.equipes_com_acesso) {
          p.equipes_com_acesso = p.equipes_com_acesso.split(',').map(id => parseInt(id));
        } else {
          p.equipes_com_acesso = [];
        }
      });
      
      state.produtosFiltrados = state.produtos;
      filtrarProdutos();
      state.isLoading = false;
      
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      state.isLoading = false;
      $('#loadingState').innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>Erro ao carregar produtos: ${error.message}</p>
      `;
    }
  }

  // Adicionar ao carrinho de orçamento
  function adicionarAoCarrinho(produtoId) {
    const produto = state.produtos.find(p => p.id === produtoId);
    if (!produto) return;
    
    const itemExistente = state.carrinho.find(item => item.produto_id === produtoId);
    if (itemExistente) {
      alert('✅ Este produto já está no seu orçamento!');
      return;
    }
    
    state.carrinho.push({
      produto_id: produto.id,
      descricao: produto.descricao,
      codprod: produto.codprod,
      quantidade: 1,
      observacao: ''
    });
    
    localStorage.setItem('carrinho_orcamento', JSON.stringify(state.carrinho));
    atualizarContadorCarrinho();
    
    // Feedback com toast seria melhor, mas alert funciona
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:1rem 1.5rem;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;animation:slideIn 0.3s;';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${produto.descricao.substring(0, 50)}... adicionado!`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // Atualizar contador do carrinho
  function atualizarContadorCarrinho() {
    const contador = state.carrinho.length;
    const badge = $('#cartBadge');
    if (badge) {
      badge.textContent = contador;
      badge.style.display = contador > 0 ? 'flex' : 'none';
    }
  }
  
  // Abrir carrinho
  function abrirCarrinho() {
    if (state.carrinho.length === 0) {
      alert('Seu orçamento está vazio. Adicione produtos primeiro!');
      return;
    }
    window.location.href = '/orcamento.html';
  }

  // Ver detalhes
  function verDetalhes(produtoId) {
    const produto = state.produtos.find(p => p.id === produtoId);
    if (!produto) return;
    
    const categoriaAcesso = getProdutoCategoriaAcesso(produto);
    const categoriaNome = categoriaAcesso === 'facility' ? 'Facility' : 
                          categoriaAcesso === 'manipulacao' ? 'Manipulação' :
                          categoriaAcesso === 'ambas' ? 'Ambas' : 'N/A';
    
    alert(`
📦 ${produto.descricao}

Código: ${produto.codprod || 'N/A'}
Categoria: ${categoriaNome}
${produto.estoque ? `Estoque: ${produto.estoque} ${produto.unidade || 'UN'}` : 'Estoque: Sob consulta'}
${produto.multiplos ? `Múltiplos de: ${produto.multiplos}` : ''}
${produto.observacoes ? `\nObservações: ${produto.observacoes}` : ''}
    `.trim());
  }

  // Alternar modo de visualização
  function toggleViewMode(mode) {
    state.viewMode = mode;
    
    // Atualizar botões
    $('#btnGridView').classList.toggle('active', mode === 'grid');
    $('#btnListView').classList.toggle('active', mode === 'list');
    
    // Re-renderizar
    renderProdutos(state.produtosFiltrados);
  }

  // Inicialização
  document.addEventListener('DOMContentLoaded', async () => {
    const token = ensureAuth();
    if (!token) return;
    
    const payload = parseJwt(token);
    if (payload) {
      state.userPerfil = payload.perfil;
      state.userNome = payload.nome;
      state.userCategoriaAcesso = payload.categoria_acesso;
      
      // Bloqueia acesso de usuários EQUIPE
      if (payload.perfil === 'equipe') {
        alert('❌ Acesso restrito!\n\nA galeria é exclusiva para Administradores e Gestores.\n\nVocê será redirecionado para sua área.');
        window.location.href = '/equipe.html';
        return;
      }
      
      let perfilTexto = '';
      if (payload.perfil === 'admin') perfilTexto = 'Administrador';
      else if (payload.perfil === 'gestor') perfilTexto = 'Gestor';
      
      const categoriaTexto = payload.categoria_acesso === 'facility' ? ' - Facility' :
                             payload.categoria_acesso === 'manipulacao' ? ' - Manipulação' :
                             payload.categoria_acesso === 'ambas' ? ' - Ambas' : '';
      
      $('#userGreeting').textContent = `${payload.nome} - ${perfilTexto}${categoriaTexto}`;
    }
    
    // Carregar carrinho do localStorage
    const carrinhoSalvo = localStorage.getItem('carrinho_orcamento');
    if (carrinhoSalvo) {
      try {
        state.carrinho = JSON.parse(carrinhoSalvo);
      } catch (e) {
        state.carrinho = [];
      }
    }
    atualizarContadorCarrinho();
    
    // Event Listeners
    $('#btnCarrinho')?.addEventListener('click', abrirCarrinho);
    
    $('#searchInput')?.addEventListener('input', (e) => {
      state.filters.searchTerm = e.target.value;
      filtrarProdutos();
    });
    
    $('#categoriaAcessoFilter')?.addEventListener('change', (e) => {
      state.filters.categoriaAcesso = e.target.value;
      filtrarProdutos();
    });
    
    $('#estoqueFilter')?.addEventListener('change', (e) => {
      state.filters.estoque = e.target.value;
      filtrarProdutos();
    });
    
    $('#equipeFilter')?.addEventListener('change', (e) => {
      state.filters.equipe = e.target.value;
      filtrarProdutos();
    });
    
    $('#btnClearFilters')?.addEventListener('click', limparFiltros);
    
    $('#btnGridView')?.addEventListener('click', () => toggleViewMode('grid'));
    $('#btnListView')?.addEventListener('click', () => toggleViewMode('list'));
    
    // Carregar equipes e produtos
    await carregarEquipes();
    await carregarProdutos();
  });
  
})();
