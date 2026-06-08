"""
controller.py — duas calculadoras de barema:

  tipo="professor"  → barema de concurso público para professores
  tipo="aeri"       → barema do Edital 02/2025 AERI/UEFS (mobilidade internacional)
"""

import ast
import re
from datetime import date, datetime
from html import unescape

from database import registrar_barema, registrar_consulta
from service import (
    _criar_sessao,
    _validar_codigo,
    extrair_nome,
    extrair_variaveis_js,
    getLattesIndexHtml,
    getLattesPViewHtml,
)


# ── helpers comuns ────────────────────────────────────────────────────────────

def _np(valor: float) -> float:
    """Normaliza pontuação para 2 casas decimais."""
    return round(valor, 2)


def _ano_minimo_professor() -> int:
    return date.today().year - 5


def _expandir_anos(anos: list) -> list:
    anos_validos = [int(a) for a in anos if str(a).isdigit()]
    if not anos_validos:
        return anos
    ano_atual = date.today().year
    ultimo = max(anos_validos)
    if ultimo >= ano_atual:
        return anos
    expandidos = list(anos)
    for a in range(ultimo + 1, ano_atual + 1):
        expandidos.append(str(a))
    return expandidos


def _normalizar_anos(anos: list) -> list:
    if not anos:
        return []
    anchors = [(i, int(a)) for i, a in enumerate(anos) if str(a).isdigit()]
    if not anchors:
        return [str(a).strip() for a in anos]
    base = anchors[0][1] - anchors[0][0]
    normalizados = [str(base + i) for i in range(len(anos))]
    return _expandir_anos(normalizados)


def _normalizar_serie(valores, tamanho: int) -> list:
    if valores in (None, [], [None], [[None]]):
        return [0] * tamanho
    if isinstance(valores, list) and len(valores) == 1 and isinstance(valores[0], list):
        valores = valores[0]
    serie = []
    for v in valores:
        try:
            serie.append(int(v) if v is not None else 0)
        except (TypeError, ValueError):
            serie.append(0)
    if len(serie) < tamanho:
        serie.extend([0] * (tamanho - len(serie)))
    return serie[:tamanho]


def _indices_apos(anos: list, ano_minimo: int) -> list:
    anos = _normalizar_anos(anos)
    return [i for i, a in enumerate(anos) if str(a).isdigit() and int(a) >= ano_minimo]


def _somar_vars(vjs: dict, chave_anos: str, nomes: list, ano_minimo: int) -> int:
    anos = _normalizar_anos(vjs.get(chave_anos) or [])
    indices = _indices_apos(anos, ano_minimo)
    if not indices:
        return 0
    total = 0
    for nome in nomes:
        serie = _normalizar_serie(vjs.get(nome), len(anos))
        total += sum(serie[i] for i in indices)
    return total


def _detalhar(quantidade: int | float, peso: float) -> dict:
    return {"quantidade": quantidade, "peso": peso, "pontos": _np(quantidade * peso)}


def _calcular_titulacao(preview_html: str) -> tuple:
    texto = unescape(re.sub(r"<[^>]+>", " ", preview_html or ""))
    texto = re.sub(r"\s+", " ", texto).strip().lower()
    if re.search(r"\bdoutor(?:a|ado)?\b|\bph\.?d\b", texto):
        return "Doutorado", 12
    if re.search(r"\bmestrado\b|\bmestre\b|\bmestra\b", texto):
        return "Mestrado", 8
    return "Não identificado", 0


def _contar_itens_secao(html: str, titulo: str) -> int:
    if not html:
        return 0
    m = re.search(re.escape(titulo), html, re.IGNORECASE)
    if not m:
        return 0
    resto = html[m.start():]
    prox = re.search(r'<h[1-6][^>]*class="[^"]*title-wrapper[^"]*"', resto, re.IGNORECASE)
    bloco = resto[:prox.start()] if prox and prox.start() > 0 else resto
    marcadores = re.findall(r">\s*(\d+)\.\s*<", bloco) or re.findall(r"\b(\d+)\.", unescape(re.sub(r"<[^>]+>", " ", bloco)))
    vistos, seq = set(), []
    for m in marcadores:
        if m not in vistos:
            vistos.add(m)
            seq.append(m)
    return len(seq)


