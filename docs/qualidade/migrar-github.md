# Migrar o repositório app-algoritmo/barros

`DOC-QUA-PR-004 · v1.0.0`

## 1. Guardar o que existe

```bash
cd caminho/do/repo
git checkout -b arquivo-v0
git push -u origin arquivo-v0     # o site antigo fica preservado nesta branch
git checkout main
```

## 2. Limpar a main

```bash
git rm -r --cached .
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +
```

## 3. Colocar a estrutura nova

Descompacte `barros.no-v1.0.0.zip` na raiz do repositório. Confira que ficaram
visíveis os arquivos ocultos: `.github/`, `.well-known/`, `.gitignore`, `.nojekyll`.

```bash
python3 tools/build.py
git add -A
git commit -m "v1.0.0 — reconstrução completa do site institucional"
git push
```

## 4. GitHub Pages

Settings → Pages:

1. **Source:** GitHub Actions — *não* «Deploy from a branch»
2. **Custom domain:** `barros.no`
3. **Enforce HTTPS:** marque assim que o certificado for emitido (leva alguns minutos)

## 5. DNS no Domeneshop

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `app-algoritmo.github.io.` |

Se `barros.no` já aponta para o Domeneshop e há e-mail no domínio, **não mexa nos
registros MX** — só nos A e no CNAME do `www`.

## 6. Ponto de atenção

Os caminhos são absolutos (`/assets/…`), o que é correto para `barros.no` e
**errado** para `app-algoritmo.github.io/barros/`. Enquanto o domínio não estiver
configurado e propagado, o preview do GitHub aparece sem estilo nenhum. Isso é
esperado e não é defeito — conclua o passo 4 antes de julgar o resultado.

## 7. Conferir depois de no ar

- [ ] `https://barros.no` carrega com estilo e com o disco na home
- [ ] `https://barros.no/servicos.html` monta o disco e abre a ficha de um item
- [ ] Os quatro idiomas trocam no cabeçalho
- [ ] O formulário abre o e-mail para post@barros.no com a mensagem montada
- [ ] `https://barros.no/sitemap.xml` e `/robots.txt` respondem
- [ ] Compartilhar o link no LinkedIn mostra a imagem de prévia
- [ ] Submeter o sitemap no Google Search Console
