import { app, BrowserWindow, globalShortcut, Menu, MenuItem, Tray } from 'electron';
import { config, toggleStatusWithAuto } from './config';
import { addDuration, resetDuration, togglePause, updateIconEnabled } from './ipc';
import { isExe, isMac, isAppImage, restoreWindow, aliveOrNull } from './util';

const relaunchExecPath = isExe ? process.env.PORTABLE_EXECUTABLE_FILE : undefined;

export let tray: Tray | null = null;
let trayMenu: Menu | null = null;


export function setupMenu(iconPath: string) {
    const windows = BrowserWindow.getAllWindows();
    trayMenu = createTrayMenu(windows);

    if (!isMac) {
        tray = new Tray(iconPath);
        tray.setToolTip(app.name);
        tray.addListener('click', () => {
            if (windows.filter(w => !w.isDestroyed()).every(w => w.isMinimized())) {
                windows.forEach(w => restoreWindow(w));
            } else {
                windows.forEach(w => aliveOrNull(w)?.minimize());
            }
        });
        tray.setContextMenu(trayMenu);
    }

    const defaultAppMenu = Menu.getApplicationMenu();
    const appMenu = defaultAppMenu ? defaultAppMenu : new Menu();
    appMenu.append(new MenuItem({ label: app.getName(), submenu: trayMenu }));
    Menu.setApplicationMenu(appMenu);

    if (config.globalRestoreAccelerator) {
        globalShortcut.register(config.globalRestoreAccelerator, () => windows.forEach(w => restoreWindow(w)));
    }
}

function createTrayMenu(windows: BrowserWindow[]): Menu {
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Restore', click: () => {
            windows.forEach(w => restoreWindow(w));
        }},
        { label: 'Minimize', click: () => {
            windows.forEach(w => aliveOrNull(w)?.minimize());
        }},
        { label: 'Windows', visible: (windows.length > 1),
          submenu: windows.map((w, i) => {
              return { label: `Window ${i}`, submenu: [
                  { label: 'Restore', click: () => restoreWindow(w) },
                  { label: 'Minimize', click: () => aliveOrNull(w)?.minimize() }
              ]};
        })},
        { label: 'Config', submenu: [
            { label: 'Speed', submenu: [
                { label: 'up', accelerator: 'Plus', click: () => addDuration(-config.deltaDuration) },
                { label: 'down', accelerator: '-', click: () => addDuration(config.deltaDuration) },
                { label: 'reset', accelerator: 'Shift+0', click: () => resetDuration() }
            ]},
            { label: 'Show Icon', submenu: [
                { label: 'enabled', type: 'radio', checked: config.iconEnabled, click: () => updateIconEnabled(true) },
                { label: 'disabled', type: 'radio', checked: !config.iconEnabled, click: () => updateIconEnabled(false) },
            ]},
            { label: 'Multi Window', submenu: toggleStatusWithAuto.map(v => {
                return { label: v, checked: config.useMultiWindow === v,
                         type: 'radio', click: () => {
                             config.useMultiWindow = v;
                             if (!isAppImage) {
                                app.relaunch({ execPath: relaunchExecPath });
                                app.quit();
                             }
                }}
            })}
        ]}
    ]);

    if (process.env.NODE_ENV === 'development') {
        addDebugMenu(contextMenu, windows);
    }

    contextMenu.append(new MenuItem({ label: 'Restart', visible: !isAppImage, click: () => {
        app.relaunch({ execPath: relaunchExecPath });
        app.quit();
    }}));
    contextMenu.append(new MenuItem({ role: 'quit' }));

    return contextMenu;
}

function addDebugMenu(contextMenu: Menu, windows: BrowserWindow[]) {
    const perWindowMenuItems = (
        windows.map((w, i) => createPerWindowsDebugMenuItem(w, i))
    );

    const togglePauseMenuItem = new MenuItem(
        { label: 'Pause / Unpause', accelerator: 'Space', click: togglePause }
    );

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
                refreshTrayMenu();
            })},
            { label: 'disable', click: () => windows.forEach((w, i) => {
                aliveOrNull(w)?.setIgnoreMouseEvents(true);
                putCheckOnItem(contextMenu.getMenuItemById(`MouseEvents ${i} disabled`), true);
                refreshTrayMenu();
            })},
        ]},
    );

    const taskbarMenuItem  = new MenuItem({ label: 'Taskbar',
        submenu: [
            { label: 'enable', click: () => windows.forEach((w, i) => {
                aliveOrNull(w)?.setSkipTaskbar(false);
                putCheckOnItem(contextMenu.getMenuItemById(`Taskbar ${i} enabled`), true);
                refreshTrayMenu();
            })},
            { label: 'disable', click: () => windows.forEach((w, i) => {
                aliveOrNull(w)?.setSkipTaskbar(true);
                putCheckOnItem(contextMenu.getMenuItemById(`Taskbar ${i} disabled`), true);
                refreshTrayMenu();
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

function createPerWindowsDebugMenuItem(window: BrowserWindow, index: number): MenuItem {
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

function refreshTrayMenu() {
    if (!isMac && (trayMenu !== null)) {
        tray?.setContextMenu(trayMenu);
    }
}

function putCheckOnItem(item: MenuItem | null, isChecked: boolean) {
    if (item !== null) {
        item.checked = isChecked;
    }
}
