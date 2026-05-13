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
		let grabbedBoost = null
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
				resultGameState.ownerBoard[x][y] = "nada"
			}
		}
		if (grabbedBoost != null) {
			return resultGameState
		}
		// Devolver siempre algo
		return resultGameState
	}

	static applyBoost(gameState, requestedMove) {
		// TODO: aplicar boost del requested move a gamestate
		let resultGameState = structuredClone(gameState)
		switch (requestedMove.boostType) {
			case "deflagrador":
				resultGameState = this.deflagrador(gameState, requestedMove)
				break
			case "doble":
				resultGameState = this.doble(gameState, requestedMove)
				break
			case "tor":
				resultGameState = this.tornado(gameState, requestedMove)
				break
			case "esc":
				resultGameState = this.escudo(gameState, requestedMove)
				break
			case "mine":
				resultGameState = this.mina(gameState, requestedMove)
				break
			case "rad":
				resultGameState = this.radar(gameState, requestedMove)
				break

		}
		return resultGameState
	}

	static deflagrador(gameState, requestedMove) {
		let resultGameState = structuredClone(gameState);
		const { f, c } = requestedMove;
		const shooterInventory = resultGameState.ownerTurn ? resultGameState.ownerInventory : resultGameState.guestInventory;

		if (shooterInventory['deflagrador'] <= 0) return resultGameState;
		shooterInventory['deflagrador']--;

		let targetBoard = resultGameState.ownerTurn ? resultGameState.guestBoard : resultGameState.ownerBoard;
		const size = resultGameState.gameSettings.board_size;

		// Coordenadas en cruz
		const coords = [
		    { x: f, y: c },
		    { x: f - 1, y: c },
		    { x: f + 1, y: c },
		    { x: f, y: c - 1 },
		    { x: f, y: c + 1 }
		];

		let minaDetectada = false;

		coords.forEach(coord => {
		    if (coord.x >= 0 && coord.x < size && coord.y >= 0 && coord.y < size) {
				const res = Board.shoot(targetBoard, coord.x, coord.y);
				targetBoard = res.board;
				
				if (res.info === "boost") {
				    resultGameState = this.grabBoost(resultGameState, coord.x, coord.y);
					targetBoard[coord.x][coord.y] = "nada";
				}
				if (res.info === "mina") {
				    minaDetectada = true;
				}
				// Si res.info === "mina", Game.move se encargará de gestionar el castigo de turnos
				targetBoard = Board.checkForSunk(targetBoard, coord.x, coord.y);
		    }
		});

		if (resultGameState.ownerTurn) resultGameState.guestBoard = targetBoard;
		else resultGameState.ownerBoard = targetBoard;

		// El deflagrador consume el turno
		resultGameState.ownerTurn = !resultGameState.ownerTurn;
		resultGameState.turnStreak = 1;
		return resultGameState;
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
		const { f, c } = requestedMove;
		let resultGameState = structuredClone(gameState);
		const shooterInventory = resultGameState.ownerTurn ? resultGameState.ownerInventory : resultGameState.guestInventory;

		if (shooterInventory['tor'] <= 0) return gameState;
		shooterInventory['tor']--;

		let targetBoard = resultGameState.ownerTurn ? resultGameState.guestBoard : resultGameState.ownerBoard;
		const tam = targetBoard.length;
		const mitad = Math.floor(tam / 2);

		// Definir límites del cuadrante
		const filaMin = f < mitad ? 0 : mitad;
		const filaMax = f < mitad ? mitad : tam;
		const colMin = c < mitad ? 0 : mitad;
		const colMax = c < mitad ? mitad : tam;

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
			if (result.info === "boost") {
				resultGameState = Boosts.grabBoost(resultGameState, tx, ty);
				targetBoard = resultGameState.ownerTurn ? resultGameState.guestBoard : resultGameState.ownerBoard;
			}
			targetBoard = Board.checkForSunk(targetBoard, tx, ty);
		}

		if (resultGameState.ownerTurn) resultGameState.guestBoard = targetBoard;
		else resultGameState.ownerBoard = targetBoard;

		resultGameState.ownerTurn = !resultGameState.ownerTurn;
		return resultGameState;
	}

	static escudo(gameState, requestedMove){
		const { f, c } = requestedMove;
		let resultGameState = structuredClone(gameState);

		const shooterInventory = resultGameState.ownerTurn ? resultGameState.ownerInventory : resultGameState.guestInventory;

		if (shooterInventory['esc'] <= 0) return gameState;

		let myBoard = resultGameState.ownerTurn ? resultGameState.ownerBoard : resultGameState.guestBoard;

		if (myBoard[f][c] === "barco") {
			myBoard[f][c] = "escudo(barco)";
			shooterInventory['esc']--;
		} else if (myBoard[f][c] === "agua") {
			myBoard[f][c] = "escudo(agua)";
			shooterInventory['esc']--;
		}

		// El escudo no pasa el turno en principio
		return resultGameState;
	}

	static mina(gameState, requestedMove) {
		const resultGameState = structuredClone(gameState);
		const { f, c } = requestedMove;
		const shooterInventory = resultGameState.ownerTurn ? resultGameState.ownerInventory : resultGameState.guestInventory;

		if (shooterInventory['mine'] <= 0) return resultGameState;

		let myBoard = resultGameState.ownerTurn ? resultGameState.ownerBoard : resultGameState.guestBoard;
		
		// Solo se puede poner mina en agua
		if (myBoard[f][c] === "agua") {
			myBoard[f][c] = "minaActiva";
			shooterInventory['mine']--;
		}

		// Poner una mina consume el turno
		resultGameState.ownerTurn = !resultGameState.ownerTurn;
		resultGameState.turnStreak = 1;
		
		return resultGameState;
	}

	static radar(gameState, requestedMove){
		let resultGameState = structuredClone(gameState);
		const { f, c } = requestedMove;
		const shooterInventory = resultGameState.ownerTurn ? resultGameState.ownerInventory : resultGameState.guestInventory;

		if (shooterInventory['rad'] <= 0) return gameState;
		shooterInventory['rad']--;

		let targetBoard = resultGameState.ownerTurn ? resultGameState.guestBoard : resultGameState.ownerBoard;
		const tam = targetBoard.length;
		const mitad = Math.floor(tam / 2);

		const filaMin = f < mitad ? 0 : mitad;
		const filaMax = f < mitad ? mitad : tam;
		const colMin = c < mitad ? 0 : mitad;
		const colMax = c < mitad ? mitad : tam;

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
