const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const logFile = 'diagnostic_log_v2.txt';
function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
}

fs.writeFileSync(logFile, '--- Starting Gemini API Diagnostic V2 ---\n');

async function testGemini() {
    try {
        log("API Key found: " + !!process.env.GEMINI_API_KEY);
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        
        log("Calling generateContent...");
        const result = await model.generateContent("Hi");
        log("Received result object");
        const response = await result.response;
        log("Received response object");
        const text = response.text();
        log("API Response Text: " + text);
        
        log("DONE: SUCCESS");
    } catch (error) {
        log("--- ERROR CAUGHT ---");
        log("Name: " + error.name);
        log("Message: " + error.message);
        log("Stack: " + error.stack);
    }
}

testGemini().then(() => {
    log("Diagnostic script finished execution.");
}).catch(err => {
    log("TOP LEVEL ERROR: " + err.stack);
});
