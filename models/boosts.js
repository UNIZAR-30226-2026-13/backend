const { BOOST_NAMES } = require('../config')

class Boosts {
	static placeBoosts(board, ratio) {
		let resultBoard = board
		const size = resultBoard.length
		const numBoosts = Math.floor(size * size * ratio)
		for (let i = 0; i < numBoosts;) {
			let x = Math.floor(Math.random() * size)
			let y = Math.floor(Math.random() * size)
			if (resultBoard[x][y] == "agua") {
				i++
				resultBoard[x][y] = BOOST_NAMES[Math.floor(Math.random() * BOOST_NAMES.length)]
			}
		}
		return resultBoard
	}

	static newInvetory() {
		const inventory = {}
		BOOST_NAMES.forEach((name) => inventory[name] = 0)
		return inventory
	}

	static grabBoost(gameState, x, y) {
		const resultGameState = structuredClone(gameState)
		const grabbedBoost = null
		if (resultGameState.ownerTurn) {
			if (resultGameState.guestBoard[x][y] in resultGameState.ownerInventory) {
				resultGameState.ownerInventory[resultGameState.guestBoard[x][y]]++
				grabbedBoost = resultGameState.guestBoard[x][y]
				resultGameState.guestBoard[x][y] = "nada"
			}
		}
		else {
			if (resultGameState.ownerBoard[x][y] in resultGameState.guestInventory) {
				resultGameState.guestInventory[resultGameState.ownerBoard[x][y]]++
				grabbedBoost = resultGameState.ownerBoard[x][y]
				resultGameState.guestInventory[x][y] = "nada"
			}
		}
		if (grabbedBoost != null) {
			return resultGameState
		}
		return null
	}

	static applyBoost(gameState, requestedMove) {
		// TODO: aplicar boost del requested move a gamestate
		return null
	}
}

exports = BOOST_NAMES
exports = Boosts