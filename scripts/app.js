
// CSS global class name constants
const CSS_DEFAULT_GRID_COLOR = 'default-grid-color'
const CSS_GRID_HOVER = 'grid-hightlight'
const CSS_GRID_SELECT = 'grid-select'
const CSS_FLEET_ATTACKED = 'fleet-attacked'
const CSS_FLEET_MISSED = 'fleet-missed'

let AXIS = 'H' // 'V'
const switchAxis = () => AXIS = AXIS === 'H' ? 'V' : 'H' // this just flips the axis

// initial fleet name as key and value as the size of the fleet - size as in the nuber of cells it takes on the grid
// ths does not mean that all these fleets will be used
const FLEET_SIZE_INFO = {
  destroyer: 5,
  battleship: 4,
  carrier: 3,
  submarine: 2
}

// this array is the source of truth for array of 'fleet' that was used in the game
const playableFleets = []

let lastClickFleetButton


// utility functions for returning x and y coordinate from index and vice versa
const getXYCoordinatesFromIndex = (gridIndex, boardWidth) => [gridIndex % boardWidth, Math.floor(gridIndex / boardWidth)]
const getIndexFromXYCoordinates = (x, y, boardWidth) => y * boardWidth + x

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


// We want to list all the possible direction from the current pivot index where attack coordinate is valid
// this is helpful for bot to tell which direction from the current index is attackableœ
function listPossibleDirection(pivotIndex, boardWidth, usedUpCoordinates){

  const xyCoordinate = getXYCoordinatesFromIndex(pivotIndex, boardWidth)
  console.log(xyCoordinate)
  const north = getIndexFromXYCoordinates(xyCoordinate[0], xyCoordinate[1] - 1, boardWidth)
  const south = getIndexFromXYCoordinates(xyCoordinate[0], xyCoordinate[1] + 1, boardWidth)
  const east = getIndexFromXYCoordinates(xyCoordinate[0] + 1, xyCoordinate[1], boardWidth)
  const west = getIndexFromXYCoordinates(xyCoordinate[0] - 1, xyCoordinate[1], boardWidth)

  console.log([north, south, east, west])

  if (!usedUpCoordinates) usedUpCoordinates = []
  return [north, south, east, west].filter( coordinate => !usedUpCoordinates.includes(coordinate) && coordinate >= 0 && coordinate < boardWidth ** 2 )
}



class DeployedFleet {

  constructor(name, size, deployedCoordinates){
    this.name = name
    this.size = size
    this.deployedCoordinates = deployedCoordinates

    // this is the list of attacked index coordinates that corresponds to the deployedCoordinates - initially empty
    this.attackedCoordinates = []
  }

  isIndexCoordinateMatched(indexCoordinate){
    return this.deployedCoordinates.includes(indexCoordinate)
  }

  markHit(indexCoordinate){
    this.attackedCoordinates.push(indexCoordinate)
  }

  isDestroyed(){
    return this.attackedCoordinates.length === this.deployedCoordinates.length
  }

}


class Player {

  constructor(game, name = 'Player1') {
    this.game = game
    this.name = name
    this.deployedFleets = {} //this will store 'DeployedFleet' type with the name being the key so that it's faster to access
    this.allFleetsCoordinates = []
  }

  hasNoMoreFleetRemaining() {
    return Object.keys(this.deployedFleets).every( fleetName => this.deployedFleets[fleetName].isDestroyed())
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
    return Object.keys(this.deployedFleets).reduce( (destroyedFleets, fleetName) => {
      if (this.deployedFleets[fleetName].isDestroyed()) destroyedFleets[fleetName] = this.deployedFleets[fleetName]
      return destroyedFleets
    }, {} )
  }
}



class Bot extends Player {
  constructor(totalGridSize) {
    super('Bot')
    //this.type = type
    this.totalGridSize = totalGridSize
    this.attackedVectors = [] //histories of all the coordinates used by the bot
    this.lastSuccessfulAttack = null
  }

  calculateNextAttackVector() {
    let nextBestVector = Math.floor(Math.random() * this.totalGridSize)
    while (this.attackedVectors.includes(nextBestVector)) {
      nextBestVector = Math.floor(Math.random() * this.totalGridSize)
    }
    this.attackedVectors.push(nextBestVector)
    return nextBestVector
  }

