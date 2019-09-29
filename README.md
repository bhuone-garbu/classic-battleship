# Classic Battleship

A browser based classic battleship game written in pure Vanilla Javascript - using CSS/Flexbox for layout and display.

## Design and concepts
In my head, the concept was the make a command center briefcase like we see on the movies for this game. 
![Command center suitcase](https://i.imgur.com/004i4KS.png)

And that was it for my inspiration for making the layout into this.
![Desktop view of the board](/res/images/screenshots/desktop-view.png?raw=true "Desktop view")

There are lots of things I wanted to try like animations but the game itself and logic was my priority. However, for screen that are too small, the prospective is removed.
<p align="center">
  <img src="/res/images/screenshots/mobile-view.png" width="400px" alt="Mobile view">
</p>

The `div`s for the grid on both sides are dynamically created from javascript and stored in an array. It's a single array of `div` items - no 2D array is used to keep it simple.

To get the `X` and `Y` from an `divIndex`, the following math is be used:
```javascript
const x = divIndex % boardWidth
const y = Math.floor(divIndex / boardWidth)
```
where `boardWidth` is the total number of columns of the board. For now, it's 10x10 grid system so number of rows is equal to columns. So on CSS, a `flex` display was used with `wrap` and `flex-basis` of 10% for the child `div`s so that thre is always 10 items on each rows.

```css
.player-grid, .bot-grid {
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.player-grid div, .bot-grid div {
  flex-basis: 10%;
  min-height: 30px;
}
```

Then the rest is just maths and DOM manupulation from javascript to add/remove CSS classes and styles


## Rules
* 2 players in total - each player deploys all their ships on the 2x2 coordinates
* The bot will randomly choose its coordinates deploy all its ships as well after the player finishes deploying.
* Each player takes turn to attack at opponents coordinates to destroy all their ships - the (human) player start first
* Whoever destroys all the opponents before wins the game. Simple!

## Bot logic (pseudo algorithm)
1. Scan the board for not previously hit coordinates and attack at random until a coordinate is found for one of the fleets. The bot records all the coordinates that it attacked to not hit the same coordinate twice.
2. If a **hit** coordinate is found, attack its top, right, bottom and left side until another **hit** coordinate is found. This way, the fleet placement axis - horizontal or vertical - can be found.
3. Keep attacking the axis until the fleet is destroyed. If by any chance, the bot reaches the end of the coordinate and the fleet isn’t destroyed, try the other end until the fleet is destroyed. Record the destroyed fleet coordinates.
4. During the process, if the bot happen to hit any other coordinates that was not the destroyed fleet coordinates - this can happen when fleets are place in adjacent coordinates - repeat **2** from the hit coordinates until the fleet(s) are destroyed.
5. Else, start from **1** again keeping in mind to not attack *tight coordinates*  because it is just a waste. *Tight coordinates* are ones where it’s top, right, bottom and left coordinates have already been attacked.

## Planned features
* Redeploy the ships
* More controls for mobile, touch screen and feedbacks
* More responsive design for smaller design - tidying up.
* Allow the user to redeploy a mistakenly placed fleet.
* Implement a better search function instead of random for the bot - as the game progresses, the probability of a fleet being on a certain area increases.
* Support more cells on the board and shootout mode with limited attacks available.

## Conveats
The game was meant to be played on desktop. Should the user wish to play the game on mobile, this is still fine. However, any mouseover effects won’t be available on touch screen device. The user can still use the **rotate** button to rotate the placement but it might not be obvious. The grid `div` element were created programmatically from javascript and the code uses ES6 arrow syntax. So Safari is completely off the table as I’ve noticed some version of Safari browser does not support that arrow syntax hence `div`s won’t even be generated.
