import { ICON_SEPARATOR, FONT_SIZE_SEPARATOR, COLOR_SEPARATOR, TEXT_STROKE_SEPARATOR, IMG_SEPARATOR, INLINE_IMG_SEPARATOR, VIDEO_SEPARATOR } from '../../common/const';
import { Comment, OverLimitComments, RendererInfo } from '../../common/types';
import { noTruncSplit } from '../../common/util';
import './window';

const FLASHING_DECAY_TIME_MSEC = 1000;

let durationPerDisplayMsec: number;
let maxCommentsOnDisplay: number
let fontSizeStyle: string;
let textColorStyle: string;
let textStrokeStyle: string;
let overLimitComments: OverLimitComments;
let newlineEnabled: boolean;
let iconEnabled: boolean;
let inlineImgEnabled: boolean;
let imgEnabled: boolean;
let videoEnabled: boolean;
let roundIconEnabled: boolean;
let isPause = false;


document.addEventListener('DOMContentLoaded', () => {
    window.electron.requestDefaultDuration(setupIpcHandlers);
    window.electron.requestDuration((duration) => durationPerDisplayMsec = duration);
    window.electron.requestMaxCommentsOnDisplay((maxComments) => maxCommentsOnDisplay = maxComments);
    window.electron.requestFontSize((size) => fontSizeStyle = size);
    window.electron.requestTextColorStyle((style) => textColorStyle = style);
    window.electron.requestTextStrokeStyle((style) => textStrokeStyle = style);
    window.electron.requestOverLimitComments((value) => overLimitComments = value);
    window.electron.requestNewlineEnabled((isEnabled) => newlineEnabled = isEnabled);
    window.electron.requestIconEnabled((isEnabled) => iconEnabled = isEnabled);
    window.electron.requestInlineImgEnabled((isEnabled) => inlineImgEnabled = isEnabled);
    window.electron.requestImgEnabled((isEnabled) => imgEnabled = isEnabled);
    window.electron.requestVideoEnabled((isEnabled) => videoEnabled = isEnabled);
    window.electron.requestRoundIconEnabled((isEnabled) => roundIconEnabled = isEnabled);

    for (const eventType of ['focus', 'resize']) {
        window.addEventListener(eventType, () => flashWindow(0, 255, 0, 0.3));
    }
    flashWindow(0, 255, 0, 0.3).onfinish = () => flashWindow(0, 255, 0, 0.3);
});

function flashWindow(r: number, g: number, b: number, a: number, decayFactor: number = 1): Animation {
    const effect = [
        { background: `rgb(${r}, ${g}, ${b}, ${a})` },
        { background: 'rgb(0, 0, 0, 0)' }
    ];

    const timing = {
        duration: FLASHING_DECAY_TIME_MSEC * decayFactor,
        iterations: 1,
        easing: 'linear'
    };

    return document.body.animate(effect, timing);
}

