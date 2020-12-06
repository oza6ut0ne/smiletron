import window from './window';
const SEPARATOR = '##SEP##';
const DURATION_PER_DISPLAY = 6000;
const FLASHING_DECAY_TIME = 1000;

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
        duration: FLASHING_DECAY_TIME,
        iterations: 1,
        easing: 'linear'
    };

    document.body.animate(effect, timing);
}

function addComment(text: string) {
    const comment = document.createElement('div')
    comment.className = 'comment';
    comment.style.left = window.innerWidth + 'px';
    comment.style.top = Math.floor(Math.random() * window.innerHeight * 0.9) + 'px';

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

    return comment;
}

function startAnimation(div: HTMLDivElement, numDisplays: number) {
    const effect = [
        { left: window.innerWidth + 'px' },
        { left: -div.offsetWidth * numDisplays + 'px' }
    ];

    const timing = {
        duration: DURATION_PER_DISPLAY * numDisplays,
        iterations: 1,
        easing: 'linear'
    };

    div.animate(effect, timing).onfinish = function () {
        document.body.removeChild(div);
    }
}

function handleComment(text: string, numDisplays: number) {
    const comment = addComment(text);
    setTimeout(startAnimation, 100, comment, numDisplays);
}

window.ipcRenderer.on('comment', (event: any, text: string, numDisplays: number) => {
    handleComment(text, numDisplays);
})

function noTruncSplit(s: string, sep: string, limit: number) {
    const parts = s.split(sep, limit);
    parts.push(s.slice(parts.join('').length + (sep.length * limit)));
    return parts;
}
