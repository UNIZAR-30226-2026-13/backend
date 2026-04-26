

class BoardModel {

	static emptyBoard(size) {
		let board = []
		for (let i = 0; i < size; i++) {
			let row = []
			for (let j = 0; j < size; j++) {
				row.push("agua")
			}
			board.push(row)
		}
		return board
	}
}

module.exports = BoardModel;