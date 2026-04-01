AI Resume Screening System
About
AI-Resume-Screening-System is a simple full-stack web app to parse and evaluate resumes automatically using NLP and PDF parsing.
It provides web upload, text extraction, and matching-based ranking for candidate screening.

Features
Resume upload via browser UI
PDF parsing (via pdfjs-dist)
Automate resume-to-job matching
Model/keywords configuration in ai-model
Basic backend with Node/Express
User auth pages (login.html, signup.html)
Repo structure
frontend/
frontend.html - app UI
login.html, signup.html
app.js - frontend logic
backend/
Node server related files
package.json dependencies & scripts
ai-model/
analyzer.js - core resume analyzer
check_pdf.js, test_pdf_parse.js
model metadata files (all_models.json, etc.)
Installation
(Optional for root):

Run locally
or if using node directly:

Open:

http://localhost:3000 (or whatever is configured)
Usage
Open browser UI (frontend/frontend.html)
Upload resume PDF
Analyzer processes text & matches
Inspect results in UI/logs
Optional workflows
npm run test (if tests exist)
node ai-model/diagnostic_test.js
node ai-model/check_pdf.js
Setup / maintenance
Add .gitignore:
/node_modules
.env
npm-debug.log
Keep backend/node_modules out of repo
Pin dependencies in package-lock.json
Contributing
Fork repo
create feature branch
add tests
open PR
Authors
RAAMKUMAR773 (GitHub)
AI resume screening team
