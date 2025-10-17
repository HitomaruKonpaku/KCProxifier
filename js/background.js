(() => {

    console.log('KCProxifier: Loaded')

    let proxyHost = '127.0.0.1'
    let proxyPort = 8080
    let proxyEnable = true

    function logSettings() {
        console.warn({ proxyHost, proxyPort, proxyEnable })
    }

    function loadSettings() {
        proxyHost = window.localStorage.getItem('proxyHost')
            || proxyHost
        proxyPort = window.localStorage.getItem('proxyPort')
            || proxyPort
        proxyEnable = window.localStorage.getItem('proxyEnable') === 'true'
            ?? proxyEnable
        logSettings()
    }

    function applySettings(host, port, enable) {
        proxyHost = host
        proxyPort = port
        proxyEnable = enable === true || enable === 'true'
        window.localStorage.getItem('proxyHost', proxyHost)
        window.localStorage.getItem('proxyPort', proxyPort)
        window.localStorage.getItem('proxyEnable', proxyEnable)
        logSettings()
    }

    chrome.runtime.onMessage.addListener((msg) => {
        if (!msg)
            console.log("KCProxifier: Received null message.")
        else if (msg.action === 'apply-proxy')
            applySettings(msg.host, msg.port, msg.enable)
        else
            console.log("KCProxifier: Received unknown message: " + JSON.stringify(msg))
    })

    chrome.webRequest.onBeforeRequest.addListener(
        (details) => {
            // console.debug(details)
            console.log({ method: details.method, url: details.url })

            if (!proxyEnable) {
                return
            }

            if (details.method !== 'GET') {
                return
            }

            if (details.url.includes('/kcscontents/news')) {
                return
            }

            const url = new URL(details.url)
            let redirectUrl = `${proxyHost}:${proxyPort}${url.pathname}${url.search}`
            if (!redirectUrl.includes('://')) {
                redirectUrl = 'http://' + redirectUrl
            }

            console.log({ redirectUrl })
            return { redirectUrl }
        },
        { urls: ['*://*.kancolle-server.com/*'] },
        ['blocking'],
    )

    loadSettings()

})()
