import path from 'path';
import yargs from 'yargs';
import { app, BrowserWindow, Display, Rectangle } from 'electron';
import { screen as electronScreen } from 'electron';

import { startTcpServer } from './coment-source/tcpServer';
import { config } from './config';
import { setupIpcHandlers } from './ipc';
import { setupMenu, tray } from './menu';
import { Rect } from './types';

const mainUrl = `file://${__dirname}/html/index.html`;
const assetsPath = app.isPackaged ? path.join(process.resourcesPath, 'assets') : 'src/assets';
const iconPath = path.join(assetsPath, 'icon.png');
const args = yargs(process.argv.slice(1)).options({
    p: { type: 'number', alias: 'port', default: config.listenPort,
         description: 'Listen port. Set -1 to disable.' },
    b: { type: 'string', alias: 'bind', default: config.bindAddress,
         description: 'Bind address.' },
    c: { type: 'boolean', alias: 'clear-config',
         description: 'Clear config and exit.' }
}).argv;


if (args.c) {
    config.clear();
    app.quit();
}

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.whenReady().then(() => setTimeout(onAppReady, 2000));
app.on('window-all-closed', app.quit);

function onAppReady() {
    const isSingleWindowForced = config.useMultiWindow === 'disabled';
    const isMultiWindowForced = config.useMultiWindow === 'enabled';

    const displays = electronScreen.getAllDisplays();
    const isSingleWindow = isSingleWindowForced || (!isMultiWindowForced && isDisplaySizesEqual(displays));
    const rects = calcWindowRects(displays, isSingleWindow);
    const windows = rects.map(r => createWindow(r));
    setupMenu(iconPath);

    const commentSender = setupIpcHandlers(windows, isSingleWindow, displays.length);
    startTcpServer(commentSender, args.p, args.b);
}

function createWindow(rect: Rectangle): BrowserWindow {
    let window: BrowserWindow | null = new BrowserWindow({
        x: rect.x,
        y: rect.y + 1,
        width: rect.width,
        height: rect.height,
        enableLargerThanScreen: true,
        frame: false,
        icon: iconPath,
        show: true,
        transparent: true,
        backgroundColor: "#00000000",
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        webPreferences: {
            devTools: process.env.NODE_ENV === 'development',
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    window.setSize(rect.width, rect.height);
    window.setBounds(rect);
    window.setAlwaysOnTop(true, 'screen-saver');
    window.setIgnoreMouseEvents(true);
    window.setSkipTaskbar(true);
    window.loadURL(mainUrl);

    window.on('closed', () => {
        window = null;
    });
    window.on('minimize', () => {
        if (BrowserWindow.getAllWindows().every(w => w.isMinimized())) {
            tray?.setToolTip(app.name + ' (minimized)');
        }
    });
    window.on('restore', () => {
        tray?.setToolTip(app.name);
    });

    return window;
}

function calcWindowRects(displays: Display[], isSingleWindow: boolean): Rect[] {
    if (!isSingleWindow) {
        if (process.platform === 'linux') {
            return displays.sort((a, b) => b.workArea.x - a.workArea.x).map(d => d.workArea);
        } else {
            return displays.sort((a, b) => b.bounds.x - a.bounds.x).map(d => d.bounds);
        }
    }

    var width = 0;
    var minHeight = Infinity;
    displays.forEach(d => {
        let bounds = (process.platform === 'linux') ? d.workArea : d.bounds;
        width += bounds.width;
        minHeight = minHeight < bounds.height ? minHeight : bounds.height;
    });
    return [{x: 0, y:0, width: width, height: minHeight}];
}

function isDisplaySizesEqual(displays: Display[]) {
    if (displays.length === 1) {
        return true
    };
    const size = displays[0].size;
    return displays.slice(1).every(d => {
        return d.size.width === size.width && d.size.height === size.height;
    });
}
