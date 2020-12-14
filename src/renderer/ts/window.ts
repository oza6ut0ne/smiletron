interface ElectronWindow extends Window {
    ipcRenderer: Electron.IpcRenderer,
}

declare var window: ElectronWindow;
export default window;
