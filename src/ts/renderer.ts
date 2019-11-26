import window from './window';

function createComment(text: string) {
    const comment = document.createElement('div')
    comment.style.left = window.innerWidth + 'px';
    comment.style.top = Math.floor(Math.random() * window.innerHeight * 0.9) + 'px';
    comment.innerText = text;
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
