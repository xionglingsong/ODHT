/* global api */
class Sandbox {
    constructor() {
        this.audios = {};
        this.dicts = {};
        this.current = null;
        window.addEventListener('message', e => this.onBackgroundMessage(e));
    }

    onBackgroundMessage(e) {
        const { action, params } = e.data;
        const method = this['backend_' + action];
        if (typeof(method) === 'function') {
            method.call(this, params);
        }
    }

    buildScriptURL(name) {
        let gitbase = 'https://raw.githubusercontent.com/ninja33/ODH/master/src/dict/';
        let url = name;

        if (url.indexOf('://') == -1) {
            url = '/dict/' + url;
        } else {
            //build remote script url with gitbase(https://) if prefix lib:// existing.
            url = (url.indexOf('lib://') != -1) ? gitbase + url.replace('lib://', '') : url;            
        }

        //add .js suffix if missing.
        url = (url.indexOf('.js') == -1) ? url + '.js' : url;
        return url;
    }

    async backend_loadScript(params) {
        let { name, callbackId } = params;
        let url = this.buildScriptURL(name);
        console.log('[ODH Sandbox] loadScript:', name, '→', url);

        let scripttext = await api.fetch(url);
        if (!scripttext) {
            console.error('[ODH Sandbox] loadScript fetch failed:', url);
            api.callback({ name, result: null }, callbackId);
            return;
        }
        try {
            let SCRIPT = eval(`(${scripttext})`);
            if (SCRIPT.name && typeof SCRIPT === 'function') {
                let script = new SCRIPT();
                this.dicts[SCRIPT.name] = script;
                let displayname = typeof(script.displayName) === 'function' ? await script.displayName() : SCRIPT.name;
                console.log('[ODH Sandbox] loaded:', SCRIPT.name, '→ dicts keys:', Object.keys(this.dicts));
                api.callback({ name, result: { objectname: SCRIPT.name, displayname } }, callbackId);
            } else {
                console.error('[ODH Sandbox] loadScript eval result has no name or is not a function:', SCRIPT);
                api.callback({ name, result: null }, callbackId);
            }
        } catch (err) {
            console.error('[ODH Sandbox] loadScript eval error:', err);
            api.callback({ name, result: null }, callbackId);
            return;
        }
    }

    backend_setScriptsOptions(params) {
        let { options, callbackId } = params;

        console.log('[ODH Sandbox] setScriptsOptions: dictSelected=', options.dictSelected, 'dicts keys=', Object.keys(this.dicts));

        for (const dictionary of Object.values(this.dicts)) {
            if (typeof(dictionary.setOptions) === 'function')
                dictionary.setOptions(options);
        }

        let selected = options.dictSelected;
        if (this.dicts[selected]) {
            this.current = selected;
            api.callback(selected, callbackId);
            return;
        }
        console.warn('[ODH Sandbox] setScriptsOptions: dict not found, trying first available');
        // fallback: pick the first available dictionary
        let firstKey = Object.keys(this.dicts)[0];
        if (firstKey) {
            this.current = firstKey;
            api.callback(firstKey, callbackId);
            return;
        }
        api.callback(null, callbackId);
    }

    async backend_findTerm(params) {
        let { expression, callbackId } = params;

        if (this.dicts[this.current] && typeof(this.dicts[this.current].findTerm) === 'function') {
            let notes = await this.dicts[this.current].findTerm(expression);
            api.callback(notes, callbackId);
            return;
        }
        api.callback(null, callbackId);
    }
}

window.sandbox = new Sandbox();
document.addEventListener('DOMContentLoaded', () => {
    api.initBackend();
}, false);