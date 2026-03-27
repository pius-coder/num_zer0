const https = require('node:https');

const id = process.argv[2] || 'ibQ0dwjRNh';
const apiKey = 'FAK_TEST_6dea81bbb5e8347c3e34';
const apiUser = 'ad395e23-2fb4-4091-b207-615b34accf4d';

const options = {
    hostname: 'sandbox.fapshi.com',
    path: `/payment-status/${id}`,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'apiuser': apiUser,
        'apikey': apiKey
    }
};

console.log(`🚀 Testing node:https for: https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('✅ Success!');
        console.log(data);
    });
});

req.on('error', (e) => {
    console.error(`❌ Request Failed: ${e.message}`);
    console.error(e);
});

req.end();
