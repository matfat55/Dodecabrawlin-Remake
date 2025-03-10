const CONFIG = {
  movementSpeed: 3.3,
  horizontalDrag: 1,
  jumpHeight: 17,
  maxBounceHeight: 26,
  gravity: 1,
  wallJumpSpeed: 30,
  maxFallingSpeed: 35,
  minDistanceFromEdge: 140,
  minDistanceFromFloor: 160,
  minAfterImageSpeed: 30,
  characterHues: [0, 55, 230, 120],
  statMultipliersList: [
    [1.24, 1.3, 0.95],
    [1.4, 1.2, 0.8],
    [1.16, 1.4, 0.95],
    [1.08, 1.3, 1.25]
  ]
};

const SCREENS = {
  MAIN_TITLE: 1,
  CHARACTER_SELECT: 2,
  VS_MODE_GAMEPLAY: 3,
  CAMPAIGN_LEVEL_SELECT: 4,
  CAMPAIGN_MODE_GAMEPLAY: 5
};

const ELEMENTS = {
  titleBubble: createElement("div", "titleBubble"),
  pow: createElement("div", "pow"),
  jump: createElement("div", "jump"),
  afterImage1: createElement("div", "afterImage1"),
  afterImage2: createElement("div", "afterImage2")
};

let currentScreen = SCREENS.MAIN_TITLE;
let timeSinceStart = 0;
let versusRound = 1;
let inRound = false;
let roundFinished = false;
let levelScrollSpeed = 0;
let backgroundPosition = 0;

const campaignStats = {
  level: 1
};

const player1 = createPlayer(0, (2000 - CONFIG.minDistanceFromEdge) * (1 / 3));
const player2 = createPlayer(0, (2000 - CONFIG.minDistanceFromEdge) * (2 / 3));

fetch("/levelData.json")
  .then(response => response.json())
  .then(data => levels = data.levels);

setCharacterBoxColors();

function createElement(tag, className) {
  const element = document.createElement(tag);
  element.classList.add(className);
  return element;
}

function createPlayer(dragonType, xPos) {
  return {
    dragonType,
    health: 100,
    statMultipliers: [1, 1, 1],
    hitCooldown: 0,
    dashCooldown: 0,
    bounceTimer: 0,
    xPos,
    yPos: windowheightRatio - CONFIG.minDistanceFromFloor,
    xVelocity: 0,
    yVelocity: 0,
    yVelocityOnLastLand: 0,
    keysPressed: [],
    jumped: false
  };
}

function setCharacterBoxColors() {
  const characterBoxes = document.getElementsByClassName("characterBox");
  for (let i = 1; i <= 3; i++) {
    characterBoxes[i].style.filter = `hue-rotate(${CONFIG.characterHues[i]}deg)`;
    characterBoxes[i + 4].style.filter = `hue-rotate(${CONFIG.characterHues[i]}deg)`;
  }
}

function toScreen(screen) {
  document.getElementById("transitionCover1").style.top = "0%";
  document.getElementById("transitionCover2").style.bottom = "0%";
  setTimeout(() => {
    switch (screen) {
      case SCREENS.MAIN_TITLE:
        currentScreen = SCREENS.MAIN_TITLE;
        showElement("titleScreen");
        hideElement("selectScreen");
        hideElement("campaignScreen");
        break;
      case SCREENS.CHARACTER_SELECT:
        currentScreen = SCREENS.CHARACTER_SELECT;
        hideElement("titleScreen");
        showElement("selectScreen");
        hideElement("campaignScreen");
        break;
      case SCREENS.CAMPAIGN_LEVEL_SELECT:
        currentScreen = SCREENS.CAMPAIGN_LEVEL_SELECT;
        hideElement("titleScreen");
        hideElement("selectScreen");
        showElement("campaignScreen");
        document.getElementById("campaignLevelInfoContainer").style.right = "-17vw";
        break;
    }
    setTimeout(hideTransitionCover, 1200);
  }, 750);
}

