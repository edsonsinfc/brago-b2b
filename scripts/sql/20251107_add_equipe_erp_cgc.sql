-- Migration: Adicionar campos Codigo_ERP e CGC na tabela equipes
-- Data: 07/11/2025

ALTER TABLE equipes ADD COLUMN codigo_erp VARCHAR(50) DEFAULT NULL AFTER nome;
ALTER TABLE equipes ADD COLUMN cgc VARCHAR(20) DEFAULT NULL AFTER codigo_erp;
CREATE INDEX idx_codigo_erp ON equipes(codigo_erp);
CREATE INDEX idx_cgc ON equipes(cgc);
