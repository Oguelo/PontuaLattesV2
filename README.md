# Barema Automático - IC

Projeto de extensão desenvolvido na disciplina EXA618: Programação para Redes, da Universidade Estadual de Feira de Santana (UEFS), com foco na automatização da análise de currículos Lattes e no cálculo do barema para bolsas de Iniciação Científica.

- Edital IC UEFS 2026: http://www.pppg.uefs.br/arquivos/File/editais/IC/2026/Edital_IC_UEFS_2026.pdf
- Repositório: https://github.com/argalvao/IC_COLLECT
- Desenvolvedores: Abel Galvão, Alex Júnior e Bruno Campos

## Visão geral

O sistema recebe uma URL pública do currículo Lattes ou apenas o código do currículo, consulta os dados públicos disponíveis no CNPq/Buscatextual, extrai indicadores bibliográficos e calcula automaticamente a pontuação do barema docente.

Além da coleta e do cálculo, o projeto também oferece:

- autenticação com cadastro, login e logout
- armazenamento das consultas em SQLite
- armazenamento do barema consolidado por currículo
- dashboard com histórico das consultas realizadas
- interface web integrada ao backend
- suporte a execução local e deploy no Render

## Funcionalidades atuais

### Coleta e processamento do Lattes

- recebe URL completa ou código público do Lattes
- normaliza a entrada automaticamente
- localiza o código interno do currículo
- coleta o HTML de preview do currículo
- coleta o HTML de índices/gráficos de produção
- extrai séries bibliográficas por ano
- calcula publicações no período dinâmico dos últimos 5 anos
- calcula o barema completo com limites por seção

### Autenticação

- cadastro de usuário com senha
- confirmação de senha na interface de cadastro
- login com geração de token de sessão
- logout com invalidação da sessão
- proteção da consulta de Lattes por token

### Persistência e histórico

- grava consultas realizadas
- grava o barema associado ao currículo consultado
- mantém nome da pessoa quando identificado
- lista consultas no dashboard com paginação

### Frontend

- página principal para consulta do currículo
- página de login
- página de cadastro
- dashboard com resumo de consultas
- visualização do barema por seção
- visualização das publicações por ano

## Estrutura do projeto

```text
IC_COLLECT/
├── API/
│   ├── controller.py
│   ├── database.py
│   ├── main.py
│   └── service.py
├── DB/
│   └── database.db
├── SPA/
│   ├── app.js
│   ├── auth.js
│   ├── cadastro.html
│   ├── dashboard.html
│   ├── dashboard.js
│   ├── index.html
│   ├── login.html
│   └── styles.css
├── requirements.txt
└── README.md
```

## Arquitetura do sistema

O projeto funciona como um serviço Python único que:

1. serve os arquivos estáticos da pasta [SPA](SPA)
2. expõe endpoints HTTP em [API/main.py](API/main.py)
3. consulta os dados públicos do Lattes em [API/service.py](API/service.py)
4. processa publicações e calcula o barema em [API/controller.py](API/controller.py)
5. persiste dados em SQLite por meio de [API/database.py](API/database.py)

## Componentes principais

### Backend

- [API/main.py](API/main.py)
	- inicia o servidor HTTP
	- serve a SPA
	- expõe endpoints de autenticação, consulta e histórico
	- lê `HOST` e `PORT` do ambiente

- [API/service.py](API/service.py)
	- normaliza a URL informada
	- consulta o currículo no Lattes
	- obtém o código interno do currículo
	- baixa o HTML de preview e o HTML de índices
	- utiliza a biblioteca `requests`

- [API/controller.py](API/controller.py)
	- extrai variáveis JavaScript do HTML de índices
	- normaliza anos e séries de publicações
	- calcula publicações por período
	- calcula pontuação do barema
	- produz o payload final retornado pela API

- [API/database.py](API/database.py)
	- inicializa o banco SQLite
	- cria tabelas e índices
	- registra consultas
	- registra baremas
	- cria usuários
	- valida login
	- gerencia sessões por token

### Frontend

- [SPA/index.html](SPA/index.html)
	- página principal da aplicação
	- formulário para consulta do Lattes
	- área de exibição do barema e das publicações

