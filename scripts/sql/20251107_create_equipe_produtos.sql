-- Tabela de relacionamento entre equipes e produtos
-- Define quais produtos cada equipe pode visualizar e comprar

CREATE TABLE IF NOT EXISTS equipe_produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipe_id INT NOT NULL,
  produto_id INT NOT NULL,
  data_atribuicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atribuido_por INT NULL COMMENT 'ID do usuário admin/gestor que atribuiu',
  
  FOREIGN KEY (equipe_id) REFERENCES equipes(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  FOREIGN KEY (atribuido_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  
  -- Evitar duplicatas: uma equipe não pode ter o mesmo produto atribuído mais de uma vez
  UNIQUE KEY unique_equipe_produto (equipe_id, produto_id),
  
  INDEX idx_equipe (equipe_id),
  INDEX idx_produto (produto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentário da tabela
ALTER TABLE equipe_produtos COMMENT = 'Relacionamento N:N entre equipes e produtos - controle de catálogo por equipe';
