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
  diceRoll: 0
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

// Função para gerar tabuleiro com campos inúteis
function generateBoard(playerCount) {
  const boardSize = playerCount + 2;
  const letters = ['S', 'W', 'O', 'T'];
  const board = [];
  
  // Criar tabuleiro vazio
  for (let r = 0; r < boardSize; r++) {
    board[r] = [];
    for (let c = 0; c < boardSize; c++) {
      board[r][c] = null;
    }
  }
  
  // Posicionar LARGADA
  const startRow = Math.floor(boardSize / 2);
  board[startRow][0] = "LARGADA";
  
  // Posicionar PASSAGEM
  board[0][Math.floor(boardSize / 2)] = "PASSAGEM";
  board[boardSize - 1][Math.floor(boardSize / 2)] = "PASSAGEM";
  
  // Calcular número total de células e quantas serão inúteis (metade das ativas)
  const totalCells = boardSize * boardSize - 3; // Descontar LARGADA e 2 PASSAGEM
  const uselessCells = Math.floor(totalCells / 2);
  
  // Marcar células como inúteis aleatoriamente
  let uselessCount = 0;
  while (uselessCount < uselessCells) {
    const r = Math.floor(Math.random() * boardSize);
    const c = Math.floor(Math.random() * boardSize);
    
    if (board[r][c] === null) {
      board[r][c] = "INUTIL";
      uselessCount++;
    }
  }
  
  // Preencher o restante com letras aleatórias
  const letterDistribution = {
    S: Math.ceil(boardSize * 1.5),
    W: Math.ceil(boardSize * 1.5),
    O: boardSize,
    T: boardSize
  };
  
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === null) {
        const availableLetters = Object.keys(letterDistribution).filter(l => letterDistribution[l] > 0);
        if (availableLetters.length > 0) {
          const randomLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
          board[r][c] = randomLetter;
          letterDistribution[randomLetter]--;
        }
      }
    }
  }
  
  return board;
}

// Inicializar tabuleiro com tokens
function initBoard(playerCount) {
  const generatedLayout = generateBoard(playerCount);
  gameState.board = [];
  gameState.tokensRemaining = 0;
  
  for (let r = 0; r < generatedLayout.length; r++) {
    gameState.board[r] = [];
    for (let c = 0; c < generatedLayout[r].length; c++) {
      const cell = generatedLayout[r][c];
      if (cell === null || cell === "INUTIL") {
        gameState.board[r][c] = null;
      } else {
        const isToken = cell !== "LARGADA" && cell !== "PASSAGEM";
        gameState.board[r][c] = {
          type: cell === "LARGADA" ? "LARGADA" : cell === "PASSAGEM" ? "PASSAGEM" : "NORMAL",
          letter: cell === "LARGADA" || cell === "PASSAGEM" ? null : cell,
          ficha: isToken,
          playersHere: [],
          row: r,
          col: c
        };
        if (isToken) gameState.tokensRemaining++;
      }
    }
  }
}

// Renderizar tabuleiro
function renderBoard() {
  gameBoard.innerHTML = "";
  
  // Definir dimensões do grid baseado no tamanho do tabuleiro
  gameBoard.style.gridTemplateColumns = `repeat(${gameState.board[0].length}, 1fr)`;
  gameBoard.style.gridTemplateRows = `repeat(${gameState.board.length}, 1fr)`;
  
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

        if (gameState.gameStarted) {
          div.style.cursor = "pointer";
          div.onclick = () => handleCellClick(r, c);
        }
      }
      gameBoard.appendChild(div);
    }
  }
}

// Iniciar novo jogo
startGameBtn.addEventListener("click", () => {
  const count = parseInt(playerCountInput.value);
  if (count < 5 || count > 7 || count % 2 === 0) {
    alert("Número de jogadores deve ser ímpar entre 5 e 7.");
    return;
  }
  
  // Inicializar estado do jogo
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
  
  initBoard(count);
  renderBoard();
  updatePlayerList();
  updateStatus();
  
  // Fechar modal corretamente
  playerModal.style.display = "none";
});

// Fechar modal quando clicar no botão de fechar
closeModalBtn.addEventListener("click", () => {
  playerModal.style.display = "none";
});

// Inicializar jogo
document.addEventListener("DOMContentLoaded", () => {
  playerModal.style.display = "flex";
});

