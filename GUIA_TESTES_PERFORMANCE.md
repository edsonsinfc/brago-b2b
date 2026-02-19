# 📊 Guia de Testes de Performance - Sistema B2B Brago

## 📋 Visão Geral

Este guia fornece instruções completas para realizar testes de velocidade e diagnóstico de performance do sistema B2B Brago, focando nas áreas de **login** e **carregamento de produtos** mencionadas nos relatos de lentidão.

---

## 🚀 Testes Disponíveis

### 1. **Teste de Performance HTTP** (`test_performance.js`)
Testa a velocidade dos endpoints principais da aplicação através de requisições HTTP reais.

**O que testa:**
- ⚡ Velocidade de login
- 📦 Carregamento de lista de produtos
- 🖼️ Carregamento de galeria (produtos filtrados por equipe)
- 🔄 Teste de concorrência

**Como executar:**
```bash
# No diretório raiz da aplicação
node test_performance.js

# Com variável de ambiente customizada (se necessário)
set BASE_URL=http://10.2.4.13:3000
node test_performance.js
```

**O que esperar:**
- Login deve responder em **< 500ms**
- Produtos deve responder em **< 1000ms**
- Galeria deve responder em **< 1500ms**

---

### 2. **Teste de Performance de Banco de Dados** (`test_db_performance.js`)
Analisa a performance das queries críticas e o estado da base de dados.

**O que testa:**
- 🔍 Velocidade de queries críticas
- 📑 Análise de índices das tabelas
- 💾 Tamanho do banco de dados
- 🔗 Performance do pool de conexões
- ✏️ Performance de operações de leitura

**Como executar:**
```bash
node test_db_performance.js
```

**O que procurar:**
- Queries que levam **> 500ms** são consideradas lentas
- Tabelas **sem índices** em colunas de busca frequente
- Pool de conexões com **< 100% de sucesso**

---

### 3. **Monitor de Performance em Tempo Real** (`test_monitor_realtime.js`)
Monitora continuamente as métricas do servidor enquanto está rodando.

**O que monitora:**
- 📊 Uso de CPU
- 💾 Uso de Memória
- 🗄️ Latência do banco de dados
- ⚡ Estatísticas de resposta

**Como executar:**
```bash
# Executar enquanto o servidor está operando normalmente
node test_monitor_realtime.js

# Pressionar Ctrl+C para parar
```

**Métricas desejáveis:**
- CPU: **< 70%** sob carga normal
- Memória: **< 80%** utilizado
- Latência BD: **< 200ms**

---

## 🔧 Configuração Antes dos Testes

### Pré-requisitos:
1. ✅ Servidor Node.js rodando: `npm start`
2. ✅ Banco de dados conectado e acessível
3. ✅ Usuário de teste cadastrado com email: `teste@brago.com.br`
4. ✅ Senha configurada para o usuário teste

### Variáveis de Ambiente:
```bash
# .env (se não existir)
BASE_URL=http://localhost:3000
PORT=3000
```

---

## 📈 Interpretando os Resultados

### Tempos de Resposta (HTTP)

| Endpoint | Excelente | Bom | Aceitável | Lento |
|----------|-----------|-----|-----------|-------|
| Login | < 200ms | 200-400ms | 400-600ms | > 600ms |
| Produtos | < 500ms | 500-800ms | 800-1200ms | > 1200ms |
| Galeria | < 700ms | 700-1000ms | 1000-1500ms | > 1500ms |
| Concorrência | > 50 req/s | 30-50 req/s | 10-30 req/s | < 10 req/s |

### Performance de Banco de Dados

| Métrica | Status | Ação |
|---------|--------|------|
| Query < 50ms | ✅ Excelente | Manter |
| Query 50-200ms | 🟡 Aceitável | Monitorar |
| Query 200-500ms | 🟠 Lento | Otimizar |
| Query > 500ms | 🔴 Crítico | Investigar imediatamente |

---

## 🔍 Diagnóstico de Problemas Comuns

### ❌ Lentidão no Login (> 500ms)

**Possíveis causas:**
1. **Query de usuário lenta**
   - Falta de índice em `usuarios.email`
   - Muitos registros na tabela `usuarios`

2. **Criptografia bcrypt demorada**
   - Aumentar salt rounds excessivamente
   - Usar hardware com melhor processamento

3. **Latência de rede/BD**
   - Conexão com banco de dados lenta
   - Firewall ou proxy causando atrasos

**Soluções sugeridas:**
```sql
-- Garantir índice em email (executar uma vez)
ALTER TABLE usuarios ADD INDEX idx_email (email);

-- Verificar quantidade de registros
SELECT COUNT(*) FROM usuarios;

-- Ver plano de execução (se lento)
EXPLAIN SELECT id, nome, email, senha FROM usuarios WHERE email = 'test@brago.com.br';
```

