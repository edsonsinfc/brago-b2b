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
        
        // Verificar se é logout forçado por atualização do admin
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

  // Estado da galeria
  let state = {
    produtos: [],
    produtosFiltrados: [],
    categorias: new Set(),
    userPerfil: null,
    userNome: null,
    isLoading: false,
    isRendering: false,
    carrinho: [] // { produto_id, descricao, codprod, quantidade, observacao }
  };

  // Renderizar produtos
  function renderProdutos(produtos) {
    if (state.isRendering) {
      console.log('Já está renderizando, ignorando chamada duplicada');
      return;
    }
    
    state.isRendering = true;
    
    const grid = $('#productsGrid');
    const loading = $('#loading');
    const emptyState = $('#emptyState');
    
    loading.style.display = 'none';
    
    if (produtos.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';
    
    // Criar um fragmento para evitar múltiplos reflows
    const fragment = document.createDocumentFragment();
    
    produtos.forEach(produto => {
      const card = document.createElement('div');
      card.className = 'product-card';
      
      // Usar foto_path (upload) ou foto (URL), ou placeholder se não houver
      const imagemUrl = produto.foto_path || produto.foto || '';
      
      card.innerHTML = `
        <div class="product-image-container">
          ${imagemUrl 
            ? `<img src="${imagemUrl}" 
                 alt="${produto.descricao}" 
                 class="product-image"
                 loading="lazy"
                 onerror="this.parentElement.innerHTML='<div class=\\'product-image-placeholder\\'></div>'">` 
            : '<div class="product-image-placeholder"></div>'}
        </div>
        <div class="product-info">
          <div class="product-code">${produto.codprod || 'SEM CÓDIGO'}</div>
          <div class="product-name">${produto.descricao}</div>
          <div class="product-actions">
            <button class="btn-add-cart" data-produto-id="${produto.id}">
              <i class="fas fa-cart-plus"></i>
              Adicionar ao Orçamento
            </button>
            <button class="btn-details" data-produto-id="${produto.id}" title="Ver detalhes">
              <i class="fas fa-info-circle"></i>
            </button>
          </div>
        </div>
      `;
      
      // Adicionar eventos aos botões
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
    
    // Adicionar todos os cards de uma vez
    grid.appendChild(fragment);
    
    $('#productsCount').textContent = `${produtos.length} produto${produtos.length !== 1 ? 's' : ''}`;
    
    state.isRendering = false;
  }

  // Filtrar produtos
  function filtrarProdutos() {
    const searchTerm = $('#searchInput').value.toLowerCase();
    const categoria = $('#categoriaFilter').value;
    
    let filtrados = state.produtos;
    
    // Filtro de busca
    if (searchTerm) {
      filtrados = filtrados.filter(p => 
        p.descricao.toLowerCase().includes(searchTerm) ||
        (p.codprod && p.codprod.toLowerCase().includes(searchTerm))
      );
    }
    
    // Filtro de categoria
    if (categoria) {
      filtrados = filtrados.filter(p => p.categoria === categoria);
    }
    
    state.produtosFiltrados = filtrados;
    renderProdutos(filtrados);
  }

  // Carregar produtos
  async function carregarProdutos() {
    if (state.isLoading) {
      console.log('Já está carregando produtos, ignorando chamada duplicada');
      return;
    }
    
    state.isLoading = true;
    
    try {
      console.log('🔄 Carregando produtos da galeria (todos os produtos)...');
      const data = await api('/api/produtos/galeria?pageSize=1000');
      console.log('📦 Resposta da API:', data);
      
      // A resposta pode vir como { produtos: [], pagination: {} } ou direto como array
      state.produtos = data.produtos || data;
      
      console.log(`✅ ${state.produtos.length} produtos carregados`);
      
      if (!Array.isArray(state.produtos)) {
        console.error('❌ Produtos não é um array:', state.produtos);
        throw new Error('Formato de resposta inválido');
      }
      
      state.produtosFiltrados = state.produtos;
      
      // Extrair categorias únicas
      state.produtos.forEach(p => {
        if (p.categoria) {
          state.categorias.add(p.categoria);
        }
      });
      
      // Preencher select de categorias
      const select = $('#categoriaFilter');
      Array.from(state.categorias).sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
      });
      
      renderProdutos(state.produtos);
      state.isLoading = false;
      
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      state.isLoading = false;
      $('#loading').innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>Erro ao carregar produtos: ${error.message}</p>
      `;
    }
  }

  // Adicionar ao carrinho de orçamento
  function adicionarAoCarrinho(produtoId) {
    const produto = state.produtos.find(p => p.id === produtoId);
    if (!produto) return;
    
    // Verificar se já está no carrinho
    const itemExistente = state.carrinho.find(item => item.produto_id === produtoId);
    if (itemExistente) {
      alert('✅ Este produto já está no seu orçamento!');
      return;
    }
    
    // Adicionar ao carrinho
    state.carrinho.push({
      produto_id: produto.id,
      descricao: produto.descricao,
      codprod: produto.codprod,
      quantidade: 1,
      observacao: ''
    });
    
    // Salvar no localStorage
    localStorage.setItem('carrinho_orcamento', JSON.stringify(state.carrinho));
    
    // Atualizar contador
    atualizarContadorCarrinho();
    
    // Feedback visual
    alert(`✅ ${produto.descricao} adicionado ao orçamento!`);
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
    
    alert(`
📦 ${produto.descricao}

Código: ${produto.codprod || 'N/A'}
Categoria: ${produto.categoria || 'N/A'}
${produto.estoque ? `Estoque: ${produto.estoque} ${produto.unidade || 'UN'}` : ''}
${produto.multiplos ? `Múltiplos de: ${produto.multiplos}` : ''}
    `.trim());
  }

  // Inicialização
  document.addEventListener('DOMContentLoaded', async () => {
    const token = ensureAuth();
    if (!token) return;
    
    const payload = parseJwt(token);
    if (payload) {
      state.userPerfil = payload.perfil;
      state.userNome = payload.nome;
      
      // Bloqueia acesso de usuários EQUIPE
      if (payload.perfil === 'equipe') {
        alert('❌ Acesso restrito!\n\nA galeria é exclusiva para Administradores e Gestores.\n\nVocê será redirecionado para sua área.');
        window.location.href = '/equipe.html';
        return;
      }
      
      let perfilTexto = '';
      if (payload.perfil === 'admin') perfilTexto = 'Administrador';
      else if (payload.perfil === 'gestor') perfilTexto = 'Gestor';
      else if (payload.perfil === 'equipe') perfilTexto = 'Equipe';
      
      $('#userGreeting').textContent = `${payload.nome} - ${perfilTexto}`;
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
    
    // Listener do botão carrinho
    const btnCarrinho = $('#btnCarrinho');
    if (btnCarrinho) {
      btnCarrinho.addEventListener('click', abrirCarrinho);
    }
    
    // Listeners
    $('#searchInput').addEventListener('input', filtrarProdutos);
    $('#categoriaFilter').addEventListener('change', filtrarProdutos);
    
    // Carregar produtos
    await carregarProdutos();
  });
  
})();
