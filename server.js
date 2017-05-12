var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

var mapWidth = 5000;
var mapHeight = 5000;
var map = {skittles: [], players: []};

var colors = ["#e74c3c", "#e67e22", "#9b59b6", "#3498db", "#2ecc71"];
var Skittle = function() {
  this.x = Math.random()*mapWidth;
  this.y = Math.random()*mapHeight;
  this.color = colors[Math.floor(Math.random()*colors.length)];
}
var Player = function(playerName) {
  this.name = playerName;
  this.id = new Date().valueOf();
  this.x = Math.random()*mapWidth;
  this.y = Math.random()*mapHeight;
  this.color = colors[Math.floor(Math.random()*colors.length)];
  this.score = 1;
  this.health = 1;
  this.upgrades = {
    health: 0,
    speed: 0,
    damage: 0
  };
};

// automatically generate skittles
var createSkittles = function() {
  while(map.skittles.length < 200) {
    map.skittles.push(new Skittle());
  }
};
setInterval(createSkittles, 500);
var checkSkittles = function() {
  for(var skittle of map.skittles) {
    for(var player of map.players) {
      var xDiff = player.x - skittle.x;
      var yDiff = player.y - skittle.y;
      var distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
      if(distance < 10*player.score) {
        player.score += 0.005;
        map.skittles.splice(map.skittles.indexOf(skittle), 1);
        break;
      }
    }
  }
}
setInterval(checkSkittles, 10);
var checkPlayers = function() {
  for(var player1 of map.players) {
    for(var player2 of map.players) {
      if(player1.id == player2.id) continue;
      var xDiff = player1.x - player2.x;
      var yDiff = player1.y - player2.y;
      var distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
      if(distance < 10*(player1.score+player2.score)) {
        player1.health -= 0.1;
        player2.health -= 0.1;
      }
    }
  }
};

// listen to port
http.listen(process.env.PORT || 5000, function() {
  console.log('Server listening on port ' + (process.env.PORT || 5000) + ".");
});

// socket stuff
io.on("connection", function(socket) {
  var player;
  socket.on("name", function(playerName) {
    player = new Player(playerName);
    map.players.push(player);
    console.log("Player \"" + player.name + "\" (id " + player.id + ") has entered. " + map.players.length + " players currently online.");
    socket.emit("player", player);
    setInterval(function() {
      socket.emit("mapScoreUpdate", map, player.score, player.health);
    }, 10);
    socket.on("positionUpdate", function(x, y) {
      player.x = x;
      player.y = y;
    });
    socket.on("disconnect", function() {
      map.players.splice(map.players.indexOf(player));
      console.log("Player \"" + player.name + "\" (id " + player.id + ") has left. " + map.players.length + " players currently online.");
    });
  }); 
  socket.emit("mapDimensions", mapWidth, mapHeight);
  
});

