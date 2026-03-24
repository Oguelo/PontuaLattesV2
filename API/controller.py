import ast
import re
from datetime import date
from html import unescape

from service import collect_lattes_data


# Armazena o conteúdo retornado
conteudo_lattes = None


def _normalizar_pontuacao(valor):
	return round(valor, 2)


def _obter_ano_minimo_barema():
	return date.today().year - 5


def _extrair_variaveis_js(html):
	variaveis = {}

	if not html:
		return variaveis

	for nome, conteudo in re.findall(r"var\s+([A-Za-z0-9_]+)\s*=\s*(\[.*?\]);", html, re.DOTALL):
		array_text = re.sub(r"\bnull\b", "None", conteudo)

		try:
			variaveis[nome] = ast.literal_eval(array_text)
		except (ValueError, SyntaxError):
			continue

	return variaveis


def _normalizar_serie(valores, tamanho):
	if valores in (None, [], [None], [[None]]):
		return [0] * tamanho

	if isinstance(valores, list) and len(valores) == 1 and isinstance(valores[0], list):
		valores = valores[0]

	serie = []
	for valor in valores:
		if valor is None:
			serie.append(0)
			continue

		try:
			serie.append(int(valor))
		except (TypeError, ValueError):
			serie.append(0)

	if len(serie) < tamanho:
		serie.extend([0] * (tamanho - len(serie)))

	return serie[:tamanho]


def _somar_series_por_ano(variaveis_js, nome_anos, padroes, ano_minimo=None):
	ano_minimo = _obter_ano_minimo_barema() if ano_minimo is None else ano_minimo
	anos = variaveis_js.get(nome_anos) or []
	indices_validos = [
		indice
		for indice, ano in enumerate(anos)
		if str(ano).isdigit() and int(ano) >= ano_minimo
	]

	if not indices_validos:
		return 0

	variaveis_encontradas = set()
	for nome_variavel in variaveis_js:
		nome_variavel_lower = nome_variavel.lower()
		if any(all(token in nome_variavel_lower for token in padrao) for padrao in padroes):
			variaveis_encontradas.add(nome_variavel)

	total = 0
	for nome_variavel in variaveis_encontradas:
		serie = _normalizar_serie(variaveis_js.get(nome_variavel), len(anos))
		total += sum(serie[indice] for indice in indices_validos)

	return total


def _calcular_titulacao(preview_html):
	texto = unescape(re.sub(r"<[^>]+>", " ", preview_html or ""))
	texto = re.sub(r"\s+", " ", texto).strip().lower()

	if re.search(r"\bdoutor(?:ado)?\b|\bphd\b", texto):
		return "Doutorado", 12

	if re.search(r"\bmestrado\b|\bmestre\b", texto):
		return "Mestrado", 8

	return "Não identificado", 0


def _contar_itens_numerados_secao(html, titulo_secao):
	if not html:
		return 0

	padrao_inicio = re.compile(re.escape(titulo_secao), re.IGNORECASE)
	inicio = padrao_inicio.search(html)
	if not inicio:
		return 0

	resto = html[inicio.start():]
	proximo_titulo = re.search(r'<h[1-6][^>]*class="[^"]*title-wrapper[^"]*"[^>]*>', resto, re.IGNORECASE)
	if proximo_titulo and proximo_titulo.start() > 0:
		bloco = resto[:proximo_titulo.start()]
	else:
		bloco = resto

	marcadores = re.findall(r">\s*(\d+)\.\s*<", bloco)
	if not marcadores:
		texto_bloco = unescape(re.sub(r"<[^>]+>", " ", bloco))
		marcadores = re.findall(r"\b(\d+)\.", texto_bloco)

	if not marcadores:
		return 0

	sequencia = []
	vistos = set()
	for marcador in marcadores:
		if marcador not in vistos:
			vistos.add(marcador)
			sequencia.append(marcador)

	return len(sequencia)


def _contar_patentes(preview_html, index_html):
	quantidade_preview = _contar_itens_numerados_secao(preview_html, "Patentes e registros")
	if quantidade_preview:
		return quantidade_preview

	quantidade_index = _contar_itens_numerados_secao(index_html, "Patentes e registros")
	if quantidade_index:
		return quantidade_index

	return 0


def _detalhar_item(quantidade, peso):
	pontos = quantidade * peso
	return {
		"quantidade": quantidade,
		"peso": peso,
		"pontos": _normalizar_pontuacao(pontos),
	}


def _obter_total_publicacoes_periodo(publicacoes, ano_minimo):
	series = publicacoes.get("series", []) if publicacoes else []
	totais = {}

	for item in series:
		por_ano = item.get("por_ano") or {}
		totais[item.get("nome")] = sum(
			int(valor)
			for ano, valor in por_ano.items()
			if str(ano).isdigit() and int(ano) >= ano_minimo
		)

	return totais


# Guarda o conteúdo da busca
def getConteudo(resultado):
	global conteudo_lattes
	conteudo_lattes = resultado
	return conteudo_lattes