def extract_publications(index_html: str) -> dict:
    if not index_html:
        return {"anos": [], "series": [], "anos_ultimos_5_anos": [], "series_ultimos_5_anos": [], "total_geral": 0}

    vjs = extrair_variaveis_js(index_html)
    anos = _normalizar_anos(vjs.get("barraAnosProducoesBibliograficas") or [])
    ano_min = _ano_minimo_professor()

    labels = {
        "valoresArtigosPublicadosPeriodicos":          "Artigos completos publicados em periódicos",
        "valoresArtigosResumidosPublicadosPeriodicos": "Resumos publicados em periódicos",
        "valoresTrabalhosPublicadosEventos":           "Trabalhos publicados em anais de evento",
        "valoresTrabalhosResumidosPublicadosEventos":  "Resumos publicados em anais de eventos",
        "valoresLivros":                               "Livros",
        "valoresCapitulos":                            "Capítulos de livros",
        "valoresOutrasProducoesBibliograficas":        "Outras produções bibliográficas",
    }

    series = []
    for var, label in labels.items():
        valores = _normalizar_serie(vjs.get(var), len(anos))
        total = sum(valores)
        if total == 0:
            continue
        series.append({"nome": label, "valores": valores, "por_ano": dict(zip(anos, valores)), "total": total})

    anos_ult = [a for a in anos if str(a).isdigit() and int(a) >= ano_min]
    start = len(anos) - len(anos_ult)

    series_ult = []
    for item in series:
        vals = item["valores"][start:] if anos_ult else []
        total_ult = sum(vals)
        if total_ult == 0:
            continue
        series_ult.append({"nome": item["nome"], "valores": vals, "por_ano": dict(zip(anos_ult, vals)), "total": total_ult})

    return {
        "anos": anos,
        "series": series,
        "anos_ultimos_5_anos": anos_ult,
        "series_ultimos_5_anos": series_ult,
        "total_geral": sum(s["total"] for s in series),
    }


def _pub_periodo(publicacoes: dict, nome: str, ano_min: int) -> int:
    for s in publicacoes.get("series", []):
        if s.get("nome") == nome:
            return sum(v for a, v in s.get("por_ano", {}).items() if str(a).isdigit() and int(a) >= ano_min)
    return 0


# ── calculadora 1: professor ──────────────────────────────────────────────────

