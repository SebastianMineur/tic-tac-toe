const menuDiv		= document.querySelector(".menu");
const gameDiv		= document.querySelector(".game");

const board			= document.querySelector("div.board");
const boardBtns		= document.querySelectorAll("button.square");

const uploadBtn		= document.querySelector("button#upload");
const downloadBtn	= document.querySelector("button#download");
const quitBtn		= document.querySelector("button#quit");
const startBtn		= document.querySelector("button#start");
const restartBtn	= document.querySelector("button#restart");

const pauseBtn		= document.querySelector("button#pause");
const btnGroup		= document.querySelector(".btn-group");
const playBtn		= document.querySelector("button#play");
const forwardBtn	= document.querySelector("button#forward");

const endCard		= document.querySelector(".end-card");

let tictactoe;
let players = [,,];
let isAutoPlaying = false;
let learning = new Learning();


// Create a new Promise that resolves on an event
const eventAction = function(target, type, executor) {
	let listener;
	const p = new Promise(resolve => {
		listener = (event) => {
			if (typeof executor === "function") {
				const returnVal = executor(event);
				if (returnVal === false) return;
				resolve(returnVal);
			}
			else resolve(executor);
			target.removeEventListener(type, listener);
		}
		target.addEventListener(type, listener);
	});

	p.dispose = () => {
		target.removeEventListener(type, listener);
	}

	return p;
}


// Create a new Promise that resolves after a timeout
const timeoutAction = function(timeout, executor) {
	let timer;
	const p = new Promise(resolve => {
		if (typeof executor === "function")
			timer = setTimeout(() => resolve(executor()), timeout);
		else
			timer = setTimeout(() => resolve(executor), timeout);
	});

	p.dispose = () => {
		clearTimeout(timer);
	};

	return p;
}


// Take an array of "action" Promises and return the result,
// of the first one to resolve.
const firstCompleted = async function(actions) {
	const result = await Promise.any(actions);
	actions.forEach(a => { if (a.dispose) a.dispose(); });
	actions.length = 0;
	return result;
}


// Game is over. Show end card and update AI data with results
const gameOver = function() {
	if (tictactoe.playerTurn === 1) {
		board.classList.add("transparent");
		endCard.querySelector("img").setAttribute("src", "assets/img/cross-light.svg");
		endCard.querySelector("p").innerHTML = "Wins!";
		endCard.classList.remove("hidden");
	}
	else if (tictactoe.playerTurn === 2) {
		board.classList.add("transparent");
		endCard.querySelector("img").setAttribute("src", "assets/img/circle-light.svg");
		endCard.querySelector("p").innerHTML = "Wins!";
		endCard.classList.remove("hidden");
	}
	else if (tictactoe.playerTurn === 0) {
		board.classList.add("transparent");
		endCard.querySelector("img").setAttribute("src", "assets/img/dash-light.svg");
		endCard.querySelector("p").innerHTML = "Draw";
		endCard.classList.remove("hidden");
	}
	learning.insert(tictactoe.exportMoves());
	restartBtn.classList.remove("hidden");
};


// Update game board
const updateBoard = function(state) {
	for (let i = 0; i < state.length; i++) {
		if (state[i] === '0') {
			boardBtns[i].classList.remove("circle", "cross");
		}
		else if (state[i] === '1') {
			boardBtns[i].classList.remove("circle");
			boardBtns[i].classList.add("cross");
		}
		else if (state[i] === '2') {
			boardBtns[i].classList.remove("cross");
			boardBtns[i].classList.add("circle");
		}
	}
}


// Save AI data and download to local system
const downloadObjectAsJson = function(exportObj, exportName) {
	const dataStr =
		"data:text/json;charset=utf-8,"
		+ encodeURIComponent(JSON.stringify(exportObj, null, '\t'));
	const downloadAnchorNode = document.createElement('a');
	downloadAnchorNode.setAttribute("href",		dataStr);
	downloadAnchorNode.setAttribute("download", exportName + ".json");
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
	console.log("Exported learning data");
}


// Pick a JSON file from local system and load AI data
const uploadJson = function() {
	const fileInput = document.createElement("input");
	fileInput.setAttribute("type", "file");
	fileInput.setAttribute("accept", "application/json");
	fileInput.addEventListener("input", () => {
		try {
			const files = fileInput.files;
			if (!files.length) {
				alert('No file selected!');
				return;
			}
			const file = files[0];
			const reader = new FileReader();
			reader.onload = (event) => {
				learning.load(JSON.parse(event.target.result));
				console.log("Imported learning data");
			};
			reader.readAsText(file);
		} catch (err) {
			console.error(err);
		}
		fileInput.remove();
	});
	fileInput.click();
}