def calcularBarema(resultado=None):
	dados_lattes = getConteudo(resultado) if resultado is not None else conteudo_lattes

	if not dados_lattes:
		return {
			"success": False,
			"message": "Nenhum conteúdo do Lattes foi carregado.",
		}

	if not dados_lattes.get("success"):
		return {
			"success": False,
			"message": "Não foi possível calcular o barema sem uma coleta válida.",
			"detalhe": dados_lattes.get("message"),
		}

	preview_html = dados_lattes.get("preview_html") or ""
	index_html = dados_lattes.get("index_html") or ""
	publicacoes = dados_lattes.get("publicacoes") or {}
	variaveis_js = _extrair_variaveis_js(index_html)
	ano_minimo = _obter_ano_minimo_barema()
	publicacoes_periodo = _obter_total_publicacoes_periodo(publicacoes, ano_minimo)

	nivel_titulacao, pontos_titulacao = _calcular_titulacao(preview_html)

	quantidade_patentes = _contar_patentes(preview_html, index_html)
	quantidade_producao_artistica = _somar_series_por_ano(
		variaveis_js,
		"barraAnosProducoesCulturais",
		[("cultur",), ("artist",)],
	)
	quantidade_trabalho_tecnico = _somar_series_por_ano(
		variaveis_js,
		"barraAnosProducoesTecnicas",
		[("trabalh", "tecn")],
	)
	quantidade_apresentacao_trabalho = _somar_series_por_ano(
		variaveis_js,
		"barraAnosProducoesTecnicas",
		[("apresent", "trabalh")],
	)
	quantidade_orientacao_doutorado = _somar_series_por_ano(
		variaveis_js,
		"barraAnosOrientacoes",
		[("orient", "dout")],
	)
	quantidade_orientacao_mestrado = _somar_series_por_ano(
		variaveis_js,
		"barraAnosOrientacoes",
		[("orient", "mestr")],
	)
	quantidade_orientacao_demais = _somar_series_por_ano(
		variaveis_js,
		"barraAnosOrientacoes",
		[
			("orient", "ic"),
			("orient", "it"),
			("orient", "tcc"),
			("orient", "especial"),
			("orient", "pibid"),
			("orient", "pibex"),
			("orient", "pet"),
			("orient", "monitor"),
			("orient", "inici"),
		],
	)

	producao_itens = {
		"Artigo completo publicado em periódico": _detalhar_item(
			publicacoes_periodo.get("Artigos completos publicados em periódicos", 0),
			3,
		),
		"Livro": _detalhar_item(publicacoes_periodo.get("Livros", 0), 3),
		"Capítulo de livro": _detalhar_item(publicacoes_periodo.get("Capítulos de livros", 0), 2),
		"Resumo publicado em periódico": _detalhar_item(
			publicacoes_periodo.get("Resumos publicados em periódicos", 0),
			1.5,
		),
		"Resumo e trabalho publicado em Anais de evento": _detalhar_item(
			publicacoes_periodo.get("Trabalhos publicados em anais de evento", 0)
			+ publicacoes_periodo.get("Resumos publicados em anais de eventos", 0),
			1,
		),
		"Outras produções bibliográficas": _detalhar_item(
			publicacoes_periodo.get("Outras produções bibliográficas", 0),
			1,
		),
		"Patente": _detalhar_item(quantidade_patentes, 3),
		"Produção artística/cultural": _detalhar_item(quantidade_producao_artistica, 3),
		"Trabalho Técnico": _detalhar_item(quantidade_trabalho_tecnico, 1),
	}
	producao_bruta = _normalizar_pontuacao(sum(item["pontos"] for item in producao_itens.values()))
	producao_limitada = min(producao_bruta, 30)

	formacao_itens = {
		"Doutorado (orientador)": _detalhar_item(quantidade_orientacao_doutorado, 1.5),
		"Mestrado (orientador)": _detalhar_item(quantidade_orientacao_mestrado, 1),
		"IC, IT, TCC, Especialização, PIBID, PIBEX, PET, Monitoria": _detalhar_item(
			quantidade_orientacao_demais,
			0.5,
		),
	}
	formacao_bruta = _normalizar_pontuacao(sum(item["pontos"] for item in formacao_itens.values()))
	formacao_limitada = min(formacao_bruta, 12)

	eventos_itens = {
		"Apresentação de trabalho": _detalhar_item(quantidade_apresentacao_trabalho, 0.5),
	}
	eventos_bruto = _normalizar_pontuacao(sum(item["pontos"] for item in eventos_itens.values()))
	eventos_limitado = min(eventos_bruto, 6)

	total_bruto = _normalizar_pontuacao(pontos_titulacao + producao_bruta + formacao_bruta + eventos_bruto)
	total_limitado = min(total_bruto, 60)

	observacoes = []
	if pontos_titulacao == 0:
		observacoes.append("Titulação não identificada automaticamente.")
	if quantidade_patentes == 0:
		observacoes.append(f"Nenhuma patente identificada nos índices carregados a partir de {ano_minimo}.")
	if quantidade_orientacao_doutorado == 0 and quantidade_orientacao_mestrado == 0 and quantidade_orientacao_demais == 0:
		observacoes.append(f"Nenhuma orientação concluída foi encontrada nos índices carregados a partir de {ano_minimo}.")

	return {
		"success": True,
		"message": "Barema calculado com sucesso.",
		"titulacao": {
			"nivel_maximo": nivel_titulacao,
			"subtotal_bruto": _normalizar_pontuacao(pontos_titulacao),
			"subtotal_limitado": min(pontos_titulacao, 12),
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


# Busca os dados no service
def buscaLattes(url):
	resultado = collect_lattes_data(url)
	conteudo = getConteudo(resultado)
	conteudo["barema"] = calcularBarema()
	return conteudo
