import { IpcRendererEvent } from 'electron';
import { Comment, RendererInfo } from '../../common/types';
import { noTruncSplit } from '../../common/util';
import window from './window';

const SEPARATOR = '##SEP##';
const DURATION_PER_DISPLAY_MSEC = 5000;
const FLASHING_DECAY_TIME_MSEC = 1000;
const IMAGE_LOADING_WAIT_MSEC = 100;


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

function addComment(comment: Comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.style.zIndex = comment.id.toString();
    commentDiv.style.left = window.innerWidth + 'px';
    commentDiv.style.top = Math.floor(window.innerHeight * comment.offsetTopRatio) + 'px';

    const iconImg: HTMLImageElement = document.createElement('img');
    let text = comment.text;
    if (text.indexOf(SEPARATOR) !== -1) {
        [iconImg.src, text] = noTruncSplit(text, SEPARATOR, 1);
        iconImg.onerror = () => iconImg.remove();
        iconImg.className = 'icon';
    }

    const span = document.createElement('span');
    span.className = 'content';
    span.textContent = text;
    commentDiv.appendChild(span);

    document.body.appendChild(commentDiv);
    if (iconImg.src) {
        iconImg.height = span.offsetHeight;
        commentDiv.prepend(iconImg);
    }

    const protrusionBottom = commentDiv.offsetTop + commentDiv.offsetHeight - window.innerHeight;
    if (protrusionBottom > 0) {
        const newTop = commentDiv.offsetTop - protrusionBottom;
        commentDiv.style.top = (newTop > 0 ? newTop : 0) + 'px';
    }

    return commentDiv;
}

function startAnimation(div: HTMLDivElement, rendererInfo: RendererInfo): number {
    const wideWindowFactor = rendererInfo.isSingleWindow ? rendererInfo.numDisplays : 1;

    const effect = [
        { left: window.innerWidth + 'px' },
        { left: -div.offsetWidth * wideWindowFactor + 'px' }
    ];

    const timing = {
        duration: DURATION_PER_DISPLAY_MSEC * wideWindowFactor,
        iterations: 1,
        easing: 'linear'
    };

    div.animate(effect, timing).onfinish = function () {
        document.body.removeChild(div);
    };

    const velocity = (window.innerWidth + div.offsetWidth) / DURATION_PER_DISPLAY_MSEC;
    const arrivalTimeMsec = window.innerWidth / velocity;
    return arrivalTimeMsec;
}

function handleComment(comment: Comment, rendererInfo: RendererInfo) {
    const commentDiv = addComment(comment);

    setTimeout(() => {
        const arrivalTimeMsec = startAnimation(commentDiv, rendererInfo);
        setTimeout(() => {
            window.ipcRenderer.send('comment-arrived-to-left-edge', comment, rendererInfo.windowIndex);
        }, arrivalTimeMsec - IMAGE_LOADING_WAIT_MSEC);
    }, IMAGE_LOADING_WAIT_MSEC);
}

window.ipcRenderer.on('comment',
    (event: IpcRendererEvent, comment: Comment, rendererInfo: RendererInfo) => {
        handleComment(comment, rendererInfo);
})
