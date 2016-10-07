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
  homeRadius: 0.075,
};


settings.defaults(params);
