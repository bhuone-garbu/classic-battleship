
const DEFAULT_GRID_COLOR = 'default-grid-color'
const GRID_HOVER = 'grid-hightlight'
const GRID_SELECT = 'grid-select'

let axis = 'H' // 'V'

const shipInfo = {
  destroyer: 5,
  battleship: 4,
  carrier: 3,
  submarine: 2
}

function getMapKeys(obj){
  return Object.keys(obj)
}

shipInfo.__proto__.keys = getMapKeys

const shipCounts = 3

let lastClickedButton


// utility functions for returning x and y coordinate from index and vice versa
const getXYCoordinatesFromIndex = (gridIndex, boardWidth) => [gridIndex % boardWidth, Math.floor(gridIndex / boardWidth)]

const getIndexFromXYCoordinates = (x, y, boardWidth) => y * boardWidth + x


// We always want to return valid coordinates no matter what the size of the ship and no matter where the users hovers overthe grid
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


class Player {
  constructor(name = 'Player1') {
    this.name = name
    this.remainingFleets = Object.keys(shipInfo).reduce((acc, key) => {
      acc[key] = { name: key, size: shipInfo[key], isDestroyed: false }
      return acc
    }, {})
    this.remainingFleets.__proto__.keys = Object.keys(this)
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


  pickRandomSpot(boardWidth){
    this.remainingFleets.keys().forEach( shipName => {
      const randomIndex = Math.floor(Math.random() * boardWidth ** 2 )

    })
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


}


// DOM Hook
window.addEventListener('DOMContentLoaded', () => {

  const player1 = new Player()
  const bot = new Bot()

  const game = new Game(10, player1, bot)
  game.createGrid()
  
  document.getElementById('rotateBtn').addEventListener('click', () => axis = axis === 'H' ? 'V' : 'H' )
  

  function predeployMouseout(e){
    
    const shipLength = shipInfo[lastClickedButton.value]
    const cellDivIndex = game.playerDivs.indexOf(e.target)

    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => game.playerDivs[index].classList.remove(GRID_HOVER))
  }

  function predeployMouseclick(e) {

    const shipLength = shipInfo[lastClickedButton.value]
    const cellDivIndex = game.playerDivs.indexOf(e.target)

    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => {
      game.playerDivs[index].classList.remove(GRID_HOVER)
      game.playerDivs[index].classList.add(GRID_SELECT)
    })

    // after each click on the board we want to remove all the board hover, mouseout and click events
    removeEventListener()

    lastClickedButton.disabled = 'true'
    game.player1.remainingFleets[lastClickedButton.value].indexCoordinates = indexCoordinates
    console.log(game.player1.remainingFleets[lastClickedButton.value])

  }

  function predeployMouseover(e){
    const shipLength = shipInfo[lastClickedButton.value]
    const cellDivIndex = game.playerDivs.indexOf(e.target)

    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => game.playerDivs[index].classList.add(GRID_HOVER))
  }

  // remove event listener
  function removeEventListener(){

    game.playerDivs.forEach( div => {
      div.removeEventListener('mouseover', predeployMouseover)
      div.removeEventListener('mouseout', predeployMouseout)
      div.removeEventListener('click', predeployMouseclick)
    })
  }


  const shipButtons = document.querySelectorAll('.ships button')
  shipButtons.forEach( btn => {
    btn.addEventListener('click', () => {

      lastClickedButton = btn

      if (shipCounts === 0) return
      // else
      game.playerDivs.forEach( div => {
        div.addEventListener('mouseover', predeployMouseover)
        div.addEventListener('mouseout', predeployMouseout)
        div.addEventListener('click', predeployMouseclick)
      })
    })
  })

})
