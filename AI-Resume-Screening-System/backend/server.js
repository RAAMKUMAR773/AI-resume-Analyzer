const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 5000;

const logStream = fs.createWriteStream(path.join(__dirname, 'server_debug.log'), { flags: 'a' });
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
    logStream.write(`[LOG] ${new Date().toISOString()} - ${args.join(' ')}\n`);
    originalLog(...args);
};
console.error = (...args) => {
    logStream.write(`[ERROR] ${new Date().toISOString()} - ${args.join(' ')}\n`);
    originalError(...args);
};
console.warn = (...args) => {
    logStream.write(`[WARN] ${new Date().toISOString()} - ${args.join(' ')}\n`);
    originalWarn(...args);
};

app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/signup.html'));
});


// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'upload');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Keep files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Helper: extract text from PDF buffer using a multi-engine approach for maximum reliability
async function extractPdfText(buffer) {
    let extractedText = "";
    const { PDFParse } = require('pdf-parse');
    
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    console.log(`[Diagnostic] Starting PDF extraction. Hash: ${hash}, Size: ${buffer.length} bytes`);
    console.log(`[Diagnostic] First 32 bytes (hex): ${buffer.slice(0, 32).toString('hex')}`);

    let parser = null;
    try {
        console.log("[Diagnostic] Attempting PDF extraction with PDFParse v2...");
        parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        extractedText = result.text || "";
        console.log(`[Diagnostic] PDFParse v2 extracted ${extractedText.length} characters.`);
    } catch (e) {
        console.error("[Diagnostic] PDFParse v2 failed:", e.message);
    } finally {
        if (parser) {
            try {
                await parser.destroy();
                console.log("[Diagnostic] Parser destroyed.");
            } catch (destroyErr) {
                console.warn("[Diagnostic] Error destroying parser:", destroyErr.message);
            }
        }
    }

    // Clean up any non-printable binary garbage that might confuse the AI
    const cleanedText = extractedText.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, " ").trim();
    console.log(`[Diagnostic] Final cleaned text length: ${cleanedText.length}`);
    if (cleanedText.length > 0) {
        console.log(`[Diagnostic] Preview: ${cleanedText.substring(0, 100).replace(/\n/g, ' ' )}...`);
    }

    return cleanedText;
}

// Helper: find candidate name from extracted text lines
function findName(text, filename) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);

    for (let i = 0; i < Math.min(lines.length, 20); i++) {
        const line = lines[i];

        // If a line contains an email, the line ABOVE is usually the name
        if (line.includes('@') && line.includes('.') && i > 0) {
            const prev = lines[i - 1];
            const wc = prev.split(/\s+/).length;
            if (wc >= 1 && wc <= 5 && prev.length < 50) {
                return prev;
            }
        }

        // A name-like line: 2‑5 words, reasonable length, no digits at start
        const wc = line.split(/\s+/).length;
        if (wc >= 2 && wc <= 5 && line.length < 45 && !/^\d/.test(line)
            && !line.toLowerCase().includes('resume')
            && !line.toLowerCase().includes('curriculum vitae')
            && !line.toLowerCase().includes('page')
            && !line.includes('@')
            && !line.includes('http')
        ) {
            return line;
        }
    }

    // Last resort: use it cleanly
    return filename
        ? filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
        : 'Candidate';
}

