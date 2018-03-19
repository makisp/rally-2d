var express = require('express'),
    http = require('http');
var app = express();
var server = http.createServer(app); 
var socket = require('socket.io').listen(server);
var nodeTrack = require('tracks');

server.listen(3000, '0.0.0.0', function(){
  console.log('listening on *:3000');
});

// Vars for timer
var lapsDone = 0, counter = 0;

// Many needed variables
var car = [], carDists = [];
var connIDs = 0;
var pInServer = [], isServer = false; 
var laps, track = 'track1';
var fps = 60;
var carWidth = 20;
var carLength = 40;
var carPhysics = {
    friction: 0,
    frictionAir: 0.1,
    restitution: 0.7,
    angle: 1.5708
}

/// Matter World --Start
var Matter = require('matter-js');

// Alliases for matter.js
var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    Events = Matter.Events,
    Vertices = Matter.Vertices,
    Body = Matter.Body;

// Creating engine for world management
var engine = Engine.create();

// Setting gravity to 0
engine.world.gravity = {
    x: 0,
    y: 0
};

// Adding outer walls to the world
World.add(engine.world, [
    Bodies.rectangle(400, 820, 800, 50, { isStatic: true }),
    Bodies.rectangle(-20, 400, 50, 800, { isStatic: true }),
    Bodies.rectangle(820, 400, 50, 800, { isStatic: true }),
    Bodies.rectangle(400, -20, 800, 50, { isStatic: true })
]);

// Name the walls 'wall' and color them
for (var i = 0; i < engine.world.bodies.length; i++) {
    engine.world.bodies[i].label = 'wall';
    engine.world.bodies[i].render.fillStyle = '#cccccc';
}

// Adding inner walls to the world
World.add(engine.world, eval(nodeTrack.track(track)));
// Send the world to the players every frame
setInterval(function() {
    // Tell the physics engine to move forward one tick
    Engine.update(engine, 1000 / fps);

    // Change bodies array and send only what you need (else stack overflows)
    var simplifiedBodies = simplifyBodies(engine.world.bodies);
    socket.volatile.emit('worldUpdate', simplifiedBodies);
}, 1000 / fps);

// Simplifies body data and prepares it for sending
function simplifyBodies(bodies) {
    var newBodies = []
    for (var i = 0; i < bodies.length; i++) {
        var oldBody = bodies[i];
        var vertices = [];
        for(var j = 0; j < oldBody.vertices.length; j++) {
            vertices.push({
                x: oldBody.vertices[j].x,
                y: oldBody.vertices[j].y
            })    
        }
        newBodies.push({
            'motion': oldBody.speed,
            'angle': oldBody.angle,
            'position': oldBody.position,
            'label': oldBody.label,
            'render': oldBody.render,
            'vertices': vertices,
            'name': oldBody.name,
            'socketID': oldBody.socketID,
        });
    }
    return newBodies;
}
/// Matter World --End

// Timer to start race
function timerToStartRace(t) {
    var interval = setInterval(function() {
        counter++;
        socket.emit('countToRace', t - counter);
        if(counter >= t) {
            console.log('Race Started!');
            clearInterval(interval);
            socket.emit('ready', true);
            counter = 0;
        }
    }, 1000);
}

// Tell experss the location of the files (html / css / js)
app.use(express.static(__dirname + '/public'));
var io = socket.sockets.on('connection', newConnection);

