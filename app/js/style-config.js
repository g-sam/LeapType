const settings = require('electron-settings');

const params = {
  gap: 0.1,
  noSegments: 5,
  lineWidth: 5,
  strokeStyle: '#003300',
  fillStyle: '#DCDCDC',
  crosshairSize: 0.01,
  leftHome: [0.20, 0.3],
  rightHome: [0.8, 0.3],
  homeRadius: 0.1,
};

params.keymap = [null, null];

params.keymap[0] = {
  1: 'a',
  2: 'r',
  3: 's',
  4: 't',
  5: 'd',
  12: 'q',
  23: 'w',
  34: 'f',
  45: 'p',  
  51: 'g',
  21: 'z',
  32: 'x',
  43: 'c',
  54: 'v',
  15: 'b',
  123: '1',
  234: '2',
  345: '3',
  451: '4',
  512: '5',
  push: ' ',
  pull: 'tab'
}

params.keymap[1] = {
  1: 'h',
  2: 'n',
  3: 'e',
  4: 'i',
  5: 'o',
  12: 'j',
  23: 'l',
  34: 'u',
  45: 'y',  
  51: ':',
  21: 'k',
  32: 'm',
  43: ',',
  54: '.',
  15: '/',
  123: '6',
  234: '7',
  345: '8',
  451: '9',
  512: '0',
  push: 'enter',
  pull: 'backspace',
}

settings.defaults(params);
