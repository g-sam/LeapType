# LeapType

Fingerless typing for the RSI afflicted, using LeapMotion sensor.

## Concept

This app allows you to visualise the position of your palms on a vertical 2D plane parallel to the LeapMotion sensor and type by making small circular motions with your hands. Two 'home' circles are defined, one for each hand, as well as (by default) six sectors radiating out from each home circle. Letters are typed by moving from 'home' to a sector and back. Further combinations are acheived by moving from a sector to an adjacent sector, or two adjacent sectors, before returning to home.

The radius and separation of the home circles as well as the number of sectors are parametrised. Some experimentation is necessary to determine the optimal parameters. 

## To run

```bash
npm install
```

Plug in LeapMotion and turn on tracking. Ensure 'Allow hand tracking' and 'Allow background apps' are enabled in settings. Then to start typing:

```bash
npm start
```

## Todo

- allow leapmotion to be connected after launch.
- customise menus and icons.
- build preferences window.
- consider facetracking or additional switches for cmd and shift
- display letters as they are selected
