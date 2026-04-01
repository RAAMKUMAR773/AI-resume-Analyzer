const resumeInput = document.getElementById("resumeInput");
const fileNameDisplay = document.getElementById("fileName");

resumeInput.addEventListener('change', function () {
    if (this.files && this.files.length > 0) {
        fileNameDisplay.innerHTML = '<i class="fa-solid fa-check"></i> ' + this.files[0].name;
        document.getElementById("message").innerText = "";
    } else {
        fileNameDisplay.innerHTML = "";
    }
});

function checkResume() {
    const file = resumeInput.files.length;
    const message = document.getElementById("message");
    const btn = document.getElementById("analyzeBtn");
    const jobTitle = document.getElementById("jobTitleInput").value.trim();

    if (file === 0) {
        message.innerText = "⚠ Please select a resume file first.";
        setTimeout(() => { message.innerText = ""; }, 3000);
    } else if (jobTitle === "") {
        message.innerText = "⚠ Please enter a Target Job Title.";
        setTimeout(() => { message.innerText = ""; }, 3000);
        document.getElementById("jobTitleInput").focus();
    } else {
        message.innerText = "";
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Reading deeply and consulting AI...';
        btn.style.opacity = '0.8';

        const formData = new FormData(document.getElementById("resumeForm"));
        formData.append("jobTitle", jobTitle);

        fetch("http://127.0.0.1:5000/upload", {
            method: "POST",
            body: formData
        })
        .then(async function(response) {
            if (!response.ok) {
                const errData = await response.json().catch(function() { return {}; });
                const fullError = (errData.details ? errData.details + "\n" + (errData.stack || "") : (errData.error || "Server error or invalid PDF"));
                throw new Error(fullError);
            }
            return response.json();
        })
        .then(function(data) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Analysis Complete';
            btn.style.background = 'linear-gradient(45deg, #10b981, #34d399)';
            btn.style.boxShadow = '0 10px 20px -5px rgba(16, 185, 129, 0.5)';
            document.querySelector('.features').style.display = 'none';
            document.getElementById('uploadBox').style.display = 'none';
            showRealResults(jobTitle, data);
        })
        .catch(function(error) {
            console.error("Upload error:", error);
            btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze Resume';
            btn.style.opacity = '1';
            message.style.color = '#ef4444';
            message.innerText = "⚠ " + error.message;
        });
    }
}

// Store globally for the generation button
let globalAiResume = null;

