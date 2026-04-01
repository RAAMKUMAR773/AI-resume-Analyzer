const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const logFile = 'models_log.txt';
function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
}

fs.writeFileSync(logFile, '--- Gemini Model List Diagnostic ---\n');

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelsToTest = [
        'gemini-1.5-flash', 
        'gemini-1.5-pro', 
        'gemini-pro', 
        'gemini-1.0-pro',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest'
    ];

    for (const m of modelsToTest) {
        try {
            log(`Testing [${m}]...`);
            const model = genAI.getGenerativeModel({ model: m });
            // Just request a small thing
            const result = await model.generateContent("test");
            const response = await result.response;
            log(`✅ [${m}] is AVAILABLE. Partial response: ${response.text().substring(0, 20)}`);
        } catch (e) {
            log(`❌ [${m}] FAILED: ${e.message}`);
        }
    }
    log("Diagnostic complete.");
}

listModels();
