# Batalha Naval — testes como especificação

Repositório de entrega: **`desafio_teste_batalha_naval`**.

Total de casos: **21**.

## Colaborador

Matheus Previato Hermenegildo — GitHub [Matheus-Previato](https://github.com/Matheus-Previato). Entrega organizada como trabalho individual. Em uma entrega em dupla, os dois integrantes devem ser identificados e suas contribuições devem existir no histórico do próprio repositório.

## Objetivo da entrega

Este repositório fornece especificação e testes de comportamento em **JavaScript**, para que a implementação também seja produzida em JavaScript a partir deles. O conjunto usa o executor nativo `node:test` e as asserções `node:assert/strict`, com módulos ES.

Os arquivos fornecidos são testes, documentação e configuração de execução. A implementação deverá ser criada em **`src/game.js`**, exportando as funções descritas abaixo. A primeira execução de `npm test` registra `ERR_MODULE_NOT_FOUND` enquanto esse arquivo estiver ausente. Depois de criado o módulo, as asserções especificam os comportamentos que precisam passar.

## Execução

Requer Node.js 22 ou superior. Na raiz do repositório:

```bash
npm run check
npm test
```

`npm run check` valida a sintaxe do arquivo de testes. `npm test` executa os casos, após a implementação existir. As ferramentas usadas pertencem ao próprio Node.js e dispensam dependências de teste externas.

## Convenções do contrato

Os estados são objetos de dados serializáveis, com arrays comuns. As funções que realizam ações recebem o estado e retornam o próximo estado. Devem preservar o objeto recebido e seus arrays internos. Em ações inválidas, devem lançar uma exceção sem modificar o estado. Os testes aceitam qualquer classe de exceção quando usam `assert.throws`.

As funções e os campos abaixo formam a interface observável exigida pelos testes. Campos adicionais podem existir. As fixtures dos testes compõem situações específicas a partir do construtor e substituem campos públicos. A implementação deve tomar decisões com base nesses campos, de forma que as fixtures sejam utilizáveis. Helpers e geradores presentes no arquivo de testes servem à preparação dos cenários e às asserções.

## Especificação do desafio

Partida para **dois jogadores**, cada um com tabuleiro **10 × 10**. As coordenadas começam em zero. Cada frota contém exatamente:

| Identificador | Embarcação | Casas |
|---|---|---:|
| `carrier` | Porta-aviões | 5 |
| `battleship` | Encouraçado | 4 |
| `submarine` | Submarino | 3 |
| `destroyer` | Destroier | 2 |

Foi escolhida a opção Destroier dentre as duas alternativas permitidas para a embarcação de duas casas.

- Navios são segmentos retos horizontais (`H`) ou verticais (`V`), orientados para colunas ou linhas crescentes.
- Navios devem permanecer dentro do tabuleiro e não podem se sobrepor. Contato lateral e diagonal são permitidos.
- A partida começa apenas com as duas frotas completas. O jogador zero ataca primeiro.
- Cada ataque válido passa a vez, tanto na água quanto em um navio.
- Um jogador não pode repetir uma coordenada que já atacou. Cada jogador registra seus próprios ataques.
- Acertar todas as casas de um navio registra afundamento. Acertar todas as 14 casas da frota adversária encerra a partida com vitória.
- Preparação, ataque e encerramento têm ações próprias. Ataques durante a preparação e qualquer ação após vitória são rejeitados, assim como um segundo início.

### Interface exigida

| Exportação | Contrato |
|---|---|
| `createGame()` | Retorna o estado inicial em preparação. |
| `placeShip(game, player, type, row, col, orientation)` | Posiciona uma unidade do tipo indicado para jogador `0` ou `1`. |
| `startGame(game)` | Confere as frotas e começa a partida. |
| `attack(game, player, row, col)` | Ataca a frota adversária respeitando o turno e registra o resultado. |

O estado contém `size: 10`, `players`, `status` (`setup`, `playing`, `won`), `turn` (`0` ou `1`), `winner` (inicialmente `null`) e, após ataque, `lastAttack`.

Cada jogador tem `ships`, lista de navios `{ type, cells }`, em que `cells` contém coordenadas `[linha, coluna]` na ordem do posicionamento, e `shots`, lista dos ataques que esse jogador realizou. Os registros de `shots` devem conter `row`, `col` e `result`. `lastAttack` tem exatamente os campos `{ player, row, col, result, shipType }`. `result` é `miss`, `hit` ou `sunk`, e `shipType` é `null` na água ou o identificador do navio atingido.

## Funcionamento dos casos de teste

Cada caso usa `test(...)` para preparar um estado, realizar uma ação e comparar o resultado esperado com `assert`. Os identificadores abaixo correspondem aos nomes executados pelo Node.js.

| Caso | Comportamento verificado |
|---|---|
| BN01 | Cria dois tabuleiros 10x10 e frota vazia para cada jogador |
| BN02 | Posiciona horizontalmente cada tipo com seu tamanho exato |
| BN03 | Posiciona verticalmente cada tipo com seu tamanho exato |
| BN04 | Admite navio terminando exatamente na última coluna ou linha |
| BN05 | Rejeita navios que ultrapassam limites |
| BN06 | Rejeita sobreposição e preserva posicionamento original |
| BN07 | Permite navios vizinhos, inclusive em contato diagonal |
| BN08 | Cada jogador possui uma única unidade de cada tipo |
| BN09 | Rejeita jogador, tipo, orientação e coordenadas inválidos |
| BN10 | Início exige as duas frotas completas |
| BN11 | Frota completa tem quatro navios e 14 casas por jogador |
| BN12 | Ataque na água registra erro e passa o turno |
| BN13 | Ataque em navio registra acerto e também passa o turno |
| BN14 | Proíbe atacar fora do turno e durante preparação |
| BN15 | Jogador não pode repetir coordenada já atacada |
| BN16 | Último acerto em um navio registra afundamento |
| BN17 | Vencer exige acertar todas as 14 casas da frota adversária |
| BN18 | Rejeita ataque fora do tabuleiro ou fracionário |
| BN19 | Não permite reposicionar navios após começar nem iniciar duas vezes |
| BN20 | Ataques e posicionamento não modificam o estado recebido |
| BN21 | Jogador um pode afundar toda a frota e vencer |

## Orientação para implementar a partir dos testes

1. Leia as regras, o contrato e todos os casos em `tests/game.test.js`.
2. Crie `src/game.js` como módulo ES e exporte a interface exigida.
3. Execute `npm test`, implemente cada comportamento e repita até todos os casos passarem.
4. Preserve os testes, os resultados esperados e as regras declaradas. Testes adicionais podem ser acrescentados para comportamentos novos compatíveis.
5. Uma interface visual pode usar as funções do módulo depois que as regras estiverem corretas.

## Estado da verificação desta entrega

A sintaxe dos testes foi verificada com Node.js. A execução na ausência de `src/game.js` foi conferida e apresenta a falha de importação esperada. A aprovação dos casos depende da implementação futura. A contagem de casos descreve o conjunto de especificações entregue.

## Entrega no GitHub

Crie um repositório público com o nome exato **`desafio_teste_batalha_naval`**. Extraia o pacote e envie o conteúdo desta pasta para a raiz do repositório. O `README.md`, o `package.json` e a pasta `tests` devem aparecer diretamente nessa raiz.

O código dos testes fica em `tests/game.test.js`. O módulo futuro esperado fica em `src/game.js`.

Para uma dupla, cada integrante deve enviar suas próprias contribuições pelo GitHub e constar na seção de colaboradores. O histórico de alterações é o registro das contribuições.
