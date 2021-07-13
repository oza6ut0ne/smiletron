import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Comment, RendererInfo } from '../common/types';


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
    },
);