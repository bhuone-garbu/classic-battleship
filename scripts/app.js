
// CSS global class name constants
const CSS_GRID_HOVER = 'grid-hightlight'
const CSS_GRID_SELECT = 'grid-select'
const CSS_GRID_ATTACKED = 'grid-attacked'
const CSS_GRID_MISSED = 'grid-missed'

const CSS_FLEET_PREDEPLOY = 'predeploy'
const CSS_FLEET_SELECT = 'fleet-select'
const CSS_FLEET_DEPLOYED = 'deployed'

let AXIS = 'H' // 'V'

const DEBUG = true

let currentPlayingAudio
const muteSound = false

// initial fleet name as key and value as the size of the fleet - size as in the nuber of cells it takes on the grid
// ths does not mean that all these fleets will be used
const FLEET_SIZE_INFO = {
  destroyer: 5,
  battleship: 4,
  carrier: 3,
  patrol: 3,
  submarine: 2
}

function switchAxis() {
  AXIS = AXIS === 'H' ? 'V' : 'H' // this just flips the axis
  const axisSpan = document.querySelector('.player-container .screen span')
  axisSpan.innerHTML = AXIS === 'H' ? 'Horizontal' : 'Vertical'
}

function playSoundById(audioId) {

  if (!muteSound){
    if (currentPlayingAudio && currentPlayingAudio.Id !== 'fleetSelect') {
      currentPlayingAudio.currentTime = 0
      currentPlayingAudio.pause()
    }
  
    currentPlayingAudio = document.getElementById(audioId)
    currentPlayingAudio.play()
  }

}

// utility functions for returning x and y coordinate from index and vice versa
function getXYCoordinatesFromIndex(gridIndex, boardWidth){
  return [gridIndex % boardWidth, Math.floor(gridIndex / boardWidth)]
}

function getIndexFromXYCoordinates(x, y, boardWidth){
  return y * boardWidth + x
}

// We always want to return valid coordinates no matter what the size of the ship and no matter where the users hovers or clicks on the grid
function calcRelativeCoordinates(currentDivIndex, boardWidth, shipSize){

  const xyCoord = getXYCoordinatesFromIndex(currentDivIndex, boardWidth)

  const arrayWidth = boardWidth
  const horizontal = AXIS === 'H'

  // calculate the how "off" the coordinate is given we take the size of the ship into account
  const offset = horizontal ? arrayWidth - (xyCoord[0] + shipSize) : arrayWidth - (xyCoord[1] + shipSize)

  // the idea is to return back the current xyCoord if we are okay else reset back to the last coordinate using the offset
  let currentCoords
  if (horizontal) {
    currentCoords = offset < 0 ? [xyCoord[0] - Math.abs(offset), xyCoord[1]] : xyCoord
  } else {
    currentCoords = offset < 0 ? [xyCoord[0], xyCoord[1] - Math.abs(offset)] : xyCoord
  }

  const indexCoordinates = []

  for (let i = 0; i < shipSize; i++) {
    const calculatedCoordinates = []
    if (AXIS === 'H') {
      // these are x,y coordinates
      calculatedCoordinates.push(currentCoords[0] + i)
      calculatedCoordinates.push(currentCoords[1])
    } else {
      calculatedCoordinates.push(currentCoords[0])
      calculatedCoordinates.push(currentCoords[1] + i)
    }
    const arrayIndex = getIndexFromXYCoordinates(calculatedCoordinates[0], calculatedCoordinates[1], boardWidth)
    indexCoordinates.push(arrayIndex)
  }

  return indexCoordinates
}

// we want to create an array of adjacent coordinates from 'previousAttackCoordinates' that are in 'filterCoordinates'
function buildAdjacentCoordinates(previousAttackCoordinates, filterCoordinates){

  // try horizontal first
  const filtered = previousAttackCoordinates.filter(function(index) {
    return !filterCoordinates || !filterCoordinates.includes(index)
  })

  const pivotIndexCoord = getIndexFromXYCoordinates(filtered[0])

  const horizontal = filtered.filter(function(index){
    return getIndexFromXYCoordinates(index)[1] === pivotIndexCoord[1]
  })

  if (horizontal.length > 1){
    horizontal.sort(function(a,b){
      return a - b
    })
    return horizontal
  }

  const vertical = filtered.filter(function(index) {
    return getIndexFromXYCoordinates(index)[0] === pivotIndexCoord[0]
  })

  if (vertical.length > 1){
    vertical.sort(function(a,b) {
      return a - b
    })
    return vertical
  }

  return filtered.length === 1 ? filtered : []

}

