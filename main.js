const electron = require('electron');
const settings = require('electron-settings');
require('./app/js/style-config.js');
settings.resetToDefaultsSync(); //dev only
const settingsPromise = settings.get();
const app = electron.app;
const ipc = electron.ipcMain;
const BrowserWindow = electron.BrowserWindow;
let win;

function createWindow () {
  settingsPromise.then(params => {
    win = new BrowserWindow({
      width: 500,
      height: 250,
      minWidth: 100,
      minHeight: 50,
      //focusable: false,
      alwaysOnTop: true,
    });
    win.loadURL(`file://${__dirname}/app/index.html`);
    win.setAspectRatio(2 / 1);
    win.on('closed', function () {
      win = null;
    })
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (win === null) {
    createWindow()
  }
});
