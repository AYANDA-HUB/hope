(() => {
    const SUB_API_URL = "http://127.0.0.1:8181/subjects";
    const subToken = localStorage.getItem("access_token");
    const subUser = JSON.parse(localStorage.getItem("loggedInUser"));
    
    const subHeaders = { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${subToken}` 
    };

    const instView = document.getElementById("instructorSubjects");
    const studView = document.getElementById("studentSubjects");

    // ==========================================
    // INSTRUCTOR PAGES
    // ==========================================

    window.instPage1 = async function() {
        const res = await fetch(`${SUB_API_URL}/`, { headers: subHeaders });
        const subjects = await res.json();

        instView.innerHTML = `
            <div class="header-row">
                <h3>My Channels</h3>
                <button class="create-btn" onclick="window.instPageCreate()">+ New Subject</button>
            </div>
            <div class="grid">
                ${subjects.map(s => `
                    <button class="long-btn" onclick="window.instPage2(${s.id}, '${s.name}')">
                        ${s.name} (${s.code})
                    </button>
                `).join('')}
            </div>
        `;
    };

    window.instPage2 = async function(id, name) {
        const [mRes, qRes] = await Promise.all([
            fetch(`${SUB_API_URL}/${id}/materials`, { headers: subHeaders }),
            fetch(`${SUB_API_URL}/${id}/quizzes`, { headers: subHeaders })
        ]);
        const materials = await mRes.json();
        const quizzes = await qRes.json();

        instView.innerHTML = `
            <button class="back-link" onclick="window.instPage1()">← Back to Dashboard</button>
            <h2>Managing: ${name}</h2>
            <div class="action-row">
                <button class="action-btn" onclick="window.instUploadForm(${id})">Upload Material</button>
                <button class="action-btn" onclick="window.instQuizForm(${id})">Create Quiz</button>
                <button class="action-btn" style="background: #2e7d32;" onclick="window.showManualMarkForm(${id}, '${name}')">📝 Record Manual Mark</button>
            </div>
            <div class="history-section">
                <h4>Quiz History & Analytics</h4>
                <ul class="dated-list">
                    ${quizzes.length ? quizzes.map(q => `
                        <li style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span>${q.title}</span>
                            <button class="action-btn" style="padding:4px 8px; font-size:0.8em;" onclick="window.viewQuizAnalytics(${q.id}, '${q.title}', ${id}, '${name}')">📈 Analytics</button>
                        </li>
                    `).join('') : '<li>No quizzes yet.</li>'}
                </ul>
                <h4>Materials</h4>
                <ul class="dated-list">
                    ${materials.length ? materials.map(m => `<li>📄 ${m.title}</li>`).join('') : '<li>No materials yet.</li>'}
                </ul>
            </div>
        `;
    };

    // --- NEW FEATURE: MANUAL MARK FORM ---
    window.showManualMarkForm = async function(subjectId, subjectName) {
        // Fetch students enrolled in this subject (Assumes an endpoint exists)
        const res = await fetch(`${SUB_API_URL}/${subjectId}/students`, { headers: subHeaders });
        const students = await res.json();

        instView.innerHTML = `
            <button class="back-link" onclick="window.instPage2(${subjectId}, '${subjectName}')">← Back</button>
            <h3>Record Class Test Mark</h3>
            <div class="form-container">
                <input id="testTitle" placeholder="Test Title (e.g. Weekly Math Test)">
                <select id="studentSelect" style="width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #ccc;">
                    <option value="">-- Select Student --</option>
                    ${students.map(s => `<option value="${s.id}">${s.fullname}</option>`).join('')}
                </select>
                <input type="number" id="testMark" placeholder="Score (%)" min="0" max="100">
                <button class="submit-btn" style="background: #2e7d32;" onclick="window.submitManualMark(${subjectId}, '${subjectName}')">Save & Send SMS</button>
            </div>
        `;
    };

    window.submitManualMark = async function(subjectId, subjectName) {
        const studentId = document.getElementById('studentSelect').value;
        const title = document.getElementById('testTitle').value;
        const marks = document.getElementById('testMark').value;

        if (!studentId || !title || !marks) return alert("Please fill all fields.");

        const res = await fetch(`${SUB_API_URL}/manual-mark`, {
            method: 'POST',
            headers: subHeaders,
            body: JSON.stringify({ 
                student_id: parseInt(studentId), 
                subject_id: subjectId, 
                test_title: title, 
                marks: parseInt(marks) 
            })
        });

        if (res.ok) {
            alert("Mark recorded and Parent notified via SMS!");
            window.instPage2(subjectId, subjectName);
        } else {
            alert("Failed to record mark.");
        }
    };
    // -------------------------------------

    window.viewQuizAnalytics = async function(quizId, quizTitle, subId, subName) {
        const res = await fetch(`${SUB_API_URL}/quizzes/${quizId}/analytics`, { headers: subHeaders });
        const data = await res.json();

        instView.innerHTML = `
            <button class="back-link" onclick="window.instPage2(${subId}, '${subName}')">← Back to Subject</button>
            <h3>Analytics: ${quizTitle}</h3>
            <table style="width:100%; border-collapse:collapse; background:white; margin-top:15px; border-radius:8px; overflow:hidden;">
                <thead>
                    <tr style="background:#eee; text-align:left;">
                        <th style="padding:10px;">Student Name</th>
                        <th style="padding:10px;">Score</th>
                        <th style="padding:10px;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.length ? data.map(r => `
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:10px;">${r.student_name}</td>
                            <td style="padding:10px; font-weight:bold;">${r.score}%</td>
                            <td style="padding:10px;">${r.score >= 50 ? '✅ Pass' : '❌ Fail'}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="3" style="padding:20px; text-align:center;">No student has taken this quiz yet.</td></tr>'}
                </tbody>
            </table>
        `;
    };

    window.instQuizForm = function(subjectId) {
        instView.innerHTML = `
            <button class="back-link" onclick="window.instPage2(${subjectId})">← Back</button>
            <h3>Create Quiz</h3>
            <div class="form-container">
                <input id="qTitle" placeholder="Quiz Title (e.g. Unit 1 Test)">
                <input id="qTopic" placeholder="Topic for AI (e.g. Biology, Math)">
                <textarea id="qDesc" rows="2" placeholder="Description (Optional)"></textarea>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button class="submit-btn" onclick="window.submitNewQuiz(${subjectId})">Manual Save</button>
                    <button class="create-btn" style="background: #6200ea;" onclick="window.generateAIQuiz(${subjectId})">✨ AI Generate</button>
                </div>
            </div>
        `;
    };

    window.generateAIQuiz = async function(subjectId) {
        const title = document.getElementById("qTitle").value;
        const topic = document.getElementById("qTopic").value;
        if (!title || !topic) return alert("Please enter a Title and a Topic.");

        const btn = event.target;
        btn.innerText = "Generating...";
        btn.disabled = true;

        const res = await fetch(`${SUB_API_URL}/${subjectId}/quizzes/generate`, {
            method: 'POST',
            headers: subHeaders,
            body: JSON.stringify({ title, topic })
        });

        if (res.ok) {
            alert("Quiz generated successfully!");
            window.instPage2(subjectId);
        } else {
            alert("AI generation failed.");
            btn.innerText = "✨ AI Generate";
            btn.disabled = false;
        }
    };

    window.instPageCreate = function() {
        instView.innerHTML = `
            <button class="back-link" onclick="window.instPage1()">← Back</button>
            <h3>Create New Subject</h3>
            <div class="form-container">
                <input id="nName" placeholder="Subject Name">
                <input id="nCode" placeholder="Subject Code">
                <input id="nKey" placeholder="Enrollment Key">
                <button class="submit-btn" onclick="window.submitNewSubject()">Launch Subject</button>
            </div>
        `;
    };

    window.submitNewSubject = async function() {
        const body = { 
            name: document.getElementById('nName').value,
            code: document.getElementById('nCode').value,
            enrollment_key: document.getElementById('nKey').value
        };
        const res = await fetch(`${SUB_API_URL}/create`, {
            method: 'POST', headers: subHeaders, body: JSON.stringify(body)
        });
        if (res.ok) window.instPage1();
        else alert("Error creating subject.");
    };

    window.instUploadForm = function(subjectId) {
        instView.innerHTML = `
            <button class="back-link" onclick="window.instPage2(${subjectId})">← Back</button>
            <h3>Upload Material</h3>
            <div class="form-container">
                <input id="upTitle" placeholder="Material Title">
                <input type="file" id="upFile" class="long-btn">
                <button class="submit-btn" onclick="window.submitUpload(${subjectId})">Upload Now</button>
            </div>
        `;
    };

    window.submitUpload = async function(subjectId) {
        const fileInput = document.getElementById("upFile");
        const titleInput = document.getElementById("upTitle");
        if (!fileInput.files[0]) return alert("Select a file");
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("title", titleInput.value || fileInput.files[0].name);
        const res = await fetch(`${SUB_API_URL}/${subjectId}/materials/upload`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${subToken}` },
            body: formData
        });
        if (res.ok) { alert("Uploaded!"); window.instPage2(subjectId); }
        else alert("Upload failed");
    };

    window.submitNewQuiz = async function(subjectId) {
        const title = document.getElementById("qTitle").value;
        const description = document.getElementById("qDesc").value;
        const res = await fetch(`${SUB_API_URL}/${subjectId}/quizzes/create`, {
            method: 'POST',
            headers: subHeaders,
            body: JSON.stringify({ title, description })
        });
        if (res.ok) { alert("Quiz created!"); window.instPage2(subjectId); }
        else alert("Error creating quiz");
    };

    // ==========================================
    // STUDENT PAGES
    // ==========================================

    window.studPage1 = async function() {
        studView.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3>All School Subjects</h3>
                <button class="action-btn" onclick="window.viewMyResults()">📊 View My Scores</button>
            </div>
            <input type="text" class="search-bar" placeholder="Filter subjects..." oninput="window.searchSubjects(this.value)">
            <div id="searchList" class="grid">Loading subjects...</div>
        `;
        window.searchSubjects("");
    };

    window.viewMyResults = async function() {
        const res = await fetch(`${SUB_API_URL}/my-results`, { headers: subHeaders });
        const results = await res.json();

        studView.innerHTML = `
            <button class="back-link" onclick="window.studPage1()">← Back to Subjects</button>
            <h3>My Quiz Performance</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #6200ea; color: white; text-align: left;">
                        <th style="padding: 12px;">Quiz Title</th>
                        <th style="padding: 12px;">Score</th>
                        <th style="padding: 12px;">Feedback</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.length ? results.map(r => `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 12px;">${r.quiz_title}</td>
                            <td style="padding: 12px;"><strong style="color: ${r.score >= 50 ? '#2e7d32' : '#d32f2f'}">${r.score}%</strong></td>
                            <td style="padding: 12px; color: #666;">${r.feedback}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="3" style="padding:20px; text-align:center;">No attempts recorded yet.</td></tr>'}
                </tbody>
            </table>
        `;
    };

    window.searchSubjects = async function(query) {
        try {
            const [allRes, enRes] = await Promise.all([
                fetch(`${SUB_API_URL}/`, { headers: subHeaders }),
                fetch(`${SUB_API_URL}/enrolled`, { headers: subHeaders })
            ]);
            const allSubjects = await allRes.json();
            const enrolledSubjects = await enRes.json();
            const enrolledIds = enrolledSubjects.map(s => s.id);
            const list = document.getElementById("searchList");
            
            list.innerHTML = allSubjects
                .filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
                .map(s => {
                    const isEnrolled = enrolledIds.includes(s.id);
                    return `
                    <button class="long-btn" onclick="window.studPage2(${s.id}, '${s.name}', ${isEnrolled})">
                        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <span>${s.name} (${s.code})</span>
                            <span class="status-tag ${isEnrolled ? 'enrolled' : 'locked'}">
                                ${isEnrolled ? '✓ Enrolled' : '🔒 Locked'}
                            </span>
                        </div>
                    </button>`;
                }).join('');
        } catch (err) { console.error(err); }
    };

    window.studPage2 = async function(id, name, isEnrolled) {
        studView.innerHTML = `
            <button class="back-link" onclick="window.studPage1()">← Back to All Subjects</button>
            <h2>${name}</h2>
            <div id="enrollSection" class="enroll-box ${isEnrolled ? 'hidden' : ''}">
                <p>Enter the key to unlock this subject.</p>
                <input id="keyInput" placeholder="Enrollment Key">
                <button class="action-btn" onclick="window.verifyEnrollment(${id})">Unlock Subject</button>
            </div>
            <div id="contentDisplay" class="${isEnrolled ? '' : 'hidden'}">
                <p>Loading content...</p>
            </div>
        `;
        if (isEnrolled) window.loadSubjectContent(id);
    };

    window.verifyEnrollment = async function(subjectId) {
        const key = document.getElementById('keyInput').value;
        const res = await fetch(`${SUB_API_URL}/${subjectId}/enroll`, {
            method: 'POST', 
            headers: subHeaders, 
            body: JSON.stringify({ enrollment_key: key })
        });
        if (res.ok) {
            alert("Success!");
            document.getElementById('enrollSection').classList.add('hidden');
            window.loadSubjectContent(subjectId);
        } else alert("Invalid Key.");
    };

    window.loadSubjectContent = async function(id) {
        const [mRes, qRes] = await Promise.all([
            fetch(`${SUB_API_URL}/${id}/materials`, { headers: subHeaders }),
            fetch(`${SUB_API_URL}/${id}/quizzes`, { headers: subHeaders })
        ]);
        const materials = mRes.ok ? await mRes.json() : [];
        const quizzes = qRes.ok ? await qRes.json() : [];
        const display = document.getElementById('contentDisplay');
        display.classList.remove('hidden');
        display.innerHTML = `
            <hr>
            <h3>Materials</h3>
            <ul class="dated-list">
                ${materials.length ? materials.map(m => `<li>📄 ${m.title}</li>`).join('') : '<li>No materials available.</li>'}
            </ul>
            <h3>Quizzes</h3>
            <div class="grid">
                ${quizzes.length ? quizzes.map(q => `
                    <button class="long-btn" onclick="window.startQuiz(${q.id}, '${q.title}')">
                        📝 Attempt: ${q.title}
                    </button>
                `).join('') : '<p>No quizzes available.</p'}
            </div>
        `;
    };

    window.startQuiz = async function(quizId, title) {
        try {
            const res = await fetch(`${SUB_API_URL}/quizzes/${quizId}/questions`, { headers: subHeaders });
            const questions = await res.json();
            if (!questions || questions.length === 0) return alert("This quiz has no questions yet.");

            studView.innerHTML = `
                <button class="back-link" onclick="window.studPage1()">← Cancel</button>
                <div class="quiz-container">
                    <h2>${title}</h2>
                    <form id="mcqForm">
                        ${questions.map((q, idx) => `
                            <div class="question-block" style="margin-bottom: 25px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
                                <p><strong>Q${idx + 1}: ${q.text}</strong></p>
                                ${q.options.map((opt, i) => opt ? `
                                    <label style="display: block; margin: 10px 0; cursor: pointer;">
                                        <input type="radio" name="q${q.id}" value="${opt}" required> ${opt}
                                    </label>
                                ` : '').join('')}
                            </div>
                        `).join('')}
                        <button type="submit" class="submit-btn" style="width: 100%;">Submit Quiz</button>
                    </form>
                </div>
            `;
            document.getElementById('mcqForm').onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const answers = {};
                formData.forEach((value, key) => { answers[key] = value; });
                window.submitQuiz(quizId, answers);
            };
        } catch (err) { alert("Error loading questions."); }
    };

    window.submitQuiz = async function(quizId, answersObject) {
        const res = await fetch(`${SUB_API_URL}/quizzes/${quizId}/submit`, {
            method: 'POST',
            headers: subHeaders,
            body: JSON.stringify({ answers: answersObject })
        });
        if (res.ok) {
            const result = await res.json();
            alert(`Score: ${result.score}% \n${result.feedback}`);
            window.studPage1();
        } else alert("Submission failed.");
    };

    document.addEventListener("DOMContentLoaded", () => {
        const role = subUser?.role || subUser?.user?.role;
        if (role === "instructor") {
            instView.style.display = "block";
            window.instPage1();
        } else if (role === "student") {
            studView.style.display = "block";
            window.studPage1();
        }
    });
})();