
-- =========================================================
-- ECOFIN - BANCO DE DADOS
-- Modo Ambiental + Modo Financeiro
-- MySQL / MariaDB
-- =========================================================

CREATE DATABASE IF NOT EXISTS ecofin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ecofin;

-- =========================================================
-- 1. USUARIOS
-- Tabela compartilhada pelos dois modos.
-- =========================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome_completo VARCHAR(120) NOT NULL,
  nome_usuario VARCHAR(30) NOT NULL,
  email VARCHAR(150) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_usuarios_nome_usuario (nome_usuario),
  UNIQUE KEY uk_usuarios_email (email)
) ENGINE=InnoDB;

-- =========================================================
-- 2. MODO AMBIENTAL
-- Mantido para preservar a estrutura existente.
-- =========================================================

CREATE TABLE IF NOT EXISTS categorias_ambientais (
  id_categoria TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NULL,
  icone VARCHAR(50) NULL,

  UNIQUE KEY uk_categorias_ambientais_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS unidades_medida (
  id_unidade TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(30) NOT NULL,
  sigla VARCHAR(10) NOT NULL,

  UNIQUE KEY uk_unidades_medida_sigla (sigla)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS acoes_ambientais (
  id_acao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario BIGINT UNSIGNED NOT NULL,
  id_categoria TINYINT UNSIGNED NOT NULL,
  id_unidade TINYINT UNSIGNED NULL,
  titulo VARCHAR(120) NOT NULL,
  descricao VARCHAR(500) NULL,
  quantidade DECIMAL(10,2) NULL,
  data_realizacao DATE NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_acoes_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE,

  CONSTRAINT fk_acoes_categoria
    FOREIGN KEY (id_categoria)
    REFERENCES categorias_ambientais(id_categoria),

  CONSTRAINT fk_acoes_unidade
    FOREIGN KEY (id_unidade)
    REFERENCES unidades_medida(id_unidade),

  INDEX idx_acoes_usuario_data (id_usuario, data_realizacao),
  INDEX idx_acoes_categoria (id_categoria)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS impactos_ambientais (
  id_impacto BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_acao BIGINT UNSIGNED NOT NULL,

  tipo ENUM(
    'co2_evitado_kg',
    'agua_poupada_l',
    'residuos_desviados_kg',
    'energia_poupada_kwh',
    'arvores_plantadas',
    'outro'
  ) NOT NULL,

  valor DECIMAL(12,2) NOT NULL,
  observacao VARCHAR(255) NULL,

  CONSTRAINT fk_impactos_acao
    FOREIGN KEY (id_acao)
    REFERENCES acoes_ambientais(id_acao)
    ON DELETE CASCADE,

  INDEX idx_impactos_acao (id_acao)
) ENGINE=InnoDB;

-- =========================================================
-- 3. PERFIL FINANCEIRO
-- Um perfil por usuário.
-- A renda é informada na seção Receita.
-- =========================================================

CREATE TABLE IF NOT EXISTS perfil_financeiro (
  id_usuario BIGINT UNSIGNED PRIMARY KEY,
  renda_mensal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_perfil_financeiro_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE,

  CONSTRAINT chk_renda_mensal
    CHECK (renda_mensal >= 0)
) ENGINE=InnoDB;

-- =========================================================
-- 4. CATEGORIAS FINANCEIRAS
-- Cada categoria pertence a ganhos ou gastos.
-- =========================================================

CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id_categoria BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  nome VARCHAR(60) NOT NULL,

  tipo ENUM('ganho', 'gasto') NOT NULL,

  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_categoria_financeira_tipo (nome, tipo),
  INDEX idx_categorias_financeiras_tipo (tipo)
) ENGINE=InnoDB;

-- =========================================================
-- 5. GANHOS
-- Registra entradas financeiras dos usuários.
-- =========================================================

CREATE TABLE IF NOT EXISTS ganhos (
  id_ganho BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  id_usuario BIGINT UNSIGNED NOT NULL,
  id_categoria BIGINT UNSIGNED NOT NULL,

  descricao VARCHAR(150) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_movimentacao DATE NOT NULL,

  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ganhos_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE,

  CONSTRAINT fk_ganhos_categoria
    FOREIGN KEY (id_categoria)
    REFERENCES categorias_financeiras(id_categoria),

  CONSTRAINT chk_ganho_valor
    CHECK (valor > 0),

  INDEX idx_ganhos_usuario_data
    (id_usuario, data_movimentacao, id_ganho),

  INDEX idx_ganhos_categoria (id_categoria)
) ENGINE=InnoDB;

-- =========================================================
-- 6. GASTOS
-- Registra saídas financeiras dos usuários.
-- =========================================================

CREATE TABLE IF NOT EXISTS gastos (
  id_gasto BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  id_usuario BIGINT UNSIGNED NOT NULL,
  id_categoria BIGINT UNSIGNED NOT NULL,

  descricao VARCHAR(150) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_movimentacao DATE NOT NULL,

  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_gastos_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE,

  CONSTRAINT fk_gastos_categoria
    FOREIGN KEY (id_categoria)
    REFERENCES categorias_financeiras(id_categoria),

  CONSTRAINT chk_gasto_valor
    CHECK (valor > 0),

  INDEX idx_gastos_usuario_data
    (id_usuario, data_movimentacao, id_gasto),

  INDEX idx_gastos_categoria (id_categoria)
) ENGINE=InnoDB;

-- =========================================================
-- 7. CATEGORIAS AMBIENTAIS INICIAIS
-- INSERT IGNORE evita duplicar categorias existentes.
-- =========================================================

INSERT IGNORE INTO categorias_ambientais
  (nome, descricao, icone)
VALUES
  ('Reciclagem',
   'Separação e destinação correta de resíduos.', '♻️'),

  ('Economia de água',
   'Redução ou reaproveitamento do consumo de água.', '💧'),

  ('Economia de energia',
   'Uso consciente de energia elétrica.', '⚡'),

  ('Mobilidade sustentável',
   'Deslocamentos de menor impacto ambiental.', '🚲'),

  ('Consumo consciente',
   'Escolhas de compra com menor impacto.', '🌱');

-- =========================================================
-- 8. UNIDADES DE MEDIDA INICIAIS
-- =========================================================

INSERT IGNORE INTO unidades_medida (nome, sigla)
VALUES
  ('quilograma', 'kg'),
  ('litro', 'L'),
  ('quilowatt-hora', 'kWh'),
  ('unidade', 'un'),
  ('quilômetro', 'km');

-- =========================================================
-- 9. CATEGORIAS FINANCEIRAS INICIAIS
-- Podem ser ampliadas posteriormente.
-- =========================================================

INSERT IGNORE INTO categorias_financeiras (nome, tipo)
VALUES
  ('Salário', 'ganho'),
  ('Freelance', 'ganho'),
  ('Investimentos', 'ganho'),
  ('Vendas', 'ganho'),
  ('Outros ganhos', 'ganho'),

  ('Alimentação', 'gasto'),
  ('Transporte', 'gasto'),
  ('Moradia', 'gasto'),
  ('Educação', 'gasto'),
  ('Saúde', 'gasto'),
  ('Lazer', 'gasto'),
  ('Contas', 'gasto'),
  ('Outros gastos', 'gasto');
