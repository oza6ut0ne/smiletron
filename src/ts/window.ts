interface DevtronWindow extends Window {
    __devtron: { require: NodeRequire, process: NodeJS.Process }
}

declare var window: DevtronWindow;
export default window;
