//All of this is really janky! It's taken and modified from the DodecaDragons render code

renderVars = {
    posX: 0,
    posY: 0,
    mousePosX: 0,
    mousePosY: 0,
    mouseIsDown: false,
    diffX: 0,
    diffY: 0,
    currentMousePos: [0, 0],
    zoomMultiplier: 2,
    lastRender: Date.now(),
    autoPanTime: 1500,
    isAutoPanning: false
  }
  
  inputVars = {
    keyInputX: 0,
    keyInputY: 0,
    keySpeedX: 0,
    keySpeedY: 0,
    keySpeedCap: 8,
    keySpeedDecel: 30,
    keyboardRenderPerSec: 72,
    keysHeld: {
      "w": false,
      "a": false,
      "s": false,
      "d": false,
      "ArrowUp": false,
      "ArrowLeft": false,
      "ArrowRight": false,
      "ArrowDown": false,
    },
    touchIsDown: false,
    lastTouch: null,
    currentTouchPos: [0, 0],
    touchPosX: 0,
    touchPosY: 0
  }
  
  arrowElements = {
    up: document.getElementById('arrowUp'), //caching reference to all the arrow elements
    down: document.getElementById('arrowDown'),
    left: document.getElementById('arrowLeft'),
    right: document.getElementById('arrowRight')
  }
  
  tabPositions = [];
  
  //Zoom stuff!
  //renderVars.posX = 0 - window.innerWidth / (renderVars.zoomMultiplier * 2)
  //renderVars.posY = 0 - window.innerHeight / (renderVars.zoomMultiplier * 2)
  //document.body.style.zoom = (renderVars.zoomMultiplier * 100) + "%"
  
  //this is executed on pageload to populate an array of tab data for better rendering
  function populateTabPositions() {
    let tabNames = Object.keys(tabData);
    let highestUnlock = 0;
    tabNames.forEach(tab => {highestUnlock = Math.max(highestUnlock, tabData[tab][2])});
    tabPositions.length = highestUnlock + 1;
    for (i=0;i<tabPositions.length;i++) {tabPositions[i] = {}};
    tabNames.forEach(tab => {
      tabPositions[tabData[tab][2]][tab] = [tabData[tab][0], tabData[tab][1]]
    })
  }
  
  /*
  function render(x, y) {
    for (i=0;i<game.unlocks;i++) {
      for (tab in tabPositions[i]) {
        let tabElement = document.getElementById("tab_" + tab);
        tabElement.style.left = (window.innerWidth / 2 + x + tabPositions[i][tab][0]) + "px"
        tabElement.style.top = (window.innerHeight / 2 + y + tabPositions[i][tab][1]) + "px"
      }
    }
    let dragonTab = document.getElementById("tab_dragon");
    dragonTabHeight = dragonTab.offsetHeight;
    dragonTab.style.left = (window.innerWidth / 2 + x) + "px";
    dragonTab.style.top = (window.innerHeight / 2 + y + 162 + dragonTabHeight/2) + "px";
    if (game.unlocks >= 6) document.getElementById("tab_magicUpgrades").style.top = (window.innerHeight / 2 + y - 130) + "px"
  }
  */
  
  
  //Sets the position of all the boxes based on the X and Y position variables
  //This is laggy!
  function render(x, y) {
    //Main tab
    document.getElementById("campaignLevelContainer").style.left = (window.innerWidth / 2 + x) + "px"
    document.getElementById("campaignLevelContainer").style.top = (window.innerHeight / 2 + y) + "px"
    document.getElementById("campaignScreen").style.backgroundPosition = (x / 4) + "px " + (y / 4) + "px"
    //console.log(Date.now() - renderVars.lastRender)
    renderVars.lastRender = Date.now();
  }
  
  render(renderVars.posX, renderVars.posY)
  
  //Automatically renders 10 times per second (there's probably a better way to do this)
  function renderAuto() {
    //render(renderVars.posX, renderVars.posY)
    render(renderVars.posX + renderVars.diffX, renderVars.posY + renderVars.diffY)
  }
  setInterval(renderAuto, 100)
  
  //Renders 72 times per second, but only if any movement keys are held
  function renderKeyboardPan() {
    updatePanKeySpeed();
    if (currentScreen == 4 && renderVars.mouseIsDown || (Math.abs(inputVars.keySpeedX) < 0.1 && Math.abs(inputVars.keySpeedY) < 0.1)) return;
    renderVars.posX = renderVars.posX + inputVars.keySpeedX;
    renderVars.posY = renderVars.posY + inputVars.keySpeedY;
    //console.log("rendering")
    render(renderVars.posX, renderVars.posY)
  }
  setInterval(renderKeyboardPan, 1000 / inputVars.keyboardRenderPerSec)
  
  //Sets currentMousePos when mouse goes down to compare position when the user drags
  function mouseDown(e) {
    if (currentScreen == 4 && renderVars.isAutoPanning || e.button !== 0) { return } //ensure we only respond to left clicks
    renderVars.currentMousePos[0] = [e.pageX]
    renderVars.currentMousePos[1] = [e.pageY]
    renderVars.mouseIsDown = true
    //resetPressedKeys();
  }
  
  //Resets variables for comparing position when mouse goes up
  function mouseUp(e) {
    renderVars.mouseIsDown = false
    renderVars.posX = renderVars.posX + renderVars.diffX
    renderVars.posY = renderVars.posY + renderVars.diffY
    renderVars.diffX = 0
    renderVars.diffY = 0
  }
  
  //Sets the position to x,y
  function posSet(x,y) {
    //Zoom stuff!
    //renderVars.posX = 0 - window.innerWidth / (renderVars.zoomMultiplier * 2)
    //renderVars.posY = 0 - window.innerHeight / (renderVars.zoomMultiplier * 2)
    renderVars.posX = x
    renderVars.posY = y
    render(renderVars.posX, renderVars.posY)
    resetPressedKeys(); //pressing home will reset all held keyboard keys in case of stuck keys
  }
  
  /*
  async function panTo(endX,endY) {
    renderVars.isAutoPanning = true;
    resetPressedKeys();
    let startTime = Date.now();
    let endTime = startTime + renderVars.autoPanTime;
    let startX = renderVars.posX;
    let startY = renderVars.posY;
    while(Date.now() < endTime) {
      renderVars.posX = lerp(startX, endX, (Date.now() - startTime) / renderVars.autoPanTime);
      renderVars.posY = lerp(startY, endY, (Date.now() - startTime) / renderVars.autoPanTime);
      render(renderVars.posX, renderVars.posY);
      await promiseDelay(20);
    }
    renderVars.isAutoPanning = false;
    renderVars.posX = endX;
    renderVars.posY = endY;
  }
  */
  
  //Does position checks every time the mouse moves (if it's held down)
  document.onmousemove = handleMouseMove;
  function handleMouseMove(event) {
    if (renderVars.isAutoPanning) return;
    event = event || window.event;
    renderVars.mousePosX = event.pageX
    renderVars.mousePosY = event.pageY
    if (currentScreen == 4 && renderVars.mouseIsDown) {
      //Zoom stuff!
      //renderVars.diffX = (event.pageX - renderVars.currentMousePos[0]) / renderVars.zoomMultiplier
      //renderVars.diffY = (event.pageY - renderVars.currentMousePos[1]) / renderVars.zoomMultiplier
      renderVars.diffX = event.pageX - renderVars.currentMousePos[0]
      renderVars.diffY = event.pageY - renderVars.currentMousePos[1]
      if (Date.now() - renderVars.lastRender >= 20 && Math.abs(renderVars.diffX) + Math.abs(renderVars.diffY) > 8) {
        render(renderVars.posX + renderVars.diffX, renderVars.posY + renderVars.diffY)
      }
      //if (renderVars.diffX > 8 || renderVars.diffY > 8 || renderVars.diffX < -8 || renderVars.diffY < -8) {
        //render(renderVars.posX + renderVars.diffX, renderVars.posY + renderVars.diffY)
      //}
    }
  }
  
  function processKeyDown(event) {
    if (event.repeat || renderVars.isAutoPanning) return; //holding a key down causes repeated keydown events. make sure we don't respond to duplicates.
    inputVars.keysHeld[event.key] = true;
    updatePanKeys();
  }
  
  function processKeyUp(event) {
    inputVars.keysHeld[event.key] = false;
    updatePanKeys();
  }
  
  function arrowClick(dir) {
    inputVars.keysHeld[dir] = true;
    updatePanKeys();
    clearTouch();
  }
  
  function arrowRelease(dir) {
    inputVars.keysHeld[dir] = false;
    updatePanKeys();
  }
  
  //Update the input values. Only needs to fire when keys are pressed or released.
  function updatePanKeys() {
    inputVars.keyInputX = inputVars.keysHeld["a"] + inputVars.keysHeld["ArrowLeft"] - inputVars.keysHeld["d"] - inputVars.keysHeld["ArrowRight"]
    inputVars.keyInputY = inputVars.keysHeld["w"] + inputVars.keysHeld["ArrowUp"] - inputVars.keysHeld["s"] - inputVars.keysHeld["ArrowDown"]
  }
  
  //process the speed for smooth panning when using keyboard
  function updatePanKeySpeed() {
    if (currentScreen == 4) {
      let effectiveDecel = inputVars.keySpeedDecel / inputVars.keyboardRenderPerSec;
      if (Math.sign(inputVars.keySpeedX) * Math.sign(inputVars.keyInputX) === -1) inputVars.keySpeedX = 0; // skip decel if opposite direction is pressed
      if (Math.sign(inputVars.keySpeedY) * Math.sign(inputVars.keyInputY) === -1) inputVars.keySpeedY = 0;
      if (inputVars.keyInputX === 0) {
        inputVars.keySpeedX -= Math.sign(inputVars.keySpeedX) * effectiveDecel;
        if (Math.abs(inputVars.keySpeedX) <= effectiveDecel) inputVars.keySpeedX = 0;
      } else {
        inputVars.keySpeedX = Math.sign(inputVars.keyInputX) * inputVars.keySpeedCap; // no accel, goes straight to max speed
      }
      if (inputVars.keyInputY === 0) {
        inputVars.keySpeedY -= Math.sign(inputVars.keySpeedY) * effectiveDecel;
        if (Math.abs(inputVars.keySpeedY) <= effectiveDecel) inputVars.keySpeedY = 0;
      } else {
        inputVars.keySpeedY = Math.sign(inputVars.keyInputY) * inputVars.keySpeedCap;
      }
      inputVars.keySpeedX = Math.round(inputVars.keySpeedX * inputVars.keyboardRenderPerSec) / inputVars.keyboardRenderPerSec; // avoiding precision errors (hopefully)
      inputVars.keySpeedX = Math.min(inputVars.keySpeedCap, Math.max(-inputVars.keySpeedCap, inputVars.keySpeedX)); // clamp between the speed caps
      inputVars.keySpeedY = Math.round(inputVars.keySpeedY * inputVars.keyboardRenderPerSec) / inputVars.keyboardRenderPerSec;
      inputVars.keySpeedY = Math.min(inputVars.keySpeedCap, Math.max(-inputVars.keySpeedCap, inputVars.keySpeedY));
    }
  }
  
  //reset all held keys. 
  function resetPressedKeys() {
    for (let key in inputVars.keysHeld) {
      inputVars.keysHeld[key] = false;
    }
    updatePanKeys();
  }
  
  function touchDown(event) {
    if (renderVars.isAutoPanning || !event.changedTouches || !event.changedTouches[0]) return //make sure the event data is proper
    if (inputVars.touchIsDown) clearTouch(); //if there's already an active touch, clear it
    let thisTouch = event.changedTouches[0]; //if multiple new touches registered on same event, arbitrarily choose first one in the list
    let shouldBreak = false;
    Object.keys(inputVars.keysHeld).forEach((k) => {
      if (inputVars.keysHeld[k] == true) shouldBreak = true;
    })
    if (shouldBreak) return;
    inputVars.lastTouch = thisTouch.identifier;
    inputVars.touchIsDown = true;
    inputVars.currentTouchPos[0] = [thisTouch.pageX];
    inputVars.currentTouchPos[1] = [thisTouch.pageY];
  }
  
  function touchMove(event) {
    if (renderVars.isAutoPanning) return;
    //need to iterate through and make sure one of the moved touches is the active touch
    for (let i = 0; i < event.changedTouches.length; i++) {
      if (event.changedTouches[i].identifier === inputVars.lastTouch) {
        let thisTouch = event.changedTouches[i];
        renderVars.touchPosX = thisTouch.pageX
        renderVars.touchPosY = thisTouch.pageY
        if (inputVars.touchIsDown) {
          renderVars.diffX = thisTouch.pageX - inputVars.currentTouchPos[0]
          renderVars.diffY = thisTouch.pageY - inputVars.currentTouchPos[1]
          //if (Math.abs(renderVars.diffX) + Math.abs(renderVars.diffY) > 8) {
          if (Date.now() - renderVars.lastRender >= 8 && Math.abs(renderVars.diffX) + Math.abs(renderVars.diffY) > 8) {
            render(renderVars.posX + renderVars.diffX, renderVars.posY + renderVars.diffY)
          }
        }
      }
    }
  }
  
  function touchUp(event) {
    for (let i = 0; i < event.changedTouches.length; i++) {
      if (event.changedTouches[i].identifier === inputVars.lastTouch) {
        clearTouch();
      }
    }
    resetPressedKeys();
  }
  
  function clearTouch() {
    inputVars.touchIsDown = false;
    inputVars.lastTouch = null;
    renderVars.posX = renderVars.posX + renderVars.diffX
    renderVars.posY = renderVars.posY + renderVars.diffY
    renderVars.diffX = 0
    renderVars.diffY = 0
  }
  
  function mobileDebug(inputString) {
    document.getElementById("devinfo").innerHTML=inputString;
  }
  
  document.body.addEventListener('mouseenter', (e) => {
    if (e.buttons % 2 === 0) mouseUp(); //this is to cover special case where user clicks to drag and releases click outside of frame
  })
  
  //document.body.addEventListener('mouseleave', (e) => {
    //if (e.target && e.target.classList && e.target.classList.contains('achievement')) {
      //showAchievementInfo(null,null)
    //}
  //})
  
  
  
  //general event listeners, mostly for panning controls
  document.body.addEventListener('mousedown', (e) => { mouseDown(e) });
  document.body.addEventListener('mouseup', (e) => { mouseUp(e) });
  
  document.addEventListener('keydown', (event) => { processKeyDown(event) });
  document.addEventListener('keyup', (event) => { processKeyUp(event) });
  
  //addEventListener('wheel', (event) => {console.log(event.deltaY)});