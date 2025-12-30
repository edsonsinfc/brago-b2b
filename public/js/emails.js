// Gerenciamento de Emails de Notificação

(function() {
  const $ = s => document.querySelector(s);

  function getToken() { return localStorage.getItem('nexus_b2b_token'); }

  async function api(path, options = {}) {
    const token = getToken();
    if (!token) throw new Error('No token');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    
    const res = await fetch(path, { ...options, headers });
    
    // Verificar se foi invalidado pelo admin
    if (res.status === 401) {
      try {
        const errorData = await res.json();
        if (errorData.requiresRelogin) {
          alert(errorData.error || 'Suas informações foram atualizadas. Por favor, faça login novamente.');
        }
      } catch (e) {}
      
      localStorage.removeItem('nexus_b2b_token');
      window.location.href = '/login.html';
      return;
    }
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro na requisição');
    }
    return res.json();
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[char]));
  }

  function showMessage(text, type = 'success') {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;
    
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
      ${text}
    `;
    
    activeTab.insertBefore(message, activeTab.firstChild);
    setTimeout(() => message.remove(), 5000);
  }

  async function carregarEmails() {
    try {
      const data = await api('/api/emails-notificacao');
      const tbody = $('#tbodyEmails');
      if (!tbody) return;
      
      tbody.innerHTML = '';

      (data.emails || []).forEach(email => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
          <td>${email.id}</td>
          <td>
            <input type="text" class="form-input modern-input" data-id="${email.id}" 
                   data-field="nome" value="${escapeHtml(email.nome)}" style="margin: 0;">
          </td>
          <td>
            <input type="email" class="form-input modern-input" data-id="${email.id}" 
                   data-field="email" value="${escapeHtml(email.email)}" style="margin: 0;">
          </td>
          <td>
            <select class="form-input modern-input" data-id="${email.id}" data-field="tipo" style="margin: 0;">
              <option value="todos" ${email.tipo === 'todos' ? 'selected' : ''}>Todas as notificações</option>
              <option value="pedido_aprovado" ${email.tipo === 'pedido_aprovado' ? 'selected' : ''}>Apenas aprovações</option>
              <option value="pedido_rejeitado" ${email.tipo === 'pedido_rejeitado' ? 'selected' : ''}>Apenas rejeições</option>
            </select>
          </td>
          <td style="text-align: center;">
            <span class="status-badge ${email.ativo ? 'ativo' : 'inativo'}">
              <i class="fas fa-circle" style="font-size: 0.5rem;"></i>
              ${email.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon save" onclick="salvarEmail(${email.id})" title="Salvar alterações">
                <i class="fas fa-save"></i>
              </button>
              <button class="btn-icon delete" onclick="excluirEmail(${email.id})" title="Excluir email">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        `;
        
        tbody.appendChild(tr);
      });
    } catch (error) {
      console.error('Erro ao carregar emails:', error);
      showMessage('Erro ao carregar emails: ' + error.message, 'error');
    }
  }

  window.salvarEmail = async function(id) {
    try {
      const dados = {
        nome: document.querySelector(`input[data-id="${id}"][data-field="nome"]`).value,
        email: document.querySelector(`input[data-id="${id}"][data-field="email"]`).value,
        tipo: document.querySelector(`select[data-id="${id}"][data-field="tipo"]`).value
      };

      await api(`/api/emails-notificacao/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      showMessage('Email atualizado com sucesso!');
      carregarEmails();
    } catch (error) {
      showMessage('Erro ao salvar email: ' + error.message, 'error');
    }
  };

  window.excluirEmail = async function(id) {
    if (!confirm('Tem certeza que deseja excluir este email?')) return;

    try {
      await api(`/api/emails-notificacao/${id}`, { method: 'DELETE' });
      showMessage('Email excluído com sucesso!');
      carregarEmails();
    } catch (error) {
      showMessage('Erro ao excluir email: ' + error.message, 'error');
    }
  };

  // Inicialização
  document.addEventListener('DOMContentLoaded', () => {
    // Form de novo email
    const formNovoEmail = $('#formNovoEmail');
    if (formNovoEmail) {
      formNovoEmail.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
          const dados = {
            nome: $('#novoEmailNome').value,
            email: $('#novoEmailEmail').value,
            tipo: $('#novoEmailTipo').value,
            ativo: true
          };

          await api('/api/emails-notificacao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });

          showMessage('Email adicionado com sucesso!');
          formNovoEmail.reset();
          carregarEmails();
        } catch (error) {
          showMessage('Erro ao adicionar email: ' + error.message, 'error');
        }
      });
    }

    // Carregar emails ao abrir aba
    const tabBtnEmails = document.querySelector('[data-tab="emails"]');
    if (tabBtnEmails) {
      tabBtnEmails.addEventListener('click', carregarEmails);
    }
  });
})();
