import { app, BrowserWindow, Menu, MenuItem, Tray } from 'electron';

export let tray: Tray | null = null;
let contextMenu: Menu | null = null;

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
    contextMenu = Menu.buildFromTemplate([
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

    contextMenu.append(new MenuItem({ label: 'Restart', click: () => {
        app.relaunch();
        app.quit();
    }}));
    contextMenu.append(new MenuItem({ role: 'quit' }));
    tray.setContextMenu(contextMenu);
}

function addDebugMenu(contextMenu: Menu, windows: BrowserWindow[]) {
    const perWindowMenuItems = (
        windows.map((w, i) => constructPerWindowsDebugMenuItem(w, i))
    );

    const togglePauseMenuItem = new MenuItem(({ label: 'Pause / Unpause', click: () =>
        windows.forEach(w => aliveOrNull(w)?.webContents.send('toggle-pause'))
    }));

    const devToolsMenuItem = new MenuItem({ label: 'DevTools',
        submenu: [
            { label: 'open', click: () => windows.forEach(w => {
                aliveOrNull(w)?.webContents.openDevTools();
            })},
            { label: 'close', click: () => windows.forEach(w => {
                aliveOrNull(w)?.webContents.closeDevTools();
            })},
        ]}
    );

    const mouseEventsMenuItem  = new MenuItem({ label: 'MouseEvents',
        submenu: [
            { label: 'enable', click: () => windows.forEach((w, i) => {
                aliveOrNull(w)?.setIgnoreMouseEvents(false);
                putCheckOnItem(contextMenu.getMenuItemById(`MouseEvents ${i} enabled`), true);
                refreshContextMenu();
            })},
            { label: 'disable', click: () => windows.forEach((w, i) => {
                aliveOrNull(w)?.setIgnoreMouseEvents(true);
                putCheckOnItem(contextMenu.getMenuItemById(`MouseEvents ${i} disabled`), true);
                refreshContextMenu();
            })},
        ]},
    );

    const taskbarMenuItem  = new MenuItem({ label: 'Taskbar',
        submenu: [
            { label: 'enable', click: () => windows.forEach((w, i) => {
                aliveOrNull(w)?.setSkipTaskbar(false);
                putCheckOnItem(contextMenu.getMenuItemById(`Taskbar ${i} enabled`), true);
                refreshContextMenu();
            })},
            { label: 'disable', click: () => windows.forEach((w, i) => {
                aliveOrNull(w)?.setSkipTaskbar(true);
                putCheckOnItem(contextMenu.getMenuItemById(`Taskbar ${i} disabled`), true);
                refreshContextMenu();
            })},
        ]},
    );

    const debugSubMenu = Menu.buildFromTemplate([
        togglePauseMenuItem,
        devToolsMenuItem,
        mouseEventsMenuItem,
        taskbarMenuItem,
        { type: 'separator' },
        ...perWindowMenuItems
    ]);

    const debugMenu = new MenuItem({ label: 'Debug Memu', submenu: debugSubMenu });
    contextMenu.append(debugMenu);
}

function constructPerWindowsDebugMenuItem(window: BrowserWindow, index: number): MenuItem {
    return new MenuItem({ label: `Window ${index}`, submenu: [
        { label: `Toggle DevTools`, click: () => aliveOrNull(window)?.webContents.toggleDevTools() },
        { label: 'MouseEvents', submenu: [
            { label: 'enabled', id: `MouseEvents ${index} enabled`,
              type: 'radio', click: () =>
                  aliveOrNull(window)?.setIgnoreMouseEvents(false)
            },
            { label: 'disabled', id: `MouseEvents ${index} disabled`,
              type: 'radio', checked: true, click: () =>
                  aliveOrNull(window)?.setIgnoreMouseEvents(true)
            },
        ]},
        { label: 'Taskbar', submenu: [
            { label: 'enabled', id: `Taskbar ${index} enabled`,
              type: 'radio', click: () =>
                  aliveOrNull(window)?.setSkipTaskbar(false)
            },
            { label: 'disabled', id: `Taskbar ${index} disabled`,
              type: 'radio', checked: true, click: () =>
                  aliveOrNull(window)?.setSkipTaskbar(true)
            },
        ]},
    ]});
}

function refreshContextMenu() {
    if (contextMenu !== null) {
        tray?.setContextMenu(contextMenu);
    }
}

function putCheckOnItem(item: MenuItem | null, isChecked: boolean) {
    if (item !== null) {
        item.checked = isChecked;
    }
}

function aliveOrNull(window: BrowserWindow): BrowserWindow | null {
    return window.isDestroyed() ? null : window;
}
