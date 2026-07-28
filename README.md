# barros.no

Site institucional da Barros — operações e governança, tecnologia e assuntos
regulatórios. Estático, multilíngue (pt-BR · en · nb-NO · es), sem dependência
de terceiros em tempo de execução.

**Produção:** https://barros.no
**Repositório:** https://github.com/app-algoritmo/barros

---

## A regra que sustenta tudo

**Você nunca edita os `.html` da raiz.** Eles são gerados.

```
src/partials/ + src/pages/   →   python3 tools/build.py   →   *.html na raiz
```

Cabeçalho, rodapé, metadados, código de documento e versão existem em um lugar
só. Editar a raiz à mão quebra isso — e o workflow do GitHub **reprova o deploy**
quando detecta divergência. Esse é o controle de informação documentada exigido
pela ISO 9001, cláusula 7.5, e é a razão de ele ser automático em vez de
depender de disciplina.

---

## Estrutura

```
.
├── *.html                    gerados — não editar
├── sitemap.xml               gerado
│
├── src/
│   ├── partials/             head · header · footer (fonte única)
│   └── pages/                conteúdo de cada página + bloco <!--meta-->
│
├── assets/
│   ├── css/                  base (tokens) · layout · components
│   ├── fonts/                IBM Plex Sans/Serif/Mono — self-hosted, SIL OFL 1.1
│   ├── img/                  logo-b.png · disco.svg · favicon/ · og/
│   └── js/
│       ├── catalogo.js       CATÁLOGO COMERCIAL — fonte única do disco
│       ├── disco.js          renderização do disco e da ficha de serviço
│       ├── form.js           formulário de contato
│       └── app.js            navegação, idiomas, revelação, consentimento
│
├── i18n/                     pt (mestre) · en · no · es
├── api/                      contato.php + sql/contatos.sql (Domeneshop)
├── tools/                    build.py · extrair-i18n.py · gerar-disco-svg.py
├── docs/qualidade/           procedimentos e registros
└── .github/workflows/        publicação com verificação
```

---

## Comandos

```bash
python3 tools/build.py               # gera as páginas e o sitemap
python3 tools/extrair-i18n.py        # regera i18n/pt.json a partir do HTML
python3 tools/extrair-i18n.py --conferir   # lista chaves faltantes por idioma
python3 tools/gerar-disco-svg.py     # regera a imagem estática do disco
python3 -m http.server 8000          # visualizar em http://localhost:8000
```

**Depois de mexer em qualquer coisa:**

```bash
python3 tools/build.py && python3 tools/extrair-i18n.py --conferir
```

---

## Como alterar cada coisa

### Serviços, produtos e preços
Somente `assets/js/catalogo.js`. É a fonte única: o disco interativo, a vitrine,
a ficha de cada item e o seletor do formulário de contato saem todos dele.
Depois de editar, rode `python3 tools/gerar-disco-svg.py` para atualizar também
a imagem estática da home.

### Texto das páginas
`src/pages/<pagina>.html`, em português. Depois:

```bash
python3 tools/build.py
python3 tools/extrair-i18n.py          # o pt.json se atualiza sozinho
python3 tools/extrair-i18n.py --conferir   # mostra o que traduzir em en/no/es
```

O português é o idioma mestre — o dicionário é derivado do HTML, nunca o
contrário. Chave ausente numa tradução cai para o inglês, nunca quebra a página.

### Menu, rodapé, metadados
`src/partials/`. Vale para todas as páginas de uma vez.

### Cores e tipografia
`assets/css/base.css`, bloco `:root`. As cores das três casas no disco ficam em
`catalogo.js` — são dado comercial, não decoração.

### Nova página
1. Crie `src/pages/nova.html` começando pelo bloco `<!--meta {...} -->`
2. `python3 tools/build.py`
3. Acrescente o link em `src/partials/header.html` ou `footer.html`

---

## Formulário de contato

Destino: **post@barros.no**.

Dois modos, controlados por uma constante em `assets/js/form.js`:

| `ENDPOINT` | Comportamento |
|---|---|
| `""` (atual) | Abre o programa de e-mail do visitante com a mensagem montada |
| URL do PHP | Envia por HTTPS, gera número de referência, grava no banco |

O segundo é o recomendado: não depende de o visitante ter cliente de e-mail
configurado, e é ele que alimenta o indicador «prazo da primeira resposta» da
Política da Qualidade. Se o servidor cair, o formulário volta sozinho ao mailto —
nenhuma mensagem se perde.

Para ativar, ver `docs/qualidade/formulario.md`.

---

## Publicação

O site vai ao ar por GitHub Actions a cada `push` na `main`, depois de o
workflow verificar que a raiz está em dia com `src/` e que as traduções estão
completas.

**Configuração única, no GitHub:**

1. Settings → Pages → Source: **GitHub Actions**
2. Settings → Pages → Custom domain: `barros.no`
3. **Enforce HTTPS** assim que o certificado for emitido

**DNS, no Domeneshop:**

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `app-algoritmo.github.io.` |

> **Atenção.** Os caminhos do site são absolutos (`/assets/…`). Isso é correto
> para `barros.no`, mas **quebra** em `app-algoritmo.github.io/barros/`. Configure
> o domínio antes de conferir o resultado — o preview do GitHub sem domínio vai
> aparecer sem estilo, e isso é esperado.

---

## Padrões atendidos

- **WCAG 2.2 AA** — contraste verificado, navegação por teclado, foco visível,
  `prefers-reduced-motion`, estrutura semântica, skip link
- **GDPR / personopplysningsloven / LGPD** — consentimento prévio, painel de
  cookies, prazos de retenção declarados, direitos do titular
- **ISO 9001:2015** — os processos descritos em `/qualidade.html` seguem a
  estrutura da norma. O site **não** é certificado, e a própria página diz isso
- **Zero terceiros em runtime** — fontes, estilos e scripts saem do próprio
  domínio. Nenhuma requisição sai para fora ao carregar a página

---

## Licença

Código sob MIT (`LICENSE`). Conteúdo editorial, catálogo comercial e identidade
visual são de titularidade de Paulo Fernando De Barros — ver
`/termos-de-uso.html`. Fontes IBM Plex sob SIL Open Font License 1.1.

---

`DOC-WEB-README-001 · v1.0.0` · contato: post@barros.no
