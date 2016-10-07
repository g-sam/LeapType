const Leap = require('leapjs');
const ipc = require('electron').ipcRenderer;
const settings = require('electron-settings');

/* Three sets of coordinates: leap-space, display-space, canvas-space */

const pi2 = 2 * Math.PI;
const c = document.getElementsByTagName("canvas")[0];
const ctx = c.getContext("2d");
const history = [[null],[null]]; //null is out; 0 is home; over 0 is a segment from th=0
let zone = null;

let normals, crosshairSize, gap; 
let lineWidth, fillStyle, strokeStyle;
let leftHome, rightHome, homeRadius, homes, segmentAngle; 
let mult, centres, r, norms;
let xDim, yDim;

settings.get().then((params) => {
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

function flipY(array){
  return [array[0], 1 - array[1]];
}

function trim(xy){
  const x = xy[0] - (1 - xDim) + gap / 2;
  const y = xy[1] - (1 - yDim) + gap / 2;
  return [x / xDim, y / xDim]
}

function xCanvas(val){
  mult = (c.width / xDim) < (c.height / yDim) ? (c.width / xDim) : (c.height / yDim);
  if (Array.isArray(val)) return trim(val).map(v => v * mult);
  else return val * mult 
}

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
  ctx.fillStyle = fillStyle;
  console.log('fillin', zone, 'on side', side)
  if(zone === 0) {
    ctx.beginPath();
    ctx.arc(...centres[side], r, 0, pi2); 
    ctx.fill();
  } else {
    const th1 = ((zone - 1) / 5) * pi2;
    const th2 = (zone / 5) * pi2;
    ctx.beginPath();
    ctx.arc(...centres[side], r, th1, th2, false); 
    ctx.arc(...centres[side], (r + norms), th2, th1, true); 
    ctx.fill();
  } 
}

function getZone(frame, side) {
  if (!handsReady(frame)) return null;
  const pos = getPalmPos(frame, side);
  const home = homes[side];
  const relPos = [pos[0] - home[0], pos[1] - home[1]]
  const radius = Math.sqrt(Math.pow(relPos[0], 2) + Math.pow(relPos[1], 2));
  let th = pi2 - ((pi2 - Math.atan2(relPos[1], relPos[0])) % pi2);
  return (radius < homeRadius) ? 0 : Math.ceil((th * 5) / pi2);
}

function getPalmPos(frame, side){
  const box = frame.interactionBox;
  const hands = frame.hands;
  const xy = box.normalizePoint(hands[side].palmPosition);
  return flipY(xy)
}

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

function type(history){
  console.log(history)
}

function launch(){
  const controller = Leap.loop({
    background: true,
    frameEventName: 'deviceFrame',
  }, (frame) => {
    refresh();
    for (side = 0; side < 2; side++) {
      zone = getZone(frame, side);
      if (zone !== null) fillZone(zone, side);
      if(history[side][history[side].length - 1] !== zone) {
        if (zone === null){
          history[side] = [null];
        } else if (zone === 0) {
          type(history[side]);
          history[side] = [0];
        } else if (history[side][0] === 0) {
          history[side].push(zone);
        }
      }
    }
    if (handsReady(frame)) drawCrosshairs(frame);
  });
}
