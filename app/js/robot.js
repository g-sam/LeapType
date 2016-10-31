const robot = require ("robotjs");
let keys;

function type(history, side) {
  if (!keys) {
    console.log('Initialise robot with keymap')
    return
  }
  console.log(history)
  const string = keys[side][history.join('').slice(1)];
  console.log(string)
  if (string) robot.keyTap(string);
}

function init(keymap){
  keys = keymap
}

module.exports = {
  type,
  init,
};
