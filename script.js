
let sets = [];
let userSets = [];
let currentPracticeSession = null;
let userProfile = null;


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

    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        userProfile = JSON.parse(savedProfile);
    }

}
// new sets are saved to localstorage
function saveUserSets() {
    localStorage.setItem('userSets', JSON.stringify(userSets));
}
function saveUserProfile() {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
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
                <div class="flex flex-col items-center justify-center min-h-full p-4 pb-20">
                    ${userProfile ? `
                        <div class="mb-6 text-center">
                            <img src="${userProfile.picture || 'https://i.pinimg.com/474x/65/1c/6d/651c6da502353948bdc929f02da2b8e0.jpg?nii=t'}" 
     alt="Profile" class="profile-picture mx-auto mb-4">
                            <h2 class="text-lg font-semibold">Ahoj, ${userProfile.name}!</h2>
                        </div>
                    ` : ''}
                    
                    <h2 class="text-xl font-bold mb-6 text-center">Vyber set k procvičování</h2>
                    <select id="setSelect" class="border rounded-lg p-3 w-full max-w-md mb-4 bg-white text-base">
                        ${allSets.map((s, i) => `<option value="${i}">${s.name}</option>`).join("")}
                    </select>
                    <button id="startSet" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg w-full max-w-md transition-colors">
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
    content.innerHTML = `
                <div class="p-4 min-h-full pb-20">
                    <h2 class="text-xl font-bold mb-6 text-center">Vytvoř nový set</h2>
                    <div id="createSetForm">
                        <input type="text" id="setName" placeholder="Název setu" 
                               class="border rounded-lg p-3 w-full mb-4 bg-white text-base">
                        <button id="createSetBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg w-full transition-colors">
                            Pokračovat
                        </button>
                    </div>
                    <div id="questionCreator" style="display: none;">
                        <div id="questionTabs" class="flex flex-wrap gap-2 mb-4 border-b pb-2"></div>
                        <div class="space-y-4">
                            <input type="text" id="questionInput" placeholder="Zadej otázku" 
                                   class="border rounded-lg p-3 w-full bg-white text-base">
                            <input type="text" id="answerInput" placeholder="Zadej odpověď" 
                                   class="border rounded-lg p-3 w-full bg-white text-base">
                            <div class="flex flex-col sm:flex-row gap-2">
                                <button id="addQuestionBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg flex-1 transition-colors">
                                    <span id="addQuestionText">Přidat otázku</span>
                                </button>
                                <button id="saveSetBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg flex-1 transition-colors">
                                    Uložit set
                                </button>
                                <button id="cancelEditBtn" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg flex-1 transition-colors" style="display: none;">
                                    Zrušit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

    let currentSet = { name: "", questions: [] };
    let editingQuestion = -1;
    let isEditingSet = false;

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
            document.getElementById("addQuestionText").textContent = "Upravit otázku";
        } else {
            document.getElementById("questionInput").value = "";
            document.getElementById("answerInput").value = "";
            document.getElementById("addQuestionText").textContent = "Přidat otázku";
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
        document.getElementById("addQuestionText").textContent = "Přidat otázku";
        updateQuestionTabs();
    });

    document.getElementById("saveSetBtn").addEventListener("click", () => {
        if (currentSet.questions.length === 0) {
            alert("Přidej alespoň jednu otázku!");
            return;
        }
        if (isEditingSet) {
            const setIndex = window.editingSetIndex;
            userSets[setIndex] = currentSet;
        } else {
            userSets.push(currentSet);
        }
        saveUserSets();
        alert(`Set "${currentSet.name}" byl uložen!`);
        renderHome();
    });
    if (window.editingSetIndex !== undefined) {
        const setToEdit = userSets[window.editingSetIndex];
        currentSet = JSON.parse(JSON.stringify(setToEdit));
        isEditingSet = true;

        document.getElementById("setName").value = currentSet.name;
        document.getElementById("createSetForm").style.display = "none";
        document.getElementById("questionCreator").style.display = "block";
        document.getElementById("cancelEditBtn").style.display = "block";

        document.getElementById("cancelEditBtn").addEventListener("click", () => {
            delete window.editingSetIndex;
            renderAccount();
        });

        updateQuestionTabs();
        delete window.editingSetIndex;
    }
}
//user account showing user created sets, user can add pfp and their name (before creating profile it shows some gibberish tho)
function renderAccount() {
    setActiveTab('tab-account');
    const content = document.getElementById("content");
    if (!userProfile) {
        renderProfileSetup();
        return;
    }

    content.innerHTML = `
                <div class="p-4 min-h-full pb-20">
                    <div class="text-center mb-6">
                        <img src="${userProfile.picture || 'https://i.pinimg.com/474x/65/1c/6d/651c6da502353948bdc929f02da2b8e0.jpg?nii=t'}" 
     alt="Profile" class="profile-picture mx-auto mb-4">
                        <h2 class="text-xl font-bold">${userProfile.name}</h2>
                        <button id="editProfileBtn" class="text-blue-500 text-sm mt-2 hover:text-blue-600 transition-colors">
                            Upravit profil
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold">Tvoje sety:</h3>
                        ${userSets.length === 0 ?
            '<div class="text-gray-500 text-center py-8 bg-white rounded-lg border">Zatím nemáš žádné sety</div>' :
            userSets.map((set, i) => `
                            <div class="bg-white p-4 rounded-lg border shadow-sm">
                                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-base">${set.name}</h4>
                                        <p class="text-sm text-gray-500">${set.questions.length} otázek</p>
                                    </div>
                                    <div class="flex gap-2">
                                        <button class="edit-set bg-blue-100 hover:bg-blue-200 text-blue-600 px-3 py-2 rounded text-sm transition-colors flex-1 sm:flex-none" data-index="${i}">
                                            Upravit
                                        </button>
                                        <button class="delete-set bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded text-sm transition-colors flex-1 sm:flex-none" data-index="${i}">
                                            Smazat
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join("")
        }
                    </div>
                </div>
            `;
    document.getElementById("editProfileBtn").addEventListener("click", () => {
        renderProfileSetup();
    });

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
function renderProfileSetup() {
    const content = document.getElementById("content");

    content.innerHTML = `
                <div class="p-4 min-h-full pb-20 flex flex-col justify-center">
                    <div class="max-w-md mx-auto w-full">
                        <h2 class="text-xl font-bold mb-6 text-center">${userProfile ? 'Upravit profil' : 'Vytvoř si profil'}</h2>
                        
                        <div class="text-center mb-6">
                            <img src="${userProfile.picture || 'https://i.pinimg.com/474x/65/1c/6d/651c6da502353948bdc929f02da2b8e0.jpg?nii=t'}" 
     alt="Profile" class="profile-picture mx-auto mb-4">
                        </div>
                        
                        <div class="space-y-4">
                            <input type="text" id="profileName" placeholder="Tvoje jméno" value="${userProfile?.name || ''}"
                                   class="border rounded-lg p-3 w-full bg-white text-base">
                            <input type="url" id="profilePicture" placeholder="URL profilové fotky (volitelné)" value="${userProfile?.picture || ''}"
                                   class="border rounded-lg p-3 w-full bg-white text-base">
                            <div class="flex flex-col gap-2">
                                <button id="saveProfileBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors">
                                    ${userProfile ? 'Uložit změny' : 'Vytvořit profil'}
                                </button>
                                ${userProfile ? `
                                    <button id="cancelProfileBtn" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors">
                                        Zrušit
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;

    const profilePictureInput = document.getElementById("profilePicture");
    const profilePreview = document.getElementById("profilePreview");

    profilePictureInput.addEventListener("input", (e) => {
        const url = e.target.value.trim();
        if (url) {
            profilePreview.src = url;
        } else {
            profilePreview = 'https://via.placeholder.com/80x80/e5e7eb/6b7280?text=User';
        }
    });

    document.getElementById("saveProfileBtn").addEventListener("click", () => {
        const name = document.getElementById("profileName").value.trim();
        if (!name) {
            alert("Zadej své jméno!");
            return;
        }

        userProfile = {
            name: name,
            picture: document.getElementById("profilePicture").value.trim()
        };

        saveUserProfile();
        alert("Profil byl uložen!");
        renderAccount();
    });

    if (userProfile && document.getElementById("cancelProfileBtn")) {
        document.getElementById("cancelProfileBtn").addEventListener("click", () => {
            renderAccount();
        });
    }
}
function editUserSet(index) {
    window.editingSetIndex = index;
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
    content.scrollTo(0, 0);

    set.questions.forEach((question, index) => {
        const questionDiv = document.createElement("div");
        questionDiv.className = "questionBlock flex flex-col items-center justify-center min-h-screen text-center p-4 snap-start";
        questionDiv.id = `question-${index}`;
        questionDiv.innerHTML = `
                    <div class="w-full max-w-md">
                        <div class="mb-4">
                            <span class="text-sm text-gray-500">Otázka ${index + 1} z ${set.questions.length}</span>
                        </div>
                        <h2 class="text-xl font-bold mb-6 px-2">${question.q}</h2>
                        <input type="text" placeholder="Tvoje odpověď" 
                               class="answer-input border px-4 py-3 rounded-lg w-full mb-4 text-center text-base"/>
                        <button class="submit-answer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg w-full transition-colors">
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
            button.classList.add('opacity-50', 'cursor-not-allowed');
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
    const percentage = Math.round((correct / total) * 100);


    const summaryDiv = document.createElement("div");
    summaryDiv.className = "questionBlock flex flex-col items-center justify-center min-h-screen text-center p-4 snap-start";
    summaryDiv.innerHTML = `
                <div class="w-full max-w-md">
                    <h2 class="text-2xl font-bold mb-6">Výsledky</h2>
                    <div class="text-6xl mb-4">${correct === total ? '🎉' : correct > total / 2 ? '👍' : '📚'}</div>
                    <p class="text-xl mb-2">Správně: ${correct}/${total}</p>
                    <p class="text-lg text-gray-600 mb-6">${percentage}% úspěšnost</p>
                    <div class="space-y-2 mb-6 text-left max-h-60 overflow-y-auto">
                        ${session.results.map((result, i) => `
                            <div class="p-3 rounded-lg text-sm ${result.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
                                <div class="font-semibold mb-1">${i + 1}. ${result.question}</div>
                                <div class="text-gray-600">
                                    Tvoje odpověď: <span class="font-medium">${result.userAnswer || '(prázdné)'}</span>
                                    ${!result.correct ? `<br>Správně: <span class="font-medium text-green-600">${result.correctAnswer}</span>` : ''}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                    <div class="flex flex-col gap-2">
                        <button id="backToHome" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg w-full transition-colors">
                            Zpět na hlavní stránku
                        </button>
                        <button id="retrySet" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg w-full transition-colors">
                            Zkusit znovu
                        </button>
                    </div>
                </div>
            `;

    content.appendChild(summaryDiv);
    document.getElementById("backToHome").addEventListener("click", renderHome);
    document.getElementById("retrySet").addEventListener("click", () => {
        startPractice(currentPracticeSession.set);
    });
    summaryDiv.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById("tab-home").addEventListener("click", renderHome);
document.getElementById("tab-create").addEventListener("click", renderCreate);
document.getElementById("tab-account").addEventListener("click", renderAccount);

(async () => {
    await loadSets();
    renderHome();
})();
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

window.addEventListener('resize', () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});

const vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);