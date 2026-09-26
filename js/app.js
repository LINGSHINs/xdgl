/* ===== 信岸 · 应用逻辑 ===== */

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    renderThemePanel();
    updateCountdown();
    setInterval(updateCountdown, 1000);
    renderChapterList();
    renderChapterSelect();
    renderMindmap();
    renderYearTabs();
    renderTips();
    renderWrongQuestions();
    updateStats();
    setTimeout(() => document.getElementById('loader').classList.add('hide'), 600);
});

// ===== 设置持久化 =====
function loadSettings() {
    try {
        const saved = localStorage.getItem('lumen.credit.settings');
        if (saved) {
            const s = JSON.parse(saved);
            stats.theme = s.theme || 'obsidian';
            stats.examDate = s.examDate || null;
            stats.wrongQuestions = s.wrongQuestions || [];
            stats.todayDone = s.todayDone || 0;
            stats.correctCount = s.correctCount || 0;
            stats.lastStudyDate = s.lastStudyDate || null;
        }
        applyTheme(stats.theme);
        if (stats.examDate) {
            document.getElementById('examDateInput').value = stats.examDate;
            updateCurrentExamDateDisplay();
        }
    } catch(e) { console.error(e); }
}

function saveSettings() {
    try {
        localStorage.setItem('lumen.credit.settings', JSON.stringify({
            theme: stats.theme,
            examDate: stats.examDate,
            wrongQuestions: stats.wrongQuestions,
            todayDone: stats.todayDone,
            correctCount: stats.correctCount,
            lastStudyDate: stats.lastStudyDate
        }));
    } catch(e) { console.error(e); }
}

// ===== 主题系统 =====
function renderThemePanel() {
    const container = document.getElementById('themeList');
    const cats = { dark: '深色主题', light: '浅色主题', classic: '经典主题' };
    let html = '';
    for (const [key, label] of Object.entries(cats)) {
        html += `<div class="theme-category"><div class="theme-category-title">${label}</div><div class="theme-grid">`;
        THEME_CONFIG[key].forEach(t => {
            const active = stats.theme === t.id ? ' active' : '';
            html += `<div class="theme-swatch${active}" data-theme="${t.id}" onclick="setTheme('${t.id}')" style="background:linear-gradient(135deg,${t.colors[0]},${t.colors[1]},${t.colors[2]})"><span class="swatch-name">${t.name}</span></div>`;
        });
        html += `</div></div>`;
    }
    container.innerHTML = html;
}

function setTheme(id) {
    stats.theme = id;
    applyTheme(id);
    saveSettings();
    renderThemePanel();
}

function applyTheme(id) {
    document.documentElement.className = '';
    document.documentElement.classList.add(`theme-${id}`);
}

function toggleThemePanel() {
    const panel = document.getElementById('themePanel');
    const overlay = document.getElementById('overlay');
    panel.classList.toggle('open');
    overlay.classList.toggle('show');
}

// ===== 导航 =====
function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`section-${id}`).classList.add('active');
    document.querySelector(`.nav-item[data-section="${id}"]`)?.classList.add('active');
    document.getElementById('navMenu').classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
    document.getElementById('navMenu').classList.toggle('open');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== 倒计时 =====
