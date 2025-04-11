let windowheightRatio = (2000 / window.innerWidth) * window.innerHeight;

//Constants
const movementSpeed = 3.3;
const HorizontalDrag = 1;
const jumpHeight = 17;
const maxBounceHeight = 26;
const gravity = 1;
const wallJumpSpeed = 30;
const maxFallingSpeed = 35;
const minDistanceFromEdge = 140;
const minDistanceFromFloor = 160;
const minAfterImageSpeed = 30;
const characterHues = [0, 55, 230, 120];
const statMultipliersList = [
	[1.24, 1.3, 0.95],
	[1.4, 1.2, 0.8],
	[1.16, 1.4, 0.95],
	[1.08, 1.3, 1.25],
	[1.5, 1.75, 5.0], // Secret Character (Type 4) - Powerful stats
]; //Stats are (1 + top speed stat * 0.08), (1 + jump height stat * 0.1), (0.65 + damage stat * 0.15)

//hidden stats for each character
const hiddenStatsList = [
	// DragonType 0 
	{ bounceMultiplier: 1.35, dashDistance: 35, dashCooldown: 50 },
	// DragonType 1 
	{ bounceMultiplier: 1.2, dashDistance: 40, dashCooldown: 40 },
	// DragonType 2 
	{ bounceMultiplier: 1.4, dashDistance: 35, dashCooldown: 55 },
	// DragonType 3
	{ bounceMultiplier: 1.3, dashDistance: 32, dashCooldown: 60 },
	// Secret Character (Type 4)
	{ bounceMultiplier: 1.5, dashDistance: 60, dashCooldown: 10 },
];

//Variables
let currentScreen = 1; //1 = Main title screen, 2 = Character select screen (Vs. Mode), 3 = Vs. mode gameplay, 4 = Campaign level select screen, 5 = Campaign mode gameplay
let timeSinceStart = 0;
let versusRound = 1;
let inRound = false;
let roundFinished = false;
let levelScrollSpeed = 0;
let backgroundPosition = 0;

// Define control schemes
const CONTROLS = {
	player1: {
		left: 65,      // A
		right: 68,     // D
		jump: 87,      // W
		dash: 16,      // Shift
		fastFall: 83   // S
	},
	player2: {
		left: 76,      // L
		right: 222,    // '
		jump: 80,      // P
		dash: 13,      // Enter
		fastFall: 186  // ;
	}
};

campaignStats = {
	level: 1,
};

player1 = {
	dragonType: 0,
	health: 100,
	statMultipliers: [1, 1, 1], //Top speed, jump height, damage
	hiddenStats: {}, // bounceMultiplier, dashDistance, dashCooldown
	hitCooldown: 0,
	currentDashCooldown: 0,
	bounceTimer: 0,
	xPos: (2000 - minDistanceFromEdge) * (1 / 3),
	yPos: windowheightRatio - minDistanceFromFloor,
	xVelocity: 0,
	yVelocity: 0,
	yVelocityOnLastLand: 0,
	keysPressed: {},
	jumped: false,
	previousKeys: {}
};

player2 = {
	dragonType: 0,
	health: 100,
	statMultipliers: [1, 1, 1], //Top speed, jump height, damage
	hiddenStats: {}, // bounceMultiplier, dashDistance, dashCooldown
	hitCooldown: 0,
	currentDashCooldown: 0,
	bounceTimer: 0,
	xPos: (2000 - minDistanceFromEdge) * (2 / 3),
	yPos: windowheightRatio - minDistanceFromFloor,
	xVelocity: 0,
	yVelocity: 0,
	yVelocityOnLastLand: 0,
	keysPressed: {},
	jumped: false,
	previousKeys: {}
};

//Gets the level data from levelData.json
fetch("/levelData.json")
	.then((response) => response.json())
	.then((data) => {
		levels = data.levels;
	});

//Sets the colours of the characters on the character select screen
document.getElementsByClassName("characterBox")[1].style.filter =
	`hue-rotate(${characterHues[1]}deg)`;
document.getElementsByClassName("characterBox")[2].style.filter =
	`hue-rotate(${characterHues[2]}deg)`;
document.getElementsByClassName("characterBox")[3].style.filter =
	`hue-rotate(${characterHues[3]}deg)`;
document.getElementsByClassName("characterBox")[5].style.filter =
	`hue-rotate(${characterHues[1]}deg)`;
document.getElementsByClassName("characterBox")[6].style.filter =
	`hue-rotate(${characterHues[2]}deg)`;
document.getElementsByClassName("characterBox")[7].style.filter =
	`hue-rotate(${characterHues[3]}deg)`;

const titleBubble = document.createElement("div");
titleBubble.classList.add("titleBubble");

const pow = document.createElement("div");
pow.classList.add("pow");

const jump = document.createElement("div");
jump.classList.add("jump");

const afterImage1 = document.createElement("div");
afterImage1.classList.add("afterImage1");

const afterImage2 = document.createElement("div");
afterImage2.classList.add("afterImage2");

//Switches to a different screen
function toScreen(x) {
	document.getElementById("transitionCover1").style.top = "0%";
	document.getElementById("transitionCover2").style.bottom = "0%";
	//Main title screen
	if (x === 1) {
		setTimeout(() => {
			currentScreen = 1;
			document.getElementById("titleScreen").style.display = "block";
			document.getElementById("selectScreen").style.display = "none";
			document.getElementById("campaignScreen").style.display = "none";
		}, 750);
	}
	//Character select screen (Local versus mode)
	else if (x === 2) {
		setTimeout(() => {
			currentScreen = 2;
			document.getElementById("titleScreen").style.display = "none";
			document.getElementById("selectScreen").style.display = "block";
			document.getElementById("campaignScreen").style.display = "none";
		}, 750);
	}
	//Campaign level select screen
	else if (x === 3) {
		setTimeout(() => {
			currentScreen = 4;
			document.getElementById("titleScreen").style.display = "none";
			document.getElementById("selectScreen").style.display = "none";
			document.getElementById("campaignScreen").style.display = "block";
			document.getElementById("campaignLevelInfoContainer").style.right =
				"-17vw";
		}, 750);
	}
	setTimeout(hideTransitionCover, 1200);
}

//Shows the control cover
function showControls() {
	document.getElementById("controlsCover").style.display = "block";
	setTimeout(() => {
		document.getElementById("controlsCover").style.opacity = "1";
	}, 50);
}