// We want to list all the possible direction from the current pivot index where attack coordinate is valid
// this is helpful for bot to tell which direction from the current index is attackable
// TODO: tidy up the code
function listPossibleDirection(pivotIndex, usedUpCoordinates, boardWidth, attackAxis){

  if (!usedUpCoordinates) usedUpCoordinates = [] // initializes as empty array if empty - safety net!
  const xyCoordinate = getXYCoordinatesFromIndex(pivotIndex, boardWidth)
  
  // calculate all the possible neighbour coordinates that possible taking account of the attackAxis
  const filtered = ['N', 'S', 'E', 'W'].filter(function(key){
    if (!attackAxis){
      return true
    } else {
      if (attackAxis === 'V') return key === 'N' || key === 'S'
      else return key === 'E' || key === 'W'
    }
  })

  // we need to further check if the coordinate has already been used and within the board size
  return filtered.reduce(function(acc, key){
    switch (key){
      case 'N':
        if (xyCoordinate[0] === getXYCoordinatesFromIndex(pivotIndex - boardWidth, boardWidth)[0]){
          const coordinate = pivotIndex - boardWidth
          if (!usedUpCoordinates.includes(coordinate) && coordinate >= 0 && coordinate < boardWidth ** 2) acc[key] = coordinate
        }
        break
      case 'S':
        if (xyCoordinate[0] === getXYCoordinatesFromIndex(pivotIndex + boardWidth, boardWidth)[0]){
          const coordinate = pivotIndex + boardWidth
          if (!usedUpCoordinates.includes(coordinate) && coordinate >= 0 && coordinate < boardWidth ** 2) acc[key] = coordinate
        }
        break
      case 'E':
        if (xyCoordinate[1] === getXYCoordinatesFromIndex(pivotIndex + 1, boardWidth)[1]){
          const coordinate = pivotIndex + 1
          if (!usedUpCoordinates.includes(coordinate) && coordinate >= 0 && coordinate < boardWidth ** 2) acc[key] = coordinate
        }
        break
      case 'W':
        if (xyCoordinate[1] === getXYCoordinatesFromIndex(pivotIndex - 1, boardWidth)[1]){
          const coordinate = pivotIndex - 1
          if (!usedUpCoordinates.includes(coordinate) && coordinate >= 0 && coordinate < boardWidth ** 2) acc[key] = coordinate
        }
        break
    }
    return acc
  }, {})

}

// this will determinate which direction the two indices are at - either 'x' or 'y'
function calculateCoordinatesDirectionAxis(coordinate1, coordinate2, boardWidth){

  const xyCoordinate1 = getXYCoordinatesFromIndex(coordinate1, boardWidth)
  const xyCoordinate2 = getXYCoordinatesFromIndex(coordinate2, boardWidth)

  let trend = undefined
  if (xyCoordinate1[1] === xyCoordinate2[1]) trend = 'H' // horizontal if the y coordinates matches
  else if (xyCoordinate1[0] === xyCoordinate2[0]) trend = 'V' // vertical if the the x coordinates matches
  return trend
}


// an index is tight fit if its neighbour coordinates have already been used
function isTightFit(indexCoordinate, usedUpCoordinates, boardWidth){

  const directions = listPossibleDirection(indexCoordinate, usedUpCoordinates, boardWidth)
  return Object.keys(directions).length === 0
}


class DeployedFleet {

  constructor(name, size, deployedCoordinates){
    this.name = name
    this.size = size
    this.deployedCoordinates = deployedCoordinates

    // this is the list of attacked index coordinates that corresponds to the deployedCoordinates - initially empty
    this.hitCoordinates = []
  }

  isIndexCoordinateMatched(indexCoordinate){
    return this.deployedCoordinates.includes(indexCoordinate)
  }

