import { Comment, RendererInfo } from '../../common/types';


export default interface IElectronIpcApi {
    notifyCommentArrivedToLeftEdge: (comment: Comment, windowIndex: number) => void;
    onCommentReceived: (callback: (comment: Comment, rendererInfo: RendererInfo) => void) => void;
    onTogglePause: (callback: () => void) => void;
}

declare global {
    interface Window {
      electron: IElectronIpcApi;
    }
}