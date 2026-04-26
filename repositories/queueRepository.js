const pool = require('../db');

class QueueRepository {
    // Añadir jugador a la cola
    static async addToQueue(playerID) {
        const query = 'INSERT INTO queue (player_username) VALUES ($1) ON CONFLICT DO NOTHING';
        await pool.query(query, [playerID]);
    }

    // Buscar si hay alguien esperando (que no sea el propio jugador)
    static async getWaitingPlayer(playerID) {
        const query = 'SELECT player_username FROM queue WHERE player_username != $1 LIMIT 1';
        const result = await pool.query(query, [playerID]);
        return result.rows[0]?.player_username;
    }

    // Eliminar jugador de la cola (cuando encuentra partida o cancela)
    static async removeFromQueue(playerID) {
        const query = 'DELETE FROM queue WHERE player_username = $1';
        await pool.query(query, [playerID]);
    }

    // Verificar si un jugador específico está en cola
    static async isPlayerInQueue(playerID) {
        const query = 'SELECT 1 FROM queue WHERE player_username = $1';
        const result = await pool.query(query, [playerID]);
        return result.rowCount > 0;
    }
}

module.exports = QueueRepository;