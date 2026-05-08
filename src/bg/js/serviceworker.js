/* global Ankiconnect, Deinflector, Builtin, Agent, optionsLoad, optionsSave */
class ODHServiceworker {
    constructor() {

        this.options = null;
        this.translationCache = new Map();

        this.ankiconnect = new Ankiconnect();
        //this.ankiweb = new Ankiweb();
        this.target = null;

        //setup lemmatizer
        this.deinflector = new Deinflector();
        this.deinflector.loadData();

        //Setup builtin dictionary data
        this.builtin = new Builtin();
        this.builtin.loadData();

        chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
        chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
        chrome.tabs.onCreated.addListener((tab) => this.onTabReady(tab.id));
        chrome.tabs.onUpdated.addListener(this.onTabReady.bind(this));
        chrome.commands.onCommand.addListener((command) => this.onCommand(command));
    }

    onCommand(command) {
        if (command != 'enabled') return;
        this.options.enabled = !this.options.enabled;
        this.setFrontendOptions(this.options);
        optionsSave(this.options);
    }

    onInstalled(details) {
        if (details.reason === 'install') {
            chrome.tabs.create({ url: chrome.runtime.getURL('bg/guide.html') });
            return;
        }
        if (details.reason === 'update') {
            chrome.tabs.create({ url: chrome.runtime.getURL('bg/update.html') });
            return;
        }
    }

    onTabReady(tabId) {
        this.tabInvoke(tabId, {
            action:'setFrontendOptions', 
            params: { 
                options: this.options 
            }
        });
    }

    setFrontendOptions(options) {

        switch (options.enabled) {
            case false:
                chrome.action.setBadgeText({ text: 'off' });
                break;
            case true:
                chrome.action.setBadgeText({ text: '' });
                break;
        }
        this.tabInvokeAll({
            action:'setFrontendOptions',
            params: {
                options
            }
        });
    }

    checkLastError(){
        // NOP
    }

    tabInvokeAll(request) {
        chrome.tabs.query({}, (tabs) => {
            for (let tab of tabs) {
                this.tabInvoke(tab.id, request);
            }
        });
    }

    tabInvoke(tabId, request) {
        const callback = () => this.checkLastError(chrome.runtime.lastError);
        request.target = "frontend"
        chrome.tabs.sendMessage(tabId, request, callback);
    }

    formatNote(notedef) {
        let options = this.options;
        if (!options.deckname || !options.typename || !options.expression)
            return null;

        let note = {
            deckName: options.deckname,
            modelName: options.typename,
            options: { allowDuplicate: options.duplicate == '1' ? true : false },
            fields: {},
            tags: []
        };

        let fieldnames = ['expression', 'reading', 'extrainfo', 'definition', 'definitions', 'sentence', 'url', 'autotranslation'];
        for (const fieldname of fieldnames) {
            if (!options[fieldname]) continue;
            note.fields[options[fieldname]] = notedef[fieldname];
        }

        let tags = options.tags.trim();
        if (tags.length > 0) 
            note.tags = tags.split(' ');

        if (options.audio && notedef.audios.length > 0) {
            note.fields[options.audio] = '';
            let audionumber = Number(options.preferredaudio);
            audionumber = (audionumber && notedef.audios[audionumber]) ? audionumber : 0;
            let audiofile = notedef.audios[audionumber];
            note.audio = {
                'url': audiofile,
                'filename': `ODH_${options.dictSelected}_${encodeURIComponent(notedef.expression)}_${audionumber}.mp3`,
                'fields': [options.audio]
            };
        }

        return note;
    }

    // Message Hub and Handler start from here ...
    onMessage(request, sender, callback) {
        const { action, params, target} = request;

        if (target != 'serviceworker')
            return;

        console.log('[ODH SW] onMessage:', action, params);

        const method = this['api_' + action];

        if (typeof(method) === 'function') {
            params.callback = callback;
            method.call(this, params);
        }
        return true;
    }

