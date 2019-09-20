
const FLEETS = ['destroyer', 'submarine', 'battleship', 'carrier']

const DEFAULT_GRID_COLOR = 'default-grid-color'
const GRID_HOVER = 'grid-hightlight'


// utility functions for returning x and y coordinate from index and vice versa
const getXYCoordinatesFromIndex = (gridIndex, boardWidth) => [gridIndex % boardWidth, Math.floor(gridIndex / boardWidth)]

const getIndexFromXYCoordinates = (x, y, boardWidth) => y * boardWidth + x


/*
// coordinates should be checked before doing anything to it
function isIndexValid(calculatedIndex, boardWidth) {
  return calculatedIndex >= 0 && calculatedIndex < boardWidth ** 2
}
*/


// We always want to return valid coordinates no matter what the size of the ship and no matter where the users hovers over the
// the grid
function calcRelativeCoordinates(currentDivIndex, boardWidth, size, horizontal = true) {
  const xyCoord = getXYCoordinatesFromIndex(currentDivIndex, boardWidth)

  const arrayWidth = boardWidth

  // calculate the how "off" the coordinate is given we take the size of the ship into account
  const offset = horizontal ? arrayWidth - (xyCoord[0] + size) : arrayWidth - (xyCoord[1] + size)

  // the idea is to return back the current xyCoord if we are okay else reset back to the last coordinate using the offset
  let indexToReturn
  if (horizontal) {
    indexToReturn = offset < 0 ? [xyCoord[0] - Math.abs(offset), xyCoord[1]] : xyCoord
  } else {
    indexToReturn = offset < 0 ? [xyCoord[0], xyCoord[1] - Math.abs(offset)] : xyCoord
  }
  return indexToReturn

}


// this is for player1
function handleFleetPlacement(cellDiv, playerDivs, axisWidth, ship, horizontal = true) {

  const indexCoordinates = []

  cellDiv.addEventListener('mouseover', ()  => {
    const cellDivIndex = playerDivs.indexOf(cellDiv)
    // let currentCoords = getXYCoordinatesFromIndex(cellDivIndex, boardWidth)
    const currentCoords = calcRelativeCoordinates(cellDivIndex, axisWidth, ship.size, horizontal)

    for (let i = 0; i < ship.size; i++) {
      const calculatedCoordinates = []
      if (horizontal) {
        calculatedCoordinates.push(currentCoords[0] + i)
        calculatedCoordinates.push(currentCoords[1])
      } else {
        calculatedCoordinates.push(currentCoords[0])
        calculatedCoordinates.push(currentCoords[1] + i)
      }
      const arrayIndex = getIndexFromXYCoordinates(calculatedCoordinates[0], calculatedCoordinates[1], axisWidth)
      indexCoordinates.push(arrayIndex)
    }

    if (ship.indexCoordinates) {
      ship.indexCoordinates.forEach(previousValidIndex => playerDivs[previousValidIndex].classList.remove(GRID_HOVER))
    }

    indexCoordinates.forEach(index => playerDivs[index].classList.add(GRID_HOVER))

    // update the ship coordinates
    ship.indexCoordinates = indexCoordinates
  })
}



class Player {
  constructor(name = 'Player1') {
    this.name = name
    this.remainingFleets = FLEETS.reduce((acc, feetName) => {
      acc.push({ name: feetName })
      return acc
    }, [])
  }

  isFeetAttacked() {

  }

  removeFleet() {

  }

  hasNoMoreFeelRemaining() {
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
}


class Game {
  constructor(width, player1, bot) {
    this.width = width
    this.height = width

    this.playerDivs = []
    this.botDivs = []

    this.player1 = player1
    this.bot = bot

    this.currentDivIndex = 0
    this.ship = { size: 5 } // temp
  }

  // utiltiy method to check if the index is within the grid array
  // coordinates should be checked before doing anything to it
  isIndexValid(calculatedIndex) {
    return calculatedIndex >= 0 && calculatedIndex < this.width ** 2
  }

  createGrid() {

    const playerGridDiv = document.querySelector('.player-grid')
    // const botGridDiv = document.querySelector('.bot-grid')
    
    for (let i = 0; i < this.width * this.height; i++) {

      const playerDiv = document.createElement('div')
      playerDiv.classList.add(DEFAULT_GRID_COLOR)

      this.updateMouseHover(this.ship)

      this.playerDivs.push(playerDiv)
      playerGridDiv.appendChild(playerDiv)

      // const botDiv = document.createElement('div')
      // botDiv.classList.add(DEFAULT_GRID_COLOR)

      // this.botDivs.push(botDiv)
      // botGridDiv.appendChild(botDiv)
    }
  }

  updateMouseHover(ship){

    if (!ship.axis) ship.axis = 'H'
    for (let i = 0; i < this.playerDivs.length; i++) {

      const playerDiv = this.playerDivs[i]
      playerDiv.classList.add(DEFAULT_GRID_COLOR)

      if ( ship.axis === 'H') handleFleetPlacement(playerDiv, this.playerDivs, this.width, ship)
      else handleFleetPlacement(playerDiv, this.playerDivs, this.width, ship, false)
    }
  }

  checkGameWon() {

  }
}


// DOM Hook
window.addEventListener('DOMContentLoaded', () => {

  const player1 = new Player()
  const bot = new Bot()

  const game = new Game(10, player1, bot)
  game.createGrid()


  const rotateBtn = document.getElementById('rotateBtn')
  rotateBtn.addEventListener('click', function() {
    
    if (game.ship.axis){
      game.ship.axis = game.ship.axis !== 'H' ? 'H' : 'V'
    }
    game.updateMouseHover(game.ship)
  })

})


