/**
 * LocalAnalyzer
 * A rule-based resume analyzer that provides a high-quality fallback 
 * when external AI services (like Gemini) are unavailable.
 */
class LocalAnalyzer {
    constructor(rawText, targetJob) {
        this.rawText = rawText;
        this.targetJob = targetJob || "the specified role";
        this.lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }

    analyze() {
        const name = this.findName();
        const contact = this.findContact();
        const skills = this.extractSkills();
        const experience = this.extractExperience();
        const education = this.extractEducation();
        const projects = this.extractProjects();
        const certifications = this.extractCertifications();
        
        // Calculate a basic "match" score
        const score = this.calculateScore(skills);
        
        // Generate suggestions
        const improvements = this.generateImprovements(skills, experience, projects, education);
        
        // Create the "rewritten" version
        const rewritten = this.generateRewritten(name, contact, skills, experience, education, projects, certifications);

        return {
            candidateName: name,
            candidateContact: contact.join(" | "),
            resumeScore: score,
            detectedStrengths: this.getStrengths(skills, experience, projects),
            missingKeywords: this.getMissingKeywords(skills),
            missingSections: this.getMissingSections(),
            improvements: improvements,
            rewrittenResume: rewritten,
            jobOpportunities: this.getRoleRecommendations(score),
            isLocalAnalysis: true
        };
    }

    findName() {
        for (let i = 0; i < Math.min(this.lines.length, 10); i++) {
            const line = this.lines[i];
            const words = line.split(/\s+/);
            if (words.length >= 2 && words.length <= 4 && !/\d/.test(line) && !/objective|contact|email|phone/i.test(line)) {
                return line;
            }
        }
        return "Candidate";
    }

    findContact() {
        const contacts = [];
        const emailRegex = /[\w.-]+@[\w-]+\.[\w.-]+/g;
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const linkedInRegex = /linkedin\.com\/in\/[\w-]+/i;
        const githubRegex = /github\.com\/[\w-]+/i;
        
        const emails = this.rawText.match(emailRegex);
        if (emails) contacts.push(emails[0]);
        
        const phones = this.rawText.match(phoneRegex);
        if (phones) contacts.push(phones[0]);

        const linkedin = this.rawText.match(linkedInRegex);
        if (linkedin) contacts.push(linkedin[0]);

        const github = this.rawText.match(githubRegex);
        if (github) contacts.push(github[0]);
        
        return contacts;
    }

    extractSkills() {
        const commonSkills = [
            "JavaScript", "Python", "Java", "C++", "React", "Node.js", "Express", "SQL", "NoSQL",
            "MongoDB", "AWS", "Azure", "Docker", "Kubernetes", "Git", "Project Management",
            "Agile", "Scrum", "Data Analysis", "Machine Learning", "Communication", "Leadership",
            "HTML", "CSS", "TypeScript", "Redux", "Angular", "Vue", "Spring Boot", "Django", "Flask",
            "Pandas", "NumPy", "Matplotlib", "Seaborn", "Scikit-learn", "Classification", "Regression",
            "Database Design", "Indexing", "Joins", "IAM", "VPC", "CloudFront", "SNS"
        ];
        
        const found = [];
        const textLower = this.rawText.toLowerCase();
        
        commonSkills.forEach(skill => {
            if (textLower.includes(skill.toLowerCase())) {
                found.push(skill);
            }
        });
        
        return [...new Set(found)];
    }

