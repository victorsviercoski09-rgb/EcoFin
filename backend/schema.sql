-- EcoFin: modelo inicial somente do modo ambiental.
-- Execute este arquivo no MySQL antes de iniciar o servidor.

CREATE DATABASE IF NOT EXISTS ecofin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE ecofin;

CREATE TABLE usuarios (
  id_usuario BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome_completo VARCHAR(120) NOT NULL,
  nome_usuario VARCHAR(30) NOT NULL,
  email VARCHAR(150) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_usuarios_nome_usuario (nome_usuario),
  UNIQUE KEY uk_usuarios_email (email)
) ENGINE=InnoDB;

CREATE TABLE categorias_ambientais (
  id_categoria TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  descricao VARCHAR(255) NULL,
  icone VARCHAR(50) NULL,
  UNIQUE KEY uk_categorias_ambientais_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE unidades_medida (
  id_unidade TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(30) NOT NULL,
  sigla VARCHAR(10) NOT NULL,
  UNIQUE KEY uk_unidades_medida_sigla (sigla)
) ENGINE=InnoDB;

CREATE TABLE acoes_ambientais (
  id_acao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario BIGINT UNSIGNED NOT NULL,
  id_categoria TINYINT UNSIGNED NOT NULL,
  id_unidade TINYINT UNSIGNED NULL,
  titulo VARCHAR(120) NOT NULL,
  descricao VARCHAR(500) NULL,
  quantidade DECIMAL(10,2) NULL,
  data_realizacao DATE NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_acoes_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_acoes_categoria FOREIGN KEY (id_categoria) REFERENCES categorias_ambientais(id_categoria),
  CONSTRAINT fk_acoes_unidade FOREIGN KEY (id_unidade) REFERENCES unidades_medida(id_unidade),
  INDEX idx_acoes_usuario_data (id_usuario, data_realizacao),
  INDEX idx_acoes_categoria (id_categoria)
) ENGINE=InnoDB;

-- Uma ação pode ter mais de um impacto ambiental mensurável.
CREATE TABLE impactos_ambientais (
  id_impacto BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_acao BIGINT UNSIGNED NOT NULL,
  tipo ENUM('co2_evitado_kg', 'agua_poupada_l', 'residuos_desviados_kg', 'energia_poupada_kwh', 'arvores_plantadas', 'outro') NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  observacao VARCHAR(255) NULL,
  CONSTRAINT fk_impactos_acao FOREIGN KEY (id_acao) REFERENCES acoes_ambientais(id_acao) ON DELETE CASCADE,
  INDEX idx_impactos_acao (id_acao)
) ENGINE=InnoDB;

INSERT INTO categorias_ambientais (nome, descricao, icone) VALUES
  ('Reciclagem', 'Separação e destinação correta de resíduos.', '♻️'),
  ('Economia de água', 'Redução ou reaproveitamento do consumo de água.', '💧'),
  ('Economia de energia', 'Uso consciente de energia elétrica.', '⚡'),
  ('Mobilidade sustentável', 'Deslocamentos de menor impacto ambiental.', '🚲'),
  ('Consumo consciente', 'Escolhas de compra com menor impacto.', '🌱');

INSERT INTO unidades_medida (nome, sigla) VALUES
  ('quilograma', 'kg'), ('litro', 'L'), ('quilowatt-hora', 'kWh'), ('unidade', 'un'), ('quilômetro', 'km');
