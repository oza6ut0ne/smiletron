import { Comment, RendererInfo } from '../../common/types';


export default interface IElectronIpcApi {
    notifyCommentArrivedToLeftEdge: (comment: Comment, windowIndex: number) => void;
    requestDuration: (callback: (duration: number) => void) => void;
    requestDefaultDuration: (callback: (duration: number) => void) => void;
    onCommentReceived: (callback: (comment: Comment, rendererInfo: RendererInfo) => void) => void;
    onDurationUpdated: (callback: (duration: number) => void) => void;
    onTogglePause: (callback: () => void) => void;
}

declare global {
    interface Window {
      electron: IElectronIpcApi;
    }
}