app.post('/upload', upload.single('resume'), async (req, res) => {
    console.log("--- New Upload Request Received ---");
    try {
        if (!req.file) {
            console.warn("No file uploaded in request.");
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const targetJob = req.body.jobTitle || 'the specified role';
        console.log(`[Diagnostic] Received file: ${req.file.originalname}, Size: ${req.file.size} bytes, Mimetype: ${req.file.mimetype}`);
        console.log(`[Diagnostic] Target Job: ${targetJob}`);

        // 1. Locally extract text from PDF for stability
        console.log("Extracting text from PDF buffer locally...");
        let rawText = "";
        try {
            rawText = await extractPdfText(req.file.buffer);
            console.log(`Local extraction complete. Character count: ${rawText.length}`);

            if (rawText.length < 50) {
                console.warn("Local extraction got very little text. Attempting raw buffer scrape.");
                const bufferStr = req.file.buffer.toString('binary');
                const matches = bufferStr.match(/[A-Z][a-z]{3,}\s[A-Z][a-z]{3,}|[\w.-]+@[\w-]+\.[\w.-]+/g);
                if (matches) rawText = matches.join('\n');
                console.log(`Raw buffer scrape complete. New count: ${rawText.length}`);
            }
        } catch (localExtractErr) {
            console.error("Local extraction totally failed:", localExtractErr.message);
        }

        if (rawText.trim().length === 0) {
            console.error("Critical Failure: Could not extract any text from the PDF.");
            throw new Error("We could not read your PDF file. Please ensure it's a valid text-based PDF.");
        }

        // 2. Prepare AI prompt with the extracted text
        console.log("Preparing AI prompt...");
        const promptText = `
You are an elite Career Consultant and ATS (Applicant Tracking System) Expert. 
Your task is to analyze the following resume text and transform it into a high-scoring, professional version for the target role: "${targetJob}".

RESUME TEXT TO ANALYZE:
---
${rawText}
---

CRITICAL INSTRUCTIONS:
1. ATS ALIGNMENT: Identify the most critical keywords and skills for a "${targetJob}" and ensure they are naturally integrated into the rewritten resume.
2. STAR METHOD: Rewrite every experience bullet point using the STAR method (Situation, Task, Action, Result). Focus on QUANTIFIABLE RESULTS (e.g., "Increased efficiency by 30%").
3. IMPACTFUL LANGUAGE: Use strong action verbs (e.g., Orchestrated, Spearheaded, Engineered).
4. STRUCTURE: Maintain the original experience, education, and projects, but reorganize them for maximum impact.
5. NO OMISSION: You MUST include EVERY professional experience item, EVERY project, and EVERY educational degree listed in the original resume. Do NOT summarize multiple roles into one or skip degrees.
6. EDUCATION DETAIL: For education, capture the exact Degree Name, Institution, and Graduation Year/Duration. If you find multiple degrees (e.g., B.Tech and HSC), include them all formatted in a single string in the "education" field.
7. NO HALLUCINATION: Use ONLY the real data from the resume above. Do not invent companies or degrees.

RESPONSE STRUCTURE (STRICT JSON ONLY):
{
    "candidateName": "Full Name",
    "candidateContact": "Email | Phone | LinkedIn",
    "resumeScore": 85,
    "detectedStrengths": ["Strength 1", "Strength 2"],
    "missingKeywords": ["Missing Keyword 1", "Missing Keyword 2"],
    "missingSections": [],
    "improvements": [
        { "mistake": "Original weak phrase", "correction": "Powerful STAR-method rewrite", "why": "ATS Impact" }
    ],
    "rewrittenResume": {
        "summary": "Compelling 3-sentence summary",
        "skills": "List of core skills",
        "education": "University name and degree",
        "projects": [{ "name": "Project Name", "details": "Full impact description - do not truncate" }],
        "experience": [
            { "title": "Role", "company": "Company", "duration": "Dates", "bullets": ["STAR Bullet 1", "STAR Bullet 2"] }
        ],
        "certifications": "Certs or 'Not provided'"
    },
    "jobOpportunities": [
        { "role": "Recommended Role", "matchScore": 95, "category": "Direct Match", "avgSalary": "$Xk+", "whyFit": "...", "matchedSkills": [], "skillsToGrow": [] }
    ]
}
`;

        // 3. Call Gemini API with Local Fallback
        console.log('Calling Gemini 2.0 Flash API...');
        let jsonResult = null;
        
        try {
            const result = await model.generateContent(promptText);
            const aiResponse = result.response;
            console.log('Gemini API call finished.');

            let textResult = "";
            try {
                textResult = aiResponse.text();
                console.log('Gemini raw response length:', textResult.length);
                if (textResult.includes('```')) {
                    textResult = textResult.replace(/```json|```/g, '').trim();
                }
                jsonResult = JSON.parse(textResult);
            } catch (aiErr) {
                console.error('Failed to parse Gemini response:', aiErr.message);
                throw aiErr; // Trigger fallback
            }
        } catch (error) {
            console.warn(`[Fallback] Gemini API failed (${error.message}). Using Local Analyzer...`);
            const LocalAnalyzer = require('../ai-model/analyzer');
            const analyzer = new LocalAnalyzer(rawText, targetJob);
            jsonResult = analyzer.analyze();
            jsonResult.fallbackWarning = "System is currently under heavy load. A local rule-based analysis was performed.";
        }

        if (jsonResult) {
            console.log(`[Diagnostic] Sending successful response for candidate: ${jsonResult.candidateName}`);
            return res.json(jsonResult);
        }

    } catch (error) {
        console.error('FATAL UPLOAD ERROR:', error.message);
        console.error(error.stack);

        // Ultimate Fallback if everything fails
        const candidateName = req.file?.originalname?.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') || 'Candidate';
        const target = req.body.jobTitle || 'selected role';

        res.status(500).json({
            error: "AI analysis failed.",
            details: error.message,
            stack: error.stack,
            candidateName: candidateName,
            resumeScore: 0,
            detectedStrengths: ["System is currently busy"],
            missingKeywords: ["Retry in a few moments"],
            missingSections: [],
            improvements: [{ mistake: "Connection issues", correction: "Check your internet or try a different PDF.", why: "Reliability" }],
            rewrittenResume: {
                summary: "We encountered an error processing this specific file with the AI engine.",
                skills: "...",
                education: "...",
                projects: [],
                experience: [{ title: "Upload Failed", company: "System", duration: "-", bullets: ["Please try again with a simpler PDF."] }],
                certifications: "..."
            },
            jobOpportunities: []
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});