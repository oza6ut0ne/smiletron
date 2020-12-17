import { Comment, RendererInfo } from '../../common/types';
import { noTruncSplit } from '../../common/util';
import './window';

const SEPARATOR = '##SEP##';
const DURATION_PER_DISPLAY_MSEC = 5000;
const FLASHING_DECAY_TIME_MSEC = 1000;

let isPause = false;


document.addEventListener('DOMContentLoaded', () => {
    for (const eventType of ['focus', 'resize']) {
        window.addEventListener(eventType, () => flashWindow());
    }
    flashWindow().onfinish = flashWindow;
});

function flashWindow(): Animation {
    const effect = [
        { background: 'rgb(0, 255, 0, 0.3)' },
        { background: 'rgb(0, 0, 0, 0)' }
    ];

    const timing = {
        duration: FLASHING_DECAY_TIME_MSEC,
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
    const efect = [
        { left: start + 'px' },
        { left: end + 'px' }
    ];

    const timing = {
        duration: duration,
        iterations: 1,
        easing: 'linear'
    };

    const animation = div.animate(efect, timing);
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
                  DURATION_PER_DISPLAY_MSEC * wideWindowFactor * durationRatio)
    .then(() => {
        window.electron.notifyCommentArrivedToLeftEdge(comment, rendererInfo.windowIndex);
        return animateToLeft(commentDiv, 0, -commentDiv.offsetWidth * wideWindowFactor,
                             DURATION_PER_DISPLAY_MSEC * wideWindowFactor * (1 - durationRatio));
    }).then(() => {
        document.body.removeChild(commentDiv);
    });
}

window.electron.onCommentReceived(handleComment);
window.electron.onTogglePause(() => {
    if (isPause) {
        isPause = false;
        document.getAnimations().forEach(a => a.play());
    } else {
        isPause = true;
        document.getAnimations().forEach(a => a.pause());
    }
});
