import window from './window';
const sep = '##SEP##';

function addComment(text: string) {
    const comment = document.createElement('div')
    comment.className = 'comment';
    comment.style.left = window.innerWidth + 'px';
    comment.style.top = Math.floor(Math.random() * window.innerHeight * 0.9) + 'px';

    if (navigator.userAgent.indexOf('Linux') !== -1) {
        comment.classList.add('linux');
    }

    const iconImg: HTMLImageElement = document.createElement('img');
    if (text.indexOf(sep) !== -1) {
        [iconImg.src, text] = noTruncSplit(text, sep, 1);
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

function startAnimation(div: HTMLDivElement) {
    const effect = [
        { left: window.innerWidth + 'px' },
        { left: -div.offsetWidth + 'px' }
    ];

    const timing = {
        duration: 6000,
        iterations: 1,
        easing: 'linear'
    };

    div.animate(effect, timing).onfinish = function () {
        document.body.removeChild(div);
    }
}

function handleComment(text: string) {
    const comment = addComment(text);
    setTimeout(startAnimation, 100, comment);
}

window.ipcRenderer.on('comment', (event: any, args: any) => {
    handleComment(args);
})

function noTruncSplit(s: string, sep: string, limit: number) {
    const parts = s.split(sep, limit);
    parts.push(s.slice(parts.join('').length + (sep.length * limit)));
    return parts;
}
