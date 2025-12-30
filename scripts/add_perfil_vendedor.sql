-- Adicionar perfil 'vendedor' na tabela usuarios
-- Este perfil tem acesso a todos os pedidos da rede para análise e acompanhamento

ALTER TABLE usuarios 
MODIFY COLUMN perfil ENUM('admin', 'gestor', 'equipe', 'vendedor') NOT NULL;

-- Atualizar comentário da tabela
ALTER TABLE usuarios COMMENT = 'Tabela de usuários do sistema - Perfis: admin, gestor, equipe, vendedor';

SELECT 'Perfil VENDEDOR adicionado com sucesso!' as resultado;