//Hides the control cover
function hideControls() {
	document.getElementById("controlsCover").style.opacity = "0";
	setTimeout(() => {
		document.getElementById("controlsCover").style.display = "none";
	}, 1000);
}

//Shows the level info in the campaign screen
function showLevelInfo() {
	document.getElementById("campaignLevelInfoContainer").style.right = "0";
}

//Updates the stat bars in the character select screen (could definitely be shortened)
function updateStats(x = 1, y = 0) {
	if (x === 0) {
		document.getElementsByClassName("character1StatBar")[0].style.width = "0%";
		document.getElementsByClassName("character1StatBar")[1].style.width = "0%";
		document.getElementsByClassName("character1StatBar")[2].style.width = "0%";
		document.getElementsByClassName("character2StatBar")[0].style.width = "0%";
		document.getElementsByClassName("character2StatBar")[1].style.width = "0%";
		document.getElementsByClassName("character2StatBar")[2].style.width = "0%";
	} else if (x === 1) {
		let displayType = y;
		if (y === 4) displayType = 0; // Show stats for type 0 if secret character selected
		switch (displayType) {
			case 0:
				document.getElementsByClassName("character1StatBar")[0].style.width =
					"60%";
				document.getElementsByClassName("character1StatBar")[1].style.width =
					"60%";
				document.getElementsByClassName("character1StatBar")[2].style.width =
					"40%";
				break;
			case 1:
				document.getElementsByClassName("character1StatBar")[0].style.width =
					"100%";
				document.getElementsByClassName("character1StatBar")[1].style.width =
					"40%";
				document.getElementsByClassName("character1StatBar")[2].style.width =
					"20%";
				break;
			case 2:
				document.getElementsByClassName("character1StatBar")[0].style.width =
					"40%";
				document.getElementsByClassName("character1StatBar")[1].style.width =
					"80%";
				document.getElementsByClassName("character1StatBar")[2].style.width =
					"40%";
				break;
			case 3:
				document.getElementsByClassName("character1StatBar")[0].style.width =
					"20%";
				document.getElementsByClassName("character1StatBar")[1].style.width =
					"60%";
				document.getElementsByClassName("character1StatBar")[2].style.width =
					"80%";
				break;
		}
	} else if (x === 2) {
		let displayType = y;
		if (y === 4) displayType = 0; // Show stats for type 0 if secret character selected
		switch (displayType) {
			case 0:
				document.getElementsByClassName("character2StatBar")[0].style.width =
					"60%";
				document.getElementsByClassName("character2StatBar")[1].style.width =
					"60%";
				document.getElementsByClassName("character2StatBar")[2].style.width =
					"40%";
				break;
			case 1:
				document.getElementsByClassName("character2StatBar")[0].style.width =
					"100%";
				document.getElementsByClassName("character2StatBar")[1].style.width =
					"40%";
				document.getElementsByClassName("character2StatBar")[2].style.width =
					"20%";
				break;
			case 2:
				document.getElementsByClassName("character2StatBar")[0].style.width =
					"40%";
				document.getElementsByClassName("character2StatBar")[1].style.width =
					"80%";
				document.getElementsByClassName("character2StatBar")[2].style.width =
					"40%";
				break;
			case 3:
				document.getElementsByClassName("character2StatBar")[0].style.width =
					"20%";
				document.getElementsByClassName("character2StatBar")[1].style.width =
					"60%";
				document.getElementsByClassName("character2StatBar")[2].style.width =
					"80%";
				break;
		}
	}
}
updateStats(1, 0);
updateStats(2, 0);

function startLevel() {
	fetch("/levelData.json")
		.then((response) => response.json())
		.then((data) => {
			levelName = data.levels[0][0];
		});
	document.getElementById("levelNameMessage").style.opacity = "1";
	player1.statMultipliers = statMultipliersList[player1.dragonType];
	player1.hiddenStats = hiddenStatsList[player1.dragonType];
	levelScrollSpeed = 4;
	document.getElementById("player2").style.display = "none";
	document.getElementById("transitionCover1").style.top = "0%";
	document.getElementById("transitionCover2").style.bottom = "0%";
	setTimeout(() => {
		currentScreen = 5;
		document.getElementById("campaignScreen").style.display = "none";
		document.getElementById("VSHealthBarBack").style.display = "none";
	}, 750);
	setTimeout(() => {
		document.getElementById("transitionCover1").style.top = "-52%";
		document.getElementById("transitionCover2").style.bottom = "-52%";
		inRound = true;
	}, 1200);
	setTimeout(renderLevelName, 1400, 0);
}

//Very very scuffed code that renders the level name text
function renderLevelName(x) {
	//For each character in the level name, either set to a random letter or the right letter from the name based on x (x increments until the level name length)
	if (x < (levelName.length + 10) * 3) {
		levelNameString = "";
		for (i = 0; i < levelName.length; i++) {
			if (x / 3 > i + 4) levelNameString += levelName[i];
			else if (x / 3 > i)
				levelNameString += Math.floor(Math.random() * 26 + 10).toString(36);
			else levelNameString += "&#160";
		}
		document.getElementById("levelNameMessage").innerHTML = levelNameString;
		setTimeout(renderLevelName, 30, x + 1);
	} else if (x === (levelName.length + 10) * 3) {
		document.getElementById("levelNameMessage").style.opacity = "0";
	}
}

function startMatch() {
	versusRound = 1;
	player1.statMultipliers = statMultipliersList[player1.dragonType];
	player1.hiddenStats = hiddenStatsList[player1.dragonType];
	player2.statMultipliers = statMultipliersList[player2.dragonType];
	player2.hiddenStats = hiddenStatsList[player2.dragonType];
	document.getElementById("player2").style.display = "block";
	document.getElementById("player1").style.filter =
		`hue-rotate(${characterHues[player1.dragonType === 4 ? 0 : player1.dragonType]}deg)`;
	document.getElementById("VSHealthBar1").style.filter =
		`hue-rotate(${characterHues[player1.dragonType]}deg)`;
	document.getElementById("player2").style.filter =
		`hue-rotate(${characterHues[player2.dragonType === 4 ? 0 : player2.dragonType]}deg)`;
	document.getElementById("VSHealthBar2").style.filter =
		`hue-rotate(${characterHues[player2.dragonType]}deg)`;
	document.getElementById("transitionCover1").style.top = "0%";
	document.getElementById("transitionCover2").style.bottom = "0%";
	setTimeout(() => {
		currentScreen = 3;
		document.getElementById("selectScreen").style.display = "none";
		document.getElementById("VSHealthBarBack").style.display = "block";
	}, 750);
	setTimeout(startRound, 1200);
}

