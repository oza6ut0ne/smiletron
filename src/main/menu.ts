import { app, BrowserWindow, globalShortcut, Menu, MenuItem, nativeImage, Tray } from 'electron';
import { config, toggleStatusWithAuto } from './config';
import {
    addDuration, resetDuration, togglePause, updateIconEnabled, updateImgEnabled,
    updateInlineImgEnabled, updateNewlineEnabled, updateRoundIconEnabled, updateVideoEnabled
} from './ipc';
import { isMac, isWindows, isAppImage, restoreWindow, aliveOrNull, tryRelaunch } from './util';


export let tray: Tray | null = null;
let trayMenu: Menu | null = null;


export function setupMenu(iconPath: string) {
    const windows = BrowserWindow.getAllWindows();
    trayMenu = createTrayMenu(windows);

    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(isMac ? icon.resize({ width: 16, height: 16 }) : icon);
    tray.setToolTip(app.name);
    if (isWindows) {
        tray.addListener('click', () => {
            if (windows.filter(w => !w.isDestroyed()).every(w => w.isMinimized())) {
                windows.forEach(w => restoreWindow(w));
            } else {
                windows.forEach(w => aliveOrNull(w)?.minimize());
            }
        });
    }
    tray.setContextMenu(trayMenu);

    const defaultAppMenu = Menu.getApplicationMenu();
    const appMenu = defaultAppMenu ? defaultAppMenu : new Menu();
    appMenu.append(new MenuItem({ label: app.getName(), submenu: trayMenu }));
    Menu.setApplicationMenu(appMenu);

    if (config.globalRestoreAccelerator) {
        globalShortcut.register(config.globalRestoreAccelerator, () => {
            if (isWindows) {
                windows.forEach(w => aliveOrNull(w)?.minimize());
            }
            windows.forEach(w => restoreWindow(w))
        });
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
        { label: 'Pause / Unpause', accelerator: 'Space', click: togglePause },
        { label: 'Mute TCP', type: 'checkbox', checked: config.muteTcp, visible: config.useTcp,
            click: (item) => { config.muteTcp = item.checked }
        },
        { label: 'Mute MQTT', type: 'checkbox', checked: config.muteMqtt, visible: config.useMqtt,
            click: (item) => { config.muteMqtt = item.checked }
        },
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
            { label: 'Multi Window', submenu: toggleStatusWithAuto.map(v => {
                return { label: v, checked: config.useMultiWindow === v,
                         type: 'radio', click: () => {
                             config.useMultiWindow = v;
                             tryRelaunch();
                }}
            })},
            { label: 'Visible on all Workspaces', type: 'checkbox', checked: config.visibleOnAllWorkspaces, click: (item) => {
                config.visibleOnAllWorkspaces = item.checked;
                windows.forEach(w => aliveOrNull(w)?.setVisibleOnAllWorkspaces(item.checked, { visibleOnFullScreen: isMac }));
            }},
            { label: 'Allow Newline', type: 'checkbox', checked: config.newlineEnabled, click: (item) => updateNewlineEnabled(item.checked) },
            { label: 'Show Icon', type: 'checkbox', checked: config.iconEnabled, click: (item) => updateIconEnabled(item.checked) },
            { label: 'Show Inline Image', type: 'checkbox', checked: config.inlineImgEnabled, click: (item) => updateInlineImgEnabled(item.checked) },
            { label: 'Show Image', type: 'checkbox', checked: config.imgEnabled, click: (item) => updateImgEnabled(item.checked) },
            { label: 'Show Video', type: 'checkbox', checked: config.videoEnabled, click: (item) => updateVideoEnabled(item.checked) },
            { label: 'Round Icon', type: 'checkbox', checked: config.roundIconEnabled, click: (item) => updateRoundIconEnabled(item.checked) },
            { label: 'Hardware Acceleration', type: 'checkbox', checked: config.hardwareAccelerationEnabled, click: (item) => {
                config.hardwareAccelerationEnabled = item.checked;
                tryRelaunch();
            }},
        ]}
    ]);

    if (process.env.NODE_ENV === 'development') {
        addDebugMenu(contextMenu, windows);
    }

    contextMenu.append(new MenuItem({ label: 'Restart', visible: !isAppImage, click: () => tryRelaunch()}));
    contextMenu.append(new MenuItem({ role: 'quit' }));

    return contextMenu;
}

function addDebugMenu(contextMenu: Menu, windows: BrowserWindow[]) {
    const perWindowMenuItems = (
        windows.map((w, i) => createPerWindowsDebugMenuItem(w, i))
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
                putCheckOnItem(contextMenu.getMenuItemById(`Enable MouseEvents ${i}`), true);
            })},
            { label: 'disable', click: () => windows.forEach((w, i) => {
                aliveOrNull(w)?.setIgnoreMouseEvents(true);
                putCheckOnItem(contextMenu.getMenuItemById(`Enable MouseEvents ${i}`), false);
            })},
        ]},
    );

    const taskbarMenuItem  = new MenuItem({ label: 'Show in Taskbar',
        submenu: [
            { label: 'enable', click: () => windows.forEach((w, i) => {
                aliveOrNull(w)?.setSkipTaskbar(false);
                putCheckOnItem(contextMenu.getMenuItemById(`Show in Taskbar ${i}`), true);
            })},
            { label: 'disable', click: () => windows.forEach((w, i) => {
                aliveOrNull(w)?.setSkipTaskbar(true);
                putCheckOnItem(contextMenu.getMenuItemById(`Show in Taskbar ${i}`), false);
            })},
        ]},
    );

    const debugSubMenu = Menu.buildFromTemplate([
        devToolsMenuItem,
        mouseEventsMenuItem,
        taskbarMenuItem,
        { type: 'separator' },
        ...perWindowMenuItems
    ]);

    const debugMenu = new MenuItem({ label: 'Debug Menu', submenu: debugSubMenu });
    contextMenu.append(debugMenu);
}

function createPerWindowsDebugMenuItem(window: BrowserWindow, index: number): MenuItem {
    return new MenuItem({ label: `Window ${index}`, submenu: [
        { label: `Toggle DevTools`, click: () => aliveOrNull(window)?.webContents.toggleDevTools() },
        { label: 'Enable MouseEvents', id: `Enable MouseEvents ${index}`, type: 'checkbox',
          click: (item) => aliveOrNull(window)?.setIgnoreMouseEvents(!item.checked)
        },
        { label: 'Show in Taskbar', id: `Show in Taskbar ${index}`, type: 'checkbox',
          click: (item) => aliveOrNull(window)?.setSkipTaskbar(!item.checked)
        },
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
        refreshTrayMenu();
    }
}
