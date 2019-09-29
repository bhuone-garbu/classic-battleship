# Classic Battleship

A browser based classic battleship game written in pure Vanilla Javascript - using CSS/Flexbox for layout and display.

## Design and concepts
In my head, the concept was the make a command center briefcase like we see on the movies for this game. 
![Command center suitcase](https://i.imgur.com/004i4KS.png)

And that was it for my inspiration for making the layout into this.



## Rules


## Bot logic
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
