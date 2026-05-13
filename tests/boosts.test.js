const { Boosts } = require('../models/boosts');

describe('Pruebas de Lógica de Power-Ups (Backend)', () => {
    let gameState;

    beforeEach(() => {
        gameState = {
            ownerTurn: true,
            turnStreak: 1,
            ownerInventory: { deflagrador: 1, doble: 1, tornado: 1, escudo: 1, radar: 1, mina: 1 },
            guestInventory: { deflagrador: 0, doble: 0, tornado: 0, escudo: 0, radar: 0, mina: 0 },
            ownerBoard: Array(10).fill(null).map(() => Array(10).fill('agua')),
            guestBoard: Array(10).fill(null).map(() => Array(10).fill('agua'))
        };
        gameState.guestBoard[5][5] = 'barco';
    });

    test('DEFLAGRADOR: Debe impactar en cruz y gastar munición', () => {
        const move = { f: 5, c: 5 }; // Impacto directo en el barco
        const newState = Boosts.deflagrador(gameState, move);

        // Verificamos que la casilla central ahora es un impacto (tocado/hundido)
        expect(newState.guestBoard[5][5]).not.toBe('barco');
        expect(newState.ownerInventory.deflagrador).toBe(0);
        expect(newState.ownerTurn).toBe(false);
    });

    test('DOBLE: Debe permitir repetir turno', () => {
        const newState = Boosts.doble(gameState);

        expect(newState.ownerInventory.doble).toBe(0);
        expect(newState.ownerTurn).toBe(true);
    });

    test('TORNADO: Debe realizar 5 disparos en el cuadrante correcto y cambiar el turno', () => {
        // Llenamos el cuadrante superior izquierdo (0-4, 0-4) de barcos para ver los impactos
        for(let i=0; i<5; i++) {
            for(let j=0; j<5; j++) {
                gameState.guestBoard[i][j] = 'barco';
            }
        }

        const move = { f: 2, c: 2 }; // Centro del primer cuadrante
        const newState = Boosts.tornado(gameState, move);

        expect(newState.ownerInventory.tornado).toBe(0);
        let impactos = 0;
        for(let i=0; i<5; i++) {
            for(let j=0; j<5; j++) {
                if (newState.guestBoard[i][j] !== 'barco') impactos++;
            }
        }
        // El tornado hace exactamente 5 disparos
        expect(impactos).toBe(5);

        expect(newState.guestBoard[6][6]).toBe('agua');
        expect(newState.ownerTurn).toBe(false);
    });

    test('ESCUDO: Debe proteger una casilla propia', () => {
        gameState.ownerBoard[0][0] = 'barco';
        const move = { f: 0, c: 0 };
        const newState = Boosts.escudo(gameState, move);

        expect(newState.ownerBoard[0][0]).toBe('escudo(barco)');
        expect(newState.ownerInventory.escudo).toBe(0);
    });

    test('MINA: Al golpear una mina, debe desaparecer del tablero', () => {
        // El invitado coloca una mina en (3,3)
        gameState.guestBoard[3][3] = 'minaActiva';

        const move = { f: 3, c: 3 };
        const newState = Boosts.deflagrador(gameState, move);

        expect(newState.ownerTurn).toBe(false);
        expect(newState.guestBoard[3][3]).not.toBe('minaActiva');
    });

    test('RADAR: Debe contar correctamente los barcos en un cuadrante', () => {
        // Colocamos 2 barcos en el cuadrante superior izquierdo (0-4, 0-4)
        gameState.guestBoard[1][1] = 'barco';
        gameState.guestBoard[2][2] = 'barco';

        const move = { f: 0, c: 0 }; // Apuntamos al cuadrante 1
        const newState = Boosts.radar(gameState, move);

        expect(newState.lastRadarResult).toBe(2);
        expect(newState.ownerInventory.radar).toBe(0); // Gasta inventario
    });

    test('SEGURIDAD: No debe permitir usar un boost si el inventario es 0', () => {
        // Intentamos usar un boost que el invitado no tiene
        gameState.ownerTurn = false;
        const move = { f: 1, c: 1 };
        const newState = Boosts.tornado(gameState, move);

        // El estado debe devolverse intacto
        expect(newState.guestInventory.deflagrador).toBe(0);
        expect(newState).toEqual(gameState);
    });
});