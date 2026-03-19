from service import collect_lattes_data


# Armazena o conteúdo retornado
conteudo_lattes = None


# Guarda o conteúdo da busca
def getConteudo(resultado):
	global conteudo_lattes
	conteudo_lattes = resultado
	return conteudo_lattes


# Busca os dados no service
def buscaLattes(url):
	resultado = collect_lattes_data(url)
	return getConteudo(resultado)
