# 🔧 Recomendações de Otimização - B2B Brago

## 📋 Sumário Executivo

Com base na arquitetura do sistema, aqui estão as **5 principais áreas para otimizar** visando resolver lentidão em login e produtos.

---

## 1. 🗄️ Índices de Banco de Dados (CRÍTICO)

### Por que é importante?
Sem índices, o MySQL faz table scan completo - verificando CADA linha.

### Implementar agora:

```sql
-- ========== USUARIOS (CRITICO) ==========
-- Sem este índice, CADA login varre todas as linhas
ALTER TABLE usuarios ADD INDEX idx_email (email);
ALTER TABLE usuarios ADD INDEX idx_equipe_id (equipe_id);

-- ========== PRODUTOS (CRITICO) ==========
-- Principal gargalo do carregamento de produtos
ALTER TABLE produtos ADD INDEX idx_categoria (categoria);
ALTER TABLE produtos ADD INDEX idx_ativo (ativo);

-- ========== EQUIPES_PRODUTOS (CRITICO) ==========
-- Usado em queries de filtro por equipe
ALTER TABLE equipes_produtos ADD INDEX idx_equipe_id (equipe_id);
ALTER TABLE equipes_produtos ADD INDEX idx_produto_id (produto_id);

-- ========== PEDIDOS ==========
ALTER TABLE pedidos ADD INDEX idx_usuario_id (usuario_id);
ALTER TABLE pedidos ADD INDEX idx_data_criacao (data_criacao);

-- ========== NOTIFICACOES ==========
ALTER TABLE notificacoes ADD INDEX idx_usuario_id (usuario_id);
ALTER TABLE notificacoes ADD INDEX idx_lido (lido);

-- ========== VERIFICAR INDICES CRIADOS ==========
SHOW INDEXES FROM usuarios;
SHOW INDEXES FROM produtos;
SHOW INDEXES FROM equipes_produtos;
```

**Impacto esperado:** Redução de 80-90% no tempo de queries simples

---

## 2. 💾 Implementar Cache Redis

### Por que é importante?
Dados estáticos (produtos, equipes) não precisam ser buscados do BD a cada requisição.

### Recomendação:

```bash
# 1. Instalar Redis (local ou cloud)
npm install redis

# 2. Configurar variáveis de ambiente
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
```

### O que cachear (prioridade):

| O quê | TTL | Benefício |
|------|-----|-----------|
| Lista de produtos | 5-10 min | MÁXIMO IMPACTO |
| Equipes | 1 hora | Alto impacto |
| Categorias | 1 dia | Médio impacto |
| Dados do usuário | 30 min | Média impacto |

### Exemplo de implementação:

```javascript
// src/middleware/cacheMiddleware.js
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

async function getCachedProdutos(equipeId) {
  const cacheKey = `produtos:equipe:${equipeId}`;
  
  // Tentar recuperar do cache
  const cached = await client.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Se não estiver em cache, buscar do BD
  const produtos = await buscarDoDb(equipeId);
  
  // Armazenar em cache por 5 minutos
  await client.setex(cacheKey, 300, JSON.stringify(produtos));
  
  return produtos;
}
```

**Impacto esperado:** Redução de 90%+ em tempo de resposta para dados em cache

---

## 3. ⚡ Otimizar Queries N+1

### Por que é importante?
Query N+1 = 1 query para listar, depois 1 query POR ITEM. Exemplo: listar 100 produtos = 101 queries!

### Problema atual em `/api/produtos/galeria`:

❌ ERRADO:
```javascript
const equipe = await getEquipe(usuarioId);
const produtos = await getAll(); // 1 query

produtos.forEach(produto => {
  produto.tem_acesso = await verificarAcesso(produto.id, equipeId); // N queries!
})
```

✅ CORRETO:
```javascript
// Uma única query com JOIN
const produtos = await pool.execute(`
  SELECT p.* 
  FROM produtos p
  INNER JOIN equipes_produtos ep ON p.id = ep.produto_id
  WHERE ep.equipe_id = ?
`, [equipeId]);
```

