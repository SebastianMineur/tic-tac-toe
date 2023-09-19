class TicTacToe
{
	constructor()
	{
		this._gameState = [0,0,0,0,0,0,0,0,0];
		this._playerTurn = 1;
		this._isGameOver = false;
		this._movesRecord = {};
	}

	static winState = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

	// Returns a random integer between min (inclusive) and max (inclusive).
	static randomRange(min, max)
	{
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	// Finds the best possible move for the specified 'player' and 'state',
	// based on the learned 'data'
	static pickMove(player, state, data)
	{
		let possibleMoves = [];
		let choice, move, moveList;
		let bestScore = undefined;
	
		// We have no data for this state,
		// or it is the first move of the game, in which case we want to
		// pick compeletely at random
		if (data[state] === undefined || state === "000000000")
		{
			bestScore = 0;
			moveList = [0,0,0,0,0,0,0,0,0];
		}
		// We have stored data. Find the best moves
		else
		{
			moveList = data[state];

			// Find the best scoring move that is not occupied
			// bestScore = Math.max(...moveList);
			for (let i = 0; i < moveList.length; i++)
			{
				if (state[i] === '0'
					&& (bestScore === undefined || moveList[i] > bestScore))
				{
					bestScore = moveList[i];
				}
			}
		}

		// Make a list of all moves that share the best score,
		// and are not occupied
		for (let i = 0; i < state.length; i++)
		{
			if (state[i] === '0' && moveList[i] === bestScore)
			{
				possibleMoves.push(i);
			}
		}

		// Choose randomly from possible moves
		choice = TicTacToe.randomRange(0, possibleMoves.length-1);
		move = possibleMoves[choice];
		
		console.log(
			"Player", player + ":",
			moveList,
			"Choice:", possibleMoves[choice],
			"(" + bestScore + ")"
		);

		return move;
	}

	get state()
	{
		return this._gameState.join('');
	}

	get moves()
	{
		return this._movesRecord;
	}

	get isGameOver()
	{
		return this._isGameOver;
	}

	get playerTurn()
	{
		return this._playerTurn;
	}

	makeMove(player, move)
	{
		if (this._isGameOver)
		{
			console.log("Game is over!");
			return false;
		}

		if (player !== 1 && player !== 2)
		{
			console.log("Invalid player:", player);
			return false;
		}

		if (player !== this._playerTurn)
		{
			console.log(`Not player ${player}'s turn!`);
			return false;
		}

		if (typeof move !== "number"	// Not a number
			|| move !== Math.floor(move)// Not an integer
			|| (move < 0 || move > 8))	// Out of range
		{
			console.log("Invalid move:", move);
			return false;
		}

		if (this._gameState[move] !== 0) {
			console.log(`Position ${move} is already occupied!`);
			return false;
		}

		// Save this move for the record
		this._movesRecord[this.state] = move;
		// Add players' mark to the board
		this._gameState[move] = player;
		// Check if any winner yet
		this.updateState();
		// Change player turn
		if (!this._isGameOver)
		{
			if (this._playerTurn === 1) this._playerTurn = 2;
			else this._playerTurn = 1;
		}
		return true;
	}

	restartGame()
	{
		this._gameState.forEach((_, i) => {
			this._gameState[i] = 0;
		});
		this._movesRecord = {};
		this._isGameOver = false;
		this._playerTurn = 1;
	}

	updateState()
	{
		// Game has already ended
		if (this._isGameOver) return;

		const state = this.state;

		for (const winState of TicTacToe.winState)
		{
			if (state[winState[0]] === state[winState[1]] &&
				state[winState[1]] === state[winState[2]] &&
				state[winState[0]] !== '0')
			{
				this._playerTurn = Number(state[winState[0]]);
				this._isGameOver = true;
				console.log("Player", this._playerTurn, "wins!");
				break;
			}
		}
		// Not a win, but no more possible moves == Draw
		if (!this._isGameOver && !state.includes(0))
		{
			this._playerTurn = 0;
			this._isGameOver = true;
			console.log("It's a draw...");
		}
	}

	exportMoves()
	{
		if (!this._isGameOver)
		{
			console.error("Cannot evaluate moves before game is over!");
			return;
		}

		console.log("AI learned:");
		const winner = this._playerTurn;
		const result = {};

		// for (const state of Object.keys(this._movesRecord))
		for (const state in this._movesRecord)
		{
			result[state] = [0,0,0,0,0,0,0,0,0];
			
			// Determine which player made this move
			// First count empty spaces, 0's, in state
			const player = (function()
			{
				let count = 0;
				for (const c of state)
				{
					if (c === '0') count++;
				}
				// Odd number is player 1, even is 2
				return 1 - (count % 2) + 1;
			})();

			let score = 0;
			
			// Player won
			if (winner === player)
			{
				score = 4;
			}
			// Game was a draw. Punish slightly
			else if (winner === 0)
			{
				score = 0;
			}
			// Player lost. Score negatively,
			// and more for moves made later in the game
			else
			{
				for (let i = 0; i < state.length; i++)
				{
					if (state[i] === String(player)) score--;
				}
				if (score < -3) score = -3;
				score--;
			}

			const move = this._movesRecord[state];

			// Add score to learned data
			result[state][move] = score;
			
			console.log(
				"State:", state,
				"Player:", player,
				"Move:", move,
				"Score:", score
			);
		}
		return result;
	}
}

class Player
{
	constructor(player)
	{
		this._player = player;
	}
}

class PlayerAI extends Player
{
	constructor(player)
	{
		super(player);
	}
}


class Learning
{
	constructor()
	{
		this._data = {};
	}

	get data()
	{
		return this._data;
	}

	static verify(data)
	{
		if (typeof data !== "object")
		{
			console.error("'data' is not an object");
			return false;
		}

		for (const state in data)
		{
			if (state.length !== 9)
			{
				console.error(`'data' has invalid key '${state}'`);
				return false;
			}

			for (const c of state)
			{
				if (c !== '0' && c !== '1' && c !== '2')
				{
					console.error(`'data' has invalid value '${c}' in key '${state}'`);
					return false;
				}
			}

			if (!Array.isArray(data[state]))
			{
				console.error(`value of 'data.${state}' is not an array:`, data[state]);
				return false;
			}
			if (data[state].length !== 9)
			{
				console.error(`value of 'data.${state}' has invalid length:`, data[state]);
				return false;
			}
			for (let i = 0; i < data[state].length; i++)
			{
				if (typeof data[state][i] !== "number")
				{
					console.error(`'data.${state}[${i}]' is not a number:`, data[state][i]);
					return false;
				}
			}
		}
		// Data is valid
		return true;
	}

	load(data)
	{
		if (!Learning.verify(data)) return;

		this._data = data;
		console.log("Loaded learning data successfully");
	}

	insert(data)
	{
		if (!Learning.verify(data)) return;

		for (const state in data)
		{
			if (this._data[state] === undefined)
			{
				this._data[state] = [0,0,0,0,0,0,0,0,0];
			}
			
			for (let i = 0; i < data[state].length; i++)
			{
				this._data[state][i] += data[state][i];
			}
		}
	}
}