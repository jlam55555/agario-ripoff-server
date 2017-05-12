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
var Player = function() {
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
      if(distance < 10) {
	console.log(player.x, skittle.x, player.y, skittle.y, player.score);
        player.score += 0.1;
        map.skittles.splice(map.skittles.indexOf(skittle), 1);
        break;
      }
    }
  }
}
setInterval(checkSkittles, 500);

// listen to port
http.listen(process.env.PORT || 5000, function() {
  console.log('listening on *:' + (process.env.PORT || 5000));
});

// socket stuff
io.on("connection", function(socket) {
  console.log("a new player has entered");
  var player;
  socket.on("create", function(playerName) {
    player = new Player(playerName);
    map.players.push(player);
    socket.emit("player", player);
  }); 
  socket.on("update", function(x, y) {
    player.x = x;
    player.y = y;
  });
  setInterval(function() {
    socket.emit("map", map);
  }, 10);
  
});