function startRound() {
	document.getElementById("transitionCover1").style.top = "-52%";
	document.getElementById("transitionCover2").style.bottom = "-52%";
	document.getElementById("readyMessage").style.backgroundImage =
		"url('img/Ready.png')";
	document.getElementById("readyMessage").style.top = "50%";
	player1.health = 100;
	player2.health = 100;
	document.getElementById("VSHealthBar1").style.width =
		`${player1.health / 2.5}%`;
	document.getElementById("VSHealthBar2").style.width =
		`${player2.health / 2.5}%`;
	player1.xVelocity = 0;
	player1.yVelocity = 0;
	player1.xPos = (2000 - minDistanceFromEdge) * (1 / 3);
	player1.yPos = windowheightRatio - minDistanceFromFloor;
	document.getElementById("player1").style.transform = null;
	player2.xVelocity = 0;
	player2.yVelocity = 0;
	player2.xPos = (2000 - minDistanceFromEdge) * (2 / 3);
	player2.yPos = windowheightRatio - minDistanceFromFloor;
	document.getElementById("player2").style.transform = "scaleX(-1)";
	if (versusRound === 1) {
		document.getElementById("VSRoundText").innerHTML = "Round 1";
		document.getElementById("VSRoundText").style.color = "#ccf";
		document.getElementById("VSRoundText").style.textShadow =
			"0.2vw 0.2vw #66a";
	} else if (versusRound === 2) {
		document.getElementById("VSRoundText").innerHTML = "Round 2";
		document.getElementById("VSRoundText").style.color = "#fec";
		document.getElementById("VSRoundText").style.textShadow =
			"0.2vw 0.2vw #a86";
	} else if (versusRound === 3) {
		document.getElementById("VSRoundText").innerHTML = "Round 3";
		document.getElementById("VSRoundText").style.color = "#cfc";
		document.getElementById("VSRoundText").style.textShadow =
			"0.2vw 0.2vw #6a6";
	}
	roundFinished = false;
	inRound = false;
	setTimeout(() => {
		document.getElementById("readyMessage").style.backgroundImage =
			"url('img/Go.png')";
		document.getElementById("readyMessage").style.top = "-300px";
		inRound = true;
	}, 2000);
}

function endMatch() {
	document.getElementById("transitionCover1").style.top = "0%";
	document.getElementById("transitionCover2").style.bottom = "0%";
	setTimeout(() => {
		currentScreen = 2;
		document.getElementById("selectScreen").style.display = "block";
	}, 750);
	setTimeout(hideTransitionCover, 1200);
}

function hideTransitionCover() {
	document.getElementById("transitionCover1").style.top = "-52%";
	document.getElementById("transitionCover2").style.bottom = "-52%";
}

document.addEventListener("mousemove", logKey);

function logKey(e) {
	if (currentScreen === 1) {
		document.getElementById("menuButton1").style.left =
			`${45 + (e.clientX / window.innerWidth) * 10}%`;
		document.getElementById("menuButton1").style.top =
			`${37 + (e.clientY / window.innerHeight) * 10}%`;
		document.getElementById("menuButton2").style.left =
			`${45 + (e.clientX / window.innerWidth) * 10}%`;
		document.getElementById("menuButton2").style.top =
			`${55 + (e.clientY / window.innerHeight) * 10}%`;
		document.getElementById("menuButton3").style.left =
			`${45 + (e.clientX / window.innerWidth) * 10}%`;
		document.getElementById("menuButton3").style.top =
			`${73 + (e.clientY / window.innerHeight) * 10}%`;
	}
}

document.getElementById("menuButton1Back").style.left = "50%";
document.getElementById("menuButton1Back").style.top = "42%";
document.getElementById("menuButton2Back").style.left = "50%";
document.getElementById("menuButton2Back").style.top = "60%";
document.getElementById("menuButton3Back").style.left = "50%";
document.getElementById("menuButton3Back").style.top = "78%";

// Get the most recently pressed key from a list of key codes
function prioritizeRecentKey(keyCodes) {
	// Filter keyPressOrder to only include specified keys that are currently pressed
	const relevantKeys = keyPressOrder.filter(item => 
		keyCodes.includes(item.key) && keysCurrentlyPressed[item.key])
		.sort((a, b) => b.time - a.time); // Sort by most recent

	// Return the most recently pressed key, or null if none are pressed
	return relevantKeys.length > 0 ? relevantKeys[0].key : null;
}

// Time multiplier to keep game speed consistent regardless of frame rate
let deltaTimeMultiplier = 1;