  markHit(indexCoordinate){
    this.hitCoordinates.push(indexCoordinate)
  }

  isDestroyed(){
    return this.hitCoordinates.length === this.deployedCoordinates.length
  }
}


class Player {

  constructor(name = 'Player1') {
    this.name = name
    this.deployedFleets = {} //this will store 'DeployedFleet' type with the name being the key so that it's faster to access
    this.allFleetsCoordinates = []
    this.destroyedFleets = 0

    this.attackAttemptsCoordinates = [] // histories of all the attacks performed by other player
  }

  hasNoMoreFleetRemaining() {
    return Object.keys(this.deployedFleets).every(function(fleetName) {
      return this.deployedFleets[fleetName].isDestroyed()
    }.bind(this))
  }

  // accepts a coordinate and provides back with a fleet name from all the deployed fleets on the map grid
  reportFleetName(indexCoordinate){
    for (const fleetName in this.deployedFleets){
      if (this.deployedFleets[fleetName].deployedCoordinates.includes(indexCoordinate)){
        return fleetName
      }
    }
  }

  // at any point, player can be interrogated to report all the fleets that were destroyed!
  // basically a subset of all the fleets
  reportAllDestroyedFleets(){
    return Object.keys(this.deployedFleets).reduce(function(destroyedFleets, fleetName){
      if (this.deployedFleets[fleetName].isDestroyed()) destroyedFleets[fleetName] = this.deployedFleets[fleetName]
      return destroyedFleets
    }.bind(this), {} )
  }

  reportAllDestroyedFleetsCoordinates(){
    return Object.keys(this.deployedFleets).reduce(function(acc, fleetName){
      if (this.deployedFleets[fleetName].isDestroyed()) acc = acc.concat(this.deployedFleets[fleetName].deployedCoordinates)
      return acc
    }.bind(this), [] )
  }
}



class Bot extends Player {

  constructor(width) {
    super('Bot')
    this.width = width
    this.totalGridSize = this.width ** 2
    
    this.allAttackedVectors = [] //histories of all the coordinates used/attacked by the bot - hit and miss both
    this.everySuccessfulAttacks = [] // histories of all successful attacks
    
    this.destroyedFleetCoordinates = []   // coordinates of all the fleets that were destroyed

    // this is not the same as attacked vectors but a subset of successful attack to identify the axis of potential fleet
    // this could change in order to pick a strategy
    this.lastSuccessfulAttacks = []
    this.attackAxis = 'H'

    this.isBotConfused = false
  }

  randomAttack(){

    let nextBestVector = Math.floor(Math.random() * this.totalGridSize)
    // keep generating if it has already been used before or if the coordinate is tight fit
    while (this.allAttackedVectors.includes(nextBestVector) || isTightFit(nextBestVector, this.allAttackedVectors, this.width)) {
      nextBestVector = Math.floor(Math.random() * this.totalGridSize)
    }
    return nextBestVector
  }

  calculateSuitableAttackCoordinate(previousAttackedCoord, usedUpCoordinates, boardWidth, attackAxis){

    if (!previousAttackedCoord || usedUpCoordinates.length === 0) return -1
  
    const directions = listPossibleDirection(previousAttackedCoord, usedUpCoordinates, boardWidth, attackAxis)
    const keys = Object.keys(directions)
    if (keys.length > 0){
      const k = keys.length > 1 ? keys[Math.floor(Math.random() * keys.length)] : keys[0]
      return directions[k]
    }

    // this means it failed to find a suitable coordinate from previously attacked - might be worth trying from different end of the axis
    return -1
  }

  resetAttackTactics(){

    const test = buildAdjacentCoordinates(this.everySuccessfulAttacks, this.destroyedFleetCoordinates)
    this.lastSuccessfulAttacks = []
    this.attackAxis = undefined
    
    if (test.length > 0) this.lastSuccessfulAttacks = test
    if (test.length > 1) this.attackAxis = calculateCoordinatesDirectionAxis(this.lastSuccessfulAttacks[0], this.lastSuccessfulAttacks[1], this.width)
  }


