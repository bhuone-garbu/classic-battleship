const FLEETS = ['destroyer', 'submarine', 'battleship', 'carrier']

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

  createGrid(){
    const playerGridDiv = document.querySelector('.player-grid')
    const botGridDiv = document.querySelector('.bot-grid')

    for (let i = 0; i < this.width ** 2; i++){
      const playerDiv = document.createElement('div')
      this.playerDivs.push(playerDiv)
      playerGridDiv.appendChild(playerDiv)
      
      const botDiv = document.createElement('div')
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