function update(deltaTime = 16.67) {
	// Calculate the time multiplier based on frame time
	deltaTimeMultiplier = deltaTime / 16.67; // 16.67ms is ~60fps
	
	windowheightRatio = (2000 / window.innerWidth) * window.innerHeight;
	// Use fixed time increment for game logic
	timeSinceStart += 15;

	//Title screen stuff
	if (currentScreen === 1) {
		document.getElementById("titleText").style.top =
			`${Math.sin(timeSinceStart / 500) / 2 + 1.5}vw`;
		//Whooshy button backgrounds (May cause lag, can be removed if need be)
		document.getElementById("menuButton1Back").style.left = `${
			(
				Number.parseFloat(
					document.getElementById("menuButton1Back").style.left,
				) - Number.parseFloat(document.getElementById("menuButton1").style.left)
			) /
				1.1 +
			Number.parseFloat(document.getElementById("menuButton1").style.left)
		}%`;
		document.getElementById("menuButton1Back").style.top = `${
			(
				Number.parseFloat(
					document.getElementById("menuButton1Back").style.top,
				) - Number.parseFloat(document.getElementById("menuButton1").style.top)
			) /
				1.1 +
			Number.parseFloat(document.getElementById("menuButton1").style.top)
		}%`;
		document.getElementById("menuButton2Back").style.left = `${
			(
				Number.parseFloat(
					document.getElementById("menuButton2Back").style.left,
				) - Number.parseFloat(document.getElementById("menuButton2").style.left)
			) /
				1.1 +
			Number.parseFloat(document.getElementById("menuButton2").style.left)
		}%`;
		document.getElementById("menuButton2Back").style.top = `${
			(
				Number.parseFloat(
					document.getElementById("menuButton2Back").style.top,
				) - Number.parseFloat(document.getElementById("menuButton2").style.top)
			) /
				1.1 +
			Number.parseFloat(document.getElementById("menuButton2").style.top)
		}%`;
		document.getElementById("menuButton3Back").style.left = `${
			(
				Number.parseFloat(
					document.getElementById("menuButton3Back").style.left,
				) - Number.parseFloat(document.getElementById("menuButton3").style.left)
			) /
				1.1 +
			Number.parseFloat(document.getElementById("menuButton3").style.left)
		}%`;
		document.getElementById("menuButton3Back").style.top = `${
			(
				Number.parseFloat(
					document.getElementById("menuButton3Back").style.top,
				) - Number.parseFloat(document.getElementById("menuButton3").style.top)
			) /
				1.1 +
			Number.parseFloat(document.getElementById("menuButton3").style.top)
		}%`;

		//Handles title screen bubbles
		for (
			i = 0;
			i < document.getElementsByClassName("titleBubble").length;
			i++
		) {
			document.getElementsByClassName("titleBubble")[i].style.top = `${
				Number.parseFloat(
					document.getElementsByClassName("titleBubble")[i].style.top,
				) - 0.3
			}%`;
			document.getElementsByClassName("titleBubble")[i].style.opacity =
				Number.parseFloat(
					document.getElementsByClassName("titleBubble")[i].style.opacity,
				) - 0.007;
			document.getElementsByClassName("titleBubble")[i].style.left = `${
				Number.parseFloat(
					document.getElementsByClassName("titleBubble")[i].style.left,
				) -
				Number.parseFloat(
					document.getElementsByClassName("titleBubble")[i].dataset.xvelocity,
				)
			}%`;
			if (
				Number.parseFloat(
					document.getElementsByClassName("titleBubble")[i].style.opacity,
				) <= 0
			) {
				document.getElementsByClassName("titleBubble")[i].remove();
				i--;
			}
		}
		if (Math.floor(Math.random() * 20) === 0) {
			//Creates a title screen bubble
			titleBubble.style.left = `${Math.random() * 110 - 10}%`;
			titleBubbleSize = Math.random() * 25 + 5;
			titleBubble.style.width = `${titleBubbleSize}vh`;
			titleBubble.style.height = `${titleBubbleSize}vh`;
			titleBubble.style.top = "100%";
			titleBubble.style.opacity = "1";
			titleBubble.setAttribute("data-xvelocity", Math.random() / 5 - 0.1);
			document
				.getElementById("titleScreen")
				.appendChild(titleBubble.cloneNode(true));
		}
	}

	//Character select screen stuff
	if (currentScreen === 2) {
		document.getElementById("selectScreen").style.backgroundPosition =
			`${-timeSinceStart / 500}vw ${-timeSinceStart / 500}vw`;
		document.getElementById("characterSelectText").style.top =
			`${Math.sin(timeSinceStart / 500) / 2 + 1.5}vw`;
		document.getElementById("selectedCharacter1").style.filter =
			`hue-rotate(${characterHues[player1.dragonType]}deg)`;
		document.getElementById("selectedCharacter2").style.filter =
			`hue-rotate(${characterHues[player2.dragonType]}deg)`;
	}

	//Moves the background (temporary!)
	if (currentScreen === 5 && inRound) backgroundPosition -= levelScrollSpeed;
	document.getElementById("backgroundOverlay").style.backgroundPosition =
		`${backgroundPosition}px 0px`;

	//Removes pow effects
	for (i = 0; i < document.getElementsByClassName("pow").length; i++) {
		if (
			timeSinceStart >
			Number.parseInt(
				document.getElementsByClassName("pow")[i].dataset.timespawned,
			) +
				150
		) {
			document.getElementsByClassName("pow")[i].remove();
			i--;
		}
	}
	//Removes bounce effects
	for (i = 0; i < document.getElementsByClassName("jump").length; i++) {
		if (
			timeSinceStart >
			Number.parseInt(
				document.getElementsByClassName("jump")[i].dataset.timespawned,
			) +
				150
		) {
			document.getElementsByClassName("jump")[i].remove();
			i--;
		}
	}
	//Removes afterimages
	for (i = 0; i < document.getElementsByClassName("afterImage1").length; i++) {
		if (
			timeSinceStart >
			Number.parseInt(
				document.getElementsByClassName("afterImage1")[i].dataset.timespawned,
			) +
				150
		) {
			document.getElementsByClassName("afterImage1")[i].remove();
			i--;
		}
	}
	for (i = 0; i < document.getElementsByClassName("afterImage2").length; i++) {
		if (
			timeSinceStart >
			Number.parseInt(
				document.getElementsByClassName("afterImage2")[i].dataset.timespawned,
			) +
				150
		) {
			document.getElementsByClassName("afterImage2")[i].remove();
			i--;
		}
	}

	//Detects key presses - Using defined control scheme constants
	// Handle Player 1 movement with priority system
	if (player1.health > 0 && inRound) {
		// Check if both left and right are pressed
		const horizontalKeys = [CONTROLS.player1.left, CONTROLS.player1.right];
		const bothHorizontalPressed = player1.keysPressed[CONTROLS.player1.left] && player1.keysPressed[CONTROLS.player1.right];
		
		// Use most recent key press when both horizontal keys are pressed
		if (bothHorizontalPressed) {
			const mostRecent = prioritizeRecentKey(horizontalKeys);
			
			if (mostRecent === CONTROLS.player1.left) {
				document.getElementById("player1").style.transform = "scaleX(-1)";
				if (player1.xVelocity > movementSpeed * player1.statMultipliers[0] * -5)
					player1.xVelocity = player1.xVelocity * 0.8 - movementSpeed * player1.statMultipliers[0];
			} else if (mostRecent === CONTROLS.player1.right) {
				document.getElementById("player1").style.transform = null;
				if (player1.xVelocity < movementSpeed * player1.statMultipliers[0] * 5)
					player1.xVelocity = player1.xVelocity * 0.8 + movementSpeed * player1.statMultipliers[0];
			}
		} else {
			// Handle normal single-key-press movement
			if (player1.keysPressed[CONTROLS.player1.left]) {
				document.getElementById("player1").style.transform = "scaleX(-1)";
				if (player1.xVelocity > movementSpeed * player1.statMultipliers[0] * -5)
					player1.xVelocity = player1.xVelocity * 0.8 - movementSpeed * player1.statMultipliers[0];
			}
			if (player1.keysPressed[CONTROLS.player1.right]) {
				document.getElementById("player1").style.transform = null;
				if (player1.xVelocity < movementSpeed * player1.statMultipliers[0] * 5)
					player1.xVelocity = player1.xVelocity * 0.8 + movementSpeed * player1.statMultipliers[0];
			}
		}
	}

	// Handle Player 2 movement with priority system
	if (player2.health > 0 && inRound && currentScreen === 3) {
		// Check if both left and right are pressed
		const horizontalKeys = [CONTROLS.player2.left, CONTROLS.player2.right];
		const bothHorizontalPressed = player2.keysPressed[CONTROLS.player2.left] && player2.keysPressed[CONTROLS.player2.right];
		
		// Use most recent key press when both horizontal keys are pressed
		if (bothHorizontalPressed) {
			const mostRecent = prioritizeRecentKey(horizontalKeys);
			
			if (mostRecent === CONTROLS.player2.left) {
				document.getElementById("player2").style.transform = "scaleX(-1)";
				if (player2.xVelocity > movementSpeed * player2.statMultipliers[0] * -5)
					player2.xVelocity = player2.xVelocity * 0.8 - movementSpeed * player2.statMultipliers[0];
			} else if (mostRecent === CONTROLS.player2.right) {
				document.getElementById("player2").style.transform = null;
				if (player2.xVelocity < movementSpeed * player2.statMultipliers[0] * 5)
					player2.xVelocity = player2.xVelocity * 0.8 + movementSpeed * player2.statMultipliers[0];
			}
		} else {
			// Handle normal single-key-press movement
			if (player2.keysPressed[CONTROLS.player2.left]) {
				document.getElementById("player2").style.transform = "scaleX(-1)";
				if (player2.xVelocity > movementSpeed * player2.statMultipliers[0] * -5)
					player2.xVelocity = player2.xVelocity * 0.8 - movementSpeed * player2.statMultipliers[0];
			}
			if (player2.keysPressed[CONTROLS.player2.right]) {
				document.getElementById("player2").style.transform = null;
				if (player2.xVelocity < movementSpeed * player2.statMultipliers[0] * 5)
					player2.xVelocity = player2.xVelocity * 0.8 + movementSpeed * player2.statMultipliers[0];
			}
		}
	}

	//Detects hit cooldowns
	if (player1.hitCooldown > 0) player1.hitCooldown--;
	if (player2.hitCooldown > 0) player2.hitCooldown--;

	//Detects dash cooldowns
	if (player1.currentDashCooldown > 0) player1.currentDashCooldown--;
	if (player2.currentDashCooldown > 0) player2.currentDashCooldown--;

	//Detects bounce timers
	if (player1.bounceTimer > 0) player1.bounceTimer--;
	if (player2.bounceTimer > 0) player2.bounceTimer--;

	//Handles X-position with frame rate independence
	// Apply velocity changes with deltaTimeMultiplier for consistent movement
	player1.xPos += player1.xVelocity * deltaTimeMultiplier;
	if (currentScreen === 5 && inRound) player1.xPos -= levelScrollSpeed * deltaTimeMultiplier;
	if (currentScreen === 3 && player1.xPos > 2000 - minDistanceFromEdge) {
		player1.xPos = 2000 - minDistanceFromEdge;
		player1.xVelocity = 0;
	}
	if (currentScreen === 3 && player1.xPos < minDistanceFromEdge - 192) {
		player1.xPos = minDistanceFromEdge - 192;
		player1.xVelocity = 0;
	}

	player2.xPos += player2.xVelocity * deltaTimeMultiplier;
	if (player2.xPos > 2000 - minDistanceFromEdge) {
		player2.xPos = 2000 - minDistanceFromEdge;
		player2.xVelocity = 0;
	}
	if (player2.xPos < minDistanceFromEdge - 192) {
		player2.xPos = minDistanceFromEdge - 192;
		player2.xVelocity = 0;
	}

	//Handles X-velocity with frame rate independent physics
	const adjustedHorizontalDrag = HorizontalDrag * deltaTimeMultiplier;
	if (player1.yPos === windowheightRatio - minDistanceFromFloor) {
		player1.xVelocity =
			Math.round(player1.xVelocity / adjustedHorizontalDrag) * adjustedHorizontalDrag;
		if (player1.xVelocity > 0) player1.xVelocity -= adjustedHorizontalDrag;
		if (player1.xVelocity < 0) player1.xVelocity += adjustedHorizontalDrag;
	} else {
		const airDrag = adjustedHorizontalDrag / 2;
		player1.xVelocity =
			Math.round(player1.xVelocity / airDrag) * airDrag;
		if (player1.xVelocity > 0) player1.xVelocity -= airDrag;
		if (player1.xVelocity < 0) player1.xVelocity += airDrag;
	}

	if (player2.yPos === windowheightRatio - minDistanceFromFloor) {
		player2.xVelocity =
			Math.round(player2.xVelocity / adjustedHorizontalDrag) * adjustedHorizontalDrag;
		if (player2.xVelocity > 0) player2.xVelocity -= adjustedHorizontalDrag;
		if (player2.xVelocity < 0) player2.xVelocity += adjustedHorizontalDrag;
	} else {
		const airDrag = adjustedHorizontalDrag / 2;
		player2.xVelocity =
			Math.round(player2.xVelocity / airDrag) * airDrag;
		if (player2.xVelocity > 0) player2.xVelocity -= airDrag;
		if (player2.xVelocity < 0) player2.xVelocity += airDrag;
	}

	//Handles Y-position with frame rate independence
	player1.yPos += player1.yVelocity * deltaTimeMultiplier;
	if (player1.yPos > windowheightRatio - minDistanceFromFloor) {
		player1.yPos = windowheightRatio - minDistanceFromFloor;
		player1.yVelocityOnLastLand = player1.yVelocity;
		player1.yVelocity = 0;
		player1.bounceTimer = 6;
	}
	if (player1.yPos < 0) {
		player1.yPos = 0;
		player1.yVelocity = 0;
	}

	player2.yPos += player2.yVelocity * deltaTimeMultiplier;
	if (player2.yPos > windowheightRatio - minDistanceFromFloor) {
		player2.yPos = windowheightRatio - minDistanceFromFloor;
		player2.yVelocityOnLastLand = player2.yVelocity;
		player2.yVelocity = 0;
		player2.bounceTimer = 6; 
	}
	if (player2.yPos < 0) {
		player2.yPos = 0;
		player2.yVelocity = 0;
	}

	//Handles Y-velocity with frame rate independent physics
	// Apply frame-rate adjusted gravity
	const adjustedGravity = gravity * deltaTimeMultiplier;
	
	player1.yVelocity = Math.round(player1.yVelocity / adjustedGravity) * adjustedGravity;
	if (player1.yPos < windowheightRatio - minDistanceFromFloor) {
		// Apply gravity
		player1.yVelocity = Math.min(player1.yVelocity + adjustedGravity, maxFallingSpeed);
		// Apply fast fall if key is pressed
		if (player1.keysPressed[CONTROLS.player1.fastFall] && player1.health > 0 && inRound) {
			player1.yVelocity = Math.min(player1.yVelocity + adjustedGravity * 1.5, maxFallingSpeed);
		}
	}

	player2.yVelocity = Math.round(player2.yVelocity / adjustedGravity) * adjustedGravity;
	if (player2.yPos < windowheightRatio - minDistanceFromFloor) {
		// Apply gravity
		player2.yVelocity = Math.min(player2.yVelocity + adjustedGravity, maxFallingSpeed);
		// Apply fast fall if key is pressed
		if (player2.keysPressed[CONTROLS.player2.fastFall] && player2.health > 0 && inRound && currentScreen === 3) {
			player2.yVelocity = Math.min(player2.yVelocity + adjustedGravity * 1.5, maxFallingSpeed);
		}
	}

	//Handles damage
	if (
		player1.xPos > player2.xPos - 96 &&
		player1.xPos < player2.xPos + 96 &&
		player1.yPos > player2.yPos - 128 &&
		player1.yPos <
			player2.yPos - 128 + (player1.yVelocity - player2.yVelocity) &&
		player1.yVelocity > player2.yVelocity + 4 &&
		!player2.hitCooldown &&
		player2.health > 0 &&
		currentScreen === 3
	) {
		player2.hitCooldown = 50;
		player1.yVelocity = player1.yVelocity * -0.7;
		player2.yVelocity = Math.max(player2.yVelocity, 5);
		damagePlayer(2);
		//Creates the pow effect
		pow.style.left = `${player2.xPos / 20}vw`;
		pow.style.top = `${player2.yPos / 20}vw`;
		pow.style.backgroundImage = "url('img/9HitFx.gif')"; //Supposed to restart the gif but it DOESN'T
		pow.setAttribute("data-timeSpawned", timeSinceStart);
		document.body.appendChild(pow.cloneNode(true));
	}

	if (
		player2.xPos > player1.xPos - 96 &&
		player2.xPos < player1.xPos + 96 &&
		player2.yPos > player1.yPos - 128 &&
		player2.yPos <
			player1.yPos - 128 + (player2.yVelocity - player1.yVelocity) &&
		player2.yVelocity > player1.yVelocity + 4 &&
		!player1.hitCooldown &&
		player1.health > 0 &&
		currentScreen === 3
	) {
		player1.hitCooldown = 50;
		player2.yVelocity = player2.yVelocity * -0.7;
		player1.yVelocity = Math.max(player1.yVelocity, 5);
		damagePlayer(1);
		//Creates the pow effect
		pow.style.left = `${player1.xPos / 20}vw`;
		pow.style.top = `${player1.yPos / 20}vw`;
		pow.style.backgroundImage = "url('img/9HitFx.gif')"; //Supposed to restart the gif but it DOESN'T
		pow.setAttribute("data-timeSpawned", timeSinceStart);
		document.body.appendChild(pow.cloneNode(true));
	}

	if (currentScreen === 3 || currentScreen === 5) {
		//updates players' positions
		document.getElementById("player1").style.left = `${player1.xPos / 20}vw`;
		document.getElementById("player1").style.top = `${player1.yPos / 20}vw`;
		document.getElementById("player2").style.left = `${player2.xPos / 20}vw`;
		document.getElementById("player2").style.top = `${player2.yPos / 20}vw`;

		//Updates hit cooldown bars
		document.getElementById("VSHitCooldown1").style.height =
			`${player1.hitCooldown}px`;
		document.getElementById("VSHitCooldown2").style.height =
			`${player2.hitCooldown}px`;

		//Handles player images
		if (player1.health === 0) {
			document.getElementById("player1").style.backgroundImage =
				"url('img/7OrangeDED.gif')";
		} else if (player1.hitCooldown > 30) {
			document.getElementById("player1").style.backgroundImage =
				"url('img/6OrangeOuch.png')";
		} else if (player1.yVelocity < -2) {
			document.getElementById("player1").style.backgroundImage =
				"url('img/4OrangeUp.png')";
		} else if (player1.yVelocity > 2) {
			document.getElementById("player1").style.backgroundImage =
				"url('img/5OrangeDown.png')";
		} else if (player1.xVelocity !== 0) {
			document.getElementById("player1").style.backgroundImage =
				"url('img/1OrangeRun.gif')";
		} else {
			document.getElementById("player1").style.backgroundImage =
				"url('img/0OrangeStand.gif')";
		}

		if (player2.health === 0) {
			document.getElementById("player2").style.backgroundImage =
				"url('img/7OrangeDED.gif')";
		} else if (player2.hitCooldown > 30) {
			document.getElementById("player2").style.backgroundImage =
				"url('img/6OrangeOuch.png')";
		} else if (player2.yVelocity < -2) {
			document.getElementById("player2").style.backgroundImage =
				"url('img/4OrangeUp.png')";
		} else if (player2.yVelocity > 2) {
			document.getElementById("player2").style.backgroundImage =
				"url('img/5OrangeDown.png')";
		} else if (player2.xVelocity !== 0) {
			document.getElementById("player2").style.backgroundImage =
				"url('img/1OrangeRun.gif')";
		} else {
			document.getElementById("player2").style.backgroundImage =
				"url('img/0OrangeStand.gif')";
		}

		// Handles afterimages - with performance optimization
		// Create afterimages at a controlled rate to prevent excessive DOM manipulation
		const createAfterImageThreshold = 3; // Only create afterimages every few frames when moving fast
		player1.afterImageCounter = player1.afterImageCounter || 0;
		player2.afterImageCounter = player2.afterImageCounter || 0;
		player1totalVelocity = Math.sqrt(player1.xVelocity * player1.xVelocity + player1.yVelocity * player1.yVelocity);

		if (player1totalVelocity > minAfterImageSpeed) {
			player1.afterImageCounter++;
	
			// Only create afterimages periodically based on velocity
			if (player1.afterImageCounter >= createAfterImageThreshold) {
				player1.afterImageCounter = 0;
		
				afterImage1.style.left = `${player1.xPos / 20}vw`;
				afterImage1.style.top = `${player1.yPos / 20}vw`;
				afterImage1.style.filter = `hue-rotate(${characterHues[player1.dragonType === 4 ? 0 : player1.dragonType]}deg)`;
				afterImage1.style.transform = document.getElementById("player1").style.transform;
				afterImage1.setAttribute("data-timeSpawned", timeSinceStart);
		
				// Set background image based on player state
				if (player1.health === 0) {
					afterImage1.style.backgroundImage = "url('img/7OrangeDED.gif')";
				} else if (player1.hitCooldown > 30) {
					afterImage1.style.backgroundImage = "url('img/6OrangeOuch.png')";
				} else if (player1.yVelocity < -2) {
					afterImage1.style.backgroundImage = "url('img/4OrangeUp.png')";
				} else if (player1.yVelocity > 2) {
					afterImage1.style.backgroundImage = "url('img/5OrangeDown.png')";
				} else if (player1.xVelocity !== 0) {
					afterImage1.style.backgroundImage = "url('img/1OrangeRun.gif')";
				} else {
					afterImage1.style.backgroundImage = "url('img/0OrangeStand.gif')";
				}
		
				// Use documentFragment for better performance
				document.body.appendChild(afterImage1.cloneNode(true));
			}
		} else {
			player1.afterImageCounter = 0;
		}

		player2totalVelocity = Math.sqrt(player2.xVelocity * player2.xVelocity + player2.yVelocity * player2.yVelocity);

		if (player2totalVelocity > minAfterImageSpeed) {
			player2.afterImageCounter++;
	
			// Only create afterimages periodically based on velocity
			if (player2.afterImageCounter >= createAfterImageThreshold) {
				player2.afterImageCounter = 0;
		
				afterImage2.style.left = `${player2.xPos / 20}vw`;
				afterImage2.style.top = `${player2.yPos / 20}vw`;
				afterImage2.style.filter = `hue-rotate(${characterHues[player2.dragonType === 4 ? 0 : player2.dragonType]}deg)`;
				afterImage2.style.transform = document.getElementById("player2").style.transform;
				afterImage2.setAttribute("data-timeSpawned", timeSinceStart);
		
				// Set background image based on player state
				if (player2.health === 0) {
					afterImage2.style.backgroundImage = "url('img/7OrangeDED.gif')";
				} else if (player2.hitCooldown > 30) {
					afterImage2.style.backgroundImage = "url('img/6OrangeOuch.png')";
				} else if (player2.yVelocity < -2) {
					afterImage2.style.backgroundImage = "url('img/4OrangeUp.png')";
				} else if (player2.yVelocity > 2) {
					afterImage2.style.backgroundImage = "url('img/5OrangeDown.png')";
				} else if (player2.xVelocity !== 0) {
					afterImage2.style.backgroundImage = "url('img/1OrangeRun.gif')";
				} else {
					afterImage2.style.backgroundImage = "url('img/0OrangeStand.gif')";
				}
		
				// Use documentFragment for better performance
				document.body.appendChild(afterImage2.cloneNode(true));
			}
		} else {
			player2.afterImageCounter = 0;
		}

		//Handles win state
		if (player1.health === 0 || player2.health === 0) {
			document.getElementById("winMessage").style.top =
				`${Math.sin(timeSinceStart / 300) * 6 + 50}%`;
			document.getElementById("winMessageShadow").style.top =
				`${Math.sin((timeSinceStart - 100) / 300) * 6 + 50}%`;
			document.getElementById("winMessageShadow2").style.top =
				`${Math.sin((timeSinceStart - 200) / 300) * 6 + 50}%`;
			document.getElementById("winMessage2").style.top =
				`calc(${Math.sin((timeSinceStart - 50) / 300) * 6 + 50}% + 150px)`;
			if (player2.health === 0) {
				document.getElementById("winMessage2").style.backgroundImage =
					"url('img/Player1Wins.png')";
			} else {
				document.getElementById("winMessage2").style.backgroundImage =
					"url('img/Player2Wins.png')";
			}
		} else {
			document.getElementById("winMessage").style.top = "-100px";
			document.getElementById("winMessageShadow").style.top = "-100px";
			document.getElementById("winMessageShadow2").style.top = "-100px";
			document.getElementById("winMessage2").style.top = "calc(100% + 180px)";
		}
	}
}

