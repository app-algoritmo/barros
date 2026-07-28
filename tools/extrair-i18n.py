#!/usr/bin/env python3
"""
BARROS — extrair-i18n.py
Gera i18n/pt.json a partir do texto que já está nas páginas em src/.
O português é o idioma mestre: o dicionário é derivado do HTML, nunca o contrário.

  python3 tools/extrair-i18n.py            # grava i18n/pt.json
  python3 tools/extrair-i18n.py --conferir # só verifica chaves faltantes nas traduções

Documento controlado: DOC-WEB-BUILD-002 · v1.0.0
"""
import html as _html
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FONTES = list((RAIZ / "src" / "pages").glob("*.html")) + list((RAIZ / "src" / "partials").glob("*.html"))
I18N = RAIZ / "i18n"

TAG = re.compile(r'<([a-z0-9]+)([^>]*\sdata-i18n="([^"]+)"[^>]*)>(.*?)</\1>', re.S | re.I)
ATTR = re.compile(r'data-i18n-attr="([^"]+)"')
ATTR_VAL = re.compile(r'\b(\w+)="([^"]*)"')
LIMPA = re.compile(r"<[^>]+>")


def texto(bruto: str, cru: bool) -> str:
    s = bruto if cru else LIMPA.sub("", bruto)
    return _html.unescape(re.sub(r"\s+", " ", s).strip())


def extrair() -> dict:
    dic: dict[str, str] = {}
    for f in FONTES:
        html = f.read_text(encoding="utf-8")
        for _, atributos, chave, conteudo in TAG.findall(html):
            cru = "data-i18n-html" in atributos
            valor = texto(conteudo, cru)
            if not valor:
                continue
            if chave in dic and dic[chave] != valor:
                print(f"  ! chave repetida com texto diferente: {chave} ({f.name})")
            dic[chave] = valor
        # atributos traduzíveis, ex.: data-i18n-attr="placeholder:form.mensagem.ph"
        for bloco in re.findall(r"<[^>]*data-i18n-attr=[^>]*>", html):
            pares = ATTR.search(bloco).group(1)
            valores = dict(ATTR_VAL.findall(bloco))
            for par in pares.split(","):
                attr, chave = (p.strip() for p in par.split(":"))
                if valores.get(attr):
                    dic[chave] = valores[attr]
    return dict(sorted(dic.items()))


def conferir(base: dict) -> None:
    for arq in sorted(I18N.glob("*.json")):
        if arq.stem == "pt":
            continue
        d = json.loads(arq.read_text(encoding="utf-8"))
        faltam = [k for k in base if k not in d]
        sobram = [k for k in d if k not in base and not k.startswith(("_", "meta."))]
        print(f"\n  {arq.name}: {len(d)}/{len(base)} chaves")
        if faltam:
            print(f"    faltando ({len(faltam)}): {', '.join(faltam[:12])}{' …' if len(faltam) > 12 else ''}")
        if sobram:
            print(f"    órfãs ({len(sobram)}): {', '.join(sobram[:12])}")


def main() -> None:
    base = extrair()
    if "--conferir" in sys.argv:
        print(f"  pt.json (mestre): {len(base)} chaves")
        conferir(base)
        return
    I18N.mkdir(exist_ok=True)
    (I18N / "pt.json").write_text(
        json.dumps(base, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"  ✓ i18n/pt.json — {len(base)} chaves")
    conferir(base)


if __name__ == "__main__":
    main()
