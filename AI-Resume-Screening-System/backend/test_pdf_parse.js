const pdf = require('pdf-parse');
console.log("pdf-parse type:", typeof pdf);
console.log("pdf-parse keys:", Object.keys(pdf));

const fs = require('fs');
const path = require('path');

// Try to find any pdf in upload dir
const uploadDir = path.join(__dirname, 'upload');
if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir);
    const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));
    if (pdfFile) {
        const buffer = fs.readFileSync(path.join(uploadDir, pdfFile));
        console.log("Found PDF:", pdfFile, "Size:", buffer.length);
        try {
            // If pdf is an object, try pdf.default or similar
            const parseFunc = typeof pdf === 'function' ? pdf : pdf.default;
            if (typeof parseFunc === 'function') {
                parseFunc(buffer).then(data => {
                    console.log("Extraction successful. Text length:", data.text.length);
                }).catch(err => {
                    console.error("Extraction error:", err);
                });
            } else {
                console.error("Could not find a valid parse function in pdf-parse export.");
            }
        } catch (e) {
            console.error("Crash during parse call:", e);
        }
    } else {
        console.log("No PDF files found in upload directory for testing.");
    }
}
