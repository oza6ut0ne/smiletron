import { ICON_SEPARATOR, IMG_SEPARATOR, INLINE_IMG_SEPARATOR, VIDEO_SEPARATOR } from './const';

const JSON_INLINE_IMG_SEPARATOR = '##INLINE##';

export class Comment {
    id: number;
    text: string;
    offsetTopRatio: number;

    constructor(id: number, text: string, offsetTopRatio: number) {
        this.id = id;
        this.text = this.convertJsonToCommentText(text);
        this.offsetTopRatio = offsetTopRatio;
    }

    private convertJsonToCommentText(json: string): string {
        try {
            const parsed = JSON.parse(json);
            if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
                throw SyntaxError();
            }

            let text = parsed['text'];
            if (text === undefined || typeof text !== 'string') {
                throw SyntaxError();
            }

            const icon = parsed['icon'];
            const inlineImages = parsed['inlineImages'];
            const images = parsed['images'];
            const videos = parsed['videos'];

            [inlineImages, images, videos].forEach(a => {
                if (a !== undefined && a !== null && !Array.isArray(a)) {
                    throw SyntaxError();
                }
            });

            let comment = '';
            if (icon !== undefined && icon !== null) {
                comment += `${icon}${ICON_SEPARATOR}`;
            }

            inlineImages?.forEach((i: any) => {
                text = text.replace(JSON_INLINE_IMG_SEPARATOR, `${INLINE_IMG_SEPARATOR}${i}${INLINE_IMG_SEPARATOR}`);
            });
            comment += text;

            images?.forEach((i: any) => {
                comment += `${IMG_SEPARATOR}${i}`;
            })

            videos?.forEach((v: any) => {
                comment += `${VIDEO_SEPARATOR}${v}`;
            })

            return comment;
        } catch (e) {
            return json;
        }
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
