
let sets = [];
let userSets = [];
let currentPracticeSession = null;

async function loadSets() {
    try {
        const res = await fetch("default.json");
        sets = await res.json();
    } catch (e) {
        // default set if json loading fails
        sets = [
            {
                name: "Základní matematika",
                questions: [
                    { q: "Kolik je 2 + 2?", a: "4" },
                    { q: "Kolik je 5 * 3?", a: "15" },
                    { q: "Kolik je 10 - 7?", a: "3" }
                ]
            }
        ];
    }
    const saved = localStorage.getItem('userSets');
    if (saved) {
        userSets = JSON.parse(saved);
    }
}
// new sets are saved to localstorage
function saveUserSets() {
    localStorage.setItem('userSets', JSON.stringify(userSets));
}
function setActiveTab(tabId) {
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('text-blue-500');
        btn.classList.add('text-gray-500');
    });
    document.getElementById(tabId).classList.remove('text-gray-500');
    document.getElementById(tabId).classList.add('text-blue-500');
}

function renderHome() {
    setActiveTab('tab-home');
    const content = document.getElementById("content");
    const allSets = [...sets, ...userSets];
    // home screen 
    content.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-screen p-4">
            <h2 class="text-xl font-bold mb-6">Vyber set k procvičování</h2>
            <select id="setSelect" class="border rounded-lg p-3 w-full max-w-md mb-4 bg-white">
                ${allSets.map((s, i) => `<option value="${i}">${s.name}</option>`).join("")}
            </select>
            <button id="startSet" class="bg-blue-500 text-white px-6 py-3 rounded-lg w-full max-w-md">
                Začít procvičovat
            </button>
        </div>
    `;

    document.getElementById("startSet").addEventListener("click", () => {
        const idx = parseInt(document.getElementById("setSelect").value);
        startPractice(allSets[idx]);
    });
}

function renderCreate() {
    setActiveTab('tab-create');
    const content = document.getElementById("content");

    //creating a new set
    //TODO: make sets and questions editable after saving

    content.innerHTML = `
        <div class="p-4 min-h-screen">
            <h2 class="text-xl font-bold mb-6 text-center">Vytvoř nový set</h2>
            <div id="createSetForm">
                <input type="text" id="setName" placeholder="Název setu" 
                       class="border rounded-lg p-3 w-full mb-4 bg-white">
                <button id="createSetBtn" class="bg-blue-500 text-white px-6 py-3 rounded-lg w-full">
                    Pokračovat
                </button>
            </div>
            <div id="questionCreator" style="display: none;">
                <div id="questionTabs" class="flex flex-wrap gap-2 mb-4 border-b pb-2"></div>
                <div class="space-y-4">
                    <input type="text" id="questionInput" placeholder="Zadej otázku" 
                           class="border rounded-lg p-3 w-full bg-white">
                    <input type="text" id="answerInput" placeholder="Zadej odpověď" 
                           class="border rounded-lg p-3 w-full bg-white">
                    <div class="flex gap-2">
                        <button id="addQuestionBtn" class="bg-green-500 text-white px-4 py-2 rounded-lg flex-1">
                            Přidat otázku
                        </button>
                        <button id="saveSetBtn" class="bg-blue-500 text-white px-4 py-2 rounded-lg flex-1">
                            Uložit set
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    let currentSet = { name: "", questions: [] };
    let editingQuestion = -1;

    document.getElementById("createSetBtn").addEventListener("click", () => {
        const name = document.getElementById("setName").value.trim();
        if (!name) {
            alert("Zadej název setu!");
            return;
        }
        currentSet.name = name;
        document.getElementById("createSetForm").style.display = "none";
        document.getElementById("questionCreator").style.display = "block";
        updateQuestionTabs();
    });

    function updateQuestionTabs() {
        const tabs = document.getElementById("questionTabs");
        tabs.innerHTML = currentSet.questions.map((_, i) =>
            `<button class="question-tab px-3 py-1 border rounded ${editingQuestion === i ? 'bg-blue-500 text-white' : 'bg-gray-100'}" data-index="${i}">
                ${i + 1}
            </button>`
        ).join("") +
            `<button id="newQuestionTab" class="px-3 py-1 border rounded bg-green-100 text-green-600">
            + Nová
        </button>`;

        tabs.querySelectorAll(".question-tab").forEach(tab => {
            tab.addEventListener("click", (e) => {
                const index = parseInt(e.target.dataset.index);
                editQuestion(index);
            });
        });

        document.getElementById("newQuestionTab").addEventListener("click", () => {
            editQuestion(-1);
        });
    }

    function editQuestion(index) {
        editingQuestion = index;
        if (index >= 0 && currentSet.questions[index]) {
            document.getElementById("questionInput").value = currentSet.questions[index].q;
            document.getElementById("answerInput").value = currentSet.questions[index].a;
        } else {
            document.getElementById("questionInput").value = "";
            document.getElementById("answerInput").value = "";
        }
        updateQuestionTabs();
    }

    document.getElementById("addQuestionBtn").addEventListener("click", () => {
        const question = document.getElementById("questionInput").value.trim();
        const answer = document.getElementById("answerInput").value.trim();

        if (!question || !answer) {
            alert("Zadej otázku i odpověď!");
            return;
        }

        if (editingQuestion >= 0) {
            currentSet.questions[editingQuestion] = { q: question, a: answer };
        } else {
            currentSet.questions.push({ q: question, a: answer });
        }

        document.getElementById("questionInput").value = "";
        document.getElementById("answerInput").value = "";
        editingQuestion = -1;
        updateQuestionTabs();
    });

    document.getElementById("saveSetBtn").addEventListener("click", () => {
        if (currentSet.questions.length === 0) {
            alert("Přidej alespoň jednu otázku!");
            return;
        }

        userSets.push(currentSet);
        saveUserSets();
        alert(`Set "${currentSet.name}" byl uložen!`);
        renderHome();
    });
}
//user account showing user created sets, will be editable later
function renderAccount() {
    setActiveTab('tab-account');
    const content = document.getElementById("content");

    content.innerHTML = `
        <div class="p-4 min-h-screen">
            <div class="text-center mb-6">
                <div class="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl">
                    👤
                </div>
                <h2 class="text-xl font-bold">Tvůj účet</h2>
            </div>
            
            <div class="space-y-4">
                <h3 class="text-lg font-semibold">Tvoje sety:</h3>
                ${userSets.length === 0 ?
            '<p class="text-gray-500 text-center">Zatím nemáš žádné sety</p>' :
            userSets.map((set, i) => `
                        <div class="bg-white p-4 rounded-lg border flex justify-between items-center">
                            <div>
                                <h4 class="font-semibold">${set.name}</h4>
                                <p class="text-sm text-gray-500">${set.questions.length} otázek</p>
                            </div>
                            <div class="space-x-2">
                                <button class="edit-set bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm" data-index="${i}">
                                    Upravit
                                </button>
                                <button class="delete-set bg-red-100 text-red-600 px-3 py-1 rounded text-sm" data-index="${i}">
                                    Smazat
                                </button>
                            </div>
                        </div>
                    `).join("")
        }
            </div>
        </div>
    `;

    content.querySelectorAll('.edit-set').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            editUserSet(index);
        });
    });

    content.querySelectorAll('.delete-set').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            if (confirm('Opravdu chceš smazat tento set?')) {
                userSets.splice(index, 1);
                saveUserSets();
                renderAccount();
            }
        });
    });
}

