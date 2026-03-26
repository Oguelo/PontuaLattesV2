# Barema Automático - IC

Projeto de extensão desenvolvido na disciplina EXA618: Programação para Redes, da Universidade Estadual de Feira de Santana (UEFS), para apoiar o cálculo da pontuação de candidatos às bolsas de Iniciação Científica.

- Edital IC UEFS 2026: http://www.pppg.uefs.br/arquivos/File/editais/IC/2026/Edital_IC_UEFS_2026.pdf
- Repositório: https://github.com/argalvao/IC_COLLECT
- Desenvolvedores: Abel Galvão, Alex Júnior e Bruno Camposo

## Objetivo

O sistema recebe a URL completa ou o código público de um currículo Lattes, consulta os dados públicos disponíveis no Buscatextual, organiza os indicadores encontrados e calcula automaticamente a pontuação do barema.

## Estado atual

Atualmente o projeto já possui:

- API HTTP local em Python
- página web integrada à API
- suporte à consulta por URL completa ou código público do Lattes
- coleta do código interno do Lattes
- coleta do HTML de preview
- coleta do HTML de índices de produção
- extração das séries bibliográficas por ano
- cálculo do barema com período dinâmico dos últimos 5 anos
- persistência em SQLite para consultas e baremas

## Estrutura do projeto

```text
IC_COLLECT/
├── API/
│   ├── database.py
│   ├── main.py
│   ├── controller.py
│   └── service.py
├── DB/
│   └── database.db
├── SPA/
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── README.md
```

## Componentes principais

### Backend

- [API/main.py](API/main.py): inicia o servidor HTTP local, entrega a SPA e expõe o endpoint `/api/lattes`
- [API/controller.py](API/controller.py): organiza o resultado da coleta, extrai publicações, calcula o barema e aciona a persistência
- [API/service.py](API/service.py): consulta o Lattes, aceita URL ou código público, obtém o código interno e coleta os HTMLs necessários
- [API/database.py](API/database.py): inicializa o banco SQLite e grava as tabelas `consultas` e `barema`

### Frontend

- [SPA/index.html](SPA/index.html): estrutura da página
- [SPA/app.js](SPA/app.js): integração com a API e renderização dos resultados
- [SPA/styles.css](SPA/styles.css): estilos da interface

## Requisitos para executar o projeto

Para rodar o projeto completo localmente, é necessário ter:

### Sistema e ambiente

- sistema operacional com terminal disponível, como Linux, macOS ou Windows
- navegador web moderno, como Chrome, Edge ou Firefox

### Python

- Python 3.10 ou superior
- comando `python3` disponível no terminal

### Bibliotecas Python utilizadas

O backend usa bibliotecas padrão do Python, SQLite nativo (`sqlite3`) e a biblioteca `requests`.

Dependências necessárias:

- `requests`

Se precisar instalar manualmente:

```bash
pip3 install requests
```

### Rede

- acesso à internet para consultar o Lattes e o Buscatextual do CNPq
- liberação de conexões HTTP/HTTPS para os domínios do Lattes

### Porta local

- porta `8000` livre para subir o servidor local

Se a porta estiver ocupada, será necessário encerrar o processo que a está usando ou alterar a constante `PORT` em [API/main.py](API/main.py).

### Estrutura esperada

Para funcionar corretamente, o projeto espera esta organização:

- [API](API) com os arquivos do backend
- [SPA](SPA) com `index.html`, `app.js` e `styles.css`
- [DB](DB) para armazenar o arquivo SQLite `database.db`

### Observação importante

O projeto depende do formato atual das páginas públicas do Lattes. Se o CNPq alterar a estrutura HTML ou os endpoints públicos, partes da coleta e do cálculo podem deixar de funcionar até ajuste no código.

## Como executar

Na pasta [API](API), execute:

```bash
python3 main.py
```

Depois abra no navegador:

```text
http://127.0.0.1:8000
```

## Deploy no Render

Para publicar no Render como um único serviço web Python:

1. defina o comando de build como `pip install -r requirements.txt`
2. defina o comando de start como `python3 API/main.py`
3. mantenha a variável `PORT` gerenciada pelo próprio Render

O backend já está preparado para:

- escutar em `0.0.0.0`
- usar a porta informada em `PORT`
- servir os arquivos da pasta [SPA](SPA) no mesmo domínio da API

Com isso, as páginas HTML e os endpoints `/api/*` funcionam no mesmo serviço hospedado.

## Endpoint disponível

### `POST /api/lattes`

Recebe um JSON com a URL completa ou o código público do currículo:

```json
{
	"url": "https://lattes.cnpq.br/1431810842888468"
}
```

Também aceita:

```json
{
	"url": "1431810842888468"
}
```

Retorna um JSON com:

- status da coleta
- URL consultada
- código interno do currículo
- nome da pessoa retornada pelo Lattes
- HTML de preview
- HTML de índices
- publicações agregadas por ano
- barema calculado

## O que já é calculado no barema

O cálculo atual contempla a estrutura abaixo:

### I - Titulação

- Doutorado: 12
- Mestrado: 8

### II - Produção

- Artigo completo publicado em periódico
- Livro
- Capítulo de livro
- Resumo publicado em periódico
- Resumo e trabalho publicado em anais de evento
- Outras produções bibliográficas
- Patente
- Produção artística/cultural
- Trabalho técnico

### III - Formação de recursos humanos

- Doutorado
- Mestrado
- IC, IT, TCC, Especialização, PIBID, PIBEX, PET e Monitoria

### IV - Participação em eventos/comitê

- Apresentação de trabalho

## Regra de período

O projeto não usa mais um ano fixo como 2021.

O barema considera dinamicamente os últimos 5 anos a partir do ano vigente:

$$ano\_minimo = ano\_atual - 5$$

Exemplo:

- em 2026, o período considerado começa em 2021
- em 2027, o período considerado começa em 2022

Essa regra é usada tanto no backend quanto na interface web.

## Persistência em banco de dados

O projeto grava os dados em SQLite no arquivo [DB/database.db](DB/database.db).

### Tabela `consultas`

Registra todas as consultas feitas pela aplicação.

Campos principais:

- `id`
- `url_informada`
- `url_consultada`
- `code`
- `success`
- `message`
- `created_at`

### Tabela `barema`

Registra o barema associado à última consulta realizada para cada `code`.

Campos principais:

- `consulta_id`
- `code`
- `nome`
- subtotais bruto e limitado por seção
- `total_bruto`
- `total_limitado`
- `barema_json`
- `updated_at`

Relacionamento:

- `barema.consulta_id` referencia `consultas.id`
- o vínculo lógico principal entre os resultados também é feito pelo `code`

## Limitações atuais

- algumas informações do Lattes não aparecem de forma estruturada nos HTMLs coletados
- a detecção de titulação ainda depende de texto disponível no conteúdo retornado
- a extração do nome depende do conteúdo retornado no HTML de preview
- alguns indicadores públicos do Lattes podem variar conforme mudanças no Buscatextual

## Próximos passos

- criar rotas para consulta do histórico salvo em SQLite
- permitir listagem de consultas e baremas por `code`
- refinar a interface e a apresentação do barema
- ampliar a documentação do esquema do banco e dos endpoints