function showRealResults(jobTitle, aiData) {
    const resultsSection = document.getElementById('resultsSection');
    const skillsContainer = document.getElementById('mockSkills');
    const improvementsList = document.getElementById('mockImprovements');

    document.getElementById('targetRoleDisplay').innerText = jobTitle;

    globalAiResume = Object.assign({}, aiData.rewrittenResume, {
        name: aiData.candidateName,
        contact: aiData.candidateContact
    });

    // Render job opportunities
    if (aiData.jobOpportunities && aiData.jobOpportunities.length > 0) {
        renderJobOpportunities(aiData.jobOpportunities);
    }

    // Animate score counter
    const scoreValue = aiData.resumeScore || 0;
    const scoreCircle = document.querySelector('.score-circle');
    let currentScore = 0;
    const duration = 1500;
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        currentScore = Math.floor(easedProgress * scoreValue);
        document.getElementById('displayScore').innerText = currentScore;
        if (progress < 1) { requestAnimationFrame(updateCounter); }
    }
    requestAnimationFrame(updateCounter);

    scoreCircle.style.background = 'conic-gradient(' + (scoreValue >= 70 ? '#10b981' : '#f59e0b') + ' ' + scoreValue + '%, rgba(255, 255, 255, 0.05) 0)';

    // Strengths
    skillsContainer.innerHTML = '';
    aiData.detectedStrengths.forEach(function(skill) {
        skillsContainer.innerHTML +=
            '<div style="display:flex;align-items:center;gap:10px;background:rgba(16,185,129,0.08);padding:10px 14px;border-radius:12px;border:1px solid rgba(16,185,129,0.15);transition:transform 0.3s ease;backdrop-filter:blur(5px);">' +
            '<i class="fa-solid fa-circle-check" style="color:#10b981;font-size:0.9rem;"></i>' +
            '<span style="color:#e2e8f0;font-size:0.88rem;font-weight:500;">' + skill + '</span></div>';
    });

    // Mistakes
    const missingElementsContainer = document.getElementById('missingElementsBox');
    missingElementsContainer.innerHTML = '<div class="metric-title" style="color:#f87171;margin-bottom:25px;"><i class="fa-solid fa-triangle-exclamation"></i> Detected Mistakes</div>';

    if (aiData.missingSections && aiData.missingSections.length > 0) {
        let sectionsHtml = '<div style="margin-bottom:24px;"><div style="display:flex;flex-direction:column;gap:14px;">';
        aiData.missingSections.forEach(function(section) {
            const parts = section.split(',');
            const title = parts[0].trim().replace(/^Add\s+/i, '').replace(/["']/g, '');
            const reason = parts.length > 1 ? parts.slice(1).join(',').trim() : '';
            sectionsHtml +=
                '<div style="display:flex;align-items:flex-start;gap:12px;color:#fca5a5;font-size:0.92rem;line-height:1.5;">' +
                '<i class="fa-solid fa-circle-xmark" style="color:#ef4444;margin-top:4px;font-size:0.9rem;flex-shrink:0;"></i>' +
                '<div><strong style="color:#f87171;font-weight:700;">' + title + ':</strong> <span style="opacity:0.9">' + reason + '</span></div></div>';
        });
        sectionsHtml += '</div></div>';
        missingElementsContainer.innerHTML += sectionsHtml;
    }

    if (aiData.missingKeywords && aiData.missingKeywords.length > 0) {
        let keywordsHtml = '<div><h5 style="color:#fbbf24;margin-bottom:12px;font-size:0.9rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Target Keywords</h5><div style="display:flex;flex-wrap:wrap;gap:8px;">';
        aiData.missingKeywords.forEach(function(skill) {
            keywordsHtml += '<span class="skill-tag missing-skill" style="background:rgba(245,158,11,0.05);color:#fbbf24;border:1px solid rgba(245,158,11,0.15);font-size:0.8rem;padding:4px 12px;">' + skill + '</span>';
        });
        keywordsHtml += '</div></div>';
        missingElementsContainer.innerHTML += keywordsHtml;
    }

    // Improvements
    improvementsList.innerHTML = '';
    aiData.improvements.forEach(function(item, idx) {
        improvementsList.innerHTML +=
            '<li style="margin-bottom:24px;animation:slideIn 0.5s ease-out ' + (idx * 0.1) + 's backwards;">' +
            '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:20px;padding:25px;display:grid;grid-template-columns:1fr 60px 1.5fr;gap:0;align-items:stretch;overflow:hidden;">' +
            '<div style="background:rgba(239,68,68,0.03);padding:20px;border-radius:16px 0 0 16px;border:1px solid rgba(239,68,68,0.08);border-right:none;display:flex;flex-direction:column;justify-content:center;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="background:#f87171;width:6px;height:6px;border-radius:50%;"></span>' +
            '<div style="color:#f87171;font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">Mistake Found</div></div>' +
            '<div style="color:#94a3b8;font-size:0.9rem;line-height:1.6;font-style:italic;opacity:0.8;">"' + item.mistake + '"</div></div>' +
            '<div style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.01);border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05);">' +
            '<div style="width:40px;height:40px;background:rgba(99,102,241,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--primary);border:1px solid rgba(99,102,241,0.2);box-shadow:0 0 20px rgba(99,102,241,0.15);z-index:1;">' +
            '<i class="fa-solid fa-bolt-lightning" style="font-size:0.9rem;"></i></div></div>' +
            '<div style="background:rgba(16,185,129,0.03);padding:20px;border-radius:0 16px 16px 0;border:1px solid rgba(16,185,129,0.08);border-left:none;display:flex;flex-direction:column;justify-content:center;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="background:#34d399;width:6px;height:6px;border-radius:50%;"></span>' +
            '<div style="color:#34d399;font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">Suggestion for You</div></div>' +
            '<div style="color:#f1f5f9;font-size:1rem;font-weight:600;line-height:1.6;">' + item.correction + '</div></div>' +
            '</div></li>';
    });

    // Discovery Panel
    const discoveryContent = document.getElementById('discoveryContent');
    if (discoveryContent) {
        discoveryContent.innerHTML = '';
        
        // Helper to create discovery card
        const addDiscoveryCard = (title, icon, items) => {
            let itemsHtml = items.map(item => `<div style="font-size:0.85rem; color:#94a3b8; margin-bottom:5px; padding-left:10px; border-left:1px solid rgba(255,255,255,0.1);">${item}</div>`).join('');
            discoveryContent.innerHTML += `
                <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:15px; padding:20px;">
                    <div style="color:var(--primary-light); font-weight:700; font-size:0.9rem; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                        <i class="fa-solid ${icon}"></i> ${title}
                    </div>
                    <div>${itemsHtml || '<span style="color:#64748b; font-style:italic;">None found</span>'}</div>
                </div>`;
        };

        const expTitles = aiData.rewrittenResume.experience.map(e => e.title + ' at ' + e.company);
        const projectTitles = aiData.rewrittenResume.projects.map(p => p.name);
        const eduInfo = [aiData.rewrittenResume.education];

        addDiscoveryCard("Roles Identified", "fa-briefcase", expTitles);
        addDiscoveryCard("Projects Identified", "fa-code-branch", projectTitles);
        addDiscoveryCard("Academic Data", "fa-graduation-cap", eduInfo);
        addDiscoveryCard("Credentials", "fa-certificate", [aiData.rewrittenResume.certifications || "Available upon request"]);
    }

    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(function() {
        document.querySelectorAll('.progress-bar-fill').forEach(function(bar, index) {
            const widths = [scoreValue, scoreValue - 10, scoreValue + 5, scoreValue - 5];
            bar.style.width = (widths[index % 4] || 75) + '%';
        });
    }, 500);
}

// Job Opportunities Renderer
function renderJobOpportunities(jobs) {
    var section = document.getElementById('jobOpportunitiesSection');
    var grid = document.getElementById('jobsGrid');
    grid.innerHTML = '';

    var palettes = [
        { a: '#6366f1', b: '#a855f7', ring: '#818cf8' },
        { a: '#10b981', b: '#06b6d4', ring: '#34d399' },
        { a: '#f59e0b', b: '#ef4444', ring: '#fbbf24' },
        { a: '#ec4899', b: '#8b5cf6', ring: '#f472b6' }
    ];

    jobs.forEach(function(job, idx) {
        var p = palettes[idx % palettes.length];
        var score = Math.min(Math.max(job.matchScore || 75, 0), 100);
        var ringDeg = (score / 100 * 360).toFixed(1);

        var matchedChips = (job.matchedSkills || []).map(function(s) {
            return '<span class="job-chip chip-match"><i class="fa-solid fa-check" style="font-size:0.6rem;"></i> ' + s + '</span>';
        }).join('');

        var growChips = (job.skillsToGrow || []).map(function(s) {
            return '<span class="job-chip chip-grow"><i class="fa-solid fa-plus" style="font-size:0.6rem;"></i> ' + s + '</span>';
        }).join('');

        var matchedBlock = matchedChips
            ? '<div><div class="job-chips-label" style="color:#34d399;"><i class="fa-solid fa-circle-check" style="margin-right:5px;"></i>Your Matching Skills</div><div class="job-chips">' + matchedChips + '</div></div>'
            : '';

        var growBlock = growChips
            ? '<div><div class="job-chips-label" style="color:#fbbf24;"><i class="fa-solid fa-arrow-trend-up" style="margin-right:5px;"></i>Skills to Develop</div><div class="job-chips">' + growChips + '</div></div>'
            : '';

        var cardStyle = '--job-color-a:' + p.a + '; --job-color-b:' + p.b + '; --ring-color:' + p.ring + '; --ring-pct:' + ringDeg + 'deg; animation-delay:' + (idx * 0.12) + 's;';

        grid.innerHTML +=
            '<div class="job-card" style="' + cardStyle + '">' +
            '<div class="job-card-top">' +
            '<div class="job-card-left">' +
            '<div class="job-role">' + (job.role || '') + '</div>' +
            '<div class="job-category"><i class="fa-solid fa-tag" style="margin-right:5px;opacity:0.6;"></i>' + (job.category || 'General') + '</div>' +
            '</div>' +
            '<div class="job-match-ring">' +
            '<div class="job-match-text">' + score + '%</div>' +
            '<div class="job-match-label">Match</div>' +
            '</div></div>' +
            '<div class="job-salary"><i class="fa-solid fa-money-bill-wave"></i> ' + (job.avgSalary || 'Competitive salary') + '</div>' +
            '<div class="job-why">' + (job.whyFit || '') + '</div>' +
            matchedBlock + growBlock +
            '</div>';
    });

    section.style.display = 'block';
}

function generatePerfectResume() {
    if (!globalAiResume) { alert("AI data not found."); return; }

    const wrapper = document.getElementById('generatedResume');
    const btn = document.querySelector('.btn-magic');

    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Writing perfect layout...';
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';

    if (globalAiResume.name) {
        document.getElementById('dynCandidateName').innerText = globalAiResume.name;
        document.getElementById('dynCandidateEmail').innerHTML = globalAiResume.contact;
    } else {
        const fileInput = document.getElementById("resumeInput");
        if (fileInput.files.length > 0) {
            let rawName = fileInput.files[0].name.replace(/\.[^/.]+$/, "");
            rawName = rawName.replace(/[-_]/g, ' ').replace(/resume/i, '').trim();
            const formattedName = rawName.split(' ').map(function(word) {
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }).join(' ');
            document.getElementById('dynCandidateName').innerText = formattedName || "AI Candidate";
        }
    }

    document.getElementById('dynRoleView').innerText = globalAiResume.summary;

    const jobsContainer = document.getElementById('aiExperienceContainer');
    jobsContainer.innerHTML = '';

    globalAiResume.experience.forEach(function(job) {
        const bulletHtml = job.bullets.map(function(b) { return '<li>' + b + '</li>'; }).join('');
        jobsContainer.innerHTML +=
            '<div class="resume-job">' +
            '<div class="resume-job-header"><span>' + job.title + '</span><span>' + job.duration + '</span></div>' +
            '<div class="resume-job-company">' + job.company + '</div>' +
            '<ul class="resume-bullets">' + bulletHtml + '</ul>' +
            '</div>';
    });
    
    document.getElementById('aiCompetencies').innerHTML = '<strong>Key Skills:</strong> ' + (globalAiResume.skills || globalAiResume.coreCompetencies || 'Not listed');
    document.getElementById('aiEducation').innerText = globalAiResume.education || 'See original for details';
    document.getElementById('aiCertifications').innerText = globalAiResume.certifications || 'Not provided';

    const projectsContainer = document.getElementById('aiProjectsContainer');
    projectsContainer.innerHTML = '';
    if (globalAiResume.projects && globalAiResume.projects.length > 0) {
        globalAiResume.projects.forEach(function(p) {
            projectsContainer.innerHTML += `
                <div style="margin-bottom:12px;">
                    <div style="font-weight:700; color:#334155;">${p.name}</div>
                    <div style="font-size:0.9rem; color:#475569;">${p.details}</div>
                </div>`;
        });
    } else {
        projectsContainer.innerHTML = '<p style="font-size:0.9rem; color:#475569;">Detailed project breakdown will appear in the full AI report.</p>';
    }

    setTimeout(function() {
        btn.style.display = 'none';
        wrapper.style.display = 'block';
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1000);
}

function downloadPDF(btnElement) {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generating PDF...';
    btnElement.style.opacity = '0.8';
    btnElement.style.pointerEvents = 'none';

    const element = document.querySelector('.resume-viewer');
    const watermark = element.querySelector('.ai-watermark');
    if (watermark) { watermark.style.display = 'none'; }

    const candidateName = document.getElementById('dynCandidateName').innerText.replace(/\s+/g, '_');
    const targetRole = document.getElementById('jobTitleInput').value.trim().replace(/\s+/g, '_') || 'Resume';
    const fileName = candidateName + '_' + targetRole + '_Optimized.pdf';

    const opt = {
        margin: [10, 10, 10, 10],
        filename: fileName,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(function() {
        if (watermark) { watermark.style.display = 'flex'; }
        btnElement.innerHTML = '<i class="fa-solid fa-check"></i> PDF Saved Successfully!';
        btnElement.style.background = 'linear-gradient(45deg, #10b981, #34d399)';
        setTimeout(function() {
            btnElement.innerHTML = originalText;
            btnElement.style.background = '';
            btnElement.style.opacity = '1';
            btnElement.style.pointerEvents = 'auto';
        }, 3000);
    }).catch(function(err) {
        console.error("PDF generation failed:", err);
        btnElement.innerHTML = originalText;
        btnElement.style.opacity = '1';
        btnElement.style.pointerEvents = 'auto';
        alert("Failed to generate PDF. Make sure your browser allows downloads.");
    });
}
