const { BOOST_NAMES } = require('../config')
const { Board } = require('./board');

class Boosts {
	static placeBoosts(board, ratio) {
		let resultBoard = structuredClone(board)
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

	static newInventory() {
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
		let resultGameState = structuredClone(gameState)
		switch (requestedMove.boostType) {
			case "deflagrador":
				resultGameState = deflagrador(gameState, requestedMove)
				break
			case "doble":
				resultGameState = doble(gameState, requestedMove)
				break
			case "tornado":
				resultGameState = tornado(gameState, requestedMove)
				break
			case "escudo":
				resultGameState = escudo(gameState, requestedMove)
				break
			case "mina":
				resultGameState = mina(gameState, requestedMove)
				break
			case "radar":
				resultGameState = radar(gameState, requestedMove)
				break

		}
		return resultGameState
	}

	static deflagrador(gameState, requestedMove){
		let resultGameState = structuredClone(gameState)
		let targetBoard = (
			resultGameState.ownerTurn
			? resultGameState.guestBoard
			: resultGameState.ownerBoard
		)
		const x = requestedMove.f
		const y = requestedMove.c
		if (
			x <= 0
			|| y <= 0
			|| x >= targetBoard[y].length-1
			|| y >= targetBoard.length-1
		) {
			return null
		}
		let result
		let mina = false
		result = Board.shoot(targetBoard, x, y)
		targetBoard = result.board
		if (result.info === "boost") {
			resultGameState = this.grabBoost(resultGameState, x, y)
		}
		if (result.info === "mina") {
			mina = true
		}
		targetBoard = Board.checkForSunk(targetBoard, x, y)

		result = Board.shoot(targetBoard, x-1, y)
		targetBoard = result.board
		if (result.info === "boost") {
			resultGameState = this.grabBoost(resultGameState, x-1, y)
		}
		if (result.info === "mina") {
			mina = true
		}
		targetBoard = Board.checkForSunk(targetBoard, x-1, y)

		result = Board.shoot(targetBoard, x+1, y)
		targetBoard = result.board
		if (result.info === "boost") {
			resultGameState = this.grabBoost(resultGameState, x+1, y)
		}
		if (result.info === "mina") {
			mina = true
		}
		targetBoard = Board.checkForSunk(targetBoard, x+1, y)

		result = Board.shoot(targetBoard, x, y-1)
		targetBoard = result.board
		if (result.info === "boost") {
			resultGameState = this.grabBoost(resultGameState, x, y-1)
		}
		if (result.info === "mina") {
			mina = true
		}
		targetBoard = Board.checkForSunk(targetBoard, x, y-1)

		result = Board.shoot(targetBoard, x, y+1)
		targetBoard = result.board
		if (result.info === "boost") {
			resultGameState = this.grabBoost(resultGameState, x, y+1)
		}
		if (result.info === "mina") {
			mina = true
		}
		targetBoard = Board.checkForSunk(targetBoard, x, y+1)

		resultGameState.ownerTurn = !resultGameState.ownerTurn
		resultGameState.turnStreak = 1

		if (mina) {
			// Al golpear mina le damos al siguiente jugador dos turnos
			resultGameState.turnStreak = 2
		}

		return resultGameState
	}

	static doble(gameState, requestedMove){
		const resultGameState = structuredClone(gameState);
		const shooterInventory = resultGameState.ownerTurn ? resultGameState.ownerInventory : resultGameState.guestInventory;

		if (shooterInventory['doble'] <= 0) return resultGameState;
		shooterInventory['doble']--;

		resultGameState.turnStreak = 2;
		return resultGameState; // Sigue siendo su turno
	}

	static tornado(gameState, requestedMove) {
		const { x, y } = requestedMove;
		let resultGameState = structuredClone(gameState);
		const shooterInventory = resultGameState.ownerTurn ? resultGameState.ownerInventory : resultGameState.guestInventory;

		if (shooterInventory['tor'] <= 0) return gameState;
		shooterInventory['tor']--;

		let targetBoard = resultGameState.ownerTurn ? resultGameState.guestBoard : resultGameState.ownerBoard;
		const tam = targetBoard.length;
		const mitad = Math.floor(tam / 2);

		// Definir límites del cuadrante
		const filaMin = x < mitad ? 0 : mitad;
		const filaMax = x < mitad ? mitad : tam;
		const colMin = y < mitad ? 0 : mitad;
		const colMax = y < mitad ? mitad : tam;

		// Recoger todas las celdas del cuadrante
		let celdasCuadrante = [];
		for (let i = filaMin; i < filaMax; i++) {
			for (let j = colMin; j < colMax; j++) {
				celdasCuadrante.push({ x: i, y: j });
			}
		}

		// Seleccionar 5 aleatorias
		for (let i = 0; i < 5; i++) {
			if (celdasCuadrante.length === 0) break;
			const index = Math.floor(Math.random() * celdasCuadrante.length);
			const { x: tx, y: ty } = celdasCuadrante.splice(index, 1)[0];

			const result = Board.shoot(targetBoard, tx, ty);
			targetBoard = result.board;
			if (result.info === "boost") resultGameState = Boosts.grabBoost(resultGameState, x, y);
			targetBoard = Board.checkForSunk(targetBoard, tx, ty);
		}

		if (resultGameState.ownerTurn) resultGameState.guestBoard = targetBoard;
		else resultGameState.ownerBoard = targetBoard;

		resultGameState.ownerTurn = !resultGameState.ownerTurn;
		return resultGameState;
	}

	static escudo(gameState, requestedMove){
		const { x, y } = requestedMove;
		let resultGameState = structuredClone(gameState);

		const shooterInventory = resultGameState.ownerTurn ? resultGameState.ownerInventory : resultGameState.guestInventory;

		if (shooterInventory['esc'] <= 0) return gameState;

		let myBoard = resultGameState.ownerTurn ? resultGameState.ownerBoard : resultGameState.guestBoard;

		if (myBoard[x][y] === "barco") {
			myBoard[x][y] = "escudo(barco)";
			shooterInventory['esc']--;
		} else if (myBoard[x][y] === "agua") {
			myBoard[x][y] = "escudo(agua)";
			shooterInventory['esc']--;
		}

		// El escudo no pasa el turno en principio
		return resultGameState;
	}

	static mina(gameState, requestedMove){
		const resultGameState = structuredClone(gameState)
		//	TODO
	}

	static radar(gameState, requestedMove){
		let resultGameState = structuredClone(gameState);
		const { x, y } = requestedMove;
		const shooterInventory = resultGameState.ownerTurn ? resultGameState.ownerInventory : resultGameState.guestInventory;

		if (shooterInventory['rad'] <= 0) return gameState;
		shooterInventory['rad']--;

		let targetBoard = resultGameState.ownerTurn ? resultGameState.guestBoard : resultGameState.ownerBoard;
		const tam = targetBoard.length;
		const mitad = Math.floor(tam / 2);

		const filaMin = x < mitad ? 0 : mitad;
		const filaMax = x < mitad ? mitad : tam;
		const colMin = y < mitad ? 0 : mitad;
		const colMax = y < mitad ? mitad : tam;

		let barcosEncontrados = 0;
		for (let i = filaMin; i < filaMax; i++) {
			for (let j = colMin; j < colMax; j++) {
				const celda = targetBoard[i][j];
				// Contamos barcos intactos, con escudo o ya tocados
				if (["barco", "escudo(barco)", "tocado", "escudoRoto(barco)"].includes(celda)) {
					barcosEncontrados++;
				}
			}
		}

		// Guardamos el resultado del radar en el estado para que el cliente lo lea
		resultGameState.lastRadarResult = barcosEncontrados;

		return resultGameState;
	}
}

module.exports = { Boosts, BOOST_NAMES };
