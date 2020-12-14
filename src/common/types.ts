export class Comment {
    id: number;
    text: string;
    offsetTopRatio: number;

    constructor(id: number, text: string, offsetTopRatio: number) {
        this.id = id;
        this.text = text;
        this.offsetTopRatio = offsetTopRatio;
    }
}

export class RendererInfo {
    windowIndex: number;
    numDisplays: number;
    isSingleWindow: boolean;

    constructor(windowIndex: number, numDisplays: number, isSingleWindow: boolean) {
        this.windowIndex = windowIndex;
        this.numDisplays = numDisplays;
        this.isSingleWindow = isSingleWindow;
    }
}