function showElement(id) {
  document.getElementById(id).style.display = "block";
}

function hideElement(id) {
  document.getElementById(id).style.display = "none";
}

function showControls() {
  const controlsCover = document.getElementById("controlsCover");
  controlsCover.style.display = "block";
  setTimeout(() => controlsCover.style.opacity = "1", 50);
}

function hideControls() {
  const controlsCover = document.getElementById("controlsCover");
  controlsCover.style.opacity = "0";
  setTimeout(() => controlsCover.style.display = "none", 1000);
}

function showLevelInfo() {
  document.getElementById("campaignLevelInfoContainer").style.right = "0";
}

function updateStats(player, type) {
  const statBars = document.getElementsByClassName(`character${player}StatBar`);
  const stats = CONFIG.statMultipliersList[type];
  statBars[0].style.width = `${stats[0] * 100}%`;
  statBars[1].style.width = `${stats[1] * 100}%`;
  statBars[2].style.width = `${stats[2] * 100}%`;
}

updateStats(1, 0);
updateStats(2, 0);

function startLevel() {
  fetch("/levelData.json")
    .then(response => response.json())
    .then(data => levelName = data.levels[0][0]);
  document.getElementById("levelNameMessage").style.opacity = "1";
  player1.statMultipliers = CONFIG.statMultipliersList[player1.dragonType];
  levelScrollSpeed = 4;
  document.getElementById("player2").style.display = "none";
  document.getElementById("transitionCover1").style.top = "0%";
  document.getElementById("transitionCover2").style.bottom = "0%";
  setTimeout(() => {
    currentScreen = SCREENS.CAMPAIGN_MODE_GAMEPLAY;
    hideElement("campaignScreen");
    hideElement("VSHealthBarBack");
  }, 750);
  setTimeout(() => {
    document.getElementById("transitionCover1").style.top = "-52%";
    document.getElementById("transitionCover2").style.bottom = "-52%";
    inRound = true;
  }, 1200);
  setTimeout(renderLevelName, 1400, 0);
}

