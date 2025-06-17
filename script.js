// script.js

const cardFactors = {
    S: [
        "Estrutura, sistemas ou ferramentas",
        "Estratégia, missão, visão ou valores",
        "Produtos ou serviços",
        "Cultura, pessoas ou competências",
        "Mercado, concorrentes, fornecedores ou entrantes",
        "Clientes",
    ],
    W: [
        "Estrutura, sistemas ou ferramentas",
        "Estratégia, missão, visão ou valores",
        "Produtos ou serviços",
        "Cultura, pessoas ou competências",
        "Mercado, concorrentes, fornecedores ou entrantes",
        "Clientes",
    ],
    O: [
        "Aspectos políticos",
        "Aspectos econômicos",
        "Aspectos ambientais",
        "Aspectos sociais",
        "Aspectos legais",
    ],
    T: [
        "Aspectos políticos",
        "Aspectos econômicos",
        "Aspectos ambientais",
        "Aspectos sociais",
        "Aspectos legais",
    ],
};

const playerColors = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#d35400",
];

const gameState = {
    board: [],
    players: [],
    currentPlayerIdx: 0,
    currentCard: null,
    currentSuggestion: "",
    tokensRemaining: 0,
    diary: [],
    finalSuggestions: [],
    gameStarted: false,
    possibleMoves: [],
    diceRoll: 0,
    currentPhase: "setup", // setup, rolling, moving, suggesting, voting
};

// DOM Elements
const gameBoard = document.getElementById("gameBoard");
const cardContent = document.getElementById("cardContent");
const suggestionInputDiv = document.getElementById("suggestionInput");
const suggestionInput = document.getElementById("suggestion");
const submitSuggestionBtn = document.getElementById("submitSuggestion");
const votingButtons = document.getElementById("votingButtons");
const voteYesBtn = document.getElementById("voteYes");
const voteNoBtn = document.getElementById("voteNo");
const playerList = document.getElementById("playerList");
const diaryBody = document.getElementById("diaryBody");
const finalSuggestionsBody = document.getElementById("finalSuggestionsBody");
const playerModal = document.getElementById("playerModal");
const playerCountInput = document.getElementById("playerCount");
const startGameBtn = document.getElementById("startGame");
const closeModalBtn = document.getElementById("closeModal");
const diceRollBtn = document.getElementById("diceRoll");
const endTurnBtn = document.getElementById("endTurn");
const endGameBtn = document.getElementById("endGame");
const newGameBtn = document.getElementById("newGame");
const currentPlayerDisplay = document.getElementById("currentPlayer");
const tokensRemainingDisplay = document.getElementById("tokensRemaining");
const suggestionsCountDisplay = document.getElementById("suggestionsCount");

// Funções do jogo

function generateBoard() {
    // Tabuleiro fixo baseado na imagem de referência
    const boardLayout = [
        ['S', 'W', 'O', null, null],
        ['PASSAGEM', null, 'T', 'S', 'O'],
        ['T', 'W', 'S', null, 'O'],
        ['W', 'O', null, 'Desafio SWOT', 'LARGADA'],
        ['O', 'T', 'W', 'T', null],
        [null, 'T', 'W', 'S', null],
        ['PASSAGEM', null, 'S', 'W', 'O'],
        [null, 'PASSAGEM', null, 'T', null]
    ];

    // Converter para a estrutura do jogo
    const board = [];
    let tokensCount = 0;

    for (let r = 0; r < boardLayout.length; r++) {
        board[r] = [];
        for (let c = 0; c < boardLayout[r].length; c++) {
            const cellValue = boardLayout[r][c];

            if (!cellValue) {
                board[r][c] = null;
            } else {
                const isToken = cellValue !== 'LARGADA' && cellValue !== 'PASSAGEM' && cellValue !== 'Desafio SWOT';
                board[r][c] = {
                    type: cellValue === 'LARGADA' ? 'LARGADA' :
                        cellValue === 'PASSAGEM' ? 'PASSAGEM' :
                            cellValue === 'Desafio SWOT' ? 'SPECIAL' : 'NORMAL',
                    letter: ['S', 'W', 'O', 'T'].includes(cellValue) ? cellValue : null,
                    ficha: isToken,
                    playersHere: [],
                    row: r,
                    col: c
                };
                if (isToken) tokensCount++;
            }
        }
    }

    gameState.tokensRemaining = tokensCount;
    return board;
}
function initBoard() {
    gameState.board = generateBoard();
}

