const fs = require('fs');

try {
    const d = JSON.parse(fs.readFileSync('grizzlysms.com.json', 'utf8'));
    const apiEntries = d.log.entries.filter(e => e.request && e.request.url && e.request.url.includes('/api/'));
    const uniqueApis = new Map();

    apiEntries.forEach(e => {
        try {
            const urlObj = new URL(e.request.url);
            const key = e.request.method + ' ' + urlObj.pathname;
            if (!uniqueApis.has(key)) {
                let params = Array.from(urlObj.searchParams.entries());
                let body = e.request.postData && e.request.postData.text ? e.request.postData.text : null;
                let resp = e.response && e.response.content && e.response.content.text ? e.response.content.text : null;
                let respSnippet = resp ? (resp.length > 500 ? resp.substring(0, 500) + '...' : resp) : null;
                uniqueApis.set(key, {
                    url: urlObj.pathname,
                    method: e.request.method,
                    queryParams: params,
                    body,
                    responseSnippet: respSnippet
                });
            }
        } catch (err) {
            // ignore
        }
    });

    console.log(JSON.stringify(Array.from(uniqueApis.values()), null, 2));
} catch (e) {
    console.error(e);
}
