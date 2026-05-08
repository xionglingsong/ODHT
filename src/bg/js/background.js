/* global Agent */
class ODHBackground {
    constructor() {
        this.audios = {};
        this.agent = new Agent(document.getElementById('sandbox').contentWindow);
        // add listener
        chrome.runtime.onMessage.addListener(this.onServiceMessage.bind(this));
        window.addEventListener('message', e => this.onSandboxMessage(e));
    }

    playAudio(url) {
        for (let key in this.audios) {
            this.audios[key].pause();
        }

        const audio = this.audios[url] || new Audio(url);
        audio.currentTime = 0;
        audio.play();
        this.audios[url] = audio;
    }
    // message exchange for both servicework and sandbox start from here ...
    
    // message from service worker to sandbox
    onServiceMessage(request, sender, callback) {
        const { action, params, target } = request;
        if (target != 'background')
            return;

        console.log('[ODH BG] onServiceMessage:', action, params);

        if (action == 'playAudio') {
            let { url } = params
            this.playAudio(url)
            callback(url)
            return true;
        }
        
        this.sendtoSandbox(action, params).then(result => callback(result));
        return true;
    }

    async sendtoSandbox(action, params) {
        return new Promise((resolve, reject) => {
            try {
                this.agent.postMessage(action, params, result => resolve(result));
            } catch (err) {
                reject(null);
            }
        });
    }
    
    // message from sandbox to service worker
    async sendtoServiceworker(request){
        request.target='serviceworker';
        try {
            return await chrome.runtime.sendMessage(request);
        } catch (e) {
            return null
        }
    }
    async onSandboxMessage(e) {
        const { action, params } = e.data;
        // Don't forward 'callback' messages to service worker - they're handled by Agent
        if (action === 'callback') return;
        const callbackId = params.callbackId
        console.log('[ODH BG] onSandboxMessage:', action, callbackId);
        try {
            const result = await this.sendtoServiceworker({action, params});
            console.log('[ODH BG] onSandboxMessage result:', action, result);
            this.callback(result, callbackId);
        } catch (e) {
            console.error('[ODH BG] onSandboxMessage error:', action, e);
            this.callback(null, callbackId);
        }

    }

    // 'callback' helper to simply simulate postMessage callback
    callback(data, callbackId) {
        this.agent.postMessage('callback', { data, callbackId });
    }
}

window.odhbackground = new ODHBackground();