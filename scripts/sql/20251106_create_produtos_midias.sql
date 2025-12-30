-- Migration: Criar tabelas de mídias e especificações para produtos
-- Data: 06/11/2025
-- Descrição: Suporte a múltiplas imagens, vídeos e ficha técnica por produto

-- ============================================
-- TABELA: produtos_imagens
-- ============================================
CREATE TABLE IF NOT EXISTS produtos_imagens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  produto_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  principal BOOLEAN DEFAULT false,
  legenda VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  INDEX idx_produto_ordem (produto_id, ordem),
  INDEX idx_principal (produto_id, principal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: produtos_videos
-- ============================================
CREATE TABLE IF NOT EXISTS produtos_videos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  produto_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  tipo ENUM('youtube', 'vimeo', 'url_direta') DEFAULT 'youtube',
  ordem INT NOT NULL DEFAULT 0,
  titulo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  INDEX idx_produto_ordem (produto_id, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABELA: produtos_especificacoes
-- ============================================
CREATE TABLE IF NOT EXISTS produtos_especificacoes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  produto_id INT NOT NULL,
  atributo VARCHAR(100) NOT NULL,
  valor TEXT NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  INDEX idx_produto_ordem (produto_id, ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DADOS DE EXEMPLO
-- ============================================

-- Produto LMP001 - Detergente Neutro 5L
INSERT INTO produtos_imagens (produto_id, url, ordem, principal, legenda) 
SELECT id, 'https://via.placeholder.com/800x800?text=Detergente+Frente', 1, true, 'Vista frontal'
FROM produtos WHERE codprod = 'LMP001' LIMIT 1;

INSERT INTO produtos_imagens (produto_id, url, ordem, principal, legenda)
SELECT id, 'https://via.placeholder.com/800x800?text=Detergente+Verso', 2, false, 'Vista traseira com informações'
FROM produtos WHERE codprod = 'LMP001' LIMIT 1;

INSERT INTO produtos_imagens (produto_id, url, ordem, principal, legenda)
SELECT id, 'https://via.placeholder.com/800x800?text=Detergente+Uso', 3, false, 'Produto em uso'
FROM produtos WHERE codprod = 'LMP001' LIMIT 1;

INSERT INTO produtos_videos (produto_id, url, tipo, ordem, titulo)
SELECT id, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 1, 'Como usar o produto corretamente'
FROM produtos WHERE codprod = 'LMP001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'Composição', 'Tensoativo aniônico, coadjuvantes, conservantes', 1
FROM produtos WHERE codprod = 'LMP001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'Volume', '5 litros', 2
FROM produtos WHERE codprod = 'LMP001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'Peso', '5.2 kg', 3
FROM produtos WHERE codprod = 'LMP001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'Dimensões', '25cm x 18cm x 30cm', 4
FROM produtos WHERE codprod = 'LMP001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'pH', '7.0 (neutro)', 5
FROM produtos WHERE codprod = 'LMP001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'Validade', '24 meses', 6
FROM produtos WHERE codprod = 'LMP001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'Registro Anvisa', '123456789', 7
FROM produtos WHERE codprod = 'LMP001' LIMIT 1;

-- Produto HIG001 - Papel Higiênico
INSERT INTO produtos_imagens (produto_id, url, ordem, principal, legenda)
SELECT id, 'https://via.placeholder.com/800x800?text=Papel+Higienico+Principal', 1, true, 'Fardo completo'
FROM produtos WHERE codprod = 'HIG001' LIMIT 1;

INSERT INTO produtos_imagens (produto_id, url, ordem, principal, legenda)
SELECT id, 'https://via.placeholder.com/800x800?text=Papel+Higienico+Detalhe', 2, false, 'Detalhe da textura'
FROM produtos WHERE codprod = 'HIG001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'Quantidade de rolos', '64 rolos', 1
FROM produtos WHERE codprod = 'HIG001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'Folhas por rolo', '30 metros', 2
FROM produtos WHERE codprod = 'HIG001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'Folhas', 'Duplas (2 camadas)', 3
FROM produtos WHERE codprod = 'HIG001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'Cor', 'Branco', 4
FROM produtos WHERE codprod = 'HIG001' LIMIT 1;

INSERT INTO produtos_especificacoes (produto_id, atributo, valor, ordem)
SELECT id, 'Material', '100% celulose virgem', 5
FROM produtos WHERE codprod = 'HIG001' LIMIT 1;

-- Mostrar resultados
SELECT 'Tabelas de mídias criadas com sucesso!' as status;
SELECT 
  (SELECT COUNT(*) FROM produtos_imagens) as total_imagens,
  (SELECT COUNT(*) FROM produtos_videos) as total_videos,
  (SELECT COUNT(*) FROM produtos_especificacoes) as total_especificacoes;