function updateCountdown() {
    const bar = document.getElementById('countdownBar');
    if (!stats.examDate) {
        bar.innerHTML = '<div style="color:var(--text-tertiary);font-size:0.9rem;">◓ 请在「计日」模块设置考试日期</div>';
        return;
    }
    const now = new Date();
    const exam = new Date(stats.examDate + 'T09:00:00');
    const diff = exam - now;
    if (diff <= 0) {
        bar.innerHTML = '<div style="color:var(--accent);font-size:1.1rem;font-weight:700;">🎉 考试日已到！祝你顺利！</div>';
        return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    bar.innerHTML = `
        <div class="countdown-unit"><span class="countdown-num">${days}</span><div class="countdown-label">天</div></div>
        <div class="countdown-unit"><span class="countdown-num">${hours}</span><div class="countdown-label">时</div></div>
        <div class="countdown-unit"><span class="countdown-num">${mins}</span><div class="countdown-label">分</div></div>
        <div class="countdown-unit"><span class="countdown-num">${secs}</span><div class="countdown-label">秒</div></div>
    `;
}

function saveExamDate() {
    const val = document.getElementById('examDateInput').value;
    if (!val) { alert('请选择日期'); return; }
    stats.examDate = val;
    saveSettings();
    updateCurrentExamDateDisplay();
    updateCountdown();
    alert('考试日期已保存！');
}

function updateCurrentExamDateDisplay() {
    const el = document.getElementById('currentExamDate');
    if (stats.examDate) {
        const d = new Date(stats.examDate);
        el.textContent = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
    } else {
        el.textContent = '未设置';
    }
}

// ===== 统计数据 =====
function updateStats() {
    document.getElementById('statQuestions').textContent = stats.totalQuestions;
    document.getElementById('statDone').textContent = stats.todayDone;
    const rate = stats.todayDone > 0 ? Math.round((stats.correctCount / stats.todayDone) * 100) : 0;
    document.getElementById('statCorrect').textContent = rate + '%';
}

function recordAnswer(correct) {
    const today = new Date().toDateString();
    if (stats.lastStudyDate !== today) {
        stats.todayDone = 0;
        stats.correctCount = 0;
        stats.lastStudyDate = today;
    }
    stats.todayDone++;
    if (correct) stats.correctCount++;
    saveSettings();
    updateStats();
}

// ===== 墨卷 - 学习资料 =====
function renderChapterList() {
    const container = document.getElementById('chapterList');
    container.innerHTML = CHAPTERS.map(ch => `
        <div class="chapter-item" id="chapter-${ch.id}">
            <button class="chapter-header" onclick="toggleChapter(${ch.id})">
                <span><span class="ch-num">${ch.id}</span>${ch.title}</span>
                <span class="ch-arrow">▼</span>
            </button>
            <div class="chapter-body">
                <div class="chapter-content">
                    ${ch.sections.map(s => `
                        <div class="knowledge-block">
                            <div class="knowledge-title">▸ ${s.title}</div>
                            <div class="knowledge-text">
                                ${s.content.map(c => {
                                    let cls = '';
                                    if (c.type === 'red') cls = 'highlight-red';
                                    else if (c.type === 'blue') cls = 'highlight-blue';
                                    return `<p style="margin-bottom:6px;"><span class="${cls}">● ${c.text}</span></p>`;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function toggleChapter(id) {
    document.getElementById(`chapter-${id}`).classList.toggle('open');
}

function expandAllChapters() {
    document.querySelectorAll('.chapter-item').forEach(el => el.classList.toggle('open'));
}

// ===== 题渊 - 章节练习 =====
function renderChapterSelect() {
    const select = document.getElementById('chapterSelect');
    select.innerHTML = '<option value="">选择章节</option>' + 
        CHAPTERS.map(ch => `<option value="${ch.id}">${ch.short}</option>`).join('');
}

let currentQuizChapter = null;
let currentQuizIndex = 0;

function loadChapterQuiz() {
    const chId = parseInt(document.getElementById('chapterSelect').value);
    if (!chId) { document.getElementById('quizContainer').innerHTML = ''; return; }
    currentQuizChapter = chId;
    currentQuizIndex = 0;
    renderQuizQuestion();
}

function renderQuizQuestion() {
    const questions = QUESTION_BANK[currentQuizChapter] || [];
    if (questions.length === 0) {
        document.getElementById('quizContainer').innerHTML = '<div class="empty-state"><div class="empty-icon">◈</div><p>该章节暂无题目</p></div>';
        return;
    }
    const q = questions[currentQuizIndex];
    const typeLabels = { single: '单选', multi: '多选', judge: '判断' };
    const typeClass = q.type;
    document.getElementById('quizContainer').innerHTML = `
        <div class="quiz-card">
            <div class="quiz-progress">
                <div class="progress-bar"><div class="progress-fill" style="width:${((currentQuizIndex+1)/questions.length)*100}%"></div></div>
                <span class="progress-text">${currentQuizIndex+1}/${questions.length}</span>
            </div>
            <div class="quiz-question"><span class="q-type ${typeClass}">${typeLabels[q.type]}</span>${q.q}</div>
            <div class="quiz-options" id="quizOptions">
                ${q.opts.map((opt, i) => `
                    <button class="quiz-option" onclick="selectOption(${i}, this)">
                        <span class="opt-label">${q.type === 'judge' ? (i===0?'✓':'✗') : String.fromCharCode(65+i)}</span>
                        <span>${opt}</span>
                    </button>
                `).join('')}
            </div>
            <div class="quiz-actions">
                <button class="btn btn-secondary" onclick="prevQuestion()" ${currentQuizIndex===0?'disabled style="opacity:0.5"':''}>上一题</button>
                <button class="btn btn-primary" onclick="submitAnswer()">确认答案</button>
                <button class="btn btn-secondary" onclick="nextQuestion()" ${currentQuizIndex===questions.length-1?'disabled style="opacity:0.5"':''}>下一题</button>
            </div>
            <div class="quiz-result" id="quizResult"></div>
        </div>
    `;
}

let selectedOptions = [];

function selectOption(idx, el) {
    const questions = QUESTION_BANK[currentQuizChapter];
    const q = questions[currentQuizIndex];
    if (q.type === 'multi') {
        el.classList.toggle('selected');
        if (selectedOptions.includes(idx)) selectedOptions = selectedOptions.filter(i => i !== idx);
        else selectedOptions.push(idx);
    } else {
        document.querySelectorAll('#quizOptions .quiz-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        selectedOptions = [idx];
    }
}

function submitAnswer() {
    const questions = QUESTION_BANK[currentQuizChapter];
    const q = questions[currentQuizIndex];
    const resultEl = document.getElementById('quizResult');
    const options = document.querySelectorAll('#quizOptions .quiz-option');
    
    let isCorrect = false;
    if (q.type === 'multi') {
        const sorted = [...selectedOptions].sort().join(',');
        const answerSorted = [...q.answer].sort().join(',');
        isCorrect = sorted === answerSorted;
        options.forEach((opt, i) => {
            if (q.answer.includes(i)) opt.classList.add('correct');
            else if (selectedOptions.includes(i)) opt.classList.add('wrong');
        });
    } else {
        isCorrect = selectedOptions[0] === q.answer;
        options.forEach((opt, i) => {
            if (i === q.answer) opt.classList.add('correct');
            else if (selectedOptions.includes(i)) opt.classList.add('wrong');
        });
    }
    
    recordAnswer(isCorrect);
    
    if (!isCorrect) {
        stats.wrongQuestions.push({ chapter: currentQuizChapter, index: currentQuizIndex, ...q });
        saveSettings();
        renderWrongQuestions();
    }
    
    resultEl.className = `quiz-result show ${isCorrect ? 'correct-box' : 'wrong-box'}`;
    resultEl.innerHTML = `<strong>${isCorrect ? '✓ 回答正确！' : '✗ 回答错误'}</strong><br><br><strong>解析：</strong>${q.explain}`;
    selectedOptions = [];
}

function prevQuestion() {
    if (currentQuizIndex > 0) { currentQuizIndex--; renderQuizQuestion(); }
}

function nextQuestion() {
    const questions = QUESTION_BANK[currentQuizChapter];
    if (currentQuizIndex < questions.length - 1) { currentQuizIndex++; renderQuizQuestion(); }
}

// ===== 脉络 - 思维导图 =====
function renderMindmap() {
    const container = document.getElementById('mindmapContainer');
    const d = MINDMAP_DATA;
    container.innerHTML = `
        <div class="mindmap-container">
            <div class="mindmap-node central">${d.central}</div>
            <div style="width:100%;display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:10px;">
                ${d.branches.map(b => `
                    <div class="mindmap-node branch">
                        <strong>${b.name}</strong>
                        <div class="mindmap-children">
                            ${b.children.map(c => `<span class="mindmap-child">${c}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ===== 考迹 - 历年真题 =====
function renderYearTabs() {
    const years = Object.keys(PAST_EXAMS).sort((a,b) => b - a);
    const container = document.getElementById('yearTabs');
    container.innerHTML = years.map(y => 
        `<button class="year-tab ${y === years[0] ? 'active' : ''}" onclick="loadYearExam('${y}', this)">${y}年</button>`
    ).join('');
    loadYearExam(years[0]);
}

function loadYearExam(year, btn) {
    document.querySelectorAll('.year-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const questions = PAST_EXAMS[year] || [];
    const container = document.getElementById('yearQuizContainer');
    if (questions.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">◈</div><p>该年份暂无题目</p></div>';
        return;
    }
    container.innerHTML = questions.map((q, i) => {
        const typeLabels = { single: '单选', multi: '多选', judge: '判断' };
        return `
            <div class="quiz-card">
                <div class="quiz-question"><span class="q-type ${q.type}">${typeLabels[q.type]}</span>${i+1}. ${q.q}</div>
                <div class="quiz-options">
                    ${q.opts.map((opt, j) => `
                        <button class="quiz-option" onclick="checkYearAnswer('${year}', ${i}, ${j}, this)">
                            <span class="opt-label">${q.type === 'judge' ? (j===0?'✓':'✗') : String.fromCharCode(65+j)}</span>
                            <span>${opt}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="quiz-result" id="yearResult-${i}"></div>
            </div>
        `;
    }).join('');
}

function checkYearAnswer(year, qIdx, optIdx, el) {
    const q = PAST_EXAMS[year][qIdx];
    const resultEl = document.getElementById(`yearResult-${qIdx}`);
    const isCorrect = optIdx === q.answer;
    recordAnswer(isCorrect);
    
    const card = el.closest('.quiz-card');
    card.querySelectorAll('.quiz-option').forEach((opt, i) => {
        if (i === q.answer) opt.classList.add('correct');
        else if (i === optIdx) opt.classList.add('wrong');
    });
    
    if (!isCorrect) {
        stats.wrongQuestions.push({ year, index: qIdx, ...q });
        saveSettings();
        renderWrongQuestions();
    }
    
    resultEl.className = `quiz-result show ${isCorrect ? 'correct-box' : 'wrong-box'}`;
    resultEl.innerHTML = `<strong>${isCorrect ? '✓ 回答正确！' : '✗ 回答错误'}</strong><br><br><strong>解析：</strong>${q.explain}`;
}

// ===== 锦囊 - 高频考点 =====
function renderTips() {
    const container = document.getElementById('tipsGrid');
    const tagLabels = { must: '必背', important: '重要', remember: '速记' };
    container.innerHTML = HIGHLIGHT_TIPS.map(t => `
        <div class="tip-card">
            <span class="tip-tag ${t.tag}">${tagLabels[t.tag]}</span>
            <div class="tip-title">${t.title}</div>
            <div class="tip-content">${t.content}</div>
        </div>
    `).join('');
}

// ===== 错鉴 - 错题本 =====
function renderWrongQuestions() {
    const container = document.getElementById('wrongQuestionsContainer');
    if (stats.wrongQuestions.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">◔</div><p>太棒了！目前没有错题记录</p><p style="margin-top:8px;font-size:0.8rem;">做题时答错的题目会自动收录到这里</p></div>';
        return;
    }
    const typeLabels = { single: '单选', multi: '多选', judge: '判断' };
    container.innerHTML = stats.wrongQuestions.map((q, i) => `
        <div class="quiz-card" style="margin-bottom:16px;">
            <div class="quiz-question"><span class="q-type ${q.type}">${typeLabels[q.type]}</span>${i+1}. ${q.q}</div>
            <div class="quiz-options">
                ${q.opts.map((opt, j) => {
                    let cls = '';
                    if (Array.isArray(q.answer)) { if (q.answer.includes(j)) cls = ' correct'; }
                    else { if (j === q.answer) cls = ' correct'; }
                    return `<div class="quiz-option${cls}" style="cursor:default;"><span class="opt-label">${q.type === 'judge' ? (j===0?'✓':'✗') : String.fromCharCode(65+j)}</span><span>${opt}</span></div>`;
                }).join('')}
            </div>
            <div class="quiz-result show correct-box" style="margin-top:12px;">
                <strong>正确答案：</strong>${Array.isArray(q.answer) ? q.answer.map(a => String.fromCharCode(65+a)).join('、') : String.fromCharCode(65+q.answer)}<br>
                <strong>解析：</strong>${q.explain}
            </div>
        </div>
    `).join('');
}

function clearWrongQuestions() {
    if (confirm('确定要清空所有错题吗？此操作不可恢复。')) {
        stats.wrongQuestions = [];
        saveSettings();
        renderWrongQuestions();
    }
}

// ===== 实战 - 模考 =====
let mockExamState = { questions: [], current: 0, answers: [], startTime: null, timer: null };

function startMockExam() {
    document.getElementById('mockExamIntro').style.display = 'none';
    document.getElementById('mockExamContainer').style.display = 'block';
    
    // 从题库随机抽题
    let allQuestions = [];
    Object.entries(QUESTION_BANK).forEach(([ch, qs]) => {
        qs.forEach(q => allQuestions.push({ ...q, chapter: ch }));
    });
    Object.entries(PAST_EXAMS).forEach(([year, qs]) => {
        qs.forEach(q => allQuestions.push({ ...q, year }));
    });
    
    // 随机打乱并取90题
    allQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 90);
    
    mockExamState = {
        questions: allQuestions,
        current: 0,
        answers: new Array(allQuestions.length).fill(null),
        startTime: Date.now(),
        timer: null
    };
    
    renderMockQuestion();
    startMockTimer();
}

function renderMockQuestion() {
    const container = document.getElementById('mockExamContainer');
    const q = mockExamState.questions[mockExamState.current];
    const typeLabels = { single: '单选', multi: '多选', judge: '判断' };
    const answered = mockExamState.answers[mockExamState.current] !== null;
    
    container.innerHTML = `
        <div class="quiz-card">
            <div class="quiz-progress">
                <div class="progress-bar"><div class="progress-fill" style="width:${((mockExamState.current+1)/mockExamState.questions.length)*100}%"></div></div>
                <span class="progress-text">${mockExamState.current+1}/${mockExamState.questions.length}</span>
                <span class="progress-text" id="mockTimer" style="margin-left:auto;">120:00</span>
            </div>
            <div class="quiz-question"><span class="q-type ${q.type}">${typeLabels[q.type]}</span>${q.q}</div>
            <div class="quiz-options">
                ${q.opts.map((opt, i) => {
                    let cls = '';
                    if (answered) {
                        if (Array.isArray(q.answer)) {
                            if (q.answer.includes(i)) cls = ' correct';
                            else if (mockExamState.answers[mockExamState.current]?.includes(i)) cls = ' wrong';
                        } else {
                            if (i === q.answer) cls = ' correct';
                            else if (mockExamState.answers[mockExamState.current] === i) cls = ' wrong';
                        }
                    }
                    return `<button class="quiz-option${cls}" onclick="mockSelect(${i}, this)" ${answered ? 'disabled style="cursor:default;opacity:0.8;"' : ''}>
                        <span class="opt-label">${q.type === 'judge' ? (i===0?'✓':'✗') : String.fromCharCode(65+i)}</span>
                        <span>${opt}</span>
                    </button>`;
                }).join('')}
            </div>
            <div class="quiz-actions">
                <button class="btn btn-secondary" onclick="mockPrev()" ${mockExamState.current===0?'disabled style="opacity:0.5"':''}>上一题</button>
                ${!answered ? `<button class="btn btn-primary" onclick="mockSubmit()">确认答案</button>` : ''}
                <button class="btn btn-secondary" onclick="mockNext()" ${mockExamState.current===mockExamState.questions.length-1?'disabled style="opacity:0.5"':''}>下一题</button>
            </div>
            ${answered ? `<div class="quiz-result show ${isMockCorrect() ? 'correct-box' : 'wrong-box'}"><strong>${isMockCorrect() ? '✓ 回答正确！' : '✗ 回答错误'}</strong><br><br><strong>解析：</strong>${q.explain}</div>` : ''}
        </div>
    `;
}

function isMockCorrect() {
    const q = mockExamState.questions[mockExamState.current];
    const ans = mockExamState.answers[mockExamState.current];
    if (Array.isArray(q.answer)) {
        return JSON.stringify([...ans].sort()) === JSON.stringify([...q.answer].sort());
    }
    return ans === q.answer;
}

function mockSelect(idx, el) {
    const q = mockExamState.questions[mockExamState.current];
    if (mockExamState.answers[mockExamState.current] !== null) return;
    if (q.type === 'multi') {
        el.classList.toggle('selected');
        let sel = mockExamState.answers[mockExamState.current] || [];
        if (sel.includes(idx)) sel = sel.filter(i => i !== idx);
        else sel.push(idx);
        mockExamState.answers[mockExamState.current] = sel;
    } else {
        el.closest('.quiz-options').querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        mockExamState.answers[mockExamState.current] = idx;
    }
}

function mockSubmit() {
    if (mockExamState.answers[mockExamState.current] === null) { alert('请先选择答案'); return; }
    renderMockQuestion();
}

function mockPrev() {
    if (mockExamState.current > 0) { mockExamState.current--; renderMockQuestion(); }
}

function mockNext() {
    if (mockExamState.current < mockExamState.questions.length - 1) { mockExamState.current++; renderMockQuestion(); }
}

function startMockTimer() {
    let remaining = 120 * 60;
    mockExamState.timer = setInterval(() => {
        remaining--;
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        const el = document.getElementById('mockTimer');
        if (el) el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        if (remaining <= 0) {
            clearInterval(mockExamState.timer);
            finishMockExam();
        }
    }, 1000);
}

function finishMockExam() {
    clearInterval(mockExamState.timer);
    const correct = mockExamState.questions.filter((q, i) => {
        const ans = mockExamState.answers[i];
        if (Array.isArray(q.answer)) return JSON.stringify([...(ans||[])].sort()) === JSON.stringify([...q.answer].sort());
        return ans === q.answer;
    }).length;
    const score = Math.round((correct / mockExamState.questions.length) * 100);
    alert(`模考结束！\n得分：${score}分\n答对：${correct}/${mockExamState.questions.length}题`);
    showSection('home');
}
