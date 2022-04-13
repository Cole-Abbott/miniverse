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

function preload() {
    connect()
    this.load.image("grass_1", "./sprites/grass_1.png")
    this.load.image("road_1", "./sprites/road_1.png")
    this.load.image("player", "./sprites/player.png")
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
    player.setDrag(0.6)
    player.setDamping(true)
    player.setCollideWorldBounds(true);

    cursorKeys = this.input.keyboard.addKeys({ 
        'up': Phaser.Input.Keyboard.KeyCodes.W, 
        'down': Phaser.Input.Keyboard.KeyCodes.S, 
        'left': Phaser.Input.Keyboard.KeyCodes.A, 
        'right': Phaser.Input.Keyboard.KeyCodes.D
    });
}

function update() {
    


    for (let key in cursorKeys) {
        if(Phaser.Input.Keyboard.JustDown(cursorKeys[key])){
            message = {
                key: key,
                status: true
            }
            channel.publish("input", message)
            console.log(message)
        }
        if(Phaser.Input.Keyboard.JustUp(cursorKeys[key])){
            message = {
                key: key,
                status: false
            }
            channel.publish("input", message)
            console.log(message)
        }
    }
    
}

function connect() {
    // connect to Ably
    const realtime = new Ably.Realtime({
        authUrl: "/auth",
    });

    // once connected to Ably, instantiate channels and launch the game
    realtime.connection.once("connected", () => {
        myClientId = realtime.auth.clientId;

        // Subscribe to messages on channel
        channel = realtime.channels.get('test');

        channel.subscribe('position', move)
    })
}

function move(message) {
    //moves player to where the server says it should be
    data = message.data
    player.x = data.x
    player.y = data.y
}