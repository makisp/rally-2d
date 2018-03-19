var socket;
var body, pCar, started = false, state, lapDone = false, lap = 0, onPlayers = 0, isWinner = false;
var accelData = {}, accel, distDone = 0;
var rotData = {};
var photo, rivalPhoto, track, font;

function preload() {
    socket = io.connect('192.168.100.128:3000');
    socket.on('worldUpdate', updateWorld);
    socket.on('countToRace', timeToStartRace);
    socket.on('ready', iReady);
    socket.on('winner', showWinner);
    socket.on('lap', showLaps);
    socket.on('joinResponse', showPlayers);
    socket.on('hostResponse', hostResponse);
    socket.on('stateResponse', stateResponse);
    font = loadFont('resources/roboto.ttf');
    photo = loadImage('./resources/car-blue.png');
    rivalPhoto = loadImage('./resources/car-yellow.png');
    track = loadImage('./resources/track1.png');
}

function setup() {
    var c = createCanvas(800, 800);
    c.parent('canvas');
    textFont(font);
    rectMode(CENTER);
    imageMode(CENTER);
}

function draw() {
    if(started) {
        try {
            // If car crosses the finish line...
            if(pCar.position.x > 420 && pCar.position.x < 437 && pCar.position.y < 120) {
                if(!lapDone && pCar.motion > 1) {
                    lap++;
                    socket.emit('lap', lap);
                    lapDone = true
                }
                var interval = setInterval(function() {
                    lapDone = false;
                    clearInterval(interval);
                }, 3000);
            }
            if(pCar.position.y < 30) {
                accel = 0.0007275;
            } else {
                accel = 0.0014275;
            }
        } catch(err) {
        }
        // Arrows that control car movement
        if (keyIsDown(UP_ARROW)) {
            var force = p5.Vector.fromAngle(pCar.angle + PI/2);
            force.mult('-' + accel);
            socket.emit('accelerating', accelData = {
                a: 1,
                force: force
            });
        } else if (keyIsDown(DOWN_ARROW)) {
            var force = p5.Vector.fromAngle(pCar.angle + PI/2);
            force.mult(0.0003);
            socket.emit('accelerating', accelData = {
                a: -1,
                force: force
            });
        }
        if(keyIsDown(LEFT_ARROW)) {
            if(pCar.motion > 0.5) {
                if(socket.id == pCar.socketID) {
                    socket.emit('rotation', rotData = {
                        r: -1,
                        a: pCar.angle -PI/45
                    });
                }
            }
        } else if(keyIsDown(RIGHT_ARROW)) {
            if(pCar.motion > 0.5) {
                if(socket.id == pCar.socketID) {
                    socket.emit('rotation', rotData = {
                        r: 1,
                        a: pCar.angle + PI/45
                    });
                }
            }
        }
    }
}

// Updating world (objects position etc.)
function updateWorld(bodies) {
    try {
        image(track, 400, 400);
        for (var i = 0; i < bodies.length; i++) {
            body = bodies[i];
            var vertices;
            // Check if body is a car object
            if (body.label === 'car') {
                // Draw the cars
                if(socket.id == body.socketID) {
                    // Assigning car to the owner client
                    pCar = body;
                    push();
                    translate(pCar.position.x, pCar.position.y);
                    fill(0);
                    text(pCar.name, -20, -20);
                    rotate(pCar.angle - PI/2);
                    image(photo, 0, 0, 40, 20);
                    pop();
                } else {
                    push();
                    translate(body.position.x, body.position.y);
                    fill(0);
                    text(body.name, -20, -20);
                    rotate(body.angle - PI/2);
                    image(rivalPhoto, 0, 0, 40, 20);
                    pop();
                }
                vertices = body.vertices;
                noFill();
                noStroke();
            } else {
                vertices = body.vertices;
                strokeWeight(body.render.lineWidth);
                fill(body.render.fillStyle);
                stroke(body.render.strokeStyle);
            }
            push();
            beginShape();
            // Drawing the shapes of all objects (walls, cars etc.)
            for (var j = 0; j < vertices.length; j++) {
                if(body.label == 'wall') {
                    var v = vertices[j];
                    vertex(v.x, v.y);    
                }
            }
            endShape();
            pop();
        }
    } catch(err) {  
    }
}

// If ready, start
function iReady(ready) {
    if(ready) {
        started = true;
    }
}

// Sets the html timer for the start of the race
function timeToStartRace(timeleft) {
    if(lPanel.style.display == "none") {
        if(timeleft != 0) {
            countdownStart.innerHTML = timeleft;    
        } else {
            countdownStart.innerHTML = "";
        }
    }
}

// Shows the current lap
function showLaps(lapsData) {
    if(lPanel.style.display == "none") {
        if(lapsData.lapsDone >= lapsData.totalLaps) {
            htmlLap.innerHTML = "Last lap!";
        } else {
            htmlLap.innerHTML = "Lap: " + lapsData.lapsDone + "/" + lapsData.totalLaps +"";
        }
    }
}

// Shows winner
function showWinner(player) {
    started = false;
    if(lPanel.style.display == "none") {
        winner.innerHTML = "Player " + player + " won!";
        winFrame.style.display = "block";
    }
}

function hostResponse(resp) {
    if(resp) {
        inputName.style.borderStyle = "none";
        lPanel.style.display = "none";
        hPanel.style.display = "block"; 
    } else {
        errorText.innerHTML = "There is already a server running, try to join!";
    }
}

function showPlayers(players) {
    if(players) {
        if(!players.disc) {
            if(onPlayers) {
                for(let i = 0; i < onPlayers; i++) {
                    document.getElementById("player"+i+"").remove();
                }
            }
            onPlayers = 0;
            for(let i = 0; i < players.length; i++) {
                var p = "<p id=\"player"+i+"\" class=\"player-list\">"+players[i]+"</p>";
                document.getElementById("end").insertAdjacentHTML('beforebegin', p);
                if(i%2 == 0) {
                    document.getElementById("player"+i+"").style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }
                onPlayers++;
            }
            if(players[0] !== pName) {
                bStart.style.display = "none";
            }
            inputName.style.borderStyle = "none";
            lPanel.style.display = "none";
            sPanel.style.display = 'block';
        } else {
            if(onPlayers) {
                for(let i = 0; i < onPlayers; i++) {
                    document.getElementById("player"+i+"").remove();
                }
            }
            onPlayers = 0;
            for(let i = 0; i < players.pInServer.length; i++) {
                var p = "<p id=\"player"+i+"\" class=\"player-list\">"+players.pInServer[i]+"</p>";
                document.getElementById("end").insertAdjacentHTML('beforebegin', p);
                if(i%2 == 0) {
                    document.getElementById("player"+i+"").style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                }
                onPlayers++;
            }
        }
    } else {
        errorText.innerHTML = "There is no server available, try creating one!";
    }
}

function stateResponse(resp) {
    sPanel.style.display = "none";
}