// Replace interval with requestAnimationFrame for smoother animation
let lastFrameTime = 0;
const targetFrameRate = 60; // 60 FPS target
const targetFrameTime = 1000 / targetFrameRate; // ~16.67ms per frame

function gameLoop(timestamp) {
    // Calculate time since last frame
    if (!lastFrameTime) lastFrameTime = timestamp;
    const deltaTime = timestamp - lastFrameTime;
    
    // Update with actual time delta for smooth animation
    update(deltaTime);
    lastFrameTime = timestamp;
    
    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);

// Track keypress timestamps to determine which key was pressed most recently
let keyPressOrder = [];

// Function to register a keypress in the order stack
function registerKeyPress(keyCode) {
	// Remove previous instance of this key if it exists
	keyPressOrder = keyPressOrder.filter(item => item.key !== keyCode);
	
	// Add to the end of the array (most recent)
	keyPressOrder.push({ key: keyCode, time: performance.now() });
	
	// Keep only the last 20 keys to prevent memory growth
	if (keyPressOrder.length > 20) {
		keyPressOrder.shift();
	}
}

// Process key events for jump action
function handleJump(player, playerNum) {
	if (!player.jumped && player.health > 0 && inRound && (playerNum === 1 || currentScreen === 3)) {
		player.jumped = true;
		if (player.yPos === windowheightRatio - minDistanceFromFloor &&
			player.hitCooldown === 0 &&
			player.bounceTimer > 0) {
			//Bounce
			player.yVelocity = Math.max(
				player.yVelocityOnLastLand * -player.hiddenStats.bounceMultiplier,
				-(maxBounceHeight * player.statMultipliers[1])
			);
			//Creates the bounce effect
			jump.style.left = `${player.xPos / 20}vw`;
			jump.style.top = `${(windowheightRatio - 160) / 20}vw`;
			jump.setAttribute("data-timeSpawned", timeSinceStart);
			document.body.appendChild(jump.cloneNode(true));
		} else if (player.yPos < windowheightRatio - minDistanceFromFloor &&
			player.xPos === 2000 - minDistanceFromEdge) {
			//Right wall jump
			document.getElementById(`player${playerNum}`).style.transform = "scaleX(-1)";
			if (player.yVelocity < 10) {
				player.yVelocity = -(jumpHeight * player.statMultipliers[1]);
				player.xVelocity = -wallJumpSpeed;
			} else {
				player.xVelocity = -player.yVelocity;
			}
		} else if (player.yPos < windowheightRatio - minDistanceFromFloor &&
			player.xPos === minDistanceFromEdge - 192) {
			//Left wall jump
			document.getElementById(`player${playerNum}`).style.transform = null;
			if (player.yVelocity < 10) {
				player.yVelocity = -(jumpHeight * player.statMultipliers[1]);
				player.xVelocity = wallJumpSpeed;
			} else {
				player.xVelocity = player.yVelocity;
			}
		} else if (player.yPos === windowheightRatio - minDistanceFromFloor) {
			//Regular jump
			player.yVelocity = -(jumpHeight * player.statMultipliers[1]);
		} 
	}
}