  storeLastSuccessfulAttack(hitIndex){
    console.log('storing successful attack')
    this.lastSuccessfulAttack = hitIndex
  }


  // randomly places fleets and return all the coordinates that was used
  deployFleetsRandomly(gameWidth){

    // this is the list of the coordinates of the fleet that the bot deployed
    let deployCoordinates = []

    // using arrow syntax to access 'this.allFleetsCoordinates' variable
    playableFleets.forEach( fleetName => {

      AXIS = ['H', 'V'][Math.floor(Math.random() * gameWidth ** 1 )] // randomly pick a axis
      let randomIndex = Math.floor(Math.random() * gameWidth ** 2 )

      // keep calculating until we get a spot that was not previously used
      let randomIndexCoordinates = calcRelativeCoordinates(randomIndex, gameWidth, FLEET_SIZE_INFO[fleetName])
      while (randomIndexCoordinates.some(index => this.allFleetsCoordinates.includes(index))){
        randomIndex = Math.floor(Math.random() * gameWidth ** 2 )
        randomIndexCoordinates = calcRelativeCoordinates(randomIndex, gameWidth, FLEET_SIZE_INFO[fleetName])
      }

      // save the coordinates
      this.deployedFleets[fleetName] = new DeployedFleet(fleetName, FLEET_SIZE_INFO[fleetName], randomIndexCoordinates)
      deployCoordinates = deployCoordinates.concat(randomIndexCoordinates)
    })
    
    this.allFleetsCoordinates = this.allFleetsCoordinates.concat(deployCoordinates)
    return deployCoordinates
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
    this.bot = new Bot(this.width * this.height)

    this.attackBot = true // true means it's human's turn and to attack the bot, false is otherwise
    //this.usedCoordinates = []
    this.gameEnded = false
  }

  createGrid() {

    const playerGridDiv = document.querySelector('.player-grid')
    const botGridDiv = document.querySelector('.bot-grid')
    
    for (let i = 0; i < this.width * this.height; i++) {

      const playerDiv = document.createElement('div')
      playerDiv.setAttribute('index', i )
      playerDiv.classList.add(CSS_DEFAULT_GRID_COLOR)

      this.playerDivs.push(playerDiv)
      playerGridDiv.appendChild(playerDiv)

      const botDiv = document.createElement('div')
      botDiv.setAttribute('index', i )
      botDiv.classList.add(CSS_DEFAULT_GRID_COLOR)

      this.botDivs.push(botDiv)
      botGridDiv.appendChild(botDiv)
    }
  }

  // on click event
  attackableClickEvent = (e) => {
    
    const grids = this.attackBot ? this.botDivs : this.playerDivs
    const player = this.attackBot ? this.bot : this.humanPlayer
    const indexCoordinate = parseInt(e.target.getAttribute('index'))
    console.log('indexCoordinate', indexCoordinate)
    if (this.checkAndMarkFleetHit(indexCoordinate, this.attackBot)){
      console.log(player.reportAllDestroyedFleets())
    }

    // once clicked/attacked - we don't want to be able to clickable until the bot have attacked the human players as well
    grids.forEach( grid => grid.removeEventListener('click', this.attackableClickEvent ))
    this.checkGameEnded()
    this.letBotAttackHuman()
    
  }

  letBotAttackHuman(){
    if (!this.gameEnded) {
      console.log('Bot about to attack in 1 seconds')
      setTimeout(() => {
        const botAttackVector = this.bot.calculateNextAttackVector()
        console.log('botAttackVector', botAttackVector)
        if (this.checkAndMarkFleetHit(botAttackVector, false)){
          this.bot.storeLastSuccessfulAttack(botAttackVector)
        } 
        this.checkGameEnded()
        this.addAttackableClickEventsForPlayerGrids()
      }, 1000)
    }
  }

  
  // reusable click event handle function to hand on the bot grid so human can attack
  addAttackableClickEventsForPlayerGrids(isBot = true) {
    const grids = isBot ? this.botDivs : this.playerDivs
    if (!this.gameEnded) {
      grids.forEach( grid => grid.addEventListener('click', this.attackableClickEvent ))
    }
  }


