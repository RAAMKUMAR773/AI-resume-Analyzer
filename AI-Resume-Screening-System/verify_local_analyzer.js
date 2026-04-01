const LocalAnalyzer = require('./ai-model/analyzer');

const userResumeText = `
Raam Kumar K R
Salem, Tamil Nadu
raamkumarraam28@gmail.com | 7010861104
linkedin.com/in/raamkumar-kr | github.com/RAAMKUMAR773

CAREER OBJECTIVE
Motivated undergraduate specializing in Artificial Intelligence and Data Science...

EDUCATION
B.Tech in Artificial Intelligence and Data Science (2023 - 2027)
Bannari Amman Institute of Technology, Sathyamangalam
CGPA: 8.39 / 10 (up to 5th Semester)

Higher Secondary Certificate (HSC) (2023)
Percentage: 92.33%

TECHNICAL SKILLS
Programming: Java
Data Analysis: Pandas, NumPy, Matplotlib, Seaborn
Machine Learning: Scikit-learn, Classification, Regression...
Databases: MySQL, Database Design, Indexing, Joins
Cloud: AWS (EC2, S3, IAM, VPC, CloudFront, SNS), Git

PROJECTS
Movie Recommendation System
- Developed a content-based recommendation system using TF-IDF vectorization...
- Preprocessed textual features including genres, cast, director, and keywords.
- Improved recommendation relevance through feature engineering techniques.

AWS Cloud-Based Dynamic Web Application
- Designed and deployed a scalable full-stack application on AWS.
- Hosted frontend on Amazon S3 and delivered via CloudFront.
- Deployed backend using Python Flask on EC2...

INTERNSHIP
Java Programming Intern - InternPe Online (December 2025 - January 2026)
- Completed an online internship focused on core Java programming fundamentals.
- Practiced control flow, arrays, and basic program development.
`;

const analyzer = new LocalAnalyzer(userResumeText, "Data Analyst");
const result = analyzer.analyze();

console.log("--- Improved Local Analysis Result ---");
console.log(JSON.stringify(result, null, 2));
console.log("\nExtracted Education:", result.rewrittenResume.education);

const hasBTech = result.rewrittenResume.education.includes("B.Tech");
const hasProjects = result.rewrittenResume.projects.length >= 2;
const hasInternship = result.rewrittenResume.experience.some(e => e.title.includes("Intern"));

if (hasBTech && hasProjects && hasInternship) {
    console.log("\nVERIFICATION SUCCESSFUL: B.Tech, multiple projects, and internship detected!");
} else {
    console.log("\nVERIFICATION FAILED:");
    if (!hasBTech) console.log("- Missing B.Tech in Education");
    if (!hasProjects) console.log("- Missing multiple projects");
    if (!hasInternship) console.log("- Missing internship in Experience");
    process.exit(1);
}
