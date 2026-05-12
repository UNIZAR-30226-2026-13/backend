const { Boosts } = require('../models/boosts');

describe('Pruebas de Lógica de Power-Ups (Backend)', () => {
    let gameState;

    beforeEach(() => {
        gameState = {
            ownerTurn: true,
            turnStreak: 1,
            ownerInventory: { deflagrador: 1, doble: 1, tor: 1, esc: 1, rad: 1, mine: 1 },
            guestInventory: { deflagrador: 0, doble: 0, tor: 0, esc: 0, rad: 0, mine: 0 },
            ownerBoard: Array(10).fill(null).map(() => Array(10).fill('agua')),
            guestBoard: Array(10).fill(null).map(() => Array(10).fill('agua'))
        };
        gameState.guestBoard[5][5] = 'barco';
    });

    test('DEFLAGRADOR: Debe impactar en cruz y gastar munición', () => {
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

        const move = { x: 2, y: 2 }; // Centro del primer cuadrante
        const newState = Boosts.tornado(gameState, move);

        expect(newState.ownerInventory.tor).toBe(0);
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
        const move = { x: 0, y: 0 };
        
        const newState = Boosts.escudo(gameState, move);

        expect(newState.ownerBoard[0][0]).toBe('escudo(barco)');
        expect(newState.ownerInventory.esc).toBe(0);
    });

    test('MINA: Al golpear una mina, el rival debe obtener turnStreak = 2', () => {
    });

    test('RADAR: Debe contar correctamente los barcos en un cuadrante', () => {
        // Colocamos 2 barcos en el cuadrante superior izquierdo (0-4, 0-4)
        gameState.guestBoard[1][1] = 'barco';
        gameState.guestBoard[2][2] = 'barco';

        const move = { x: 0, y: 0 }; // Apuntamos al cuadrante 1
        const newState = Boosts.radar(gameState, move);

        expect(newState.lastRadarResult).toBe(2);
        expect(newState.ownerInventory.rad).toBe(0); // Gasta inventario
    });

    test('SEGURIDAD: No debe permitir usar un boost si el inventario es 0', () => {
        // Intentamos usar un boost que el invitado no tiene
        gameState.ownerTurn = false;
        const move = { x: 1, y: 1 };
        
        const newState = Boosts.tornado(gameState, move);

        // El estado debe devolverse intacto
        expect(newState.guestInventory.deflagrador).toBe(0);
        expect(newState).toEqual(gameState); 
    });
});