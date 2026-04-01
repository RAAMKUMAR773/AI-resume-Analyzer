const fs = require('fs');
require('dotenv').config();

async function fetchModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        fs.writeFileSync('all_models_v4.json', JSON.stringify(data, null, 2));
        console.log("Models fetched and saved to all_models_v4.json");
    } catch (error) {
        console.error("Fetch error:", error.message);
    }
}

fetchModels();
