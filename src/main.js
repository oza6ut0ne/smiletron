"use strict";
const path = require('path');
const { app, BrowserWindow } = require('electron');
const electronScreen = require('electron').screen;

app.on('ready', () => setTimeout(onAppReady, 400));
function onAppReady() {
    var size = electronScreen.getPrimaryDisplay().size;
    var mainWindow = new BrowserWindow({
        left: 0,
        top: 0,
        width: size.width,
        height: size.height,
        frame: false,
        show: true,
        transparent: true,
        resizable: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'js/preload.js')
        }
    });
    mainWindow.setIgnoreMouseEvents(true);
    mainWindow.maximize();
    mainWindow.loadURL('file://' + __dirname + '/html/index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
        if (!BrowserWindow.getDevToolsExtensions().hasOwnProperty('devtron')) {
            BrowserWindow.addDevToolsExtension(require('devtron').path);
        }
    }

    startServer(mainWindow.webContents);
}

function startServer(webContents) {
    const net = require('net');
    net.createServer(function (conn) {
        conn.on('data', function (data) {
            webContents.send('comment', data)
            conn.end();
        });
    }).listen(2525);
}
