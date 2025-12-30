// Página de Orçamento - Sistema B2B Brago Distribuidora
(function() {
  const tokenKey = 'nexus_b2b_token';
  
  // Utilitários
  const $ = s => document.querySelector(s);
  
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
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    try {
      const response = await fetch(path, { ...options, headers });
      
      if (response.status === 401) {
        localStorage.removeItem(tokenKey);
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

  // Estado
  let state = {
    carrinho: [],
    userNome: '',
    userPerfil: ''
  };

  // Carregar carrinho
  function carregarCarrinho() {
    const carrinhoSalvo = localStorage.getItem('carrinho_orcamento');
    if (carrinhoSalvo) {
      try {
        state.carrinho = JSON.parse(carrinhoSalvo);
      } catch (e) {
        state.carrinho = [];
      }
    }
    renderCarrinho();
  }

  // Renderizar carrinho
  function renderCarrinho() {
    const itemList = $('#itemList');
    const emptyState = $('#emptyState');
    const footerActions = $('#footerActions');
    const totalItems = $('#totalItems');

    if (state.carrinho.length === 0) {
      itemList.innerHTML = '';
      emptyState.style.display = 'block';
      footerActions.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    footerActions.style.display = 'flex';
    totalItems.textContent = state.carrinho.length;

    itemList.innerHTML = state.carrinho.map((item, index) => `
      <div class="item">
        <div class="item-info">
          <div class="item-code">${item.codprod}</div>
          <div class="item-name">${item.descricao}</div>
          <div class="item-controls">
            <div class="quantity-control">
              <button onclick="alterarQuantidade(${index}, -1)" title="Diminuir">
                <i class="fas fa-minus"></i>
              </button>
              <input type="number" 
                     value="${item.quantidade}" 
                     min="1" 
                     onchange="setQuantidade(${index}, this.value)"
                     readonly>
              <button onclick="alterarQuantidade(${index}, 1)" title="Aumentar">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <input type="text" 
                   class="obs-input" 
                   placeholder="Observações (opcional)" 
                   value="${item.observacao || ''}"
                   onchange="setObservacao(${index}, this.value)">
          </div>
        </div>
        <div class="item-actions">
          <button class="btn btn-danger" onclick="removerItem(${index})" title="Remover">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Alterar quantidade
  window.alterarQuantidade = function(index, delta) {
    if (state.carrinho[index]) {
      state.carrinho[index].quantidade = Math.max(1, state.carrinho[index].quantidade + delta);
      salvarCarrinho();
      renderCarrinho();
    }
  };

  // Set quantidade
  window.setQuantidade = function(index, value) {
    const quantidade = parseInt(value) || 1;
    if (state.carrinho[index]) {
      state.carrinho[index].quantidade = Math.max(1, quantidade);
      salvarCarrinho();
      renderCarrinho();
    }
  };

  // Set observação
  window.setObservacao = function(index, value) {
    if (state.carrinho[index]) {
      state.carrinho[index].observacao = value;
      salvarCarrinho();
    }
  };

  // Remover item
  window.removerItem = function(index) {
    if (confirm('Remover este item do orçamento?')) {
      state.carrinho.splice(index, 1);
      salvarCarrinho();
      renderCarrinho();
    }
  };

  // Limpar carrinho
  window.limparCarrinho = function() {
    if (confirm('Limpar todo o orçamento?')) {
      state.carrinho = [];
      salvarCarrinho();
      renderCarrinho();
    }
  };

  // Salvar carrinho
  function salvarCarrinho() {
    localStorage.setItem('carrinho_orcamento', JSON.stringify(state.carrinho));
  }

  // Enviar orçamento
  window.enviarOrcamento = async function() {
    if (state.carrinho.length === 0) {
      alert('Adicione produtos ao orçamento primeiro!');
      return;
    }

    // Validar quantidades
    const quantidadesValidas = state.carrinho.every(item => item.quantidade > 0);
    if (!quantidadesValidas) {
      alert('Por favor, verifique as quantidades dos produtos.');
      return;
    }

    if (!confirm(`Enviar orçamento com ${state.carrinho.length} item(ns) para o vendedor?`)) {
      return;
    }

    try {
      // Mostrar loading
      const btnEnviar = event.target;
      const originalText = btnEnviar.innerHTML;
      btnEnviar.disabled = true;
      btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

      // Enviar para API
      await api('/api/orcamentos', {
        method: 'POST',
        body: JSON.stringify({
          itens: state.carrinho
        })
      });

      // Sucesso!
      alert('✅ Orçamento enviado com sucesso! Seu vendedor entrará em contato em breve.');
      
      // Limpar carrinho
      state.carrinho = [];
      salvarCarrinho();
      renderCarrinho();
      
      // Redirecionar
      setTimeout(() => {
        window.location.href = '/galeria.html';
      }, 1500);

    } catch (error) {
      alert('❌ Erro ao enviar orçamento: ' + error.message);
      const btnEnviar = event.target;
      btnEnviar.disabled = false;
      btnEnviar.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar para Vendedor';
    }
  };

  // Inicialização
  document.addEventListener('DOMContentLoaded', () => {
    const token = ensureAuth();
    if (!token) return;
    
    const payload = parseJwt(token);
    if (payload) {
      state.userNome = payload.nome;
      state.userPerfil = payload.perfil;
      
      let perfilTexto = '';
      if (payload.perfil === 'admin') perfilTexto = 'Administrador';
      else if (payload.perfil === 'gestor') perfilTexto = 'Gestor';
      else if (payload.perfil === 'equipe') perfilTexto = 'Equipe';
      
      $('#userGreeting').textContent = `${payload.nome} - ${perfilTexto}`;
    }
    
    carregarCarrinho();
  });
  
})();
