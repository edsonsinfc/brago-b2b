-- Migration: Adicionar perfil GESTOR
-- Data: 07/11/2025
-- Descrição: 
--   - Renomeia perfil 'gestor' atual para 'admin'
--   - Adiciona novo perfil 'gestor' (comercial) com permissões limitadas
--   - Perfil GESTOR: acessa pedidos, equipes, usuários MAS NÃO produtos

-- Passo 1: Alterar ENUM para incluir 'admin' e 'gestor'
ALTER TABLE usuarios 
MODIFY COLUMN perfil ENUM('admin', 'gestor', 'equipe') NOT NULL;

-- Passo 2: Atualizar usuários existentes com perfil 'gestor' para 'admin'
-- (Como o ENUM mudou, os valores antigos 'gestor' não existem mais, 
--  então precisamos garantir que administradores tenham perfil 'admin')
UPDATE usuarios 
SET perfil = 'admin' 
WHERE email LIKE '%admin%' OR id = 1;

-- Resultado esperado:
-- - Perfil 'admin': Acesso total (pedidos, equipes, usuários, produtos)
-- - Perfil 'gestor': Acesso comercial (pedidos, equipes, usuários - SEM produtos)
-- - Perfil 'equipe': Acesso limitado (apenas criar pedidos e ver seus próprios pedidos)