  calculateFromLastSuccessfulAttacks(){

    this.isBotConfused = false

    const totalAttacks = this.lastSuccessfulAttacks.length
    let calcVector
    if (totalAttacks > 0){
      calcVector = this.calculateSuitableAttackCoordinate(this.lastSuccessfulAttacks[totalAttacks - 1], this.allAttackedVectors, this.width, this.attackAxis)
      
      if (calcVector && calcVector === -1){
        // try again from differnt end
        calcVector = this.calculateSuitableAttackCoordinate(this.lastSuccessfulAttacks[0], this.allAttackedVectors, this.width, this.attackAxis)
      }

      if (calcVector === -1){
        this.isBotConfused = true
      }
    }

    return calcVector
  }

  calculateNextAttackVector() {

    let fromLastAttacks = this.calculateFromLastSuccessfulAttacks()
    if (fromLastAttacks && fromLastAttacks !== -1 ) return fromLastAttacks

    if (this.isBotConfused && this.attackAxis) {
      this.attackAxis = this.attackAxis === 'H' ? 'V' : 'H' // see if switch the axis makes it better
      fromLastAttacks = this.calculateFromLastSuccessfulAttacks() // try again to unlock confusion
    }

    if (fromLastAttacks && fromLastAttacks !== -1 ) return fromLastAttacks

    // let's see if there were any coordinates that was can use from
    if (this.lastSuccessfulAttacks.length === 0){
      const test = buildAdjacentCoordinates(this.everySuccessfulAttacks, this.destroyedFleetCoordinates)
      if (test.length > 1) {
        this.lastSuccessfulAttacks = test
        this.attackAxis = calculateCoordinatesDirectionAxis(this.lastSuccessfulAttacks[0], this.lastSuccessfulAttacks[1], this.width)
      }

      fromLastAttacks = this.calculateFromLastSuccessfulAttacks()
    }

    if (fromLastAttacks && fromLastAttacks !== -1 ) return fromLastAttacks

    // else fallback to random attack
    const random = this.randomAttack()
    return random
  }

  storeLastSuccessfulAttack(hitIndex){

    this.lastSuccessfulAttacks.push(hitIndex)
    this.everySuccessfulAttacks.push(hitIndex)
    if (!this.attackAxis && this.lastSuccessfulAttacks.length > 1) {
      this.attackAxis = calculateCoordinatesDirectionAxis(this.lastSuccessfulAttacks[0], this.lastSuccessfulAttacks[1], this.width)
    }
  }


  // randomly places fleets and return all the coordinates that was used
  deployFleetsRandomly(gameWidth, playableFleets){

    // using arrow syntax to access 'this.allFleetsCoordinates' variable
    playableFleets.forEach(function(fleetName) {

      //let deployCoordinates = []
      AXIS = ['H', 'V'][Math.floor(Math.random() * 2 )] // randomly pick a axis
      let randomIndex = Math.floor(Math.random() * gameWidth ** 2 )

      // keep calculating until we get a spot that was not previously used
      let randomIndexCoordinates = calcRelativeCoordinates(randomIndex, gameWidth, FLEET_SIZE_INFO[fleetName])
      while (randomIndexCoordinates.some(function(index){
        return this.allFleetsCoordinates.includes(index)
      }.bind(this))){

        AXIS = ['H', 'V'][Math.floor(Math.random() * 2 )] // randomly pick a axis
        randomIndex = Math.floor(Math.random() * gameWidth ** 2 )
        randomIndexCoordinates = calcRelativeCoordinates(randomIndex, gameWidth, FLEET_SIZE_INFO[fleetName])
      }

      // save the coordinates
      this.deployedFleets[fleetName] = new DeployedFleet(fleetName, FLEET_SIZE_INFO[fleetName], randomIndexCoordinates)
      this.allFleetsCoordinates = this.allFleetsCoordinates.concat(randomIndexCoordinates)
    }.bind(this))
    
  }
}


class Game {

  constructor(width) {
    this.width = width

    // TODO: make it non-square grid
    this.height = width

    this.playerDivs = []
    this.botDivs = []

    this.humanPlayer = new Player()
    this.bot = new Bot(this.width)

    this.attackBot = true // true means it's human's turn and to attack the bot, false is otherwise
    //this.usedCoordinates = []
    this.gameEnded = false

    this.attackableClickEvent = this.attackableClickEvent.bind(this)
  }

