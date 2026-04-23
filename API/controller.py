import re
from datetime import date
from html import unescape

from database import registrar_barema, registrar_consulta
from service import (
    _validar_codigo,
    _criar_sessao,
    extrair_nome,
    extrair_variaveis_js,
    getLattesIndexHtml,
    getLattesPViewHtml,
)


# ── helpers ───────────────────────────────────────────────────────────────────

def _normalizar_pontuacao(valor: float) -> float:
    return round(valor, 2)


def _ano_minimo_barema() -> int:
    return date.today().year - 5


def _normalizar_serie(valores, tamanho: int) -> list:
    if valores in (None, [], [None], [[None]]):
        return [0] * tamanho

    if isinstance(valores, list) and len(valores) == 1 and isinstance(valores[0], list):
        valores = valores[0]

    serie = []
    for valor in valores:
        try:
            serie.append(int(valor) if valor is not None else 0)
        except (TypeError, ValueError):
            serie.append(0)

    if len(serie) < tamanho:
        serie.extend([0] * (tamanho - len(serie)))

    return serie[:tamanho]


def _normalizar_anos(anos: list) -> list:
    if not anos:
        return []

    anchors = [
        (i, int(a)) for i, a in enumerate(anos) if str(a).isdigit()
    ]
    if not anchors:
        return [str(a).strip() for a in anos]

    base = anchors[0][1] - anchors[0][0]
    ano_atual = date.today().year
    anos_normalizados = [str(base + i) for i in range(len(anos))]

    ultimo = max(int(a) for a in anos_normalizados if str(a).isdigit())
    if ultimo < ano_atual:
        for ano in range(ultimo + 1, ano_atual + 1):
            anos_normalizados.append(str(ano))

    return anos_normalizados


def _indices_validos(anos: list, ano_minimo: int) -> list:
    anos = _normalizar_anos(anos)
    return [i for i, a in enumerate(anos) if str(a).isdigit() and int(a) >= ano_minimo]


def _somar_variaveis(variaveis_js: dict, nome_anos: str, nomes_variaveis: list, ano_minimo: int) -> int:
    anos = _normalizar_anos(variaveis_js.get(nome_anos) or [])
    indices = _indices_validos(anos, ano_minimo)
    if not indices:
        return 0

    total = 0
    for nome in nomes_variaveis:
        serie = _normalizar_serie(variaveis_js.get(nome), len(anos))
        total += sum(serie[i] for i in indices)
    return total


def _somar_padroes(variaveis_js: dict, nome_anos: str, padroes: list, ano_minimo: int) -> int:
    anos = _normalizar_anos(variaveis_js.get(nome_anos) or [])
    indices = _indices_validos(anos, ano_minimo)
    if not indices:
        return 0

    encontradas = {
        nome for nome in variaveis_js
        if any(all(t in nome.lower() for t in padrao) for padrao in padroes)
    }

    total = 0
    for nome in encontradas:
        serie = _normalizar_serie(variaveis_js.get(nome), len(anos))
        total += sum(serie[i] for i in indices)
    return total


def _detalhar_item(quantidade: int, peso: float) -> dict:
    return {
        "quantidade": quantidade,
        "peso": peso,
        "pontos": _normalizar_pontuacao(quantidade * peso),
    }


def _calcular_titulacao(preview_html: str) -> tuple:
    if not preview_html:
        return "Não identificado", 0

    texto = unescape(re.sub(r"<[^>]+>", " ", preview_html))
    texto = re.sub(r"\s+", " ", texto).strip().lower()

    if re.search(r"\bdoutor(?:a|ado)?\b|\bph\.?d\b", texto):
        return "Doutorado", 12
    if re.search(r"\bmestrado\b|\bmestre\b|\bmestra\b", texto):
        return "Mestrado", 8
    return "Não identificado", 0


def _contar_itens_numerados(html: str, titulo_secao: str) -> int:
    if not html:
        return 0

    inicio = re.search(re.escape(titulo_secao), html, re.IGNORECASE)
    if not inicio:
        return 0

    resto = html[inicio.start():]
    proximo = re.search(r'<h[1-6][^>]*class="[^"]*title-wrapper[^"]*"', resto, re.IGNORECASE)
    bloco = resto[:proximo.start()] if proximo and proximo.start() > 0 else resto

    marcadores = re.findall(r">\s*(\d+)\.\s*<", bloco)
    if not marcadores:
        texto = unescape(re.sub(r"<[^>]+>", " ", bloco))
        marcadores = re.findall(r"\b(\d+)\.", texto)

    vistos, sequencia = set(), []
    for m in marcadores:
        if m not in vistos:
            vistos.add(m)
            sequencia.append(m)

    return len(sequencia)


