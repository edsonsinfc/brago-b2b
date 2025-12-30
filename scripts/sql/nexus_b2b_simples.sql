-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 12/11/2025 às 21:11
-- Versão do servidor: 9.1.0
-- Versão do PHP: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `nexus_b2b`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `email_config`
--

DROP TABLE IF EXISTS `email_config`;
CREATE TABLE IF NOT EXISTS `email_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `smtp_host` varchar(100) NOT NULL,
  `smtp_port` int NOT NULL DEFAULT '587',
  `smtp_user` varchar(120) NOT NULL,
  `smtp_pass` varchar(191) NOT NULL,
  `from_email` varchar(120) NOT NULL,
  `from_name` varchar(100) DEFAULT 'Nexus B2B',
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `equipes`
--

DROP TABLE IF EXISTS `equipes`;
CREATE TABLE IF NOT EXISTS `equipes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `codigo_erp` varchar(50) DEFAULT NULL,
  `cgc` varchar(20) DEFAULT NULL,
  `gestor_id` int NOT NULL,
  `vendedor_email` varchar(120) DEFAULT NULL,
  `limite_total` decimal(15,2) NOT NULL DEFAULT '0.00',
  `saldo_atual` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('ATIVA','INATIVA') DEFAULT 'ATIVA',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `limite_credito` decimal(10,2) DEFAULT '10000.00' COMMENT 'Limite total de crédito da equipe',
  `limite_disponivel` decimal(10,2) DEFAULT '10000.00' COMMENT 'Limite disponível para pedidos',
  PRIMARY KEY (`id`),
  
  
  KEY `idx_cgc` (`cgc`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `equipes`
--

INSERT INTO `equipes` (`id`, `nome`, `codigo_erp`, `cgc`, `gestor_id`, `vendedor_email`, `limite_total`, `saldo_atual`, `status`, `created_at`, `updated_at`, `limite_credito`, `limite_disponivel`) VALUES
(1, 'Oba Asa norte', NULL, NULL, 1, 'edson.silva@bragodistribuidora.com.br', 10000.00, 10000.00, 'ATIVA', '2025-10-30 00:21:39', '2025-11-07 20:32:55', 10000.00, 10000.00),
(2, 'Oba Aguas Claras', NULL, NULL, 1, 'edson.silva@bragodistribuidora.com.br', 40000.00, 4355.21, 'ATIVA', '2025-10-30 00:25:30', '2025-11-10 11:10:20', 40500.89, 0.00),
(3, 'Oba Hortifruti - Áreas Comuns (final)', '4544', NULL, 5, 'edson.silva@bragodistribuidora.com.br', 10000.00, 10000.00, 'ATIVA', '2025-11-07 20:22:00', '2025-11-07 22:42:54', 10000.00, 10000.00),
(4, 'Oba Hortifruti - Área de Manipulação (final)', '46245', NULL, 5, 'edson.silva@bragodistribuidora.com.br', 58000.00, 58000.00, 'ATIVA', '2025-11-07 20:23:43', '2025-11-10 21:23:32', 58000.00, 6374.68),
(5, 'Oba Hortifruti - Pápeis (final)', NULL, NULL, 5, 'edson.silva@bragodistribuidora.com.br', 10000.00, 10000.00, 'ATIVA', '2025-11-07 20:24:22', '2025-11-07 22:43:00', 10000.00, 10000.00),
(6, 'Brago teste', '123', '57650492000188', 5, NULL, 3000.00, 3000.00, 'ATIVA', '2025-11-10 00:40:58', '2025-11-10 00:40:58', 3000.00, 3000.00),
(7, 'Oba Hortifruti - Áreas Comuns (Areal)', '14567', NULL, 5, NULL, 1000.00, 1000.00, 'ATIVA', '2025-11-10 20:44:06', '2025-11-10 20:44:06', 1000.00, 1000.00),
(8, 'Oba Hortifruti - Áreas Comuns (Areal)', NULL, NULL, 5, NULL, 1000.00, 1000.00, 'ATIVA', '2025-11-10 20:44:30', '2025-11-10 20:44:30', 1000.00, 1000.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `equipe_produtos`
--

DROP TABLE IF EXISTS `equipe_produtos`;
CREATE TABLE IF NOT EXISTS `equipe_produtos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipe_id` int NOT NULL,
  `produto_id` int NOT NULL,
  `data_atribuicao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `atribuido_por` int DEFAULT NULL COMMENT 'ID do usuário admin/gestor que atribuiu',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_equipe_produto` (`equipe_id`,`produto_id`),
  KEY `atribuido_por` (`atribuido_por`),
  
  KEY `idx_produto` (`produto_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `equipe_produtos`
--

INSERT INTO `equipe_produtos` (`id`, `equipe_id`, `produto_id`, `data_atribuicao`, `atribuido_por`) VALUES
(1, 4, 1, '2025-11-08 01:38:45', 1),
(2, 4, 2, '2025-11-08 01:38:45', 1),
(3, 4, 3, '2025-11-08 01:38:45', 1),
(4, 4, 4, '2025-11-08 01:38:45', 1),
(5, 4, 5, '2025-11-08 01:38:45', 1),
(6, 4, 6, '2025-11-08 01:38:45', 1),
(7, 4, 7, '2025-11-08 01:38:45', 1),
(8, 4, 8, '2025-11-08 01:38:45', 1),
(9, 4, 9, '2025-11-08 01:38:45', 1),
(10, 4, 10, '2025-11-08 01:38:45', 1),
(21, 4, 17, '2025-11-08 02:26:46', NULL),
(22, 4, 18, '2025-11-08 02:26:46', NULL),
(23, 4, 19, '2025-11-08 02:26:46', NULL),
(24, 4, 20, '2025-11-08 02:26:46', NULL),
(25, 4, 21, '2025-11-08 02:26:46', NULL),
(26, 4, 22, '2025-11-08 02:26:46', NULL),
(27, 4, 23, '2025-11-08 02:26:46', NULL),
(28, 4, 24, '2025-11-08 02:26:46', NULL),
(29, 2, 17, '2025-11-10 00:47:21', NULL),
(30, 2, 18, '2025-11-10 00:47:21', NULL),
(31, 2, 19, '2025-11-10 00:47:21', NULL),
(32, 2, 20, '2025-11-10 00:47:21', NULL),
(33, 2, 21, '2025-11-10 00:47:21', NULL),
(34, 2, 22, '2025-11-10 00:47:21', NULL),
(35, 2, 23, '2025-11-10 00:47:21', NULL),
(36, 2, 24, '2025-11-10 00:47:21', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `itens_pedido`
--

DROP TABLE IF EXISTS `itens_pedido`;
CREATE TABLE IF NOT EXISTS `itens_pedido` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pedido_id` int NOT NULL,
  `codprod` varchar(30) NOT NULL,
  `descricao` varchar(191) NOT NULL,
  `quantidade` decimal(15,3) NOT NULL,
  `valor_unitario` decimal(15,2) NOT NULL,
  `valor_total` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pedido` (`pedido_id`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `itens_pedido`
--

INSERT INTO `itens_pedido` (`id`, `pedido_id`, `codprod`, `descricao`, `quantidade`, `valor_unitario`, `valor_total`) VALUES
(1, 1, 'LMP004', 'Álcool Gel 70% 1L', 12.000, 0.00, 0.00),
(2, 2, 'LMP004', 'Álcool Gel 70% 1L', 12.000, 0.00, 0.00),
(3, 2, 'DESC001', 'Copo Descartável 200ml cx/100', 25.000, 0.00, 0.00),
(4, 3, 'LMP004', 'Álcool Gel 70% 1L', 12.000, 0.00, 0.00),
(5, 3, 'DESC001', 'Copo Descartável 200ml cx/100', 25.000, 0.00, 0.00),
(6, 4, 'LMP004', 'Álcool Gel 70% 1L', 12.000, 9.80, 117.60),
(7, 4, 'DESC001', 'Copo Descartável 200ml cx/100', 25.000, 8.75, 218.75),
(8, 5, 'LMP004', 'Álcool Gel 70% 1L', 12.000, 9.80, 117.60),
(9, 5, 'DESC001', 'Copo Descartável 200ml cx/100', 25.000, 8.75, 218.75),
(10, 6, 'LMP004', 'Álcool Gel 70% 1L', 12.000, 9.80, 117.60),
(11, 6, 'DESC001', 'Copo Descartável 200ml cx/100', 25.000, 8.75, 218.75),
(12, 7, 'DESC001', 'Copo Descartável 200ml cx/100', 25.000, 8.75, 218.75),
(13, 7, 'LMP004', 'Álcool Gel 70% 1L', 24.000, 9.80, 235.20),
(14, 7, '12808', 'DESINF BLANCO FACIL FLORAL  2L', 1.000, 50.00, 50.00),
(15, 7, 'LMP002', 'Desinfetante Pinho Sol 2L', 12.000, 8.50, 102.00),
(16, 10, 'TESTE001', 'Produto Teste de Alto Valor', 100.000, 150.00, 15000.00),
(17, 11, 'TESTE001', 'Produto Teste de Alto Valor', 100.000, 150.00, 15000.00),
(18, 12, 'TESTE002', 'Produto Teste - Alto Valor', 50.000, 100.00, 5000.00),
(19, 13, 'TESTE003', 'Produto Teste', 20.000, 100.00, 2000.00),
(20, 14, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(21, 14, '17797', 'DESINF MULTIUSO BLISS PRAX 300ML', 1.000, 43.74, 43.74),
(22, 15, '12946', 'DETERGENTE NEUTRO BEST 5L', 1.000, 106.98, 106.98),
(23, 15, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(24, 16, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(25, 16, '17797', 'DESINF MULTIUSO BLISS PRAX 300ML', 1.000, 43.74, 43.74),
(26, 16, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 1.000, 31.05, 31.05),
(27, 16, '17603', 'PANO M.USO SLIM RL C/28CMX240M AZUL', 2.000, 128.94, 257.88),
(28, 16, '17016', 'PAPEL TOALHA BOB OPT 24G FS 6X200M 2430', 1.000, 120.25, 120.25),
(29, 17, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(30, 17, '17535', 'DESINFETANTE CIF S/PERFUME 5L 3902', 1.000, 171.40, 171.40),
(31, 17, '17016', 'PAPEL TOALHA BOB OPT 24G FS 6X200M 2430', 1.000, 120.25, 120.25),
(32, 18, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(33, 19, '17016', 'PAPEL TOALHA BOB OPT 24G FS 6X200M 2430', 200.000, 120.25, 24050.00),
(34, 21, '88888', 'Produto Teste Email Aprovação', 1.000, 300.00, 300.00),
(35, 22, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 40.000, 142.05, 5682.00),
(36, 22, '17797', 'DESINF MULTIUSO BLISS PRAX 300ML', 40.000, 43.74, 1749.60),
(37, 22, '12946', 'DETERGENTE NEUTRO BEST 5L', 30.000, 106.98, 3209.40),
(38, 23, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(39, 23, '17797', 'DESINF MULTIUSO BLISS PRAX 300ML', 1.000, 43.74, 43.74),
(40, 24, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 1.000, 31.05, 31.05),
(41, 24, '17535', 'DESINFETANTE CIF S/PERFUME 5L 3902', 1.000, 171.40, 171.40),
(42, 25, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 28.000, 142.05, 3977.40),
(43, 25, '17797', 'DESINF MULTIUSO BLISS PRAX 300ML', 2.000, 43.74, 87.48),
(44, 26, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 35.000, 142.05, 4971.75),
(45, 27, 'LMP004', 'Álcool Gel 70% 1L', 12.000, 9.80, 117.60),
(46, 27, 'DESC001', 'Copo Descartável 200ml cx/100', 25.000, 8.75, 218.75),
(47, 27, 'DESC002', 'Prato Descartável 15cm cx/100', 20.000, 12.40, 248.00),
(48, 27, 'EQP001', 'Vassoura de Piaçaba', 201.000, 22.50, 4522.50),
(49, 28, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 1.000, 31.05, 31.05),
(50, 29, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 30.000, 142.05, 4261.50),
(51, 29, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 10.000, 31.05, 310.50),
(52, 30, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(53, 31, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(54, 32, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(55, 32, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 1.000, 31.05, 31.05),
(56, 33, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(57, 33, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 1.000, 31.05, 31.05),
(58, 34, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 2.000, 142.05, 284.10),
(59, 34, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 1.000, 31.05, 31.05),
(60, 35, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(61, 35, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 1.000, 31.05, 31.05),
(62, 36, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 1.000, 31.05, 31.05),
(63, 37, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(64, 38, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 1.000, 31.05, 31.05),
(65, 39, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(66, 40, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05),
(67, 40, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 1.000, 31.05, 31.05),
(68, 41, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1.000, 142.05, 142.05);

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacoes`
--

DROP TABLE IF EXISTS `notificacoes`;
CREATE TABLE IF NOT EXISTS `notificacoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipe_id` int NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `mensagem` varchar(191) NOT NULL,
  `data` datetime NOT NULL,
  `status` enum('pendente','lida') DEFAULT 'pendente',
  PRIMARY KEY (`id`),
  
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `notificacoes`
--

INSERT INTO `notificacoes` (`id`, `equipe_id`, `tipo`, `mensagem`, `data`, `status`) VALUES
(1, 2, 'SALDO_BAIXO', 'Saldo abaixo de 10%. Considere aumentar o limite ou revisar o consumo.', '2025-11-07 18:08:44', 'pendente'),
(2, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 14566.30) insuficiente para o valor do pedido (R$ 15449.94). Aguardando aprovação do gestor.', '2025-11-07 20:01:36', 'pendente'),
(3, 4, 'SALDO_INSUFICIENTE', 'Saldo insuficiente. O gestor foi notificado para revisar o limite.', '2025-11-07 20:01:36', 'pendente'),
(4, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 14566.30) insuficiente para o valor do pedido (R$ 15449.94). Aguardando aprovação do gestor.', '2025-11-07 20:01:45', 'pendente'),
(5, 4, 'SALDO_INSUFICIENTE', 'Saldo insuficiente. O gestor foi notificado para revisar o limite.', '2025-11-07 20:01:45', 'pendente'),
(6, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 14424.25) insuficiente para o valor do pedido (R$ 16501.50). Aguardando aprovação do gestor.', '2025-11-07 20:04:06', 'pendente'),
(7, 4, 'SALDO_INSUFICIENTE', 'Saldo insuficiente. O gestor foi notificado para revisar o limite.', '2025-11-07 20:04:06', 'pendente'),
(8, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 14424.25) insuficiente para o valor do pedido (R$ 16501.50). Aguardando aprovação do gestor.', '2025-11-07 20:04:13', 'pendente'),
(9, 4, 'SALDO_INSUFICIENTE', 'Saldo insuficiente. O gestor foi notificado para revisar o limite.', '2025-11-07 20:04:13', 'pendente'),
(10, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 14424.25) insuficiente para o valor do pedido (R$ 16501.50). Aguardando aprovação do gestor.', '2025-11-07 20:04:20', 'pendente'),
(11, 4, 'SALDO_INSUFICIENTE', 'Saldo insuficiente. O gestor foi notificado para revisar o limite.', '2025-11-07 20:04:20', 'pendente'),
(12, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 14424.25) insuficiente para o valor do pedido (R$ 24050.00). Aguardando aprovação do gestor.', '2025-11-07 20:24:33', 'pendente'),
(13, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 10374.25) insuficiente para o valor do pedido (R$ 10641.00). Aguardando aprovação do gestor.', '2025-11-07 20:42:45', 'pendente'),
(14, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 185.79). Aguardando aprovação do gestor.', '2025-11-07 20:54:38', 'pendente'),
(15, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 202.45). Aguardando aprovação do gestor.', '2025-11-07 21:01:26', 'pendente'),
(16, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 4045.01) insuficiente para o valor do pedido (R$ 4064.88). Aguardando aprovação do gestor.', '2025-11-07 21:14:33', 'pendente'),
(17, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 4045.01) insuficiente para o valor do pedido (R$ 4971.75). Aguardando aprovação do gestor.', '2025-11-07 21:17:29', 'pendente'),
(18, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 5106.85). Aguardando aprovação do gestor.', '2025-11-07 22:46:00', 'pendente'),
(19, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 31.05). Aguardando aprovação do gestor.', '2025-11-07 23:35:57', 'pendente'),
(20, 2, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 4355.21) insuficiente para o valor do pedido (R$ 4572.00). Aguardando aprovação do gestor.', '2025-11-09 21:56:17', 'pendente'),
(21, 2, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 142.05). Aguardando aprovação do gestor.', '2025-11-09 22:12:23', 'pendente'),
(22, 2, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 142.05). Aguardando aprovação do gestor.', '2025-11-09 22:13:21', 'pendente'),
(23, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 173.10). Aguardando aprovação do gestor.', '2025-11-09 22:57:22', 'pendente'),
(24, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 173.10). Aguardando aprovação do gestor.', '2025-11-09 23:01:24', 'pendente'),
(25, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 315.15). Aguardando aprovação do gestor.', '2025-11-09 23:04:17', 'pendente'),
(26, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 173.10). Aguardando aprovação do gestor.', '2025-11-09 23:06:17', 'pendente'),
(27, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 31.05). Aguardando aprovação do gestor.', '2025-11-09 23:16:08', 'pendente'),
(28, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 142.05). Aguardando aprovação do gestor.', '2025-11-09 23:28:45', 'pendente'),
(29, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 31.05). Aguardando aprovação do gestor.', '2025-11-09 23:37:26', 'pendente'),
(30, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 142.05). Aguardando aprovação do gestor.', '2025-11-10 09:28:24', 'pendente'),
(31, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 173.10). Aguardando aprovação do gestor.', '2025-11-10 12:31:00', 'pendente'),
(32, 4, 'LIMITE_EXCEDIDO', 'Limite disponível (R$ 0.00) insuficiente para o valor do pedido (R$ 142.05). Aguardando aprovação do gestor.', '2025-11-10 17:48:21', 'pendente');

-- --------------------------------------------------------

--
-- Estrutura para tabela `orcamentos`
--

DROP TABLE IF EXISTS `orcamentos`;
CREATE TABLE IF NOT EXISTS `orcamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `equipe_id` int DEFAULT NULL,
  `vendedor_id` int DEFAULT NULL,
  `status` enum('pendente','em_analise','enviado','aprovado','rejeitado') COLLATE utf8mb4_unicode_ci DEFAULT 'pendente',
  `data_solicitacao` datetime NOT NULL,
  `data_resposta` datetime DEFAULT NULL,
  `observacao_vendedor` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  
  
  
  
  KEY `idx_data` (`data_solicitacao`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `orcamentos`
--

INSERT INTO `orcamentos` (`id`, `usuario_id`, `equipe_id`, `vendedor_id`, `status`, `data_solicitacao`, `data_resposta`, `observacao_vendedor`, `created_at`, `updated_at`) VALUES
(1, 1, 2, NULL, 'pendente', '2025-11-09 21:17:51', NULL, NULL, '2025-11-10 00:17:51', '2025-11-10 00:17:51'),
(2, 1, 2, NULL, 'pendente', '2025-11-09 21:18:05', NULL, NULL, '2025-11-10 00:18:05', '2025-11-10 00:18:05'),
(3, 1, 2, NULL, 'pendente', '2025-11-09 21:21:34', NULL, NULL, '2025-11-10 00:21:34', '2025-11-10 00:21:34'),
(4, 1, 2, NULL, 'pendente', '2025-11-09 21:22:49', NULL, NULL, '2025-11-10 00:22:49', '2025-11-10 00:22:49'),
(5, 1, 2, NULL, 'pendente', '2025-11-09 21:26:53', NULL, NULL, '2025-11-10 00:26:53', '2025-11-10 00:26:53'),
(6, 1, 2, NULL, 'pendente', '2025-11-09 21:28:10', NULL, NULL, '2025-11-10 00:28:10', '2025-11-10 00:28:10'),
(7, 1, 2, NULL, 'pendente', '2025-11-09 21:30:47', NULL, NULL, '2025-11-10 00:30:47', '2025-11-10 00:30:47'),
(8, 1, 2, NULL, 'pendente', '2025-11-09 21:32:43', NULL, NULL, '2025-11-10 00:32:43', '2025-11-10 00:32:43'),
(9, 1, 2, NULL, 'pendente', '2025-11-09 21:34:56', NULL, NULL, '2025-11-10 00:34:56', '2025-11-10 00:34:56');

-- --------------------------------------------------------

--
-- Estrutura para tabela `orcamento_itens`
--

DROP TABLE IF EXISTS `orcamento_itens`;
CREATE TABLE IF NOT EXISTS `orcamento_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orcamento_id` int NOT NULL,
  `produto_id` int NOT NULL,
  `codprod` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descricao` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantidade` int NOT NULL DEFAULT '1',
  `observacao` text COLLATE utf8mb4_unicode_ci,
  `preco_cotado` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  
  KEY `idx_produto` (`produto_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `orcamento_itens`
--

INSERT INTO `orcamento_itens` (`id`, `orcamento_id`, `produto_id`, `codprod`, `descricao`, `quantidade`, `observacao`, `preco_cotado`, `created_at`) VALUES
(1, 1, 18, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1, NULL, NULL, '2025-11-10 00:17:51'),
(2, 1, 14, '12808', 'DESINF BLANCO FACIL FLORAL  2L', 1, NULL, NULL, '2025-11-10 00:17:51'),
(3, 1, 10, 'LMP004', 'Álcool Gel 70% 1L', 1, NULL, NULL, '2025-11-10 00:17:51'),
(4, 2, 18, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1, NULL, NULL, '2025-11-10 00:18:05'),
(5, 2, 14, '12808', 'DESINF BLANCO FACIL FLORAL  2L', 1, NULL, NULL, '2025-11-10 00:18:05'),
(6, 2, 10, 'LMP004', 'Álcool Gel 70% 1L', 1, NULL, NULL, '2025-11-10 00:18:05'),
(7, 3, 10, 'LMP004', 'Álcool Gel 70% 1L', 1, NULL, NULL, '2025-11-10 00:21:34'),
(8, 3, 6, 'DESC001', 'Copo Descartável 200ml cx/100', 1, NULL, NULL, '2025-11-10 00:21:34'),
(9, 4, 10, 'LMP004', 'Álcool Gel 70% 1L', 1, NULL, NULL, '2025-11-10 00:22:49'),
(10, 4, 6, 'DESC001', 'Copo Descartável 200ml cx/100', 1, NULL, NULL, '2025-11-10 00:22:49'),
(11, 5, 10, 'LMP004', 'Álcool Gel 70% 1L', 1, NULL, NULL, '2025-11-10 00:26:53'),
(12, 6, 18, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1, NULL, NULL, '2025-11-10 00:28:10'),
(13, 7, 18, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1, NULL, NULL, '2025-11-10 00:30:47'),
(14, 8, 18, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1, NULL, NULL, '2025-11-10 00:32:43'),
(15, 9, 18, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 1, NULL, NULL, '2025-11-10 00:34:56');

-- --------------------------------------------------------

--
-- Estrutura para tabela `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `usado` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `usuario_id` (`usuario_id`),
  
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `usuario_id`, `token`, `expires_at`, `usado`, `created_at`) VALUES
(1, 2, 'ed72f031a9bc139efc225bc9304d9d056284aff403ae7bd244310b42ce01af8c', '2025-11-09 23:40:01', 0, '2025-11-10 01:40:01'),
(2, 2, '9a123a984624075aea66365311c103008c0ea9ff8c0f89e300ec1c19df3668f0', '2025-11-09 23:40:48', 0, '2025-11-10 01:40:48'),
(3, 2, '8fd30a0345cbe2ef6f39d46ea2e4e7b426804dbb4a259be7749c8b68157b02d1', '2025-11-09 23:53:52', 1, '2025-11-10 01:53:52'),
(4, 5, 'a5adbcbc261e829f440ce77b353a59614e5577b96c0df96bbe95365ff5a21ddd', '2025-11-10 09:00:27', 1, '2025-11-10 11:00:27'),
(5, 1, '1d0e3de7d96844f70d486fdd2615f613612229aacdc18c10bd8dd2b058d5cc5b', '2025-11-10 19:07:56', 1, '2025-11-10 21:07:55'),
(6, 2, '23154c9e7ffdf672fb78423a106445c09af04933b3acb4606d9e351a829ffe65', '2025-11-10 19:25:36', 1, '2025-11-10 21:25:35');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipe_id` int NOT NULL,
  `valor_total` decimal(15,2) NOT NULL,
  `data` datetime NOT NULL,
  `status` enum('AGUARDANDO','APROVADO','PENDENTE_APROVACAO','EM_SEPARACAO','EM_TRANSPORTE','SAIU_ENTREGA','ENTREGUE','ENVIADO','CANCELADO') DEFAULT 'AGUARDANDO',
  `saldo_restante` decimal(15,2) NOT NULL,
  `origem` varchar(20) DEFAULT 'Local',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `data_confirmacao` datetime DEFAULT NULL,
  `data_separacao` datetime DEFAULT NULL,
  `data_transporte` datetime DEFAULT NULL,
  `data_saida` datetime DEFAULT NULL,
  `data_entrega` datetime DEFAULT NULL,
  `observacoes_rastreamento` text,
  `motivo_pendencia` text COMMENT 'Motivo da pendência de aprovação',
  `cgc` varchar(20) DEFAULT NULL COMMENT 'CGC/CNPJ do cliente',
  `codigo_erp` varchar(50) DEFAULT NULL COMMENT 'Código do cliente no ERP',
  PRIMARY KEY (`id`),
  
  
  
  KEY `idx_pedidos_cgc` (`cgc`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `pedidos`
--

INSERT INTO `pedidos` (`id`, `equipe_id`, `valor_total`, `data`, `status`, `saldo_restante`, `origem`, `created_at`, `data_confirmacao`, `data_separacao`, `data_transporte`, `data_saida`, `data_entrega`, `observacoes_rastreamento`, `motivo_pendencia`, `cgc`, `codigo_erp`) VALUES
(1, 2, 0.00, '2025-11-06 17:12:37', 'CANCELADO', 15000.00, 'Local', '2025-11-06 20:12:37', '2025-11-06 17:12:37', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 2, 0.00, '2025-11-06 17:20:09', 'CANCELADO', 15000.00, 'Local', '2025-11-06 20:20:09', '2025-11-06 17:20:09', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 2, 0.00, '2025-11-06 17:39:52', 'CANCELADO', 15000.00, 'Local', '2025-11-06 20:39:52', '2025-11-06 17:39:52', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 2, 336.35, '2025-11-06 17:45:19', 'APROVADO', 14663.65, 'Local', '2025-11-06 20:45:19', '2025-11-06 23:09:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 2, 336.35, '2025-11-06 17:49:10', 'APROVADO', 14327.30, 'Local', '2025-11-06 20:49:10', '2025-11-06 23:09:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, 2, 336.35, '2025-11-06 17:50:45', 'APROVADO', 13990.95, 'Local', '2025-11-06 20:50:45', '2025-11-06 23:09:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, 2, 605.95, '2025-11-06 17:58:37', 'APROVADO', 13385.00, 'Local', '2025-11-06 20:58:37', '2025-11-06 23:09:19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, 2, 15000.00, '0000-00-00 00:00:00', 'APROVADO', 0.00, 'Local', '2025-11-07 02:12:07', '2025-11-06 23:14:55', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, 2, 15000.00, '0000-00-00 00:00:00', 'APROVADO', 0.00, 'Local', '2025-11-07 02:12:14', '2025-11-06 23:14:38', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, 2, 5000.00, '0000-00-00 00:00:00', 'APROVADO', 0.00, 'Local', '2025-11-07 02:19:11', '2025-11-06 23:21:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 2, 2000.00, '0000-00-00 00:00:00', 'CANCELADO', 0.00, 'Local', '2025-11-07 02:24:58', NULL, NULL, NULL, NULL, NULL, NULL, 'valor acima do permitido', NULL, NULL),
(14, 2, 185.79, '2025-11-07 16:32:45', 'APROVADO', 13199.21, 'Local', '2025-11-07 19:32:45', '2025-11-07 16:32:45', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, 2, 249.03, '2025-11-07 16:53:53', 'APROVADO', 12950.18, 'Local', '2025-11-07 19:53:53', '2025-11-07 16:53:53', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, 2, 594.97, '2025-11-07 18:08:43', 'APROVADO', 2355.21, 'Local', '2025-11-07 21:08:43', '2025-11-07 18:08:43', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, 4, 433.70, '2025-11-07 19:43:30', 'APROVADO', 14566.30, 'Local', '2025-11-07 22:43:30', '2025-11-07 19:43:30', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, 4, 142.05, '2025-11-07 20:03:15', 'APROVADO', 14424.25, 'Local', '2025-11-07 23:03:15', '2025-11-07 20:03:15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(19, 4, 24050.00, '2025-11-07 20:24:33', 'APROVADO', -9625.75, 'Local', '2025-11-07 23:24:33', '2025-11-07 20:31:17', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(21, 4, 300.00, '2025-11-07 20:36:12', 'APROVADO', -300.00, 'Local', '2025-11-07 23:36:12', '2025-11-07 20:48:16', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, 4, 10641.00, '2025-11-07 20:42:45', 'APROVADO', 24359.00, 'Local', '2025-11-07 23:42:45', '2025-11-07 20:46:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(23, 4, 185.79, '2025-11-07 20:54:38', 'APROVADO', 34814.21, 'Local', '2025-11-07 23:54:38', '2025-11-07 20:59:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(24, 4, 202.45, '2025-11-07 21:01:26', 'APROVADO', 34797.55, 'Local', '2025-11-08 00:01:26', '2025-11-07 21:02:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(25, 4, 4064.88, '2025-11-07 21:14:33', 'APROVADO', 35935.12, 'Local', '2025-11-08 00:14:33', '2025-11-09 22:04:18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(26, 4, 4971.75, '2025-11-07 21:17:29', 'APROVADO', 35028.25, 'Local', '2025-11-08 00:17:29', '2025-11-07 22:42:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(27, 4, 5106.85, '2025-11-07 22:46:00', 'APROVADO', 34893.15, 'Local', '2025-11-08 01:46:00', '2025-11-09 22:04:25', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(28, 4, 31.05, '2025-11-07 23:35:57', 'APROVADO', 39968.95, 'Local', '2025-11-08 02:35:57', '2025-11-09 22:05:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(29, 2, 4572.00, '2025-11-09 21:56:17', 'APROVADO', -216.79, 'Local', '2025-11-10 00:56:17', '2025-11-09 22:05:05', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, 2, 142.05, '2025-11-09 22:12:23', 'APROVADO', 4213.16, 'Local', '2025-11-10 01:12:23', '2025-11-09 23:41:07', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, 2, 142.05, '2025-11-09 22:13:21', 'APROVADO', 4213.16, 'Local', '2025-11-10 01:13:21', '2025-11-10 08:10:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, 4, 173.10, '2025-11-09 22:57:22', 'APROVADO', 39826.90, 'Local', '2025-11-10 01:57:22', '2025-11-10 08:10:26', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(33, 4, 173.10, '2025-11-09 23:01:24', 'APROVADO', 39826.90, 'Local', '2025-11-10 02:01:24', '2025-11-10 08:10:32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(34, 4, 315.15, '2025-11-09 23:04:17', 'APROVADO', 39684.85, 'Local', '2025-11-10 02:04:17', '2025-11-10 08:10:36', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(35, 4, 173.10, '2025-11-09 23:06:17', 'APROVADO', 39826.90, 'Local', '2025-11-10 02:06:17', '2025-11-10 08:10:40', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(36, 4, 31.05, '2025-11-09 23:16:08', 'APROVADO', 39968.95, 'Local', '2025-11-10 02:16:08', '2025-11-10 08:10:57', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(37, 4, 142.05, '2025-11-09 23:28:45', 'APROVADO', 39857.95, 'Local', '2025-11-10 02:28:45', '2025-11-10 08:11:06', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(38, 4, 31.05, '2025-11-09 23:37:26', 'APROVADO', 39968.95, 'Local', '2025-11-10 02:37:26', '2025-11-10 08:11:13', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(39, 4, 142.05, '2025-11-10 09:28:24', 'APROVADO', 39857.95, 'Local', '2025-11-10 12:28:24', '2025-11-10 09:31:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(40, 4, 173.10, '2025-11-10 12:31:00', 'APROVADO', 39826.90, 'Local', '2025-11-10 15:31:00', '2025-11-10 12:32:58', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245'),
(41, 4, 142.05, '2025-11-10 17:48:21', 'APROVADO', 39857.95, 'Local', '2025-11-10 20:48:21', '2025-11-10 17:49:57', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '46245');

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos`
--

DROP TABLE IF EXISTS `produtos`;
CREATE TABLE IF NOT EXISTS `produtos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codprod` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `descricao` varchar(191) COLLATE utf8mb4_general_ci NOT NULL,
  `unidade` varchar(10) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'UN',
  `multiplos` int NOT NULL DEFAULT '1',
  `estoque` decimal(10,3) NOT NULL DEFAULT '0.000',
  `preco` decimal(10,2) NOT NULL DEFAULT '0.00',
  `ncm` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `categoria` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `foto` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `observacoes` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cont_oba` char(1) COLLATE utf8mb4_general_ci DEFAULT 'N',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codprod` (`codprod`),
  
  
  KEY `idx_produtos_ativo` (`ativo`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `produtos`
--

INSERT INTO `produtos` (`id`, `codprod`, `descricao`, `unidade`, `multiplos`, `estoque`, `preco`, `ncm`, `categoria`, `ativo`, `foto`, `observacoes`, `created_at`, `updated_at`, `cont_oba`) VALUES
(1, 'LMP001', 'Detergente Neutro 5L', 'UN', 6, 120.000, 15.90, '3402.20.00', 'limpeza', 1, 'https://via.placeholder.com/300x300?text=Detergente', NULL, '2025-11-05 16:10:19', '2025-11-08 01:35:41', 'N'),
(2, 'LMP002', 'Desinfetante Pinho Sol 2L', 'UN', 12, 200.000, 8.50, '3402.20.00', 'limpeza', 1, 'https://via.placeholder.com/300x300?text=Desinfetante', NULL, '2025-11-05 16:10:19', '2025-11-08 01:35:41', 'N'),
(3, 'LMP003', 'Sabão em Pó 2kg', 'UN', 10, 80.000, 12.30, '3402.20.00', 'limpeza', 1, 'https://via.placeholder.com/300x300?text=Sabao', NULL, '2025-11-05 16:10:19', '2025-11-08 01:35:41', 'N'),
(4, 'HIG001', 'Papel Higiênico 64 rolos', 'FD', 5, 50.000, 45.00, '4818.10.00', 'higiene', 1, 'https://via.placeholder.com/300x300?text=Papel+Higienico', 'sdsdsd', '2025-11-05 16:10:19', '2025-11-08 02:49:45', 'N'),
(5, 'HIG002', 'Papel Toalha Interfolhas 1000fls', 'PCT', 20, 100.000, 18.90, '4818.40.00', 'higiene', 1, 'https://via.placeholder.com/300x300?text=Papel+Toalha', NULL, '2025-11-05 16:10:19', '2025-11-08 01:35:41', 'N'),
(6, 'DESC001', 'Copo Descartável 200ml cx/100', 'CX', 25, 300.000, 8.75, '3924.10.00', 'descartaveis', 1, 'https://via.placeholder.com/300x300?text=Copo', NULL, '2025-11-05 16:10:19', '2025-11-08 01:35:41', 'N'),
(7, 'DESC002', 'Prato Descartável 15cm cx/100', 'CX', 20, 150.000, 12.40, '3924.10.00', 'descartaveis', 0, 'https://via.placeholder.com/300x300?text=Prato', NULL, '2025-11-05 16:10:19', '2025-11-10 21:16:30', 'N'),
(8, 'EQP001', 'Vassoura de Piaçaba', 'UN', 1, 25.000, 22.50, '9603.10.00', 'equipamentos', 1, 'https://via.placeholder.com/300x300?text=Vassoura', NULL, '2025-11-05 16:10:19', '2025-11-08 01:35:41', 'N'),
(9, 'EQP002', 'Rodo 40cm', 'UN', 1, 30.000, 18.90, '9603.90.00', 'equipamentos', 1, 'https://via.placeholder.com/300x300?text=Rodo', NULL, '2025-11-05 16:10:19', '2025-11-08 01:35:41', 'N'),
(10, 'LMP004', 'Álcool Gel 70% 1L', 'UN', 12, 90.000, 9.80, '2207.20.90', 'limpeza', 1, '/images/produtos/12493.png', 'sd', '2025-11-05 16:10:19', '2025-11-08 02:49:33', 'N'),
(11, 'HIG003', 'Sabonete Líquido 5L', 'UN', 4, 60.000, 28.50, '3401.11.90', 'higiene', 1, 'https://via.placeholder.com/300x300?text=Sabonete', NULL, '2025-11-05 16:10:19', '2025-11-08 01:35:41', 'N'),
(12, 'DESC003', 'Guardanapo 22x20 pct/50', 'PCT', 50, 200.000, 3.20, '4818.50.00', 'descartaveis', 1, 'https://via.placeholder.com/300x300?text=Guardanapo', NULL, '2025-11-05 16:10:19', '2025-11-08 01:35:41', 'N'),
(13, 'TEST001', 'Produto Teste', 'UN', 1, 10.000, 25.99, '1234.56.78', 'teste', 1, 'http://teste.jpg', 'Produto de teste', '2025-11-05 18:28:57', '2025-11-08 01:35:41', 'N'),
(14, '12808', 'DESINF BLANCO FACIL FLORAL  2L', 'UN', 1, 0.000, 50.00, '123456', 'limpeza', 1, '', '', '2025-11-05 21:15:09', '2025-11-08 01:35:41', 'N'),
(15, '12946', 'DETERGENTE NEUTRO BEST 5L', 'UN', 1, 999999.000, 106.98, '', 'limpeza', 1, 'images\\produtos\\12946.png', '', '2025-11-07 14:46:54', '2025-11-07 16:37:14', 'N'),
(16, '12507', 'SANITIZANTE INST ESPUM NEW EVRSFT 1200ML', 'UN', 1, 999999.000, 75.50, '', 'limpeza', 1, 'file:///P:/fotosprodutos/12507.png', '', '2025-11-07 15:06:32', '2025-11-07 16:40:31', 'N'),
(17, '14561', 'SAB ANTISSEPT ESPUMA EVERSOFT 1200ML', 'UN', 1, 999999.000, 91.45, '', 'limpeza', 1, 'file:///P:/fotosprodutos/14561.png', '', '2025-11-07 15:19:12', '2025-11-08 02:22:47', 'S'),
(18, '14724', 'DESINCRUSTANTE DETERG KITCH CARE 5L', 'UN', 1, 999999.000, 142.05, '', 'limpeza', 1, 'images\\produtos\\14724.png', '', '2025-11-07 15:21:24', '2025-11-08 02:22:43', 'S'),
(19, '16496', 'LIMPADOR GERAL PRAX 5L', 'UN', 1, 999999.000, 92.97, '', 'limpeza', 1, 'images\\produtos\\16496.png', '', '2025-11-07 15:24:40', '2025-11-08 02:22:36', 'S'),
(20, '17016', 'PAPEL TOALHA BOB OPT 24G FS 6X200M 2430', 'FD', 1, 999999.000, 120.25, '', 'higiene', 1, 'images\\produtos\\17016.png', '', '2025-11-07 15:26:34', '2025-11-08 02:22:31', 'S'),
(21, '17391', 'PAPEL TOALHA INTERF OPT FS 4500FL 1929', 'CX', 1, 999999.000, 122.25, '', 'higiene', 1, 'file:///P:/fotosprodutos/17391.png', '', '2025-11-07 15:41:03', '2025-11-08 02:22:27', 'S'),
(22, '17416', 'DESINFETANTE CIF HORTIFRUTICOLAS 1L 1366', 'UN', 1, 999999.000, 31.05, '', 'limpeza', 1, 'images\\produtos\\17416.png', '', '2025-11-07 15:44:18', '2025-11-08 02:22:23', 'S'),
(23, '17535', 'DESINFETANTE CIF S/PERFUME 5L 3902', 'UN', 1, 999999.000, 171.40, '', 'limpeza', 1, 'images\\produtos\\17535.png', '', '2025-11-07 15:45:11', '2025-11-08 02:21:53', 'S'),
(24, '17603', 'PANO M.USO SLIM RL C/28CMX240M AZUL', 'UN', 1, 999999.000, 128.94, '56789', 'limpeza', 1, 'images\\produtos\\17603.png', '', '2025-11-07 15:47:02', '2025-11-08 02:50:22', 'S'),
(25, '17797', 'DESINF MULTIUSO BLISS PRAX 300ML', 'UN', 1, 999999.000, 43.74, '', 'limpeza', 1, '', '', '2025-11-07 15:47:58', '2025-11-07 15:47:58', 'N'),
(26, '17867', 'PAPEL HIG BOB FD 8X250M', 'FD', 1, 999999.000, 109.05, '', 'higiene', 1, 'images\\produtos\\17867.png', '', '2025-11-07 15:49:19', '2025-11-07 16:38:34', 'N'),
(27, '546', 'PROD TESTE', 'UN', 1, 999.000, 560.00, '', 'limpeza', 1, '', 'PROD TESTE', '2025-11-08 01:49:50', '2025-11-08 01:49:50', 'N');

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos_especificacoes`
--

DROP TABLE IF EXISTS `produtos_especificacoes`;
CREATE TABLE IF NOT EXISTS `produtos_especificacoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `produto_id` int NOT NULL,
  `atributo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ordem` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_produto_ordem` (`produto_id`,`ordem`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `produtos_especificacoes`
--

INSERT INTO `produtos_especificacoes` (`id`, `produto_id`, `atributo`, `valor`, `ordem`, `created_at`) VALUES
(1, 1, 'Composição', 'Tensoativo aniônico, coadjuvantes, conservantes', 1, '2025-11-07 02:43:27'),
(2, 1, 'Volume', '5 litros', 2, '2025-11-07 02:43:27'),
(3, 1, 'Peso', '5.2 kg', 3, '2025-11-07 02:43:27'),
(4, 1, 'Dimensões', '25cm x 18cm x 30cm', 4, '2025-11-07 02:43:27'),
(5, 1, 'pH', '7.0 (neutro)', 5, '2025-11-07 02:43:27'),
(6, 1, 'Validade', '24 meses', 6, '2025-11-07 02:43:27'),
(7, 1, 'Registro Anvisa', '123456789', 7, '2025-11-07 02:43:27'),
(8, 4, 'Quantidade de rolos', '64 rolos', 1, '2025-11-07 02:43:27'),
(9, 4, 'Folhas por rolo', '30 metros', 2, '2025-11-07 02:43:27'),
(10, 4, 'Folhas', 'Duplas (2 camadas)', 3, '2025-11-07 02:43:27'),
(11, 4, 'Cor', 'Branco', 4, '2025-11-07 02:43:27'),
(12, 4, 'Material', '100% celulose virgem', 5, '2025-11-07 02:43:27');

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos_imagens`
--

DROP TABLE IF EXISTS `produtos_imagens`;
CREATE TABLE IF NOT EXISTS `produtos_imagens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `produto_id` int NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ordem` int NOT NULL DEFAULT '0',
  `principal` tinyint(1) DEFAULT '0',
  `legenda` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_produto_ordem` (`produto_id`,`ordem`),
  KEY `idx_principal` (`produto_id`,`principal`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `produtos_imagens`
--

INSERT INTO `produtos_imagens` (`id`, `produto_id`, `url`, `ordem`, `principal`, `legenda`, `created_at`) VALUES
(1, 1, 'https://via.placeholder.com/800x800?text=Detergente+Frente', 1, 1, 'Vista frontal', '2025-11-07 02:43:27'),
(2, 1, 'https://via.placeholder.com/800x800?text=Detergente+Verso', 2, 0, 'Vista traseira com informações', '2025-11-07 02:43:27'),
(3, 1, 'https://via.placeholder.com/800x800?text=Detergente+Uso', 3, 0, 'Produto em uso', '2025-11-07 02:43:27'),
(4, 4, 'https://via.placeholder.com/800x800?text=Papel+Higienico+Principal', 1, 1, 'Fardo completo', '2025-11-07 02:43:27'),
(5, 4, 'https://via.placeholder.com/800x800?text=Papel+Higienico+Detalhe', 2, 0, 'Detalhe da textura', '2025-11-07 02:43:27'),
(9, 18, 'P:/fotosprodutos/14724.png', 1, 0, '', '2025-11-07 16:00:46'),
(11, 19, 'file:///P:/fotosprodutos/16496.png', 1, 0, '', '2025-11-07 16:05:56');

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos_videos`
--

DROP TABLE IF EXISTS `produtos_videos`;
CREATE TABLE IF NOT EXISTS `produtos_videos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `produto_id` int NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('youtube','vimeo','url_direta') COLLATE utf8mb4_unicode_ci DEFAULT 'youtube',
  `ordem` int NOT NULL DEFAULT '0',
  `titulo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_produto_ordem` (`produto_id`,`ordem`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `produtos_videos`
--

INSERT INTO `produtos_videos` (`id`, `produto_id`, `url`, `tipo`, `ordem`, `titulo`, `created_at`) VALUES
(1, 1, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 1, 'Como usar o produto corretamente', '2025-11-07 02:43:27');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `senha` varchar(191) NOT NULL,
  `perfil` enum('admin','gestor','equipe','vendedor') NOT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `equipe_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_usuarios_equipe` (`equipe_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `perfil`, `ativo`, `created_at`, `updated_at`, `equipe_id`) VALUES
(1, 'Administrador', 'edson.silva@bragodistribuidora.com.br', '$2b$10$O7QzOsM7RbNIG3juUprWPOT63mOORic72eVM8jEqQhK7caLwhFOUO', 'admin', 1, '2025-10-29 22:55:43', '2025-11-10 21:10:45', 2),
(2, 'Edson', 'brenan.araujo@bragodistribuidora.com.br', '$2b$10$LCPTjgJXhlBKL9o/qDDscuzlmr1f6UpNQ7vRpoAPM7QZMRHuF0hzO', 'equipe', 1, '2025-10-30 01:26:12', '2025-11-10 21:27:07', 4),
(4, 'Usuário Teste', 'equipe@teste.com', '$2a$10$b5uxT.Wy6rEgoFLXFrRp2ejPy2bfkG0Cm9rJb.S.36jwcSaUuRkiC', 'equipe', 1, '2025-10-30 01:58:38', '2025-11-05 18:26:29', 2),
(5, 'Gestor Comercial', 'assistente.ti@bragodistribuidora.com.br', '$2a$10$EqwPOr2bUK9EP9C5xOGuw.LtR6iMycVQkpA/0WFsm/O7WqKpMEyHy', 'gestor', 1, '2025-11-07 18:18:16', '2025-11-10 11:09:08', NULL),
(6, 'Vendedor Teste', 'vendedor@bragodistribuidora.com.br', '$2a$10$OGmQpN.9dT7GhI81YasDV.kmnpTPkeYNsPQPwasI/eq055kOsctGS', 'vendedor', 1, '2025-11-10 10:52:53', '2025-11-10 11:09:08', NULL),
(7, 'Rivelino Mendes', 'rivelino.mendes@bragodistribuidora.com.br', '$2a$10$KsCHC3ULIwmKq6iZSdKDzujXF9DrDOCh7T3Ko47VPbRXjWwxmDWaC', 'gestor', 1, '2025-11-12 17:11:21', '2025-11-12 17:11:21', 4);

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `equipes`
--
ALTER TABLE `equipes`
  ADD CONSTRAINT `fk_equipes_gestor` FOREIGN KEY (`gestor_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Restrições para tabelas `equipe_produtos`
--
ALTER TABLE `equipe_produtos`
  ADD CONSTRAINT `equipe_produtos_ibfk_1` FOREIGN KEY (`equipe_id`) REFERENCES `equipes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `equipe_produtos_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `equipe_produtos_ibfk_3` FOREIGN KEY (`atribuido_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `itens_pedido`
--
ALTER TABLE `itens_pedido`
  ADD CONSTRAINT `fk_itens_pedido_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Restrições para tabelas `notificacoes`
--
ALTER TABLE `notificacoes`
  ADD CONSTRAINT `fk_notificacoes_equipe` FOREIGN KEY (`equipe_id`) REFERENCES `equipes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

--
-- Restrições para tabelas `orcamentos`
--
ALTER TABLE `orcamentos`
  ADD CONSTRAINT `orcamentos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orcamentos_ibfk_2` FOREIGN KEY (`equipe_id`) REFERENCES `equipes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orcamentos_ibfk_3` FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `orcamento_itens`
--
ALTER TABLE `orcamento_itens`
  ADD CONSTRAINT `orcamento_itens_ibfk_1` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orcamento_itens_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedidos_equipe` FOREIGN KEY (`equipe_id`) REFERENCES `equipes` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Restrições para tabelas `produtos_especificacoes`
--
ALTER TABLE `produtos_especificacoes`
  ADD CONSTRAINT `produtos_especificacoes_ibfk_1` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `produtos_imagens`
--
ALTER TABLE `produtos_imagens`
  ADD CONSTRAINT `produtos_imagens_ibfk_1` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `produtos_videos`
--
ALTER TABLE `produtos_videos`
  ADD CONSTRAINT `produtos_videos_ibfk_1` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_equipe` FOREIGN KEY (`equipe_id`) REFERENCES `equipes` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

