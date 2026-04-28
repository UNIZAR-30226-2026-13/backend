const express = require('express');
const router = express.Router();
const GamesRepository = require('../repositories/gamesRepository');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db');

router.use(authenticateToken);

// POST /api/terminadas/consolidar
router.post('/consolidar', async (req, res) => {
    const { partidaID, ganadorUsername } = req.body;
    const io = req.app.get('io');

    try {
        const nuevoElo = await GamesRepository.consolidarPartida(partidaID, ganadorUsername);
        
        // Notificar a los jugadores el cambio de ELO por Sockets
        if (io) {
            io.to(partidaID).emit('partida_finalizada', {
                ganador: ganadorUsername,
                elo: nuevoElo
            });
        }

        res.status(200).json({ status: "Consolidada", nuevoElo });
    } catch (error) {
        console.error("Error consolidando:", error);
        res.status(513).json({ message: "Error al consolidar la partida" });
    }
});

// GET /api/terminadas/:id
router.get('/:id', async (req, res) => {
    const username = req.user.username;
    try {
        const query = `
            SELECT * FROM historial_partidas 
            WHERE owner_username = $1 OR guest_username = $1 
            ORDER BY fecha DESC`;
        const result = await pool.query(query, [username]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(513).json({ message: 'Error al obtener el historial' });
    }
});

module.exports = router;