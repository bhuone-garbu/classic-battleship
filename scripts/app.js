const FLEETS = ['destroyer', 'submarine', 'battleship', 'carrier']
const DEFAULT_GRID_COLOR = 'default-grid-color'


const calculateCoordinates = (gridIndex, width) => {
  // return x and y coordinate
  return [ gridIndex % width, Math.floor(gridIndex / width) ]
}

const getIndexFromCoordinates = (x, y, width) => {
  return y * width + x
}


class Player {
  constructor(name = 'Player1'){
    this.remainingFleets = FLEETS.map(fleet => fleet)
    this.name = name
  }

  isFeetAttacked(){

  }

  removeFleet(){

  }

  hasNoMoreFeelRemaining(){
    return this.remainingFleets.length === 0
  }
}

class Bot extends Player{
  constructor(type){
    super('Bot')
    this.type = type
  }

  calculateNextAttactCoordinate(){
    return 2
  }
}


class Game {
  constructor(width, player1, bot){
    this.width = width

    this.playerDivs = []
    this.botDivs = []

    this.player1 = player1
    this.bot = bot
  }

  // the arrow syntax is intention to get the 'this.playerDivs' lex context
  handleMouseOver = (e) => {
    const currentDivIndex = this.playerDivs.indexOf(e.target)
    const coordinates = calculateCoordinates(currentDivIndex, this.width )
    
    const neighbour1Index = getIndexFromCoordinates(coordinates[0], coordinates[1] - 1, this.width)
    const neighbour2Index = getIndexFromCoordinates(coordinates[0], coordinates[1] + 1, this.width)

    const neighbours = [currentDivIndex, neighbour1Index, neighbour2Index]
    neighbours.forEach( index => {
      if (this.isIndexValid(index)) this.playerDivs[index].classList.add('grid-hightlight')
    })
  }

  handleMouseOut = (e) => {
    const currentDivIndex = this.playerDivs.indexOf(e.target)
    const coordinates = calculateCoordinates(currentDivIndex, this.width )
    
    const neighbour1Index = getIndexFromCoordinates(coordinates[0], coordinates[1] - 1, this.width)
    const neighbour2Index = getIndexFromCoordinates(coordinates[0], coordinates[1] + 1, this.width)

    const neighbours = [neighbour1Index, neighbour2Index]
    neighbours.forEach( index => {
      if (this.isIndexValid(index)) this.playerDivs[index].classList.remove('grid-hightlight')
    })
  }

  // utiltiy method to check if the index is within the grid array
  // coordinates should be checked before doing anything to it
  isIndexValid(calculatedIndex){
    return calculatedIndex >= 0 && calculatedIndex < this.width ** 2
  }

  createGrid(){
    const playerGridDiv = document.querySelector('.player-grid')
    const botGridDiv = document.querySelector('.bot-grid')

    for (let i = 0; i < this.width ** 2; i++){
      
      const playerDiv = document.createElement('div')
      playerDiv.classList.add(DEFAULT_GRID_COLOR)
      playerDiv.addEventListener('mouseover', this.handleMouseOver)
      playerDiv.addEventListener('mouseout', this.handleMouseOut)

      this.playerDivs.push(playerDiv)
      playerGridDiv.appendChild(playerDiv)
      
      const botDiv = document.createElement('div')
      botDiv.classList.add(DEFAULT_GRID_COLOR)

      this.botDivs.push(botDiv)
      botGridDiv.appendChild(botDiv)
    }
  }

  checkGameWon(){

  }

}


window.addEventListener('DOMContentLoaded', () => {

  const player1 = new Player()
  const bot = new Bot()
  
  const game = new Game(10, player1, bot)
  game.createGrid()
  
})