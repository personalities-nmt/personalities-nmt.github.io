// quiz.js

if (!Array.isArray(PERSONS)) {
    console.error("PERSONS не знайдено. Підключи data.js перед quiz.js");
}

const IMG_BASE = "./img/portraits/";

const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);
const pickRandom = (arr, n) => shuffle(arr).slice(0, n);

// Поп-ап
function showModal(message, ok) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "quiz-modal-overlay";

        const card = document.createElement("div");
        card.className = "quiz-modal-card";

        const title = document.createElement("div");
        title.className = "quiz-modal-title";
        title.textContent = message;

        const btn = document.createElement("button");
        btn.className = "quiz-modal-btn";
        btn.textContent = "Наступний тест";

        btn.onclick = () => {
            overlay.remove();
            resolve();
        };

        card.append(title, btn);
        overlay.append(card);
        document.body.append(overlay);
    });
}

function buildQuestions(mode) {
    const count = Math.min(10, PERSONS.length);
    return shuffle(PERSONS)
        .slice(0, count)
        .map((correct) => ({
            mode,
            correct,
            options: shuffle([
                correct,
                ...pickRandom(
                    PERSONS.filter((p) => p !== correct),
                    3
                ),
            ]),
        }));
}

function renderQuiz(id, mode, titleText) {
    const root = document.getElementById(id);
    if (!root) return;

    let score = 0;
    let i = 0;
    let questions = buildQuestions(mode);

    root.classList.add("quiz-section");
    root.innerHTML = `
    <div class="quiz-header">
     <div>
      <h2 class="quiz-title">${titleText}</h2>
      <div class="quiz-progress" id="${id}-progress">Питання 1/${questions.length}</div>
     </div>
     <div class="quiz-controls">
        <div class="quiz-score" id="${id}-score">0/${questions.length} балів</div>
      </div>
    </div>
    <div class="quiz-body"></div>
    <button class="quiz-restart">Почати спочатку</button>
  `;

    const scoreEl = root.querySelector(`#${id}-score`);
    const progressEl = root.querySelector(`#${id}-progress`);
    const body = root.querySelector(".quiz-body");
    const restart = root.querySelector(".quiz-restart");

    restart.onclick = () => {
        score = 0;
        i = 0;
        questions = buildQuestions(mode);
        scoreEl.textContent = `0/${questions.length}`;
        progressEl.textContent = `Питання 1/${questions.length}`;
        renderQuestion();
    };

    function renderQuestion() {
        body.innerHTML = "";

        if (i >= questions.length) {
            body.innerHTML = `
        <div class="quiz-finish">
          <p class="quiz-finish-title">Тест завершено!</p>
          <p>Ваш результат: ${score}/${questions.length}</p>
          <button class="quiz-restart">Почати спочатку</button>
        </div>
      `;
            body.querySelector("button").onclick = restart.onclick;
            return;
        }

        const q = questions[i];

        if (mode === "nameByPhoto") {
            const img = document.createElement("img");
            img.className = "quiz-photo";
            img.src = IMG_BASE + q.correct.portrait;
            img.onerror = () => (img.src = "cover.png");

            const opts = document.createElement("div");
            opts.className = "quiz-name-options";

            q.options.forEach((opt) => {
                const btn = document.createElement("button");
                btn.className = "quiz-name-option";
                btn.textContent = opt.name;
                btn.onclick = async () => {
                    const ok = opt === q.correct;
                    await showModal(ok ? "Правильно ✅" : "Неправильно ❌", ok);
                    if (ok) score++;
                    scoreEl.textContent = `${score}/${questions.length} балів`;
                    i++;
                    progressEl.textContent = `Питання ${i < questions.length ? i + 1 : i}/${questions.length}`;
                    renderQuestion();
                };
                opts.append(btn);
            });

            body.append(img, opts);
        } else {
            const nameBox = document.createElement("div");
            nameBox.className = "quiz-name";
            nameBox.style.cursor = "default";
            nameBox.textContent = q.correct.description;

            const grid = document.createElement("div");
            grid.className = "quiz-photo-grid";

            q.options.forEach((opt) => {
                const btn = document.createElement("button");
                btn.className = "quiz-photo-option";

                const img = document.createElement("img");
                img.src = IMG_BASE + opt.portrait;
                img.onerror = () => (img.src = "cover.png");

                btn.append(img);
                btn.onclick = async () => {
                    const ok = opt === q.correct;
                    await showModal(ok ? "Правильно ✅" : "Неправильно ❌", ok);
                    if (ok) score++;
                    scoreEl.textContent = `${score}/${questions.length} балів`;
                    i++;
                    progressEl.textContent = `Питання ${i < questions.length ? i + 1 : i}/${questions.length}`;
                    renderQuestion();
                };
                grid.append(btn);
            });

            body.append(nameBox, grid);
        }
    }

    renderQuestion();
}

document.addEventListener("DOMContentLoaded", () => {
    renderQuiz("quiz-name-by-photo", "nameByPhoto", "Хто зображений на портреті?");
    renderQuiz("quiz-photo-by-name", "photoByName", "Знайдіть портрет за описом");
});