- [SPA/app.js](SPA/app.js)
	- envia a consulta para `/api/lattes`
	- valida sessão no navegador
	- renderiza resumo da coleta
	- renderiza publicações dos últimos 5 anos
	- renderiza o barema por blocos
	- faz logout

- [SPA/login.html](SPA/login.html) e [SPA/auth.js](SPA/auth.js)
	- autenticação do usuário
	- armazenamento do token no `localStorage`

- [SPA/cadastro.html](SPA/cadastro.html)
	- criação de conta
	- confirmação de senha no cliente

- [SPA/dashboard.html](SPA/dashboard.html) e [SPA/dashboard.js](SPA/dashboard.js)
	- exibição de histórico de consultas
	- cards de resumo
	- gráficos com Chart.js
	- tabela paginada

- [SPA/styles.css](SPA/styles.css)
	- estilos da interface

## Requisitos

### Ambiente

- Linux, macOS ou Windows
- navegador web moderno
- acesso à internet para consultar os serviços públicos do Lattes

### Python

- Python 3.10 ou superior
- `python3` disponível no terminal

### Dependências

As dependências estão em [requirements.txt](requirements.txt).

Instalação:

```bash
pip3 install -r requirements.txt
```

Dependência atual:

- `requests>=2.31.0`

### Banco de dados

- SQLite nativo do Python
- o arquivo é criado automaticamente em [DB/database.db](DB/database.db)

## Como executar localmente

Na raiz do projeto, instale as dependências:

```bash
pip3 install -r requirements.txt
```

Depois inicie a aplicação:

```bash
cd API
python3 main.py
```

Em seguida, abra no navegador:

```text
http://127.0.0.1:8000
```

## Deploy no Render

O projeto está preparado para ser publicado no Render como um único serviço web Python.

### Configuração recomendada

- Build Command: `pip install -r requirements.txt`
- Start Command: `python3 API/main.py`

### Observações

- o servidor usa `0.0.0.0`
- a porta é lida da variável `PORT`
- os arquivos da pasta [SPA](SPA) são servidos pelo próprio backend
- frontend e API funcionam no mesmo domínio

## Fluxo da aplicação

### 1. Cadastro e login

O usuário pode:

- criar conta em [SPA/cadastro.html](SPA/cadastro.html)
- fazer login em [SPA/login.html](SPA/login.html)
- receber um token de sessão salvo no navegador

### 2. Consulta do currículo

Na página principal [SPA/index.html](SPA/index.html):

- o usuário informa uma URL ou código do Lattes
- o frontend envia a requisição autenticada para `/api/lattes`
- o backend consulta os dados públicos do currículo
- o resultado é processado e devolvido ao frontend

### 3. Renderização dos resultados

O frontend mostra:

- nome do pesquisador
- código Lattes
- anos considerados
- publicações do período
- resumo do barema
- pontuação detalhada por seção
- observações automáticas quando necessário

### 4. Histórico

Cada consulta é persistida no banco e pode ser visualizada no dashboard.

## Endpoints da API

## `GET /health`

Retorna um payload simples para verificar se o serviço está ativo.

Exemplo de resposta:

```json
{
	"status": "ok"
}
```

## `GET /api/consultas`

Lista o histórico de consultas registradas.

Parâmetros opcionais de query:

- `start_date`
- `end_date`
- `success`

Exemplo:

```text
/api/consultas?start_date=2026-01-01&end_date=2026-12-31&success=1
```

Resposta:

```json
{
	"success": true,
	"consultas": []
}
```

## `POST /api/register`

Cria um novo usuário.

Exemplo de body:

```json
{
	"username": "abel",
	"password": "123456"
}
```

## `POST /api/login`

Autentica um usuário e retorna um token.

Exemplo de body:

```json
{
	"username": "abel",
	"password": "123456"
}
```

Exemplo de resposta de sucesso:

```json
{
	"success": true,
	"token": "...",
	"message": "Login efetuado com sucesso."
}
```

## `POST /api/logout`

Encerra a sessão atual.

Cabeçalho esperado:

```text
Authorization: Bearer <token>
```

## `POST /api/lattes`

Executa a coleta do currículo e retorna o barema calculado.

Cabeçalho esperado:

```text
Authorization: Bearer <token>
```

Exemplo de body:

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

O retorno inclui, entre outros campos:

- `success`
- `message`
- `url`
- `code`
- `nome`
- `preview_html`
- `index_html`
- `publicacoes`
- `barema`

## Estrutura do barema calculado

O cálculo atual está dividido em quatro blocos.

### I - Titulação

- Doutorado: 12 pontos
- Mestrado: 8 pontos

### II - Produção

- artigo completo publicado em periódico
- livro
- capítulo de livro
- resumo publicado em periódico
- resumo e trabalho publicado em anais de evento
- outras produções bibliográficas
- patente
- produção artística/cultural
- trabalho técnico

Limite da seção: 30 pontos.

### III - Formação de recursos humanos

- doutorado como orientador
- mestrado como orientador
- IC, IT, TCC, Especialização, PIBID, PIBEX, PET e Monitoria

Limite da seção: 12 pontos.

### IV - Participação em eventos/comitê

- apresentação de trabalho

Limite da seção: 6 pontos.

### Total

O total final é limitado a 60 pontos.

## Regra de período

O projeto considera dinamicamente os últimos 5 anos com base no ano atual:

$$ano\_minimo = ano\_atual - 5$$

Exemplo:

- em 2026, o período começa em 2021
- em 2027, o período começa em 2022

Essa regra é aplicada no backend e refletida na interface.

## Persistência em banco de dados

O banco é armazenado em [DB/database.db](DB/database.db).

### Tabela `users`

Armazena os usuários cadastrados.

Campos principais:

- `id`
- `username`
- `password_hash`
- `salt`

### Tabela `sessions`

Armazena sessões autenticadas.

Campos principais:

- `token`
- `user_id`
- `created_at`

### Tabela `consultas`

Armazena todas as consultas realizadas.

Campos principais:

- `id`
- `url_informada`
- `url_consultada`
- `code`
- `success`
- `message`
- `created_at`

### Tabela `barema`

Armazena o barema consolidado por currículo.

Campos principais:

- `id`
- `consulta_id`
- `code`
- `nome`
- `titulacao_bruto`
- `titulacao_limitado`
- `producao_bruto`
- `producao_limitado`
- `formacao_bruto`
- `formacao_limitado`
- `eventos_bruto`
- `eventos_limitado`
- `total_bruto`
- `total_limitado`
- `barema_json`
- `updated_at`

## Interface web

### Página inicial

Arquivo: [SPA/index.html](SPA/index.html)

Contém:

- apresentação do projeto
- link para o edital
- acesso ao histórico
- botão de logout
- formulário de consulta
- resultado detalhado do barema

### Login

Arquivo: [SPA/login.html](SPA/login.html)

Contém:

- formulário de autenticação
- mensagem de erro ou sucesso
- link para cadastro

### Cadastro

Arquivo: [SPA/cadastro.html](SPA/cadastro.html)

Contém:

- formulário de cadastro
- confirmação de senha
- link para login

### Dashboard

Arquivos: [SPA/dashboard.html](SPA/dashboard.html) e [SPA/dashboard.js](SPA/dashboard.js)

Contém:

- total de consultas
- total de sucessos
- total de falhas
- taxa de sucesso
- gráfico de acessos por dia
- gráfico de status das consultas
- gráfico de top consultas com sucesso
- tabela paginada de histórico

## Limitações e observações atuais

- o projeto depende da estrutura atual das páginas públicas do Lattes e do Buscatextual
- alterações no HTML externo podem quebrar parte da extração
- a identificação automática da titulação depende de texto encontrado no HTML de preview
- algumas informações do currículo podem não aparecer de forma estruturada
- o arquivo [SPA/dashboard.js](SPA/dashboard.js) referencia `/api/grafico-nomes`, mas esse endpoint não está implementado atualmente no backend; o código já evita falha se o gráfico não existir na página

## Possíveis melhorias futuras

- implementar o endpoint `/api/grafico-nomes`
- adicionar expiração de sessão
- melhorar tratamento de erros de rede com o Lattes
- criar testes automatizados
- documentar exemplos completos de resposta da API
- adicionar paginação e filtros avançados também no backend do dashboard