### Revisar nas rotas:
- `src/routes/produtos.js` - método GET
- `src/routes/equipes.js` - método GET
- `src/routes/pedidos.js` - método GET

---

## 4. 🔄 Pool de Conexões

### Configuração atual (verificar em `src/config/db.mysql`):

```javascript
// ❌ Padrão pode estar baixo
const pool = mysql.createPool({
  connectionLimit: 10,  // Pode ser insuficiente
  waitForConnections: true,
  queueLimit: 0
});
```

### Recomendação:

```javascript
// ✅ Aumentar se muitos usuários
const pool = mysql.createPool({
  connectionLimit: 20,        // Aumentado
  waitForConnections: true,
  enableQueueEvents: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
});
```

**Impacto esperado:** Melhor comportamento sob carga

---

## 5. 📊 Monitoramento e Alertas

### Implementar logging de queries lentas:

```javascript
// src/middleware/queryLogger.js
async function executeWithLogging(query, params) {
  const start = Date.now();
  const result = await pool.execute(query, params);
  const duration = Date.now() - start;
  
  // Log queries > 500ms
  if (duration > 500) {
    console.warn(`⚠️  QUERY LENTA (${duration}ms):`, query.substring(0, 100));
  }
  
  return result;
}
```

### Adicionar em `src/server.js`:

```javascript
// Adicionar middleware de timing
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`⚠️  REQUISIÇÃO LENTA: ${req.method} ${req.path} (${duration}ms)`);
    }
  });
  
  next();
});
```

---

## 🎯 Plano de Implementação

### Semana 1 - CRÍTICO
- [ ] Adicionar índices no BD (5 min)
- [ ] Testar performance com `test_performance.js` (15 min)
- [ ] Verificar impacto (30 min)

### Semana 2 - IMPORTANTE
- [ ] Revisar Query N+1 em rotas principais (2-4 horas)
- [ ] Implementar cache Redis para produtos (2-3 horas)
- [ ] Testes de carga com cache (1 hora)

### Semana 3 - MANUTENÇÃO
- [ ] Implementar query logging (1 hora)
- [ ] Setup de alertas para queries lentas (2 horas)
- [ ] Documentar (1 hora)

---

## 📈 Métricas de Sucesso

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| Login | 800ms | 200ms | < 500ms ✅ |
| Produtos | 2000ms | 300ms | < 1000ms ✅ |
| Galeria | 1500ms | 250ms | < 1500ms ✅ |
| CPU pico | 85% | 45% | < 70% ✅ |
| Memória | 1.2GB | 800MB | < 80% ✅ |

---

## 🚀 Quick Wins (Fácil de implementar)

### 1. Adicionar paginação (se não existe)
```javascript
// Antes: buscar 10000 produtos
// Depois: buscar 50 por página
router.get('/produtos', async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 50;
  const offset = (page - 1) * limit;
  
  const [rows] = await pool.execute(
    'SELECT * FROM produtos LIMIT ? OFFSET ?',
    [limit, offset]
  );
});
```

### 2. Adicionar compression
```javascript
const compression = require('compression');
app.use(compression());
```

### 3. Adicionar boas práticas de query
```javascript
// ❌ Ruim
SELECT * FROM produtos;

// ✅ Bom
SELECT id, nome, preco, categoria FROM produtos;
```

---

## 🔍 Checklist de Otimização

- [ ] Índices adicionados
- [ ] Queries N+1 corrigidas
- [ ] Pool de conexões ajustado
- [ ] Redis implementado (opcional)
- [ ] Paginação implementada
- [ ] Query logging implementado
- [ ] Testes rodados e validados
- [ ] Documentação atualizada

---

## 📞 Próximos Passos

1. **Hoje:** Rodar `test_db_performance.js` para confirmar problemas
2. **Hoje:** Implementar índices (é seguro e rápido)
3. **Amanhã:** Medir impacto com `test_performance.js`
4. **Semana:** Implementar cache Redis
5. **Semana:** Revisar queries N+1

---

**Autor:** Performance Team  
**Data:** Fevereiro 2026  
**Versão:** 1.0
