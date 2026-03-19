import requests
import re
import time
from urllib.parse import urlparse


def _is_request_error(value):
    return isinstance(value, str) and (
        "http" in value.lower()
        or "erro" in value.lower()
        or "failed" in value.lower()
        or "timed out" in value.lower()
    )


def normalize_lattes_url(url):
    parsed = urlparse(url.strip())

    if not parsed.scheme:
        return f"http://{url.strip()}"

    if parsed.scheme == "https" and parsed.netloc.lower() == "lattes.cnpq.br":
        return parsed._replace(scheme="http").geturl()

    return url.strip()

# Busca o código do Lattes
def get_lattes_code(url):
    url = normalize_lattes_url(url)
    html = ""
    for i in range(5):
        try:
            # Faz a requisição
            resposta = requests.get(url, timeout=10)
            resposta.raise_for_status()  # Verifica erros HTTP
            html = resposta.text
            break
        except requests.RequestException as e:
            if i == 4:  # Retorna o erro na última tentativa
                return str(e)
            time.sleep(1)  # Aguarda para tentar de novo

    # Busca o valor do ID
    padrao = r'<input type="hidden" name="id" value="([^"]+)"'
    match = re.search(padrao, html)
    
    if match:
        return match.group(1)  # Retorna o código
    return None

# Busca o HTML de preview
def get_lattes_pview_html(code):
    url = f"http://buscatextual.cnpq.br/buscatextual/preview.do?metodo=apresentar&id={code}"
    for _ in range(5):
        try:
            resposta = requests.get(url, timeout=10)
            resposta.encoding = 'ISO-8859-1'  # Define o charset
            return resposta.text
        except requests.RequestException:
            time.sleep(1)
    return None

# Busca o HTML dos índices
def get_lattes_index_html(code):
    url = f"http://buscatextual.cnpq.br/buscatextual/graficos.do?metodo=apresentar&codRHCript={code}"
    for _ in range(5):
        try:
            resposta = requests.get(url, timeout=10)
            return resposta.text
        except requests.RequestException:
            time.sleep(1)
    return None


def collect_lattes_data(url):
    normalized_url = normalize_lattes_url(url)
    code = get_lattes_code(normalized_url)

    if not code or _is_request_error(code):
        return {
            "success": False,
            "url": normalized_url,
            "code": code,
            "preview_html": None,
            "index_html": None,
            "message": "Não foi possível encontrar o código interno do currículo.",
        }

    preview_html = get_lattes_pview_html(code)
    index_html = get_lattes_index_html(code)

    return {
        "success": True,
        "url": normalized_url,
        "code": code,
        "preview_html": preview_html,
        "index_html": index_html,
        "message": "Coleta realizada com sucesso.",
    }

# Teste do script
if __name__ == "__main__":
    # URL de teste
    link_lattes = "http://lattes.cnpq.br/1431810842888468" 

    print(f"Buscando dados para: {link_lattes}")
    resultado = collect_lattes_data(link_lattes)

    if resultado["success"]:
        print(f"Código interno encontrado: {resultado['code']}")
        print(
            f"HTML do preview coletado: {len(resultado['preview_html']) if resultado['preview_html'] else 0} caracteres."
        )
        print(
            f"HTML dos índices coletado: {len(resultado['index_html']) if resultado['index_html'] else 0} caracteres."
        )
    else:
        print(resultado["message"], resultado["code"])