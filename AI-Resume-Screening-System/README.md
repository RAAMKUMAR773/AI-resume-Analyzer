# AI Resume Screening System

This project is an AI-powered resume screening and rewriting tool. It uses Google's Gemini AI to analyze resumes (in PDF format), score them against specific job roles, and suggest professional improvements.

## Project Structure

- `backend/`: Node.js server using Express, Multer for file uploads, and Google's Generative AI SDK.
- `frontend/`: Static HTML and JavaScript files for the user interface.
- `ai-model/`: Reserved for AI-related scripts or models (currently empty).

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)
- A Google Gemini API Key

## Setup and Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AI-Resume-Screening-System
```

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (if not already present) and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 3. Frontend Setup
The frontend consists of static files and doesn't require active installation. Ensure the backend is running for the frontend to communicate with it.

## Running the Application

### 1. Start the Backend Server
In the `backend` directory, run:
```bash
node server.js
```
The server will start on `http://localhost:5000`.

### 2. Access the Frontend
Open `frontend/login.html` in your web browser. From there, you can log in (standard login) and proceed to upload resumes for analysis.

## Usage
1. Open the application in your browser.
2. Log in.
3. Upload a PDF resume.
4. Provide the job title you are targeting.
5. Click "Upload & Analyze" to get AI-powered insights, scoring, and a rewritten resume.

## Technologies Used
- **Backend**: Node.js, Express, Multer, @google/generative-ai, pdf-parse
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **AI**: Google Gemini Pro (1.5 Flash)
