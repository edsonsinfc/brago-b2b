# 🚀 Nexus B2B - Sistema de Gestão Comercial

Sistema completo de gestão B2B com controle de equipes, produtos, pedidos e orçamentos.

## 📋 Funcionalidades Principais

### 👥 Gestão de Equipes
- **16 equipes cadastradas** com gestores e solicitantes
- **Controle de orçamento individualizado** por equipe
- **Validação automática** de estrutura organizacional
- **Relatórios detalhados** de performance por equipe

### 🛍️ Gestão de Produtos
- **Galeria de produtos** com upload de imagens
- **Controle de acesso por equipe** (produtos específicos)
- **Administração centralizada** com visão completa
- **Interface responsiva** para mobile e desktop

### 💰 Controle Financeiro
- **Dashboard em tempo real** com métricas precisas
- **Limite de crédito por equipe** com controle automático
- **Histórico de compras** dos últimos 30 dias
- **Ticket médio** e análise de performance

### 📱 Interface Responsiva
- **Design mobile-first** para vendedores
- **Dashboard adaptativo** para gestores
- **Navegação otimizada** em dispositivos móveis

## 🛠️ Tecnologias

- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Frontend**: Vanilla JavaScript + Bootstrap
- **Upload**: Multer para gerenciamento de arquivos
- **Icons**: Font Awesome
- **Process Manager**: PM2

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/edsonsinfc/brago-b2b.git

# Instale as dependências
npm install

# Configure o banco de dados no arquivo de configuração
# Importe o schema do banco (nexus_b2b)

# Inicie o servidor
npm start
# ou com PM2
pm2 start ecosystem.config.js
```

## 🗄️ Estrutura do Banco

### Tabelas Principais
- `usuarios` - Usuários do sistema
- `equipes` - Equipes/lojas com limites de crédito
- `produtos` - Catálogo de produtos com fotos
- `pedidos` - Pedidos com controle de status
- `usuarios_equipes` - Relacionamento usuários/equipes
- `produtos_equipes_especificas` - Produtos específicos por equipe

## 🚀 Funcionalidades Recentes

### ✨ Melhorias Implementadas
- [x] **Dashboard Corrigido**: Cálculos precisos contando apenas pedidos aprovados
- [x] **Upload de Fotos**: Sistema completo de upload para produtos
- [x] **Acesso por Equipe**: Produtos específicos para equipes determinadas
- [x] **Mobile Responsive**: Interface otimizada para dispositivos móveis
- [x] **Sincronização de Orçamentos**: Correção automática de limites de crédito
- [x] **Validação de Dados**: Scripts de diagnóstico e correção
- [x] **UI/UX Melhorado**: Ícones Font Awesome substituindo emojis

### 📊 Scripts Utilitários
- `scripts/verificar_dashboard_corrigido.js` - Validação de métricas
- `scripts/sincronizar_limites.js` - Sincronização de orçamentos
- `scripts/validar_equipes_usuarios.js` - Validação de estrutura
- `scripts/verificar_inconsistencias_saldo.js` - Diagnóstico financeiro

## 🔧 Configuração

### Variáveis de Ambiente
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=nexus_b2b
PORT=3000
```

### Estrutura de Pastas
```
src/
├── routes/          # Rotas da API
├── services/        # Serviços de negócio
└── middleware/      # Middlewares customizados

public/
├── js/             # JavaScript frontend
├── css/            # Estilos CSS
├── uploads/        # Arquivos enviados
└── *.html          # Páginas da aplicação

scripts/            # Scripts de manutenção
```

## 📈 Performance e Métricas

### Dashboard Corrigido
- **Compras (30d)**: Apenas pedidos aprovados
- **Ticket Médio**: Cálculo baseado em vendas efetivadas
- **Limite Utilizado**: Sincronizado com pedidos aprovados

### Otimizações
- Query otimizada para dashboard
- Cache de dados de equipes
- Compressão de imagens
- Lazy loading para produtos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.

---

*Sistema desenvolvido para gestão completa de operações B2B com foco em performance e usabilidade.*