const pool = require('../db');
const crypto = require('crypto');

class GamesRepository {
    async createGame(player1, player2) {
        const gameID = crypto.randomUUID();
        
        // Estructura que guardaremos en la columna JSONB 'estado'
        const estadoInicial = {
            tablero1: Array(10).fill(Array(10).fill(0)),
            tablero2: Array(10).fill(Array(10).fill(0)),
            turno: player1,
            fase: 'COLOCANDO'
        };
        
        const query = `
        INSERT INTO partidas (id, jugador1_id, jugador2_id, estado, activa) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING id`;
        
        // Usamos JSON.stringify para el campo JSONB y marcamos activa como true
        const values = [gameID, player1, player2, JSON.stringify(estadoInicial), true];
        
        const result = await pool.query(query, values);
        return result.rows[0].id;
    }

    async findGameByPlayer(username) {
        // Buscamos por el campo 'activa' en lugar de 'fase'
        const query = 'SELECT id FROM partidas WHERE (jugador1_id = $1 OR jugador2_id = $2) AND activa = true';
        const result = await pool.query(query, [username, username]);
        return result.rows[0]?.id;
    }
}

module.exports = new GamesRepository();