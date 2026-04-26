const Board = require('./board')
const Boosts = require('./boosts')

class Game {
	static newGameState(gameSettings) {
		const board = Board.emptyBoard(gameSettings.board_size)
		const gameState = {
			ownerBoard : Boosts.placeBoosts(board, gameSettings.boost_ratio),
			guestBoard : Boosts.placeBoosts(board, gameSettings.boost_ratio),
			ownerInventory : [],
			guestInventory : [],
			ownerTurn : true,
			gameSettings : gameSettings
		}
		return gameState;
	}
}

module.exports = Game;