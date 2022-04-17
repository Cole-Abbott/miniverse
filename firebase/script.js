
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
    const {playerID, playerRef} = connect()
    console.log(playerID)
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
    otherPlayers = this.physics.add.sprite(100, 100, 'player');
    player.setBounce(0.2);
    player.setDrag(0.6)
    player.setDamping(true)
    player.setCollideWorldBounds(true);
    player.showDebugVelocity = true;

    cursorKeys = this.input.keyboard.addKeys({
        'up': Phaser.Input.Keyboard.KeyCodes.W,
        'down': Phaser.Input.Keyboard.KeyCodes.S,
        'left': Phaser.Input.Keyboard.KeyCodes.A,
        'right': Phaser.Input.Keyboard.KeyCodes.D
    });
}

function update(){

}


function connect() {
    //connect to firebse
    let playerID, playerRef
    
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            //logged in
            console.log(user)

            playerID = user.uid
            playerRef = firebase.database().ref(`players/${playerID}`)

            playerRef.set({
                playerID,
                x: 100,
                y: 100,
                name: "cole"
            })
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

    return {playerID, playerRef}
}