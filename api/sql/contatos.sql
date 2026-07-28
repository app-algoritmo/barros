-- BARROS — estrutura da base de contatos (Domeneshop / MySQL)
-- DOC-WEB-API-002 · v1.0.0
-- Execute uma vez no phpMyAdmin do Domeneshop, depois ponha DB_ATIVO = true.

CREATE TABLE IF NOT EXISTS contatos (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  criado_em  DATETIME     NOT NULL,
  nome       VARCHAR(120) NOT NULL,
  email      VARCHAR(180) NOT NULL,
  empresa    VARCHAR(160)     NULL,
  telefone   VARCHAR(40)      NULL,
  pais       VARCHAR(60)      NULL,
  prazo      VARCHAR(60)      NULL,
  servico    VARCHAR(200)     NULL,
  mensagem   TEXT         NOT NULL,
  idioma     CHAR(5)      NOT NULL DEFAULT 'pt',
  origem     VARCHAR(300)     NULL,
  ip_hash    CHAR(64)         NULL,
  -- Trilha de tratamento — atende à Política da Qualidade, itens 2 e 4
  respondido_em DATETIME      NULL,
  situacao   ENUM('novo','em_analise','respondido','proposta_enviada','encerrado','reclamacao')
             NOT NULL DEFAULT 'novo',
  nota       TEXT             NULL,
  PRIMARY KEY (id),
  KEY idx_criado (criado_em),
  KEY idx_situacao (situacao),
  KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consulta do indicador "prazo da primeira resposta" (meta: <= 2 dias úteis)
-- SELECT situacao, COUNT(*) AS total,
--        ROUND(AVG(TIMESTAMPDIFF(HOUR, criado_em, respondido_em))/24, 1) AS dias_medios
-- FROM contatos WHERE criado_em >= DATE_SUB(NOW(), INTERVAL 90 DAY) GROUP BY situacao;

-- Expurgo: solicitações que não viraram contrato, após 12 meses (Política de
-- Privacidade, item 7). Rode manualmente ou por cron.
-- DELETE FROM contatos
--  WHERE situacao IN ('encerrado','respondido')
--    AND criado_em < DATE_SUB(NOW(), INTERVAL 12 MONTH);
