var config = {
    type: Phaser.AUTO,
    pixelArt: true,
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

    //object of phaser objects for each player, key is player ID
    allPlayers = {}
    
    //runs whenever players is updated
    allPlayerRef.on("value", (snapshot) =>{
        data = snapshot.val()
        //moves all players to new position
        for (let key in data) {
            if (key != playerID) {
                //set velocity to move to setpoint and stop after 25ms
                this.physics.moveTo(allPlayers[key], data[key].x, data[key].y, 25, 25)
                setTimeout(() => {
                    allPlayers[key].setVelocity(0)
                }, 25)
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
    
    //object of non player entities in game, one for child entities, one for others
    entities = {}
    childEntities = {}

    //db ref for entities
    const entitiesRef = firebase.database().ref("entities");

    //runs whenever entity is updated
    entitiesRef.on("value", (snapshot) =>{
        data = snapshot.val()
        //moves all entitiesRef to new position
        for (let key in data) {
            if (data[key].parent != playerID) {
                //set velocity to move to setpoint and stop after 25ms
                this.physics.moveTo(entities[key], data[key].x, data[key].y, 25, 25)
                setTimeout(() => {
                    entities[key].setVelocity(0)
                }, 25)
            }
        }
    })

    //runs whenever a new entity is added
    entitiesRef.on("child_added", (snapshot) =>{
        const data = snapshot.val()
        //check if you are parent
        if (data.parent != playerID) {
            //add new phaser sprite to entities
            entities[data.entityID] = this.physics.add.sprite(data.x, data.y, 'bullet');
        }
    })

    //runs whenever a entity is destroyed, deletes entity from game
    entitiesRef.on("child_removed", (snapshot) =>{
        data = snapshot.val()
        if (data.parent != playerID) {
            entities[data.entityID].destroy()
        }
    })


    //load sprites
    this.load.image("fountain", "./sprites/fountain.png")
    this.load.image("pathDown_1", "./sprites/pathDown_1.png")
    this.load.image("player", "./sprites/player.png")
    this.load.image("player_blue", "./sprites/player_blue.png")
    this.load.image("bullet","./sprites/bullet.png" )
}

function create() {
    //add background
    
    this.add.image(1000, 1000, 'fountain').setScale(4)
    this.add.image(1000, 1512, 'pathDown_1').setScale(4)

    this.physics.world.setBounds(0, 0, 2000, 2000);

    //add/config player
    player = this.physics.add.sprite(1000, 1000, 'player');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.cameras.main.setBounds(0, 0, 2000, 2000);
    this.cameras.main.startFollow(player)


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
                //send player data
                playerRef = firebase.database().ref(`players/${playerID}`)
                entitiesRef = firebase.database().ref(`entities/${playerID}`);

                playerRef.set({
                    playerID,
                    x: player.x,
                    y: player.y,
                    name: "cole"
                })

                
                //send entity data for child entities
                for (let entityID in childEntities) {
                    dbRef =  firebase.database().ref(`entities/${entityID}`);
                    dbRef.set({
                        entityID,
                        parent: playerID,
                        x: childEntities[entityID].x,
                        y: childEntities[entityID].y
                    })
                }
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

function shoot(player, game) {
    //make entity ID
    const entityID = Math.random().toString(36).substring(2, 16)

    //connect to firebase
    const dbRef = firebase.database().ref(`entities/${entityID}`);

    //create sprite
    entity = game.physics.add.sprite(player.x, player.y, 'bullet'),
    entity.setCollideWorldBounds(true)
    entity.setBounce(1)

    childEntities[entityID] = entity
    //add entity to childEntities

    //add entity to firebase 
    dbRef.set({
        x: entity.x,
        y: entity.y,
        parent: playerID,
        entityID
    })
    entity.setVelocity(player.body.velocity.x * 1.5, player.body.velocity.y * 1.5)
    
    //delete bullet after 2 seconds
    setTimeout(() => {
        dbRef.remove();
        childEntities[entityID].destroy()
        delete childEntities[entityID]
    }, 2000);
}