  createGrid() {

    const playerGridDiv = document.querySelector('.player-grid')
    const botGridDiv = document.querySelector('.bot-grid')
    
    for (let i = 0; i < this.width * this.height; i++) {

      const playerDiv = document.createElement('div')
      playerDiv.setAttribute('index', i )
      //playerDiv.classList.add(CSS_DEFAULT_GRID_COLOR)

      this.playerDivs.push(playerDiv)
      playerGridDiv.appendChild(playerDiv)

      const botDiv = document.createElement('div')
      botDiv.setAttribute('index', i )
      //botDiv.classList.add(CSS_DEFAULT_GRID_COLOR)

      this.botDivs.push(botDiv)
      botGridDiv.appendChild(botDiv)
    }
  }

  // on click event
  attackableClickEvent(e) {
    
    const grids = this.attackBot ? this.botDivs : this.playerDivs
    const player = this.attackBot ? this.bot : this.humanPlayer
    const indexCoordinate = parseInt(e.target.getAttribute('index'))

    if (!this.bot.attackAttemptsCoordinates.includes(indexCoordinate)){
      if (this.checkAndMarkFleetHit(indexCoordinate, this.attackBot)){
        player.reportAllDestroyedFleets()
      }
  
      // once clicked/attacked - we don't want to be able to clickable until the bot have attacked the human players as well
      grids.forEach(function(grid) {
        grid.removeEventListener('click', this.attackableClickEvent )
      }.bind(this))

      this.checkGameEnded()
      if (!this.gameEnded) {
        this.letBotAttackHuman()
      }
    }
  }

  letBotAttackHuman(){
    
    setTimeout(function() {
      const botAttackVector = this.bot.calculateNextAttackVector()
      const lastDesttoyedCount = this.humanPlayer.destroyedFleets
      this.bot.allAttackedVectors.push(botAttackVector)
      
      if (this.checkAndMarkFleetHit(botAttackVector, false)){
        this.bot.storeLastSuccessfulAttack(botAttackVector)
        if (this.humanPlayer.destroyedFleets > lastDesttoyedCount){
          this.bot.destroyedFleetCoordinates = this.humanPlayer.reportAllDestroyedFleetsCoordinates()
          this.bot.resetAttackTactics() //reset after destroying
        }
      }
      this.checkGameEnded()
      this.addAttackableClickEventsForPlayerGrids()
    }.bind(this), 300)
  }

  
  // reusable click event handle function to hand on the bot grid so human can attack
  addAttackableClickEventsForPlayerGrids(isBot = true) {
    const grids = isBot ? this.botDivs : this.playerDivs
    if (!this.gameEnded) {
      grids.forEach(function(grid){
        grid.addEventListener('click', this.attackableClickEvent)
      }.bind(this))
    }
  }

  markFleetAsDestroyed(fleetName, isBot){
    const containerName = isBot ? '.bot-container' : '.player-container'
    const fleetDiv = document.querySelector(`${containerName} div #${fleetName}`)
    fleetDiv.classList.add('fleet-destroyed')
  }

  // check and update the CSS accordingly - if hit return true, if not return false
  checkAndMarkFleetHit(indexCoordinate, isBot = true) {
    const grids = isBot ? this.botDivs : this.playerDivs
    const player = isBot ? this.bot : this.humanPlayer

    // record the attack attempts coordinates on the player
    player.attackAttemptsCoordinates.push(indexCoordinate)
    
    // remove the default highlighting classes - we will re-painting the grid again anyway
    // grids[indexCoordinate].classList.remove(CSS_GRID_SELECT, CSS_DEFAULT_GRID_COLOR)
    grids[indexCoordinate].classList.remove(CSS_GRID_SELECT)
    let hitSuccessful = false
    grids[indexCoordinate].classList.add(CSS_GRID_MISSED)
    for (const fleetName in player.deployedFleets) {
      if (player.deployedFleets[fleetName].isIndexCoordinateMatched(indexCoordinate)) {

        const stateBeforeHit = player.deployedFleets[fleetName].isDestroyed() // before marking as hit on the fleet

        player.deployedFleets[fleetName].markHit(indexCoordinate)
        grids[indexCoordinate].classList.remove(CSS_GRID_MISSED)
        grids[indexCoordinate].classList.add(CSS_GRID_ATTACKED)
        hitSuccessful = true

        // increment the destroyed ship count if it was not destroyed but after hiting it, the fleet was destroyed
        if (player.deployedFleets[fleetName].isDestroyed()){
          this.markFleetAsDestroyed(fleetName, isBot)

          if (!stateBeforeHit) player.destroyedFleets++
        }
      }
    }
    
    return hitSuccessful
  }

