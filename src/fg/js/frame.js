/* global spell */
function getImageSource(id) {
    return document.querySelector(`#${id}`).src;
}

function registerAddNoteLinks() {
    for (let link of document.getElementsByClassName('odh-addnote')) {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const ds = e.currentTarget.dataset;
            e.currentTarget.src = getImageSource('load');
            let translationEl = document.querySelector('#odh-translation');
            let translation = translationEl && !translationEl.classList.contains('odh-trans-error')
                ? translationEl.textContent : '';
            window.parent.postMessage({
                action: 'addNote',
                params: {
                    nindex: ds.nindex,
                    dindex: ds.dindex,
                    context: document.querySelector('.spell-content').innerHTML,
                    translation: translation
                }
            }, '*');
        });
    }
}

function registerAudioLinks() {
    for (let link of document.getElementsByClassName('odh-playaudio')) {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const ds = e.currentTarget.dataset;
            window.parent.postMessage({
                action: 'playAudio',
                params: {
                    nindex: ds.nindex,
                    dindex: ds.dindex
                }
            }, '*');
        });
    }
}

function registerSoundLinks() {
    for (let link of document.getElementsByClassName('odh-playsound')) {
        link.setAttribute('src', getImageSource('play'));
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const ds = e.currentTarget.dataset;
            window.parent.postMessage({
                action: 'playSound',
                params: {
                    sound: ds.sound,
                }
            }, '*');
        });
    }
}

function initSpellnTranslation(){
    document.querySelector('#odh-container').appendChild(spell());
    document.querySelector('.spell-content').innerHTML=document.querySelector('#context').innerHTML;
    if (document.querySelector('#monolingual').innerText == '1')
        hideTranslation();
}

function registerHiddenClass() {
    for (let div of document.getElementsByClassName('odh-definition')) {
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            hideTranslation();
        });
    }
}

function hideTranslation(){
    let className = 'span.chn_dis, span.chn_tran, span.chn_sent, span.tgt_tran, span.tgt_sent'; // to add your bilingual translation div class name here.
    for (let div of document.querySelectorAll(className)) {
        div.classList.toggle('hidden');
    }
}

function registerExpandLinks() {
    for (let btn of document.getElementsByClassName('odh-expand')) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const dir = e.currentTarget.dataset.dir;
            window.parent.postMessage({ action: 'expandSelection', params: { direction: dir } }, '*');
        });
    }
}

function registerPhraseLinks() {
    for (let link of document.getElementsByClassName('odh-phrase-link')) {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const phrase = e.currentTarget.dataset.phrase;
            window.parent.postMessage({ action: 'expandToPhrase', params: { phrase } }, '*');
        });
    }
}

function api_setTranslation(params) {
    const el = document.querySelector('#odh-translation');
    if (!el) return;

    el.classList.remove('odh-trans-loading', 'odh-trans-error');

    if (params.error) {
        el.classList.add('odh-trans-error');
        el.textContent = params.error;
        return;
    }

    el.contentEditable = 'true';
    el.textContent = params.translation;
}

function onDomContentLoaded() {
    registerAddNoteLinks();
    registerAudioLinks();
    registerSoundLinks();
    registerHiddenClass();
    registerExpandLinks();
    registerPhraseLinks();
    initSpellnTranslation();
}

function onMessage(e) {
    const { action, params } = e.data;
    const method = window['api_' + action];
    if (typeof(method) === 'function') {
        method(params);
    }
}

function api_setActionState(result) {
    const { response, params } = result;
    const { nindex, dindex } = params;

    const match = document.querySelector(`.odh-addnote[data-nindex="${nindex}"].odh-addnote[data-dindex="${dindex}"]`);
    if (response)
        match.src = getImageSource('good');
    else
        match.src = getImageSource('fail');

    setTimeout(() => {
        match.src = getImageSource('plus');
    }, 1000);
}

function onMouseWheel(e) {
    document.querySelector('html').scrollTop -= e.wheelDeltaY / 3;
    document.querySelector('body').scrollTop -= e.wheelDeltaY / 3;
    e.preventDefault();
}

document.addEventListener('DOMContentLoaded', onDomContentLoaded, false);
window.addEventListener('message', onMessage);
window.addEventListener('wheel', onMouseWheel, {passive: false});