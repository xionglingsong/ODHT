/* global Popup, rangeFromPoint, TextSourceRange, selectedText, isEmpty, getSentence, isValidElement, frontend_api */
function isAlpha(char) {
    return /[-|A-Z|a-z| -ɏ]/.test(char);
}

class ODHFrontend {

    constructor() {
        this.options = null;
        this.point = null;
        this.notes = null;
        this.sentence = null;
        this.audio = {};
        this.enabled = true;
        this.mouseselection = true;
        this.activateKey = 16; // shift 16, ctl 17, alt 18
        this.exitKey = 27; // esc 27
        this.maxContext = 1; //max context sentence #
        this.services = 'none';
        this.popup = new Popup();
        this.timeout = null;
        this.mousemoved = false;
        this.selectionInfo = null;
        this.autotranslation = '';
        this.translateSeq = 0;

        window.addEventListener('mousemove', e => this.onMouseMove(e));
        window.addEventListener('mousedown', e => this.onMouseDown(e));
        window.addEventListener('dblclick', e => this.onDoubleClick(e));
        window.addEventListener('keydown', e => this.onKeyDown(e));

        chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
        window.addEventListener('message', e => this.onFrameMessage(e));
        document.addEventListener('selectionchange', e => this.userSelectionChanged(e));
    }

    onKeyDown(e) {
        if (!this.activateKey)
            return;

        if (!isValidElement())
            return;

        if (this.enabled && this.point !== null && (e.keyCode === this.activateKey || e.charCode === this.activateKey)) {
            const range = rangeFromPoint(this.point);
            if (range == null) return;
            let textSource = new TextSourceRange(range);
            textSource.selectText();
            this.mousemoved = false;
            this.onSelectionEnd(e);
        }

        if (e.keyCode === this.exitKey || e.charCode === this.exitKey)
            this.popup.hide();
    }

    onDoubleClick(e) {
        if (!this.mouseselection)
            return;

        if (!isValidElement())
            return;

        if (this.timeout)
            clearTimeout(this.timeout);
        this.mousemoved = false;
        this.onSelectionEnd(e);
    }

    onMouseDown(e) {
        this.popup.hide();
    }

    onMouseMove(e) {
        this.mousemoved = true;
        this.point = {
            x: e.clientX,
            y: e.clientY,
        };
    }

    userSelectionChanged(e) {

        if (!this.enabled || !this.mousemoved || !this.mouseselection) return;

        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // wait 500 ms after the last selection change event
        this.timeout = setTimeout(() => {
            this.onSelectionEnd(e);
        }, 500);
    }

    async onSelectionEnd(e) {

        if (!this.enabled)
            return;

        if (!isValidElement())
            return;

        // reset selection timeout
        this.timeout = null;
        const expression = selectedText();
        if (isEmpty(expression)) return;

        console.log('[ODH] onSelectionEnd, expression:', expression);

        // save selection info for expand/shrink
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            this.selectionInfo = {
                startNode: range.startContainer,
                startOffset: range.startOffset,
                endNode: range.endContainer,
                endOffset: range.endOffset
            };
        }

        let result = await frontend_api.getTranslation(expression);
        console.log('[ODH] getTranslation result:', result);
        if (result == null || result.length == 0) return;
        this.notes = this.buildNote(result);

        // smart phrase detection: check if adjacent text matches a known phrase
        this.suggestedPhrase = null;
        if (this.selectionInfo) {
            const info = this.selectionInfo;
            const node = info.endNode;
            if (node && node.nodeType === Node.TEXT_NODE && !expression.includes(' ')) {
                const textAfter = node.textContent.substring(info.endOffset);
                const wordPattern = /^(\s+\S+){0,3}/;
                const afterMatch = textAfter.match(wordPattern);
                if (afterMatch) {
                    const candidates = [expression + afterMatch[0].trim()];
                    const words = afterMatch[0].trim().split(/\s+/);
                    for (let i = 1; i < words.length; i++) {
                        candidates.push(expression + ' ' + words.slice(0, i).join(' '));
                    }
                    for (const candidate of candidates) {
                        if (candidate === expression) continue;
                        const candidateLower = candidate.toLowerCase();
                        for (const note of this.notes) {
                            if (note.expression && note.expression.toLowerCase() === candidateLower) {
                                this.suggestedPhrase = candidate;
                                break;
                            }
                        }
                        if (this.suggestedPhrase) break;
                    }
                }
            }
        }

        this.popup.showNextTo({ x: this.point.x, y: this.point.y, }, await this.renderPopup(this.notes));

