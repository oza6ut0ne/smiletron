import { BrowserWindow, ipcMain, IpcMainEvent } from 'electron';
import { Comment, RendererInfo } from '../common/types';
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
    ipcMain.handle('request-icon-enabled', () => config.iconEnabled);
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

export function updateIconEnabled(isEnabled: boolean) {
    config.iconEnabled = isEnabled;
    BrowserWindow.getAllWindows().forEach(w => {
        aliveOrNull(w)?.webContents.send('update-icon-enabled', isEnabled);
    });
}