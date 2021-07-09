import { Comment, RendererInfo } from '../../common/types';
import { noTruncSplit } from '../../common/util';
import './window';

const SEPARATOR = '##SEP##';
const FLASHING_DECAY_TIME_MSEC = 1000;

let durationPerDisplayMsec = 0;
let iconEnabled = true;
let isPause = false;


document.addEventListener('DOMContentLoaded', () => {
    window.electron.requestDefaultDuration(setupIpcHandlers);
    window.electron.requestDuration((duration) => durationPerDisplayMsec = duration);
    window.electron.requestIconEnabled((isEnabled) => iconEnabled = isEnabled);

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
    let imgSrc = '';
    if (text.indexOf(SEPARATOR) !== -1) {
        [imgSrc, text] = noTruncSplit(text, SEPARATOR, 1);
        if (!iconEnabled) {
            imgSrc = '';
        }
    }

    const span = document.createElement('span');
    span.className = 'content';
    span.textContent = text;
    commentDiv.appendChild(span);
    document.body.appendChild(commentDiv);

    const protrusionBottom = commentDiv.offsetTop + commentDiv.offsetHeight - window.innerHeight;
    if (protrusionBottom > 0) {
        const newTop = commentDiv.offsetTop - protrusionBottom;
        commentDiv.style.top = (newTop > 0 ? newTop : 0) + 'px';
    }

    return new Promise((resolve) => {
        if (!imgSrc) {
            resolve(commentDiv);
            return;
        }

        const iconImg: HTMLImageElement = document.createElement('img');
        iconImg.onload = () => {
            resolve(commentDiv)
        };
        iconImg.onerror = () => {
            iconImg.remove();
            resolve(commentDiv);
        };

        iconImg.className = 'icon';
        iconImg.height = span.offsetHeight;
        iconImg.src = imgSrc;
        commentDiv.prepend(iconImg);
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

    window.electron.onUpdateIconEnabled((isEnabled) => {
        iconEnabled = isEnabled;
    });
}
