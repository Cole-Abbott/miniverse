var config = {
    type: Phaser.AUTO,
    pixelArt: true,
    width: window.innerWidth,
    height: window.innerHeight,
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
                //this.physics.moveTo(allPlayers[key], data[key].x, data[key].y, 25, 25)
                //setTimeout(() => { allPlayers[key].setVelocity(0) }, 25)
                allPlayers[key].x = data[key].x
                allPlayers[key].y = data[key].y
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
                //this.physics.moveTo(entities[key], data[key].x, data[key].y, 25, 25)
                //setTimeout(() => { entities[key].setVelocity(0)}, 25)
                entities[key].x = data[key].x
                entities[key].y = data[key].y
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
            if ('angle' in data) {entities[data.entityID].setAngle(data.angle)}
        }
    })

    //runs whenever a entity is destroyed, deletes entity from game
    entitiesRef.on("child_removed", (snapshot) =>{
        data = snapshot.val()
        if (data.parent != playerID) {
            entities[data.entityID].destroy()
        }
    })


    world = {}
    //db ref for world
    const worldRef = firebase.database().ref("world");

    //runs whenever entity is updated
    worldRef.on("value", (snapshot) =>{
        data = snapshot.val()
        //moves all entities to new position
        world.shooting.gun.setAngle(data.shooting.angle)
        world.shooting.gun.occupied = data.shooting.occupied
    })

    //load sprites
    this.load.image("fountain", "./sprites/fountain.png")
    this.load.image("pathDown_1", "./sprites/pathDown_1.png")
    this.load.image("pathLeft_1", "./sprites/pathLeft_1.png")
    
    this.load.image("shootingDev", "./sprites/shootingDev.png")
    this.load.image("shootingStandDev", "./sprites/shooting/stand.png")
    this.load.image("shootingGun", "./sprites/shooting/gun.png")
    this.load.image("target", "./sprites/shooting/target.png")
    this.load.image("bullet","./sprites/shooting/bullet.png" )
    

    this.load.image("player", "./sprites/player.png")
    this.load.image("player_blue", "./sprites/player_blue.png")
}

function create() {
    const center = 1000
    this.physics.world.setBounds(0, 0, 2*center, 2*center);
    

    //add/config player
    player = this.physics.add.sprite(600, 1100, 'player').setDepth(1);
    player.setCollideWorldBounds(true);
    player.gameMode = 'none'
    player.gameArea = 'none'
    //show debug position
    this.text = this.add.text(10, 10).setScrollFactor(0).setFontSize(20).setColor('#ffffff').setDepth(1);

    //adds hotbar
    this.hotbar = this.add.text(400, 550).setScrollFactor(0).setFontSize(20).setColor('#ffffff').setDepth(1);

    //add background
    this.add.image(center, center, 'fountain').setScale(4)
    this.add.image(center, center + 512, 'pathDown_1').setScale(4)
    this.add.image(center - 512, center, 'pathLeft_1').setScale(4)

    //shooting game
    
    world.shooting = {
        background: this.add.image(center - 512, center - 512, 'shootingDev').setScale(4),
        stand: this.physics.add.image(490, 638, 'shootingStandDev').setScale(4),
        gun: this.physics.add.image(490, 608, 'shootingGun').setScale(0.5).setAngle(-90),
        targets: [
            this.physics.add.image(440, 388, 'target').setScale(1), 
            this.physics.add.image(490, 388, 'target').setScale(1), 
            this.physics.add.image(540, 388, 'target').setScale(1)
        ] 
    }
    

    this.physics.add.overlap(player, world.shooting.stand, () => {
        player.gameArea = 'shooting'
    })


    this.cameras.main.setBounds(0, 0, 2000, 2000);
    this.cameras.main.startFollow(player)


    movementKeys = this.input.keyboard.addKeys({
        'up': Phaser.Input.Keyboard.KeyCodes.W,
        'down': Phaser.Input.Keyboard.KeyCodes.S,
        'left': Phaser.Input.Keyboard.KeyCodes.A,
        'right': Phaser.Input.Keyboard.KeyCodes.D
        
    });
    actionKeys = this.input.keyboard.addKeys({
        'space': Phaser.Input.Keyboard.KeyCodes.SPACE,
        'e': Phaser.Input.Keyboard.KeyCodes.E
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
    //show debug position
    this.text.setText([player.x, player.y])

    if (player.gameMode === 'none') {
        //parses movement keys
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
    }


    if (player.gameArea === 'none') this.hotbar.setText("");


    if (player.gameArea === 'shooting') {
        const shootingRef = firebase.database().ref("world/shooting");
        if (player.gameMode === 'shooting'){
            this.hotbar.setText("press e to exit")

            //listen for shooting inputs, a,d to aim, space to shoot, e to exit
            if (Phaser.Input.Keyboard.JustDown(actionKeys.e)){ 
                player.gameMode = 'none'
                //tell db you left game
                shootingRef.update({
                    occupied: false
                })
            }
            if (movementKeys.left.isDown && world.shooting.gun.angle > -135) {
                world.shooting.gun.setAngle(world.shooting.gun.angle - 2)
                shootingRef.update({
                    angle: world.shooting.gun.angle
                })
            }
            if (movementKeys.right.isDown && world.shooting.gun.angle < -45) {
                world.shooting.gun.setAngle(world.shooting.gun.angle + 2)
                shootingRef.update({
                    angle: world.shooting.gun.angle
                })
            }

            if (Phaser.Input.Keyboard.JustDown(actionKeys.space)){ shoot(player, this, (world.shooting.gun.angle + 90) * -1) }
            

    

        } else {
            
            //prompt to start game
            this.hotbar.setText("press e to start")

            if (Phaser.Input.Keyboard.JustDown(actionKeys.e) && !world.shooting.gun.occupied) {
                player.gameMode = 'shooting';
                player.x = 490
                player.y = 621
                player.setVelocity(0)
                //tell db you entered game
                shootingRef.update({
                    occupied: playerID
                })
            }
        }
    }
    
    
    player.gameArea = 'none'
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
                    dbRef.update({
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

function shoot(player, game, angle) {
    //make entity ID
    const entityID = Math.random().toString(36).substring(2, 16)

    //connect to firebase
    const dbRef = firebase.database().ref(`entities/${entityID}`);

    //create sprite
    entity = game.physics.add.sprite(player.x, player.y, 'bullet'),
    entity.setCollideWorldBounds(true)
    entity.setBounce(1)
    entity.setAngle(-angle)

    childEntities[entityID] = entity
    //add entity to childEntities

    //add entity to firebase 
    dbRef.set({
        x: entity.x,
        y: entity.y,
        angle: -angle,
        parent: playerID,
        entityID
    })

    entity.setVelocity(-Math.sin(angle * (Math.PI / 180)) * 200, -Math.cos(angle * (Math.PI / 180)) * 200)

    const deleteEntity = (entityID) => {
        if (childEntities[entityID]){
            dbRef.remove();
            childEntities[entityID].destroy()
            delete childEntities[entityID]
            entity = null
        }
    }

    //add colider to targets
    game.physics.add.overlap(entity, world.shooting.targets, () => {
        deleteEntity(entityID)
        
    })


    //delete bullet after 2 seconds
    setTimeout(() => {
        deleteEntity(entityID)
    }, 2000);

}