  deployBotFleets(playableFleets){
    this.bot.deployFleetsRandomly(this.width, playableFleets)
    this.addAttackableClickEventsForPlayerGrids(true)
  }

  checkGameEnded(){
    const botWon = this.humanPlayer.hasNoMoreFleetRemaining()
    this.gameEnded = botWon || this.bot.hasNoMoreFleetRemaining()

    if (this.gameEnded) {
      const result = botWon ? 'You lost!!!' : 'You won!!!'
      showOverlay(result, true)

      if (!muteSound){
        if (currentPlayingAudio) {
          currentPlayingAudio.currentTime = 0
          currentPlayingAudio.pause()
        }
        currentPlayingAudio = botWon ? document.getElementById('loseSound') : document.getElementById('winSound')
        currentPlayingAudio.currentTime = 0
        currentPlayingAudio.play()
      }
    }
  }
}


function hideOverlay() {
  document.querySelector('div.overlay').style.height = '0%'
}

function showOverlay(msg, showReloadOption = false) {
  const selector = 'div.overlay'

  if (msg && msg.length > 0) {
    document.querySelector(`${selector} p`).innerHTML = msg
  }
  
  if (showReloadOption){
    document.querySelector('div.overlay').removeEventListener('click', hideOverlay)
    document.querySelector(`${selector} a`).style.display = 'inline'
  }

  document.querySelector(selector).style.height = '100%'
}


function toggleGameRulesDisplay() {
  const rulesDiv = document.querySelector('.game-rules div')
  if (rulesDiv.style.display === 'none'){
    rulesDiv.style.display = 'block'
  } else {
    rulesDiv.style.display = 'none'
  }
}

