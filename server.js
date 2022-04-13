const Ably = require("ably");
const express = require("express");
const app = express()

const envConfig = require("dotenv").config();
//get api key and port from .env file
const {ABLY_API_KEY, PORT} = process.env;


const TICK_LENGTH = 100

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

});

player = {
  x: 100,
  y: 100,
  velocityX: 0,
  velocityY: 0
}

function tick() {
  channel.publish("position", player)
  update()
}

function input(message) {
  const data = message.data

  if (data.key === 'right'){
    if (data.status) {
      player.velocityX = 10
    } else {
      player.velocityX = 0
    }
  }
  else if (data.key === 'left'){
    if (data.status) {
      player.velocityX = -10
    } else {
      player.velocityX = 0
    }
  }
  else if (data.key === 'down'){
    if (data.status) {
      player.velocityY = 10
    } else {
      player.velocityY = 0
    }
  }
  else if (data.key === 'up'){
    if (data.status) {
      player.velocityY = -10
    } else {
      player.velocityY = 0
    }
  }

}

function update() {
  player.x += player.velocityX
  player.y += player.velocityY
}