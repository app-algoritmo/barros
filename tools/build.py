#!/usr/bin/env python3
"""
BARROS — build.py
Monta as páginas estáticas a partir de src/partials + src/pages.

  python3 tools/build.py

Regra ISO 9001 (7.5.2/7.5.3): cabeçalho, rodapé e metadados existem em
UM único lugar. Nunca edite os .html da raiz — edite src/ e rode o build.

Documento controlado: DOC-WEB-BUILD-001 · v1.0.0
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PARTIALS = RAIZ / "src" / "partials"
PAGES = RAIZ / "src" / "pages"
VERSION = "1.0.0"
REVDATE = date.today().isoformat()

META_RE = re.compile(r"^<!--meta\s*(\{.*?\})\s*-->\s*", re.S)


def ler(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def montar(pagina: Path) -> tuple[str, str]:
    bruto = ler(pagina)
    m = META_RE.match(bruto)
    if not m:
        sys.exit(f"ERRO: {pagina.name} não tem bloco <!--meta {{...}} -->")
    meta = json.loads(m.group(1))
    corpo = bruto[m.end():]

    scripts = "\n".join(
        f'<script type="module" src="{s}"></script>' for s in meta.get("scripts", [])
    )
    jsonld = ""
    if meta.get("jsonld"):
        jsonld = (
            '<script type="application/ld+json">'
            + json.dumps(meta["jsonld"], ensure_ascii=False, separators=(",", ":"))
            + "</script>"
        )

    html = ler(PARTIALS / "head.html") + ler(PARTIALS / "header.html") + corpo + ler(PARTIALS / "footer.html")
    subs = {
        "{{TITLE}}": meta["title"],
        "{{DESC}}": meta["desc"],
        "{{SLUG}}": meta["slug"] if meta["slug"] != "index.html" else "",
        "{{DOC}}": meta.get("doc", "DOC-WEB-PG-000"),
        "{{VERSION}}": VERSION,
        "{{REVDATE}}": REVDATE,
        "{{SCRIPTS}}": scripts,
        "{{JSONLD}}": jsonld,
    }
    for k, v in subs.items():
        html = html.replace(k, v)

    sobrando = re.findall(r"\{\{[A-Z_]+\}\}", html)
    if sobrando:
        sys.exit(f"ERRO: marcador não substituído em {meta['slug']}: {set(sobrando)}")

    return meta["slug"], html


def main() -> None:
    if not PAGES.exists():
        sys.exit("ERRO: src/pages não encontrado.")
    gerados = []
    for pagina in sorted(PAGES.glob("*.html")):
        slug, html = montar(pagina)
        destino = RAIZ / slug
        destino.write_text(html, encoding="utf-8")
        gerados.append(slug)
        print(f"  ✓ {slug:<34} {len(html):>7,} bytes")

    urls = [s for s in gerados if s != "404.html"]
    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.w3.org/1999/xhtml/sitemap/0.9" '
        'xmlns:x="http://www.w3.org/1999/xhtml">\n'.replace(
            "http://www.w3.org/1999/xhtml/sitemap/0.9",
            "http://www.sitemaps.org/schemas/sitemap/0.9",
        )
    )
    for s in urls:
        loc = "https://barros.no/" + ("" if s == "index.html" else s)
        prio = "1.0" if s == "index.html" else "0.7"
        sitemap += f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{REVDATE}</lastmod>\n"
        for lang, code in (("pt", "pt-BR"), ("en", "en"), ("no", "nb-NO"), ("es", "es")):
            sitemap += f'    <x:link rel="alternate" hreflang="{code}" href="{loc}?lang={lang}"/>\n'
        sitemap += f"    <priority>{prio}</priority>\n  </url>\n"
    sitemap += "</urlset>\n"
    (RAIZ / "sitemap.xml").write_text(sitemap, encoding="utf-8")

    print(f"\n  {len(gerados)} páginas · sitemap.xml · v{VERSION} · rev. {REVDATE}")


if __name__ == "__main__":
    main()
