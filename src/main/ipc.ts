import { BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import { Comment, OverLimitComments, RendererInfo } from '../common/types';
import { aliveOrNull } from './util';
import { config } from './config';

let durationPerDisplayMsec = config.duration;


export interface ICommentSender {
    sendCommentToRenderer(text: string): void;
}

class CommentSender implements ICommentSender {
    private static _instance: CommentSender;
    private commentCount: number;
    private windows: BrowserWindow[];
    private isSingleWindow: boolean;
    private numDisplays: number;

    private constructor(windows: BrowserWindow[], isSingleWindow: boolean, numDisplays: number) {
        CommentSender._instance = this;

        this.commentCount = 0;
        this.windows = windows;
        this.isSingleWindow = isSingleWindow;
        this.numDisplays = numDisplays;

        ipcMain.on('comment-arrived-to-left-edge',
            (event: IpcMainEvent, comment: Comment, senderWindowIndex: number) => {
                this.sendCommentToWindow(comment, senderWindowIndex + 1);
        });
    }

    static create(windows: BrowserWindow[], isSingleWindow: boolean, numDisplays: number) {
        return CommentSender._instance || new CommentSender(windows, isSingleWindow, numDisplays);
    }

    private sendCommentToWindow(comment: Comment, windowIndex: number) {
        const indexOffset = this.windows.slice(windowIndex).findIndex(w => !w.isDestroyed());
        if (indexOffset === -1) {
            return;
        }

        const availableWindowIndex = windowIndex + indexOffset;
        const rendererInfo = new RendererInfo(availableWindowIndex, this.numDisplays, this.isSingleWindow);
        this.windows[availableWindowIndex].webContents.send('comment', comment, rendererInfo);
    }

    sendCommentToRenderer(text: string) {
        this.commentCount += 1;
        const offsetTopRatio = Math.random() * 0.9;
        const comment = new Comment(this.commentCount, text, offsetTopRatio);
        this.sendCommentToWindow(comment, 0);
    }
}

export function setupIpcHandlers(windows: BrowserWindow[], isSingleWindow: boolean, numDisplays: number): ICommentSender {
    ipcMain.handle('request-duration', () => durationPerDisplayMsec);
    ipcMain.handle('request-default-duration', () => config.getDefaultDuration());
    ipcMain.handle('request-max-comments-on-display', () => config.maxCommentsOnDisplay);
    ipcMain.handle('request-font-size', () => config.fontSize);
    ipcMain.handle('request-text-color-style', () => config.textColorStyle);
    ipcMain.handle('request-text-stroke-style', () => config.textStrokeStyle);
    ipcMain.handle('request-over-limit-comments', () => config.overLimitComments);
    ipcMain.handle('request-newline-enabled', () => config.newlineEnabled);
    ipcMain.handle('request-icon-enabled', () => config.iconEnabled);
    ipcMain.handle('request-inline-img-enabled', () => config.inlineImgEnabled);
    ipcMain.handle('request-img-enabled', () => config.imgEnabled);
    ipcMain.handle('request-video-enabled', () => config.videoEnabled);
    ipcMain.handle('request-round-icon-enabled', () => config.roundIconEnabled);
    return CommentSender.create(windows, isSingleWindow, numDisplays);
}

export function togglePause() {
    BrowserWindow.getAllWindows().forEach(w => aliveOrNull(w)?.webContents.send('toggle-pause'));
}

export function resetDuration() {
    config.resetDuration();
    updateDuration(config.duration);
}

export function addDuration(duration: number) {
    const newDuration = durationPerDisplayMsec + duration;
    if (newDuration <= 0) {
        updateDuration(durationPerDisplayMsec);
        return;
    }
    updateDuration(newDuration);
}

function updateDuration(duration: number) {
    durationPerDisplayMsec = duration;
    config.duration = duration;

    BrowserWindow.getAllWindows().forEach(w => {
        aliveOrNull(w)?.webContents.send('update-duration', durationPerDisplayMsec);
    });
}

export function updateOverLimitComments(value: OverLimitComments) {
    config.overLimitComments = value;
    BrowserWindow.getAllWindows().forEach(w => {
        aliveOrNull(w)?.webContents.send('update-over-limit-comments', value);
    });
}

export function updateNewlineEnabled(isEnabled: boolean) {
    config.newlineEnabled = isEnabled;
    BrowserWindow.getAllWindows().forEach(w => {
        aliveOrNull(w)?.webContents.send('update-newline-enabled', isEnabled);
    });
}

export function updateIconEnabled(isEnabled: boolean) {
    config.iconEnabled = isEnabled;
    BrowserWindow.getAllWindows().forEach(w => {
        aliveOrNull(w)?.webContents.send('update-icon-enabled', isEnabled);
    });
}

export function updateInlineImgEnabled(isEnabled: boolean) {
    config.inlineImgEnabled = isEnabled;
    BrowserWindow.getAllWindows().forEach(w => {
        aliveOrNull(w)?.webContents.send('update-inline-img-enabled', isEnabled);
    });
}

export function updateImgEnabled(isEnabled: boolean) {
    config.imgEnabled = isEnabled;
    BrowserWindow.getAllWindows().forEach(w => {
        aliveOrNull(w)?.webContents.send('update-img-enabled', isEnabled);
    });
}

export function updateVideoEnabled(isEnabled: boolean) {
    config.videoEnabled = isEnabled;
    BrowserWindow.getAllWindows().forEach(w => {
        aliveOrNull(w)?.webContents.send('update-video-enabled', isEnabled);
    });
}

export function updateRoundIconEnabled(isEnabled: boolean) {
    config.roundIconEnabled = isEnabled;
    BrowserWindow.getAllWindows().forEach(w => {
        aliveOrNull(w)?.webContents.send('update-round-icon-enabled', isEnabled);
    });
}
