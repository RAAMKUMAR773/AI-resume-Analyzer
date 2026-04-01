require('dotenv').config();
const fs = require('fs');

async function listAllModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        fs.writeFileSync('models_clean.json', JSON.stringify(data, null, 2));
        console.log("Written to models_clean.json");
    } catch (error) {
        console.error("List Models Error:", error.message);
    }
}

listAllModels();
