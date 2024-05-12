import { execFile } from 'child_process';
import { app, BrowserWindow } from 'electron';

export const isLinux = process.platform === 'linux';
export const isWindows = process.platform === 'win32';
export const isMac = process.platform === 'darwin';
export const isAppImage = isLinux && app.isPackaged && app.getPath('exe').startsWith('/tmp/.mount_');
export const isX11 = isLinux && process.env.XDG_SESSION_TYPE === 'x11';
export const isExe = isWindows && app.isPackaged;
export const execPath = isExe ? process.env.PORTABLE_EXECUTABLE_FILE : undefined;


export function skipTaskbar(window: BrowserWindow | null, skip: boolean) {
    if ((window === null) || window.isDestroyed()) {
        return;
    }

    window.setSkipTaskbar(skip);
    if (!isX11) {
        return;
    }

    const windowId = window.getMediaSourceId().split(':')[1];
    const op = skip ? 'add' :'remove';
    execFile('wmctrl', ['-i', '-r', `${windowId}`, '-b', `${op},skip_taskbar`], (error, _stdout, _stderr) => {
        if (error instanceof Error) {
            console.warn(`Failed to skip taskbar: ${error.message}`);
        }
    });
}

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

export function tryRelaunch() {
    if (!isAppImage) {
        app.relaunch({ execPath: execPath });
        app.quit();
    }
}
