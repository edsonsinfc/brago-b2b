-- Adicionar coluna cont_obri na tabela produtos
ALTER TABLE produtos 
ADD COLUMN cont_obri CHAR(1) DEFAULT 'N' COMMENT 'Contrato obrigatório: S=Sim, N=Não';

-- Atualizar produtos existentes (padrão N)
UPDATE produtos SET cont_obri = 'N' WHERE cont_obri IS NULL;