def calcularBaremaProfessor(resultado: dict) -> dict:
    """Barema de concurso público para professores (lógica original)."""
    if not resultado or not resultado.get("success"):
        return {
            "success": False,
            "message": "Não foi possível calcular o barema sem uma coleta válida.",
            "detalhe": resultado.get("message") if resultado else None,
        }

    preview_html = resultado.get("preview_html") or ""
    index_html = resultado.get("index_html") or ""
    publicacoes = resultado.get("publicacoes") or {}
    vjs = extrair_variaveis_js(index_html)
    ano_min = _ano_minimo_professor()

    nivel_titulacao, pontos_titulacao = _calcular_titulacao(preview_html)

    qtd_patentes = _somar_vars(vjs, "barraAnosPatentes", ["valoesPatentes", "valoesOutrasPatentesRegistros", "valoesCultivarProtegida"], ano_min)
    if qtd_patentes == 0:
        qtd_patentes = max(
            _contar_itens_secao(preview_html, "Patentes e registros"),
            _contar_itens_secao(index_html, "Patentes e registros"),
        )

    qtd_artistica = _somar_vars(vjs, "barraAnosProducoesCulturais", ["valoesProducoesCulturais"], ano_min)
    qtd_tec = _somar_vars(vjs, "barraAnosProducoesTecnicas", ["valoesTrabalhosTecnicos"], ano_min)
    qtd_apres = _somar_vars(vjs, "barraAnosProducoesTecnicas", ["valoesApresentacoesDeTrabalhos"], ano_min)
    qtd_dout = _somar_vars(vjs, "barraAnosOrientacoes", ["valoresDoutorado"], ano_min)
    qtd_mest = _somar_vars(vjs, "barraAnosOrientacoes", ["valoresMestrado"], ano_min)
    qtd_demais = _somar_vars(vjs, "barraAnosOrientacoes", ["valoresOutrasOrientacoes"], ano_min)

    producao_itens = {
        "Artigo completo publicado em periódico":          _detalhar(_pub_periodo(publicacoes, "Artigos completos publicados em periódicos", ano_min), 3),
        "Livro":                                           _detalhar(_pub_periodo(publicacoes, "Livros", ano_min), 3),
        "Capítulo de livro":                               _detalhar(_pub_periodo(publicacoes, "Capítulos de livros", ano_min), 2),
        "Resumo publicado em periódico":                   _detalhar(_pub_periodo(publicacoes, "Resumos publicados em periódicos", ano_min), 1.5),
        "Resumo e trabalho publicado em Anais de evento":  _detalhar(_pub_periodo(publicacoes, "Trabalhos publicados em anais de evento", ano_min) + _pub_periodo(publicacoes, "Resumos publicados em anais de eventos", ano_min), 1),
        "Outras produções bibliográficas":                 _detalhar(_pub_periodo(publicacoes, "Outras produções bibliográficas", ano_min), 1),
        "Patente":                                         _detalhar(qtd_patentes, 3),
        "Produção artística/cultural":                     _detalhar(qtd_artistica, 3),
        "Trabalho Técnico":                                _detalhar(qtd_tec, 1),
    }
    prod_bruta = _np(sum(i["pontos"] for i in producao_itens.values()))
    prod_lim = min(prod_bruta, 30)
    tit_lim = min(pontos_titulacao, 12)

    formacao_itens = {
        "Doutorado (orientador)":                                        _detalhar(qtd_dout, 1.5),
        "Mestrado (orientador)":                                         _detalhar(qtd_mest, 1),
        "IC, IT, TCC, Especialização, PIBID, PIBEX, PET, Monitoria":    _detalhar(qtd_demais, 0.5),
    }
    form_bruta = _np(sum(i["pontos"] for i in formacao_itens.values()))
    form_lim = min(form_bruta, 12)

    eventos_itens = {"Apresentação de trabalho": _detalhar(qtd_apres, 0.5)}
    ev_bruto = _np(sum(i["pontos"] for i in eventos_itens.values()))
    ev_lim = min(ev_bruto, 6)

    total_bruto = _np(pontos_titulacao + prod_bruta + form_bruta + ev_bruto)
    total_lim = _np(tit_lim + prod_lim + form_lim + ev_lim)

    obs = []
    if pontos_titulacao == 0:
        obs.append("Titulação não identificada automaticamente.")
    if qtd_patentes == 0:
        obs.append(f"Nenhuma patente identificada a partir de {ano_min}.")
    if not any([qtd_dout, qtd_mest, qtd_demais]):
        obs.append(f"Nenhuma orientação concluída encontrada a partir de {ano_min}.")

    return {
        "success": True,
        "tipo": "professor",
        "message": "Barema calculado com sucesso.",
        "titulacao":                  {"nivel_maximo": nivel_titulacao, "subtotal_bruto": _np(pontos_titulacao), "subtotal_limitado": tit_lim},
        "producao":                   {"itens": producao_itens, "subtotal_bruto": prod_bruta, "subtotal_limitado": prod_lim},
        "formacao_recursos_humanos":  {"itens": formacao_itens, "subtotal_bruto": form_bruta, "subtotal_limitado": form_lim},
        "participacao_eventos_comite":{"itens": eventos_itens,  "subtotal_bruto": ev_bruto,   "subtotal_limitado": ev_lim},
        "total_bruto":    total_bruto,
        "total_limitado": total_lim,
        "observacoes": obs,
    }


# ── calculadora 2: AERI ───────────────────────────────────────────────────────

