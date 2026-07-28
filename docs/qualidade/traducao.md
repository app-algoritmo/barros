# Traduções

`DOC-QUA-PR-003 · v1.0.0`

## Regra

Português do Brasil é o idioma mestre. O dicionário `i18n/pt.json` é **derivado
do HTML** por `tools/extrair-i18n.py` — nunca se edita à mão. Em caso de
divergência entre versões, prevalece o texto em português, e isso está declarado
na Política da Qualidade, item 5.

## Cadeia de recurso

```
pt.json (base)  →  en.json (ponte)  →  no.json / es.json (alvo)
```

Chave ausente em norueguês cai para o inglês, não para o português. Página
incompleta nunca aparece meio traduzida em idioma que o visitante não lê.

## Acrescentar texto novo

1. Escreva em português no `src/pages/`, com `data-i18n="chave.nova"`
2. `python3 tools/build.py && python3 tools/extrair-i18n.py`
3. `python3 tools/extrair-i18n.py --conferir` lista a chave como faltante
4. Acrescente a chave nos quatro arquivos e rode `--conferir` de novo

## Atributos

Para traduzir um atributo em vez do conteúdo:

```html
<textarea data-i18n-attr="placeholder:form.mensagem.ph" placeholder="Texto em português"></textarea>
```

Para preservar HTML dentro do texto traduzido, acrescente `data-i18n-html`.

## Catálogo de serviços

`assets/js/catalogo.js` está só em português, por decisão: é o documento
comercial mestre e o texto é do próprio autor. O disco mostra os rótulos e as
fichas em português em qualquer idioma; a interface ao redor acompanha o idioma
escolhido. Traduzir o catálogo é trabalho de redação comercial, não de
localização de interface — quando for feito, entra como
`i18n/catalogo.<lang>.json`.
