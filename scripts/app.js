
// CSS global class name constants
// const CSS_DEFAULT_GRID_COLOR = 'default-grid-color'
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
  patrol: 3,
  submarine: 2
}

// this array is the source of truth for array of 'fleet' that was used in the game
const playableFleets = []

let lastClickedFleetDiv


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

// we want to create an array of adjacent coordinates from 'previousAttackCoordinates' that are in 'filterCoordinates'
function buildAdjacentCoordinates(previousAttackCoordinates, filterCoordinates){

  // try horizontal first
  const filtered = previousAttackCoordinates.filter( index => !filterCoordinates || !filterCoordinates.includes(index))
  console.log('filtered...', filtered)
  // pick one
  const pivotIndexCoord = getIndexFromXYCoordinates(filtered[0])

  const horizontal = filtered.filter( index => getIndexFromXYCoordinates(index)[1] === pivotIndexCoord[1])
  if (horizontal.length > 1){
    horizontal.sort( (a,b) => a - b)
    return horizontal
  }

  const vertical = filtered.filter( index => getIndexFromXYCoordinates(index)[0] === pivotIndexCoord[0])
  if (vertical.length > 1){
    vertical.sort( (a,b) => a - b)
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
  const filtered = ['N', 'S', 'E', 'W'].filter( key => {
    if (!attackAxis){
      return true
    } else {
      if (attackAxis === 'V') return key === 'N' || key === 'S'
      else return key === 'E' || key === 'W'
    }
  })

  // we need to further check if the coordinate has already been used and within the board size
  return filtered.reduce((acc, key) => {
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

  reportAllDestroyedFleetsCoordinates(){
    return Object.keys(this.deployedFleets).reduce( (acc, fleetName) => {
      if (this.deployedFleets[fleetName].isDestroyed()) acc = acc.concat(this.deployedFleets[fleetName].deployedCoordinates)
      return acc
    }, [] )
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

    // else
    console.log('this.lastSuccessfulAttacks::', this.lastSuccessfulAttacks)
    console.log('this.attackAxis::', this.attackAxis)

    const totalAttacks = this.lastSuccessfulAttacks.length
    let calcVector
    if (totalAttacks > 0){
      calcVector = this.calculateSuitableAttackCoordinate(this.lastSuccessfulAttacks[totalAttacks - 1], this.allAttackedVectors, this.width, this.attackAxis)
      console.log('Using calc vector::: ' + calcVector)
      if (calcVector && calcVector === -1){
        // try again from differnt end
        calcVector = this.calculateSuitableAttackCoordinate(this.lastSuccessfulAttacks[0], this.allAttackedVectors, this.width, this.attackAxis)
        console.log('Retrying using calc vector::: ' + calcVector)
      }
      if (calcVector === -1){
        console.log('Bot is seriously confused...')
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
        console.log('buildAdjacentCoordinates...', this.lastSuccessfulAttacks)
        console.log('this.destroyedFleetCoordinates...', this.destroyedFleetCoordinates)
      }

      fromLastAttacks = this.calculateFromLastSuccessfulAttacks()
    }

    if (fromLastAttacks && fromLastAttacks !== -1 ) return fromLastAttacks

    // else fallback to random attack
    const random = this.randomAttack()
    console.log('Using random::: ', random)
    return random
  }

  storeLastSuccessfulAttack(hitIndex){

    console.log('storing successful attack')
    this.lastSuccessfulAttacks.push(hitIndex)
    this.everySuccessfulAttacks.push(hitIndex)
    if (!this.attackAxis && this.lastSuccessfulAttacks.length > 1) {
      this.attackAxis = calculateCoordinatesDirectionAxis(this.lastSuccessfulAttacks[0], this.lastSuccessfulAttacks[1], this.width)
    }
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
    this.bot = new Bot(this.width)

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
  attackableClickEvent = (e) => {
    
    const grids = this.attackBot ? this.botDivs : this.playerDivs
    const player = this.attackBot ? this.bot : this.humanPlayer
    const indexCoordinate = parseInt(e.target.getAttribute('index'))

    if (!this.bot.attackAttemptsCoordinates.includes(indexCoordinate)){
      if (this.checkAndMarkFleetHit(indexCoordinate, this.attackBot)){
        console.log(player.reportAllDestroyedFleets())
      }
  
      // once clicked/attacked - we don't want to be able to clickable until the bot have attacked the human players as well
      grids.forEach( grid => grid.removeEventListener('click', this.attackableClickEvent ))
      this.checkGameEnded()
      if (!this.gameEnded) {
        this.letBotAttackHuman()
      }

    }
    
  }

  letBotAttackHuman(){
    
    console.log('\n\nBot about to attack....')
    setTimeout(() => {
      const botAttackVector = this.bot.calculateNextAttackVector()
      const lastDesttoyedCount = this.humanPlayer.destroyedFleets
      console.log('allAttackedVectors', this.bot.allAttackedVectors)
      console.log('lastDestroyedFleets count', this.humanPlayer.destroyedFleets)
      console.log('botAttackVector', botAttackVector)
      console.log('Pushing ', botAttackVector, ' in all attacked vectors')
      this.bot.allAttackedVectors.push(botAttackVector)
      
      if (this.checkAndMarkFleetHit(botAttackVector, false)){
        this.bot.storeLastSuccessfulAttack(botAttackVector)
        if (this.humanPlayer.destroyedFleets > lastDesttoyedCount){
          this.bot.destroyedFleetCoordinates = this.humanPlayer.reportAllDestroyedFleetsCoordinates()
          this.bot.resetAttackTactics() //reset after destroying
          console.log('resetting')
        }
      }
      this.checkGameEnded()
      this.addAttackableClickEventsForPlayerGrids()
    }, 600)
    
  }

  
  // reusable click event handle function to hand on the bot grid so human can attack
  addAttackableClickEventsForPlayerGrids(isBot = true) {
    const grids = isBot ? this.botDivs : this.playerDivs
    if (!this.gameEnded) {
      grids.forEach(grid => grid.addEventListener('click', this.attackableClickEvent))
    }
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
    grids[indexCoordinate].classList.add(CSS_FLEET_MISSED)
    for (const fleetName in player.deployedFleets) {
      if (player.deployedFleets[fleetName].isIndexCoordinateMatched(indexCoordinate)) {

        const stateBeforeHit = player.deployedFleets[fleetName].isDestroyed()
        player.deployedFleets[fleetName].markHit(indexCoordinate)
        grids[indexCoordinate].classList.remove(CSS_FLEET_MISSED)
        grids[indexCoordinate].classList.add(CSS_FLEET_ATTACKED)
        hitSuccessful = true

        // increment the destroyed ship count if it was not destroyed but after hiting it, the fleet was destroyed
        if (!stateBeforeHit && player.deployedFleets[fleetName].isDestroyed()){
          console.log( fleetName, ' destroyed')
          player.destroyedFleets++
        }
      }
    }
    
    return hitSuccessful
  }

  deployBotFleets(){
    const deployedCoordinates = this.bot.deployFleetsRandomly(this.width)
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
  //const shipButtons = document.querySelectorAll('.ships button')

  const humanShipDivs = document.querySelectorAll('.player-container .ships div')
  let totalShipsToDeploy = humanShipDivs.length
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
    const shipLength = FLEET_SIZE_INFO[lastClickedFleetDiv.id]
    const cellDivIndex = parseInt(e.target.getAttribute('index'))
    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => game.playerDivs[index].classList.remove(CSS_GRID_HOVER, 'arrow-up'))
    // if (AXIS === 'V') {
    //   game.playerDivs[indexCoordinates[0]].innerHTML = null
    //   // game.playerDivs[indexCoordinates[0]].classList.add('arrow-up')
    // }
  }
  
  function deployMouseclick(e) {
    const shipLength = FLEET_SIZE_INFO[lastClickedFleetDiv.id]
    const cellDivIndex = parseInt(e.target.getAttribute('index'))

    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    if (!indexCoordinates.some( index => game.humanPlayer.allFleetsCoordinates.includes(index))){
      indexCoordinates.forEach( index => {
        game.playerDivs[index].classList.remove(CSS_GRID_HOVER)
        game.playerDivs[index].classList.add(CSS_GRID_SELECT)
        
      })
      game.playerDivs[indexCoordinates[0]].classList.add('arrow-up')
  
      // after each successful click on the board we want to remove all the board hover, mouseout and click events
      clearPlayer1EventListeners()
  
      const fleetName = lastClickedFleetDiv.id
      game.humanPlayer.deployedFleets[fleetName] = new DeployedFleet(fleetName, FLEET_SIZE_INFO[fleetName], indexCoordinates)
      game.humanPlayer.allFleetsCoordinates = game.humanPlayer.allFleetsCoordinates.concat(indexCoordinates)
      
      if ( --totalShipsToDeploy === 0) startButton.disabled = false
      rotateBtn.disabled = true
      lastClickedFleetDiv.removeEventListener('click', addMouseOverOutClickEventInGrid)
    }
    
  }

  function predeployMouseover(e){
    const shipLength = FLEET_SIZE_INFO[lastClickedFleetDiv.id]
    const cellDivIndex = parseInt(e.target.getAttribute('index'))

    const indexCoordinates = calcRelativeCoordinates(cellDivIndex, game.width, shipLength)
    indexCoordinates.forEach( index => game.playerDivs[index].classList.add(CSS_GRID_HOVER))
    // if (AXIS === 'V') {
    //   game.playerDivs[indexCoordinates[0]].classList.remove(CSS_GRID_HOVER)
    //   // game.playerDivs[indexCoordinates[0]].innerHTML = '&#9650;'
    //   game.playerDivs[indexCoordinates[0]].classList.add('arrow-up')
    // }
  }

  function addMouseOverOutClickEventInGrid(e){
    if (!playableFleets.includes(e.currentTarget.id)) playableFleets.push(e.currentTarget.id)
    // record this for later
    lastClickedFleetDiv = e.currentTarget
    rotateBtn.disabled = false
    console.log('playableFleets::', playableFleets)
    
    game.playerDivs.forEach( div => {
      //clearPlayer1EventListeners()
      div.addEventListener('mouseover', predeployMouseover)
      div.addEventListener('mouseout', predeployMouseout)
      div.addEventListener('click', deployMouseclick)
    })
  }

  console.log('humanShipDivs:::', humanShipDivs)
  // add event listners for ships
  humanShipDivs.forEach( shipDiv => {
    console.log('individual div:::', shipDiv)
    shipDiv.addEventListener('click', addMouseOverOutClickEventInGrid)
  })

  
  // rotate means we just need to switch the axis so mouseover, mouseout and click event listener will be reflected based on that
  rotateBtn.addEventListener('click', switchAxis) 

  startButton.addEventListener('click', () => {
    game.deployBotFleets()
    startButton.disabled = true
  })

})
