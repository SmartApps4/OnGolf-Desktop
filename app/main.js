'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var env = require('./vendor/electron_boilerplate/env_config');
var devHelper = require('./vendor/electron_boilerplate/dev_helper');
var windowStateKeeper = require('./vendor/electron_boilerplate/window_state');
var gh_releases = require('electron-gh-releases');
var shell = require('shell');
var moment = require('moment');

var mainWindow;

moment().format();

// github release updater options
var options = {
  repo: 'SmartApps4/OnGolf-Desktop',
  currentVersion: app.getVersion()
}

var update = new gh_releases(options, function (auto_updater) {
  // Auto updater event listener
  auto_updater.on('update-downloaded', function (e, rNotes, rName, rDate, uUrl, quitAndUpdate) {
    // Install the update
    quitAndUpdate()
  })
})

// Preserver of the window size and position between app launches.
var mainWindowState = windowStateKeeper('main', {
    width: 512,
    height: 768
});


function checkForUpdate () {
    console.log('checking for updates!');
    update.check(function (err, status) {
    if (!err && status) {
      update.download()
        }
    })
}

function createMainWindow () {
    const win = new BrowserWindow({
        'node-integration': true,
        'x': mainWindowState.x,
        'y': mainWindowState.y,
        'width': mainWindowState.width,
        'height': mainWindowState.height,
        'max-width': 640,
        'max-height': 800,
        'min-width': 400,
        'min-height': 600  
});


function onClosed() {
    // deref the window
    // for multiple windows store them in an array
    mainWindowState.saveState(mainWindow);
    mainWindow = null;
}

if (mainWindowState.isMaximized) {
        win.maximize();
    }

    //only works after build
    win.loadUrl('file://' + __dirname + '/index.html');

    win.on('closed', onClosed);

    if (env.name === 'development') {
        devHelper.setDevMenu();
        win.openDevTools();
    }

    return win;
}

//when ready create Main Window
app.on('ready', function () {
    checkForUpdate();
    mainWindow = createMainWindow();  
});

//Quit App - If Mac - only deref the window 
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

//MAC ONLY - If click icon - reactive window
 app.on('activate-with-no-open-windows', function () {
    if (!mainWindow) {
      mainWindow = createMainWindow();
    }
});