        // trigger async auto-translation
        this.autotranslation = '';
        if (this.options && this.options.llm_enabled && this.sentence) {
            this.triggerTranslation();
        }

    }

    onMessage(request, sender, callback) {
        const { action, params, target } = request;
        if (target != 'frontend')
            return;

        const method = this['api_' + action];

        if (typeof(method) === 'function') {
            params.callback = callback;
            method.call(this, params);
        }
        return true;
    }

    api_setFrontendOptions(params) {
        let { options, callback } = params;
        this.options = options;
        this.enabled = options.enabled;
        this.mouseselection = options.mouseselection;
        this.activateKey = Number(this.options.hotkey);
        this.maxContext = Number(this.options.maxcontext);
        this.services = options.services;
        callback();
    }

    onFrameMessage(e) {
        const { action, params } = e.data;
        const method = this['api_' + action];
        if (typeof(method) === 'function') {
            method.call(this, params);
        }
    }

    async api_addNote(params) {
        let { nindex, dindex, context, translation } = params;

        let notedef = Object.assign({}, this.notes[nindex]);
        notedef.definition = this.notes[nindex].css + this.notes[nindex].definitions[dindex];
        notedef.definitions = this.notes[nindex].css + this.notes[nindex].definitions.join('<hr>');
        notedef.sentence = context;
        notedef.url = window.location.href;
        notedef.autotranslation = translation !== undefined ? translation : this.autotranslation;
        let response = await frontend_api.addNote(notedef);
        this.popup.sendMessage('setActionState', { response, params });
    }

    async api_playAudio(params) {
        let { nindex, dindex } = params;
        let url = this.notes[nindex].audios[dindex];
        let response = await frontend_api.playAudio(url);
    }

    api_playSound(params) {
        let url = params.sound;

        for (let key in this.audio) {
            this.audio[key].pause();
        }

        const audio = this.audio[url] || new Audio(url);
        audio.currentTime = 0;
        audio.play();

        this.audio[url] = audio;
    }

    async waitForPopupReady() {
        for (let i = 0; i < 20; i++) {
            try {
                let iframe = this.popup.popup;
                if (iframe && iframe.contentDocument
                    && iframe.contentDocument.getElementById('odh-translation')) {
                    return;
                }
            } catch (e) {}
            await new Promise(r => setTimeout(r, 50));
        }
    }

    async triggerTranslation() {
        let seq = ++this.translateSeq;
        let plainSentence = this.sentence.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        let result = await frontend_api.translateSentence(plainSentence);
        if (this.translateSeq === seq) {
            await this.waitForPopupReady();
            if (result) {
                this.autotranslation = result;
                this.popup.sendMessage('setTranslation', { translation: result });
            } else {
                this.popup.sendMessage('setTranslation', { error: 'Translation failed. Check API Key and network.' });
            }
        }
    }

    expandSelection(direction) {
        if (!this.selectionInfo) return;
        const info = this.selectionInfo;
        const node = info.endNode;

        // only works on text nodes
        if (!node || node.nodeType !== Node.TEXT_NODE) return;
        const text = node.textContent;

        if (direction === 'forward') {
            let pos = info.endOffset;
            // skip spaces
            while (pos < text.length && text[pos] === ' ') pos++;
            if (pos >= text.length) return;
            // find end of next word
            let wordEnd = pos;
            while (wordEnd < text.length && isAlpha(text[wordEnd])) wordEnd++;
            if (wordEnd === pos) return;
            info.endOffset = wordEnd;
        } else if (direction === 'backward') {
            let pos = info.startOffset;
            // skip spaces
            while (pos > 0 && text[pos - 1] === ' ') pos--;
            if (pos <= 0) return;
            // find start of previous word
            let wordStart = pos;
            while (wordStart > 0 && isAlpha(text[wordStart - 1])) wordStart--;
            if (wordStart === pos) return;
            info.startOffset = wordStart;
        }

        // apply new selection
        const newRange = document.createRange();
        newRange.setStart(info.startNode, info.startOffset);
        newRange.setEnd(info.endNode, info.endOffset);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(newRange);

        // re-trigger lookup
        this.onSelectionEnd(null);
    }

    async api_expandSelection(params) {
        this.expandSelection(params.direction);
    }

    async api_expandToPhrase(params) {
        const phrase = params.phrase;
        if (!this.selectionInfo || !phrase) return;
        const info = this.selectionInfo;
        const node = info.endNode;
        if (!node || node.nodeType !== Node.TEXT_NODE) return;

        const text = node.textContent;
        const target = phrase.toLowerCase();
        // expand forward word by word until we match the phrase
        let pos = info.endOffset;
        let current = text.substring(info.startOffset, pos).toLowerCase();
        while (pos < text.length && current !== target) {
            // skip space
            while (pos < text.length && text[pos] === ' ') pos++;
            // find end of next word
            let wordEnd = pos;
            while (wordEnd < text.length && isAlpha(text[wordEnd])) wordEnd++;
            if (wordEnd === pos) break;
            pos = wordEnd;
            current = text.substring(info.startOffset, pos).toLowerCase();
        }
        if (current === target) {
            info.endOffset = pos;
            const newRange = document.createRange();
            newRange.setStart(info.startNode, info.startOffset);
            newRange.setEnd(info.endNode, info.endOffset);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(newRange);
            this.onSelectionEnd(null);
        }
    }

    buildNote(result) {
        //get 1 sentence around the expression.
        const expression = selectedText();
        const sentence = getSentence(this.maxContext);
        this.sentence = sentence;
        let tmpl = {
            css: '',
            expression,
            reading: '',
            extrainfo: '',
            definitions: '',
            sentence,
            url: '',
            audios: [],
        };

        //if 'result' is array with notes.
        if (Array.isArray(result)) {
            for (const item of result) {
                for (const key in tmpl) {
                    item[key] = item[key] ? item[key] : tmpl[key];
                }
            }
            return result;
        } else { // if 'result' is simple string, then return standard template.
            tmpl['definitions'] = [].concat(result);
            return [tmpl];
        }

    }

    async renderPopup(notes) {
        let content = '';
        let services = this.options ? this.options.services : '';
        let image = '';
        let imageclass = '';
        if (services != 'none') {
            image = (services == 'ankiconnect') ? 'plus.png' : 'cloud.png';
            imageclass = await frontend_api.isConnected() ? 'class="odh-addnote"' : 'class="odh-addnote-disabled"';
        }

        // check if selection can be expanded
        let canExpandBackward = false;
        let canExpandForward = false;
        if (this.selectionInfo) {
            const info = this.selectionInfo;
            const node = info.endNode;
            if (node && node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                // check forward: is there a word after endOffset?
                let pos = info.endOffset;
                while (pos < text.length && text[pos] === ' ') pos++;
                canExpandForward = pos < text.length && isAlpha(text[pos]);
                // check backward: is there a word before startOffset?
                pos = info.startOffset;
                while (pos > 0 && text[pos - 1] === ' ') pos--;
                canExpandBackward = pos > 0 && isAlpha(text[pos - 1]);
            }
        }
        let expandBackBtn = canExpandBackward ? '<span class="odh-expand" data-dir="backward">◀</span>' : '';
        let expandFwdBtn = canExpandForward ? '<span class="odh-expand" data-dir="forward">▶</span>' : '';

        for (const [nindex, note] of notes.entries()) {
            content += note.css + '<div class="odh-note">';
            let audiosegment = '';
            if (note.audios) {
                for (const [dindex, audio] of note.audios.entries()) {
                    if (audio)
                        audiosegment += `<img class="odh-playaudio" data-nindex="${nindex}" data-dindex="${dindex}" src="${chrome.runtime.getURL('fg/img/play.png')}"/>`;
                }
            }
            content += `
                <div class="odh-headsection">
                    <span class="odh-audios">${audiosegment}</span>
                    ${expandBackBtn}<span class="odh-expression">${note.expression}</span>${expandFwdBtn}
                    <span class="odh-reading">${note.reading}</span>
                    <span class="odh-extra">${note.extrainfo}</span>
                </div>`;
            // show phrase suggestion (only for first note)
            if (nindex === 0 && this.suggestedPhrase) {
                content += `<div class="odh-phrase-hint">Also: <span class="odh-phrase-link" data-phrase="${this.suggestedPhrase}">${this.suggestedPhrase}</span></div>`;
            }
            for (const [dindex, definition] of note.definitions.entries()) {
                let button = (services == 'none' || services == '') ? '' : `<img ${imageclass} data-nindex="${nindex}" data-dindex="${dindex}" src="${chrome.runtime.getURL('fg/img/'+ image)}" />`;
                content += `<div class="odh-definition">${button}${definition}</div>`;
            }
            content += '</div>';
        }
        //content += `<textarea id="odh-context" class="odh-sentence">${this.sentence}</textarea>`;
        content += '<div id="odh-container" class="odh-sentence"></div>';
        if (this.options && this.options.llm_enabled) {
            content += '<div id="odh-translation" class="odh-translation odh-trans-loading">Translating...</div>';
        }
        return this.popupHeader() + content + this.popupFooter();
    }

    popupHeader() {
        let root = chrome.runtime.getURL('/');
        return `
        <html lang="en">
            <head><meta charset="UTF-8"><title></title>
                <link rel="stylesheet" href="${root+'fg/css/frame.css'}">
                <link rel="stylesheet" href="${root+'fg/css/spell.css'}">
            </head>
            <body style="margin:0px;">
            <div class="odh-notes">`;
    }

    popupFooter() {
        let root = chrome.runtime.getURL('/');
        let services = this.options ? this.options.services : '';
        let image = (services == 'ankiconnect') ? 'plus.png' : 'cloud.png';
        let button = chrome.runtime.getURL('fg/img/' + image);
        let monolingual = this.options ? (this.options.monolingual == '1' ? 1 : 0) : 0;

        return `
            </div>
            <div class="icons hidden"">
                <img id="plus" src="${button}"/>
                <img id="load" src="${root+'fg/img/load.gif'}"/>
                <img id="good" src="${root+'fg/img/good.png'}"/>
                <img id="fail" src="${root+'fg/img/fail.png'}"/>
                <img id="play" src="${root+'fg/img/play.png'}"/>
                <div id="context">${this.sentence}</div>
                <div id="monolingual">${monolingual}</div>
                </div>
            <script src="${root+'fg/js/spell.js'}"></script>
            <script src="${root+'fg/js/frame.js'}"></script>
            </body>
        </html>`;
    }
}

window.odh_frontend = new ODHFrontend();
window.frontend_api = new FrontendAPI();