// DOM Hook
// All res load event hook
window.addEventListener('load', function() {

  console.log('This is battleship developed by bhuone-garbu')
  console.log('https://github.com/bhuone-garbu/classic-battleship')

  if (!DEBUG) console.log = function() {}

  let lastClickedFleetDiv
  let lastRelativeCoordinates

  // this array is the source of truth for array of 'fleet' that was used in the game
  const playableFleets = []

  const game = new Game(10)
  game.createGrid()

  document.querySelector('div.overlay').addEventListener('click', hideOverlay)

  // this won't be visible until game over
  document.querySelector('.overlay-content a').addEventListener('click', function(){
    hideOverlay()
    location.reload()
  })

  document.querySelector('.game-rules a').addEventListener('click', toggleGameRulesDisplay)

  setTimeout(function() {
    showOverlay('Start deploying by clicking on your fleets!'), 300
  })
  
  const rotateBtn = document.getElementById('rotateBtn')
  //const shipButtons = document.querySelectorAll('.ships button')

  const humanShipDivs = document.querySelectorAll('.player-container .fleets div')
  let totalShipsToDeploy = humanShipDivs.length


  // remove event listener
  function clearPlayer1EventListeners(){
    game.playerDivs.forEach(function(div){
      div.removeEventListener('mouseover', predeployMouseover)
      div.removeEventListener('mouseout', predeployMouseout)
      div.removeEventListener('click', deployMouseclick)
    })
  }

  function predeployMouseout(e){
    const shipLength = FLEET_SIZE_INFO[lastClickedFleetDiv.id]
    const cellDivIndex = parseInt(e.target.getAttribute('index'))
    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach(function(index){
      game.playerDivs[index].classList.remove(CSS_GRID_HOVER)
    })
  }
  
  function deployMouseclick(e) {
    const shipLength = FLEET_SIZE_INFO[lastClickedFleetDiv.id]
    const cellDivIndex = parseInt(e.target.getAttribute('index'))

    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)

    function indexPresentInAllCoords(index){
      return game.humanPlayer.allFleetsCoordinates.includes(index)
    }

    if (!indexCoordinates.some(indexPresentInAllCoords)){

      playSoundById('fleetPlacement')

      indexCoordinates.forEach(function(index){
        game.playerDivs[index].classList.remove(CSS_GRID_HOVER)
        game.playerDivs[index].classList.add(CSS_GRID_SELECT)
      })

      // remove the hover effect and add the deployed css
      lastClickedFleetDiv.classList.remove(CSS_FLEET_PREDEPLOY, CSS_FLEET_SELECT)
      lastClickedFleetDiv.classList.add(CSS_FLEET_DEPLOYED)
  
      // after each successful click on the board we want to remove all the board hover, mouseout and click events
      clearPlayer1EventListeners()
  
      const fleetName = lastClickedFleetDiv.id
      game.humanPlayer.deployedFleets[fleetName] = new DeployedFleet(fleetName, FLEET_SIZE_INFO[fleetName], indexCoordinates)
      game.humanPlayer.allFleetsCoordinates = game.humanPlayer.allFleetsCoordinates.concat(indexCoordinates)
      
      rotateBtn.disabled = true
      lastClickedFleetDiv.removeEventListener('click', addMouseOverOutClickEventInGrid)

      if ( --totalShipsToDeploy === 0) {
        startGame()
        playSoundById('themeSound')
        showOverlay('Your enemy has deployed their fleets. Start attacking now! Goodluck!')
      }
    }
  }

  function startGame(){
    game.deployBotFleets(playableFleets)
    const botFleets = document.querySelectorAll('.bot-container .fleets div')
    botFleets.forEach(function(div){
      div.classList.add(CSS_FLEET_DEPLOYED)
    })

    document.querySelector('.bot-grid').style.visibility = 'visible'
    document.querySelector('.bot-container .fleets').style.display = 'flex'
  }

  function predeployMouseover(e){

    const shipLength = FLEET_SIZE_INFO[lastClickedFleetDiv.id]
    const cellDivIndex = parseInt(e.target.getAttribute('index'))

    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    if (!lastRelativeCoordinates || lastRelativeCoordinates.some(function(coordinate) {
      return !indexCoordinates.includes(coordinate)
    })) {
      playSoundById('fleetMouseOver')
    }

    indexCoordinates.forEach(function(index){
      game.playerDivs[index].classList.add(CSS_GRID_HOVER)
    })
    lastRelativeCoordinates = indexCoordinates
  }

  function addMouseOverOutClickEventInGrid(e){
    // record this for later
    if (!playableFleets.includes(e.currentTarget.id)){
      playableFleets.push(e.currentTarget.id)
    }

    playSoundById('fleetSelect')

    if (lastClickedFleetDiv && !lastClickedFleetDiv.classList.contains(CSS_FLEET_DEPLOYED)){
      lastClickedFleetDiv.classList.add(CSS_FLEET_PREDEPLOY)
      lastClickedFleetDiv.classList.remove(CSS_FLEET_SELECT)
    }

    e.currentTarget.classList.add(CSS_FLEET_SELECT)
    e.currentTarget.classList.remove(CSS_FLEET_PREDEPLOY)
    lastClickedFleetDiv = e.currentTarget
    rotateBtn.disabled = false
    
    game.playerDivs.forEach(function(div){
      //clearPlayer1EventListeners()
      div.addEventListener('mouseover', predeployMouseover)
      div.addEventListener('mouseout', predeployMouseout)
      div.addEventListener('click', deployMouseclick)
    })
  }

  // add event listners for ships
  humanShipDivs.forEach(function(shipDiv){
    shipDiv.addEventListener('click', addMouseOverOutClickEventInGrid)
  })

  // rotate means we just need to switch the axis so mouseover, mouseout and click event listener will be reflected based on that
  rotateBtn.addEventListener('click', function(){
    switchAxis()
    playSoundById('axisRotate')
  }) 

})
