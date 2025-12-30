-- Adicionar campo vendedor_email na tabela equipes
ALTER TABLE equipes 
ADD COLUMN vendedor_email VARCHAR(255) NULL AFTER limite_total;

-- Comentário: Este campo armazena o email do vendedor responsável pela equipe
-- Quando um pedido é criado, uma notificação é enviada automaticamente para este email
