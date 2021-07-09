import { Comment, RendererInfo } from '../../common/types';


export default interface IElectronIpcApi {
    notifyCommentArrivedToLeftEdge: (comment: Comment, windowIndex: number) => void;
    requestDuration: (callback: (duration: number) => void) => void;
    requestDefaultDuration: (callback: (duration: number) => void) => void;
    requestIconEnabled: (callback: (isEnabled: boolean) => void) => void;
    requestImgEnabled: (callback: (isEnabled: boolean) => void) => void;
    onCommentReceived: (callback: (comment: Comment, rendererInfo: RendererInfo) => void) => void;
    onTogglePause: (callback: () => void) => void;
    onDurationUpdated: (callback: (duration: number) => void) => void;
    onUpdateIconEnabled: (callback: (isEnabled: boolean) => void) => void;
    onUpdateImgEnabled: (callback: (isEnabled: boolean) => void) => void;
}

declare global {
    interface Window {
      electron: IElectronIpcApi;
    }
}