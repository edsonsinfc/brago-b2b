/**
 * Dashboard Vendedor - B2B Brago Distribuidora
 * Design Profissional com Navegação por Abas
 */

const API_BASE = window.location.origin;
let currentPage = 1;
const pageSize = 20;
let vendasChart, statusChart;
let currentView = 'dashboard';

// Formatar moeda
function formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

// Formatar data
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
}

// Formatar número
function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
}

// Obter token
function getToken() {
    return localStorage.getItem('nexus_b2b_token');
}

// Verificar autenticação
function checkAuth() {
    const token = getToken();
    console.log('🔍 Verificando autenticação...');
    
    if (!token) {
        console.log('❌ Token não encontrado');
        window.location.href = '/login.html';
        return false;
    }
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('✅ Token válido. Usuário:', payload.nome);
        
        if (payload.perfil !== 'vendedor') {
            alert('Acesso negado. Esta área é exclusiva para vendedores.');
            logout();
            return false;
        }
        
        // Atualizar informações do usuário
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        
        if (userNameEl) userNameEl.textContent = payload.nome;
        if (userAvatarEl) userAvatarEl.textContent = payload.nome.charAt(0).toUpperCase();
        
        return true;
    } catch (e) {
        console.error('❌ Erro ao decodificar token:', e);
        logout();
        return false;
    }
}

// Logout
function logout() {
    localStorage.removeItem('nexus_b2b_token');
    window.location.href = '/login.html';
}

// Toggle pedido card (mobile)
async function togglePedidoCard(card, pedidoId) {
    const isExpanded = card.classList.contains('expanded');
    
    // Fechar todos os outros cards
    document.querySelectorAll('.pedido-card.expanded').forEach(c => {
        if (c !== card) {
            c.classList.remove('expanded');
        }
    });
    
    // Se estava expandido, apenas fecha
    if (isExpanded) {
        card.classList.remove('expanded');
        return;
    }
    
    // Expandir e carregar detalhes
    card.classList.add('expanded');
    
    // Verificar se já carregou os detalhes
    const detailsContainer = card.querySelector('.pedido-card-details');
    if (detailsContainer.dataset.loaded === 'true') {
        return;
    }
    
    // Mostrar loading
    const loadingDiv = detailsContainer.querySelector('.loading-detalhes');
    if (loadingDiv) loadingDiv.style.display = 'block';
    
    try {
        // Buscar detalhes do pedido
        const data = await fetchAPI(`/api/vendedor/pedido/${pedidoId}`);
        if (!data) {
            detailsContainer.innerHTML = '<p style="color: var(--danger); padding: 16px; text-align: center;">Erro ao carregar detalhes</p>';
            return;
        }
        
        // Renderizar detalhes completos
        const itensHTML = data.itens.map(item => `
            <div class="item-row">
                <div class="item-info">
                    <div class="item-nome">${item.descricao}</div>
                    <div class="item-quantidade">${item.quantidade}x ${formatMoney(item.valor_unitario)}</div>
                </div>
                <div class="item-total">${formatMoney(item.valor_unitario * item.quantidade)}</div>
            </div>
        `).join('');
        
        detailsContainer.innerHTML = `
            <div class="detail-row">
                <span class="detail-label"><i class="fas fa-calendar"></i> Data:</span>
                <span class="detail-value">${formatDate(data.pedido.data)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label"><i class="fas fa-barcode"></i> ERP:</span>
                <span class="detail-value">${data.pedido.codigo_erp || 'Não sincronizado'}</span>
            </div>
            ${data.pedido.observacoes ? `
            <div class="detail-row">
                <span class="detail-label"><i class="fas fa-comment"></i> Obs:</span>
                <span class="detail-value">${data.pedido.observacoes}</span>
            </div>
            ` : ''}
            
            <div class="detail-section">
                <h4 class="section-title"><i class="fas fa-box"></i> Itens do Pedido (${data.itens.length})</h4>
                <div class="itens-lista">
                    ${itensHTML}
                </div>
            </div>
            
            <div class="detail-row total-row">
                <span class="detail-label"><strong>TOTAL:</strong></span>
                <span class="detail-value total-value">${formatMoney(data.pedido.valor_total)}</span>
            </div>
        `;
        
        detailsContainer.dataset.loaded = 'true';
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        detailsContainer.innerHTML = '<p style="color: var(--danger); padding: 16px; text-align: center;">Erro ao carregar detalhes</p>';
    }
}