function newConnection(socket) {
    console.log("New client connected with ID: " + socket.id);
    connIDs++;
    // Check if ready and name client car
    socket.on('state', function(state) {
        socket.emit('stateResponse', true);
        socket.broadcast.emit('stateResponse', true);
        timerToStartRace(4);
    });
    
    socket.on('hostOptions', function(hostOpt) {
        // Creating new car body when new client connects
        car.push(Bodies.rectangle(400, 72, carWidth, carLength, carPhysics));
        car[car.length-1].label = 'car';
        car[car.length-1].name = hostOpt.playerName;
        car[car.length-1].socketID = socket.id;
        World.add(engine.world, car[car.length-1]);
        laps = hostOpt.laps;
        track = hostOpt.selectedTrack;
        pInServer.push(hostOpt.playerName);
        isServer = true;
        socket.emit('joinResponse', pInServer);
        console.log('User ' + hostOpt.playerName + ' started a server...');
    });
    
    socket.on('requestHost', function() {
        if(!isServer) {
            socket.emit('hostResponse', true);
        } else {
            socket.emit('hostResponse', false);
        }
    })
    
    socket.on('requestJoin', function(player) {
        if(isServer) {
            car.push(Bodies.rectangle(400, 72, carWidth, carLength, carPhysics));
            car[car.length-1].label = 'car';
            car[car.length-1].name = player;
            car[car.length-1].socketID = socket.id;
            World.add(engine.world, car[car.length-1]);
            
            pInServer.push(player);
            socket.emit('joinResponse', pInServer);
            socket.broadcast.emit('joinResponse', pInServer);
        } else {
            socket.emit('joinResponse', false);
        }
    });
    
    //Listener for client acceleration
    socket.on('accelerating', function(accel) {
        accelerate(accel.force);
        function accelerate(f) {
            for(i = 0; i < car.length; i++) {
                if(socket.id == car[i].socketID) {
                    Body.applyForce(car[i], car[i].position, f);
                }
            }
        }
    });
    
    // Listener for client rotation
    socket.on('rotation', function(rot) {
        rotate(rot.a);
        function rotate(a) {
            for(i = 0; i < car.length; i++) {
                if(socket.id == car[i].socketID) {
                    Body.setAngle(car[i], a);    
                }
            }
        }
    });
    
    // Listener for lap count
    socket.on('lap', function(lap) {
        if(lap > lapsDone) {
            lapsDone = lap;
            var lapsData = {
                lapsDone: lapsDone,
                totalLaps: laps
            }
            socket.emit('lap', lapsData);
            socket.broadcast.emit('lap', lapsData);
            console.log("We're at lap: " + lapsDone);
        }
        console.log("Laps: " + laps);
        if(lapsDone > laps && lap == lapsDone) {
            for(i = 0; i < car.length; i++) {
                if(socket.id == car[i].socketID) {
                    socket.emit('winner', car[i].name);
                    socket.broadcast.emit('winner', car[i].name);
                    console.log("Player " + car[i].name + " won!");
                    lapsDone = 0;
                    isServer = false;
                    pInServer = [];
                }
            }
        }
    });
    
    // Sort the array from biggest -> smallest (deprecated)
    function sortArray(a) {
        var done;
        do {
            done = false;
            for(var i = 0;i < a.length-1;i++) {
                if(a[i] < a[i+1]) {
                    var tempDist = a[i];
                    a[i] = a[i+1];
                    a[i+1] = tempDist;
                    done = true;
                }
            }
        } while(done);
    }
    
    // Delete car object from world / array when clint disconnects
    socket.on('disconnect', function () {
        for(i = 0; i < car.length; i++) {
            if(socket.id == car[i].socketID) {
                for(j = 0; j < pInServer.length; j++) {
                    if(car[i].name == pInServer[j]) {
                        pInServer.splice(j, 1);
                        var discData = {
                            pInServer: pInServer,
                            disc: true
                        }
                        socket.broadcast.emit('joinResponse', discData);
                    }
                }
                World.remove(engine.world, car[i]);
                car.splice(i, 1);
                if(connIDs > 0) {
                    connIDs--;
                }
                if(connIDs == 0) {
                    lapsDone = 0;
                    pInServer = [];
                }
                if(pInServer.length == 0){
                    isServer = false;
                }
                console.log("Client disconnected, removing his car...");
            }
        }
    });
}


