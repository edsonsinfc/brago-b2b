-- Script de Verificação do Banco de Dados
-- Execute no phpMyAdmin após importar os schemas

-- ========================================
-- 1. VERIFICAR TABELAS CRIADAS
-- ========================================
SHOW TABLES;
-- Deve mostrar: usuarios, equipes, pedidos, itens_pedido, produtos, notificacoes

-- ========================================
-- 2. VERIFICAR USUÁRIOS
-- ========================================
SELECT id, nome, email, perfil, ativo 
FROM usuarios 
ORDER BY perfil;

-- Deve ter pelo menos:
-- - 1 admin
-- - 1 gestor
-- - 1 vendedor
-- - 1+ equipe

-- ========================================
-- 3. VERIFICAR EQUIPES
-- ========================================
SELECT id, nome, codigo_erp, cgc, ativa 
FROM equipes 
ORDER BY nome;

-- Deve ter as 6 lojas OBA

-- ========================================
-- 4. VERIFICAR PRODUTOS
-- ========================================
SELECT COUNT(*) as total_produtos FROM produtos;
SELECT * FROM produtos LIMIT 5;

-- Deve ter vários produtos cadastrados

-- ========================================
-- 5. VERIFICAR ESTRUTURA DA TABELA USUARIOS
-- ========================================
DESCRIBE usuarios;

-- Verificar se coluna 'perfil' tem ENUM com:
-- 'admin', 'gestor', 'equipe', 'vendedor'

-- ========================================
-- 6. VERIFICAR RELACIONAMENTOS
-- ========================================

-- Pedidos com equipes
SELECT 
    p.id,
    p.status,
    e.nome as equipe_nome,
    p.valor_total
FROM pedidos p
LEFT JOIN equipes e ON p.equipe_id = e.id
LIMIT 5;

-- Itens de pedido
SELECT 
    ip.id,
    ip.pedido_id,
    ip.codprod,
    ip.descricao,
    ip.quantidade,
    ip.valor_unitario
FROM itens_pedido ip
LIMIT 5;

-- ========================================
-- 7. TESTAR USUÁRIO ADMIN
-- ========================================
SELECT * FROM usuarios WHERE email = 'admin@bragodistribuidora.com.br';

-- Se NÃO existir, criar:
-- INSERT INTO usuarios (nome, email, senha, perfil, ativo) 
-- VALUES ('Administrador', 'admin@bragodistribuidora.com.br', 
--         '$2b$10$hashed_password', 'admin', 1);
-- (Use o script seed_admin.js via SSH ao invés deste INSERT)

-- ========================================
-- 8. VERIFICAR ÍNDICES E CONSTRAINTS
-- ========================================
SHOW INDEX FROM usuarios;
SHOW INDEX FROM pedidos;
SHOW INDEX FROM itens_pedido;

-- ========================================
-- 9. VERIFICAR ENCODING
-- ========================================
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';

-- Deve estar UTF-8 / utf8mb4

-- ========================================
-- 10. ESTATÍSTICAS RÁPIDAS
-- ========================================
SELECT 
    'usuarios' as tabela, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'equipes', COUNT(*) FROM equipes
UNION ALL
SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL
SELECT 'itens_pedido', COUNT(*) FROM itens_pedido
UNION ALL
SELECT 'produtos', COUNT(*) FROM produtos
UNION ALL
SELECT 'notificacoes', COUNT(*) FROM notificacoes;

-- ========================================
-- RESULTADO ESPERADO (após seed)
-- ========================================
-- usuarios: 4+ (admin, gestor, vendedor, equipes)
-- equipes: 6 (lojas OBA)
-- pedidos: 0+ (depende se tem dados)
-- itens_pedido: 0+
-- produtos: 10+ (produtos de exemplo)
-- notificacoes: 0+

-- ========================================
-- ✅ SE TUDO ACIMA FUNCIONOU, BANCO OK!
-- ========================================
