
const FLEETS = ['destroyer', 'submarine', 'battleship', 'carrier']

const DEFAULT_GRID_COLOR = 'default-grid-color'
const GRID_HOVER = 'grid-hightlight'
const GRID_SELECT = 'grid-select'

let axis = 'H' // 'V'


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
function calcRelativeCoordinates(currentDivIndex, boardWidth, size) {
  const xyCoord = getXYCoordinatesFromIndex(currentDivIndex, boardWidth)

  const arrayWidth = boardWidth
  const horizontal = axis === 'H'

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

function calcRelativeCoordinates2(currentDivIndex, boardWidth, shipSize){
  
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




// this is the hover effect
function handleFleetPlacement(cellDiv, playerDivs, axisWidth, ship, horizontal = true) {

  const indexCoordinates = []

  const mouseover = function(){
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

    handleClick(cellDiv, playerDivs, indexCoordinates, ship)

  }

  cellDiv.addEventListener('mouseover', mouseover)
}



function handleClick(cellDiv, playerDivs, indexCoordinates, ship){
  cellDiv.addEventListener('click', () => {
    console.log(indexCoordinates)
    indexCoordinates.forEach( index => {
      playerDivs[index].classList.remove(GRID_HOVER)
      playerDivs[index].classList.add(GRID_SELECT)
    })
  })
  
}

function removeMouseEvents(playerDivs) {
  console.log('remove effect')
  for (let i = 0; i < playerDivs.length; i++) {
    const playerDiv = playerDivs[i]
    playerDiv.addEventListener('mouseover', () => { 
      return
    } )
    playerDiv.addEventListener('click', () => {
      return
    })
  }
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
    //this.ships = [{ size: 5, axis: 'H' }, {sixe: 3, axis: 'V' }]// temp
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

      this.playerDivs.push(playerDiv)
      playerGridDiv.appendChild(playerDiv)

      // const botDiv = document.createElement('div')
      // botDiv.classList.add(DEFAULT_GRID_COLOR)

      // this.botDivs.push(botDiv)
      // botGridDiv.appendChild(botDiv)
    }
  }


  addUpdateMouseHover(ship){

    for (let i = 0; i < this.playerDivs.length; i++) {

      const playerDiv = this.playerDivs[i]

      if ( axis === 'H') handleFleetPlacement(playerDiv, this.playerDivs, this.width, ship)
      else handleFleetPlacement(playerDiv, this.playerDivs, this.width, ship, false)
    }
  }

  

  checkGameWon() {

  }

}


const shipSize = {
  destroyer: 5,
  carrier: 3,
  submarine: 2
}

const shipCounts = 3

let lastClickedButton

// DOM Hook
window.addEventListener('DOMContentLoaded', () => {

  const player1 = new Player()
  const bot = new Bot()

  const game = new Game(10, player1, bot)
  game.createGrid()

  // game.ships.forEach( s => {
  //   game.addUpdateMouseHover(s)
  // })
  
  const rotateBtn = document.getElementById('rotateBtn')
  rotateBtn.addEventListener('click', () => {
    axis = axis === 'H' ? 'V' : 'H'
  })
  

  const mouseout = function(e){
    
    const shipLength = shipSize[lastClickedButton.value]
    const cellDivIndex = game.playerDivs.indexOf(e.target)

    const indexCoordinates = calcRelativeCoordinates2(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => game.playerDivs[index].classList.remove(GRID_HOVER))
  }

  const mouseclick = function(e) {

    const shipLength = shipSize[lastClickedButton.value]
    const cellDivIndex = game.playerDivs.indexOf(e.target)

    const indexCoordinates = calcRelativeCoordinates2(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => {
      game.playerDivs[index].classList.remove(GRID_HOVER)
      game.playerDivs[index].classList.add(GRID_SELECT)
    })
    
    removeEventListener()
  }

  function removeEventListener(){

    game.playerDivs.forEach( div => {
      div.removeEventListener('mouseover', mouseover)
      div.removeEventListener('mouseout', mouseout)
      div.removeEventListener('click', mouseclick)
    })
  }

  const mouseover = function(e){
    const shipLength = shipSize[lastClickedButton.value]
    const cellDivIndex = game.playerDivs.indexOf(e.target)

    const indexCoordinates = calcRelativeCoordinates2(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => game.playerDivs[index].classList.add(GRID_HOVER))
  }

  // btn.disabled = true
  const shipButtons = document.querySelectorAll('.ships button')
  shipButtons.forEach( btn => {
    btn.addEventListener('click', () => {

      lastClickedButton = btn

      if (shipCounts === 0) return
      // else
      game.playerDivs.forEach( div => {
        div.addEventListener('mouseover', mouseover)
        div.addEventListener('mouseout', mouseout)
        div.addEventListener('click', mouseclick)
      })

      btn.disabled = 'true'
    })
  })

})
