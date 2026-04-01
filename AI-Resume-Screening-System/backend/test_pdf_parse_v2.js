const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function testExtraction() {
    const uploadDir = path.join(__dirname, 'upload');
    if (!fs.existsSync(uploadDir)) {
        console.error("Upload directory not found.");
        return;
    }

    const files = fs.readdirSync(uploadDir);
    const pdfFile = files.find(f => f.toLowerCase().endsWith('.pdf'));

    if (!pdfFile) {
        console.error("No PDF file found in upload directory for testing.");
        return;
    }

    const filePath = path.join(uploadDir, pdfFile);
    console.log(`Testing extraction on: ${filePath}`);
    const buffer = fs.readFileSync(filePath);

    let parser = null;
    try {
        parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        console.log("Extraction successful!");
        console.log("Text length:", result.text?.length);
        console.log("Preview:", result.text?.substring(0, 100).replace(/\n/g, ' '), "...");
    } catch (err) {
        console.error("Extraction failed:", err.message);
    } finally {
        if (parser) {
            await parser.destroy();
            console.log("Parser destroyed.");
        }
    }
}

testExtraction();
