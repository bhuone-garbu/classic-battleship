##### Update

I noticed that Safari and other browser does not yet have ES6 syntax. So I have now removed all the array syntax (`=>`) and added back the tranditional `function()` with `bind(this)` for compatibility reasons.

# Classic Battleship

A browser based classic battleship game written in pure vanilla Javascript - using CSS/Flexbox for layout and display.

## Design and concepts
In my head, the concept was to make a command center briefcase like we see on the movies for this game. :joy: :joy: :joy:
![Command center suitcase](https://i.imgur.com/004i4KS.png)

And that was my inspiration for making the current layout.
![Desktop view of the board](/res/images/screenshots/desktop-view.png?raw=true "Desktop view")

There are lots of things I wanted to try like animations but the game itself and logic was my priority. So simplicity, I opted for a darker theme and _modern_-like look and feel.

I used the following CSS property to get the prespective effect for the bottom player container.
```css
.player-container {
  transform: perspective(1400px) rotateX(30deg) scale(1.12) translateY(-20px);
}
```

However, for screen width that are too small, the prespective was removed as it didn't make sense.
<p align="center">
  <img src="/res/images/screenshots/mobile-view.png" width="400px" alt="Mobile view">
</p>

The `div`s for the grid on both sides are dynamically created from javascript and stored in an array. It's a single array of `div` items - no 2D array is used to keep it simple.

Since it's a 10x10 grid, on CSS, `flex` display was used with `wrap` on the parent container and `flex-basis` of 10% for the child `div`s so that thre is always 10 items on each rows.

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

To get the `X` and `Y` from an `divIndex`, the following math is be used:
```javascript
const x = divIndex % boardWidth
const y = Math.floor(divIndex / boardWidth)
```
where `boardWidth` is the total number of columns of the board. For now, it's 10x10 grid system so number of rows is equal to columns. While these `x` and `y` coordinates does not really need to be calculated, it helps with semantics and logical way of reasoning.

Once I knew how to navigate the `div`s using these maths, the rest was just simply listening for events and manupulating the DOM from Javascript to add/remove CSS classes and styles appropriately.

## Rules
* 2 players in total - each player deploys all their ships on the 10x10 board.
* Player can click any of the ships and then click on board to deploy. The axis can be roated by pressing the `rotate` button on the grid.
* Ships cannot be deployed over previously chosen deployed ship coordinates. The UI won't allow you. :wink: 
* The bot will randomly choose its coordinates deploy all its ships as well after the player finishes deploying.
* Each player takes turn to attack at opponents coordinates to destroy all their ships - the (human) player start first.
* The game will tell which ship was destroyed - that's given.
* Whoever destroys all the opponents before wins the game. Simple!

## Bot logic (pseudo algorithm)
There are lots of improvements that could be done for the bot intelligence. Here is my current implementation for the bot's logic:

1. Scan the board for not previously hit coordinates and attack at random until a coordinate is found for one of the opponents' ships. The bot records all the coordinates that it attacked to not hit the same coordinate twice.
2. If a **hit** coordinate was found, attack either of its top, right, bottom and left side that was not attacked until another **hit** coordinate is found. This way, the ship placement axis - horizontal or vertical - can be determined.
3. Keep attacking the axis until the ship is destroyed. If, by any chance, the bot reaches the end of the coordinate and the ship isn’t destroyed, try the other end until the ship is destroyed. Record the destroyed ship coordinates.
4. During the process, if the bot happen to hit any other coordinates that was not the destroyed ship coordinates - this can happen when ships are place in adjacent coordinates - it will repeat the process from point **2** from the hit coordinates until the ship is destroyed again.
5. Else, start from **1** again keeping in mind to not attack *tight coordinates* because there won't be any ship. *Tight coordinates* are ones where it’s top, right, bottom and left coordinates have already been attacked.

This should more or less match human decision making for attacking the coordinates except for random attacks.

## Planned features
* Redeploy the ships
* More controls for mobile and touch screen
* More responsive design for smaller design - tidying up the CSS a notch.
* Allow the user to redeploy a ship in case the player made a mistake.
* Implement a better search function for bot instead of random attack. As the game progresses, the probability of a ship being on a certain area increases since we know which ships are remanining on the board.
* Support more cells on the board and shootout mode with limited attacks.

## Caveats
The game was meant to be played on desktop. Should the user wish to play the game on mobile, this is still fine. However, any mouseover effects won’t be available on touch screen device unless they **long press** and hold on the cell.

Recommended browser: **Chrome** or **Brave**
