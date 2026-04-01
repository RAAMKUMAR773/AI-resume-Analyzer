const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    console.log("Listing available Gemini models...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        // There is no direct listModels in the JS SDK that I'm aware of for the API Key
        // But we can try a few common names
        const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("test");
                console.log(`✅ [${m}] is AVAILABLE`);
            } catch (e) {
                console.log(`❌ [${m}] is NOT AVAILABLE: ${e.message}`);
            }
        }
    } catch (error) {
        console.error("Critical Error:", error.message);
    }
}

listModels();