// Process key events for dash action
function handleDash(player, playerNum) {
	if (!player.jumped && player.currentDashCooldown === 0 && player.health > 0 && 
		inRound && (playerNum === 1 || currentScreen === 3)) {
		player.yVelocity = 0;
		if (document.getElementById(`player${playerNum}`).style.transform === "scaleX(-1)") {
			player.xVelocity = -player.hiddenStats.dashDistance;
		} else {
			player.xVelocity = player.hiddenStats.dashDistance;
		}
		player.currentDashCooldown = player.hiddenStats.dashCooldown;
	}
}

//Pressing the jump keys
window.addEventListener("keydown", (event) => {
	if (event.keyCode === CONTROLS.player1.jump) {
		handleJump(player1, 1);
	} else if (event.keyCode === CONTROLS.player2.jump) {
		handleJump(player2, 2);
	} else if (event.keyCode === CONTROLS.player1.dash) {
		handleDash(player1, 1);
	} else if (event.keyCode === CONTROLS.player2.dash) {
		handleDash(player2, 2);
	}
});

window.addEventListener("keyup", (event) => {
	if (event.keyCode === CONTROLS.player1.jump) {
		player1.jumped = false;
	} else if (event.keyCode === CONTROLS.player2.jump) {
		player2.jumped = false;
	}
});

