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

app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('ready', function () {
    mainWindow = new BrowserWindow({
        'node-integration': true,
        'width': 512,
        'height': 768,
        'max-width': 640,
        'max-height': 800,
        'min-width': 400,
        'min-height': 600 
    });


    mainWindow.loadUrl('file://' + __dirname + '/../browser/index.html');

    // Check For Updated Version
    update.check(function (err, status) {
        if (!err && status) {
        update.download()
        }
    })

    // mainWindow.webContents.on('did-finish-load', function () {
    //     mainWindow.setTitle('My Title');
    // });

    // DevTools
    // mainWindow.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
        app.quit();
    });
});