from controller import buscaLattes


def main():
	print("###### COLETA DE CURRÍCULO LATTES ######\n")

	url_lattes = input("URL do currículo Lattes: ").strip()

	if not url_lattes:
		print("Nenhuma URL foi informada.")
		return

	resultado = buscaLattes(url_lattes)

	if not resultado["success"]:
		detalhe = f" Detalhe: {resultado['code']}" if resultado["code"] else ""
		print(f"{resultado['message']}{detalhe}")
		return

	preview_tamanho = len(resultado["preview_html"]) if resultado["preview_html"] else 0
	index_tamanho = len(resultado["index_html"]) if resultado["index_html"] else 0

	print("\nColeta concluída com sucesso.")
	print(f"Código interno: {resultado['code']}")
	print(f"Tamanho do HTML de preview: {preview_tamanho} caracteres")
	print(f"Tamanho do HTML de índices: {index_tamanho} caracteres")
	print("\n###### CONTEÚDO DA PÁGINA PREVIEW ######\n")
	print(resultado["preview_html"] if resultado["preview_html"] else "Nenhum conteúdo de preview encontrado.")
	print("\n###### CONTEÚDO DA PÁGINA DE ÍNDICES ######\n")
	print(resultado["index_html"] if resultado["index_html"] else "Nenhum conteúdo de índices encontrado.")


if __name__ == "__main__":
	main()
