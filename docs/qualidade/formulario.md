# Ativar o envio direto do formulário

`DOC-QUA-PR-001 · v1.0.0`

Hoje o formulário abre o programa de e-mail do visitante. Funciona, mas depende
de ele ter um cliente configurado — no celular e no webmail, boa parte desiste
no meio. O envio direto resolve isso e ainda gera o registro que sustenta o
indicador «prazo da primeira resposta» da Política da Qualidade.

## Decisão de arquitetura

O site é estático e está no GitHub Pages; o PHP precisa de servidor. Duas saídas:

**A · Subdomínio no Domeneshop** — mantém o site no GitHub Pages e publica só o
PHP em `api.barros.no`. Exige CORS, já configurado no arquivo.

**B · Site inteiro no Domeneshop** — tudo em mesma origem, CORS deixa de existir,
e o Domeneshop já está pago. Perde-se o deploy automático e a verificação do
workflow, que teriam de virar FTP.

Recomendação: **A**. Mantém a rastreabilidade do repositório, que é o que
sustenta o controle documental, e usa o Domeneshop só para o que ele é
necessário.

## Passo a passo (opção A)

1. **Subdomínio** — no painel do Domeneshop, aponte `api.barros.no` para o
   espaço web da conta.

2. **Banco** — em phpMyAdmin, execute `api/sql/contatos.sql`.

3. **Configuração** — em `api/contato.php`, ajuste `DB_SENHA` e ponha
   `DB_ATIVO = true`. Melhor ainda: mova as constantes para um arquivo fora de
   `public_html` e faça `require` dele. Senha não se versiona.

4. **Remetente** — crie a caixa `no-reply@barros.no`. Sem um remetente do próprio
   domínio, o e-mail cai em spam.

5. **Upload** — envie `contato.php` para `public_html/api/` do subdomínio.

6. **Ligar no site** — em `assets/js/form.js`:
   ```js
   const ENDPOINT = "https://api.barros.no/contato.php";
   ```
   Depois `git commit` e `git push`. Nada mais precisa mudar.

7. **Testar** — envie uma mensagem real. Confira três coisas: chegou em
   post@barros.no, tem número de referência no assunto, e apareceu uma linha na
   tabela `contatos`.

## Registro e retenção

Cada mensagem recebe referência `BR-000123` e entra na tabela com situação
`novo`. Atualize a coluna `situacao` conforme o tratamento — os estados incluem
`reclamacao`, que é o que liga esta tabela ao item 4 da Política da Qualidade.

A consulta do indicador e o comando de expurgo aos 12 meses estão comentados no
fim de `api/sql/contatos.sql`.

## Se o servidor cair

O formulário detecta a falha e abre o mailto com a mensagem montada, avisando o
visitante. Nenhuma mensagem se perde por indisponibilidade — mas vale conferir o
`error_log` do Domeneshop quando isso acontecer.