# ── extração de publicações ───────────────────────────────────────────────────

def extract_publications(index_html: str) -> dict:
    if not index_html:
        return {"anos": [], "series": [], "anos_ultimos_5_anos": [], "series_ultimos_5_anos": [], "total_geral": 0}

    variaveis_js = extrair_variaveis_js(index_html)
    anos = _normalizar_anos(variaveis_js.get("barraAnosProducoesBibliograficas") or [])
    ano_minimo = _ano_minimo_barema()

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
        valores = _normalizar_serie(variaveis_js.get(var), len(anos))
        total = sum(valores)
        if total == 0:
            continue
        series.append({
            "nome": label,
            "valores": valores,
            "por_ano": dict(zip(anos, valores)),
            "total": total,
        })

    anos_ultimos = [a for a in anos if str(a).isdigit() and int(a) >= ano_minimo]
    start = len(anos) - len(anos_ultimos)

    series_ultimos = []
    for item in series:
        vals = item["valores"][start:] if anos_ultimos else []
        total_ult = sum(vals)
        if total_ult == 0:
            continue
        series_ultimos.append({
            "nome": item["nome"],
            "valores": vals,
            "por_ano": dict(zip(anos_ultimos, vals)),
            "total": total_ult,
        })

    return {
        "anos": anos,
        "series": series,
        "anos_ultimos_5_anos": anos_ultimos,
        "series_ultimos_5_anos": series_ultimos,
        "total_geral": sum(s["total"] for s in series),
    }


# ── cálculo do barema ─────────────────────────────────────────────────────────

