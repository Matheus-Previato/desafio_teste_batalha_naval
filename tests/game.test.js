import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, placeShip, startGame, attack } from '../src/game.js';

const fleet = [['carrier',5],['battleship',4],['submarine',3],['destroyer',2]];

function readyGame() {
    let game = createGame();
    for (let player = 0; player < 2; player++) {
        for (const [row, [type]] of fleet.entries()) {
            game = placeShip(game, player, type, row * 2, 0, 'H');
        }
    }
    return startGame(game);
}

test('BN01: cria dois tabuleiros 10x10 e frota vazia para cada jogador', () => {
    const game = createGame();
    assert.equal(game.status, 'setup');
    assert.equal(game.players.length, 2);
    for (const player of game.players) {
        assert.deepEqual(player.ships, []);
        assert.deepEqual(player.shots, []);
    }
    assert.equal(game.size, 10);
    assert.equal(game.winner, null);
});

test('BN02: posiciona horizontalmente cada tipo com seu tamanho exato', () => {
    for (const [type, length] of fleet) {
        const game = placeShip(createGame(), 0, type, 0, 0, 'H');
        assert.deepEqual(game.players[0].ships[0].cells,
            Array.from({length}, (_, col) => [0, col]));
        assert.equal(game.players[0].ships[0].type, type);
    }
});

test('BN03: posiciona verticalmente cada tipo com seu tamanho exato', () => {
    for (const [type, length] of fleet) {
        const game = placeShip(createGame(), 1, type, 0, 9, 'V');
        assert.deepEqual(game.players[1].ships[0].cells,
            Array.from({length}, (_, row) => [row, 9]));
    }
});

test('BN04: admite navio terminando exatamente na última coluna ou linha', () => {
    assert.equal(placeShip(createGame(), 0, 'carrier', 9, 5, 'H').players[0].ships.length, 1);
    assert.equal(placeShip(createGame(), 0, 'carrier', 5, 9, 'V').players[0].ships.length, 1);
});

test('BN05: rejeita navios que ultrapassam limites', () => {
    assert.throws(() => placeShip(createGame(), 0, 'carrier', 0, 6, 'H'));
    assert.throws(() => placeShip(createGame(), 0, 'carrier', 6, 0, 'V'));
});

test('BN06: rejeita sobreposição e preserva posicionamento original', () => {
    const game = placeShip(createGame(), 0, 'carrier', 0, 0, 'H');
    const before = structuredClone(game);
    assert.throws(() => placeShip(game, 0, 'submarine', 0, 3, 'V'));
    assert.deepEqual(game, before);
});

test('BN07: permite navios vizinhos, inclusive em contato diagonal', () => {
    let game = placeShip(createGame(), 0, 'carrier', 0, 0, 'H');
    game = placeShip(game, 0, 'battleship', 1, 0, 'H');
    game = placeShip(game, 0, 'destroyer', 2, 4, 'H');
    assert.equal(game.players[0].ships.length, 3);
});

test('BN08: cada jogador possui uma única unidade de cada tipo', () => {
    const game = placeShip(createGame(), 0, 'carrier', 0, 0, 'H');
    assert.throws(() => placeShip(game, 0, 'carrier', 2, 0, 'H'));
    assert.equal(placeShip(game, 1, 'carrier', 0, 0, 'H').players[1].ships.length, 1);
});

test('BN09: rejeita jogador, tipo, orientação e coordenadas inválidos', () => {
    for (const args of [[2,'carrier',0,0,'H'],[0,'boat',0,0,'H'],[0,'carrier',0,0,'D'],
        [0,'carrier',-1,0,'H'],[0,'carrier',0.5,0,'H'],[0,'carrier',0,10,'V']]) {
        assert.throws(() => placeShip(createGame(), ...args));
    }
});

test('BN10: início exige as duas frotas completas', () => {
    assert.throws(() => startGame(createGame()));
    let game = createGame();
    for (const [row, [type]] of fleet.entries()) game = placeShip(game, 0, type, row * 2, 0, 'H');
    assert.throws(() => startGame(game));
});

