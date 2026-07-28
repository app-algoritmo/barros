# Registro de alterações — barros.no

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento semântico. Este arquivo é a informação documentada exigida pela
ISO 9001, cláusula 7.5.3 — cada versão publicada tem autor, data e descrição.

## [1.0.0] — 2026-07-28

Reconstrução completa. Substitui o site anterior, de formato portfólio,
por um site de serviços profissionais.

### Adicionado
- Estrutura gerada a partir de `src/` por `tools/build.py` — fonte única de
  cabeçalho, rodapé e metadados
- Dez páginas: início, serviços, sobre, qualidade, contato, currículo,
  privacidade, termos, cookies, 404
- Política da Qualidade com objetivos mensuráveis, processo por cláusula da
  ISO 9001 e procedimento de reclamações
- Controle de documento (código, versão, data de revisão) no rodapé de cada página
- Disco de serviços interativo em `/servicos.html`, com deep-link por categoria,
  navegação por teclado e ficha detalhada por item
- Imagem estática do disco na home, gerada do mesmo catálogo por
  `tools/gerar-disco-svg.py`
- Formulário de contato para post@barros.no, com seletor de serviços alimentado
  pelo catálogo, validação em quatro idiomas e armadilha anti-robô
- `api/contato.php` e `api/sql/contatos.sql` para envio direto e registro em
  banco no Domeneshop, com queda automática para mailto
- Quatro idiomas completos: pt-BR (mestre), en, nb-NO, es
- Rodapé de quatro colunas: Barros, Serviços, Plataformas, Institucional
- IBM Plex Sans, Serif e Mono self-hosted (SIL OFL 1.1) — zero terceiros em runtime
- Suíte SEO: canonical, hreflang, Open Graph, JSON-LD por página, sitemap,
  robots.txt, manifest, humans.txt, security.txt
- Workflow do GitHub Pages que reprova o deploy se a raiz divergir de `src/`

### Alterado
- Paleta para tons neutros frios (papel #F6F7F7, tinta #14181A); a cor fica
  reservada às três casas e ao logotipo
- Tipografia de Playfair Display e DM Sans para IBM Plex
- Cronologia corrigida: carreira desde 1985, projetos europeus desde 1994
- Contato único consolidado em post@barros.no

### Removido
- Formato portfólio, marcadores de citação visíveis no texto, menção a
  pontuação de QI e redes sociais no cabeçalho
- CSS embutido nas páginas, substituído por três folhas versionadas
- Dependências externas: Google Fonts, Font Awesome, cdnjs

### Preservado
- Catálogo comercial idêntico ao original — 87 serviços, produtos e cursos, com
  os textos, os agrupamentos e as cores das três casas exatamente como escritos
