let sets = [];
let userSets = [];
let currentPracticeSession = null;
let userProfile = null;
let practiceMode = null; // 'typing' or 'flashcard'


async function loadSets() {
    try {
        const res = await fetch("default.json");
        sets = await res.json();
    } catch (e) {
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
                Pokračovat
            </button>
        </div>
    `;

    document.getElementById("startSet").addEventListener("click", () => {
        const idx = parseInt(document.getElementById("setSelect").value);
        renderModeSelection(allSets[idx]);
    });
}

function renderModeSelection(set) {
    const content = document.getElementById("content");

    content.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-full p-4 pb-20">
            <h2 class="text-xl font-bold mb-8 text-center">Jak se chceš učit?</h2>
            <div class="w-full max-w-md space-y-4">
                <button id="modeTyping" class="mode-btn w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-lg transition-all shadow-md">
                    <div class="text-2xl mb-2">⌨️</div>
                    <div class="font-semibold">Psaní odpovědi</div>
                    <div class="text-sm opacity-90">Napiš správnou odpověď na otázku</div>
                </button>
                <button id="modeFlashcard" class="mode-btn w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-lg transition-all shadow-md">
                    <div class="text-2xl mb-2">🃏</div>
                    <div class="font-semibold">Flashcards</div>
                    <div class="text-sm opacity-90">Procvičuj si otázky a odpovědi bez psaní</div>
                </button>
            </div>
        </div>
    `;

    document.getElementById("modeTyping").addEventListener("click", () => {
        practiceMode = 'typing';
        startPractice(set);
    });

    document.getElementById("modeFlashcard").addEventListener("click", () => {
        practiceMode = 'flashcard';
        startFlashcardMode(set);
    });
}

function renderCreate() {
    setActiveTab('tab-create');
    const content = document.getElementById("content");

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

function renderAccount() {
    setActiveTab('tab-account');
    const content = document.getElementById("content");

    if (!userProfile) {
        renderProfileSetup();
        return;
    }

    const profilePicture = userProfile.picture || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNlNWU3ZWIiLz4KPGF0aCBkPSJNNDAgMjBjNS41MjMgMCAxMCA0LjQ3NyAxMCAxMHMtNC40NzcgMTAtMTAgMTAtMTAtNC40NzctMTAtMTAgNC40NzctMTAgMTAtMTB6bS04IDMwYzAtOC44MzcgNy4xNjMtMTYgMTYtMTYgcTE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2LTE2LTcuMTYzLTE2LTE2eiIgZmlsbD0iIzZiNzI4MCIvPgo8L3N2Zz4K';

    content.innerHTML = `
        <div class="p-4 min-h-full pb-20">
            <div class="text-center mb-6">
                <img src="${profilePicture}" 
                     alt="Profile" 
                     class="profile-picture mx-auto mb-4"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNlNWU3ZWIiLz4KPGF0aCBkPSJNNDAgMjBjNS41MjMgMCAxMCA0LjQ3NyAxMCAxMHMtNC40NzcgMTAtMTAgMTAtMTAtNC40NzctMTAtMTAgNC40NzctMTAgMTAtMTB6bS04IDMwYzAtOC44MzcgNy4xNjMtMTYgMTYtMTYgcTE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2LTE2LTcuMTYzLTE2LTE2eiIgZmlsbD0iIzZiNzI4MCIvPgo8L3N2Zz4K'">
                <h2 class="text-xl font-bold">${userProfile.name || 'Uživatel'}</h2>
                <button id="editProfileBtn" class="text-blue-500 text-sm mt-2 hover:text-blue-600 transition-colors touch-manipulation">
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
                                    <h4 class="font-semibold text-base">${set.name || 'Bez názvu'}</h4>
                                    <p class="text-sm text-gray-500">${(set.questions && set.questions.length) || 0} otázek</p>
                                </div>
                                <div class="flex gap-2">
                                    <button class="edit-set bg-blue-100 hover:bg-blue-200 text-blue-600 px-3 py-2 rounded text-sm transition-colors flex-1 sm:flex-none touch-manipulation" 
                                            data-index="${i}"
                                            type="button">
                                        Upravit
                                    </button>
                                    <button class="delete-set bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded text-sm transition-colors flex-1 sm:flex-none touch-manipulation" 
                                            data-index="${i}"
                                            type="button">
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

    try {
        const editProfileBtn = document.getElementById("editProfileBtn");
        if (editProfileBtn) {
            editProfileBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                renderProfileSetup();
            });
        }

        const editButtons = content.querySelectorAll('.edit-set');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const index = parseInt(e.target.dataset.index);
                    if (index >= 0 && index < userSets.length) {
                        editUserSet(index);
                    }
                } catch (error) {
                    console.error('Error editing set:', error);
                    alert('Chyba při úpravě setu');
                }
            });
        });

        const deleteButtons = content.querySelectorAll('.delete-set');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const index = parseInt(e.target.dataset.index);
                    if (index >= 0 && index < userSets.length) {
                        if (confirm('Opravdu chceš smazat tento set?')) {
                            userSets.splice(index, 1);
                            saveUserSets();
                            renderAccount();
                        }
                    }
                } catch (error) {
                    console.error('Error deleting set:', error);
                    alert('Chyba při mazání setu');
                }
            });
        });

    } catch (error) {
        console.error('Error setting up account page:', error);
        content.innerHTML = `
            <div class="p-4 text-center">
                <h2 class="text-xl font-bold mb-4">Chyba</h2>
                <p class="text-red-600 mb-4">Nepodařilo se načíst účet. Zkus to znovu.</p>
                <button onclick="renderHome()" class="bg-blue-500 text-white px-4 py-2 rounded">
                    Zpět na hlavní stránku
                </button>
            </div>
        `;
    }
}

function renderProfileSetup() {
    const content = document.getElementById("content");
    const profilePicture = (userProfile?.picture) || '';

    content.innerHTML = `
        <div class="p-4 min-h-full pb-20 flex flex-col justify-center">
            <div class="max-w-md mx-auto w-full">
                <h2 class="text-xl font-bold mb-6 text-center">${userProfile ? 'Upravit profil' : 'Vytvoř si profil'}</h2>
                
                <div class="text-center mb-6">
                    <img src="${profilePicture || 'https://i.pinimg.com/474x/65/1c/6d/651c6da502353948bdc929f02da2b8e0.jpg'}" 
                         alt="Profile" 
                         class="profile-picture mx-auto mb-4"
                         id="profilePreview"
                         style="display: ${profilePicture ? 'block' : 'none'}">
                    ${!profilePicture ? '<div class="profile-picture mx-auto mb-4 bg-gray-300 flex items-center justify-center text-gray-600 text-2xl">👤</div>' : ''}
                </div>
                
                <div class="space-y-4">
                    <input type="text" 
                           id="profileName" 
                           placeholder="Tvoje jméno" 
                           value="${userProfile?.name || ''}"
                           class="border rounded-lg p-3 w-full bg-white text-base touch-manipulation">
                    <input type="url" 
                           id="profilePicture" 
                           placeholder="URL profilové fotky (volitelné)" 
                           value="${userProfile?.picture || ''}"
                           class="border rounded-lg p-3 w-full bg-white text-base touch-manipulation">
                    <div class="flex flex-col gap-2">
                        <button id="saveProfileBtn" 
                                type="button"
                                class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors touch-manipulation">
                            ${userProfile ? 'Uložit změny' : 'Vytvořit profil'}
                        </button>
                        ${userProfile ? `
                            <button id="cancelProfileBtn" 
                                    type="button"
                                    class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors touch-manipulation">
                                Zrušit
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    try {
        const profilePictureInput = document.getElementById("profilePicture");
        const profilePreview = document.getElementById("profilePreview");

        if (profilePictureInput && profilePreview) {
            profilePictureInput.addEventListener("input", (e) => {
                const url = e.target.value.trim();
                if (url) {
                    profilePreview.src = url;
                } else {
                    profilePreview.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNlNWU3ZWIiLz4KPGNpcmNsZSBjeD0iNDAiIGN5PSIzMCIgcj0iOCIgZmlsbD0iIzZiNzI4MCIvPjxwYXRoIGQ9Ik0yNiA1NGMwLTcuNzMyIDYuMjY4LTE0IDE0LTE0czE0IDYuMjY4IDE0IDE0djJIMjZ2LTJ6IiBmaWxsPSIjNmI3MjgwIi8+PC9zdmc+';
                }
            });
        }

        const saveBtn = document.getElementById("saveProfileBtn");
        if (saveBtn) {
            saveBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();

                const nameInput = document.getElementById("profileName");
                const pictureInput = document.getElementById("profilePicture");

                if (!nameInput) {
                    alert("Chyba: pole pro jméno nebylo nalezeno");
                    return;
                }

                const name = nameInput.value.trim();
                if (!name) {
                    alert("Zadej své jméno!");
                    return;
                }

                userProfile = {
                    name: name,
                    picture: pictureInput ? pictureInput.value.trim() : ''
                };

                try {
                    saveUserProfile();
                    alert("Profil byl uložen!");
                    renderAccount();
                } catch (error) {
                    console.error('Error saving profile:', error);
                    alert("Chyba při ukládání profilu");
                }
            });
        }

        const cancelBtn = document.getElementById("cancelProfileBtn");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                renderAccount();
            });
        }

    } catch (error) {
        console.error('Error setting up profile page:', error);
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

function startFlashcardMode(set) {
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
        const cardDiv = document.createElement("div");
        cardDiv.className = "questionBlock flex flex-col items-center justify-center min-h-screen text-center p-4 snap-start";
        cardDiv.id = `flashcard-${index}`;
        cardDiv.innerHTML = `
    <div class="w-full max-w-md">
        <div class="mb-4">
            <span class="text-sm text-gray-500">Karta ${index + 1} z ${set.questions.length}</span>
        </div>
        <div class="flashcard-wrapper h-80 cursor-pointer" style="perspective: 1000px;">
            <div class="flashcard bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl shadow-lg p-8 h-full flex flex-col items-center justify-center transition-transform duration-500" style="transform-style: preserve-3d; transform: rotateY(0deg);">
                <div class="flashcard-front flex flex-col items-center justify-center w-full h-full" style="backface-visibility: hidden;">
                    <p class="text-gray-100 text-sm mb-4">OTÁZKA</p>
                    <h3 class="text-2xl font-bold break-words">${question.q}</h3>
                    <p class="text-gray-100 text-xs mt-8">Klikni pro odpověď</p>
                </div>
                <div class="flashcard-back flex flex-col items-center justify-center w-full h-full absolute inset-0 p-8 rounded-xl" style="transform: rotateY(180deg); backface-visibility: hidden; background: linear-gradient(to bottom right, #60a5fa, #3b82f6);">
                    <p class="text-gray-100 text-sm mb-4">ODPOVĚĎ</p>
                    <h3 class="text-2xl font-bold break-words">${question.a}</h3>
                </div>
            </div>
        </div>
        <div class="mt-8 space-y-3">
            <div class="flex gap-2">
                <button class="mark-correct flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition-colors">
                    ✅ Věděl/a jsem
                </button>
                <button class="mark-incorrect flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg transition-colors">
                    ❌ Nevěděl/a jsem
                </button>
            </div>
        </div>
    </div>
`;

        content.appendChild(cardDiv);

        const flashcard = cardDiv.querySelector('.flashcard');
        const wrapper = cardDiv.querySelector('.flashcard-wrapper');
        let isFlipped = false;

        wrapper.addEventListener('click', () => {
            isFlipped = !isFlipped;
            flashcard.style.transform = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
        });

        const markCorrectBtn = cardDiv.querySelector('.mark-correct');
        const markIncorrectBtn = cardDiv.querySelector('.mark-incorrect');

        function markAnswer(isCorrect) {
            currentPracticeSession.results.push({
                question: question.q,
                correctAnswer: question.a,
                correct: isCorrect,
                time: Date.now() - currentPracticeSession.startTime
            });

            flashcard.style.opacity = '0.5';
            markCorrectBtn.disabled = true;
            markIncorrectBtn.disabled = true;
            markCorrectBtn.classList.add('opacity-50', 'cursor-not-allowed');
            markIncorrectBtn.classList.add('opacity-50', 'cursor-not-allowed');

            if (index === set.questions.length - 1) {
                setTimeout(() => {
                    addFlashcardSummary();
                }, 500);
            }
        }

        markCorrectBtn.addEventListener('click', () => markAnswer(true));
        markIncorrectBtn.addEventListener('click', () => markAnswer(false));
    });
}

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
                            Tvoje odpověď: <span class="font-medium">${result.correct ? '✅ Správně' : '❌ Špatně'}</span>
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
        practiceMode === 'flashcard' ? startFlashcardMode(currentPracticeSession.set) : startPractice(currentPracticeSession.set);
    });
    summaryDiv.scrollIntoView({ behavior: 'smooth' });
}

function addFlashcardSummary() {
    addResultsSummary();
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