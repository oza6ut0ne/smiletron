import window from './window';
const sep = '###SEP###';

function createComment(text: string) {
    const comment = document.createElement('div')
    comment.style.left = window.innerWidth + 'px';
    comment.style.top = Math.floor(Math.random() * window.innerHeight * 0.9) + 'px';

    if (navigator.userAgent.indexOf('Linux') !== -1) {
        comment.classList.add('linux');
    }

    if (text.indexOf(sep) !== -1) {
        var [icon, text] = noTruncSplit(text, sep, 1);
        const img = document.createElement('img');
        img.src = icon;
        comment.appendChild(img);
    }

    const span = document.createElement('span');
    span.innerText = text;
    comment.appendChild(span);
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
    const comment = createComment(text);
    document.body.appendChild(comment);
    startAnimation(comment);
}

window.ipcRenderer.on('comment', (event: any, args: any) => {
    handleComment(args);
})

function noTruncSplit(s: string, sep: string, limit: number) {
    const parts = s.split(sep, limit);
    parts.push(s.slice(parts.join('').length + (sep.length * limit)));
    return parts;
}