// Fazer requisição autenticada
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            alert('Sessão expirada. Faça login novamente.');
            logout();
            return null;
        }
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro na API:', error);
        return null;
    }
}

// Carregar KPIs
async function carregarKPIs() {
    const data = await fetchAPI('/api/vendedor/dashboard');
    if (!data) return;
    
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card primary" onclick="switchView('pedidos')" style="cursor: pointer;">
            <div class="stat-header">
                <div>
                    <div class="stat-label">Total de Pedidos</div>
                    <div class="stat-value">${formatNumber(data.totalPedidos)}</div>
                </div>
                <div class="stat-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
            </div>
            <div class="stat-change">
                <span>📦 Toda a rede OBA</span>
            </div>
        </div>

        <div class="stat-card success" style="cursor: default;">
            <div class="stat-header">
                <div>
                    <div class="stat-label">Valor Total Vendido</div>
                    <div class="stat-value">${formatMoney(data.valorTotalVendido)}</div>
                </div>
                <div class="stat-icon">
                    <i class="fas fa-dollar-sign"></i>
                </div>
            </div>
            <div class="stat-change">
                <span>💰 Histórico completo</span>
            </div>
        </div>

        <div class="stat-card warning" onclick="switchView('pedidos'); setTimeout(() => { document.getElementById('filterStatus').value = 'PENDENTE_APROVACAO'; carregarTodosPedidos(1); }, 100);" style="cursor: pointer;">
            <div class="stat-header">
                <div>
                    <div class="stat-label">Pedidos Pendentes</div>
                    <div class="stat-value">${formatNumber(data.pedidosPendentes)}</div>
                </div>
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
            </div>
            <div class="stat-change">
                <span>⏳ Aguardando aprovação</span>
            </div>
        </div>

        <div class="stat-card secondary" onclick="switchView('lojas')" style="cursor: pointer;">
            <div class="stat-header">
                <div>
                    <div class="stat-label">Total de Lojas</div>
                    <div class="stat-value">${formatNumber(data.totalEquipes)}</div>
                </div>
                <div class="stat-icon">
                    <i class="fas fa-store"></i>
                </div>
            </div>
            <div class="stat-change">
                <span>🏪 Rede ativa</span>
            </div>
        </div>

        <div class="stat-card primary" style="cursor: default;">
            <div class="stat-header">
                <div>
                    <div class="stat-label">Ticket Médio</div>
                    <div class="stat-value">${formatMoney(data.valorMedioPedido)}</div>
                </div>
                <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
            </div>
            <div class="stat-change">
                <span>📊 Por pedido</span>
            </div>
        </div>

        <div class="stat-card success" style="cursor: default;">
            <div class="stat-header">
                <div>
                    <div class="stat-label">Vendas do Mês</div>
                    <div class="stat-value">${formatMoney(data.vendasMesAtual)}</div>
                </div>
                <div class="stat-icon">
                    <i class="fas fa-calendar-alt"></i>
                </div>
            </div>
            <div class="stat-change">
                <span>📈 ${formatNumber(data.pedidosMesAtual)} pedidos</span>
            </div>
        </div>
    `;
}

// Carregar gráfico de vendas
async function carregarGraficoVendas() {
    const meses = document.getElementById('vendasPeriodo')?.value || 12;
    const data = await fetchAPI(`/api/vendedor/vendas-por-mes?meses=${meses}`);
    if (!data || !data.vendas) return;
    
    const ctx = document.getElementById('vendasChart');
    if (!ctx) return;
    
    if (vendasChart) vendasChart.destroy();
    
    vendasChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.vendas.map(v => v.mes_formatado),
            datasets: [{
                label: 'Valor Total',
                data: data.vendas.map(v => v.valor_total),
                borderColor: '#c62828',
                backgroundColor: 'rgba(198, 40, 40, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatMoney(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + (value / 1000).toFixed(0) + 'k';
                        }
                    }
                }
            }
        }
    });
}

// Carregar gráfico de status
async function carregarGraficoStatus() {
    const data = await fetchAPI('/api/vendedor/status-distribution');
    if (!data || !data.distribuicao) return;
    
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    if (statusChart) statusChart.destroy();
    
    const statusColors = {
        'PENDENTE_APROVACAO': '#f57c00',
        'APROVADO': '#2e7d32',
        'CANCELADO': '#c62828'
    };
    
    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.distribuicao.map(d => d.status.replace('_', ' ')),
            datasets: [{
                data: data.distribuicao.map(d => d.quantidade),
                backgroundColor: data.distribuicao.map(d => statusColors[d.status] || '#999'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = ((value / total) * 100).toFixed(1);
                            return `${value} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Carregar pedidos recentes
async function carregarPedidosRecentes() {
    const data = await fetchAPI('/api/vendedor/pedidos?page=1&pageSize=5');
    if (!data || !data.pedidos) return;
    
    const container = document.getElementById('recentOrdersTable');
    
    if (data.pedidos.length === 0) {
        container.innerHTML = '<p style="padding: 40px; text-align: center; color: var(--gray-500);">Nenhum pedido encontrado</p>';
        return;
    }
    
    const statusClasses = {
        'PENDENTE_APROVACAO': 'status-pendente',
        'APROVADO': 'status-aprovado',
        'CANCELADO': 'status-cancelado'
    };
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Pedido</th>
                    <th>Loja</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${data.pedidos.map(pedido => `
                    <tr>
                        <td><strong>#${pedido.id}</strong></td>
                        <td>${pedido.equipe_nome}</td>
                        <td>${formatDate(pedido.data)}</td>
                        <td><strong>${formatMoney(pedido.valor_total)}</strong></td>
                        <td><span class="status-badge ${statusClasses[pedido.status]}">${pedido.status.replace('_', ' ')}</span></td>
                        <td>
                            <button class="action-btn btn-view" onclick="verDetalhesPedido(${pedido.id})">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Carregar todos os pedidos
async function carregarTodosPedidos(page = 1) {
    currentPage = page;
    
    const status = document.getElementById('filterStatus')?.value || '';
    const search = document.getElementById('searchPedidos')?.value || '';
    
    let url = `/api/vendedor/pedidos?page=${page}&pageSize=${pageSize}`;
    if (status) url += `&status=${status}`;
    
    const data = await fetchAPI(url);
    if (!data) return;
    
    const container = document.getElementById('pedidosTableContainer');
    
    if (data.pedidos.length === 0) {
        container.innerHTML = '<div class="loading-spinner"><p>Nenhum pedido encontrado</p></div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    const statusClasses = {
        'PENDENTE_APROVACAO': 'status-pendente',
        'APROVADO': 'status-aprovado',
        'CANCELADO': 'status-cancelado'
    };
    
    let filteredPedidos = data.pedidos;
    if (search) {
        filteredPedidos = data.pedidos.filter(p => 
            p.id.toString().includes(search) ||
            p.equipe_nome.toLowerCase().includes(search.toLowerCase()) ||
            p.codigo_erp?.includes(search)
        );
    }
    
    container.innerHTML = `
        <!-- Tabela Desktop -->
        <table class="data-table desktop-only">
            <thead>
                <tr>
                    <th>Pedido</th>
                    <th>Loja</th>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>ERP</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                ${filteredPedidos.map(pedido => `
                    <tr>
                        <td><strong>#${pedido.id}</strong></td>
                        <td>${pedido.equipe_nome}</td>
                        <td>${formatDate(pedido.data)}</td>
                        <td><strong>${formatMoney(pedido.valor_total)}</strong></td>
                        <td><span class="status-badge ${statusClasses[pedido.status]}">${pedido.status.replace('_', ' ')}</span></td>
                        <td>${pedido.codigo_erp || '-'}</td>
                        <td>
                            <button class="action-btn btn-view" onclick="verDetalhesPedido(${pedido.id})">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- Cards Mobile -->
        <div class="pedidos-cards mobile-only">
            ${filteredPedidos.map(pedido => `
                <div class="pedido-card" onclick="togglePedidoCard(this, ${pedido.id})">
                    <div class="pedido-card-header">
                        <div class="pedido-card-title">
                            <strong>#${pedido.id}</strong>
                            <span class="status-badge ${statusClasses[pedido.status]}">${pedido.status.replace('_', ' ')}</span>
                        </div>
                        <div class="pedido-card-subtitle">
                            <i class="fas fa-store"></i> ${pedido.equipe_nome}
                        </div>
                        <div class="pedido-card-value">
                            ${formatMoney(pedido.valor_total)}
                        </div>
                        <i class="fas fa-chevron-down pedido-card-arrow"></i>
                    </div>
                    <div class="pedido-card-details">
                        <div class="loading-detalhes" style="display: block; text-align: center; padding: 16px;">
                            <i class="fas fa-spinner fa-spin"></i> Carregando detalhes...
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    renderizarPaginacao(data.pagination);
}

// Renderizar paginação
function renderizarPaginacao(pagination) {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;
    
    const { page, totalPages } = pagination;
    
    let buttons = [];
    
    buttons.push(`<button class="btn btn-secondary" ${page === 1 ? 'disabled' : ''} onclick="carregarTodosPedidos(${page - 1})"><i class="fas fa-chevron-left"></i></button>`);
    
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
        const active = i === page ? 'btn-primary' : 'btn-secondary';
        buttons.push(`<button class="btn ${active}" onclick="carregarTodosPedidos(${i})">${i}</button>`);
    }
    
    buttons.push(`<button class="btn btn-secondary" ${page === totalPages ? 'disabled' : ''} onclick="carregarTodosPedidos(${page + 1})"><i class="fas fa-chevron-right"></i></button>`);
    
    paginationDiv.innerHTML = buttons.join('');
}

// Ver detalhes do pedido
async function verDetalhesPedido(id) {
    const data = await fetchAPI(`/api/vendedor/pedido/${id}`);
    if (!data) return;
    
    const statusClasses = {
        'PENDENTE_APROVACAO': 'status-pendente',
        'APROVADO': 'status-aprovado',
        'CANCELADO': 'status-cancelado'
    };
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;';
    modal.onclick = () => modal.remove();
    
    modal.innerHTML = `
        <div style="background: white; padding: 32px; border-radius: 12px; max-width: 900px; max-height: 90vh; overflow-y: auto; width: 100%;" onclick="event.stopPropagation()">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px;">
                <div>
                    <h2 style="color: var(--gray-900); margin-bottom: 8px;">Pedido #${data.pedido.id}</h2>
                    <span class="status-badge ${statusClasses[data.pedido.status]}">${data.pedido.status.replace('_', ' ')}</span>
                </div>
                <button onclick="this.closest('div').parentElement.remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--gray-500);">&times;</button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; padding: 20px; background: var(--gray-50); border-radius: 8px;">
                <div>
                    <div style="font-size: 12px; color: var(--gray-600); margin-bottom: 4px;">Loja</div>
                    <div style="font-weight: 600;">${data.pedido.equipe_nome}</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: var(--gray-600); margin-bottom: 4px;">Data</div>
                    <div style="font-weight: 600;">${formatDate(data.pedido.data)}</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: var(--gray-600); margin-bottom: 4px;">Código ERP</div>
                    <div style="font-weight: 600;">${data.pedido.codigo_erp || 'Não sincronizado'}</div>
                </div>
                <div>
                    <div style="font-size: 12px; color: var(--gray-600); margin-bottom: 4px;">Valor Total</div>
                    <div style="font-weight: 700; color: var(--primary); font-size: 20px;">${formatMoney(data.pedido.valor_total)}</div>
                </div>
            </div>
            
            <h3 style="margin-bottom: 16px; color: var(--gray-900);">Itens do Pedido</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Produto</th>
                        <th>Qtd</th>
                        <th>Vlr Unit</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.itens.map(item => `
                        <tr>
                            <td><strong>${item.codprod}</strong></td>
                            <td>${item.descricao}</td>
                            <td>${item.quantidade}</td>
                            <td>${formatMoney(item.valor_unitario)}</td>
                            <td><strong>${formatMoney(item.valor_unitario * item.quantidade)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div style="margin-top: 24px; text-align: right;">
                <button onclick="this.closest('div').parentElement.remove()" class="btn btn-secondary">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Carregar produtos mais vendidos
async function carregarProdutosMaisVendidos() {
    const limit = document.getElementById('produtosLimit')?.value || 10;
    const data = await fetchAPI(`/api/vendedor/produtos-mais-vendidos?limit=${limit}`);
    if (!data || !data.produtos) return;
    
    const container = document.getElementById('produtosTableContainer');
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Posição</th>
                    <th>Código</th>
                    <th>Produto</th>
                    <th>Quantidade Vendida</th>
                    <th>Nº Pedidos</th>
                    <th>Valor Total</th>
                </tr>
            </thead>
            <tbody>
                ${data.produtos.map((produto, index) => `
                    <tr>
                        <td><strong>${index + 1}º</strong></td>
                        <td>${produto.codprod}</td>
                        <td>${produto.descricao}</td>
                        <td><strong>${formatNumber(produto.quantidade_total)}</strong></td>
                        <td>${produto.num_pedidos}</td>
                        <td><strong>${formatMoney(produto.valor_total)}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Carregar ranking de lojas
async function carregarRankingLojas() {
    const limit = document.getElementById('lojasLimit')?.value || 10;
    const url = limit === 'all' ? '/api/vendedor/ranking-lojas?limit=100' : `/api/vendedor/ranking-lojas?limit=${limit}`;
    const data = await fetchAPI(url);
    if (!data || !data.lojas) return;
    
    const container = document.getElementById('lojasTableContainer');
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Posição</th>
                    <th>Loja</th>
                    <th>Código ERP</th>
                    <th>Total Pedidos</th>
                    <th>Valor Total</th>
                    <th>Ticket Médio</th>
                    <th>Pendentes</th>
                </tr>
            </thead>
            <tbody>
                ${data.lojas.map((loja, index) => `
                    <tr>
                        <td><strong>${index + 1}º</strong></td>
                        <td><strong>${loja.nome}</strong></td>
                        <td>${loja.codigo_erp}</td>
                        <td>${loja.total_pedidos}</td>
                        <td><strong>${formatMoney(loja.valor_total)}</strong></td>
                        <td>${formatMoney(loja.ticket_medio)}</td>
                        <td>${loja.pedidos_pendentes}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Exportar pedidos
function exportarPedidos() {
    alert('Funcionalidade de exportação será implementada em breve!');
}

// Navegação entre views
function switchView(view) {
    currentView = view;
    
    // Atualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'pedidos': 'Pedidos',
        'produtos': 'Produtos Mais Vendidos',
        'lojas': 'Ranking de Lojas',
        'relatorios': 'Relatórios'
    };
    document.getElementById('viewTitle').textContent = titles[view] || 'Dashboard';
    
    // Ocultar todas as views
    document.querySelectorAll('.view-content').forEach(el => el.style.display = 'none');
    
    // Mostrar view selecionada
    const selectedView = document.getElementById(`view-${view}`);
    if (selectedView) selectedView.style.display = 'block';
    
    // Atualizar nav-items ativos
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === view) {
            item.classList.add('active');
        }
    });
    
    // Carregar dados específicos da view
    if (view === 'pedidos') {
        carregarTodosPedidos(1);
    } else if (view === 'produtos') {
        carregarProdutosMaisVendidos();
    } else if (view === 'lojas') {
        carregarRankingLojas();
    }
}

// Inicializar dashboard
async function inicializar() {
    if (!checkAuth()) return;
    
    // Setup navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            if (view) switchView(view);
        });
    });
    
    // Setup filtros
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
        filterStatus.addEventListener('change', () => carregarTodosPedidos(1));
    }
    
    const searchPedidos = document.getElementById('searchPedidos');
    if (searchPedidos) {
        searchPedidos.addEventListener('input', () => carregarTodosPedidos(currentPage));
    }
    
    const vendasPeriodo = document.getElementById('vendasPeriodo');
    if (vendasPeriodo) {
        vendasPeriodo.addEventListener('change', carregarGraficoVendas);
    }
    
    const produtosLimit = document.getElementById('produtosLimit');
    if (produtosLimit) {
        produtosLimit.addEventListener('change', carregarProdutosMaisVendidos);
    }
    
    const lojasLimit = document.getElementById('lojasLimit');
    if (lojasLimit) {
        lojasLimit.addEventListener('change', carregarRankingLojas);
    }
    
    // Carregar dashboard inicial
    await Promise.all([
        carregarKPIs(),
        carregarGraficoVendas(),
        carregarGraficoStatus(),
        carregarPedidosRecentes()
    ]);
}

// Iniciar quando carregar
document.addEventListener('DOMContentLoaded', inicializar);
