const express = require('express');
const router = express.Router();
const QueueRepository = require('../repositories/queueRepository');
const GamesRepository = require('../repositories/gamesRepository');
const { authenticateToken } = require('../middleware/auth'); // Importamos tu middleware

router.use(express.json());

// Aplicamos el middleware a todas las rutas de la cola
router.use(authenticateToken);

// POST /api/queue/join
router.post('/join', async (req, res) => {
    // Extraemos el ID del usuario directamente del token decodificado por el middleware
    const IDjugador = req.user.username; 
    const io = req.app.get('io');

    try {
        // 1. Verificar si el jugador ya está en una partida activa 
        const partidaActiva = await GamesRepository.findGameByPlayer(IDjugador);
        if (partidaActiva) {
            return res.status(200).json({ status: "Encontrada", partidaID: partidaActiva });
        }

        // 2. Lógica de Matchmaking
        const oponenteID = await QueueRepository.getWaitingPlayer(IDjugador);

        if (oponenteID) {
            // Se crea la partida con la nomenclatura partidaID [cite: 2, 3]
            const partidaID = await GamesRepository.createGame(oponenteID, IDjugador);
            await QueueRepository.removeFromQueue(oponenteID);

            // Notificación vía Socket.io al oponente que estaba esperando
            if (io) {
                io.to(oponenteID).emit('partidaEncontrada', { partidaID });
            }

            return res.status(200).json({ status: "Encontrada", partidaID });
        } else {
            await QueueRepository.addToQueue(IDjugador);
            return res.status(200).json({ status: "InQueue" });
        }
    } catch (error) {
        console.error('Error en queue/join:', error);
        res.status(513).json({ message: 'Error del servidor al procesar la cola' });
    }
});

// GET /api/queue/status
router.get('/status', async (req, res) => {
    // Al usar authenticateToken, req.user ya está disponible
    const IDjugador = req.user.username; 

    try {
        const partidaID = await GamesRepository.findGameByPlayer(IDjugador);
        if (partidaID) {
            return res.status(200).json({ status: "Encontrada", partidaID });
        }

        const enCola = await QueueRepository.isPlayerInQueue(IDjugador);
        return res.status(200).json({ 
            status: enCola ? "InQueue" : "None" 
        });
    } catch (error) {
        res.status(513).json({ message: 'Error del servidor' });
    }
});

module.exports = router;