"""
Scraping das páginas públicas do Lattes (CNPq).

O usuário fornece o código alfanumérico do currículo (ex: K8981454J6),
visível na URL ao acessar o Lattes logado. O CAPTCHA só aparece na rota
de busca por número público — as rotas preview.do e graficos.do são livres.
"""

import ast
import re
import time

import requests


DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Connection": "close",
}

MAX_RETRIES = 5
RETRY_DELAY = 2


def _criar_sessao() -> requests.Session:
    """Cria uma sessão com cookies válidos do buscatextual."""
    session = requests.Session()
    try:
        session.get(
            "http://buscatextual.cnpq.br/buscatextual/",
            headers=DEFAULT_HEADERS,
            timeout=15,
        )
    except requests.RequestException:
        pass
    return session


def _validar_codigo(code: str) -> str | None:
    """
    Aceita:
      - Código alfanumérico direto:  K8981454J6
      - URL completa do visualizacv: http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=K8981454J6
    Rejeita número público (só dígitos) — requer CAPTCHA.
    """
    code = str(code or "").strip()
    if not code:
        return None

    # Extrai id= de uma URL completa
    match = re.search(r"[?&]id=([A-Za-z0-9]+)", code)
    if match:
        return match.group(1)

    # Código alfanumérico puro (letra + dígitos + letra no final)
    if re.fullmatch(r"[A-Za-z][A-Za-z0-9]+", code) and not code.isdigit():
        return code

    return None


def getLattesPViewHtml(code: str, session: requests.Session | None = None) -> str | None:
    """Retorna o HTML da página de preview do currículo."""
    session = session or _criar_sessao()
    url = f"http://buscatextual.cnpq.br/buscatextual/preview.do?metodo=apresentar&id={code}"

    for attempt in range(MAX_RETRIES):
        try:
            response = session.get(url, headers=DEFAULT_HEADERS, timeout=15)
            response.raise_for_status()
            response.encoding = "ISO-8859-1"
            return response.text
        except requests.RequestException:
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            continue

    return None


def getLattesIndexHtml(code: str, session: requests.Session | None = None) -> str | None:
    """Retorna o HTML da página de índices de produção (graficos.do)."""
    session = session or _criar_sessao()
    url = f"http://buscatextual.cnpq.br/buscatextual/graficos.do?metodo=apresentar&codRHCript={code}"

    for attempt in range(MAX_RETRIES):
        try:
            response = session.get(url, headers=DEFAULT_HEADERS, timeout=15)
            response.raise_for_status()
            return response.text
        except requests.RequestException:
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)
            continue

    return None


def extrair_variaveis_js(html: str) -> dict:
    """Extrai arrays JavaScript da página de índices."""
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


def extrair_nome(preview_html: str) -> str | None:
    """Extrai o nome do pesquisador do HTML de preview."""
    if not preview_html:
        return None

    match = re.search(r"var\s+nome\s*=\s*'([^']+)'", preview_html, re.IGNORECASE)
    if match:
        from html import unescape
        return unescape(match.group(1)).strip()

    return None
