const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'server_debug.log');
if (fs.existsSync(logPath)) {
    const buffer = fs.readFileSync(logPath);
    // Try to detect if it's UTF-16
    let content = "";
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        content = buffer.toString('utf16le');
    } else {
        content = buffer.toString('utf8');
    }
    const lines = content.split('\n');
    const lastLines = lines.slice(-100).join('\n');
    fs.writeFileSync(path.join(__dirname, 'log_extraction_v2.txt'), lastLines);
    console.log("Extracted last 100 lines to log_extraction_v2.txt");
} else {
    console.log("Log file not found.");
}
