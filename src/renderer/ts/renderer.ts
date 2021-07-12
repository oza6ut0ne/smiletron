import { Comment, RendererInfo } from '../../common/types';
import { noTruncSplit } from '../../common/util';
import './window';

const ICON_SEPARATOR = '##ICON##';
const INLINE_IMG_SEPARATOR = '##INLINE_IMG##';
const IMG_SEPARATOR = '##IMG##';
const FLASHING_DECAY_TIME_MSEC = 1000;

let durationPerDisplayMsec: number;
let iconEnabled: boolean;
let imgEnabled: boolean;
let inlineImgEnabled: boolean;
let newlineEnabled: boolean;
let isPause = false;


document.addEventListener('DOMContentLoaded', () => {
    window.electron.requestDefaultDuration(setupIpcHandlers);
    window.electron.requestDuration((duration) => durationPerDisplayMsec = duration);
    window.electron.requestNewlineEnabled((isEnabled) => newlineEnabled = isEnabled);
    window.electron.requestIconEnabled((isEnabled) => iconEnabled = isEnabled);
    window.electron.requestInlineImgEnabled((isEnabled) => inlineImgEnabled = isEnabled);
    window.electron.requestImgEnabled((isEnabled) => imgEnabled = isEnabled);

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

    let imgSrcs: string[] = [];
    if (text.indexOf(IMG_SEPARATOR) !== -1) {
        [text, ...imgSrcs] = text.split(IMG_SEPARATOR);
    }

    if (!newlineEnabled) {
        text = text.replace(/[\r\n]+/g, '');
    }

    const imgHeight = calcHeight(text);
    const inlineImgHeight = calcHeight(' ');
    const imgPromises: Promise<void>[] = [];
    imgPromises.push(addImage(commentDiv, iconSrc, imgHeight, 'image'));

    const contentDiv = document.createElement('div');
    contentDiv.className ='content';
    commentDiv.appendChild(contentDiv);

    if (inlineImgEnabled) {
        text.split(INLINE_IMG_SEPARATOR).forEach((t, i) => {
            if (i % 2 == 0) {
                addSpan(contentDiv, t)
            } else {
                imgPromises.push(addImage(contentDiv, t, inlineImgHeight, 'inline-image'));
            }
        });
    } else {
        const content = text.split(INLINE_IMG_SEPARATOR).filter((_, i) => i % 2 == 0).join('');
        addSpan(contentDiv, content);
    }

    if (imgEnabled) {
        imgSrcs.forEach((src) => {
            imgPromises.push(addImage(commentDiv, src, imgHeight, 'image'));
        });
    }
    document.body.appendChild(commentDiv);

    const protrusionBottom = commentDiv.offsetTop + commentDiv.offsetHeight - window.innerHeight;
    if (protrusionBottom > 0) {
        const newTop = commentDiv.offsetTop - protrusionBottom;
        commentDiv.style.top = (newTop > 0 ? newTop : 0) + 'px';
    }

    return Promise.allSettled(imgPromises).then(() => commentDiv);
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

function addSpan(div: HTMLDivElement, text: string) {
    text.split(/\r|\n|\r\n/).forEach((t, i) => {
        if (i > 0) {
            div.appendChild(document.createElement('br'));
        }
        if (t === '') {
            return;
        }
        const span = document.createElement('span');
        span.className = 'text';
        span.textContent = t;
        div.appendChild(span);
    });
}

function addImage(div: HTMLDivElement, imgSrc: string, height: number, className: string): Promise<void> {
    return new Promise((resolve) => {
        if (!imgSrc) {
            resolve();
            return;
        }

        const iconImg: HTMLImageElement = document.createElement('img');
        iconImg.onload = () => {
            resolve()
        };
        iconImg.onerror = () => {
            iconImg.remove();
            resolve();
        };

        iconImg.className = className;
        iconImg.height = height;
        iconImg.src = imgSrc;
        div.appendChild(iconImg);
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

    return animation.finished;
}

async function handleComment(comment: Comment, rendererInfo: RendererInfo) {
    const commentDiv = await addComment(comment);
    const wideWindowFactor = rendererInfo.isSingleWindow ? rendererInfo.numDisplays : 1;
    const durationRatio = 1 / (1 + commentDiv.offsetWidth * wideWindowFactor / window.innerWidth);

    animateToLeft(commentDiv, window.innerWidth, 0,
                  durationPerDisplayMsec * wideWindowFactor * durationRatio)
    .then(() => {
        window.electron.notifyCommentArrivedToLeftEdge(comment, rendererInfo.windowIndex);
        return animateToLeft(commentDiv, 0, -commentDiv.offsetWidth * wideWindowFactor,
                             durationPerDisplayMsec * wideWindowFactor * (1 - durationRatio));
    }).then(() => {
        document.body.removeChild(commentDiv);
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

    window.electron.onUpdateNewlineEnabled((isEnabled) => newlineEnabled = isEnabled);
    window.electron.onUpdateIconEnabled((isEnabled) => iconEnabled = isEnabled);
    window.electron.onUpdateImgEnabled((isEnabled) => imgEnabled = isEnabled);
    window.electron.onUpdateInlineImgEnabled((isEnabled) => inlineImgEnabled = isEnabled);
}
