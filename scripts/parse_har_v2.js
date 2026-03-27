const fs = require('fs');

try {
    const d = JSON.parse(fs.readFileSync('grizzlysms.com.json', 'utf8'));
    const apiEntries = d.log.entries.filter(e => {
        if (!e.request || !e.request.url) return false;
        const url = e.request.url;
        return url.includes('/api/') || url.includes('handler_api.php') || url.includes('action=');
    });
    const uniqueApis = new Map();

    apiEntries.forEach(e => {
        try {
            const urlObj = new URL(e.request.url);
            let action = urlObj.searchParams.get('action') || '';
            const key = e.request.method + ' ' + urlObj.pathname + (action ? '?action=' + action : '');
            if (!uniqueApis.has(key)) {
                let params = Array.from(urlObj.searchParams.entries()).filter(p => p[0] !== 'api_key');
                let body = e.request.postData && e.request.postData.text ? e.request.postData.text : null;
                let resp = e.response && e.response.content && e.response.content.text ? e.response.content.text : null;
                let respSnippet = resp ? (resp.length > 500 ? resp.substring(0, 500) + '...' : resp) : null;
                uniqueApis.set(key, {
                    url: urlObj.pathname,
                    action: action,
                    method: e.request.method,
                    queryParams: params,
                    body,
                    response: respSnippet
                });
            }
        } catch (err) {
            // ignore
        }
    });

    const res = Array.from(uniqueApis.values());
    fs.writeFileSync('parsed_har_v2.json', JSON.stringify(res, null, 2));
    console.log('Found ' + res.length + ' unique API endpoints.');
} catch (e) {
    console.error(e);
}
