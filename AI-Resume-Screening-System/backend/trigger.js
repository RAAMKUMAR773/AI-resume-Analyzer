const fs = require('fs');
const path = require('path');
const http = require('http');

const filePath = 'upload/1772872916154.pdf';
const fileData = fs.readFileSync(filePath);
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="resume"; filename="resume.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    fileData,
    Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="jobTitle"\r\n\r\nfrontend developer\r\n--${boundary}--\r\n`)
]);

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/upload',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length
    }
}, (res) => {
    res.on('data', (d) => process.stdout.write(d));
});

req.write(payload);
req.end();
