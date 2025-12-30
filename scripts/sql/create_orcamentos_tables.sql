-- Criar tabela de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  equipe_id INT,
  vendedor_id INT,
  status ENUM('pendente', 'em_analise', 'enviado', 'aprovado', 'rejeitado') DEFAULT 'pendente',
  data_solicitacao DATETIME NOT NULL,
  data_resposta DATETIME,
  observacao_vendedor TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE SET NULL,
  FOREIGN KEY (vendedor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_usuario (usuario_id),
  INDEX idx_equipe (equipe_id),
  INDEX idx_vendedor (vendedor_id),
  INDEX idx_status (status),
  INDEX idx_data (data_solicitacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orcamento_id INT NOT NULL,
  produto_id INT NOT NULL,
  codprod VARCHAR(20),
  descricao VARCHAR(255),
  quantidade INT NOT NULL DEFAULT 1,
  observacao TEXT,
  preco_cotado DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  INDEX idx_orcamento (orcamento_id),
  INDEX idx_produto (produto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
