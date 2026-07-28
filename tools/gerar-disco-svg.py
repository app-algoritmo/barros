#!/usr/bin/env python3
"""
BARROS — gerar-disco-svg.py
Gera assets/img/disco.svg a partir de assets/js/catalogo.js.

A home usa a imagem estática (leve, sem JavaScript); servicos.html usa o
disco interativo. Como os dois saem do MESMO catálogo, não há risco de
a imagem ficar desatualizada — basta rodar este script depois de mexer
no catálogo.

  python3 tools/gerar-disco-svg.py

Documento controlado: DOC-WEB-BUILD-003 · v1.0.0
"""
import html
import math
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CATALOGO = RAIZ / "assets" / "js" / "catalogo.js"
SAIDA = RAIZ / "assets" / "img" / "disco.svg"

C, R, RI = 200, 192, 112

CAT = re.compile(
    r'\{\s*id:"(?P<id>[^"]+)",\s*titulo:"(?P<titulo>[^"]+)",\s*'
    r'curto:"(?P<curto>[^"]+)",\s*casa:"(?P<casa>[^"]+)",\s*cor:"(?P<cor>[^"]+)"'
)
CASA = re.compile(r'(\w+):\s*\{\s*nome:"([^"]+)",\s*papel:"([^"]+)",\s*cor:"([^"]+)"')


def ponto(ang: float, rad: float) -> tuple[float, float]:
    a = math.radians(ang - 90)
    return C + rad * math.cos(a), C + rad * math.sin(a)


def anel(a0: float, a1: float, ext: float, int_: float) -> str:
    grande = 1 if (a1 - a0) > 180 else 0
    x0, y0 = ponto(a0, ext)
    x1, y1 = ponto(a1, ext)
    x2, y2 = ponto(a1, int_)
    x3, y3 = ponto(a0, int_)
    return (f"M{x0:.2f} {y0:.2f} A{ext} {ext} 0 {grande} 1 {x1:.2f} {y1:.2f} "
            f"L{x2:.2f} {y2:.2f} A{int_} {int_} 0 {grande} 0 {x3:.2f} {y3:.2f} Z")


def main() -> None:
    js = CATALOGO.read_text(encoding="utf-8")
    cats = [m.groupdict() for m in CAT.finditer(js)]
    casas = {m.group(1): m.group(4) for m in CASA.finditer(js)}
    if not cats:
        raise SystemExit("ERRO: nenhuma categoria encontrada em catalogo.js")

    passo = 360 / len(cats)
    p: list[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" '
        f'role="img" aria-label="Disco de serviços e produtos — '
        f'{len(cats)} frentes de trabalho">',
        "<title>Serviços e produtos Barros</title>",
        "<style>"
        ".rot{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:8.4px;"
        "font-weight:600;letter-spacing:.05em;fill:#fff;text-transform:uppercase}"
        ".hub{font-family:Georgia,serif;font-size:15px;fill:#14181A}"
        ".sub{font-family:'IBM Plex Mono',monospace;font-size:7.4px;"
        "letter-spacing:.14em;fill:#667077}"
        "</style>",
    ]

    # aro externo por casa
    blocos: list[dict] = []
    for i, c in enumerate(cats):
        if blocos and blocos[-1]["casa"] == c["casa"]:
            blocos[-1]["fim"] = i + 1
        else:
            blocos.append({"casa": c["casa"], "ini": i, "fim": i + 1})
    for b in blocos:
        d = anel(b["ini"] * passo + 0.7, b["fim"] * passo - 0.7, R + 13, R + 7)
        p.append(f'<path d="{d}" fill="{casas.get(b["casa"], "#667077")}"/>')

    # setores e rótulos
    for i, c in enumerate(cats):
        d = anel(i * passo + 0.4, (i + 1) * passo - 0.4, R, RI)
        p.append(f'<path d="{d}" fill="{c["cor"]}"/>')
        meio = i * passo + passo / 2
        lx, ly = ponto(meio, (R + RI) / 2)
        giro = meio + 90 if meio > 180 else meio - 90
        p.append(
            f'<text class="rot" x="{lx:.2f}" y="{ly:.2f}" text-anchor="middle" '
            f'dominant-baseline="middle" transform="rotate({giro:.2f} {lx:.2f} {ly:.2f})">'
            f'{html.escape(c["curto"])}</text>'
        )

    # miolo
    p.append(f'<circle cx="{C}" cy="{C}" r="{RI - 18}" fill="#FFFFFF" stroke="#E1E5E5"/>')
    p.append(f'<text class="hub" x="{C}" y="{C - 4}" text-anchor="middle">Serviços</text>')
    p.append(f'<text class="hub" x="{C}" y="{C + 14}" text-anchor="middle">&amp; Produtos</text>')
    p.append(f'<text class="sub" x="{C}" y="{C + 36}" text-anchor="middle">'
             f'{len(cats)} FRENTES</text>')
    p.append("</svg>")

    SAIDA.write_text("\n".join(p) + "\n", encoding="utf-8")
    print(f"  ✓ assets/img/disco.svg — {len(cats)} frentes, {len(blocos)} casas")


if __name__ == "__main__":
    main()
