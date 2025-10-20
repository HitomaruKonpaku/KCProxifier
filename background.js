
const self = this;

self.loadSettings = function () {
    try {
        const data = {};
        data.proxyHost = window.localStorage.getItem('proxyHost');
        data.proxyPort = window.localStorage.getItem('proxyPort');
        data.proxyEnable = window.localStorage.getItem('proxyEnable');
        data.proxyMode = window.localStorage.getItem('proxyMode');
        return data;
    }
    catch (error) {
        console.error(`Error occurred while loading saved proxy self.settings.\n${error}`);
        return { _error_: error };
    }
};

self.applyProxy = function () {
    self.settings = self.loadSettings();
    self.enable = self.settings.proxyEnable === "true";

    const iconPath = '/assets/icons/KCProxifier_' + (enable ? 'green' : 'blue') + '_32.png';
    chrome.browserAction.setIcon({ path: iconPath });
};

chrome.webRequest.onBeforeRequest.addListener((details) => {
    if (!self.enable || details.method !== 'GET' || details.url.includes('/kcscontents/news'))
        return;

    const url = new URL(details.url);
    console.log("HTTPS:", url.href);

    if (!url.hostname.startsWith('w00'))
        self.serverHost = url.hostname

    let redirectUrl = `http://${self.settings.proxyHost}:${self.settings.proxyPort}`;
    if (self.settings.proxyMode === 'path')
        redirectUrl += `/${url.protocol.slice(0, -1)}/${url.host}`
    redirectUrl += `${url.pathname}${url.search}`

    return { redirectUrl };
},
    { urls: ["*://*.kancolle-server.com/*"] },
    ["blocking"]
);

chrome.webRequest.onBeforeRequest.addListener((details) => {
    if (!self.enable) return;
    let url = new URL(details.url)
    console.log("HTTP:", url.href);
    if (self.serverHost && url.pathname?.includes('/kcs2/resources/world')) {
        const redirectUrl = details.url.replace(
            /\d{3}_\d{3}_\d{3}_\d{3}/,
            `${self.serverHost.split('.')[0].substring(1)}_ver_com`,
        )
        return { redirectUrl };
    }
},
    { urls: ["http://*/*"] },
    ["blocking"]
);

chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
    if (!self.enable || !self.settings.proxyMode === 'header') return;
    const url = new URL(details.url)
    if (['/gadget_html5/', '/kcscontents/'].some(x => url.pathname?.includes(x)))
        details.requestHeaders.push({ name: 'x-host', value: 'w00g.kancolle-server.com' });
    else if (self.serverHost)
        details.requestHeaders.push({ name: 'x-host', value: self.serverHost });
    return { requestHeaders: details.requestHeaders };
},
    { urls: ['http://*/*'] },
    ['blocking', 'requestHeaders'],
);

chrome.runtime.onMessage.addListener(function (msg) {
    if (!msg)
        console.error("KCProxifier: Received null message.");
    else if (msg.action === 'apply-proxy')
        self.applyProxy();
    else
        console.error("KCProxifier: Received unknown message", msg);
});

self.applyProxy();