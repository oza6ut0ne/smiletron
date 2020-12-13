import { app, BrowserWindow, Menu, MenuItem, Tray } from 'electron';

export let tray: Tray | null = null;

export function setupTray(iconPath: string) {
    tray = new Tray(iconPath);
    tray.setToolTip(app.name);
    tray.addListener('click', () => {
        if (windows.every(w => aliveOrNull(w)?.isMinimized())) {
            windows.forEach(w => aliveOrNull(w)?.show());
        } else {
            windows.forEach(w => aliveOrNull(w)?.minimize());
        }
    });

    const windows = BrowserWindow.getAllWindows();
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Restore', click: () => {
            windows.forEach(w => aliveOrNull(w)?.show());
        }},
        { label: 'Minimize', click: () => {
            windows.forEach(w => aliveOrNull(w)?.minimize());
        }},
        { label: 'Windows', submenu: windows.map((w, i) => {
            return { label: `Window ${i}`, submenu: [
                { label: 'Restore', click: () => aliveOrNull(w)?.show() },
                { label: 'Minimize', click: () => aliveOrNull(w)?.minimize() }
            ]};
        })}
    ]);

    if (process.env.NODE_ENV === 'development') {
        addDebugMenu(contextMenu, windows);
    }

    contextMenu.append(new MenuItem({ role: 'quit' }));
    tray.setContextMenu(contextMenu);
}

function addDebugMenu(contextMenu: Menu, windows: BrowserWindow[]) {
    contextMenu.append(new MenuItem({ label: 'Debug Memu',
        submenu: windows.map((w, i) => {
            return { label: `Window ${i}`, submenu: [
                { label: `DevTools`, click: () => aliveOrNull(w)?.webContents.toggleDevTools() },
                { label: 'MouseEvents', submenu: [
                    { label: 'enabled', type: 'radio', click: () =>
                        aliveOrNull(w)?.setIgnoreMouseEvents(false)
                    },
                    { label: 'disabled', type: 'radio', checked: true, click: () =>
                        aliveOrNull(w)?.setIgnoreMouseEvents(true)
                    },
                ]},
                { label: 'Taskbar', submenu: [
                    { label: 'enabled', type: 'radio', click: () =>
                        aliveOrNull(w)?.setSkipTaskbar(false)
                    },
                    { label: 'disabled', type: 'radio', checked: true, click: () =>
                        aliveOrNull(w)?.setSkipTaskbar(true)
                    },
                ]},
            ]};
        })
    }));
}

function aliveOrNull(window: BrowserWindow): BrowserWindow | null {
    return window.isDestroyed() ? null : window;
}