function editUserSet(index) {
    renderCreate();
}

function startPractice(set) {
    const content = document.getElementById("content");
    currentPracticeSession = {
        set: set,
        current: 0,
        results: [],
        startTime: Date.now()
    };

    content.innerHTML = "";
    content.style.scrollSnapType = "y mandatory";
    content.style.scrollBehavior = "smooth";

    set.questions.forEach((question, index) => {
        const questionDiv = document.createElement("div");
        questionDiv.className = "questionBlock flex flex-col items-center justify-center min-h-screen text-center p-4 snap-start";
        questionDiv.id = `question-${index}`;
        questionDiv.innerHTML = `
            <div class="w-full max-w-md">
                <div class="mb-4">
                    <span class="text-sm text-gray-500">Otázka ${index + 1} z ${set.questions.length}</span>
                </div>
                <h2 class="text-xl font-bold mb-6">${question.q}</h2>
                <input type="text" placeholder="Tvoje odpověď" 
                       class="answer-input border px-4 py-3 rounded-lg w-full mb-4 text-center"/>
                <button class="submit-answer bg-blue-500 text-white px-6 py-3 rounded-lg w-full">
                    Odeslat
                </button>
            </div>
        `;

        content.appendChild(questionDiv);

        const input = questionDiv.querySelector('.answer-input');
        const button = questionDiv.querySelector('.submit-answer');

        function submitAnswer() {
            const userAnswer = input.value.trim();
            const correct = userAnswer.toLowerCase() === question.a.toLowerCase();

            currentPracticeSession.results.push({
                question: question.q,
                userAnswer: userAnswer,
                correctAnswer: question.a,
                correct: correct,
                time: Date.now() - currentPracticeSession.startTime
            });

            let feedback = questionDiv.querySelector('.feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'feedback mt-2 text-lg font-semibold';
                questionDiv.appendChild(feedback);
            }

            if (correct) {
                feedback.textContent = '✅ Správně!';
                feedback.classList.remove('text-red-600');
                feedback.classList.add('text-green-600');
            } else {
                feedback.textContent = `❌ Špatně! Správná odpověď: ${question.a}`;
                feedback.classList.remove('text-green-600');
                feedback.classList.add('text-red-600');
            }
            input.disabled = true;
            button.disabled = true;
            if (index === set.questions.length - 1) {
                setTimeout(() => {
                    addResultsSummary();
                }, 500);
            }
        }


        button.addEventListener('click', submitAnswer);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitAnswer();
        });
    });
}
//summary after completing a set
function addResultsSummary() {
    const content = document.getElementById("content");
    const session = currentPracticeSession;
    const correct = session.results.filter(r => r.correct).length;
    const total = session.results.length;

    const summaryDiv = document.createElement("div");
    summaryDiv.className = "questionBlock flex flex-col items-center justify-center min-h-screen text-center p-4 snap-start";
    summaryDiv.innerHTML = `
        <div class="w-full max-w-md">
            <h2 class="text-2xl font-bold mb-6">Výsledky</h2>
            <div class="text-4xl mb-4">${correct === total ? '🎉' : correct > total / 2 ? '👍' : '📚'}</div>
            <p class="text-xl mb-6">Správně: ${correct}/${total}</p>
            <div class="space-y-2 mb-6 text-left">
                ${session.results.map((result, i) => `
                    <div class="p-3 rounded ${result.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
                        <div class="font-semibold text-sm">${i + 1}. ${result.question}</div>
                        <div class="text-sm text-gray-600">
                            Tvoje odpověď: ${result.userAnswer || '(prázdné)'}
                            ${!result.correct ? `<br>Správně: ${result.correctAnswer}` : ''}
                        </div>
                    </div>
                `).join("")}
            </div>
            <button id="backToHome" class="bg-blue-500 text-white px-6 py-3 rounded-lg w-full">
                Zpět na hlavní stránku
            </button>
        </div>
    `;

    content.appendChild(summaryDiv);
    document.getElementById("backToHome").addEventListener("click", renderHome);
}

document.getElementById("tab-home").addEventListener("click", renderHome);
document.getElementById("tab-create").addEventListener("click", renderCreate);
document.getElementById("tab-account").addEventListener("click", renderAccount);

(async () => {
    await loadSets();
    renderHome();
})();