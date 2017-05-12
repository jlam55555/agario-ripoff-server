var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

var mapWidth = 1000;
var mapHeight = 1000;
var map = {skittles: [], players: []};

var colors = ["red", "green", "blue"];
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
};

// automatically generate skittles
var createSkittles = function() {
  while(map.skittles.length < 400) {
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

// listen to port
http.listen(process.env.PORT || 5000, function() {
  console.log('Server listening on port ' + (process.env.PORT || 5000) + ".");
});

// socket stuff
io.on("connection", function(socket) {
  var player;
  socket.on("name", function(playerName) {
    console.log("Player \"" + name + "\" (id " + player.id + ") has entered. " + map.players.length + " players currently online.");
    player = new Player(playerName);
    map.players.push(player);
    socket.emit("player", player);
    setInterval(function() {
      socket.emit("mapScoreUpdate", map, player.score);
    }, 10);
    socket.on("positionUpdate", function(x, y) {
      player.x = x;
      player.y = y;
    });
  }); 
  socket.emit("mapDimensions", mapWidth, mapHeight);
  socket.on("disconnect", function() {
    map.players.splice(map.players.indexOf(player));
    console.log("Player \"" + player.name + "\" (id " + player.id + ") has left. " + map.players.length + " players currently online.");
  });
  
});

