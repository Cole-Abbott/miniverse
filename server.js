const Ably = require("ably");
const express = require("express");
const app = express()

const envConfig = require("dotenv").config();
//get api key and port from .env file
const {ABLY_API_KEY, PORT} = process.env;


const TICK_LENGTH = 200

// instantiate to Ably, echo false so sever will not recive its own messages
const realtime = new Ably.Realtime({
    key: ABLY_API_KEY,
    echoMessages: false,
});

// create a uniqueId to assign to clients on auth
const uniqueId = function () {
    return "id-" + Math.random().toString(36).substr(2, 16);
};

//set up express
app.use(express.static("site"));

// /auth site for temporart api key + info
app.get("/auth", (request, response) => {
  const tokenParams = { clientId: uniqueId() };
  realtime.auth.createTokenRequest(tokenParams, function (err, tokenRequest) {
    if (err) {
      response
        .status(500)
        .send("Error requesting token: " + JSON.stringify(err));
    } else {
      response.setHeader("Content-Type", "application/json");
      response.send(JSON.stringify(tokenRequest));
    }
  });
});
///workspaces/71832242/miniverse/site/sprites/index.html
// main site
app.get("/", (request, response) => {
    response.header("Access-Control-Allow-Origin", "*");
    response.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    response.sendFile(__dirname + "/index.html");
    response.sendFile(__dirname + "/script.js");
    response.sendFile(__dirname + "/sprites");
});

//listen on port 8080 and serve site there
const listener = app.listen(PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// wait until connection with Ably is established
realtime.connection.once("connected", () => {
  channel = realtime.channels.get('test');

  channel.subscribe('position', function(message) {
    console.log(message.data);
  });

  //start game loop to send out data
  setInterval(tick, TICK_LENGTH)


  //subscribe to input channel
  channel.subscribe("input", input)

  players = []
  channel.subscribe("join", (message) => {
    players.push(new player(message.data))

  })

});

class player {
  constructor(id) {
    this.playerID = id;
    this.x = 100
    this.y = 100
    this.velocityX = 0
    this.velocityY = 0
}

}

function tick() {
  channel.publish("position", players)
  update()
}

function input(message) {
  const data = message.data
  for (let player in players) {
    if (players[player].playerID === data.playerID) {
      console.log(players[player])
      if (data.key === 'right') {
        if (data.status) {
          players[player].velocityX = 10
        } else {
          players[player].velocityX = 0
        }
      }
      else if (data.key === 'left') {
        if (data.status) {
          players[player].velocityX = -10
        } else {
          players[player].velocityX = 0
        }
      }
      else if (data.key === 'down') {
        if (data.status) {
          players[player].velocityY = 10
        } else {
          players[player].velocityY = 0
        }
      }
      else if (data.key === 'up') {
        if (data.status) {
          players[player].velocityY = -10
        } else {
          players[player].velocityY = 0
        }
      }
    }
  }


}

function update() {
  for (let player in players) {
    players[player].x += players[player].velocityX
    players[player].y += players[player].velocityY
    if (players[player].x < 0) { players[player].x = 0}
    if (players[player].x > 800) { players[player].x = 800}
    if (players[player].y < 0) { players[player].y = 0}
    if (players[player].y > 600) { players[player].y = 600}
  }
}
