# IC_COLLECT

Projeto desenvolvido para automatizar a análise de um barema de Iniciação Científica (IC) a partir dos dados do currículo Lattes.

## Objetivo

O sistema tem como objetivo coletar informações do currículo Lattes de um docente, tratar esses dados e calcular automaticamente a pontuação do barema de seleção de bolsas de IC.

## O que já foi feito

Atualmente, o projeto já possui a etapa inicial de coleta implementada.

### API

Na pasta [API](API), já foi desenvolvido o fluxo básico de consulta:

- [main.py](API/main.py): recebe a URL do currículo Lattes por entrada do usuário
- [controller.py](API/controller.py): intermedia a chamada entre a entrada e o serviço
- [service.py](API/service.py): faz a requisição ao Lattes, obtém o código interno do currículo e coleta o conteúdo HTML das páginas principais

### Coleta atual

Até o momento, o sistema já consegue:

- receber a URL do currículo Lattes
- normalizar a URL para evitar falhas com HTTPS
- buscar o código interno do currículo na plataforma Lattes
- baixar o conteúdo HTML da página de preview
- baixar o conteúdo HTML da página de índices
- exibir esse conteúdo na tela

## Próximos passos

As próximas etapas do projeto são:

- tratamento dos dados coletados
- armazenamento das informações no banco de dados em [DB](DB)
- automação do cálculo do barema
- desenvolvimento da página web no front-end em [SPA](SPA)

## Barema a ser automatizado

## BAREMA PARA SELEÇÃO DE BOLSAS
## (PIBIC/CNPq, PIBIC-Af/CNPq, PIBIC/FAPESB e PROBIC/UEFS)

### A – DOCENTE

#### I – Titulação

Considerar somente a titulação máxima.

| Critério | Pontuação por item | Pontuação Máxima |
| :--- | :---: | :---: |
| Doutorado | 12 | 12 |
| Mestrado | 08 | 08 |
| **Subtotal (máximo a ser considerado: 12)** | | |

#### II – Produção

Considerar somente a produção a partir de 2021.

| Critério | Pontuação por item | Pontuação Máxima |
| :--- | :---: | :---: |
| Artigo completo publicado em periódico | 03 | Sem limites |
| Livro | 03 | Sem limites |
| Capítulo de livro | 02 | Sem limites |
| Resumo publicado em periódico | 1,5 | Sem limites |
| Resumo e trabalho publicado em Anais de evento | 01 | Sem limites |
| Outras produções bibliográficas | 01 | Sem limites |
| Patente | 03 | Sem limites |
| Produção artística/cultural (artes cênicas, música, artes visuais e outras produções) | 03 | Sem limites |
| Trabalho Técnico | 01 | Sem limites |
| **Subtotal (máximo a ser considerado: 30)** | | |

#### III – Formação de recursos humanos

Considerar somente orientações concluídas a partir de 2021.

| Critério | Pontuação por item | Pontuação Máxima |
| :--- | :---: | :---: |
| Doutorado (orientador) | 1,5 | Sem limites |
| Mestrado (orientador) | 1,0 | Sem limites |
| IC, IT, TCC, Especialização, PIBID, PIBEX, PET, Monitoria | 0,5 | Sem limites |
| **Subtotal (máximo a ser considerado: 12)** | | |

#### IV – Participação em eventos/comitê

Considerar somente a participação a partir de 2021.

| Critério | Pontuação por item | Pontuação Máxima |
| :--- | :---: | :---: |
| Apresentação de trabalho | 0,5 | sem limite |
| **Subtotal (máximo a ser considerado: 06)** | | |

**TOTAL A - DOCENTE (máximo a ser considerado: 60)**

## Estrutura atual

```text
IC_COLLECT/
├── API/
├── DB/
└── SPA/
```

## Resumo do andamento

O projeto já realiza a coleta inicial do conteúdo do Lattes, mas ainda precisa evoluir para transformar esse conteúdo em dados estruturados, persistir os resultados, calcular automaticamente o barema e disponibilizar uma interface web para uso final.