function renderBoard() {
    gameBoard.innerHTML = "";


    // Manter a proporção correta para o tabuleiro 5x8
    gameBoard.style.gridTemplateColumns = `repeat(5, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(8, 1fr)`;
    for (let r = 0; r < gameState.board.length; r++) {
        for (let c = 0; c < gameState.board[r].length; c++) {
            const cell = gameState.board[r][c];
            const div = document.createElement("div");
            div.classList.add("cell");
            div.setAttribute("data-row", r);
            div.setAttribute("data-col", c);

            if (!cell) {
                div.classList.add("unavailable");
            } else {
                if (cell.type === "LARGADA") div.classList.add("start");
                else if (cell.type === "PASSAGEM") div.classList.add("passage");
                else if (cell.letter) div.classList.add(cell.letter.toLowerCase());

                if (cell.type === "LARGADA") div.textContent = "LARGADA";
                else if (cell.type === "PASSAGEM") div.textContent = "PASSAGEM";
                else if (cell.letter) div.textContent = cell.letter;

                if (cell.ficha) {
                    const fichaDiv = document.createElement("div");
                    fichaDiv.classList.add("token");
                    div.appendChild(fichaDiv);
                }

                cell.playersHere.forEach((pid, i) => {
                    const player = gameState.players.find(p => p.id === pid);
                    if (player) {
                        const playerDiv = document.createElement("div");
                        playerDiv.classList.add("player-marker");
                        playerDiv.style.backgroundColor = player.color;
                        playerDiv.textContent = player.id + 1;
                        if (i > 0) playerDiv.style.transform = `translateX(${i * 22}px)`;
                        div.appendChild(playerDiv);
                    }
                });

                if (gameState.gameStarted && gameState.currentPhase === "moving") {
                    const isPossibleMove = gameState.possibleMoves.some(m => m.row === r && m.col === c);
                    if (isPossibleMove) {
                        div.style.cursor = "pointer";
                        div.onclick = () => handleCellClick(r, c);
                    } else {
                        div.style.cursor = "not-allowed";
                    }
                }
            }
            gameBoard.appendChild(div);
        }
    }
}

function updatePlayerList() {
    playerList.innerHTML = "";
    gameState.players.forEach((player, idx) => {
        const li = document.createElement("li");
        if (idx === gameState.currentPlayerIdx) {
            li.classList.add("current-player");
        }
        li.innerHTML = `
      <span>${player.name}</span>
      <div class="player-score">${player.score}</div>
    `;
        playerList.appendChild(li);
    });
}

function updateStatus() {
    currentPlayerDisplay.textContent = `Jogador ${gameState.currentPlayerIdx + 1}`;
    tokensRemainingDisplay.textContent = gameState.tokensRemaining;
    suggestionsCountDisplay.textContent = gameState.diary.length;
}

function updateDiary() {
    diaryBody.innerHTML = "";
    gameState.diary.forEach((entry, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${entry.category}</td>
      <td>${entry.suggestion}</td>
    `;
        diaryBody.appendChild(tr);
    });
}

function updateFinalSuggestions() {
    finalSuggestionsBody.innerHTML = "";
    gameState.diary.forEach((entry, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td><input type="checkbox" data-idx="${idx}"></td>
      <td>${entry.category}</td>
      <td>${entry.suggestion}</td>
    `;
        finalSuggestionsBody.appendChild(tr);
    });
}

function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

function calculatePossibleMoves(currentPosition, diceValue) {
    const moves = [];
    const { row, col } = currentPosition;
    const boardSize = gameState.board.length;

    // Implementar lógica de movimentação (exemplo simples)
    for (let r = Math.max(0, row - diceValue); r <= Math.min(boardSize - 1, row + diceValue); r++) {
        for (let c = Math.max(0, col - diceValue); c <= Math.min(boardSize - 1, col + diceValue); c++) {
            if (Math.abs(r - row) + Math.abs(c - col) <= diceValue) {
                if (gameState.board[r][c] !== null) {
                    moves.push({ row: r, col: c });
                }
            }
        }
    }

    return moves;
}

function movePlayer(playerId, newRow, newCol) {
    const player = gameState.players[playerId];

    // Remover jogador da posição atual
    if (player.position) {
        const currentCell = gameState.board[player.position.row][player.position.col];
        if (currentCell) {
            currentCell.playersHere = currentCell.playersHere.filter(id => id !== playerId);
        }
    }

    // Adicionar jogador à nova posição
    player.position = { row: newRow, col: newCol };
    const newCell = gameState.board[newRow][newCol];
    newCell.playersHere.push(playerId);

    // Verificar se há ficha na célula
    if (newCell.ficha) {
        gameState.currentPhase = "suggesting";
        drawCard(newCell.letter);
    } else {
        gameState.currentPhase = "rolling";
        endTurnBtn.disabled = false;
    }

    renderBoard();
}

function drawCard(category) {
    const factors = cardFactors[category];
    const randomFactor = factors[Math.floor(Math.random() * factors.length)];
    gameState.currentCard = { category, factor: randomFactor };
    cardContent.innerHTML = `
    <strong>Categoria:</strong> ${category}<br>
    <strong>Fator:</strong> ${randomFactor}
  `;
    suggestionInputDiv.style.display = "block";
}

