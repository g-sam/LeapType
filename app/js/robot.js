const robot = require ("robot-js");
const keyboard = robot.Keyboard();
let keys;

keyboard.autoDelay.min = 5;
keyboard.autoDelay.max = 10;

function type(history, side) {
  if (!keys) {
    console.log('Initialise robot with keymap')
    return
  }
  const string = keys[side][history.join('')];
  keyboard.click(string);
}

function init(keymap){
  keys = keymap;
}

module.exports = {
  type,
  init,
};