// Track which keys are currently pressed and save previous state
let keysCurrentlyPressed = {};

// Function to update key states in a more reliable way
function updateKeyState(keyCode, isPressed) {
	// Track in global key state
	keysCurrentlyPressed[keyCode] = isPressed;
	
	// Save previous state before updating
	player1.previousKeys[keyCode] = player1.keysPressed[keyCode];
	player2.previousKeys[keyCode] = player2.keysPressed[keyCode];
	
	// Update current state
	player1.keysPressed[keyCode] = isPressed;
	player2.keysPressed[keyCode] = isPressed;
	
	// Don't let browser handle key events for game controls to prevent unwanted behaviors
	if (isGameControl(keyCode) && inRound) {
		return false; // Prevents default browser actions like scrolling with arrow keys
	}
	return true;
}

// Check if a keyCode is used as a game control
function isGameControl(keyCode) {
	const controls = [...Object.values(CONTROLS.player1), ...Object.values(CONTROLS.player2)];
	return controls.includes(keyCode);
}

// Improved key event listeners with prevention of default behaviors
window.addEventListener("keydown", (event) => {
	// Register the keypress in our order tracking system
	registerKeyPress(event.keyCode);
	
	// Update key states
	const result = updateKeyState(event.keyCode, true);
	
	// Prevent default behavior for game controls
	if (!result && inRound) {
		event.preventDefault();
	}
});

