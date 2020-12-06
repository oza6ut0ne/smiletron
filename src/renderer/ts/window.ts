interface ElectronWindow extends Window {
    ipcRenderer: any,
    __devtron: { require: NodeRequire, process: NodeJS.Process }
}

declare var window: ElectronWindow;
export default window;