    extractExperience() {
        const exp = [];
        let sectionFound = false;
        let currentItem = null;
        
        const headerKeywords = ["EXPERIENCE", "INTERNSHIP", "WORK HISTORY", "EMPLOYMENT"];
        const sectionKeywords = ["EDUCATION", "PROJECTS", "SKILLS", "CERTIFICATIONS", "ACHIEVEMENTS", "LANGUAGES"];
        const roleKeywords = ["engineer", "developer", "manager", "analyst", "intern", "lead", "architect", "developer", "specialist", "associate", "student"];

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const upper = line.toUpperCase();
            
            // Detect Experience Section Start
            if (headerKeywords.some(key => upper.includes(key)) && line.length < 30) {
                sectionFound = true;
                continue;
            }

            if (sectionFound) {
                // Logic to exit the section
                if (sectionKeywords.some(key => upper === key) && line.length < 25) {
                    sectionFound = false;
                    continue; // Might find another exp section or end
                }

                const isRole = roleKeywords.some(key => line.toLowerCase().includes(key)) && line.length < 70;
                const hasDate = /\d{4}/.test(line) && (line.includes('-') || line.toLowerCase().includes('present') || line.toLowerCase().includes('current'));

                if (isRole || hasDate) {
                    if (currentItem) exp.push(currentItem);
                    currentItem = { title: line, company: "Organization", duration: "Timeline", bullets: [] };
                    
                    // Try to refine company if it's on the next line or previous
                    if (this.lines[i+1] && this.lines[i+1].length < 60 && !roleKeywords.some(k => this.lines[i+1].toLowerCase().includes(k))) {
                        currentItem.company = this.lines[i+1];
                    }
                } else if (currentItem && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.length > 30)) {
                    currentItem.bullets.push(line.replace(/^[•\-\*]\s*/, ''));
                }
            }
        }
        
        if (currentItem) exp.push(currentItem);
        return exp.length > 0 ? exp : [{ title: "Professional Experience", company: "Various", duration: "-", bullets: ["Experience details extracted from resume text."] }];
    }

    extractEducation() {
        const edu = [];
        const eduKeywords = ["B.TECH", "B.E", "B.SC", "BCA", "MCA", "MBA", "BACHELOR", "MASTER", "PH.D", "HSC", "SSLC", "SECONDARY", "UNIVERSITY", "INSTITUTE", "COLLEGE", "SCHOOL", "DIPLOMA", "COMMERCE", "SCIENCE", "ARTS"];
        const sectionKeywords = ["EXPERIENCE", "PROJECTS", "SKILLS", "CERTIFICATIONS", "INTERNSHIP", "LANGUAGES"];

        let sectionFound = false;
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const upper = line.toUpperCase();

            if (upper.includes("EDUCATION")) {
                sectionFound = true;
                continue;
            }

            if (sectionFound) {
                if (sectionKeywords.some(key => upper === key) && line.length < 25) break;

                if (eduKeywords.some(key => upper.includes(key))) {
                    edu.push(line);
                    // Check up to 2 lines for more info (institution, branch, GPA)
                    for (let j = 1; j <= 2; j++) {
                        if (this.lines[i+j] && this.lines[i+j].length < 120 && 
                            !sectionKeywords.some(k => this.lines[i+j].toUpperCase().includes(k)) &&
                            !eduKeywords.some(k => this.lines[i+j].toUpperCase().includes(k))) {
                            edu.push(this.lines[i+j]);
                        } else {
                            break;
                        }
                    }
                    i += edu.length - 1; // Skip the lines we've already added
                }
            }
        }
        return edu.length > 0 ? edu.join(" | ") : "Education details found in original resume text";
    }

    extractProjects() {
        const projects = [];
        let sectionFound = false;
        let currentProject = null;
        const sectionKeywords = ["EXPERIENCE", "EDUCATION", "SKILLS", "CERTIFICATIONS", "INTERNSHIP"];

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const upper = line.toUpperCase();

            if (upper === "PROJECTS" || upper.includes("ACADEMIC PROJECTS") || upper.includes("TECHNICAL PROJECTS")) {
                sectionFound = true;
                continue;
            }

            if (sectionFound) {
                if (sectionKeywords.some(key => upper.includes(key)) && line.length < 25) break;

                // Detect potential project title (short, capitalized, no bullets)
                if (line.length < 65 && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*') && /[A-Z]/.test(line[0])) {
                    if (currentProject) projects.push(currentProject);
                    currentProject = { name: line, details: "" };
                } else if (currentProject) {
                    currentProject.details += (currentProject.details ? " " : "") + line;
                }
            }
        }
        if (currentProject) projects.push(currentProject);
        return projects.length > 0 ? projects : [{ name: "Technical Projects", details: "Project details identified in resume content." }];
    }

    extractCertifications() {
        const certs = [];
        let sectionFound = false;
        const keywords = ["CERTIF", "ACHIEVEMENTS", "AWARDS", "HONORS"];
        const stopKeywords = ["EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS"];

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const upper = line.toUpperCase();

            if (keywords.some(k => upper.includes(k)) && line.length < 35) {
                sectionFound = true;
                continue;
            }

            if (sectionFound) {
                if (stopKeywords.some(k => upper === k) && line.length < 25) break;
                if (line.length > 3) certs.push(line);
            }
        }
        return certs.length > 0 ? certs.join(", ") : "Available upon request";
    }

    calculateScore(skills) {
        let score = 60;
        if (skills.length > 8) score += 15;
        if (this.rawText.toLowerCase().includes("b.tech") || this.rawText.toLowerCase().includes("master")) score += 10;
        
        const targetWords = this.targetJob.toLowerCase().split(/\s+/);
        targetWords.forEach(word => {
            if (this.rawText.toLowerCase().includes(word)) score += 5;
        });
        
        return Math.min(score, 98);
    }

    getStrengths(skills, experience, projects) {
        const strengths = [];
        if (skills.length > 5) strengths.push(`Strong portfolio of ${skills.length} technical skills`);
        if (projects.length > 1) strengths.push(`Demonstrated hands-on experience through ${projects.length} projects`);
        if (this.rawText.includes("B.Tech") || this.rawText.includes("Bachelor")) strengths.push("Solid academic foundation in Engineering/Technology");
        return strengths;
    }

    getMissingKeywords(skills) {
        return ["Advanced System Design", "Unit Testing Frameworks", "CI/CD Implementation"];
    }

    getMissingSections() {
        const missing = [];
        if (!/certif/i.test(this.rawText)) missing.push("Certifications");
        if (!/award|honor/i.test(this.rawText)) missing.push("Awards & Achievements");
        return missing;
    }

    generateImprovements(skills, exp, projects, edu) {
        return [
            { 
                mistake: "Implicit experience details", 
                correction: "Use quantifiable metrics (e.g., 'Improved performance by 20%') in your project descriptions.", 
                why: "Focusing on impact rather than just tasks makes your resume significantly more impressive." 
            },
            { 
                mistake: "Summary could be more targeted", 
                correction: `Write a summary that explicitly mentions your goal to become a ${this.targetJob}.`, 
                why: "Recruiters spend only a few seconds on initial screening; clarity is key." 
            }
        ];
    }

    generateRewritten(name, contact, skills, experience, education, projects, certifications) {
        return {
            summary: `Detail-oriented professional specializing in ${this.targetJob}. Proficient in ${skills.slice(0, 4).join(", ")}. Strong academic background with a focus on ${education.split('|')[0].trim()}. Proven track record of delivering technical projects and driving innovation.`,
            skills: skills.join(", "),
            education: education,
            projects: projects,
            experience: experience,
            certifications: certifications
        };
    }

    getRoleRecommendations(score) {
        return [
            { 
                role: this.targetJob, 
                matchScore: score, 
                category: "Primary Match", 
                avgSalary: "$70k - $130k", 
                whyFit: "Your skills and projects align well with the core requirements of this role.", 
                matchedSkills: [], 
                skillsToGrow: ["System Architecture"] 
            }
        ];
    }
}

module.exports = LocalAnalyzer;
