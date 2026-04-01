const fs = require('fs');

try {
    // The previous output in models.json might be garbled with dotenv logs
    // Let's just re-run the logic and print clearly
    const data = JSON.parse(fs.readFileSync('models_clean.json', 'utf8'));
    data.models.forEach(m => {
        if (m.name.includes('2.5')) {
            console.log(m.name);
        }
    });
} catch (e) {
    console.error(e.message);
}
