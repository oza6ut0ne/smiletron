import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Comment, RendererInfo } from '../common/types';


contextBridge.exposeInMainWorld(
    'electron', {
        notifyCommentArrivedToLeftEdge: (comment: Comment, windowIndex: number) => {
            ipcRenderer.send('comment-arrived-to-left-edge', comment, windowIndex);
        },

        onCommentReceived: (callback: (comment: Comment, rendererInfo: RendererInfo) => void) => {
            ipcRenderer.on(
                'comment', (event: IpcRendererEvent, comment: Comment, rendererInfo: RendererInfo) => {
                    callback(comment, rendererInfo);
        })},

        onTogglePause: (callback: () => void) => {
            ipcRenderer.on('toggle-pause', () => callback());
        }
    },
);