require('dotenv').config();

async function listAllModels() {
    const key = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Response Status:", response.status);
        if (data.models) {
            const filtered = data.models.filter(m => m.name.includes('2.5'));
            console.log(JSON.stringify(filtered, null, 2));
        } else {
            console.log("No models found or error:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("List Models Error:", error.message);
    }
}

listAllModels();