def calcularBaremaAERI(resultado: dict, data_ingresso: str | None = None) -> dict:
    """
    Barema do Edital 02/2025 AERI/UEFS — Currículo Lattes (critério 3).

    Calcula apenas a parte do Lattes (máx 40 pontos brutos antes da normalização):
      3.1 Participação/Organização em Eventos  (máx 10)
      3.2 Produção Científica/Tecnológica      (máx 10)
      3.3 Representação/Liderança Estudantil   (máx 10)
      3.4 Programas Acadêmicos / Estágios      (máx 10)

    O edital diz que só conta produção APÓS o ingresso na UEFS.
    data_ingresso: "AAAA-MM-DD" ou "AAAA"
    """
    if not resultado or not resultado.get("success"):
        return {
            "success": False,
            "message": "Não foi possível calcular o barema sem uma coleta válida.",
            "detalhe": resultado.get("message") if resultado else None,
        }

    # Ano mínimo = ingresso na UEFS (ou 5 anos atrás se não informado)
    if data_ingresso:
        try:
            ano_min = int(str(data_ingresso)[:4])
        except (ValueError, TypeError):
            ano_min = _ano_minimo_professor()
    else:
        ano_min = _ano_minimo_professor()

    index_html = resultado.get("index_html") or ""
    publicacoes = resultado.get("publicacoes") or {}
    vjs = extrair_variaveis_js(index_html)

    # ── 3.1 Participação/Organização em Eventos (máx 10) ─────────────────────
    # O graficos.do não detalha tipo de participação — somamos tudo de eventos
    # e apresentações como participação geral (0,10 por evento)
    qtd_eventos_congressos = _somar_vars(
        vjs, "barraAnosParticipacaoEventos",
        ["valoresParticipacaoEventos", "valoresEventosCongressos"], ano_min
    )
    # Apresentações de trabalho (comunicação oral, pôster) → 1,00 cada
    qtd_apresentacoes = _somar_vars(
        vjs, "barraAnosProducoesTecnicas",
        ["valoesApresentacoesDeTrabalhos"], ano_min
    )
    # Organização de eventos → 1,00 cada
    qtd_org_eventos = _somar_vars(
        vjs, "barraAnosProducoesTecnicas",
        ["valoesOrganizacaoEventos", "valoesEventosOrganizados"], ano_min
    )
    # Cursos de idioma e livres — extraídos de formação complementar
    qtd_formacao_complementar = _somar_vars(
        vjs, "barraAnosFormacaoComplementar",
        ["valoresFormacaoComplementar", "valoresCursosLivres", "valoresIdiomas"], ano_min
    )

    eventos_itens = {
        "Comunicação oral / Apresentação de pôster":  _detalhar(qtd_apresentacoes, 1.00),
        "Organização de evento científico":            _detalhar(qtd_org_eventos, 1.00),
        "Participação em eventos (congressos, etc.)":  _detalhar(qtd_eventos_congressos, 0.10),
        "Cursos livres (+30h) / Cursos de idioma":     _detalhar(qtd_formacao_complementar, 1.00),
    }
    eventos_bruto = _np(sum(i["pontos"] for i in eventos_itens.values()))
    eventos_lim = min(eventos_bruto, 10.0)

    # ── 3.2 Produção Científica, Tecnológica e Artística (máx 10) ────────────
    qtd_artigos = _pub_periodo(publicacoes, "Artigos completos publicados em periódicos", ano_min)
    qtd_res_anais = _pub_periodo(publicacoes, "Resumos publicados em anais de eventos", ano_min)
    qtd_res_exp = 0  # resumos expandidos — agrupados em "outras produções"
    qtd_trab_completos = _pub_periodo(publicacoes, "Trabalhos publicados em anais de evento", ano_min)
    qtd_outras_bib = _pub_periodo(publicacoes, "Outras produções bibliográficas", ano_min)
    qtd_artistica = _somar_vars(vjs, "barraAnosProducoesCulturais", ["valoesProducoesCulturais"], ano_min)

    producao_itens = {
        "Artigos completos publicados em periódicos":  _detalhar(qtd_artigos, 5.00),
        "Textos em jornais/revistas (outras prod.)":   _detalhar(qtd_outras_bib, 1.00),
        "Resumos publicados em anais":                 _detalhar(qtd_res_anais, 0.50),
        "Resumos expandidos em anais":                 _detalhar(qtd_res_exp, 1.00),
        "Trabalhos completos em anais":                _detalhar(qtd_trab_completos, 5.00),
        "Exposições ou apresentações artísticas":      _detalhar(qtd_artistica, 5.00),
    }
    producao_bruta = _np(sum(i["pontos"] for i in producao_itens.values()))
    producao_lim = min(producao_bruta, 10.0)

    # ── 3.3 Representação/Liderança Estudantil (máx 10) ──────────────────────
    # Não disponível no graficos.do — informar ao candidato para comprovar
    qtd_representacao_anos = 0
    qtd_lideranca_anos = 0

    lideranca_itens = {
        "Representação estudantil (por ano)":  _detalhar(qtd_representacao_anos, 1.00),
        "Cargo de liderança (por ano)":         _detalhar(qtd_lideranca_anos, 1.00),
    }
    lideranca_bruta = _np(sum(i["pontos"] for i in lideranca_itens.values()))
    lideranca_lim = min(lideranca_bruta, 10.0)

    # ── 3.4 Programas Acadêmicos / Estágios (máx 10) ─────────────────────────
    # Orientações no Lattes = IC, PIBIC, PIBEX, voluntário, estágio
    qtd_ic_voluntario = _somar_vars(
        vjs, "barraAnosOrientacoes",
        ["valoresOutrasOrientacoes", "valoresIC", "valoresPIBIC", "valoresPIBEX"], ano_min
    )

    programas_itens = {
        "Bolsista / Voluntário / Estágio (por ano)": _detalhar(qtd_ic_voluntario, 5.00),
    }
    programas_bruta = _np(sum(i["pontos"] for i in programas_itens.values()))
    programas_lim = min(programas_bruta, 10.0)

    # ── total Lattes ──────────────────────────────────────────────────────────
    total_bruto = _np(eventos_bruto + producao_bruta + lideranca_bruta + programas_bruta)
    total_lim = _np(eventos_lim + producao_lim + lideranca_lim + programas_lim)

    obs = []
    obs.append(f"Pontuação considera produção a partir de {ano_min} (data de ingresso informada)." if data_ingresso else f"Data de ingresso não informada — considerados os últimos 5 anos (a partir de {ano_min}).")
    if lideranca_bruta == 0:
        obs.append("Representação/Liderança estudantil não está disponível no graficos.do. O candidato deve comprovar manualmente junto à AERI.")
    if programas_bruta == 0:
        obs.append(f"Nenhum programa acadêmico/estágio identificado a partir de {ano_min}.")

    return {
        "success": True,
        "tipo": "aeri",
        "edital": "02/2025 AERI/UEFS",
        "message": "Barema Lattes calculado com sucesso.",
        "ano_minimo_considerado": ano_min,
        "participacao_eventos": {
            "itens": eventos_itens,
            "subtotal_bruto":    eventos_bruto,
            "subtotal_limitado": eventos_lim,
            "limite": 10.0,
        },
        "producao_cientifica": {
            "itens": producao_itens,
            "subtotal_bruto":    producao_bruta,
            "subtotal_limitado": producao_lim,
            "limite": 10.0,
        },
        "lideranca_estudantil": {
            "itens": lideranca_itens,
            "subtotal_bruto":    lideranca_bruta,
            "subtotal_limitado": lideranca_lim,
            "limite": 10.0,
            "aviso": "Não extraível automaticamente — requer comprovação manual.",
        },
        "programas_academicos": {
            "itens": programas_itens,
            "subtotal_bruto":    programas_bruta,
            "subtotal_limitado": programas_lim,
            "limite": 10.0,
        },
        "total_bruto":    total_bruto,
        "total_limitado": total_lim,
        "observacoes": obs,
    }


