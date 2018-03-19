var countdownStart, lapCounter, winner, winFrame, htmlLap;
var lPanel,hPanel, inputName, inputLaps, sPanel;
var bJoin, bCont, bBack, bHost, bCreate, bStart;
var image1, image2, image3, image4;
var player1, player2, player3, player4;
var serverList;
var selectedTrack, pName, errorText;
// Control login buttons
window.onload = function(){
    lPanel = document.getElementById("login");
    hPanel = document.getElementById("host");
    sPanel = document.getElementById("server");
    bJoin = document.getElementById("button-join");
    bCont = document.getElementById("button-continue");
    bHost = document.getElementById("button-host");
    bBack = document.getElementById("button-back");
    bCreate = document.getElementById("button-create");
    bStart = document.getElementById("button-start");
    image1 = document.getElementById("image-1");
    image2 = document.getElementById("image-2");
    image3 = document.getElementById("image-3");
    image4 = document.getElementById("image-4");
    player1 = document.getElementById("player-1");
    player2 = document.getElementById("player-2");
    player3 = document.getElementById("player-3");
    player4 = document.getElementById("player-4");
    serverList = document.getElementsByClassName("server-list");
    inputName = document.getElementById("input-name");
    inputLaps = document.getElementById("input-laps");
    inputServName = document.getElementById("input-server-name");
    countdownStart = document.getElementById("countdown-start");
    lapCounter = document.getElementById("lap");
    winner = document.getElementById("winner");
    winFrame = document.getElementById("win-frame");
    htmlLap = document.getElementById("lap");
    errorText = document.getElementById("error-text");
    bJoin.addEventListener('click', function() {
       if(inputName.value == '') {
            inputName.style.borderStyle = "solid";
            inputName.style.borderColor = "red";
            errorText.innerHTML = "Insert a name to continue...";
        } else {
            pName = inputName.value;
            errorText.innerHTML = "";
            socket.emit('requestJoin', pName);
        }
    });
    bHost.addEventListener('click', function() {
        if(inputName.value == '') {
            inputLaps.style.borderStyle = "solid";
            inputName.style.borderColor = "red";
        } else {
            socket.emit('requestHost', true);
            pName = inputName.value;
        }
    });
    bBack.addEventListener('click', function() {
        hPanel.style.display = "none";
        lPanel.style.display = "block";
        inputLaps.style.borderStyle = "none";
    });
    image1.addEventListener('click', function() {
        image1.style.borderColor = "greenyellow";
        image2.style.borderColor = "black";
        image3.style.borderColor = "black";
        image4.style.borderColor = "black";
        selectedTrack = 'track1';
    });
    image2.addEventListener('click', function() {
        image2.style.borderColor = "greenyellow";
        image1.style.borderColor = "black";
        image3.style.borderColor = "black";
        image4.style.borderColor = "black";
        selectedTrack = 'track2';
    });
    image3.addEventListener('click', function() {
        image3.style.borderColor = "greenyellow";
        image1.style.borderColor = "black";
        image2.style.borderColor = "black";
        image4.style.borderColor = "black";
        selectedTrack = 'track3';
    });
    image4.addEventListener('click', function() {
        image4.style.borderColor = "greenyellow";
        image1.style.borderColor = "black";
        image2.style.borderColor = "black";
        image3.style.borderColor = "black";
        selectedTrack = 'track3';
    });
    bCreate.addEventListener('click', function() {
        if(image1.style.borderColor !== "greenyellow" && image2.style.borderColor !== "greenyellow" && image3.style.borderColor !== "greenyellow" && image4.style.borderColor !== "greenyellow") {
            image1.style.borderColor = "red";
            image2.style.borderColor = "red";
            image3.style.borderColor = "red";
            image4.style.borderColor = "red";
        } else if(inputLaps.value == '' || inputLaps.value == '0') {
            inputLaps.style.borderColor = "red";
        } else {
            inputLaps.style.borderStyle = "none";
            socket.emit('hostOptions', hostOpt = {
                selectedTrack: selectedTrack,
                laps: inputLaps.value,
                playerName: pName
            });
            hPanel.style.display = 'none';
            sPanel.style.display = 'block';
            }
    });
    bStart.addEventListener('click', function() {
        socket.emit('state', true);
        sPanel.style.display = "none";
    });
    bCont.addEventListener('click', function() {
        location.reload(); 
    });
}

// Function for deleting DOM elements
Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}