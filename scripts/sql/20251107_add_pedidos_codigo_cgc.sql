-- Adicionar campos codigo_erp e cgc na tabela pedidos
-- Esses campos virão da equipe e facilitarão a integração com o ERP

ALTER TABLE pedidos ADD COLUMN codigo_erp VARCHAR(50) NULL COMMENT 'Código do cliente no ERP';

ALTER TABLE pedidos ADD COLUMN cgc VARCHAR(20) NULL COMMENT 'CGC/CNPJ do cliente';

CREATE INDEX idx_pedidos_codigo_erp ON pedidos(codigo_erp);

CREATE INDEX idx_pedidos_cgc ON pedidos(cgc);