  // check and update the CSS accordingly - if hit return true, if not return false
  checkAndMarkFleetHit(indexCoordinate, isBot = true){
    const grids = isBot ? this.botDivs : this.playerDivs
    const player = isBot ? this.bot : this.humanPlayer
    
    // remove the default highlighting classes - we will re-painting the grid again anyway
    grids[indexCoordinate].classList.remove(CSS_GRID_SELECT, CSS_DEFAULT_GRID_COLOR)
    let hitSuccessful = false
    for (const fleetName in player.deployedFleets) {
      if (player.deployedFleets[fleetName].isIndexCoordinateMatched(indexCoordinate)) {
        player.deployedFleets[fleetName].markHit(indexCoordinate)
        grids[indexCoordinate].classList.add(CSS_FLEET_ATTACKED)
        hitSuccessful = true
      }
    }
    grids[indexCoordinate].classList.add(CSS_FLEET_MISSED)
    return hitSuccessful
  }

  deployBotFleets(){
    const deployedCoordinates = this.bot.deployFleetsRandomly(this.width)
    console.log('deployedCoordinates', deployedCoordinates)
    deployedCoordinates.forEach( index => this.botDivs[index].classList.add(CSS_GRID_SELECT))
    this.addAttackableClickEventsForPlayerGrids(true)
  }

  checkGameEnded(){
    this.gameEnded = this.humanPlayer.hasNoMoreFleetRemaining() || this.bot.hasNoMoreFleetRemaining()
    if (this.gameEnded) console.log('game ended')
  }

}


// DOM Hook
window.addEventListener('DOMContentLoaded', () => {

  const game = new Game(10)
  game.createGrid()

  const rotateBtn = document.getElementById('rotateBtn')
  const shipButtons = document.querySelectorAll('.ships button')
  let totalShipsToDeploy = shipButtons.length
  // game
  const startButton = document.getElementById('startAttacking')

  
  // remove event listener
  function clearPlayer1EventListeners(){
    game.playerDivs.forEach( div => {
      div.removeEventListener('mouseover', predeployMouseover)
      div.removeEventListener('mouseout', predeployMouseout)
      div.removeEventListener('click', deployMouseclick)
    })
  }

  function predeployMouseout(e){
    const shipLength = FLEET_SIZE_INFO[lastClickFleetButton.value]
    const cellDivIndex = parseInt(e.target.getAttribute('index'))
    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => game.playerDivs[index].classList.remove(CSS_GRID_HOVER))
  }
  
  function deployMouseclick(e) {
    const shipLength = FLEET_SIZE_INFO[lastClickFleetButton.value]
    const cellDivIndex = parseInt(e.target.getAttribute('index'))

    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => {
      game.playerDivs[index].classList.remove(CSS_GRID_HOVER)
      game.playerDivs[index].classList.add(CSS_GRID_SELECT)
    })

    // after each click on the board we want to remove all the board hover, mouseout and click events
    clearPlayer1EventListeners()

    const fleetName = lastClickFleetButton.value
    game.humanPlayer.deployedFleets[fleetName] = new DeployedFleet(fleetName, FLEET_SIZE_INFO[fleetName], indexCoordinates)
    
    if ( --totalShipsToDeploy === 0) startButton.disabled = false
    rotateBtn.disabled = true
    lastClickFleetButton.disabled = true
  }

  function predeployMouseover(e){
    const shipLength = FLEET_SIZE_INFO[lastClickFleetButton.value]
    const cellDivIndex = parseInt(e.target.getAttribute('index'))

    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => game.playerDivs[index].classList.add(CSS_GRID_HOVER))
  }

  function addMouseOverOutClickEvent(){
    game.playerDivs.forEach( div => {
      div.addEventListener('mouseover', predeployMouseover)
      div.addEventListener('mouseout', predeployMouseout)
      div.addEventListener('click', deployMouseclick)
    })
  }

  // add event listners for ships
  shipButtons.forEach( btn => {
    btn.addEventListener('click', () => {
      playableFleets.push(btn.value)
      // record this for later
      lastClickFleetButton = btn
      rotateBtn.disabled = false
      addMouseOverOutClickEvent()
    })
  })
  
  // rotate means we just need to switch the axis so mouseover, mouseout and click event listener will be reflected based on that
  rotateBtn.addEventListener('click', switchAxis) 

  startButton.addEventListener('click', () => {
    game.deployBotFleets()
    startButton.disabled = true
  })

})