window.addEventListener("keyup", (event) => {
	// Simply update key state for key up events
	updateKeyState(event.keyCode, false);
});

// To prevent lost inputs when switching browser tabs or windows
window.addEventListener("blur", () => {
	// Clear all pressed keys when window loses focus
	keysCurrentlyPressed = {};

	// Reset player key states
	Object.keys(player1.keysPressed).forEach(key => {
		player1.previousKeys[key] = player1.keysPressed[key];
		player1.keysPressed[key] = false;
	});
	
	Object.keys(player2.keysPressed).forEach(key => {
		player2.previousKeys[key] = player2.keysPressed[key];
		player2.keysPressed[key] = false;
	});
});

function damagePlayer(x) {
	if (x === 1) {
		player1.health = Math.max(
			player1.health -
				(Math.abs(player2.yVelocity - player1.yVelocity) *
					player2.statMultipliers[2]) /
					2,
			0,
		);
		document.getElementById("VSHealthBar1").style.width =
			`${player1.health / 2.5}%`;
	} else {
		player2.health = Math.max(
			player2.health -
				(Math.abs(player1.yVelocity - player2.yVelocity) *
					player1.statMultipliers[2]) /
					2,
			0,
		);
		document.getElementById("VSHealthBar2").style.width =
			`${player2.health / 2.5}%`;
	}
	if ((player1.health === 0 || player2.health === 0) && !roundFinished) {
		roundFinished = true;
		if (versusRound === 3) {
			setTimeout(endMatch, 3000);
		} else {
			setTimeout(() => {
				versusRound = Math.min(versusRound + 1, 3);
				startRound();
			}, 3000);
		}
	}
}

// Listener for secret character selection
window.addEventListener("keydown", (event) => {
	if (currentScreen === 2) { // Only on character select screen
		if (event.keyCode === 49) { // '1' key
			player1.dragonType = 4; // Assign secret character to P1
			console.log("Player 1 selected secret character");
			updateStats(1, player1.dragonType); // Update displayed stats (will show type 0)
			document.getElementById("selectedCharacter1").style.filter =
				`hue-rotate(${characterHues[0]}deg)`; // Ensure visual matches type 0
		} else if (event.keyCode === 50) { // '2' key
			player2.dragonType = 4; // Assign secret character to P2
			console.log("Player 2 selected secret character");
			updateStats(2, player2.dragonType); // Update displayed stats (will show type 0)
			document.getElementById("selectedCharacter2").style.filter =
				`hue-rotate(${characterHues[0]}deg)`; // Ensure visual matches type 0
		}
	}
});
