import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Comment, OverLimitComments, RendererInfo } from '../common/types';


contextBridge.exposeInMainWorld(
    'electron', {
        notifyCommentArrivedToLeftEdge: (comment: Comment, windowIndex: number) => {
            ipcRenderer.send('comment-arrived-to-left-edge', comment, windowIndex);
        },

        requestDuration: (callback: (duration: number) => void) => {
            ipcRenderer.invoke('request-duration').then((result) => callback(result));
        },

        requestDefaultDuration: (callback: (duration: number) => void) => {
            ipcRenderer.invoke('request-default-duration').then((result) => callback(result));
        },

        requestMaxCommentsOnDisplay: (callback: (maxComments: number) => void) => {
            ipcRenderer.invoke('request-max-comments-on-display').then((result) => callback(result));
        },

        requestFontSize: (callback: (size: string) => void) => {
            ipcRenderer.invoke('request-font-size').then((result) => callback(result));
        },

        requestTextColorStyle: (callback: (style: string) => void) => {
            ipcRenderer.invoke('request-text-color-style').then((result) => callback(result));
        },

        requestTextStrokeStyle: (callback: (style: string) => void) => {
            ipcRenderer.invoke('request-text-stroke-style').then((result) => callback(result));
        },

        requestOverLimitComments: (callback: (value: OverLimitComments) => void) => {
            ipcRenderer.invoke('request-over-limit-comments').then((result) => callback(result));
        },

        requestNewlineEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.invoke('request-newline-enabled').then((result) => callback(result));
        },

        requestIconEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.invoke('request-icon-enabled').then((result) => callback(result));
        },

        requestInlineImgEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.invoke('request-inline-img-enabled').then((result) => callback(result));
        },

        requestImgEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.invoke('request-img-enabled').then((result) => callback(result));
        },

        requestVideoEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.invoke('request-video-enabled').then((result) => callback(result));
        },

        requestRoundIconEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.invoke('request-round-icon-enabled').then((result) => callback(result));
        },

        onCommentReceived: (callback: (comment: Comment, rendererInfo: RendererInfo) => void) => {
            ipcRenderer.on(
                'comment', (event: IpcRendererEvent, comment, rendererInfo) => callback(comment, rendererInfo));
        },

        onTogglePause: (callback: () => void) => {
            ipcRenderer.on('toggle-pause', () => callback());
        },

        onDurationUpdated: (callback: (duration: number) => void) => {
            ipcRenderer.on('update-duration', (event: IpcRendererEvent, duration) => callback(duration));
        },

        onUpdateOverLimitComments: (callback: (value: OverLimitComments) => void) => {
            ipcRenderer.on('update-over-limit-comments', (event: IpcRendererEvent, value) => callback(value));
        },

        onUpdateNewlineEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.on('update-newline-enabled', (event: IpcRendererEvent, isEnabled) => callback(isEnabled));
        },

        onUpdateIconEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.on('update-icon-enabled', (event: IpcRendererEvent, isEnabled) => callback(isEnabled));
        },

        onUpdateInlineImgEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.on('update-inline-img-enabled', (event: IpcRendererEvent, isEnabled) => callback(isEnabled));
        },

        onUpdateImgEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.on('update-img-enabled', (event: IpcRendererEvent, isEnabled) => callback(isEnabled));
        },

        onUpdateVideoEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.on('update-video-enabled', (event: IpcRendererEvent, isEnabled) => callback(isEnabled));
        },

        onUpdateRoundIconEnabled: (callback: (isEnabled: boolean) => void) => {
            ipcRenderer.on('update-round-icon-enabled', (event: IpcRendererEvent, isEnabled) => callback(isEnabled));
        },
    },
);
