const GamesRepository = require('../repositories/gamesRepository');
const pool = require('../db');

describe('Integración: Consolidación de Partidas y ELO', () => {

    // Antes de los tests
    beforeAll(async () => {
        // Aseguramos que los usuarios existan con 1000 de ELO
        await pool.query("INSERT INTO usuarios (id, username, email, password, elo) VALUES (gen_random_uuid(), 'u1', 'u1@test.com', '123', 1000) ON CONFLICT (username) DO UPDATE SET elo = 1000, partidas_jugadas = 0");
        await pool.query("INSERT INTO usuarios (id, username, email, password, elo) VALUES (gen_random_uuid(), 'u2', 'u2@test.com', '123', 1000) ON CONFLICT (username) DO UPDATE SET elo = 1000, partidas_jugadas = 0");
    });

    // Limpieza después de cada test
    afterEach(async () => {
        await pool.query("DELETE FROM partidas");
        await pool.query("DELETE FROM historial_partidas");
    });

    // Limpieza después de los tests
    afterAll(async () => {
        await pool.end();
    });

    test('Caso 1: El Underdog gana a un jugador con más ELO', async () => {
        // u1 (1200) vs u2 (1000)
        await pool.query("UPDATE usuarios SET elo = 1200 WHERE username = 'u1'");
        
        const pId = 'PARTIDA-UNDERDOG';
        await pool.query("INSERT INTO partidas (id, owner_username, guest_username, ranked, activa) VALUES ($1, 'u1', 'u2', true, true)", [pId]);

        // Gana el de menor elo (u2)
        const res = await GamesRepository.consolidarPartida(pId, 'u2');

        expect(res).toHaveProperty('ganados');
        expect(res).toHaveProperty('perdidos');
        // Verificamos que u2 gane más de los 15-18 base por el multiplicador 1.2
        expect(res.ganados).toBeGreaterThan(20); 
        console.log('Resultados del ELO:', res);

        // COMPROBAR ESTADO FINAL DE LA DB
        // Verificar persistencia en DB
        const userRes = await pool.query("SELECT elo FROM usuarios WHERE username = 'u2'");
        expect(userRes.rows[0].elo).toBe(1000 + res.ganados);

        // Verificar que la partida se movió al historial
        const hist = await pool.query("SELECT * FROM historial_partidas WHERE id = $1", [pId]);
        expect(hist.rowCount).toBe(1);
        expect(hist.rows[0].ganador_id).toBe('u2');

        // Verificar que el perdedor también sumó una partida jugada
        const loser = await pool.query("SELECT partidas_jugadas FROM usuarios WHERE username = 'u1'");
        expect(loser.rows[0].partidas_jugadas).toBe(1);
    });

    test('Caso 2: El Favorito gana (Recompensa mínima)', async () => {
        // u1 (1500) vs u2 (1000)
        await pool.query("UPDATE usuarios SET elo = 1500 WHERE username = 'u1'");
        
        const pId = 'PARTIDA-FAVORITO';
        await pool.query("INSERT INTO partidas (id, owner_username, guest_username, ranked, activa) VALUES ($1, 'u1', 'u2', true, true)", [pId]);

        // Gana el de mayor elo (u1)
        const res = await GamesRepository.consolidarPartida(pId, 'u1');

        // Debería de ser un valor bajo
        expect(res.ganados).toBeLessThan(10);
        expect(res.ganados).toBeGreaterThanOrEqual(3);
        console.log('Resultados del ELO:', res);

        // COMPROBAR ESTADO FINAL DE LA DB
        // Verificar persistencia en DB
        const userRes = await pool.query("SELECT elo FROM usuarios WHERE username = 'u1'");
        expect(userRes.rows[0].elo).toBe(1500 + res.ganados);

        // Verificar que la partida se movió al historial
        const hist = await pool.query("SELECT * FROM historial_partidas WHERE id = $1", [pId]);
        expect(hist.rowCount).toBe(1);
        expect(hist.rows[0].ganador_id).toBe('u1');

        // Verificar que el perdedor también sumó una partida jugada
        const loser = await pool.query("SELECT partidas_jugadas FROM usuarios WHERE username = 'u2'");
        expect(loser.rows[0].partidas_jugadas).toBe(2);
    });
});