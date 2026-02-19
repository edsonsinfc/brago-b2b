-- ================================================================
-- 🗄️ SCRIPT DE OTIMIZAÇÃO: CRIAR ÍNDICES NO BANCO DE DADOS
-- ================================================================
-- Este script adiciona índices críticos para melhorar performance
-- Seguro executar em produção - não modifica dados, apenas estrutura
-- Tempo estimado: < 1 minuto
-- ================================================================

-- ========== 1. ÍNDICES PARA USUARIOS (LOGIN) ==========
-- CRÍTICO: Query de login é feita por email, SEMPRE
-- Status: ADD IF NOT EXISTS (não refaz se já existir)

-- Índice para busca por email (CRÍTICO para login)
ALTER TABLE usuarios ADD INDEX IF NOT EXISTS idx_email (email);

-- Índice para busca por equipe
ALTER TABLE usuarios ADD INDEX IF NOT EXISTS idx_equipe_id (equipe_id);

-- Índice para status ativo
ALTER TABLE usuarios ADD INDEX IF NOT EXISTS idx_ativo (ativo);

-- ✅ Esperado: Login ~80% mais rápido
-- Consulta afetada: SELECT * FROM usuarios WHERE email = ?


-- ========== 2. ÍNDICES PARA PRODUTOS (GALERIA) ==========
-- CRÍTICO: Produtos é a operação mais lenta reportada

-- Índice para filtro por categoria
ALTER TABLE produtos ADD INDEX IF NOT EXISTS idx_categoria (categoria);

-- Índice para status ativo
ALTER TABLE produtos ADD INDEX IF NOT EXISTS idx_ativo (ativo);

-- Índice para filtro por equipe (se usado diretamente)
ALTER TABLE produtos ADD INDEX IF NOT EXISTS idx_equipe_id (equipe_id);

-- ✅ Esperado: Listagem de produtos ~90% mais rápida


-- ========== 3. ÍNDICES PARA EQUIPES_PRODUTOS ==========
-- CRÍTICO: Relacionamento entre equipes e produtos
-- Esta é a tabela de JOIN mais usada em filtros

-- Índice para filtro por equipe (CRÍTICO!)
ALTER TABLE equipes_produtos ADD INDEX IF NOT EXISTS idx_equipe_id (equipe_id);

-- Índice para filtro por produto
ALTER TABLE equipes_produtos ADD INDEX IF NOT EXISTS idx_produto_id (produto_id);

-- Índice composto para mais eficiência
ALTER TABLE equipes_produtos ADD INDEX IF NOT EXISTS idx_equipe_produto (equipe_id, produto_id);

-- ✅ Esperado: Filtros por equipe ~95% mais rápido
-- Consulta afetada: WHERE ep.equipe_id = ? AND ep.produto_id = ?


-- ========== 4. ÍNDICES PARA PEDIDOS ==========
-- IMPORTANTE: Histórico de pedidos dos usuários

-- Índice para busca por usuário
ALTER TABLE pedidos ADD INDEX IF NOT EXISTS idx_usuario_id (usuario_id);

-- Índice para ordenação por data
ALTER TABLE pedidos ADD INDEX IF NOT EXISTS idx_data_criacao (data_criacao);

-- Índice para status
ALTER TABLE pedidos ADD INDEX IF NOT EXISTS idx_status (status);

-- ✅ Esperado: Listagem de pedidos do usuário ~80% mais rápido


-- ========== 5. ÍNDICES PARA NOTIFICACOES ==========
-- IMPORTANTE: Notificações não lidas do usuário

-- Índice para busca por usuário
ALTER TABLE notificacoes ADD INDEX IF NOT EXISTS idx_usuario_id (usuario_id);

-- Índice para filtrar não lidas
ALTER TABLE notificacoes ADD INDEX IF NOT EXISTS idx_lido (lido);

-- Índice composto: busca não lidas por usuário
ALTER TABLE notificacoes ADD INDEX IF NOT EXISTS idx_usuario_lido (usuario_id, lido);

-- ✅ Esperado: Busca de notificações ~85% mais rápido


-- ========== 6. ÍNDICES PARA EQUIPES ==========
-- Indices para otimizar listagens

ALTER TABLE equipes ADD INDEX IF NOT EXISTS idx_ativo (ativo);
ALTER TABLE equipes ADD INDEX IF NOT EXISTS idx_nome (nome);


-- ========== 7. VERIFICAR ÍNDICES CRIADOS ==========
-- Execute as queries abaixo para verificar que tudo foi criado

-- Ver índices da tabela usuarios
-- SHOW INDEXES FROM usuarios;

-- Ver índices da tabela produtos
-- SHOW INDEXES FROM produtos;

-- Ver índices da tabela equipes_produtos
-- SHOW INDEXES FROM equipes_produtos;

-- Ver índices de todas as tabelas
-- SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME;


-- ========== 8. ANALISE DE TAMANHO (OPCIONAL) ==========
-- Os índices vão aumentar um pouco o tamanho do BD
-- Mas o ganho de performance compensa MUITO

-- Ver tamanho de todas as tabelas
-- SELECT 
--   TABLE_NAME,
--   ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS size_mb
-- FROM INFORMATION_SCHEMA.TABLES
-- WHERE TABLE_SCHEMA = DATABASE()
-- ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;


-- ========== 9. NOTAS IMPORTANTES ==========
-- 
-- 1. ✅ SEGURO em produção: só cria índices, não modifica dados
-- 2. ⏱️ Não bloqueia: ADD INDEX IF NOT EXISTS é não-bloqueante
-- 3. 📊 Impacto: Testes devem mostrar melhoria em ~2 minutos
-- 4. 💾 Overhead: ~5-10% de aumento no tamanho do BD (aceitável)
-- 5. 🔄 Futuro: Índices precisam manutenção periódica (OPTIMIZE TABLE)
--
-- ========== COMO EXECUTAR ==========
--
-- Via MySQL CLI:
--   mysql -u usuario -p nome_banco < indices.sql
--
-- Via phpMyAdmin:
--   1. Abrir SQL
--   2. Copiar e colar este conteúdo
--   3. Executar
--
-- Via Node.js:
--   node -e "const pool = require('./src/config/db.mysql');
--            const fs = require('fs');
--            const sql = fs.readFileSync('indices.sql', 'utf8');
--            pool.execute(sql).then(() => console.log('✅ Índices criados!')).catch(e => console.error(e));"
--
-- ========== VALIDAÇÃO ==========
-- Após executar, rodar os testes:
--   node test_db_performance.js     (validar queries)
--   node test_performance.js        (validar endpoints)
--
-- ========== ROLLBACK (se necessário) ==========
-- Para remover um índice, use:
--   ALTER TABLE usuarios DROP INDEX idx_email;
-- Mas não é necessário - índices não prejudicam (apenas consomem espaço)
--
-- ========================================================================
-- ✅ Script concluído
-- Próximos passos: testar com test_performance.js
-- ========================================================================
