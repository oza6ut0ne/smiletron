"use strict";
const path = require('path');
const { app, BrowserWindow } = require('electron');
const electronScreen = require('electron').screen;

app.on('ready', () => setTimeout(onAppReady, 2000));
function onAppReady() {
    const size = electronScreen.getPrimaryDisplay().size;
    const [width, height, numDisplays] = decideWindowSize();
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
            devTools: false,
            preload: path.join(__dirname, 'js/preload.js')
        }
    });
    mainWindow.setSize(width, height);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setIgnoreMouseEvents(true);
    mainWindow.loadURL('file://' + __dirname + '/html/index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    if (process.env.NODE_ENV === 'development') {
        if (!BrowserWindow.getDevToolsExtensions().hasOwnProperty('devtron')) {
            BrowserWindow.addDevToolsExtension(require('devtron').path);
        }
    }

    startServer(mainWindow.webContents, numDisplays);
}

function decideWindowSize() {
    const isMultiDisplayForced = process.argv.some(a => {
        return a === '--multi-display' || a === '-m'
    })

    const displays = electronScreen.getAllDisplays();
    if (!isDisplaySizesEqual(displays) && !isMultiDisplayForced) {
        const size = electronScreen.getPrimaryDisplay().size;
        return [size.width, size.height, 1];
    }

    const numDisplays = displays.length;
    var width = 0;
    var height = 0;
    displays.forEach(d => {
        width += d.size.width;
        height = height < d.size.height ? d.size.height : height;
    })
    return [width, height, numDisplays];
}

function isDisplaySizesEqual(displays) {
    if (displays.length === 1) return true;
    const size = displays[0].size;
    return displays.slice(1).every(d => {
        return d.size.width === size.width && d.size.height === size.height
    });
}

function startServer(webContents, numDisplays) {
    const net = require('net');
    net.createServer(conn => {
        conn.on('data', data => {
            webContents.send('comment', data.toString(), numDisplays)
            conn.end();
        });
    }).listen(2525);
}
