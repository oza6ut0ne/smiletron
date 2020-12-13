import net from 'net';
import path from 'path';
import { app, BrowserWindow, Display, ipcMain, Rectangle } from 'electron';
import { screen as electronScreen } from 'electron';
import { setupTray, tray } from './tray';

const mainUrl = `file://${__dirname}/html/index.html`;
const assetsPath = app.isPackaged ? path.join(process.resourcesPath, 'assets') : 'src/assets';
const iconPath = path.join(assetsPath, 'icon.png');
let commentCount = 0;


app.on('ready', () => setTimeout(onAppReady, 2000));
app.on('window-all-closed', () => app.quit());

function onAppReady() {
    const isSingleWindowForced = process.argv.some(a => {
        return a === '--single-window' || a === '-s';
    });

    const isMultiWindowForced = process.argv.some(a => {
        return a === '--multi-window' || a === '-m';
    });

    const displays = electronScreen.getAllDisplays();
    const isSingleWindow = isSingleWindowForced || (!isMultiWindowForced && isDisplaySizesEqual(displays));
    const rects = calcWindowRects(displays, isSingleWindow);
    const windows = rects.map(r => createWindow(r));

    if (process.platform !== 'darwin') {
        setupTray(iconPath);
    }
    setupIpcHandlers(windows);
    startServer(windows, isSingleWindow, displays.length);
}


function createWindow(rect: Rectangle): BrowserWindow {
    let window: BrowserWindow | null = new BrowserWindow({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        enableLargerThanScreen: true,
        frame: false,
        icon: iconPath,
        show: true,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        type: 'dock',
        alwaysOnTop: true,
        webPreferences: {
            devTools: process.env.NODE_ENV === 'development',
            preload: path.join(__dirname, 'js/preload.js')
        }
    });
    window.setSize(rect.width, rect.height);
    window.setAlwaysOnTop(true, 'screen-saver');
    window.setIgnoreMouseEvents(true);
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
    window.webContents.on('devtools-closed', () => window?.reload());

    return window;
}

function calcWindowRects(displays: Display[], isSingleWindow: boolean): Rect[] {
    if (!isSingleWindow) {
        return displays.sort((a, b) => b.bounds.x - a.bounds.x).map(d => d.bounds);
    }

    var width = 0;
    var minHeight = Infinity;
    displays.forEach(d => {
        width += d.size.width;
        minHeight = minHeight < d.size.height ? minHeight : d.size.height;
    });
    return [{x: 0, y:0, width: width, height: minHeight}];
}

function isDisplaySizesEqual(displays: Display[]) {
    if (displays.length === 1) return true;
    const size = displays[0].size;
    return displays.slice(1).every(d => {
        return d.size.width === size.width && d.size.height === size.height;
    });
}

function setupIpcHandlers(windows: BrowserWindow[]) {
    ipcMain.on('comment-arrived-to-left-edge',
        (event: any, text: string, commentCount: number, offsetTopRatio: number,
        senderWindowIndex: number, numDisplays: number, isSingleWindow: boolean) => {
            sendCommentToRenderer(text, commentCount, offsetTopRatio, windows, senderWindowIndex + 1, numDisplays, isSingleWindow);
    });
}

function sendCommentToRenderer(text: string, commentCount: number, offsetTopRatio: number,
        windows: BrowserWindow[], windowIndex: number, numDisplays: number, isSingleWindow: boolean) {
    const indexOffset = windows.slice(windowIndex).findIndex(w => !w.isDestroyed());
    if (indexOffset === -1) {
        return;
    }
    const availableWindowIndex = windowIndex + indexOffset;
    windows[availableWindowIndex].webContents.send(
        'comment', text, commentCount, offsetTopRatio, availableWindowIndex, numDisplays, isSingleWindow);
}

function startServer(windows: BrowserWindow[], isSingleWindow: boolean, numDisplays: number) {
    net.createServer(conn => {
        conn.on('data', data => {
            commentCount += 1;
            const offsetTopRatio = Math.random() * 0.9;
            sendCommentToRenderer(data.toString(), commentCount, offsetTopRatio, windows, 0, numDisplays, isSingleWindow);
            conn.end();
        });
    }).listen(2525);
}

interface Rect {
    x: number;
    y: number;
    height: number;
    width: number;
}
