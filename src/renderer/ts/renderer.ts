import { Comment, RendererInfo } from '../../common/types';
import { noTruncSplit } from '../../common/util';
import './window';

const ICON_SEPARATOR = '##ICON##';
const IMG_SEPARATOR = '##IMG##';
const FLASHING_DECAY_TIME_MSEC = 1000;

let durationPerDisplayMsec: number;
let iconEnabled: boolean;
let imgEnabled: boolean;
let isPause = false;


document.addEventListener('DOMContentLoaded', () => {
    window.electron.requestDefaultDuration(setupIpcHandlers);
    window.electron.requestDuration((duration) => durationPerDisplayMsec = duration);
    window.electron.requestIconEnabled((isEnabled) => iconEnabled = isEnabled);
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

    if (imgEnabled) {
        text = text.replace(/[\r\n]+/g, '');
    }

    const height = calcHeight(text);
    const imgPromises: Promise<void>[] = [];
    imgPromises.push(addImage(commentDiv, iconSrc, height));

    if (imgEnabled) {
        text.split(IMG_SEPARATOR).forEach((t, i) => {
            (i % 2 == 0) ? addSpan(commentDiv, t) : imgPromises.push(addImage(commentDiv, t, height));
        });
    } else {
        const content = text.split(IMG_SEPARATOR).filter((_, i) => i % 2 == 0).join('');
        addSpan(commentDiv, content);
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
    const span = document.createElement('span');
    span.className = 'content';
    span.textContent = text;
    div.appendChild(span);
}

function addImage(div: HTMLDivElement, imgSrc: string, height: number): Promise<void> {
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

        iconImg.className = 'image';
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

    window.electron.onUpdateIconEnabled((isEnabled) => iconEnabled = isEnabled);
    window.electron.onUpdateImgEnabled((isEnabled) => imgEnabled = isEnabled);
}
