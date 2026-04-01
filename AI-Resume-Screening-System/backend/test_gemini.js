const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
    console.log("Testing Gemini API connection...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    try {
        const result = await model.generateContent("Say 'Gemini is active'");
        console.log("Response:", result.response.text());
        process.exit(0);
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        process.exit(1);
    }
}

testGemini();
