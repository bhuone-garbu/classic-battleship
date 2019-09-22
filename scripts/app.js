
const DEFAULT_GRID_COLOR = 'default-grid-color'
const GRID_HOVER = 'grid-hightlight'
const GRID_SELECT = 'grid-select'

let axis = 'H' // 'V'
const switchAxis = () => {
  axis = axis === 'H' ? 'V' : 'H'
  console.log(axis)
}

// initial fleet name as key and value as the size of the fleet - size as in the nuber of cells it takes on the grid
const FLEET_SIZE_INFO = {
  destroyer: 5,
  battleship: 4,
  carrier: 3,
  submarine: 2
}

let lastClickedButton


// utility functions for returning x and y coordinate from index and vice versa
const getXYCoordinatesFromIndex = (gridIndex, boardWidth) => [gridIndex % boardWidth, Math.floor(gridIndex / boardWidth)]
const getIndexFromXYCoordinates = (x, y, boardWidth) => y * boardWidth + x

// We always want to return valid coordinates no matter what the size of the ship and no matter where the users hovers or clicks on the grid
function calcRelativeCoordinates(currentDivIndex, boardWidth, shipSize){

  const xyCoord = getXYCoordinatesFromIndex(currentDivIndex, boardWidth)

  const arrayWidth = boardWidth
  const horizontal = axis === 'H'

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
    if (axis === 'H') {
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


class DeployedFleet {

  constructor(name, size, deployedCoordinates){
    this.name = name
    this.size = size
    this.deployedCoordinates = deployedCoordinates
    this.isDestroyed = false

    // this is the list of attacked index coordinates that corresponds to the deployedCoordinates - initially empty
    this.attackedCoordinates = []
  }

  isIndexCoordinateMatched(indexCoordinate){
    return this.allFleetsCoordinates.includes(indexCoordinate)
  }

  checkIfHurt(indexCoordinate){
    const coordinateMatches = this.isIndexCoordinateMatched(indexCoordinate)
    if ( coordinateMatches ) this.attackedCoordinates.push(indexCoordinate)
    return coordinateMatches
  }

  isDestroyed(){
    return this.attackedCoordinates.length === this.deployedCoordinates
  }

}


class Player {

  constructor(name = 'Player1') {
    this.name = name
    this.remainingFleets = Object.keys(FLEET_SIZE_INFO).reduce((acc, key) => {
      acc[key] = { name: key, size: FLEET_SIZE_INFO[key], isDestroyed: false, isDeployed: false }
      return acc
    }, {})
    this.deployedFleets = {} //this will store 'DeployedFleet' type with the name being the key so that it's faster to access
    
    this.allFleetsCoordinates = []
  }

  hasNoMoreFleetRemaining() {
    return this.remainingFleets.length === 0
  }
}



class Bot extends Player {
  constructor(type) {
    super('Bot')
    this.type = type
  }

  calculateNextAttactCoordinate() {
    return 2
  }


  deployFleetsRandomly(boardWidth, botDivs){

    // using arrow syntax to access 'this.allFleetsCoordinates' variable
    Object.keys(this.remainingFleets).forEach( shipName => {

      axis = ['H', 'V'][Math.floor(Math.random() * boardWidth ** 1 )]
      let randomIndex = Math.floor(Math.random() * boardWidth ** 2 )

      // keep calculating until we get a spot that was not previously used
      let randomIndexCoordinates = calcRelativeCoordinates(randomIndex, boardWidth, FLEET_SIZE_INFO[shipName])
      while (randomIndexCoordinates.some(index => this.allFleetsCoordinates.includes(index))){
        randomIndex = Math.floor(Math.random() * boardWidth ** 2 )
        randomIndexCoordinates = calcRelativeCoordinates(randomIndex, boardWidth, FLEET_SIZE_INFO[shipName])
      }

      // save the coordinates
      randomIndexCoordinates.forEach( index => botDivs[index].classList.add(GRID_SELECT))
      this.deployedFleets[shipName] = new DeployedFleet(shipName, FLEET_SIZE_INFO[shipName], randomIndexCoordinates)
      // this.remainingFleets[shipName].indexCoordinates = randomIndexCoordinates
      // this.remainingFleets[shipName].isDeployed = true
      this.allFleetsCoordinates = this.allFleetsCoordinates.concat(randomIndexCoordinates)
    })
  }
}




class Game {

  constructor(width) {
    this.width = width

    // TODO: make it non-square grid
    this.height = width

    this.playerDivs = []
    this.botDivs = []

    this.player1 = new Player()
    this.bot = new Bot()
  }

  createGrid() {

    const playerGridDiv = document.querySelector('.player-grid')
    const botGridDiv = document.querySelector('.bot-grid')
    
    for (let i = 0; i < this.width * this.height; i++) {

      const playerDiv = document.createElement('div')
      playerDiv.classList.add(DEFAULT_GRID_COLOR)

      this.playerDivs.push(playerDiv)
      playerGridDiv.appendChild(playerDiv)

      const botDiv = document.createElement('div')
      botDiv.classList.add(DEFAULT_GRID_COLOR)

      this.botDivs.push(botDiv)
      botGridDiv.appendChild(botDiv)
    }
  }

  containsShip(indexCoordinate, isBot = false){
    const grids = isBot ? this.botDivs : this.playerDivs
  }

  deployBotFleets(){
    this.bot.deployFleetsRandomly(this.width, this.botDivs)
  }


}


// DOM Hook
window.addEventListener('DOMContentLoaded', () => {

  const game = new Game(10)
  game.createGrid()

  const rotateBtn = document.getElementById('rotateBtn')

  function predeployMouseout(e){
    const shipLength = FLEET_SIZE_INFO[lastClickedButton.value]
    const cellDivIndex = game.playerDivs.indexOf(e.target)
    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => game.playerDivs[index].classList.remove(GRID_HOVER))
  }

  // remove event listener
  function clearPlayer1EventListeners(){
    game.playerDivs.forEach( div => {

      div.removeEventListener('mouseover', predeployMouseover)
      div.removeEventListener('mouseout', predeployMouseout)
      div.removeEventListener('click', deployMouseclick)
    })
  }
  
  function deployMouseclick(e) {
    const shipLength = FLEET_SIZE_INFO[lastClickedButton.value]
    const cellDivIndex = game.playerDivs.indexOf(e.target)

    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => {

      game.playerDivs[index].classList.remove(GRID_HOVER)
      game.playerDivs[index].classList.add(GRID_SELECT)
    })

    // after each click on the board we want to remove all the board hover, mouseout and click events
    clearPlayer1EventListeners()

    lastClickedButton.disabled = true
    const shipName = lastClickedButton.value
    game.player1.deployedFleets[shipName] = new DeployedFleet(shipName, FLEET_SIZE_INFO[shipName], indexCoordinates)
    console.log('game.player1.deployedFleets[shipName]: ', game.player1.deployedFleets[shipName])
    rotateBtn.disabled = true
  }

  function predeployMouseover(e){
    const shipLength = FLEET_SIZE_INFO[lastClickedButton.value]
    const cellDivIndex = game.playerDivs.indexOf(e.target)

    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => game.playerDivs[index].classList.add(GRID_HOVER))
  }

  function addMouseOverOutClickEvent(){
    game.playerDivs.forEach( div => {
      div.addEventListener('mouseover', predeployMouseover)
      div.addEventListener('mouseout', predeployMouseout)
      div.addEventListener('click', deployMouseclick)
    })
  }

  
  // add event listners for ships
  const shipButtons = document.querySelectorAll('.ships button')
  shipButtons.forEach( btn => {
    btn.addEventListener('click', () => {
      
      // record this for later
      lastClickedButton = btn
      rotateBtn.disabled = false
      addMouseOverOutClickEvent()
    })
  })
  
  // rotate means we need to rewrite our mouseover, mouseout and click function again based on the new axis
  rotateBtn.addEventListener('click', () => {
    switchAxis()
    clearPlayer1EventListeners()
    addMouseOverOutClickEvent()
  })

  // game
  const startButton = document.getElementById('startAttacking')
  startButton.addEventListener('click', () => {

    game.deployBotFleets()
    startButton.disabled = true
    
  })

})
