
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

let playerID
let playerRef

function preload() {
    connect()
    const allPlayerRef = firebase.database().ref("players");
    
    //array of phaser objects for each player, key is player ID
    allPlayers = {}

    //runs whenever players is updated
    allPlayerRef.on("value", (snapshot) =>{
        data = snapshot.val()
        //moves all players to new position
        for (let key in data) {
            if (key != playerID) {
                move(allPlayers[key], data[key].x, data[key].y)
            }
        }
    })

    //runs whenever a new player joins
    allPlayerRef.on("child_added", (snapshot) =>{
        const data = snapshot.val()

        if (data.playerID != playerID) {
            //add new phaser player to allPlayers
            allPlayers[data.playerID] = this.physics.add.sprite(data.x, data.y, 'player_blue');
        }
    })

    //runs whenever a player leaves, deletes player from game
    allPlayerRef.on("child_removed", (snapshot) =>{
        removedID = snapshot.val().playerID
        allPlayers[removedID].destroy()
    })
    
    //load sprites
    this.load.image("grass_1", "./sprites/grass_1.png")
    this.load.image("road_1", "./sprites/road_1.png")
    this.load.image("player", "./sprites/player.png")
    this.load.image("player_blue", "./sprites/player_blue.png")
}

function create() {
    //add background
    this.add.image(0, 0, 'grass_1');
    this.add.image(128, 0, 'grass_1');
    this.add.image(256, 0, 'grass_1');
    this.add.image(384, 0, 'road_1');
    this.add.image(384, 128, 'road_1');
    this.add.image(384, 256, 'road_1');
    this.add.image(384, 384, 'road_1');
    this.add.image(384, 512, 'road_1');


    //add/config player
    player = this.physics.add.sprite(100, 100, 'player');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    movementKeys = this.input.keyboard.addKeys({
        'up': Phaser.Input.Keyboard.KeyCodes.W,
        'down': Phaser.Input.Keyboard.KeyCodes.S,
        'left': Phaser.Input.Keyboard.KeyCodes.A,
        'right': Phaser.Input.Keyboard.KeyCodes.D
        
    });
    actionKeys = this.input.keyboard.addKeys({
        'space': Phaser.Input.Keyboard.KeyCodes.SPACE
    })
}

const speed = 200

const keyActions = {
    w: {
        down: (player) => player.setVelocityY(-speed),
        up: (player) => player.setVelocityY(0),
    },
    s: {
        down: (player) => player.setVelocityY(speed),
        up: (player) => player.setVelocityY(0),
    },
    a: {
        down: (player) => player.setVelocityX(-speed),
        up: (player) => player.setVelocityX(0),
    },
    d: {
        down: (player) => player.setVelocityX(speed),
        up: (player) => player.setVelocityX(0),
    },
    ' ': {
        down: () => console.log("down"),
        up: () => console.log("up"),
    }
}

function update(){
    
    //parses keys
    for (let key in movementKeys) {
        if(movementKeys[key].isDown){
            letter = movementKeys[key].originalEvent.key
            keyActions[letter].down(player)
        }
        if(Phaser.Input.Keyboard.JustUp(movementKeys[key])){
            letter = movementKeys[key].originalEvent.key
            keyActions[letter].up(player)
        }
    }
    for (let key in actionKeys) {
        if (Phaser.Input.Keyboard.JustDown(actionKeys[key])) {
            shoot(player, this);
        }
    }
}


function connect() {
    //connect to firebse
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            //logged in
            playerID = user.uid
            playerRef = firebase.database().ref(`players/${playerID}`)
            //create player in database
            playerRef.set({
                playerID,
                x: 100,
                y: 100,
                name: "cole"
            })
            //send position every 50ms
            setInterval(() => {
                playerRef = firebase.database().ref(`players/${playerID}`)
                playerRef.set({
                    playerID,
                    x: player.x,
                    y: player.y,
                    name: "cole"
                })
            }, 50)
            //Remove me from Firebase when I diconnect
            playerRef.onDisconnect().remove();

        } else {
            //not logged it
            console.log("Not logged in")
        }
        
    })


    firebase.auth().signInAnonymously().catch( (error) => {
        console.log(error.code, error.message)
    })
    return
}

//move sprite to x,y in 50ms
async function move(player, x, y) {
    distance = {
        x: (x - player.x) / 50,
        y: (y - player.y) / 50,
    }
    
    //move it 1/25th of the disance every 1ms
    for (let i = 0; i < 50; i++) {
        player.x += distance.x
        player.y += distance.y
        await delay(1)
    }
    //make sure it is in right position
    //player.x = x
    //player.y = y
}

function shoot(player, game) {
    const entities = game.physics.add.sprite(player.x, player.y, 'player')

}


function delay(ms) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}