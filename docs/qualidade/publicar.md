# Publicar uma alteração

`DOC-QUA-PR-002 · v1.0.0`

## Rotina

```bash
# 1. edite src/pages/, src/partials/ ou assets/js/catalogo.js

# 2. gere
python3 tools/build.py

# 3. se mexeu no catálogo, regere a imagem da home
python3 tools/gerar-disco-svg.py

# 4. se mexeu em texto de página, atualize o dicionário mestre
python3 tools/extrair-i18n.py

# 5. veja o que falta traduzir
python3 tools/extrair-i18n.py --conferir

# 6. confira no navegador
python3 -m http.server 8000

# 7. publique
git add -A
git commit -m "descrição do que mudou e por quê"
git push
```

O workflow roda o build de novo e **reprova** se a raiz estiver diferente do que
`src/` produz. Se falhar com «as páginas publicadas divergem de src/», é porque
o passo 2 não foi rodado antes do commit.

## Mensagem de commit

Ela é o registro de alteração exigido pela ISO 9001, 7.5.3. Descreva o que mudou
e por quê, não o arquivo tocado.

- Bom: `Corrige prazo de resposta a reclamação para 15 dias, conforme revisão jurídica`
- Ruim: `atualiza qualidade.html`

Alteração material em página legal ou na Política da Qualidade: suba a versão em
`tools/build.py` (`VERSION`) e registre em `CHANGELOG.md`.

## Revisão anual

Todo julho, revisar: Política da Qualidade contra o desempenho real dos
indicadores, páginas legais, `Expires` do `security.txt`, e as datas de «próxima
revisão» no rodapé dos documentos.