test('BN11: frota completa tem quatro navios e 14 casas por jogador', () => {
    const game = readyGame();
    assert.equal(game.status, 'playing');
    assert.equal(game.turn, 0);
    for (const player of game.players) {
        assert.equal(player.ships.length, 4);
        assert.equal(player.ships.flatMap(ship => ship.cells).length, 14);
    }
});

test('BN12: ataque na água registra erro e passa o turno', () => {
    const game = attack(readyGame(), 0, 9, 9);
    assert.deepEqual(game.lastAttack, {player:0,row:9,col:9,result:'miss',shipType:null});
    assert.equal(game.turn, 1);
    assert.equal(game.players[0].shots.length, 1);
});

test('BN13: ataque em navio registra acerto e também passa o turno', () => {
    const game = attack(readyGame(), 0, 0, 0);
    assert.deepEqual(game.lastAttack, {player:0,row:0,col:0,result:'hit',shipType:'carrier'});
    assert.equal(game.turn, 1);
    assert.equal(game.status, 'playing');
});

test('BN14: proíbe atacar fora do turno e durante preparação', () => {
    assert.throws(() => attack(readyGame(), 1, 9, 9));
    assert.throws(() => attack(createGame(), 0, 9, 9));
});

test('BN15: jogador não pode repetir coordenada já atacada', () => {
    let game = attack(readyGame(), 0, 9, 9);
    game = attack(game, 1, 9, 9);
    const before = structuredClone(game);
    assert.throws(() => attack(game, 0, 9, 9));
    assert.deepEqual(game, before);
});

test('BN16: último acerto em um navio registra afundamento', () => {
    let game = attack(readyGame(), 0, 6, 0);
    game = attack(game, 1, 9, 9);
    game = attack(game, 0, 6, 1);
    assert.equal(game.lastAttack.result, 'sunk');
    assert.equal(game.lastAttack.shipType, 'destroyer');
    assert.equal(game.status, 'playing');
});

test('BN17: vencer exige acertar todas as 14 casas da frota adversária', () => {
    let game = readyGame();
    const targets = game.players[1].ships.flatMap(ship => ship.cells);
    for (const [index, [row,col]] of targets.entries()) {
        game = attack(game, 0, row, col);
        if (index < targets.length - 1) {
            assert.equal(game.status, 'playing');
            game = attack(game, 1, 8 + Math.floor(index / 10), index % 10);
        }
    }
    assert.equal(game.status, 'won');
    assert.equal(game.winner, 0);
    assert.equal(game.lastAttack.result, 'sunk');
    const before = structuredClone(game);
    assert.throws(() => attack(game, 1, 8, 8));
    assert.deepEqual(game, before);
});

test('BN18: rejeita ataque fora do tabuleiro ou fracionário', () => {
    for (const [row,col] of [[-1,0],[10,0],[0,10],[0,0.5],[NaN,0]]) {
        assert.throws(() => attack(readyGame(), 0, row, col));
    }
});

test('BN19: não permite reposicionar navios após começar nem iniciar duas vezes', () => {
    const game = readyGame();
    assert.throws(() => placeShip(game, 0, 'carrier', 9, 0, 'H'));
    assert.throws(() => startGame(game));
});

test('BN20: ataques e posicionamento não modificam o estado recebido', () => {
    const initial = createGame();
    const snapshot = structuredClone(initial);
    placeShip(initial, 0, 'carrier', 0, 0, 'H');
    assert.deepEqual(initial, snapshot);
    const game = readyGame();
    const before = structuredClone(game);
    attack(game, 0, 0, 0);
    assert.deepEqual(game, before);
});

test('BN21: jogador um pode afundar toda a frota e vencer', () => {
    let game = readyGame();
    const targets = game.players[0].ships.flatMap(ship => ship.cells);
    for (const [index,[row,col]] of targets.entries()) {
        game = attack(game, 0, 8 + Math.floor(index / 10), index % 10);
        game = attack(game, 1, row, col);
    }
    assert.equal(game.winner, 1);
    assert.equal(game.status, 'won');
});