function handleCellClick(row, col) {
    if (gameState.currentPhase !== "moving") return;

    const playerId = gameState.currentPlayerIdx;
    movePlayer(playerId, row, col);
}

// Event Listeners

startGameBtn.addEventListener("click", () => {
    const count = parseInt(playerCountInput.value);
    if (count < 5 || count > 7 || count % 2 === 0) {
        alert("Número de jogadores deve ser ímpar entre 5 e 7.");
        return;
    }

    gameState.players = Array.from({ length: count }, (_, i) => ({
        id: i,
        name: `Jogador ${i + 1}`,
        position: { row: Math.floor((count + 2) / 2), col: 0 }, // Posição LARGADA
        score: 0,
        color: playerColors[i]
    }));

    gameState.currentPlayerIdx = 0;
    gameState.diary = [];
    gameState.finalSuggestions = [];
    gameState.gameStarted = true;
    gameState.currentPhase = "rolling";

    initBoard(count);
    renderBoard();
    updatePlayerList();
    updateStatus();
    playerModal.style.display = "none";

    // Habilitar/desabilitar botões apropriados
    diceRollBtn.disabled = false;
    endTurnBtn.disabled = true;
});

closeModalBtn.addEventListener("click", () => {
    playerModal.style.display = "none";
});

diceRollBtn.addEventListener("click", () => {
    const diceValue = rollDice();
    gameState.diceRoll = diceValue;
    cardContent.textContent = `Você rolou um ${diceValue}! Selecione para onde mover.`;

    const currentPlayer = gameState.players[gameState.currentPlayerIdx];
    gameState.possibleMoves = calculatePossibleMoves(currentPlayer.position, diceValue);

    gameState.currentPhase = "moving";
    diceRollBtn.disabled = true;
    renderBoard();
});

endTurnBtn.addEventListener("click", () => {
    gameState.currentPlayerIdx = (gameState.currentPlayerIdx + 1) % gameState.players.length;
    gameState.currentPhase = "rolling";

    updatePlayerList();
    updateStatus();
    diceRollBtn.disabled = false;
    endTurnBtn.disabled = true;

    cardContent.textContent = `Vez do Jogador ${gameState.currentPlayerIdx + 1}. Role o dado.`;
    suggestionInputDiv.style.display = "none";
    votingButtons.style.display = "none";
    renderBoard();
});

submitSuggestionBtn.addEventListener("click", () => {
    const suggestion = suggestionInput.value.trim();
    if (!suggestion) {
        alert("Por favor, digite uma sugestão válida.");
        return;
    }

    const currentCell = gameState.players[gameState.currentPlayerIdx].position;
    const cell = gameState.board[currentCell.row][currentCell.col];

    gameState.currentSuggestion = {
        category: cell.letter,
        factor: gameState.currentCard.factor,
        suggestion: suggestion,
        player: gameState.currentPlayerIdx
    };

    suggestionInput.value = "";
    suggestionInputDiv.style.display = "none";
    votingButtons.style.display = "block";

    cardContent.innerHTML += `<hr><strong>Sugestão:</strong> ${suggestion}`;
});

voteYesBtn.addEventListener("click", () => {
    gameState.diary.push(gameState.currentSuggestion);

    // Remover ficha da célula
    const currentCell = gameState.players[gameState.currentPlayerIdx].position;
    const cell = gameState.board[currentCell.row][currentCell.col];
    cell.ficha = false;
    gameState.tokensRemaining--;

    updateDiary();
    updateStatus();
    updateFinalSuggestions();

    votingButtons.style.display = "none";
    gameState.currentPhase = "rolling";
    endTurnBtn.disabled = false;

    if (gameState.tokensRemaining === 0) {
        endGame();
    }
});

voteNoBtn.addEventListener("click", () => {
    votingButtons.style.display = "none";
    gameState.currentPhase = "rolling";
    endTurnBtn.disabled = false;
});

endGameBtn.addEventListener("click", endGame);

newGameBtn.addEventListener("click", () => {
    playerModal.style.display = "flex";
});

function endGame() {
    gameState.gameStarted = false;
    cardContent.textContent = "Jogo finalizado! Selecione até 5 sugestões para a Matriz SWOT Final.";
    diceRollBtn.disabled = true;
    endTurnBtn.disabled = true;

    // Mostrar todas as sugestões para seleção final
    updateFinalSuggestions();
}

// Inicializar jogo
document.addEventListener("DOMContentLoaded", () => {
    playerModal.style.display = "flex";
    diceRollBtn.disabled = true;
    endTurnBtn.disabled = true;
});