const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const logFile = 'diagnostic_log.txt';
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

fs.writeFileSync(logFile, '--- Starting Gemini API Diagnostic ---\n');

async function testGemini() {
    log("Environment: " + JSON.stringify({
        nodeVersion: process.version,
        apiKeyPresent: !!process.env.GEMINI_API_KEY,
        apiKeyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : 'none'
    }, null, 2));

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        log("Calling generateContent...");
        const result = await model.generateContent("Hello, respond with 'Success' if you can hear me.");
        const response = await result.response;
        const text = response.text();
        
        log("API Response: " + text);
        if (text.includes("Success") || text.length > 0) {
            log("TEST PASSED: Gemini API is working correctly.");
        } else {
            log("TEST FAILED: Unexpected empty response from Gemini API.");
        }
    } catch (error) {
        log("TEST FAILED: Gemini API encountered an error:");
        log("Error Name: " + error.name);
        log("Error Message: " + error.message);
        log("Error Stack: " + error.stack);
    }
}

testGemini();
