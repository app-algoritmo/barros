<?php
/**
 * BARROS — api/contato.php
 * Recebe o formulário de contato, grava em MySQL e envia para post@barros.no.
 *
 * Onde instalar (Domeneshop): public_html/api/contato.php
 * Requisitos: PHP 8.0+, extensão pdo_mysql, função mail() habilitada.
 *
 * Se o site ficar no GitHub Pages e este arquivo no Domeneshop, publique-o
 * num subdomínio (ex.: api.barros.no) e mantenha barros.no na lista ORIGENS.
 * Se o site inteiro for para o Domeneshop, é tudo mesma origem e o CORS
 * deixa de importar.
 *
 * Documento controlado: DOC-WEB-API-001 · v1.0.0
 */

declare(strict_types=1);

/* ─── Configuração ──────────────────────────────────────────
   Em produção, mova estas constantes para um arquivo fora de
   public_html e faça require dele aqui. Nunca versione senha. */
const DESTINO      = 'post@barros.no';
const REMETENTE    = 'no-reply@barros.no';   // precisa existir no domínio
const ORIGENS      = ['https://barros.no', 'https://www.barros.no'];
const LIMITE_HORA  = 5;                       // envios por IP por hora

const DB_HOST = 'mysql.domeneshop.no';
const DB_NOME = 'barros_site';
const DB_USER = 'barros_site';
const DB_SENHA = 'TROCAR_ESTA_SENHA';
const DB_ATIVO = false;   // true depois de criar a tabela (ver sql/ abaixo)

/* ─── CORS e método ─────────────────────────────────────── */
$origem = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origem, ORIGENS, true)) {
    header("Access-Control-Allow-Origin: $origem");
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, 'metodo_nao_permitido', 'Use POST.');
}

/* ─── Entrada ───────────────────────────────────────────── */
$bruto = file_get_contents('php://input') ?: '';
$d = json_decode($bruto, true);
if (!is_array($d)) {
    $d = $_POST;
}

$campo = static fn(string $k, int $max = 500): string =>
    mb_substr(trim((string)($d[$k] ?? '')), 0, $max);

// Armadilha anti-robô: humano não preenche.
if ($campo('website') !== '') {
    responder(200, 'ok', 'Recebido.');   // silencioso de propósito
}

$nome     = $campo('nome', 120);
$email    = $campo('email', 180);
$empresa  = $campo('empresa', 160);
$telefone = $campo('telefone', 40);
$pais     = $campo('pais', 60);
$prazo    = $campo('prazo', 60);
$servico  = $campo('servico', 200);
$mensagem = $campo('mensagem', 6000);
$idioma   = $campo('idioma', 5) ?: 'pt';
$origemUrl = $campo('origem', 300);

$erros = [];
if (mb_strlen($nome) < 2)                                   $erros[] = 'nome';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))             $erros[] = 'email';
if (mb_strlen($mensagem) < 20)                              $erros[] = 'mensagem';
if (empty($d['consentimento']))                             $erros[] = 'consentimento';
if ($erros) {
    responder(422, 'dados_invalidos', 'Campos inválidos: ' . implode(', ', $erros));
}

/* ─── Limite por IP ─────────────────────────────────────── */
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ip = trim(explode(',', $ip)[0]);
$marca = sys_get_temp_dir() . '/barros_' . hash('sha256', $ip) . '.txt';
$agora = time();
$batidas = is_file($marca)
    ? array_filter(array_map('intval', explode("\n", (string)file_get_contents($marca))),
                   static fn(int $t): bool => $t > $agora - 3600)
    : [];
if (count($batidas) >= LIMITE_HORA) {
    responder(429, 'limite_excedido', 'Muitos envios. Tente novamente daqui a pouco.');
}
$batidas[] = $agora;
@file_put_contents($marca, implode("\n", $batidas), LOCK_EX);

/* ─── Registro em banco (opcional) ──────────────────────── */
$registro = null;
if (DB_ATIVO) {
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NOME . ';charset=utf8mb4',
            DB_USER, DB_SENHA,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]
        );
        $sql = 'INSERT INTO contatos
                (criado_em, nome, email, empresa, telefone, pais, prazo, servico,
                 mensagem, idioma, origem, ip_hash)
                VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        $pdo->prepare($sql)->execute([
            $nome, $email, $empresa, $telefone, $pais, $prazo, $servico,
            $mensagem, $idioma, $origemUrl, hash('sha256', $ip),
        ]);
        $registro = (int)$pdo->lastInsertId();
    } catch (Throwable $e) {
        error_log('[barros/contato] banco: ' . $e->getMessage());
        // Falha de banco não pode impedir o e-mail: segue adiante.
    }
}

/* ─── E-mail ────────────────────────────────────────────── */
$servicoNome = $servico !== '' ? (explode('::', $servico)[1] ?? $servico) : '—';
$ref = $registro !== null ? sprintf('BR-%06d', $registro) : 'BR-' . date('ymd-His');

$assunto = sprintf('[barros.no · %s] %s — %s', $ref, $servicoNome, $nome);
$corpo = implode("\n", [
    "Referência: $ref",
    'Recebido:   ' . date('Y-m-d H:i:s T'),
    '',
    "Nome:       $nome",
    'Empresa:    ' . ($empresa ?: '—'),
    "E-mail:     $email",
    'Telefone:   ' . ($telefone ?: '—'),
    'País:       ' . ($pais ?: '—'),
    "Serviço:    $servicoNome",
    'Prazo:      ' . ($prazo ?: '—'),
    "Idioma:     $idioma",
    '',
    'Mensagem:',
    $mensagem,
    '',
    str_repeat('—', 40),
    'Origem: ' . ($origemUrl ?: '—'),
    'Consentimento LGPD/GDPR registrado no envio.',
]);

$cabecalhos = implode("\r\n", [
    'From: Barros <' . REMETENTE . '>',
    'Reply-To: ' . mb_encode_mimeheader($nome) . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: barros.no',
]);

$enviado = @mail(DESTINO, mb_encode_mimeheader($assunto), $corpo, $cabecalhos);
if (!$enviado) {
    error_log("[barros/contato] mail() falhou para $ref");
    responder(502, 'envio_falhou', 'Não foi possível enviar agora.', ['ref' => $ref]);
}

responder(200, 'ok', 'Mensagem recebida.', ['ref' => $ref]);

/* ─── Resposta ──────────────────────────────────────────── */
function responder(int $http, string $estado, string $texto, array $extra = []): never
{
    http_response_code($http);
    echo json_encode(
        ['estado' => $estado, 'mensagem' => $texto] + $extra,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}