function addComment(comment: Comment): Promise<HTMLDivElement> {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.style.zIndex = comment.id.toString();
    commentDiv.style.left = window.innerWidth + 'px';
    commentDiv.style.top = Math.floor(window.innerHeight * comment.offsetTopRatio) + 'px';

    let text = comment.text;
    let iconSrc = '';
    if (text.indexOf(ICON_SEPARATOR) !== -1) {
        [iconSrc, text] = noTruncSplit(text, ICON_SEPARATOR, 1);
        if (!iconEnabled) {
            iconSrc = '';
        }
    }

    let fontSize = fontSizeStyle;
    if (text.indexOf(FONT_SIZE_SEPARATOR) !== -1) {
        [fontSize, text] = noTruncSplit(text, FONT_SIZE_SEPARATOR, 1);
        if (fontSize.match(/^\d+$/)) {
            fontSize += 'pt';
        }
    }

    let color = textColorStyle;
    if (text.indexOf(COLOR_SEPARATOR) !== -1) {
        [color, text] = noTruncSplit(text, COLOR_SEPARATOR, 1);
    }

    let textStroke = textStrokeStyle;
    if (text.indexOf(TEXT_STROKE_SEPARATOR) !== -1) {
        [textStroke, text] = noTruncSplit(text, TEXT_STROKE_SEPARATOR, 1);
    }

    let videoSrcs: string[] = [];
    if (text.indexOf(VIDEO_SEPARATOR) !== -1) {
        [text, ...videoSrcs] = text.split(VIDEO_SEPARATOR);
    }

    let imgSrcs: string[] = [];
    if (text.indexOf(IMG_SEPARATOR) !== -1) {
        [text, ...imgSrcs] = text.split(IMG_SEPARATOR);
    }

    if (!newlineEnabled) {
        text = text.replace(/[\r\n]+/g, '');
    }

    const mediaHeight = calcHeight(text);
    const inlineImgHeight = calcHeight(' ');
    const mediaPromises: Promise<void>[] = [];
    mediaPromises.push(addImage(commentDiv, iconSrc, mediaHeight, 'image', roundIconEnabled));

    commentDiv.style.fontSize = fontSize;

    const contentDiv = document.createElement('div');
    contentDiv.className ='content';
    commentDiv.appendChild(contentDiv);

    if (inlineImgEnabled) {
        text.split(INLINE_IMG_SEPARATOR).forEach((t, i) => {
            if (i % 2 == 0) {
                addSpan(contentDiv, t, color, textStroke)
            } else {
                mediaPromises.push(addImage(contentDiv, t, inlineImgHeight, 'inline-image'));
            }
        });
    } else {
        const content = text.split(INLINE_IMG_SEPARATOR).filter((_, i) => i % 2 == 0).join('');
        addSpan(contentDiv, content, color, textStroke);
    }

    if (imgEnabled) {
        imgSrcs.forEach((src) => {
            mediaPromises.push(addImage(commentDiv, src, mediaHeight, 'image'));
        });
    }
    if (videoEnabled) {
        videoSrcs.forEach((src) => {
            mediaPromises.push(addVideo(commentDiv, src, mediaHeight, 'video'));
        });
    }
    document.body.appendChild(commentDiv);

    const protrusionBottom = commentDiv.offsetTop + commentDiv.offsetHeight - window.innerHeight;
    if (protrusionBottom > 0) {
        const newTop = commentDiv.offsetTop - protrusionBottom;
        commentDiv.style.top = (newTop > 0 ? newTop : 0) + 'px';
    }

    return Promise.allSettled(mediaPromises).then(() => commentDiv);
}

function calcHeight(text: string): number {
    const dummyDiv = document.createElement('div');
    dummyDiv.className = 'comment';
    dummyDiv.style.left = window.innerWidth + 'px';

    const span = document.createElement('span');
    span.className = 'content';
    span.textContent = text === '' ? ' ' : text;
    dummyDiv.appendChild(span);
    document.body.appendChild(dummyDiv);

    const height = span.offsetHeight;
    document.body.removeChild(dummyDiv);
    return height;
}

function addSpan(div: HTMLDivElement, text: string, color: string, textStrokeStyle: string) {
    text.split(/\r|\n|\r\n/).forEach((t, i) => {
        if (i > 0) {
            div.appendChild(document.createElement('br'));
        }
        if (t === '') {
            return;
        }

        const span = document.createElement('span');
        span.className = 'text';
        span.style.webkitTextStroke = textStrokeStyle;
        if (color) {
            span.style.color = color;
        }
        span.textContent = t;
        div.appendChild(span);
    });
}

function addImage(div: HTMLDivElement, imgSrc: string, height: number, className: string, round: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!imgSrc) {
            reject();
            return;
        }

        const image: HTMLImageElement = document.createElement('img');
        image.onload = () => {
            resolve()
        };
        image.onerror = () => {
            image.remove();
            reject();
        };

        image.className = className;
        if (round) {
            image.classList.add('round');
        }
        image.height = height;
        image.src = imgSrc;
        div.appendChild(image);
    });
}

function addVideo(div: HTMLDivElement, videoSrc: string, height: number, className: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!videoSrc) {
            reject();
            return;
        }

        const video: HTMLVideoElement = document.createElement('video');
        video.onloadedmetadata = () => {
            resolve();
        };
        video.onerror = () => {
            video.remove();
            reject();
        };

        video.className = className;
        video.height = height;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.controls = false;
        video.playsInline = true;
        video.src = videoSrc;
        div.appendChild(video);
    });
}