---

### ❌ Lentidão no Carregamento de Produtos (> 1000ms)

**Possíveis causas:**
1. **Muitos produtos retornados**
   - Sem limite de paginação
   - JOIN pesados sem índices

2. **Falta de índices nas colunas de filtro**
   - Equipe_id, categoria, etc.

3. **Dados não normalizados**
   - Muitas colunas buscadas desnecessariamente

**Soluções sugeridas:**
```sql
-- Adicionar índices necessários
ALTER TABLE produtos ADD INDEX idx_equipe (equipe_id);
ALTER TABLE equipes_produtos ADD INDEX idx_equipe (equipe_id);
ALTER TABLE equipes_produtos ADD INDEX idx_produto (produto_id);

-- Verificar quantidade de produtos por equipe
SELECT COUNT(*) FROM produtos;
SELECT COUNT(*) FROM equipes_produtos;

-- Testar query com EXPLAIN
EXPLAIN SELECT p.* FROM produtos p 
INNER JOIN equipes_produtos ep ON p.id = ep.produto_id 
WHERE ep.equipe_id = 1;
```

---

### ❌ Alto Uso de CPU/Memória

**Possíveis causas:**
1. **Pool de conexões configurado inadequadamente**
2. **Queries com loops ou recursão**
3. **Cache não implementado**
4. **Muitas conexões simultâneas**

**Soluções sugeridas:**
```javascript
// No arquivo src/config/db.mysql
// Aumentar pool se necessário
const pool = mysql.createPool({
  connectionLimit: 20,  // Aumentar se houver muitas requisições
  waitForConnections: true,
  queueLimit: 0
});
```

---

## 📊 Plano de Ação Recomendado

### Fase 1: Diagnóstico (Agora)
```bash
# 1. Rodar teste de DB
node test_db_performance.js

# 2. Identificar queries lentas e tabelas sem índices
# 3. Coletar baseline de performance
```

### Fase 2: Monitoramento (Durante operação)
```bash
# Manter rodando enquanto usuários usam o sistema
node test_monitor_realtime.js

# Anotar:
# - Picos de CPU/Memória
# - Erros de BD
# - Latência máxima
```

### Fase 3: Teste de Carga (Em ambiente de teste)
```bash
# Simular múltiplos usuários
node test_performance.js

# Aumentar número de iterações conforme necessário
```

### Fase 4: Otimização
Baseado nos resultados:
1. ✅ Adicionar índices faltantes
2. ✅ Implementar cache Redis (se necessário)
3. ✅ Otimizar queries com JOINs pesados
4. ✅ Implementar paginação (se não existir)
5. ✅ Considerar CDN para arquivos estáticos

---

## 🛠️ Scripts SQL Úteis para Análise

### Verificar Índices Faltantes
```sql
-- Tabelas com muitas linhas mas poucos índices
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    COUNT(*) as num_indexes
FROM INFORMATION_SCHEMA.TABLES
LEFT JOIN INFORMATION_SCHEMA.STATISTICS ON TABLES.TABLE_NAME = STATISTICS.TABLE_NAME
WHERE TABLE_SCHEMA = DATABASE()
GROUP BY TABLE_NAME
ORDER BY TABLE_ROWS DESC;
```

### Top 10 Colunas Mais Buscadas (análise manual)
```sql
-- Verificar colunas de WHERE frequentes
-- Login: WHERE email = ?
-- Produtos: WHERE equipe_id = ?
-- Pedidos: WHERE usuario_id = ?
```

### Listar Queries em Execução
```sql
-- Ver queries long-running (MySQL 5.7+)
SELECT * FROM information_schema.PROCESSLIST WHERE TIME > 5;
```

---

## 📞 Próximos Passos

### Se encontrar lentidão:

1. **Execute todos os 3 testes** em sequência
2. **Documente os resultados** com timestamps
3. **Identifique o padrão**:
   - É sempre lento?
   - Fica lento sob carga?
   - Lento em horários específicos?

4. **Compartilhe os logs** com a equipe técnica incluindo:
   - Output do `test_performance.js`
   - Output do `test_db_performance.js`
   - Screenshots do `test_monitor_realtime.js`

---

## 🔐 Notas de Segurança

⚠️ **Importante:**
- Estes testes usam credenciais reais. Mantenha em ambiente controlado.
- Não executar em produção com muitas iterações simultaneamente
- Os dados coletados contêm informações sensíveis do sistema
- Proteja logs gerados por estes testes

---

## 📚 Recursos Adicionais

- [Documentação MySQL Performance](https://dev.mysql.com/doc/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Express.js Performance Tips](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Última atualização:** Fevereiro 2026
**Versão:** 1.0