// Quit game and show start menu
const quitGame = function() {
	tictactoe = undefined;

	endCard.classList.add("hidden");
	quitBtn.classList.add("hidden");
	restartBtn.classList.add("hidden");
	pauseBtn.classList.add("hidden");
	btnGroup.classList.add("hidden");
	gameDiv.classList.add("hidden");
	board.classList.remove("transparent");
	
	startBtn.classList.remove("hidden");
	uploadBtn.classList.remove("hidden");
	downloadBtn.classList.remove("hidden");
	menuDiv.classList.remove("hidden");
}


// Restart current game and reset board
const restartGame = function() {
	tictactoe.restartGame();
	updateBoard(tictactoe.state);

	endCard.classList.add("hidden");
	board.classList.remove("transparent");
	restartBtn.classList.add("hidden");

	boardBtns.forEach(item => {
		item.classList.remove("circle", "cross");
	});
}


// Main game loop
const runGame = async function() {
	tictactoe = new TicTacToe();
	let actions = [];

	while (true) {
		updateBoard(tictactoe.state);

		while (!tictactoe.isGameOver) {
			const currentPlayer = tictactoe.playerTurn;
			const state = tictactoe.state;
			let move;

			actions.push(
				eventAction(quitBtn, "click", {quitGame: true} ),
			);
		
			// AI player
			if (players[currentPlayer] instanceof PlayerAI) {
				
				if (isAutoPlaying) {
					actions.push(eventAction(pauseBtn, "click", {pauseGame: true} ));
					actions.push(timeoutAction(500, {cpuMove: true} ));
				}
				else {
					actions.push(eventAction(forwardBtn, "click", {cpuMove: true} ));
					actions.push(eventAction(playBtn, "click", {cpuMove: true} ));
				}
			}
			// Human player
			else {
				actions.push(eventAction(board, "click", event => {
					if (event.target.tagName !== "BUTTON") return false;
					return {playerMove: Number(event.target.id)};
				}));
				// boardBtns.forEach((btn, i) => {
				// 	actions.push(eventAction(btn, "click", {playerMove: i} ));
				// });
			}

			const result = await firstCompleted(actions);

			if (result.quitGame) {
				quitGame();
				return;
			}
			else if (result.pauseGame) {
				continue;
			}
			else if (result.cpuMove) {
				move = TicTacToe.pickMove(currentPlayer, state, learning.data);
			}
			else if (result.playerMove !== undefined) {
				move = result.playerMove;
			}
			else {
				continue;
			}

			// players[currentPlayer].saveMove(state, move);
			tictactoe.makeMove(currentPlayer, move);
			boardBtns[move].classList.add(currentPlayer === 1 ? "circle" : "cross");
			updateBoard(tictactoe.state);
		}

		gameOver();

		actions.push(
			eventAction(quitBtn, "click", {quitGame: true} ),
			eventAction(restartBtn, "click", {restartGame: true} ),
			eventAction(playBtn, "click", {restartGame: true} ),
			eventAction(forwardBtn, "click", {restartGame: true} )
		);

		if (isAutoPlaying
			&& players[1] instanceof PlayerAI
			&& players[2] instanceof PlayerAI)
		{
			actions.push(timeoutAction(1000, {restartGame: true} ));
		}

		const result = await firstCompleted(actions);

		if (result.restartGame) {
			restartGame();
			continue;
		}
		else if (result.quitGame) {
			quitGame();
			return;
		}
	}
}


// Start button
startBtn.addEventListener("click", () => {
	menuDiv.classList.add("hidden");
	startBtn.classList.add("hidden");
	uploadBtn.classList.add("hidden");
	downloadBtn.classList.add("hidden");

	gameDiv.classList.remove("hidden");
	quitBtn.classList.remove("hidden");

	if (document.querySelector("select#player1").value === "cpu") {
		players[1] = new PlayerAI(1);
	}
	else {
		players[1] = new Player(1);
	}

	if (document.querySelector("select#player2").value === "cpu") {
		players[2] = new PlayerAI(2);
	}
	else {
		players[2] = new Player(2);
	}

	if (players[1] instanceof PlayerAI && players[2] instanceof PlayerAI) {
		btnGroup.classList.remove("hidden");
		isAutoPlaying = false;
	}
	else {
		isAutoPlaying = true;
	}

	runGame();
});


// Download AI data
downloadBtn.addEventListener("click", () => {
	downloadObjectAsJson(learning.data, "learning");
});


// UpLoad AI data
uploadBtn.addEventListener("click", () => {
	uploadJson();
});


// Play button
playBtn.addEventListener("click", () => {
	if (!isAutoPlaying) {
		isAutoPlaying = true;
		pauseBtn.classList.remove("hidden");
		btnGroup.classList.add("hidden");
	}
});


// Pause button
pauseBtn.addEventListener("click", () => {
	if (isAutoPlaying) {
		isAutoPlaying = false;
		pauseBtn.classList.add("hidden");
		btnGroup.classList.remove("hidden");
	}
});

(async function() {
	const response = await fetch("assets/data/learning.json");
	learning.load(await response.json());
})();
