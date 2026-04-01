const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const logFile = 'models_log_exhaustive.txt';
function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
}

fs.writeFileSync(logFile, '--- Gemini Exhaustive Model Test ---\n');

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const allModelsData = JSON.parse(fs.readFileSync('all_models_v4.json', 'utf8'));
    const modelsToTest = allModelsData.models
        .filter(m => m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));

    log(`Testing ${modelsToTest.length} models...`);

    for (const m of modelsToTest) {
        try {
            log(`Testing [${m}]...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hi");
            const response = await result.response;
            log(`✅ [${m}] works!`);
            // If we find one that works, we can stop or keep going. Let's find ALL.
        } catch (e) {
            log(`❌ [${m}] FAILED: ${e.message.substring(0, 100)}...`);
        }
    }
    log("Exhaustive test complete.");
}

listModels();