def calcularBarema(resultado: dict) -> dict:
    if not resultado or not resultado.get("success"):
        return {
            "success": False,
            "message": "Não foi possível calcular o barema sem uma coleta válida.",
            "detalhe": resultado.get("message") if resultado else None,
        }

    preview_html = resultado.get("preview_html") or ""
    index_html = resultado.get("index_html") or ""
    publicacoes = resultado.get("publicacoes") or {}
    variaveis_js = extrair_variaveis_js(index_html)
    ano_minimo = _ano_minimo_barema()

    nivel_titulacao, pontos_titulacao = _calcular_titulacao(preview_html)

    def pub_periodo(nome: str) -> int:
        for s in publicacoes.get("series", []):
            if s.get("nome") == nome:
                return sum(
                    v for a, v in s.get("por_ano", {}).items()
                    if str(a).isdigit() and int(a) >= ano_minimo
                )
        return 0

    quantidade_patentes = _somar_variaveis(
        variaveis_js, "barraAnosPatentes",
        ["valoesPatentes", "valoesOutrasPatentesRegistros", "valoesCultivarProtegida"], ano_minimo
    )
    if quantidade_patentes == 0:
        quantidade_patentes = max(
            _contar_itens_numerados(preview_html, "Patentes e registros"),
            _contar_itens_numerados(index_html, "Patentes e registros"),
        )

    quantidade_producao_artistica = _somar_padroes(
        variaveis_js, "barraAnosProducoesCulturais", [("cultur",), ("artist",)], ano_minimo
    )
    quantidade_trabalho_tecnico = _somar_variaveis(
        variaveis_js, "barraAnosProducoesTecnicas", ["valoesTrabalhosTecnicos"], ano_minimo
    )
    quantidade_apresentacao = _somar_variaveis(
        variaveis_js, "barraAnosProducoesTecnicas", ["valoesApresentacoesDeTrabalhos"], ano_minimo
    )
    quantidade_dout = _somar_variaveis(
        variaveis_js, "barraAnosOrientacoes", ["valoresDoutorado"], ano_minimo
    )
    quantidade_mest = _somar_variaveis(
        variaveis_js, "barraAnosOrientacoes", ["valoresMestrado"], ano_minimo
    )
    quantidade_demais = _somar_variaveis(
        variaveis_js, "barraAnosOrientacoes", ["valoresOutrasOrientacoes"], ano_minimo
    )

    producao_itens = {
        "Artigo completo publicado em periódico":       _detalhar_item(pub_periodo("Artigos completos publicados em periódicos"), 3),
        "Livro":                                        _detalhar_item(pub_periodo("Livros"), 3),
        "Capítulo de livro":                            _detalhar_item(pub_periodo("Capítulos de livros"), 2),
        "Resumo publicado em periódico":                _detalhar_item(pub_periodo("Resumos publicados em periódicos"), 1.5),
        "Resumo e trabalho publicado em Anais de evento": _detalhar_item(
            pub_periodo("Trabalhos publicados em anais de evento") + pub_periodo("Resumos publicados em anais de eventos"), 1
        ),
        "Outras produções bibliográficas":              _detalhar_item(pub_periodo("Outras produções bibliográficas"), 1),
        "Patente":                                      _detalhar_item(quantidade_patentes, 3),
        "Produção artística/cultural":                  _detalhar_item(quantidade_producao_artistica, 3),
        "Trabalho Técnico":                             _detalhar_item(quantidade_trabalho_tecnico, 1),
    }

    producao_bruta = _normalizar_pontuacao(sum(i["pontos"] for i in producao_itens.values()))
    producao_limitada = min(producao_bruta, 30)
    titulacao_limitada = min(pontos_titulacao, 12)

    formacao_itens = {
        "Doutorado (orientador)":                                           _detalhar_item(quantidade_dout, 1.5),
        "Mestrado (orientador)":                                            _detalhar_item(quantidade_mest, 1),
        "IC, IT, TCC, Especialização, PIBID, PIBEX, PET, Monitoria":       _detalhar_item(quantidade_demais, 0.5),
    }
    formacao_bruta = _normalizar_pontuacao(sum(i["pontos"] for i in formacao_itens.values()))
    formacao_limitada = min(formacao_bruta, 12)

    eventos_itens = {
        "Apresentação de trabalho": _detalhar_item(quantidade_apresentacao, 0.5),
    }
    eventos_bruto = _normalizar_pontuacao(sum(i["pontos"] for i in eventos_itens.values()))
    eventos_limitado = min(eventos_bruto, 6)

    total_bruto = _normalizar_pontuacao(pontos_titulacao + producao_bruta + formacao_bruta + eventos_bruto)
    total_limitado = _normalizar_pontuacao(titulacao_limitada + producao_limitada + formacao_limitada + eventos_limitado)

    observacoes = []
    if pontos_titulacao == 0:
        observacoes.append("Titulação não identificada automaticamente.")
    if quantidade_patentes == 0:
        observacoes.append(f"Nenhuma patente identificada a partir de {ano_minimo}.")
    if not any([quantidade_dout, quantidade_mest, quantidade_demais]):
        observacoes.append(f"Nenhuma orientação concluída encontrada a partir de {ano_minimo}.")

    return {
        "success": True,
        "message": "Barema calculado com sucesso.",
        "titulacao": {
            "nivel_maximo": nivel_titulacao,
            "subtotal_bruto": _normalizar_pontuacao(pontos_titulacao),
            "subtotal_limitado": titulacao_limitada,
        },
        "producao": {
            "itens": producao_itens,
            "subtotal_bruto": producao_bruta,
            "subtotal_limitado": producao_limitada,
        },
        "formacao_recursos_humanos": {
            "itens": formacao_itens,
            "subtotal_bruto": formacao_bruta,
            "subtotal_limitado": formacao_limitada,
        },
        "participacao_eventos_comite": {
            "itens": eventos_itens,
            "subtotal_bruto": eventos_bruto,
            "subtotal_limitado": eventos_limitado,
        },
        "total_bruto": total_bruto,
        "total_limitado": total_limitado,
        "observacoes": observacoes,
    }


# ── ponto de entrada ──────────────────────────────────────────────────────────

def buscaLattes(code_input: str) -> dict:
    """
    Recebe o código alfanumérico do Lattes (ex: K8981454J6)
    e retorna os dados estruturados com o barema calculado.
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

    resultado["barema"] = calcularBarema(resultado)

    consulta_id = registrar_consulta(code_input, resultado)
    if resultado.get("success"):
        registrar_barema(consulta_id, code, nome, resultado.get("barema"))

    # Remove HTMLs brutos antes de retornar ao cliente
    resultado.pop("preview_html", None)
    resultado.pop("index_html", None)

    return resultado
