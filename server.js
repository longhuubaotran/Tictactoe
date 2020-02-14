// Server Setup
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const socket = require("socket.io");
const io = socket(http);
const PORT = process.env.PORT || 3000;
const connectionsLimit = 2;

// Game Setup
let players = {}; // this obj keep references of connected player
let allSpot = Array.from(Array(15).keys()); // generate a board 4x4
let availableSpot = [];
let winner = null;
let isSecondplayer = false; // use to check how many players already in game
let winCell = []; // save position of winning spot

// Connect to server
http.listen(PORT, function() {
  console.log("listening on *:3000");
});

app.use(express.static("public"));

io.on("connection", socket => {
  // if 2 players already in game, the incoming connection will be disconnected
  if (io.engine.clientsCount > connectionsLimit) {
    socket.emit("overLimit", { message: "Game is full, come back later" });
    socket.disconnect();
    console.log("Disconnected...");
    return;
  }
  console.log("new connection", socket.id);
  // if no player in game, assign O to 1st player
  if (!isSecondplayer) {
    players = {};
    players[socket.id] = "O";
    isSecondplayer = true;
  } else {
    // second player will be assigned X, and display the board after 2 players join game
    players[socket.id] = "X";
    isSecondplayer = false;
    io.emit("yourMark", { players, displayBoard: true });
  }

  socket.on("play", ({ playerId, index }) => {
    // when a player click on a spot, it will send its player id and index of that spot to server
    // mark the board based on given index
    // check win after marking
    // send data back to other clients
    allSpot[index] = players[playerId];
    winner = checkWin();
    socket.broadcast.emit("play", {
      mark: players[playerId],
      index,
      winner,
      winCell
    });
  });

  // this checks after a player click on a spot
  // because each time a player click on spot, we must check win for that turn
  socket.on("checkWin", () => {
    winner = checkWin(allSpot);
    io.emit("checkWin", {
      winner,
      winCell
    });
  });

  // send restart order to all clients
  socket.on("restart", () => {
    restart();
    io.emit("restart");
  });

  socket.on("disconnect", () => {
    // if a player disconnect from game, delete their id
    // then if there is any player in game, if no player in game, empty the obj
    delete players[socket.id];
    let arrPlayers = Object.keys(players);
    if (arrPlayers.length == 0) {
      players = {};
      isSecondplayer = false;
      return;
    }
    // if the first player (O) out, we will assign the second player to O to make it be the first player
    // then incoming player will be second player
    if (players[arrPlayers[0]] == "X") {
      players[arrPlayers[0]] = "O";
      isSecondplayer = true;
    } else {
      players[arrPlayers[0]] = "O";
      isSecondplayer = true;
    }
    restart();
    console.log(`disconnect ${socket.id}`);
    io.emit("disconnect");
  });
});

function checkWin() {
  // horizontal check
  for (let i = 0; i <= 15; i += 4) {
    if (
      checkEqual(allSpot[i], allSpot[i + 1], allSpot[i + 2], allSpot[i + 3])
    ) {
      winCell = [i, i + 1, i + 2, i + 3];
      // return the winner X or O
      return allSpot[i];
    }
  }
  // vertical check
  for (let i = 0; i < 4; i++) {
    if (
      checkEqual(allSpot[i], allSpot[i + 4], allSpot[i + 8], allSpot[i + 12])
    ) {
      winCell = [i, i + 4, i + 8, i + 12];
      return allSpot[i];
    }
  }
  //diagnal check
  if (checkEqual(allSpot[0], allSpot[5], allSpot[10], allSpot[15])) {
    winCell = [0, 5, 10, 15];
    return allSpot[0];
  }
  if (checkEqual(allSpot[3], allSpot[6], allSpot[9], allSpot[12])) {
    winCell = [3, 6, 9, 12];
    return allSpot[3];
  }
  let availableSpot = checkAvailableSpots(allSpot);
  if (availableSpot.length == 0) {
    return "tie";
  }
}

function checkEqual(a, b, c, d) {
  return a == b && b == c && a == c && a == d;
}

function checkAvailableSpots(allSpot) {
  let availableSpot = allSpot.filter(spot => {
    return spot != "X" && spot != "O";
  });
  return availableSpot;
}

function restart() {
  allSpot = Array.from(Array(15).keys());
  availableSpot = [];
  winner = null;
  winCell = [];
}
