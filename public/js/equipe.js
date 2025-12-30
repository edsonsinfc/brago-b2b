// B2B Brago Distribuidora - Interface da Equipe
var app = {
  produtos: [],
  categorias: [],
  carrinho: [],
  pedidos: [],
  pedidoSelecionado: null,
  currentPage: 1,
  totalPages: 1,
  currentFilters: { search: '', categoria: '' },
  userPerfil: null,
  equipes: [], // Array de todas as equipes do usuário
  equipeSelecionada: null, // Equipe atualmente selecionada para o pedido
  equipesSelecionadas: [], // Múltiplas equipes selecionadas para pedidos
  equipeSelecionadaTemp: null, // Equipe selecionada temporariamente no modal
  
  init: function() {
    console.log('🚀 Iniciando aplicação da equipe...');
    
    // Verificar se usuário está logado
    var token = localStorage.getItem('nexus_b2b_token');
    console.log('🔑 Token encontrado:', token ? 'SIM' : 'NÃO');
    
    if (!token) {
      console.log('❌ Sem token, redirecionando para login...');
      window.location.href = '/login.html';
      return;
    }
    
    // Decodificar token para obter perfil do usuário
    try {
      var base64Url = token.split('.')[1];
      var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      var payload = JSON.parse(atob(base64));
      this.userPerfil = payload.perfil;
      this.equipeId = payload.equipe_id;
      console.log('👤 Perfil do usuário:', this.userPerfil);
      console.log('🏢 Equipe ID:', this.equipeId);
      
      // Exibir nome do usuário
      var userGreeting = document.getElementById('userGreeting');
      if (userGreeting && payload.nome) {
        userGreeting.textContent = 'Olá, ' + payload.nome + '!';
      }
      
      // Carregar e exibir badge de equipes
      this.carregarEquipesBadge(payload.id, payload.perfil);
    } catch (e) {
      console.error('Erro ao decodificar token:', e);
    }
    
    console.log('✅ Usuário logado, continuando...');
    
    // Carregar carrinho do localStorage
    var savedCart = localStorage.getItem('nexus_b2b_cart');
    if (savedCart) {
      try {
        this.carrinho = JSON.parse(savedCart);
        console.log('🛒 Carrinho carregado:', this.carrinho.length, 'itens');
      } catch (e) {
        console.error('Erro ao carregar carrinho:', e);
        this.carrinho = [];
      }
    }
    
    this.setupEventListeners();
    this.loadCategories();
    this.loadProducts();
    this.updateCartDisplay();
    this.carregarTodasEquipes(); // Carregar todas as equipes do usuário
    this.carregarCreditoDisponivel(); // Carregar crédito disponível
  },
  
  mostrarAba: function(aba) {
    // Ocultar todas as abas
    var produtosSection = document.getElementById('produtosSection');
    var pedidosSection = document.getElementById('pedidosSection');
    var cartSidebar = document.querySelector('.cart-sidebar');
    
    // Remover classe active dos botões
    var btnProdutos = document.getElementById('btnProdutos');
    var btnPedidos = document.getElementById('btnPedidos');
    
    if (produtosSection) produtosSection.style.display = 'none';
    if (pedidosSection) pedidosSection.style.display = 'none';
    if (btnProdutos) btnProdutos.classList.remove('active');
    if (btnPedidos) btnPedidos.classList.remove('active');
    
    // Mostrar aba selecionada
    if (aba === 'produtos') {
      if (produtosSection) produtosSection.style.display = 'block';
      if (btnProdutos) btnProdutos.classList.add('active');
      if (cartSidebar) cartSidebar.style.display = 'block';
    } else if (aba === 'pedidos') {
      if (pedidosSection) pedidosSection.style.display = 'block';
      if (btnPedidos) btnPedidos.classList.add('active');
      if (cartSidebar) cartSidebar.style.display = 'none';
      this.carregarPedidos();
    }
  },
  
  isGestor: function() {
    return this.userPerfil === 'gestor';
  },
  
  carregarEquipesBadge: function(usuarioId, perfil) {
    var self = this;
    
    // Apenas mostrar para gestores e solicitantes
    if (perfil !== 'gestor' && perfil !== 'solicitante') {
      return;
    }
    
    var token = localStorage.getItem('nexus_b2b_token');
    if (!token) {
      console.log('❌ Token não encontrado');
      return;
    }
    
    console.log('🔍 Buscando dados do próprio usuário...');
    fetch('/api/usuarios/me', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function(res) {
      console.log('📡 Status da resposta:', res.status);
      if (!res.ok) {
        throw new Error('Erro ao carregar equipes. Status: ' + res.status);
      }
      return res.json();
    })
    .then(function(usuario) {
      console.log('✅ Dados do usuário recebidos:', usuario);
      var badge = document.getElementById('userEquipesBadge');
      if (!badge) return;
      
      var equipes = usuario.equipes || [];
      var qtdEquipes = equipes.length;
      
      if (qtdEquipes === 0) {
        badge.style.display = 'none';
        return;
      }
      
      var icone = '';
      var classe = '';
      var texto = '';
      var totalEquipes = 13; // Total de equipes no sistema
      
      if (qtdEquipes === 1) {
        icone = '<i class="fas fa-store"></i>';
        classe = 'single';
        texto = '1 equipe';
      } else if (qtdEquipes >= totalEquipes) {
        icone = '<i class="fas fa-crown"></i>';
        classe = 'all';
        texto = qtdEquipes + ' equipes (TODAS)';
      } else {
        icone = '<i class="fas fa-building"></i>';
        classe = 'multiple';
        texto = qtdEquipes + ' equipes';
      }
      
      // Montar lista de equipes para o tooltip
      var nomesEquipes = equipes.map(function(eq) { 
        return '• ' + eq.nome; 
      }).join('\n');
      
      var tituloTooltip = perfil === 'gestor' ? 'Gerencia' : 'Vinculado a';
      var dataEquipes = tituloTooltip + ' ' + qtdEquipes + ' equipe' + (qtdEquipes > 1 ? 's' : '') + ':\n\n' + nomesEquipes;
      
      badge.className = 'user-equipes-badge ' + classe;
      badge.innerHTML = icone + '<span>' + texto + '</span>';
      badge.setAttribute('data-equipes', dataEquipes);
      badge.setAttribute('title', 'Passe o mouse para ver detalhes');
      badge.style.display = 'inline-flex';
    })
    .catch(function(err) {
      console.error('Erro ao carregar badge de equipes:', err);
    });
  },
  
  setupEventListeners: function() {
    var self = this;
    
    // Busca
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        clearTimeout(self.searchTimeout);
        self.searchTimeout = setTimeout(function() { 
          self.currentFilters.search = searchInput.value.trim();
          self.currentPage = 1;
          self.loadProducts();
        }, 500);
      });
    }
    
    var categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', function() { 
        self.handleCategoryFilter(); 
      });
    }
    
    var clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
      clearFilters.addEventListener('click', function() { 
        self.clearFilters(); 
      });
    }
    
    var prevPage = document.getElementById('prevPage');
    if (prevPage) {
      prevPage.addEventListener('click', function() { 
        self.goToPage(self.currentPage - 1); 
      });
    }
    
    var nextPage = document.getElementById('nextPage');
    if (nextPage) {
      nextPage.addEventListener('click', function() { 
        self.goToPage(self.currentPage + 1); 
      });
    }
    
    // Carrinho agora é fixo, não precisa de toggle
    var cartSummary = document.getElementById('cartSummary');
    if (cartSummary) {
      cartSummary.addEventListener('click', function() { 
        // Scroll suave para o carrinho em mobile
        if (window.innerWidth <= 768) {
          var cartSection = document.querySelector('.cart-section');
          if (cartSection) {
            cartSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    }
    
    var checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function() { 
        self.checkout(); 
      });
    }
    
    var btnSair = document.getElementById('btnSair');
    if (btnSair) {
      btnSair.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('nexus_b2b_token');
        window.location.href = '/login.html';
      });
    }
    
    // Fechar dropdown de equipes ao clicar fora
    document.addEventListener('click', function(e) {
      var creditoInfo = document.getElementById('creditoInfo');
      var equipesDropdown = document.getElementById('equipesDropdown');
      
      if (creditoInfo && equipesDropdown && !creditoInfo.contains(e.target)) {
        self.fecharEquipesDropdown();
      }
    });
  },
  
  api: function(url, options) {
    options = options || {};
    var token = localStorage.getItem('nexus_b2b_token');
    
    var headers = {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    };
    
    if (options.headers) {
      for (var key in options.headers) {
        headers[key] = options.headers[key];
      }
    }
    
    var fetchOptions = {
      headers: headers
    };
    
    for (var key in options) {
      if (key !== 'headers') {
        fetchOptions[key] = options[key];
      }
    }
    
    return fetch(url, fetchOptions).then(function(response) {
      if (response.status === 401) {
        // Verificar se é por mudança de permissões
        return response.json().then(function(data) {
          if (data.requiresRelogin) {
            alert(data.error || 'Suas permissões foram atualizadas. Por favor, faça login novamente.');
          }
          localStorage.removeItem('nexus_b2b_token');
          window.location.href = '/login.html';
        }).catch(function() {
          // Se não conseguir ler JSON, apenas redirecionar
          localStorage.removeItem('nexus_b2b_token');
          window.location.href = '/login.html';
        });
      }
      return response;
    });
  },
  
  loadCategories: function() {
    var self = this;
    this.api('/api/produtos/categorias')
      .then(function(response) { return response.json(); })
      .then(function(data) {
        self.categorias = data.categorias || [];
        self.renderCategoryFilter();
      })
      .catch(function(error) {
        console.error('Erro ao carregar categorias:', error);
      });
  },
  
  renderCategoryFilter: function() {
    var select = document.getElementById('categoryFilter');
    select.innerHTML = '<option value="">Todas as categorias</option>';
    
    for (var i = 0; i < this.categorias.length; i++) {
      var categoria = this.categorias[i];
      var option = document.createElement('option');
      option.value = categoria;
      option.textContent = categoria;
      select.appendChild(option);
    }
  },
  
  loadProducts: function() {
    var self = this;
    console.log('📦 Carregando produtos...');
    this.showLoading(true);
    
    var params = new URLSearchParams({
      page: this.currentPage,
      pageSize: 20
    });
    
    if (this.currentFilters.search) params.append('search', this.currentFilters.search);
    if (this.currentFilters.categoria) params.append('categoria', this.currentFilters.categoria);
    
    console.log('🔗 URL da API:', '/api/produtos?' + params);
    
    this.api('/api/produtos?' + params)
      .then(function(response) { 
        console.log('📡 Resposta da API:', response.status);
        return response.json(); 
      })
      .then(function(data) {
        console.log('📊 Dados recebidos:', data);
        self.produtos = data.produtos || [];
        self.totalPages = data.pagination ? data.pagination.totalPages : 1;
        console.log('✅ Produtos carregados:', self.produtos.length);
        self.renderProducts();
        self.updatePagination();
      })
      .catch(function(error) {
        console.error('❌ Erro ao carregar produtos:', error);
        self.showError('Erro ao carregar produtos');
      })
      .finally(function() {
        self.showLoading(false);
      });
  },
  
  renderProducts: function() {
    var grid = document.getElementById('productsGrid');
    var emptyState = document.getElementById('emptyState');
    
    if (!grid) {
      console.error('❌ Elemento productsGrid não encontrado');
      return;
    }
    
    if (this.produtos.length === 0) {
      grid.style.display = 'none';
      if (emptyState) {
        emptyState.style.display = 'block';
      } else {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">Nenhum produto encontrado</div>';
        grid.style.display = 'grid';
      }
      return;
    }
    
    grid.style.display = 'grid';
    if (emptyState) {
      emptyState.style.display = 'none';
    }
    
    var html = '';
    for (var i = 0; i < this.produtos.length; i++) {
      html += this.renderProductCard(this.produtos[i]);
    }
    grid.innerHTML = html;
    
    this.bindProductEvents();
  },
  
  renderProductCard: function(produto) {
    var hasImage = produto.foto && produto.foto.trim();
    var imageContent = hasImage 
      ? '<img src="' + produto.foto + '" alt="' + produto.descricao + '" onclick="app.abrirDetalhesProduto(' + produto.id + ')" style="cursor: pointer;">'
      : '<i class="fas fa-box-open"></i>';
    
    var multiplos = produto.multiplos || 1;
    var multiploText = multiplos > 1 ? ' (múltiplos de ' + multiplos + ')' : '';
    
    // Mostrar preço para todos os usuários
    var priceHtml = '';
    if (produto.preco) {
      var precoFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(produto.preco).replace(/\u00A0/g, ' '); // Correção de encoding
      priceHtml = '<div class="product-price">' + precoFormatado + '</div>';
    }
    
    return '<div class="product-card" data-produto-id="' + produto.id + '">' +
      '<div class="product-image">' + imageContent + '</div>' +
      '<div class="product-info">' +
        '<h3 class="product-title">' + produto.descricao + '</h3>' +
        '<div class="product-code">Cód: ' + produto.codprod + '</div>' +
        '<div class="product-unit">Unidade: ' + produto.unidade + multiploText + '</div>' +
        priceHtml +
        (produto.observacoes ? '<div class="product-description">' + produto.observacoes + '</div>' : '') +
        '<button class="btn-detalhes" onclick="app.abrirDetalhesProduto(' + produto.id + ')" style="width: 100%; margin-bottom: 10px; background: #6366f1; color: white; padding: 8px; border: none; border-radius: 4px; cursor: pointer;">' +
          '<i class="fas fa-info-circle"></i> Ver Detalhes' +
        '</button>' +
        '<div class="quantity-controls">' +
          '<button class="quantity-btn" onclick="app.decreaseQuantity(' + produto.id + ')">-</button>' +
          '<input type="number" class="quantity-input" value="' + multiplos + '" ' +
            'min="' + multiplos + '" step="' + multiplos + '" data-multiplos="' + multiplos + '" ' +
            'onkeydown="return event.key !== \'-\' && event.key !== \'e\' && event.key !== \'+\'">' +
          '<button class="quantity-btn" onclick="app.increaseQuantity(' + produto.id + ')">+</button>' +
        '</div>' +
        '<button class="add-to-cart" onclick="app.addProductToCart(' + produto.id + ')">' +
          '<i class="fas fa-cart-plus"></i> Adicionar' +
        '</button>' +
      '</div>' +
    '</div>';
  },
  
  bindProductEvents: function() {
    var self = this;
    var grid = document.getElementById('productsGrid');
    
    var buttons = grid.querySelectorAll('.btn-add-cart');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function(e) {
        var produtoId = parseInt(e.target.dataset.produtoId);
        var productCard = e.target.closest('.product-card');
        var qtyInput = productCard.querySelector('.qty-input');
        var quantidade = parseInt(qtyInput.value) || 1;
        
        self.addToCart(produtoId, quantidade);
        qtyInput.value = 1;
      });
    }
  },
  
  // Funções auxiliares para quantidade
  decreaseQuantity: function(produtoId) {
    var input = document.querySelector('[data-produto-id="' + produtoId + '"] .quantity-input');
    if (input) {
      var multiplos = parseInt(input.dataset.multiplos) || 1;
      var currentValue = parseInt(input.value) || multiplos;
      var newValue = Math.max(multiplos, currentValue - multiplos);
      input.value = newValue;
    }
  },
  
  increaseQuantity: function(produtoId) {
    var input = document.querySelector('[data-produto-id="' + produtoId + '"] .quantity-input');
    if (input) {
      var multiplos = parseInt(input.dataset.multiplos) || 1;
      var currentValue = parseInt(input.value) || 0;
      input.value = currentValue + multiplos;
    }
  },
  
  addProductToCart: function(produtoId) {
    var input = document.querySelector('[data-produto-id="' + produtoId + '"] .quantity-input');
    if (input) {
      var quantidade = parseInt(input.value) || 1;
      this.addToCart(produtoId, quantidade);
      
      // Reset para múltiplo mínimo após adicionar
      var multiplos = parseInt(input.dataset.multiplos) || 1;
      input.value = multiplos;
    }
  },

  addToCart: function(produtoId, quantidade) {
    var produto = null;
    for (var i = 0; i < this.produtos.length; i++) {
      if (this.produtos[i].id === produtoId) {
        produto = this.produtos[i];
        break;
      }
    }
    
    if (!produto) return;
    
    // Validar quantidade positiva
    if (quantidade <= 0) {
      alert('A quantidade deve ser maior que zero!');
      var qtyInput = document.querySelector('[data-produto-id="' + produtoId + '"] .quantity-input');
      if (qtyInput) {
        qtyInput.value = 1;
      }
      return;
    }
    
    // Validar múltiplos
    var multiplos = produto.multiplos || 1;
    if (quantidade % multiplos !== 0) {
      var qtdSugerida = Math.ceil(quantidade / multiplos) * multiplos;
      alert('Este produto deve ser pedido em múltiplos de ' + multiplos + ' unidades.\n' +
            'Quantidade atual: ' + quantidade + '\n' +
            'Quantidade sugerida: ' + qtdSugerida);
      
      // Atualizar o input com a quantidade sugerida
      var qtyInput = document.querySelector('[data-produto-id="' + produtoId + '"] .quantity-input');
      if (qtyInput) {
        qtyInput.value = qtdSugerida;
      }
      return;
    }
    
    var existingItem = null;
    for (var i = 0; i < this.carrinho.length; i++) {
      if (this.carrinho[i].id === produtoId) {
        existingItem = this.carrinho[i];
        break;
      }
    }
    
    if (existingItem) {
      existingItem.quantidade += quantidade;
    } else {
      this.carrinho.push({
        id: produto.id,
        codprod: produto.codprod,
        descricao: produto.descricao,
        unidade: produto.unidade || 'UN',
        multiplos: produto.multiplos || 1,
        quantidade: quantidade,
        preco: produto.preco || 0
      });
    }
    
    // Salvar carrinho no localStorage
    localStorage.setItem('nexus_b2b_cart', JSON.stringify(this.carrinho));
    
    this.updateCartDisplay();
    this.abrirCarrinho(); // Abrir carrinho ao adicionar produto
    this.showSuccess(produto.descricao + ' adicionado ao carrinho!');
  },
  
  removeFromCart: function(produtoId) {
    var newCarrinho = [];
    for (var i = 0; i < this.carrinho.length; i++) {
      if (this.carrinho[i].id !== produtoId) {
        newCarrinho.push(this.carrinho[i]);
      }
    }
    this.carrinho = newCarrinho;
    this.updateCartDisplay();
  },
  
  updateCartQuantity: function(produtoId, novaQuantidade) {
    for (var i = 0; i < this.carrinho.length; i++) {
      if (this.carrinho[i].id === produtoId) {
        if (novaQuantidade > 0) {
          this.carrinho[i].quantidade = novaQuantidade;
        } else {
          this.removeFromCart(produtoId);
        }
        break;
      }
    }
    this.updateCartDisplay();
  },
  
  updateCartDisplay: function() {
    var headerCartCount = document.getElementById('cartCount');
    var cartContent = document.getElementById('cartItems');
    var cartTotal = document.getElementById('cartTotal');
    var checkoutBtn = document.getElementById('checkoutBtn');
    
    var totalItems = 0;
    for (var i = 0; i < this.carrinho.length; i++) {
      totalItems += this.carrinho[i].quantidade;
    }
    
    if (headerCartCount) {
      headerCartCount.textContent = totalItems;
    }
    
    if (!cartContent || !cartTotal) {
      console.warn('⚠️ Elementos do carrinho não encontrados');
      return;
    }
    
    if (this.carrinho.length === 0) {
      cartContent.innerHTML = '<div class="cart-empty">' +
        '<div class="cart-empty-icon">🛒</div>' +
        '<p>Carrinho vazio</p>' +
        '<small>Adicione produtos para começar</small>' +
      '</div>';
      
      // Ocultar total e botão quando vazio
      cartTotal.style.display = 'none';
      if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.style.display = 'none';
      }
    } else {
      var html = '';
      var valorTotalCarrinho = 0;
      
      for (var i = 0; i < this.carrinho.length; i++) {
        var item = this.carrinho[i];
        var valorItem = (item.preco || 0) * item.quantidade;
        valorTotalCarrinho += valorItem;
        
        var valorItemFormatado = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(valorItem).replace(/\u00A0/g, ' '); // Correção de encoding
        
        html += '<div class="cart-item">' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + item.descricao + '</div>' +
            '<div class="cart-item-code">Cód: ' + item.codprod + '</div>' +
            '<div class="cart-item-qty">Qtd: ' + item.quantidade + ' ' + item.unidade + '</div>' +
            (item.multiplos > 1 ? '<div class="cart-item-multiplos">Múltiplos de ' + item.multiplos + '</div>' : '') +
            '<div class="cart-item-price" style="color: #059669; font-weight: 600; margin-top: 4px;">' + valorItemFormatado + '</div>' +
          '</div>' +
          '<div class="cart-item-actions">' +
            '<button class="remove-item" onclick="app.removeFromCart(' + item.id + ')">×</button>' +
          '</div>' +
        '</div>';
      }
      cartContent.innerHTML = html;
      
      // Atualizar contador de itens e valor total
      var totalItemsSpan = document.getElementById('totalItems');
      if (totalItemsSpan) {
        totalItemsSpan.textContent = totalItems;
      }
      
      // Adicionar ou atualizar div de valor total
      var valorTotalDiv = document.getElementById('valorTotalCarrinho');
      if (!valorTotalDiv) {
        // Criar div se não existir
        valorTotalDiv = document.createElement('div');
        valorTotalDiv.id = 'valorTotalCarrinho';
        valorTotalDiv.style.cssText = 'padding: 12px; background: #f0fdf4; border: 2px solid #059669; border-radius: 8px; margin: 10px 0; text-align: center;';
        
        // Inserir antes do botão de checkout
        var totalLabel = cartTotal.querySelector('.total-label');
        if (totalLabel) {
          totalLabel.parentNode.insertBefore(valorTotalDiv, totalLabel.nextSibling);
        }
      }
      
      var valorTotalFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorTotalCarrinho).replace(/\u00A0/g, ' '); // Correção de encoding
      
      // Verificar se há limite disponível e se foi ultrapassado
      var limiteDisponivel = parseFloat(window.limiteDisponivel) || 0;
      var acimadoLimite = valorTotalCarrinho > limiteDisponivel;
      
      console.log('💰 Verificação de limite:', {
        valorCarrinho: valorTotalCarrinho,
        limiteDisponivel: limiteDisponivel,
        acimadoLimite: acimadoLimite
      });
      
      // Se limite for zero ou negativo E houver itens no carrinho, mostrar alerta
      if (limiteDisponivel <= 0 && valorTotalCarrinho > 0) {
        // Sem limite disponível - alerta vermelho crítico
        valorTotalDiv.innerHTML = '<div style="font-size: 0.875rem; color: #dc2626; margin-bottom: 4px;">⚠️ Valor Total</div>' +
          '<div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">' + valorTotalFormatado + '</div>' +
          '<div style="font-size: 0.75rem; color: #dc2626; margin-top: 6px; padding: 6px; background: #fef2f2; border-radius: 4px; border: 1px solid #fecaca;">' +
          '<strong>🚫 SEM LIMITE DISPONÍVEL</strong><br>' +
          'Este pedido precisará de aprovação do gestor' +
          '</div>';
        valorTotalDiv.style.cssText = 'padding: 12px; background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; margin: 10px 0; text-align: center;';
      } else if (acimadoLimite) {
        // Carrinho acima do limite - alerta vermelho
        valorTotalDiv.innerHTML = '<div style="font-size: 0.875rem; color: #dc2626; margin-bottom: 4px;">⚠️ Valor Total</div>' +
          '<div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">' + valorTotalFormatado + '</div>' +
          '<div style="font-size: 0.75rem; color: #dc2626; margin-top: 6px; padding: 6px; background: #fef2f2; border-radius: 4px; border: 1px solid #fecaca;">' +
          '<strong>⚠️ LIMITE ULTRAPASSADO</strong><br>' +
          'Este pedido precisará de aprovação do gestor' +
          '</div>';
        valorTotalDiv.style.cssText = 'padding: 12px; background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; margin: 10px 0; text-align: center;';
      } else {
        // Carrinho dentro do limite - verde normal
        valorTotalDiv.innerHTML = '<div style="font-size: 0.875rem; color: #047857; margin-bottom: 4px;">Valor Total</div>' +
          '<div style="font-size: 1.5rem; font-weight: 700; color: #059669;">' + valorTotalFormatado + '</div>';
        valorTotalDiv.style.cssText = 'padding: 12px; background: #f0fdf4; border: 2px solid #059669; border-radius: 8px; margin: 10px 0; text-align: center;';
      }
      
      // Mostrar total e botão quando há itens
      cartTotal.style.display = 'block';
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.style.display = 'block';
      }
    }
  },
  
  checkout: function() {
    var self = this;
    if (this.carrinho.length === 0) {
      self.showError('Carrinho vazio!');
      return;
    }
    
    // Determinar equipes para o pedido
    var equipesParaPedido = [];
    
    if (this.equipesSelecionadas.length > 0) {
      // Usar equipes selecionadas no modal
      equipesParaPedido = this.equipesSelecionadas;
      console.log('🏪 Usando', equipesParaPedido.length, 'lojas selecionadas no modal');
    } else if (this.equipes.length > 1 && !this.equipeSelecionada) {
      // Usuário tem múltiplas equipes mas não selecionou nenhuma
      alert('⚠️ Por favor, selecione uma loja antes de realizar o pedido!\n\nClique no botão de crédito no topo da página para escolher a loja.');
      return;
    } else {
      // Usar equipe selecionada ou a única equipe disponível
      var equipeUnica = this.equipeSelecionada || (this.equipes.length === 1 ? this.equipes[0] : null);
      if (equipeUnica) {
        equipesParaPedido = [equipeUnica];
      }
    }
    
    if (equipesParaPedido.length === 0) {
      self.showError('Erro: Nenhuma equipe selecionada');
      return;
    }
    
    console.log('🏪 Criando pedidos para', equipesParaPedido.length, 'loja(s):', equipesParaPedido.map(function(e) { return e.nome; }).join(', '));
    
    // Calcular valor total
    var valorTotal = 0;
    for (var i = 0; i < this.carrinho.length; i++) {
      var item = this.carrinho[i];
      valorTotal += (item.preco || 0) * (item.quantidade || 0);
    }
    
    // Verificar limites de TODAS as equipes selecionadas
    var equipesComLimite = [];
    var equipesSemLimite = [];
    
    for (var i = 0; i < equipesParaPedido.length; i++) {
      var equipe = equipesParaPedido[i];
      var limiteDisponivel = parseFloat(equipe.limite_disponivel || 0);
      
      if (limiteDisponivel <= 0 || valorTotal > limiteDisponivel) {
        equipesSemLimite.push({
          equipe: equipe,
          limite: limiteDisponivel,
          excedente: valorTotal - limiteDisponivel
        });
      } else {
        equipesComLimite.push(equipe);
      }
    }
    
    // Se TODAS as lojas não têm limite, bloquear
    if (equipesComLimite.length === 0) {
      var valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorTotal).replace(/\u00A0/g, ' ');
      
      var mensagem = '🚫 PEDIDO BLOQUEADO - SEM LIMITE DISPONÍVEL\n\n';
      mensagem += '💰 Valor do pedido: ' + valorFormatado + '\n\n';
      mensagem += '❌ Nenhuma loja selecionada possui limite disponível:\n\n';
      
      for (var i = 0; i < equipesSemLimite.length; i++) {
        var prob = equipesSemLimite[i];
        var limiteFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prob.limite).replace(/\u00A0/g, ' ');
        mensagem += '• ' + prob.equipe.nome + ': ' + limiteFormatado + '\n';
      }
      
      mensagem += '\n⚠️ Entre em contato com o gestor para liberar crédito.';
      alert(mensagem);
      return;
    }
    
    // Se ALGUMAS lojas não têm limite, perguntar se quer continuar
    if (equipesSemLimite.length > 0) {
      var valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorTotal).replace(/\u00A0/g, ' ');
      
      var mensagem = '⚠️ ATENÇÃO: ALGUMAS LOJAS SEM LIMITE\n\n';
      mensagem += '💰 Valor do pedido: ' + valorFormatado + '\n\n';
      mensagem += '❌ Lojas SEM limite disponível (' + equipesSemLimite.length + '):\n';
      
      for (var i = 0; i < equipesSemLimite.length; i++) {
        var prob = equipesSemLimite[i];
        var limiteFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prob.limite).replace(/\u00A0/g, ' ');
        mensagem += '• ' + prob.equipe.nome;
        if (prob.limite <= 0) {
          mensagem += ' (sem crédito)\n';
        } else {
          mensagem += ' (faltam ' + new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prob.excedente).replace(/\u00A0/g, ' ') + ')\n';
        }
      }
      
      mensagem += '\n✅ Lojas COM limite disponível (' + equipesComLimite.length + '):\n';
      for (var i = 0; i < equipesComLimite.length; i++) {
        mensagem += '• ' + equipesComLimite[i].nome + '\n';
      }
      
      mensagem += '\n⚠️ Deseja continuar o pedido APENAS para as ' + equipesComLimite.length + ' loja(s) com limite?';
      
      if (!confirm(mensagem)) {
        console.log('❌ Usuário cancelou o pedido');
        return;
      }
      
      // Atualizar para processar apenas lojas com limite
      equipesParaPedido = equipesComLimite;
      console.log('✅ Continuando com', equipesParaPedido.length, 'lojas que têm limite');
    }
    
    // Validação adicional para lojas com limite (caso ainda exceda individualmente)
    var equipesComProblema = [];
    for (var i = 0; i < equipesParaPedido.length; i++) {
      var equipe = equipesParaPedido[i];
      var limiteDisponivel = parseFloat(equipe.limite_disponivel || 0);
      
      if (limiteDisponivel <= 0 || valorTotal > limiteDisponivel) {
        equipesComProblema.push({
          equipe: equipe,
          limite: limiteDisponivel,
          excedente: valorTotal - limiteDisponivel
        });
      }
    }
    
    // Se ainda há problemas após filtrar, validar normalmente (para aprovação do gestor)
    if (equipesComProblema.length > 0) {
      var valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorTotal).replace(/\u00A0/g, ' ');
      
      var mensagem = '⚠️ ATENÇÃO: LIMITE DE CRÉDITO ⚠️\n\n';
      mensagem += '💰 Valor do pedido: ' + valorFormatado + '\n\n';
      
      if (equipesComProblema.length === 1) {
        var prob = equipesComProblema[0];
        var limiteFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prob.limite).replace(/\u00A0/g, ' ');
        
        if (prob.limite <= 0) {
          mensagem += '🚫 Loja: ' + prob.equipe.nome + '\n';
          mensagem += '   Sem limite disponível (' + limiteFormatado + ')\n\n';
        } else {
          var excedenteFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prob.excedente).replace(/\u00A0/g, ' ');
          mensagem += '📊 Loja: ' + prob.equipe.nome + '\n';
          mensagem += '   Limite: ' + limiteFormatado + '\n';
          mensagem += '   Excedente: ' + excedenteFormatado + '\n\n';
        }
      } else {
        mensagem += '📋 Lojas com limite insuficiente:\n\n';
        for (var i = 0; i < equipesComProblema.length; i++) {
          var prob = equipesComProblema[i];
          var limiteFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prob.limite).replace(/\u00A0/g, ' ');
          mensagem += '• ' + prob.equipe.nome + ' (Limite: ' + limiteFormatado + ')\n';
        }
        mensagem += '\n';
      }
      
      if (equipesParaPedido.length === equipesComProblema.length) {
        mensagem += '📋 TODOS os pedidos precisarão de APROVAÇÃO DO GESTOR.\n\n';
      } else {
        mensagem += '📋 ' + equipesComProblema.length + ' de ' + equipesParaPedido.length + ' pedidos precisarão de APROVAÇÃO DO GESTOR.\n\n';
      }
      
      mensagem += '✅ Deseja enviar mesmo assim?\n\n';
      mensagem += 'Clique OK para enviar ou CANCELAR para revisar.';
      
      var confirmar = confirm(mensagem);
      
      if (!confirmar) {
        console.log('❌ Usuário cancelou o envio dos pedidos');
        return;
      }
      
      console.log('✅ Usuário confirmou envio dos pedidos para aprovação');
    }
    
    var checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando pedidos...';
    }
    
    // Preparar itens do pedido
    var itens = [];
    valorTotal = 0;
    for (var i = 0; i < this.carrinho.length; i++) {
      var item = this.carrinho[i];
      var valorUnitario = item.preco || 0;
      var quantidade = item.quantidade || 0;
      
      if (quantidade <= 0) {
        self.showError('Quantidade inválida para o produto: ' + item.descricao);
        if (checkoutBtn) {
          checkoutBtn.disabled = false;
          checkoutBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Pedido ao Vendedor';
        }
        return;
      }
      
      if (valorUnitario < 0) {
        self.showError('Valor inválido para o produto: ' + item.descricao);
        if (checkoutBtn) {
          checkoutBtn.disabled = false;
          checkoutBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Pedido ao Vendedor';
        }
        return;
      }
      
      valorTotal += quantidade * valorUnitario;
      
      itens.push({
        codprod: item.codprod,
        descricao: item.descricao,
        quantidade: quantidade,
        valor_unitario: valorUnitario
      });
    }
    
    if (valorTotal <= 0) {
      self.showError('O valor total do pedido deve ser maior que zero!');
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Pedido ao Vendedor';
      }
      return;
    }
    
    // Criar pedidos para TODAS as equipes selecionadas
    var promises = [];
    
    for (var i = 0; i < equipesParaPedido.length; i++) {
      var equipe = equipesParaPedido[i];
      
      var pedidoData = {
        equipe_id: equipe.id,
        itens: itens
      };
      
      console.log('📦 Enviando pedido para', equipe.nome, ':', pedidoData);
      
      promises.push(
        self.api('/api/pedidos', {
          method: 'POST',
          body: JSON.stringify(pedidoData)
        })
        .then(function(response) {
          if (!response.ok) {
            return response.json().then(function(data) {
              throw new Error(data.error || 'Erro ao criar pedido');
            });
          }
          return response.json();
        })
      );
    }
    
    // Aguardar TODOS os pedidos serem criados
    Promise.all(promises)
      .then(function(resultados) {
        console.log('✅ Todos os', resultados.length, 'pedidos criados com sucesso!');
        
        self.carrinho = [];
        localStorage.setItem('nexus_b2b_cart', JSON.stringify(self.carrinho));
        self.updateCartDisplay();
        
        // Limpar seleção de equipes e permitir que o modal apareça novamente no próximo pedido
        self.equipesSelecionadas = [];
        sessionStorage.removeItem('modalSelecaoExibido');
        console.log('🔄 SessionStorage limpo - modal poderá aparecer novamente no próximo acesso');
        
        var mensagem = '✅ PEDIDOS ENVIADOS COM SUCESSO!\n\n';
        mensagem += '📦 ' + resultados.length + ' pedido(s) criado(s) para:\n\n';
        
        for (var i = 0; i < equipesParaPedido.length; i++) {
          mensagem += '• ' + equipesParaPedido[i].nome + '\n';
        }
        
        mensagem += '\n📋 Seus pedidos estão AGUARDANDO APROVAÇÃO do gestor.\n';
        mensagem += '💰 Seu crédito será debitado APENAS após aprovação.\n';
        mensagem += '📧 O gestor foi notificado e irá analisar seus pedidos.';
        
        self.showSuccess(mensagem);
      })
      .catch(function(error) {
        console.error('❌ Erro ao criar pedidos:', error);
        self.showError('Erro ao criar pedidos: ' + error.message);
      })
      .finally(function() {
        if (checkoutBtn) {
          checkoutBtn.disabled = false;
          checkoutBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Pedido ao Vendedor';
        }
      });
  },
  
  // Carrinho agora é fixo na lateral - funções de toggle removidas
  
  handleSearch: function() {
    this.currentFilters.search = document.getElementById('searchInput').value.trim();
    this.currentPage = 1;
    this.loadProducts();
  },
  
  handleCategoryFilter: function() {
    this.currentFilters.categoria = document.getElementById('categoryFilter').value;
    this.currentPage = 1;
    this.loadProducts();
  },
  
  clearFilters: function() {
    document.getElementById('headerSearch').value = '';
    document.getElementById('categoryFilter').value = '';
    this.currentFilters = { search: '', categoria: '' };
    this.currentPage = 1;
    this.loadProducts();
  },
  
  goToPage: function(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  },
  
  updatePagination: function() {
    var pagination = document.getElementById('pagination');
    var pageInfo = document.getElementById('pageInfo');
    var prevBtn = document.getElementById('prevPage');
    var nextBtn = document.getElementById('nextPage');
    
    if (!pagination || !pageInfo || !prevBtn || !nextBtn) {
      console.warn('⚠️ Elementos de paginação não encontrados');
      return;
    }
    
    if (this.totalPages <= 1) {
      pagination.style.display = 'none';
    } else {
      pagination.style.display = 'flex';
      pageInfo.textContent = 'Página ' + this.currentPage + ' de ' + this.totalPages;
      prevBtn.disabled = this.currentPage <= 1;
      nextBtn.disabled = this.currentPage >= this.totalPages;
    }
  },
  
  showLoading: function(show) {
    var loading = document.getElementById('loadingProducts');
    var grid = document.getElementById('productsGrid');
    
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
    
    if (grid) {
      grid.style.display = show ? 'none' : 'grid';
    }
  },
  
  showSuccess: function(message) {
    this.showNotification(message, '#10b981');
  },
  
  showError: function(message) {
    this.showNotification(message, '#ef4444');
  },
  
  fecharCarrinho: function() {
    var cartSidebar = document.querySelector('.cart-sidebar');
    
    // Apenas fechar visualmente
    if (cartSidebar) {
      cartSidebar.classList.add('hidden');
      cartSidebar.style.display = 'none';
    }
  },
  
  limparCarrinho: function() {
    var self = this;
    
    if (this.carrinho.length === 0) {
      alert('O carrinho já está vazio');
      return;
    }
    
    if (confirm('Deseja realmente limpar todos os itens do carrinho?')) {
      this.carrinho = [];
      localStorage.setItem('nexus_b2b_cart', JSON.stringify(this.carrinho));
      this.updateCartDisplay();
      console.log('🧹 Carrinho limpo pelo usuário');
      alert('Carrinho limpo com sucesso!');
    }
  },
  
  abrirCarrinho: function() {
    var cartSidebar = document.querySelector('.cart-sidebar');
    if (cartSidebar) {
      cartSidebar.classList.remove('hidden');
      cartSidebar.style.display = 'block';
      
      // Rolar suavemente até o carrinho
      cartSidebar.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      });
    }
  },
  
  toggleCarrinho: function() {
    var cartSidebar = document.querySelector('.cart-sidebar');
    if (cartSidebar) {
      if (cartSidebar.classList.contains('hidden') || window.getComputedStyle(cartSidebar).display === 'none') {
        this.abrirCarrinho();
      } else {
        this.fecharCarrinho();
      }
    }
  },

  carregarCreditoDisponivel: function() {
    var self = this;
    
    if (!this.equipeId) {
      console.log('⚠️ Equipe ID não encontrado, não é possível carregar crédito');
      return;
    }
    
    console.log('💳 Carregando crédito disponível para equipe:', this.equipeId);
    
    this.api('/api/equipes/' + this.equipeId + '/saldo')
      .then(function(response) { return response.json(); })
      .then(function(data) {
        console.log('💳 Dados de crédito recebidos:', data);
        
        var creditoInfo = document.getElementById('creditoInfo');
        var creditoDisponivel = document.getElementById('creditoDisponivel');
        
        if (creditoInfo && creditoDisponivel && data) {
          var limiteDisponivel = parseFloat(data.limite_disponivel || data.saldo_atual || 0);
          var limiteTotal = parseFloat(data.limite_credito || data.limite_total || 0);
          
          // Armazenar limite disponível globalmente para verificação no carrinho
          window.limiteDisponivel = limiteDisponivel;
          
          console.log('💰 Limite armazenado globalmente:', window.limiteDisponivel);
          
          // Formatar valores em reais e remover caracteres non-breaking space
          var valorFormatado = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(limiteDisponivel).replace(/\u00A0/g, ' ');
          
          creditoDisponivel.innerHTML = valorFormatado;
          creditoInfo.style.display = 'flex';
          
          // Adicionar tooltip com informações completas e formatação segura
          creditoInfo.title = 'Limite Total: ' + new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(limiteTotal).replace(/\u00A0/g, ' ') + '\nDisponível: ' + valorFormatado;
          
          console.log('✅ Crédito exibido:', valorFormatado);
          
          // Atualizar o carrinho para recalcular com o limite correto
          self.updateCartDisplay();
        }
      })
      .catch(function(error) {
        console.error('❌ Erro ao carregar crédito:', error);
      });
  },

  // Carregar todas as equipes do usuário
  carregarTodasEquipes: function() {
    var self = this;
    var token = localStorage.getItem('nexus_b2b_token');
    
    if (!token) {
      console.error('❌ Token não encontrado');
      return;
    }
    
    // Decodificar token para pegar o ID do usuário
    try {
      var base64 = token.split('.')[1];
      var payload = JSON.parse(atob(base64));
      var userId = payload.id;
      
      console.log('👥 Carregando todas as equipes do usuário:', userId);
      
      this.api('/api/usuarios/' + userId + '/equipes')
        .then(function(response) { 
          console.log('📡 Response status:', response.status);
          if (!response.ok) {
            throw new Error('Erro ao carregar equipes: ' + response.status);
          }
          return response.json(); 
        })
        .then(function(data) {
          console.log('✅ Equipes do usuário carregadas:', data);
          
          self.equipes = data.equipes || [];
          console.log('📊 Total de equipes:', self.equipes.length);
          
          // Se o usuário tem múltiplas equipes, mostrar modal E dropdown
          if (self.equipes.length > 1) {
            console.log('🔽 Configurando dropdown para múltiplas equipes');
            self.configurarDropdownEquipes();
            
            // Mostrar modal apenas se não tiver seleção prévia nesta sessão
            var modalJaExibido = sessionStorage.getItem('modalSelecaoExibido');
            if (!modalJaExibido) {
              console.log('🔔 Usuário tem múltiplas equipes - mostrando modal de seleção (primeira vez)');
              setTimeout(function() {
                self.mostrarModalSelecaoEquipe();
              }, 500); // Pequeno delay para garantir que a página carregou
            } else {
              console.log('ℹ️ Modal já foi exibido nesta sessão');
            }
          } else if (self.equipes.length === 1) {
            // Se tem apenas uma equipe, selecionar automaticamente
            console.log('🏪 Apenas uma equipe, selecionando automaticamente');
            self.selecionarEquipe(self.equipes[0].id);
          } else {
            console.warn('⚠️ Usuário sem equipes vinculadas');
          }
        })
        .catch(function(error) {
          console.error('❌ Erro ao carregar equipes:', error);
        });
    } catch (e) {
      console.error('Erro ao decodificar token:', e);
    }
  },

  // Configurar dropdown de equipes
  configurarDropdownEquipes: function() {
    var self = this;
    var creditoInfo = document.getElementById('creditoInfo');
    var dropdownList = document.getElementById('equipesDropdownList');
    
    console.log('🔧 Configurando dropdown de equipes');
    console.log('creditoInfo encontrado:', !!creditoInfo);
    console.log('dropdownList encontrado:', !!dropdownList);
    
    if (!creditoInfo || !dropdownList) {
      console.error('❌ Elementos do dropdown não encontrados');
      console.log('creditoInfo:', creditoInfo);
      console.log('dropdownList:', dropdownList);
      return;
    }
    
    // Adicionar classe para indicar múltiplas lojas
    creditoInfo.classList.add('multiple-stores');
    console.log('✅ Classe multiple-stores adicionada');
    
    // Preencher lista de equipes
    dropdownList.innerHTML = '';
    
    this.equipes.forEach(function(equipe) {
      var limiteDisponivel = parseFloat(equipe.limite_disponivel || 0);
      var limiteTotal = parseFloat(equipe.limite_credito || equipe.limite_total || 0);
      var percentualUtilizado = limiteTotal > 0 ? ((limiteTotal - limiteDisponivel) / limiteTotal) * 100 : 0;
      
      console.log('📦 Adicionando equipe:', equipe.nome, 'Limite:', limiteDisponivel);
      
      var classeValor = 'equipe-dropdown-limite-valor';
      if (limiteDisponivel <= 0 || percentualUtilizado >= 80) {
        classeValor += ' critico';
      } else if (percentualUtilizado >= 50) {
        classeValor += ' atencao';
      }
      
      var item = document.createElement('div');
      item.className = 'equipe-dropdown-item';
      item.setAttribute('data-equipe-id', equipe.id);
      item.onclick = function() {
        self.selecionarEquipe(equipe.id);
      };
      
      item.innerHTML = '<div class="equipe-dropdown-nome">' +
        '<i class="fas fa-store"></i>' +
        equipe.nome +
        '</div>' +
        (equipe.codigo_erp ? '<div class="equipe-dropdown-codigo">Código: ' + equipe.codigo_erp + '</div>' : '') +
        '<div class="equipe-dropdown-limite">' +
          '<span class="equipe-dropdown-limite-label">Limite Disponível:</span>' +
          '<span class="' + classeValor + '">' +
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(limiteDisponivel).replace(/\u00A0/g, ' ') +
          '</span>' +
        '</div>';
      
      dropdownList.appendChild(item);
    });
    
    console.log('✅ Dropdown preenchido com', this.equipes.length, 'equipes');
    
    // Selecionar primeira equipe por padrão
    if (this.equipes.length > 0 && !this.equipeSelecionada) {
      this.selecionarEquipe(this.equipes[0].id);
    }
  },

  // Selecionar equipe
  selecionarEquipe: function(equipeId) {
    var self = this;
    console.log('🏪 Selecionando equipe:', equipeId);
    
    this.equipeSelecionada = this.equipes.find(function(eq) { return eq.id === equipeId; });
    
    if (!this.equipeSelecionada) {
      console.error('❌ Equipe não encontrada:', equipeId);
      return;
    }
    
    // Atualizar UI
    var creditoDisponivel = document.getElementById('creditoDisponivel');
    var equipeNomeAtual = document.getElementById('equipeNomeAtual');
    var dropdownItems = document.querySelectorAll('.equipe-dropdown-item');
    
    // Atualizar nome da equipe no header
    if (equipeNomeAtual) {
      equipeNomeAtual.innerHTML = this.equipeSelecionada.nome;
    }
    
    // Atualizar valor do crédito
    if (creditoDisponivel) {
      var limiteDisponivel = parseFloat(this.equipeSelecionada.limite_disponivel || 0);
      window.limiteDisponivel = limiteDisponivel;
      
      creditoDisponivel.innerHTML = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(limiteDisponivel).replace(/\u00A0/g, ' '); // Correção de encoding
      
      console.log('💰 Limite atualizado:', limiteDisponivel);
    }
    
    // Marcar item como selecionado
    dropdownItems.forEach(function(item) {
      item.classList.remove('selected');
      if (parseInt(item.getAttribute('data-equipe-id')) === equipeId) {
        item.classList.add('selected');
      }
    });
    
    // Fechar dropdown
    this.fecharEquipesDropdown();
    
    // Atualizar carrinho
    this.updateCartDisplay();
  },

  // Toggle dropdown de equipes - agora abre o modal
  toggleEquipesDropdown: function() {
    if (this.equipes.length <= 1) {
      return; // Não mostrar dropdown se tem apenas uma equipe
    }
    
    // Abrir o modal de seleção de equipes
    this.mostrarModalSelecaoEquipe();
  },

  fecharEquipesDropdown: function() {
    // Função mantida para compatibilidade
    var dropdown = document.getElementById('equipesDropdown');
    var creditoInfo = document.getElementById('creditoInfo');
    
    if (dropdown) dropdown.classList.remove('show');
    if (creditoInfo) creditoInfo.classList.remove('open');
  },

  // Mostrar modal de seleção de equipe (para usuários com múltiplas equipes)
  mostrarModalSelecaoEquipe: function() {
    var self = this;
    console.log('🔔 Mostrando modal de seleção de equipe');
    
    var modal = document.getElementById('modalSelecaoEquipe');
    var listaEquipes = document.getElementById('listaEquipesSelecao');
    var btnConfirmar = document.getElementById('btnConfirmarEquipe');
    
    if (!modal || !listaEquipes) {
      console.error('❌ Elementos do modal não encontrados');
      return;
    }
    
    // Limpar lista
    listaEquipes.innerHTML = '';
    
    // Preencher com as equipes
    this.equipes.forEach(function(equipe) {
      var limiteDisponivel = parseFloat(equipe.limite_disponivel || 0);
      var limiteTotal = parseFloat(equipe.limite_credito || equipe.limite_total || 0);
      var percentualUtilizado = limiteTotal > 0 ? ((limiteTotal - limiteDisponivel) / limiteTotal) * 100 : 0;
      
      var classeValor = 'equipe-selecao-limite-valor';
      if (limiteDisponivel <= 0 || percentualUtilizado >= 80) {
        classeValor += ' critico';
      } else if (percentualUtilizado >= 50) {
        classeValor += ' atencao';
      }
      
      // Verificar se esta equipe já está selecionada
      var jaSelecionada = self.equipesSelecionadas.find(function(eq) { return eq.id === equipe.id; });
      
      var item = document.createElement('div');
      item.className = 'equipe-selecao-item' + (jaSelecionada ? ' selected' : '');
      item.setAttribute('data-equipe-id', equipe.id);
      item.onclick = function() {
        self.selecionarEquipeModal(equipe.id);
      };
      
      item.innerHTML = '<div class="checkbox-icon"><i class="fas fa-check" style="display:' + (jaSelecionada ? 'block' : 'none') + ';"></i></div>' +
        '<div class="equipe-selecao-nome">' +
        '<i class="fas fa-store"></i>' +
        equipe.nome +
        '</div>' +
        (equipe.codigo_erp ? '<div class="equipe-selecao-codigo">Código ERP: ' + equipe.codigo_erp + '</div>' : '') +
        '<div class="equipe-selecao-limite">' +
          '<span class="equipe-selecao-limite-label">Limite Disponível</span>' +
          '<span class="' + classeValor + '">' +
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(limiteDisponivel).replace(/\u00A0/g, ' ') +
          '</span>' +
        '</div>';
      
      listaEquipes.appendChild(item);
    });
    
    // Atualizar contador com as seleções atuais
    this.atualizarContadorSelecao();
    
    // Mostrar modal com animação
    setTimeout(function() {
      modal.classList.add('show');
    }, 100);
    
    console.log('✅ Modal exibido com', this.equipes.length, 'equipes');
  },

  // Selecionar equipe no modal (múltipla seleção)
  selecionarEquipeModal: function(equipeId) {
    var items = document.querySelectorAll('.equipe-selecao-item');
    var item = document.querySelector('.equipe-selecao-item[data-equipe-id="' + equipeId + '"]');
    
    if (!item) return;
    
    // Toggle seleção
    var jaEstasSelecionado = item.classList.contains('selected');
    var checkIcon = item.querySelector('.checkbox-icon i');
    
    if (jaEstasSelecionado) {
      // Desmarcar
      item.classList.remove('selected');
      if (checkIcon) checkIcon.style.display = 'none';
      this.equipesSelecionadas = this.equipesSelecionadas.filter(function(eq) {
        return eq.id !== equipeId;
      });
    } else {
      // Marcar
      item.classList.add('selected');
      if (checkIcon) checkIcon.style.display = 'block';
      var equipe = this.equipes.find(function(eq) { return eq.id === equipeId; });
      if (equipe && !this.equipesSelecionadas.find(function(e) { return e.id === equipeId; })) {
        this.equipesSelecionadas.push(equipe);
      }
    }
    
    this.atualizarContadorSelecao();
    
    console.log('Equipes selecionadas:', this.equipesSelecionadas.length);
  },

  // Atualizar contador de seleções
  atualizarContadorSelecao: function() {
    var contador = document.getElementById('contadorSelecao');
    var btnConfirmar = document.getElementById('btnConfirmarEquipe');
    var qtd = this.equipesSelecionadas.length;
    
    if (contador) {
      contador.innerHTML = '<strong>' + qtd + '</strong> loja(s) selecionada(s)';
    }
    
    if (btnConfirmar) {
      btnConfirmar.disabled = qtd === 0;
    }
  },

  // Selecionar todas as equipes
  selecionarTodasEquipes: function() {
    console.log('Selecionando todas as equipes');
    var self = this;
    var items = document.querySelectorAll('.equipe-selecao-item');
    
    this.equipesSelecionadas = [];
    
    items.forEach(function(item) {
      item.classList.add('selected');
      var checkIcon = item.querySelector('.checkbox-icon i');
      if (checkIcon) checkIcon.style.display = 'block';
      
      var equipeId = parseInt(item.getAttribute('data-equipe-id'));
      var equipe = self.equipes.find(function(eq) { return eq.id === equipeId; });
      if (equipe) {
        self.equipesSelecionadas.push(equipe);
      }
    });
    
    this.atualizarContadorSelecao();
  },

  // Desmarcar todas as equipes
  desmarcarTodasEquipes: function() {
    console.log('Desmarcando todas as equipes');
    var items = document.querySelectorAll('.equipe-selecao-item');
    
    items.forEach(function(item) {
      item.classList.remove('selected');
      var checkIcon = item.querySelector('.checkbox-icon i');
      if (checkIcon) checkIcon.style.display = 'none';
    });
    
    this.equipesSelecionadas = [];
    this.atualizarContadorSelecao();
  },

  // Filtrar equipes por nome ou código
  filtrarEquipes: function(termo) {
    var termoLower = termo.toLowerCase().trim();
    var items = document.querySelectorAll('.equipe-selecao-item');
    var contador = 0;
    
    items.forEach(function(item) {
      var nome = item.querySelector('.equipe-selecao-nome').textContent.toLowerCase();
      var codigo = item.querySelector('.equipe-selecao-codigo');
      var codigoTexto = codigo ? codigo.textContent.toLowerCase() : '';
      
      // Verificar se o termo está no nome ou no código
      if (nome.includes(termoLower) || codigoTexto.includes(termoLower)) {
        item.style.display = 'block';
        contador++;
      } else {
        item.style.display = 'none';
      }
    });
    
    console.log('🔍 Filtro aplicado:', contador, 'de', items.length, 'lojas exibidas');
  },

  // Confirmar seleção de equipe
  confirmarSelecaoEquipe: function() {
    if (this.equipesSelecionadas.length === 0) {
      alert('Por favor, selecione pelo menos uma loja');
      return;
    }
    
    console.log('✅ Confirmando seleção de', this.equipesSelecionadas.length, 'equipe(s)');
    
    // Marcar que o modal já foi exibido nesta sessão
    sessionStorage.setItem('modalSelecaoExibido', 'true');
    
    // Se selecionou apenas uma, usar como equipeSelecionada
    if (this.equipesSelecionadas.length === 1) {
      this.selecionarEquipe(this.equipesSelecionadas[0].id);
    } else {
      // Se selecionou múltiplas, usar a primeira como padrão no header
      this.selecionarEquipe(this.equipesSelecionadas[0].id);
      
      // Atualizar texto do header para indicar múltiplas lojas
      var equipeNomeAtual = document.getElementById('equipeNomeAtual');
      if (equipeNomeAtual) {
        equipeNomeAtual.textContent = this.equipesSelecionadas.length + ' Lojas Selecionadas';
      }
    }
    
    // Fechar modal
    var modal = document.getElementById('modalSelecaoEquipe');
    if (modal) {
      modal.classList.remove('show');
    }
    
    console.log('🎉 Modal fechado! Lojas selecionadas:', this.equipesSelecionadas.map(function(e) { return e.nome; }).join(', '));
  },
  
  carregarPedidos: function() {
    var self = this;
    var loadingPedidos = document.getElementById('loadingPedidos');
    var pedidosList = document.getElementById('pedidosList');
    var emptyPedidos = document.getElementById('emptyPedidos');
    
    if (loadingPedidos) loadingPedidos.style.display = 'flex';
    if (pedidosList) pedidosList.style.display = 'none';
    if (emptyPedidos) emptyPedidos.style.display = 'none';
    
    this.api('/api/pedidos?pageSize=50')
      .then(function(response) { return response.json(); })
      .then(function(data) {
        self.pedidos = data.pedidos || [];
        self.renderizarPedidos();
      })
      .catch(function(error) {
        console.error('Erro ao carregar pedidos:', error);
        self.showError('Erro ao carregar pedidos');
      })
      .finally(function() {
        if (loadingPedidos) loadingPedidos.style.display = 'none';
      });
  },
  
  renderizarPedidos: function() {
    var pedidosList = document.getElementById('pedidosList');
    var emptyPedidos = document.getElementById('emptyPedidos');
    
    if (!pedidosList) return;
    
    if (this.pedidos.length === 0) {
      pedidosList.style.display = 'none';
      if (emptyPedidos) emptyPedidos.style.display = 'flex';
      return;
    }
    
    pedidosList.style.display = 'grid';
    if (emptyPedidos) emptyPedidos.style.display = 'none';
    
    var html = '';
    for (var i = 0; i < this.pedidos.length; i++) {
      html += this.renderizarCardPedido(this.pedidos[i]);
    }
    
    pedidosList.innerHTML = html;
  },
  
  renderizarCardPedido: function(pedido) {
    var statusLabel = this.getStatusLabel(pedido.status);
    var statusClass = 'status-' + pedido.status;
    var data = new Date(pedido.data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    var valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(pedido.valor_total).replace(/\u00A0/g, ' '); // Correção de encoding
    
    var podeCancelar = pedido.status === 'AGUARDANDO';
    
    // Mostrar valor apenas para gestor
    var valorHtml = '';
    if (this.isGestor()) {
      valorHtml = '<div class="pedido-info-item">' +
        '<i class="fas fa-money-bill-wave"></i>' +
        '<span class="pedido-valor">' + valorFormatado + '</span>' +
      '</div>';
    }
    
    return '<div class="pedido-card" onclick="app.abrirDetalhesPedido(' + pedido.id + ')">' +
      '<div class="pedido-header">' +
        '<div>' +
          '<div class="pedido-numero">Pedido #' + pedido.id + '</div>' +
          '<div class="pedido-data">' + data + '</div>' +
        '</div>' +
        '<span class="pedido-status-badge ' + statusClass + '">' + statusLabel + '</span>' +
      '</div>' +
      '<div class="pedido-body">' +
        '<div class="pedido-info-item">' +
          '<i class="fas fa-building"></i>' +
          '<span>' + pedido.equipe_nome + '</span>' +
        '</div>' +
        valorHtml +
      '</div>' +
      '<div class="pedido-footer">' +
        '<button class="btn-ver-detalhes" onclick="event.stopPropagation(); app.abrirDetalhesPedido(' + pedido.id + ')">' +
          '<i class="fas fa-eye"></i> Ver Detalhes' +
        '</button>' +
        (podeCancelar ? '<button class="btn-cancelar-pedido" onclick="event.stopPropagation(); app.cancelarPedido(' + pedido.id + ')">' +
          '<i class="fas fa-times"></i> Cancelar' +
        '</button>' : '') +
      '</div>' +
    '</div>';
  },
  
  getStatusLabel: function(status) {
    var labels = {
      'AGUARDANDO': 'Aguardando',
      'EM_SEPARACAO': 'Em Separação',
      'EM_TRANSPORTE': 'Em Transporte',
      'SAIU_ENTREGA': 'Saiu para Entrega',
      'ENTREGUE': 'Entregue',
      'CANCELADO': 'Cancelado'
    };
    return labels[status] || status;
  },
  
  abrirDetalhesPedido: function(pedidoId) {
    var self = this;
    var modal = document.getElementById('pedidoModal');
    var modalContent = document.getElementById('pedidoModalContent');
    
    if (!modal || !modalContent) return;
    
    modalContent.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    modal.style.display = 'flex';
    
    this.api('/api/pedidos/' + pedidoId)
      .then(function(response) { return response.json(); })
      .then(function(data) {
        self.pedidoSelecionado = data;
        self.renderizarDetalhesPedido(data);
      })
      .catch(function(error) {
        console.error('Erro ao carregar detalhes:', error);
        modalContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">Erro ao carregar detalhes do pedido</div>';
      });
  },
  
  renderizarDetalhesPedido: function(data) {
    var pedido = data.pedido;
    var itens = data.itens;
    var modalContent = document.getElementById('pedidoModalContent');
    
    if (!modalContent) return;
    
    var valorTotal = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(pedido.valor_total).replace(/\u00A0/g, ' '); // Correção de encoding
    
    var data_pedido = new Date(pedido.data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Sempre mostrar valores nos detalhes do pedido (para todos os usuários)
    var mostrarValores = true;
    
    var html = '<div style="padding: 1rem;">' +
      '<div style="background: #f9fafb; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">' +
          '<div>' +
            '<strong>Pedido:</strong> #' + pedido.id +
          '</div>' +
          '<div>' +
            '<strong>Data:</strong> ' + data_pedido +
          '</div>' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">' +
          '<div>' +
            '<strong>Equipe:</strong> ' + pedido.equipe_nome +
          '</div>' +
          '<div>' +
            '<strong>Status:</strong> <span class="pedido-status-badge status-' + pedido.status + '">' + this.getStatusLabel(pedido.status) + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">' +
          '<div>' +
            '<strong>📋 Código ERP:</strong> ' + (pedido.codigo_erp || '<span style="color: #9ca3af;">Não informado</span>') +
          '</div>' +
          '<div>' +
            '<strong>🏢 CGC/CNPJ:</strong> ' + (pedido.cgc || '<span style="color: #9ca3af;">Não informado</span>') +
          '</div>' +
        '</div>' +
      '</div>' +
      
      '<div class="itens-section">' +
        '<h3><i class="fas fa-box-open"></i> Itens do Pedido</h3>' +
        '<table class="pedido-itens-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Código</th>' +
              '<th>Produto</th>' +
              '<th style="text-align: center;">Qtd</th>' +
              (mostrarValores ? '<th style="text-align: right;">Valor Unit.</th>' : '') +
              (mostrarValores ? '<th style="text-align: right;">Total</th>' : '') +
            '</tr>' +
          '</thead>' +
          '<tbody>';
    
    for (var i = 0; i < itens.length; i++) {
      var item = itens[i];
      var valorUnit = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(item.valor_unitario || 0).replace(/\u00A0/g, ' '); // Correção de encoding
      
      var valorTotalItem = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format((item.valor_unitario || 0) * (item.quantidade || 0)).replace(/\u00A0/g, ' '); // Correção de encoding
      
      html += '<tr>' +
        '<td class="item-codigo">' + item.codprod + '</td>' +
        '<td>' + item.descricao + '</td>' +
        '<td style="text-align: center;">' + item.quantidade + '</td>' +
        (mostrarValores ? '<td class="item-valor">' + valorUnit + '</td>' : '') +
        (mostrarValores ? '<td class="item-valor">' + valorTotalItem + '</td>' : '') +
      '</tr>';
    }
    
    var totalGeralHtml = '';
    if (mostrarValores) {
      totalGeralHtml = '<div class="pedido-total-geral">' +
        '<span class="pedido-total-label">Valor Total:</span>' +
        '<span class="pedido-total-valor">' + valorTotal + '</span>' +
      '</div>';
    }
    
    html += '</tbody></table>' +
      totalGeralHtml +
      '</div>';
    
    if (pedido.observacoes_rastreamento) {
      html += '<div style="margin-top: 2rem; padding: 1rem; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">' +
        '<strong>📝 Observações:</strong><br>' +
        pedido.observacoes_rastreamento +
      '</div>';
    }
    
    html += '</div>';
    
    modalContent.innerHTML = html;
  },
  
  /* FUNÇÃO DESATIVADA - Rastreamento será integrado com ERP no futuro
  renderizarRastreamento: function(pedido) {
    var etapas = [
      {
        id: 'confirmacao',
        titulo: 'Pedido Recebido',
        descricao: 'Pedido recebido e confirmado',
        icon: 'check-circle',
        data: pedido.data_confirmacao,
        status: pedido.data_confirmacao ? 'concluida' : 'pendente'
      },
      {
        id: 'separacao',
        titulo: 'Separação no Estoque',
        descricao: 'Produtos sendo separados',
        icon: 'boxes',
        data: pedido.data_separacao,
        status: pedido.data_separacao ? 'concluida' : (pedido.status === 'EM_SEPARACAO' ? 'em-andamento' : 'pendente')
      },
      {
        id: 'transporte',
        titulo: 'Em Transporte',
        descricao: 'Pedido saiu do estoque',
        icon: 'truck',
        data: pedido.data_transporte,
        status: pedido.data_transporte ? 'concluida' : (pedido.status === 'EM_TRANSPORTE' ? 'em-andamento' : 'pendente')
      },
      {
        id: 'saida',
        titulo: 'Saiu para Entrega',
        descricao: 'Em rota de entrega',
        icon: 'shipping-fast',
        data: pedido.data_saida,
        status: pedido.data_saida ? 'concluida' : (pedido.status === 'SAIU_ENTREGA' ? 'em-andamento' : 'pendente')
      },
      {
        id: 'entrega',
        titulo: 'Entregue',
        descricao: 'Pedido entregue ao cliente',
        icon: 'check-double',
        data: pedido.data_entrega,
        status: pedido.data_entrega ? 'concluida' : (pedido.status === 'ENTREGUE' ? 'em-andamento' : 'pendente')
      }
    ];
    
    if (pedido.status === 'CANCELADO') {
      return '<div class="rastreamento-cancelado">' +
        '<i class="fas fa-times-circle"></i>' +
        '<h3>Pedido Cancelado</h3>' +
        '<p>Este pedido foi cancelado</p>' +
      '</div>';
    }
    
    var html = '<div class="rastreamento-timeline">';
    
    for (var i = 0; i < etapas.length; i++) {
      var etapa = etapas[i];
      var dataFormatada = etapa.data ? new Date(etapa.data).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Aguardando';
      
      html += '<div class="rastreamento-etapa ' + etapa.status + '">' +
        '<div class="rastreamento-icon">' +
          '<i class="fas fa-' + etapa.icon + '"></i>' +
        '</div>' +
        '<div class="rastreamento-content">' +
          '<div class="rastreamento-titulo">' + (i + 1) + '. ' + etapa.titulo + '</div>' +
          '<div class="rastreamento-descricao">' + etapa.descricao + '</div>' +
          '<div class="rastreamento-data">' +
            '<i class="fas fa-calendar-alt"></i> ' + dataFormatada +
          '</div>' +
        '</div>' +
      '</div>';
    }
    
    html += '</div>';
    
    return html;
  },
  */
  
  fecharModalPedido: function() {
    var modal = document.getElementById('pedidoModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.pedidoSelecionado = null;
  },
  
  // ====================================
  // MODAL DE DETALHES DO PRODUTO
  // ====================================
  
  abrirDetalhesProduto: function(produtoId) {
    var self = this;
    console.log('📦 Abrindo detalhes do produto:', produtoId);
    
    this.api('/api/produtos/' + produtoId)
      .then(function(response) { return response.json(); })
      .then(function(produto) {
        self.renderizarDetalhesProduto(produto);
        var modal = document.getElementById('produtoModal');
        if (modal) {
          modal.style.display = 'flex';
        }
      })
      .catch(function(error) {
        console.error('Erro ao carregar detalhes do produto:', error);
        self.showError('Erro ao carregar detalhes do produto');
      });
  },
  
  fecharModalProduto: function() {
    var modal = document.getElementById('produtoModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },
  
  renderizarDetalhesProduto: function(produto) {
    var container = document.getElementById('produtoModalContent');
    if (!container) return;
    
    var html = '<div class="produto-detalhes-container">';
    
    // Seção de Imagens (Carrossel)
    html += '<div class="produto-secao">';
    html += '<h3><i class="fas fa-images"></i> Imagens do Produto</h3>';
    if (produto.imagens && produto.imagens.length > 0) {
      html += this.renderizarCarrossel(produto.imagens);
    } else {
      html += '<div class="empty-state"><i class="fas fa-images"></i><p>Nenhuma imagem disponível</p></div>';
    }
    html += '</div>';
    
    // Informações Básicas
    html += '<div class="produto-secao">';
    html += '<h3><i class="fas fa-info-circle"></i> Informações</h3>';
    html += '<table class="produto-info-table">';
    html += '<tr><td><strong>Código:</strong></td><td>' + produto.codprod + '</td></tr>';
    html += '<tr><td><strong>Descrição:</strong></td><td>' + produto.descricao + '</td></tr>';
    html += '<tr><td><strong>Unidade:</strong></td><td>' + produto.unidade + '</td></tr>';
    html += '<tr><td><strong>Múltiplos:</strong></td><td>' + produto.multiplos + '</td></tr>';
    html += '<tr><td><strong>Categoria:</strong></td><td>' + produto.categoria + '</td></tr>';
    
    // Mostrar categorias de acesso (Facility/Manipulação)
    var categoriasAcesso = [];
    if (produto.categoria_facility) categoriasAcesso.push('Facility');
    if (produto.categoria_manipulacao) categoriasAcesso.push('Manipulação');
    if (categoriasAcesso.length > 0) {
      html += '<tr><td><strong>Tipo de Produto:</strong></td><td><span style="color: #0066cc; font-weight: 500;">' + categoriasAcesso.join(' + ') + '</span></td></tr>';
    }
    
    if (produto.ncm) {
      html += '<tr><td><strong>NCM:</strong></td><td>' + produto.ncm + '</td></tr>';
    }
    if (produto.observacoes) {
      html += '<tr><td><strong>Observações:</strong></td><td>' + produto.observacoes + '</td></tr>';
    }
    html += '</table>';
    html += '</div>';
    
    // Seção de Vídeos
    if (produto.videos && produto.videos.length > 0) {
      html += '<div class="produto-secao">';
      html += '<h3><i class="fas fa-video"></i> Vídeos</h3>';
      html += this.renderizarVideos(produto.videos);
      html += '</div>';
    }
    
    // Ficha Técnica
    if (produto.especificacoes && produto.especificacoes.length > 0) {
      html += '<div class="produto-secao">';
      html += '<h3><i class="fas fa-list"></i> Ficha Técnica</h3>';
      html += this.renderizarFichaTecnica(produto.especificacoes);
      html += '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Inicializar carrossel
    if (produto.imagens && produto.imagens.length > 0) {
      this.inicializarCarrossel();
    }
  },
  
  renderizarCarrossel: function(imagens) {
    var html = '<div class="carrossel-container">';
    html += '<div class="carrossel-principal">';
    html += '<button class="carrossel-btn prev" onclick="app.mudarSlide(-1)"><i class="fas fa-chevron-left"></i></button>';
    html += '<div class="carrossel-imagem-principal">';
    html += '<img id="carrosselImagemPrincipal" src="' + imagens[0].url + '" alt="' + (imagens[0].legenda || 'Imagem do produto') + '">';
    if (imagens[0].legenda) {
      html += '<div class="carrossel-legenda">' + imagens[0].legenda + '</div>';
    }
    html += '</div>';
    html += '<button class="carrossel-btn next" onclick="app.mudarSlide(1)"><i class="fas fa-chevron-right"></i></button>';
    html += '</div>';
    
    // Miniaturas
    if (imagens.length > 1) {
      html += '<div class="carrossel-miniaturas">';
      for (var i = 0; i < imagens.length; i++) {
        var activeClass = i === 0 ? ' active' : '';
        html += '<img class="miniatura' + activeClass + '" src="' + imagens[i].url + '" ';
        html += 'data-index="' + i + '" ';
        html += 'data-legenda="' + (imagens[i].legenda || '') + '" ';
        html += 'onclick="app.selecionarSlide(' + i + ')" ';
        html += 'alt="Miniatura ' + (i + 1) + '">';
      }
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  },
  
  inicializarCarrossel: function() {
    this.slideAtual = 0;
  },
  
  mudarSlide: function(direcao) {
    var miniaturas = document.querySelectorAll('.carrossel-miniaturas .miniatura');
    if (!miniaturas.length) return;
    
    this.slideAtual = (this.slideAtual + direcao + miniaturas.length) % miniaturas.length;
    this.atualizarCarrossel();
  },
  
  selecionarSlide: function(index) {
    this.slideAtual = index;
    this.atualizarCarrossel();
  },
  
  atualizarCarrossel: function() {
    var miniaturas = document.querySelectorAll('.carrossel-miniaturas .miniatura');
    var imagemPrincipal = document.getElementById('carrosselImagemPrincipal');
    var legendaContainer = document.querySelector('.carrossel-legenda');
    
    if (!miniaturas.length || !imagemPrincipal) return;
    
    // Atualizar miniaturas
    for (var i = 0; i < miniaturas.length; i++) {
      miniaturas[i].classList.remove('active');
    }
    miniaturas[this.slideAtual].classList.add('active');
    
    // Atualizar imagem principal
    imagemPrincipal.src = miniaturas[this.slideAtual].src;
    
    // Atualizar legenda
    var legenda = miniaturas[this.slideAtual].dataset.legenda;
    if (legendaContainer) {
      legendaContainer.textContent = legenda || '';
      legendaContainer.style.display = legenda ? 'block' : 'none';
    }
  },
  
  renderizarVideos: function(videos) {
    var html = '<div class="produto-videos">';
    for (var i = 0; i < videos.length; i++) {
      var video = videos[i];
      var embedUrl = this.getVideoEmbedUrl(video.url, video.tipo);
      
      html += '<div class="video-card">';
      if (video.titulo) {
        html += '<h4>' + video.titulo + '</h4>';
      }
      if (embedUrl) {
        html += '<div class="video-embed">';
        html += '<iframe src="' + embedUrl + '" frameborder="0" allowfullscreen></iframe>';
        html += '</div>';
      } else {
        html += '<a href="' + video.url + '" target="_blank" class="btn btn-primary">';
        html += '<i class="fas fa-external-link-alt"></i> Assistir Vídeo';
        html += '</a>';
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  },
  
  getVideoEmbedUrl: function(url, tipo) {
    if (tipo === 'youtube') {
      // Extrair ID do YouTube
      var match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
      if (match && match[1]) {
        return 'https://www.youtube.com/embed/' + match[1];
      }
    } else if (tipo === 'vimeo') {
      // Extrair ID do Vimeo
      var match = url.match(/vimeo\.com\/(\d+)/);
      if (match && match[1]) {
        return 'https://player.vimeo.com/video/' + match[1];
      }
    }
    return null;
  },
  
  renderizarFichaTecnica: function(especificacoes) {
    var html = '<table class="ficha-tecnica-table">';
    html += '<thead><tr><th>Atributo</th><th>Valor</th></tr></thead>';
    html += '<tbody>';
    for (var i = 0; i < especificacoes.length; i++) {
      var espec = especificacoes[i];
      html += '<tr>';
      html += '<td><strong>' + espec.atributo + '</strong></td>';
      html += '<td>' + espec.valor + '</td>';
      html += '</tr>';
    }
    html += '</tbody>';
    html += '</table>';
    return html;
  },
  
  cancelarPedido: function(pedidoId) {
    var self = this;
    if (!confirm('Deseja realmente cancelar este pedido?')) {
      return;
    }
    
    this.api('/api/pedidos/' + pedidoId + '/cancelar', {
      method: 'POST'
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      self.showSuccess('Pedido cancelado com sucesso!');
      self.carregarPedidos();
      self.fecharModalPedido();
    })
    .catch(function(error) {
      console.error('Erro ao cancelar pedido:', error);
      self.showError('Erro ao cancelar pedido');
    });
  },
  
  sair: function() {
    var self = this;
    
    // Confirmar se o usuário realmente quer sair
    if (!confirm('Deseja realmente sair?\n\nSeu carrinho será salvo e estará disponível no próximo acesso.')) {
      return;
    }
    
    console.log('🚪 Encerrando sessão...');
    
    // Salvar carrinho antes de sair (já está salvo, mas garantir)
    localStorage.setItem('nexus_b2b_cart', JSON.stringify(this.carrinho));
    
    // Remover token de autenticação
    localStorage.removeItem('nexus_b2b_token');
    
    // Remover dados do usuário se houver
    localStorage.removeItem('nexus_b2b_user');
    
    // Mostrar mensagem de sucesso
    this.showSuccess('Sessão encerrada com sucesso!');
    
    // Redirecionar para login após 1 segundo
    setTimeout(function() {
      window.location.href = '/login.html';
    }, 1000);
  },
  
  showNotification: function(message, color) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: ' + color + 
      '; color: white; padding: 1rem 1.5rem; border-radius: 8px; z-index: 1000; max-width: 300px;';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 4000);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  app.init();
});