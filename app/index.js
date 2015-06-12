'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var shell = require('shell');
var moment = require('moment');

//auto-updater
var gh_releases = require('electron-gh-releases');

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

moment().format();

require('crash-reporter').start();

var mainWindow = null;

// app.on('ready', function () {
//     mainWindow = new BrowserWindow({
//         'node-integration': true,
//         'width': 512,
//         'height': 768,
//         'max-width': 640,
//         'max-height': 800,
//         'min-width': 400,
//         'min-height': 600 
//     });


//     mainWindow.loadUrl('file://' + __dirname + '/../browser/index.html');

//     // Check For Updated Version
//     update.check(function (err, status) {
//         if (!err && status) {
//         update.download()
//         }
//     })

function createMainWindow () {
    const win = new BrowserWindow({
        'node-integration': true,
        'width': 512,
        'height': 768,
        'max-width': 640,
        'max-height': 800,
        'min-width': 400,
        'min-height': 600 
    });

    win.loadUrl('file://' + __dirname + '/../browser/index.html');

    win.on('closed', onClosed);

    update.check(function (err, status) {
        console.log('checking for update');
        if (!err && status) {
        update.download()
        }
    })

     // DevTools
    win.openDevTools();

    return win;
}

function onClosed() {
    // deref the window
    // for multiple windows store them in an array
    mainWindow = null;
}


 app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

    //reactive for mac
 app.on('activate-with-no-open-windows', function () {
        if (!mainWindow) {
            mainWindow = createMainWindow();
        }
    });

 app.on('ready', function () {
    mainWindow = createMainWindow();
});

    // mainWindow.webContents.on('did-finish-load', function () {
    //     mainWindow.setTitle('My Title');
    // });

    // DevTools
    // mainWindow.openDevTools();

    // mainWindow.on('closed', function () {
    //     mainWindow = null;
    //     app.quit();
    // });
// });