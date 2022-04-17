// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC_DliS38QfCXwY8D5X0U2VCzS5vSArrRQ",
  authDomain: "miniverse-105ac.firebaseapp.com",
  databaseURL: "https://miniverse-105ac-default-rtdb.firebaseio.com",
  projectId: "miniverse-105ac",
  storageBucket: "miniverse-105ac.appspot.com",
  messagingSenderId: "255815270517",
  appId: "1:255815270517:web:7f804d513735df493f783c",
  measurementId: "G-4VPHWRTMYW"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);

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
    const {} = connect()
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

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            //logged in
            console.log(user)

            const playerID = user.uid
            const playerRef = firebase.database().ref(`players/${playerID}`)

            playerRef.set({
                playerID,
                x: 100,
                y: 100,
                name: "cole"
            })
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