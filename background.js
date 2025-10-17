
const self = this;

self.loadSettings = function() {
    try {
        const data = {};
        data.proxyHost = window.localStorage.getItem('proxyHost');
        data.proxyPort = window.localStorage.getItem('proxyPort');
        data.proxyEnable = window.localStorage.getItem('proxyEnable');
        return data;
    }
    catch (error) {
        console.error(`Error occurred while loading saved proxy self.settings.\n${error}`);
        return { _error_: error };
    }
};

self.applyProxy = function () {
    self.settings = self.loadSettings();
    const enable = self.settings.proxyEnable === "true";
    if (enable) {
        chrome.webRequest.onBeforeRequest.addListener(
            self.handleBeforeRequest,
            { urls: ["*://*.kancolle-server.com/*"] },
            ["blocking"]
        );
    }
    else {
        chrome.webRequest.onBeforeRequest.removeListener(self.handleBeforeRequest);
    }
    
    const iconPath = '/assets/icons/KCProxifier_' + (enable ? 'green' : 'blue') + '_32.png';
    chrome.browserAction.setIcon({ path: iconPath });
};

self.handleBeforeRequest = function(details) {
    if (details.method !== 'GET' || details.url.includes('/kcscontents/news'))
        return;

    const url = new URL(details.url);
    console.log(url);
    const redirectUrl = `http://${self.settings.proxyHost}:${self.settings.proxyPort}/${url.protocol.slice(0,-1)}/${url.host}${url.pathname}${url.search}`;
    return { redirectUrl };
};

chrome.runtime.onMessage.addListener(function(msg) {
    if (!msg)
        console.error("KCProxifier: Received null message.");
    else if (msg.action === 'apply-proxy')
        applyProxy(msg.host, msg.port, msg.enable);
    else
        console.error("KCProxifier: Received unknown message", msg);
});

self.applyProxy();