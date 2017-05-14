var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);

var mapWidth = 500;
var mapHeight = 500;
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
  this.money = 0;
  this.health = 1;
  this.oldX = 0;
  this.oldY = 0;
  this.upgrades = {
    health: 0,
    speed: 0,
    damage: 0,
    regen: 0
  };
};

// automatically generate skittles
var createSkittles = function() {
  while(map.skittles.length < 10) {
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
        player.money++;
        map.skittles.splice(map.skittles.indexOf(skittle), 1);
        break;
      }
    }
  }
}
setInterval(checkSkittles, 40);
var checkPlayers = function() {
  for(var player1 of map.players) {
    for(var player2 of map.players) {
      if(player1.id == player2.id) continue;
      var xDiff = player1.x - player2.x;
      var yDiff = player1.y - player2.y;
      var distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
      if(distance < 10*(player1.score+player2.score)) {
        player1.health -= 0.05;
        player2.health -= 0.05;
        player1.oldX += Math.cos(player2.direction)*10;
        player1.oldY += Math.sin(player2.direction)*10;
        player2.oldX += Math.cos(player1.direction)*10;
        player2.oldY += Math.sin(player1.direction)*10;
      }
    }
  }
};
setInterval(checkPlayers, 40);
var movePlayers = function() {
  for(var player of map.players) {
    if(player.direction === undefined) continue;
    var newX = Math.min(Math.max(player.x+0.5*Math.cos(player.direction)*3+0.5*player.oldX, 0), mapWidth);  // change speed later
    var newY = Math.min(Math.max(player.y+0.5*Math.sin(player.direction)*3+0.5*player.oldY, 0), mapHeight);
    player.oldX = newX - player.x;
    player.oldY = newY - player.y;
    player.x = newX;
    player.y = newY;
  }
};
setInterval(movePlayers, 40);

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
      socket.emit("update", map, player);
      if(player.health <= 0) {
        socket.emit("died");
        socket.disconnect();
      }
    }, 20);
    socket.on("direction", function(degrees) {
      player.direction = degrees * Math.PI/180;
    });
    socket.on("update", function(type) {
      if(type == "health" && player.money >= player.upgrades.health+1) {
        player.upgrades.health++;
        player.money -= player.upgrades.health;
      } else if(type == "speed" && player.money > player.upgrades.speed+1) {
        player.upgrades.speed++;
        player.money -= player.upgrades.speed;
      } else if(type == "damage" && player.money > player.upgrades.damage+1) {
        player.upgrades.damage++;
        player.money -= player.upgrades.damage;
      } else if(type == "regen" && player.money > player.upgrades.regen+1) {
        player.upgrades.regen++;
        player.money -= player.upgrades.regen;
      }
    });
    socket.on("disconnect", function() {
      map.players.splice(map.players.indexOf(player));
      console.log("Player \"" + player.name + "\" (id " + player.id + ") has left. " + map.players.length + " players currently online.");
    });
  }); 
  socket.emit("mapDimensions", mapWidth, mapHeight);
  
});