function animateToLeft(div: HTMLDivElement, start: number, end: number, duration: number): Promise<Animation> {
    const effect = [
        { left: start + 'px' },
        { left: end + 'px' }
    ];

    const timing = {
        duration: duration,
        iterations: 1,
        easing: 'linear'
    };

    const animation = div.animate(effect, timing);
    if (isPause) {
        animation.pause();
    }

    animation.oncancel = (a) => {
        document.body.removeChild(div);
    };

    return animation.finished;
}

async function handleComment(comment: Comment, rendererInfo: RendererInfo) {
    const commentDiv = await addComment(comment);
    const wideWindowFactor = rendererInfo.isSingleWindow ? rendererInfo.numDisplays : 1;
    const durationRatio = 1 / (1 + commentDiv.offsetWidth * wideWindowFactor / window.innerWidth);
    if(!isPause) {
        const commentAmimations = getCommentAnimations();
        if (overLimitComments !== 'keep' && maxCommentsOnDisplay > 0 && commentAmimations.length > maxCommentsOnDisplay) {
            for (let i = 0; i < commentAmimations.length - maxCommentsOnDisplay; i++) {
                commentAmimations[i]?.cancel();
            }
        }
    }

    animateToLeft(commentDiv, window.innerWidth, 0,
                  durationPerDisplayMsec * wideWindowFactor * durationRatio)
    .catch(() => {
        // nop: Animation is canceled
    }).then((a) => {
        if (a instanceof Animation || overLimitComments !== 'discard') {
            window.electron.notifyCommentArrivedToLeftEdge(comment, rendererInfo.windowIndex);
            if (a instanceof Animation) {
                return animateToLeft(commentDiv, 0, -commentDiv.offsetWidth * wideWindowFactor,
                                     durationPerDisplayMsec * wideWindowFactor * (1 - durationRatio));
            }
        }
    }).catch(() => {
        // nop: Animation is canceled
    }).then((a) => {
        if (a instanceof Animation) {
            document.body.removeChild(commentDiv);
        }
    });
}

function getCommentAnimations(): Animation[] {
    return document.getAnimations().filter(a => {
        // @ts-ignore
        return a.effect?.target.className === 'comment';
    });
}

function setupIpcHandlers(defaultDuration: number) {
    window.electron.onCommentReceived(handleComment);
    window.electron.onDurationUpdated((duration) => {
        if (duration === defaultDuration) {
            flashWindow(255, 0, 255, 0.2, 0.75);
        } else if (duration < durationPerDisplayMsec) {
            flashWindow(255, 0, 0, 0.15, 0.75);
        } else if (duration > durationPerDisplayMsec) {
            flashWindow(0, 0, 255, 0.15, 0.75);
        } else {
            flashWindow(255, 255, 255, 0.15, 0.75);
        }
        durationPerDisplayMsec = duration;
    });

    window.electron.onTogglePause(() => {
        if (isPause) {
            isPause = false;
            getCommentAnimations().forEach(a => a.play());
            flashWindow(255, 255, 0, 0.15, 0.75);
        } else {
            isPause = true;
            getCommentAnimations().forEach(a => a.pause());
            flashWindow(0, 255, 255, 0.15, 0.75);
        }
    });

    window.electron.onUpdateOverLimitComments((value) => overLimitComments = value);
    window.electron.onUpdateNewlineEnabled((isEnabled) => newlineEnabled = isEnabled);
    window.electron.onUpdateIconEnabled((isEnabled) => iconEnabled = isEnabled);
    window.electron.onUpdateInlineImgEnabled((isEnabled) => inlineImgEnabled = isEnabled);
    window.electron.onUpdateImgEnabled((isEnabled) => imgEnabled = isEnabled);
    window.electron.onUpdateVideoEnabled((isEnabled) => videoEnabled = isEnabled);
    window.electron.onUpdateRoundIconEnabled((isEnabled) => roundIconEnabled = isEnabled);
}
