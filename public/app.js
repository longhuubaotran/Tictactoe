// Make connection
const socket = io();
let playerId;
socket.on("connect", () => {
  playerId = socket.id;
  console.log(playerId);
});

const board = document.querySelector(".container");
const result = document.querySelector(".endgame");
const restart = document.querySelector(".restart-btn");
const playerInfo = document.querySelector(".info");
const loading = document.querySelector(".loading");

let playerMark;

restart.addEventListener("click", function(e) {
  restartFn();
});

// restart event from server
socket.on("restart", () => {
  winner = null;
  board.innerHTML = boardHTML;
  restart.style.display = "none";
  board.style.pointerEvents = "auto";
  result.style.display = "none";
});

// if a client disconnect, app display the loading screen
socket.on("disconnect", () => {
  playerInfo.style.display = "none";
  board.style.display = "none";
  loading.style.display = "block";
  restartFn();
});

// Mark is given to player by server (X or O), who connects first is O
socket.on("yourMark", ({ players, displayBoard }) => {
  if (displayBoard) {
    board.style.display = "block";
    loading.style.display = "none";
    playerInfo.style.display = "block";
    playerMark = players[playerId];
    playerInfo.innerText = `You are playing as: ${players[playerId]}`;
  }
});

// over connections limit
socket.on("overLimit", err => {
  alert(err.message);
});

// after a player click on a spot
// server will send data to other client, and client use that data to mark on their board
socket.on("play", ({ mark, index, winner, winCell }) => {
  if (winner != null) {
    displayWinner(winner);
    displayWinCell(winCell);
    // mark on board based on the index from other client
    // and make that spot unclickable
    const cell = document.getElementById(index);
    cell.innerText = mark;
    board.style.pointerEvents = "none";
    cell.style.pointerEvents = "none";
    return;
  }
  const cell = document.getElementById(index);
  cell.innerText = mark;
  board.style.pointerEvents = "auto";
  cell.style.pointerEvents = "none";
});

// check win event
socket.on("checkWin", ({ winner, winCell }) => {
  if (winner != null) {
    displayWinner(winner);
    displayWinCell(winCell);
    board.style.pointerEvents = "none";
  }
});

board.addEventListener("click", function(e) {
  // player click on a spot then we mark it on board,
  // send player id and index of that spot to server
  let index = e.target.id;
  if (e.target.textContent == "") {
    e.target.innerText = playerMark;
    e.target.style.pointerEvents = "none";
    board.style.pointerEvents = "none";
    socket.emit("play", { playerId, index });
    socket.emit("checkWin");
  } else {
    alert("This spot is not available");
  }
});

function displayWinner(winner) {
  if (winner != null) {
    switch (winner) {
      case "tie":
        console.log("tie");
        board.style.pointerEvents = "none";
        result.innerText = "Tie!";
        result.style.display = "block";
        break;
      case "X":
        console.log("X Win");
        board.style.pointerEvents = "none";
        result.innerText = "X Win!";
        result.style.display = "block";
        break;
      case "O":
        console.log("O Win");
        board.style.pointerEvents = "none";
        result.innerText = "O Win!";
        result.style.display = "block";
        break;
      default:
        break;
    }
  }
}

function displayWinCell(winCell) {
  winCell.forEach(cell => {
    document.getElementById(cell).style.backgroundColor = "blue";
  });
  restart.style.display = "block";
}

function restartFn() {
  restart.style.display = "none";
  socket.emit("restart");
}

const boardHTML = `<tr>
<td id="0"></td>
<td id="1"></td>
<td id="2"></td>
<td id="3"></td>
</tr>
<tr>
<td id="4"></td>
<td id="5"></td>
<td id="6"></td>
<td id="7"></td>
</tr>
<tr>
<td id="8"></td>
<td id="9"></td>
<td id="10"></td>
<td id="11"></td>
</tr>
<tr>
<td id="12"></td>
<td id="13"></td>
<td id="14"></td>
<td id="15"></td>
</tr>`;