# ── ponto de entrada ──────────────────────────────────────────────────────────

def buscaLattes(code_input: str, tipo: str = "professor", data_ingresso: str | None = None) -> dict:
    """
    Parâmetros:
      code_input     — código alfanumérico do Lattes (ex: K8981454J6)
      tipo           — "professor" ou "aeri"
      data_ingresso  — "AAAA-MM-DD" ou "AAAA" (obrigatório para tipo="aeri")
    """
    
    code = _validar_codigo(code_input)
    if not code:
        return {
            "success": False,
            "code": None,
            "message": (
                "Código inválido. Informe o código alfanumérico do currículo (ex: K8981454J6), "
                "visível na URL ao acessar o Lattes logado."
            ),
        }

    session = _criar_sessao()
    preview_html = getLattesPViewHtml(code, session)
    index_html = getLattesIndexHtml(code, session)
    nome = extrair_nome(preview_html)

    resultado = {
        "success": bool(index_html),
        "code": code,
        "nome": nome,
        "preview_html": preview_html,
        "index_html": index_html,
        "publicacoes": extract_publications(index_html),
        "message": "Coleta realizada com sucesso." if index_html else "Não foi possível carregar os índices do currículo.",
    }

    if tipo == "aeri":
        resultado["barema"] = calcularBaremaAERI(resultado, data_ingresso)
    else:
        resultado["barema"] = calcularBaremaProfessor(resultado)

    consulta_id = registrar_consulta(code_input, resultado)
    if resultado.get("success"):
        registrar_barema(consulta_id, code, nome, resultado.get("barema"))

    resultado.pop("preview_html", None)
    resultado.pop("index_html", None)

    return resultado
