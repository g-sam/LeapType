const Leap = require('leapjs');
const ipc = require('electron').ipcRenderer;
const settings = require('electron-settings');
const robot = require('./robot.js')

const pi2 = 2 * Math.PI;
const c = document.getElementsByTagName("canvas")[0];
const ctx = c.getContext("2d");
const history = [[null],[null]]; //null is out; 0 is home; over 0 is a segment from th=0
let zone = null;

let normals, crosshairSize, gap; 
let lineWidth, fillStyle, strokeStyle;
let leftHome, rightHome, homeRadius, homes, segmentAngle; 
let xDim, yDim;
let mult, centres, r, norms; //scaled to canvas

/* initialise */
settings.get().then((params) => {
  robot.init(params.keymap);
  gap = params.gap;
  crosshairSize = params.crosshairSize;
  segmentAngle = pi2 / params.noSegments;
  leftHome = flipY(params.leftHome); 
  rightHome = flipY(params.rightHome);
  homes = [leftHome, rightHome]; 
  homeRadius = params.homeRadius;
  normals = (rightHome[0] - leftHome[0] - gap - 2 * homeRadius) / 2;
  lineWidth = params.lineWidth;
  fillStyle = params.fillStyle;
  strokeStyle = params.strokeStyle;

  yDim = 2 * normals + 2 * homeRadius + gap; 
  xDim = yDim * 2;

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  launch();
});

/* transform leapmotion y coordinates to canvas y coordinates */ 
function flipY(pos){
  return [pos[0], 1 - pos[1], pos[2]];
}

/* transform coordinates to exclude white space */ 
function trim(xy) {
  const x = xy[0] - (1 - xDim) + gap / 2;
  const y = xy[1] - (1 - yDim) + gap / 2;
  return [x / xDim, y / xDim]
}

/* scale coordinates to canvas size */
function xCanvas(val){
  mult = (c.width / xDim) < (c.height / yDim) ? (c.width / xDim) : (c.height / yDim);
  if (Array.isArray(val)) return trim(val).map(v => v * mult);
  else return val * mult 
}

/*scale parameters for drawing to canvas and redraw*/
function resizeCanvas(){
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  centres = homes.map(xCanvas);
  r = xCanvas(homeRadius);
  norms = xCanvas(normals);
  refresh()
}

function drawNormal(th, side){
  ctx.beginPath();
  ctx.moveTo(r * Math.cos(th) + centres[side][0], r * Math.sin(th) + centres[side][1])
  ctx.lineTo((r + norms) * Math.cos(th) + centres[side][0], (r + norms) * Math.sin(th) + centres[side][1])
  ctx.stroke()
}

/* redraw circles and normals */
function refresh(){
  ctx.clearRect(0, 0, c.width, c.height)
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  ctx.arc(...centres[0], r, 0, pi2); 
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(...centres[1], r, 0, pi2); 
  ctx.stroke();
  for (let th = 0; th < pi2; th += segmentAngle){
    drawNormal(th, 0);
    drawNormal(th, 1);
  }
}

function fillZone(zone, side) {
  if (zone === null) return 
  ctx.beginPath();
  if(zone === 0) {
    ctx.fillStyle = fillStyle;
    ctx.arc(...centres[side], r, 0, pi2); 
  } else if (zone === 'pull') {
    ctx.fillStyle = '#228B22'; //green
    ctx.arc(...centres[side], r, 0, pi2); 
  } else if (zone === 'push') {
    ctx.fillStyle = '#7f7fff'; //blue
    ctx.arc(...centres[side], r, 0, pi2); 
  } else {
    ctx.fillStyle = fillStyle;
    const th1 = ((zone - 1) / 5) * pi2;
    const th2 = (zone / 5) * pi2;
    ctx.arc(...centres[side], r, th1, th2, false); 
    ctx.arc(...centres[side], (r + norms), th2, th1, true); 
  } 
  ctx.fill();
}

function checkZ (pos) {
  let radius = homeRadius * 6;
  if (pos[2] > 0.5 + radius) return 'pull' 
  if (pos[2] < 0.5 - radius) return 'push' 
  return null
}

function getZone(frame, side) {
  if (!handsReady(frame)) return null;
  const pos = getPalmPos(frame, side);
  if (checkZ(pos)) return checkZ(pos);
  const home = homes[side];
  const relPos = [pos[0] - home[0], pos[1] - home[1]]
  const radius = Math.sqrt(Math.pow(relPos[0], 2) + Math.pow(relPos[1], 2));
  let th = pi2 - ((pi2 - Math.atan2(relPos[1], relPos[0])) % pi2);
  return (radius < homeRadius) ? 0 : Math.ceil((th * 5) / pi2);
}

/* get position of palm, reversing crossed hands */
function getPalmPos(frame, side){
  const box = frame.interactionBox;
  const hands = frame.hands;
  const leftX = box.normalizePoint(hands[0].palmPosition);
  const rightX = box.normalizePoint(hands[1].palmPosition);
  let pos;
  if (leftX <= rightX) pos = box.normalizePoint(hands[side].palmPosition);
  else {
    if (side === 0) pos = box.normalizePoint(hands[1].palmPosition);
    else pos = box.normalizePoint(hands[0].palmPosition);
  }
  return flipY(pos)
}

/* check if both hands are tracked */
function handsReady(frame){
  if (!frame) return false;
  const box = frame.interactionBox;
  const hands = frame.hands;
  if (hands.length === 2 && hands[0].valid && hands[1].valid) {
    return true;
  } else {
    return false;
  }
}

function drawCrosshairs(frame){
  let pos = [null, null];
  const size = crosshairSize; 
  for (side = 0; side < 2; side++) {
    pos = getPalmPos(frame, side);
    p1 = xCanvas([(pos[0] - size), pos[1]]);
    p2 = xCanvas([(pos[0] + size), pos[1]]);
    p3 = xCanvas([pos[0], (pos[1] - size)]);
    p4 = xCanvas([pos[0], (pos[1] + size)]);
    ctx.beginPath();
    ctx.moveTo(...p1);
    ctx.lineTo(...p2);
    ctx.moveTo(...p3);
    ctx.lineTo(...p4);
    ctx.strokeStyle = '#FF0000';
    ctx.stroke();
  }
}

/* start leapmotion loop */
function launch(){
  const controller = Leap.loop({
    background: true,
    frameEventName: 'deviceFrame',
  }, (frame) => {
    refresh();
    for (side = 0; side < 2; side++) {
      zone = getZone(frame, side);
      fillZone(zone, side);
      if(history[side][history[side].length - 1] !== zone) {
        if (zone === null){
          history[side] = [null];
        } else if (zone === 0) {
          robot.type(history[side], side);
          history[side] = [0];
        } else if (history[side][0] === 0) {
          history[side].push(zone);
        }
      }
    }
    if (handsReady(frame)) drawCrosshairs(frame);
  });
}