function renderLevelName(x) {
  if (x < (levelName.length + 10) * 3) {
    let levelNameString = "";
    for (let i = 0; i < levelName.length; i++) {
      if (x / 3 > i + 4) levelNameString += levelName[i];
      else if (x / 3 > i) levelNameString += (Math.floor(Math.random() * 26 + 10)).toString(36);
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
  player1.statMultipliers = CONFIG.statMultipliersList[player1.dragonType];
  player2.statMultipliers = CONFIG.statMultipliersList[player2.dragonType];
  document.getElementById("player2").style.display = "block";
  document.getElementById("player1").style.filter = `hue-rotate(${CONFIG.characterHues[player1.dragonType]}deg)`;
  document.getElementById("VSHealthBar1").style.filter = `hue-rotate(${CONFIG.characterHues[player1.dragonType]}deg)`;
  document.getElementById("player2").style.filter = `hue-rotate(${CONFIG.characterHues[player2.dragonType]}deg)`;
  document.getElementById("VSHealthBar2").style.filter = `hue-rotate(${CONFIG.characterHues[player2.dragonType]}deg)`;
  document.getElementById("transitionCover1").style.top = "0%";
  document.getElementById("transitionCover2").style.bottom = "0%";
  setTimeout(() => {
    currentScreen = SCREENS.VS_MODE_GAMEPLAY;
    hideElement("selectScreen");
    showElement("VSHealthBarBack");
  }, 750);
  setTimeout(startRound, 1200);
}

function startRound() {
  document.getElementById("transitionCover1").style.top = "-52%";
  document.getElementById("transitionCover2").style.bottom = "-52%";
  document.getElementById("readyMessage").style.backgroundImage = "url('img/Ready.png')";
  document.getElementById("readyMessage").style.top = "50%";
  player1.health = 100;
  player2.health = 100;
  document.getElementById("VSHealthBar1").style.width = `${player1.health / 2.5}%`;
  document.getElementById("VSHealthBar2").style.width = `${player2.health / 2.5}%`;
  resetPlayerPosition(player1, (2000 - CONFIG.minDistanceFromEdge) * (1 / 3));
  resetPlayerPosition(player2, (2000 - CONFIG.minDistanceFromEdge) * (2 / 3));
  setRoundText();
  roundFinished = false;
  inRound = false;
  setTimeout(() => {
    document.getElementById("readyMessage").style.backgroundImage = "url('img/Go.png')";
    document.getElementById("readyMessage").style.top = "-300px";
    inRound = true;
  }, 2000);
}

function resetPlayerPosition(player, xPos) {
  player.xVelocity = 0;
  player.yVelocity = 0;
  player.xPos = xPos;
  player.yPos = windowheightRatio - CONFIG.minDistanceFromFloor;
  document.getElementById(`player${player === player1 ? 1 : 2}`).style.transform = player === player1 ? null : "scaleX(-1)";
}

function setRoundText() {
  const roundText = document.getElementById("VSRoundText");
  switch (versusRound) {
    case 1:
      roundText.innerHTML = "Round 1";
      roundText.style.color = "#ccf";
      roundText.style.textShadow = "0.2vw 0.2vw #66a";
      break;
    case 2:
      roundText.innerHTML = "Round 2";
      roundText.style.color = "#fec";
      roundText.style.textShadow = "0.2vw 0.2vw #a86";
      break;
    case 3:
      roundText.innerHTML = "Round 3";
      roundText.style.color = "#cfc";
      roundText.style.textShadow = "0.2vw 0.2vw #6a6";
      break;
  }
}

function endMatch() {
  document.getElementById("transitionCover1").style.top = "0%";
  document.getElementById("transitionCover2").style.bottom = "0%";
  setTimeout(() => {
    currentScreen = SCREENS.CHARACTER_SELECT;
    showElement("selectScreen");
  }, 750);
  setTimeout(hideTransitionCover, 1200);
}

function hideTransitionCover() {
  document.getElementById("transitionCover1").style.top = "-52%";
  document.getElementById("transitionCover2").style.bottom = "-52%";
}

document.addEventListener('mousemove', logKey);

function logKey(e) {
  if (currentScreen === SCREENS.MAIN_TITLE) {
    const xOffset = (e.clientX / window.innerWidth * 10);
    const yOffset = (e.clientY / window.innerHeight * 10);
    document.getElementById("menuButton1").style.left = `${45 + xOffset}%`;
    document.getElementById("menuButton1").style.top = `${37 + yOffset}%`;
    document.getElementById("menuButton2").style.left = `${45 + xOffset}%`;
    document.getElementById("menuButton2").style.top = `${55 + yOffset}%`;
    document.getElementById("menuButton3").style.left = `${45 + xOffset}%`;
    document.getElementById("menuButton3").style.top = `${73 + yOffset}%`;
  }
}

document.getElementById("menuButton1Back").style.left = "50%";
document.getElementById("menuButton1Back").style.top = "42%";
document.getElementById("menuButton2Back").style.left = "50%";
document.getElementById("menuButton2Back").style.top = "60%";
document.getElementById("menuButton3Back").style.left = "50%";
document.getElementById("menuButton3Back").style.top = "78%";

function update() {
  windowheightRatio = 2000 / window.innerWidth * window.innerHeight;
  timeSinceStart += 15;

  if (currentScreen === SCREENS.MAIN_TITLE) {
    updateTitleScreen();
  }

  if (currentScreen === SCREENS.CHARACTER_SELECT) {
    updateCharacterSelectScreen();
  }

  if (currentScreen === SCREENS.CAMPAIGN_MODE_GAMEPLAY && inRound) {
    backgroundPosition -= levelScrollSpeed;
  }
  document.getElementById("backgroundOverlay").style.backgroundPosition = `${backgroundPosition}px 0px`;

  removeOldElements("pow", 150);
  removeOldElements("jump", 150);
  removeOldElements("afterImage1", 150);
  removeOldElements("afterImage2", 150);

  handlePlayerMovement(player1, 65, 68);
  handlePlayerMovement(player2, 74, 76);

  updateCooldowns(player1);
  updateCooldowns(player2);

  updatePlayerPosition(player1);
  updatePlayerPosition(player2);

  handlePlayerDamage(player1, player2);
  handlePlayerDamage(player2, player1);

  if (currentScreen === SCREENS.VS_MODE_GAMEPLAY || currentScreen === SCREENS.CAMPAIGN_MODE_GAMEPLAY) {
    updatePlayerElements(player1, 1);
    updatePlayerElements(player2, 2);
    updateWinState();
  }
}

function updateTitleScreen() {
  document.getElementById("titleText").style.top = `${Math.sin(timeSinceStart / 500) / 2 + 1.5}vw`;
  updateButtonBackgrounds();
  handleTitleScreenBubbles();
}

function updateButtonBackgrounds() {
  updateButtonBackground("menuButton1", "menuButton1Back");
  updateButtonBackground("menuButton2", "menuButton2Back");
  updateButtonBackground("menuButton3", "menuButton3Back");
}

function updateButtonBackground(buttonId, backgroundId) {
  const button = document.getElementById(buttonId);
  const background = document.getElementById(backgroundId);
  background.style.left = `${(parseFloat(background.style.left) - parseFloat(button.style.left)) / 1.1 + parseFloat(button.style.left)}%`;
  background.style.top = `${(parseFloat(background.style.top) - parseFloat(button.style.top)) / 1.1 + parseFloat(button.style.top)}%`;
}

function handleTitleScreenBubbles() {
  const bubbles = document.getElementsByClassName("titleBubble");
  for (let i = 0; i < bubbles.length; i++) {
    const bubble = bubbles[i];
    bubble.style.top = `${parseFloat(bubble.style.top) - 0.3}%`;
    bubble.style.opacity = `${parseFloat(bubble.style.opacity) - 0.007}`;
    bubble.style.left = `${parseFloat(bubble.style.left) - parseFloat(bubble.dataset.xvelocity)}%`;
    if (parseFloat(bubble.style.opacity) <= 0) {
      bubble.remove();
      i--;
    }
  }
  if (Math.floor(Math.random() * 20) === 0) {
    createTitleScreenBubble();
  }
}

function createTitleScreenBubble() {
  const bubble = ELEMENTS.titleBubble.cloneNode(true);
  bubble.style.left = `${Math.random() * 110 - 10}%`;
  const size = Math.random() * 25 + 5;
  bubble.style.width = `${size}vh`;
  bubble.style.height = `${size}vh`;
  bubble.style.top = "100%";
  bubble.style.opacity = "1";
  bubble.setAttribute("data-xvelocity", Math.random() / 5 - 0.1);
  document.getElementById("titleScreen").appendChild(bubble);
}

function updateCharacterSelectScreen() {
  document.getElementById("selectScreen").style.backgroundPosition = `${-timeSinceStart / 500}vw ${-timeSinceStart / 500}vw`;
  document.getElementById("characterSelectText").style.top = `${Math.sin(timeSinceStart / 500) / 2 + 1.5}vw`;
  document.getElementById("selectedCharacter1").style.filter = `hue-rotate(${CONFIG.characterHues[player1.dragonType]}deg)`;
  document.getElementById("selectedCharacter2").style.filter = `hue-rotate(${CONFIG.characterHues[player2.dragonType]}deg)`;
}

function removeOldElements(className, lifespan) {
  const elements = document.getElementsByClassName(className);
  for (let i = 0; i < elements.length; i++) {
    if (timeSinceStart > parseInt(elements[i].dataset.timespawned) + lifespan) {
      elements[i].remove();
      i--;
    }
  }
}

function handlePlayerMovement(player, leftKey, rightKey) {
  if (player.keysPressed[leftKey] && player.health > 0 && inRound) {
    document.getElementById(`player${player === player1 ? 1 : 2}`).style.transform = "scaleX(-1)";
    if (player.xVelocity > (CONFIG.movementSpeed * player.statMultipliers[0]) * -5) {
      player.xVelocity = player.xVelocity * 0.8 - (CONFIG.movementSpeed * player.statMultipliers[0]);
    }
  }
  if (player.keysPressed[rightKey] && player.health > 0 && inRound) {
    document.getElementById(`player${player === player1 ? 1 : 2}`).style.transform = null;
    if (player.xVelocity < (CONFIG.movementSpeed * player.statMultipliers[0]) * 5) {
      player.xVelocity = player.xVelocity * 0.8 + (CONFIG.movementSpeed * player.statMultipliers[0]);
    }
  }
}

function updateCooldowns(player) {
  if (player.hitCooldown > 0) player.hitCooldown--;
  if (player.dashCooldown > 0) player.dashCooldown--;
  if (player.bounceTimer > 0) player.bounceTimer--;
}

function updatePlayerPosition(player) {
  player.xPos += player.xVelocity;
  if (currentScreen === SCREENS.CAMPAIGN_MODE_GAMEPLAY && inRound) player.xPos -= levelScrollSpeed;
  if (currentScreen === SCREENS.VS_MODE_GAMEPLAY && player.xPos > 2000 - CONFIG.minDistanceFromEdge) {
    player.xPos = 2000 - CONFIG.minDistanceFromEdge;
    player.xVelocity = 0;
  }
  if (currentScreen === SCREENS.VS_MODE_GAMEPLAY && player.xPos < CONFIG.minDistanceFromEdge - 192) {
    player.xPos = CONFIG.minDistanceFromEdge - 192;
    player.xVelocity = 0;
  }

  player.yPos += player.yVelocity;
  if (player.yPos > windowheightRatio - CONFIG.minDistanceFromFloor) {
    player.yPos = windowheightRatio - CONFIG.minDistanceFromFloor;
    player.yVelocityOnLastLand = player.yVelocity;
    player.yVelocity = 0;
    player.bounceTimer = 4;
  }
  if (player.yPos < 0) {
    player.yPos = 0;
    player.yVelocity = 0;
  }

  player.yVelocity = Math.round(player.yVelocity / CONFIG.gravity) * CONFIG.gravity;
  if (player.yPos < windowheightRatio - CONFIG.minDistanceFromFloor) {
    player.yVelocity = Math.min(player.yVelocity + CONFIG.gravity, CONFIG.maxFallingSpeed);
  }

  if (player.yPos === windowheightRatio - CONFIG.minDistanceFromFloor) {
    player.xVelocity = Math.round(player.xVelocity / CONFIG.horizontalDrag) * CONFIG.horizontalDrag;
    if (player.xVelocity > 0) player.xVelocity -= CONFIG.horizontalDrag;
    if (player.xVelocity < 0) player.xVelocity += CONFIG.horizontalDrag;
  } else {
    player.xVelocity = Math.round(player.xVelocity / (CONFIG.horizontalDrag / 2)) * (CONFIG.horizontalDrag / 2);
    if (player.xVelocity > 0) player.xVelocity -= (CONFIG.horizontalDrag / 2);
    if (player.xVelocity < 0) player.xVelocity += (CONFIG.horizontalDrag / 2);
  }
}

function handlePlayerDamage(player, opponent) {
  if (player.xPos > (opponent.xPos - 96) && player.xPos < (opponent.xPos + 96) &&
    player.yPos > (opponent.yPos - 128) && player.yPos < (opponent.yPos - 128 + (player.yVelocity - opponent.yVelocity)) &&
    player.yVelocity > (opponent.yVelocity + 4) && !opponent.hitCooldown && opponent.health > 0 && currentScreen === SCREENS.VS_MODE_GAMEPLAY) {
    opponent.hitCooldown = 50;
    player.yVelocity = player.yVelocity * -0.7;
    opponent.yVelocity = Math.max(opponent.yVelocity, 5);
    damagePlayer(opponent === player1 ? 1 : 2);
    createPowEffect(opponent);
  }
}

function createPowEffect(player) {
  const pow = ELEMENTS.pow.cloneNode(true);
  pow.style.left = `${player.xPos / 20}vw`;
  pow.style.top = `${player.yPos / 20}vw`;
  pow.setAttribute("data-timeSpawned", timeSinceStart);
  document.body.appendChild(pow);
}

function updatePlayerElements(player, playerNumber) {
  const playerElement = document.getElementById(`player${playerNumber}`);
  playerElement.style.left = `${player.xPos / 20}vw`;
  playerElement.style.top = `${player.yPos / 20}vw`;

  document.getElementById(`VSHitCooldown${playerNumber}`).style.height = `${player.hitCooldown}px`;

  if (player.health === 0) {
    playerElement.style.backgroundImage = "url('img/7OrangeDED.gif')";
  } else if (player.hitCooldown > 30) {
    playerElement.style.backgroundImage = "url('img/6OrangeOuch.png')";
  } else if (player.yVelocity < -2) {
    playerElement.style.backgroundImage = "url('img/4OrangeUp.png')";
  } else if (player.yVelocity > 2) {
    playerElement.style.backgroundImage = "url('img/5OrangeDown.png')";
  } else if (player.xVelocity !== 0) {
    playerElement.style.backgroundImage = "url('img/1OrangeRun.gif')";
  } else {
    playerElement.style.backgroundImage = "url('img/0OrangeStand.gif')";
  }

  const totalVelocity = Math.sqrt(player.xVelocity ** 2 + player.yVelocity ** 2);
  if (totalVelocity > CONFIG.minAfterImageSpeed) {
    createAfterImage(player, playerNumber);
  }
}

function createAfterImage(player, playerNumber) {
  const afterImage = ELEMENTS[`afterImage${playerNumber}`].cloneNode(true);
  afterImage.style.left = `${player.xPos / 20}vw`;
  afterImage.style.top = `${player.yPos / 20}vw`;
  afterImage.style.filter = `hue-rotate(${CONFIG.characterHues[player.dragonType]}deg)`;
  afterImage.style.transform = document.getElementById(`player${playerNumber}`).style.transform;
  afterImage.setAttribute("data-timeSpawned", timeSinceStart);
  afterImage.style.backgroundImage = document.getElementById(`player${playerNumber}`).style.backgroundImage;
  document.body.appendChild(afterImage);
}

function updateWinState() {
  if (player1.health === 0 || player2.health === 0) {
    document.getElementById("winMessage").style.top = `${Math.sin(timeSinceStart / 300) * 6 + 50}%`;
    document.getElementById("winMessageShadow").style.top = `${Math.sin((timeSinceStart - 100) / 300) * 6 + 50}%`;
    document.getElementById("winMessageShadow2").style.top = `${Math.sin((timeSinceStart - 200) / 300) * 6 + 50}%`;
    document.getElementById("winMessage2").style.top = `calc(${Math.sin((timeSinceStart - 50) / 300) * 6 + 50}% + 150px)`;
    document.getElementById("winMessage2").style.backgroundImage = player2.health === 0 ? "url('img/Player1Wins.png')" : "url('img/Player2Wins.png')";
  } else {
    document.getElementById("winMessage").style.top = "-100px";
    document.getElementById("winMessageShadow").style.top = "-100px";
    document.getElementById("winMessageShadow2").style.top = "-100px";
    document.getElementById("winMessage2").style.top = "calc(100% + 180px)";
  }
}

setInterval(update, 15);

window.addEventListener("keydown", (event) => {
  if (event.isComposing || event.keyCode === 87) {
    handleJump(player1);
  }
  return;
});

window.addEventListener("keyup", (event) => {
  if (event.isComposing || event.keyCode === 87) {
    player1.jumped = false;
  }
  return;
});

window.addEventListener("keydown", (event) => {
  if (event.isComposing || event.keyCode === 73) {
    handleJump(player2);
  }
  return;
});

window.addEventListener("keyup", (event) => {
  if (event.isComposing || event.keyCode === 73) {
    player2.jumped = false;
  }
  return;
});

function handleJump(player) {
  if (!player.jumped && player.health > 0 && inRound && (player === player1 || currentScreen === SCREENS.VS_MODE_GAMEPLAY)) {
    player.jumped = true;
    if (player.yPos === windowheightRatio - CONFIG.minDistanceFromFloor && player.hitCooldown === 0 && player.bounceTimer > 0) {
      player.yVelocity = Math.max(player.yVelocityOnLastLand * -1.3, -(CONFIG.maxBounceHeight * player.statMultipliers[1]));
      createJumpEffect(player);
    } else if (player.yPos < windowheightRatio - CONFIG.minDistanceFromFloor && player.xPos === 2000 - CONFIG.minDistanceFromEdge) {
      document.getElementById(`player${player === player1 ? 1 : 2}`).style.transform = "scaleX(-1)";
      if (player.yVelocity < 10) {
        player.yVelocity = -(CONFIG.jumpHeight * player.statMultipliers[1]);
        player.xVelocity = -CONFIG.wallJumpSpeed;
      } else {
        player.xVelocity = -player.yVelocity;
      }
    } else if (player.yPos < windowheightRatio - CONFIG.minDistanceFromFloor && player.xPos === CONFIG.minDistanceFromEdge - 192) {
      document.getElementById(`player${player === player1 ? 1 : 2}`).style.transform = null;
      if (player.yVelocity < 10) {
        player.yVelocity = -(CONFIG.jumpHeight * player.statMultipliers[1]);
        player.xVelocity = CONFIG.wallJumpSpeed;
      } else {
        player.xVelocity = player.yVelocity;
      }
    } else if (player.yPos === windowheightRatio - CONFIG.minDistanceFromFloor) {
      player.yVelocity = -(CONFIG.jumpHeight * player.statMultipliers[1]);
    }
  }
}

function createJumpEffect(player) {
  const jump = ELEMENTS.jump.cloneNode(true);
  jump.style.left = `${player.xPos / 20}vw`;
  jump.style.top = `${(windowheightRatio - CONFIG.minDistanceFromFloor) / 20}vw`;
  jump.setAttribute("data-timeSpawned", timeSinceStart);
  document.body.appendChild(jump);
}

window.addEventListener("keydown", (event) => {
  if (event.isComposing || event.keyCode === 16) {
    handleDash(player1);
  }
  return;
});

window.addEventListener("keydown", (event) => {
  if (event.isComposing || event.keyCode === 66) {
    handleDash(player2);
  }
  return;
});

function handleDash(player) {
  if (!player.jumped && player.dashCooldown === 0 && player.health > 0 && inRound && (player === player1 || currentScreen === SCREENS.VS_MODE_GAMEPLAY)) {
    player.yVelocity = 0;
    player.xVelocity = document.getElementById(`player${player === player1 ? 1 : 2}`).style.transform === "scaleX(-1)" ? -35 : 35;
    player.dashCooldown = 50;
  }
}

window.addEventListener("keydown", (event) => {
  player1.keysPressed[event.keyCode] = true;
  player2.keysPressed[event.keyCode] = true;
});

window.addEventListener("keyup", (event) => {
  player1.keysPressed[event.keyCode] = false;
  player2.keysPressed[event.keyCode] = false;
});

function damagePlayer(playerNumber) {
  const player = playerNumber === 1 ? player1 : player2;
  const opponent = playerNumber === 1 ? player2 : player1;
  player.health = Math.max(player.health - Math.abs(opponent.yVelocity - player.yVelocity) * opponent.statMultipliers[2] / 2, 0);
  document.getElementById(`VSHealthBar${playerNumber}`).style.width = `${player.health / 2.5}%`;
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
