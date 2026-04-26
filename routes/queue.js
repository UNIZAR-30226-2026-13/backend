const express = require('express');
const router = express.Router();
const QueueRepository = require('../repositories/queueRepository');
const GamesRepository = require('../repositories/gamesRepository');
const { authenticateToken } = require('../middleware/auth');

router.use(express.json());
router.use(authenticateToken);

// POST /api/queue/join
router.post('/join', async (req, res) => {
    const IDjugador = req.user.username;
    const io = req.app.get('io');
    const rankedSettings = {
        ranked: true
    }

    try {
        const partidaActiva = await GamesRepository.findGameByPlayer(IDjugador);
        if (partidaActiva) {
            return res.status(200).json({ status: "Encontrada", partidaID: partidaActiva });
        }

        const oponenteID = await QueueRepository.getWaitingPlayer(IDjugador);

        if (oponenteID) {
            const partidaID = await GamesRepository.createGame(oponenteID, IDjugador, rankedSettings);
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