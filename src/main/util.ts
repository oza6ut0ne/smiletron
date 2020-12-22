import { app, BrowserWindow } from 'electron';

export const isLinux = process.platform === 'linux';
export const isWindows = process.platform === 'win32';
export const isMac = process.platform === 'darwin';
export const isAppImage = isLinux && app.isPackaged && app.getPath('exe').startsWith('/tmp/.mount_');
export const isExe = isWindows && app.isPackaged;


export function restoreWindow(window: BrowserWindow | null) {
    if ((window === null) || window.isDestroyed()) {
        return;
    }

    if (isWindows) {
        window.restore();
    } else {
        window.show();
    }
}

export function aliveOrNull(window: BrowserWindow): BrowserWindow | null {
    return window.isDestroyed() ? null : window;
}
