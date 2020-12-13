import window from './window';
const SEPARATOR = '##SEP##';
const DURATION_PER_DISPLAY_MSEC = 5000;
const FLASHING_DECAY_TIME_MSEC = 1000;
const IMAGE_LOADING_WAIT_MSEC = 100;

document.addEventListener('DOMContentLoaded', () => {
    for (const eventType of ['focus', 'resize']) {
        window.addEventListener(eventType, () => flashWindow());
    }
    flashWindow();
});

function flashWindow() {
    const effect = [
        { background: 'rgb(0, 255, 0, 0.3)' },
        { background: 'rgb(0, 0, 0, 0)' }
    ];

    const timing = {
        duration: FLASHING_DECAY_TIME_MSEC,
        iterations: 1,
        easing: 'linear'
    };

    document.body.animate(effect, timing);
}

function addComment(text: string, commentCount: number, offsetTopRatio: number) {
    const comment = document.createElement('div')
    comment.className = 'comment';
    comment.style.zIndex = commentCount.toString();
    comment.style.left = window.innerWidth + 'px';
    comment.style.top = Math.floor(window.innerHeight * offsetTopRatio) + 'px';

    const iconImg: HTMLImageElement = document.createElement('img');
    if (text.indexOf(SEPARATOR) !== -1) {
        [iconImg.src, text] = noTruncSplit(text, SEPARATOR, 1);
        iconImg.onerror = () => iconImg.remove();
        iconImg.className = 'icon';
    }

    const span = document.createElement('span');
    span.className = 'content';
    span.textContent = text;
    comment.appendChild(span);

    document.body.appendChild(comment);
    if (iconImg.src) {
        iconImg.height = span.offsetHeight;
        comment.prepend(iconImg);
    }

    const protrusionBottom = comment.offsetTop + comment.offsetHeight - window.innerHeight;
    if (protrusionBottom > 0) {
        const newTop = comment.offsetTop - protrusionBottom;
        comment.style.top = (newTop > 0 ? newTop : 0) + 'px';
    }

    return comment;
}

function startAnimation(div: HTMLDivElement, wideWindowFactor: number): number {
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

function handleComment(text: string, commentCount: number,
        offsetTopRatio: number, windowIndex: number, numDisplays: number, isSingleWindow: boolean) {
    const comment = addComment(text, commentCount, offsetTopRatio);
    const wideWindowFactor = isSingleWindow ? numDisplays : 1;

    setTimeout(() => {
        const arrivalTimeMsec = startAnimation(comment, wideWindowFactor);
        setTimeout(() => {
            window.ipcRenderer.send(
                'comment-arrived-to-left-edge', text, commentCount,
                 offsetTopRatio, windowIndex, numDisplays, isSingleWindow);
        }, arrivalTimeMsec - IMAGE_LOADING_WAIT_MSEC);
    }, IMAGE_LOADING_WAIT_MSEC);
}

window.ipcRenderer.on('comment',
    (event: any, text: string, commentCount: number, offsetTopRatio: number,
    windowIndex: number, numDisplays: number, isSingleWindow: boolean) => {
        handleComment(text, commentCount, offsetTopRatio, windowIndex, numDisplays, isSingleWindow);
})

function noTruncSplit(s: string, sep: string, limit: number) {
    const parts = s.split(sep, limit);
    parts.push(s.slice(parts.join('').length + (sep.length * limit)));
    return parts;
}