    async sendtoBackground(request){
        request.target='background';
        const created = await setupOffscreenDocument('/bg/background.html');
        if (created) {
            // Give sandbox time to load and send initBackend
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        try {
            const result =  await chrome.runtime.sendMessage(request);
            console.log('[ODH SW] sendtoBackground response:', request.action, result);
            return result;
        } catch (e) {
            console.log('[ODH SW] sendtoBackground error:', e);
            return null
        }
    }

    // sandbox message handler
    async api_Fetch(params) {
        let { url, callback } = params;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }
        
            const text = await response.text();
            callback(text);
        } catch (e) {
            callback(null);
        }
    }

    async api_Deinflect(params) {
        let { word, callback } = params;
        callback(this.deinflector.deinflect(word));
    }

    async api_getBuiltin(params) {
        let { dict, word, callback } = params;
        callback(this.builtin.findTerm(dict, word));
    }

    async api_getLocale(params) {
        let { callback } = params;
        callback(chrome.i18n.getUILanguage());
    }

    async api_initBackend(params) {
        let options = await optionsLoad();
        this.options = null; // Force script reload for new sandbox
        await this.optionsChanged(options);
    }

    // Frontend API
    async api_getTranslation(params) {
        let { expression, callback } = params;
        console.log('[ODH SW] api_getTranslation:', expression);

        // Fix https://github.com/ninja33/ODH/issues/97
        if (expression.endsWith(".")) {
            expression = expression.slice(0, -1);
        }

        try {
            let result = await this.findTerm(expression);
            callback(result);
        } catch (err) {
            callback(null);
        }
    }

    async api_addNote(params) {
        let { notedef, callback } = params;

        const note = this.formatNote(notedef);
        try {
            let result = await this.target.addNote(note);
            callback(result);
        } catch (err) {
            console.error(err);
            callback(null);
        }
    }

    async api_playAudio(params) {
        let { url, callback } = params;

        try {
            let result = await this.playAudio(url);
            callback(result);
        } catch (err) {
            callback(null);
        }
    }

    async api_translateSentence(params) {
        let { sentence, callback } = params;
        let options = this.options;

        if (!options || !options.llm_enabled || !options.llm_apikey) {
            callback(null);
            return;
        }

        let cacheKey = `${options.llm_source_lang || 'en'}>${options.llm_target_lang || 'zh'}:${sentence}`;
        if (this.translationCache.has(cacheKey)) {
            callback(this.translationCache.get(cacheKey));
            return;
        }

        try {
            let response = await fetch(`${options.llm_baseurl}/responses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${options.llm_apikey}`
                },
                body: JSON.stringify({
                    model: options.llm_model,
                    input: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'input_text',
                                    text: sentence,
                                    translation_options: {
                                        source_language: options.llm_source_lang || 'en',
                                        target_language: options.llm_target_lang || 'zh'
                                    }
                                }
                            ]
                        }
                    ]
                })
            });
            let data = await response.json();
            let text = data?.output?.[0]?.content?.[0]?.text
                    || data?.output?.[0]?.text
                    || null;
            if (text) {
                this.translationCache.set(cacheKey, text);
                if (this.translationCache.size > 200) {
                    let firstKey = this.translationCache.keys().next().value;
                    this.translationCache.delete(firstKey);
                }
                callback(text);
            } else {
                console.warn('[ODH SW] Translation API unexpected response:', JSON.stringify(data));
                callback(null);
            }
        } catch (err) {
            console.error('Translation API error:', err);
            callback(null);
        }
    }

    // Option page and Brower Action page requests handlers.
    async optionsChanged(options) {
        this.setFrontendOptions(options);

        switch (options.services) {
            case 'none':
                this.target = null;
                break;
            case 'ankiconnect':
                this.target = this.ankiconnect;
                break;
            case 'ankiweb':
                this.target = this.ankiweb;
                break;
            default:
                this.target = null;
        }
        if (this.target !== null && typeof(this.target.initConnection) === 'function')
            await this.target.initConnection(options);

        let defaultscripts = ['builtin_encn_Collins'];
        let newscripts = `${options.sysscripts},${options.udfscripts}`;
        let loadresults = null;
        if (!this.options || (`${this.options.sysscripts},${this.options.udfscripts}` != newscripts)) {
            const scriptsset = Array.from(new Set(defaultscripts.concat(newscripts.split(',').filter(x => x).map(x => x.trim()))));
            loadresults = await this.loadScripts(scriptsset);
        }

        this.options = options;
        if (loadresults && loadresults.length > 0) {
            let namelist = loadresults.map(x => x.result.objectname);
            this.options.dictSelected = namelist.includes(options.dictSelected) ? options.dictSelected : namelist[0];
            this.options.dictNamelist = loadresults.map(x => x.result);
        } else if (!this.options.dictSelected) {
            console.warn('[ODH SW] No dictionaries loaded, dictionary lookup will not work');
        }
        await this.setScriptsOptions(this.options);
        optionsSave(this.options);
    }

    // Option pages API
    async api_optionsChanged(params) {
        let { options, callback } = params;
        await this.optionsChanged(options);
        callback(this.options);
    }

    async api_getDeckNames(params) {
        let { callback } = params;
        callback(this.target ? await this.target.getDeckNames() : null);
    }

    async api_getModelNames(params) {
        let { callback } = params;
        callback(this.target ? await this.target.getModelNames() : null);
    }

    async api_getModelFieldNames(params) {
        let { modelName, callback } = params;
        callback(this.target ? await this.target.getModelFieldNames(modelName) : null);
    }

    async api_getVersion(params) {
        let { callback } = params;
        callback(this.target ? await this.target.getVersion() : null);
    }

    // Sandbox API
    async loadScripts(list) {
        let promises = list.map((name) => this.loadScript(name));
        let results = await Promise.all(promises);
        return results.filter(x => x && x.result);
    }

    async loadScript(name) {
        return await this.sendtoBackground({action:'loadScript', params:{name}});
    }

    async setScriptsOptions(options) {
        return await this.sendtoBackground({action:'setScriptsOptions', params:{options}});
    }

    async findTerm(expression) {
        let result = await this.sendtoBackground({action:'findTerm', params:{expression}});
        if (result === null) {
            // Sandbox may have been recreated (empty dicts), force reinitialize and retry
            console.log('[ODH SW] findTerm returned null, reinitializing sandbox...');
            this.options = null;
            let options = await optionsLoad();
            await this.optionsChanged(options);
            result = await this.sendtoBackground({action:'findTerm', params:{expression}});
        }
        return result;
    }

    async playAudio(url) {
        return await this.sendtoBackground({action:'playAudio', params:{url}});
    }
}

importScripts('ankiconnect.js');
importScripts('builtin.js');
importScripts('deinflector.js');
importScripts('utils.js');
importScripts('agent.js');

setupOffscreenDocument('/bg/background.html');
odh_serviceworker = new ODHServiceworker();

// according to woxxom's reply on below stackoverflow discussion
// https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();