(function () {
  "use strict";

  var POINTS_PER_CORRECT = 10;
  var LETTERS = ["A", "B", "C", "D"];
  var TYPE_LABELS = {
    reading: "漢字の よみ",
    writing: "漢字を えらぶ",
    meaning: "いみ"
  };

  // ---- 要素 ----
  var $ = function (id) { return document.getElementById(id); };
  var screens = {
    start: $("screen-start"),
    quiz: $("screen-quiz"),
    result: $("screen-result")
  };
  var el = {
    score: $("hud-score"),
    number: $("hud-number"),
    total: $("hud-total"),
    streak: $("hud-streak"),
    fire: $("hud-fire"),
    progress: document.querySelector(".progress"),
    bar: $("progress-bar"),
    type: $("q-type"),
    text: $("q-text"),
    choices: $("choices"),
    feedback: $("feedback"),
    next: $("btn-next"),
    resScore: $("res-score"),
    resCorrect: $("res-correct"),
    resMessage: $("res-message")
  };

  // ---- 状態 ----
  var state = {
    index: 0,
    score: 0,
    streak: 0,
    correct: 0,
    answered: false
  };

  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].hidden = (key !== name);
    });
  }

  // 選択肢の「表示順」だけをシャッフルする（内容は変更しない）
  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function updateHud() {
    el.score.textContent = state.score;
    el.streak.textContent = state.streak;
    el.fire.textContent = state.streak >= 2 ? "🔥" : "";
    el.number.textContent = state.index + 1;
    el.total.textContent = quizData.length;
    el.bar.style.width = (state.index / quizData.length * 100) + "%";
    el.progress.setAttribute("aria-valuenow", String(state.index + 1));
    el.progress.setAttribute("aria-valuemax", String(quizData.length));
  }

  function renderQuestion() {
    var q = quizData[state.index];
    state.answered = false;

    el.type.textContent = TYPE_LABELS[q.type] || "もんだい";
    el.text.textContent = q.question;
    el.feedback.textContent = "";
    el.feedback.className = "feedback";
    el.next.disabled = true;
    el.choices.textContent = "";

    shuffled(q.choices).forEach(function (choice, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice c" + i;
      btn.dataset.value = choice;

      var badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = LETTERS[i];

      var label = document.createElement("span");
      label.className = "choice-text";
      label.textContent = choice;

      var mark = document.createElement("span");
      mark.className = "mark";
      mark.setAttribute("aria-hidden", "true");

      btn.appendChild(badge);
      btn.appendChild(label);
      btn.appendChild(mark);
      btn.addEventListener("click", function () { handleAnswer(btn); });
      el.choices.appendChild(btn);
    });

    updateHud();
  }

  function handleAnswer(clickedBtn) {
    if (state.answered) return;
    state.answered = true;

    var q = quizData[state.index];
    var picked = clickedBtn.dataset.value;
    var isCorrect = (picked === q.answer);

    if (isCorrect) {
      state.score += POINTS_PER_CORRECT;
      state.streak += 1;
      state.correct += 1;
    } else {
      state.streak = 0;
    }

    // ボタンの見た目を更新
    Array.prototype.forEach.call(el.choices.children, function (btn) {
      btn.disabled = true;
      if (btn.dataset.value === q.answer) {
        btn.classList.add("is-correct");
        btn.lastChild.textContent = "○";
      } else if (btn === clickedBtn) {
        btn.classList.add("is-wrong");
        btn.lastChild.textContent = "×";
      } else {
        btn.classList.add("is-dim");
      }
    });

    // フィードバック
    el.feedback.textContent = "";
    if (isCorrect) {
      el.feedback.className = "feedback show good";
      el.feedback.textContent = "せいかい！ Correct!  +" + POINTS_PER_CORRECT;
    } else {
      el.feedback.className = "feedback show bad";
      var head = document.createElement("span");
      head.textContent = "ざんねん… Incorrect.";
      var ans = document.createElement("strong");
      ans.textContent = "ただしい こたえ： " + q.answer;
      el.feedback.appendChild(head);
      el.feedback.appendChild(ans);
    }

    updateHud();
    el.next.disabled = false;
    el.next.focus();
  }

  function goNext() {
    if (!state.answered) return;
    state.index += 1;
    if (state.index >= quizData.length) {
      showResult();
    } else {
      renderQuestion();
    }
  }

  function messageFor(score) {
    if (score === 100) return "パーフェクト！ すばらしい！";
    if (score >= 70) return "すごい！ よくできました！";
    if (score >= 40) return "いいちょうし！ もうすこし！";
    return "もういちど ちょうせん しましょう！";
  }

  function showResult() {
    el.resScore.textContent = state.score;
    el.resCorrect.textContent = state.correct;
    el.resMessage.textContent = messageFor(state.score);
    showScreen("result");
    $("btn-again").focus();
  }

  function startQuiz() {
    state.index = 0;
    state.score = 0;
    state.streak = 0;
    state.correct = 0;
    state.answered = false;
    showScreen("quiz");
    renderQuestion();
  }

  // ---- イベント ----
  $("btn-start").addEventListener("click", startQuiz);
  $("btn-again").addEventListener("click", startQuiz);
  el.next.addEventListener("click", goNext);

  // キーボード：1〜4 で選択、Enter で NEXT
  document.addEventListener("keydown", function (e) {
    if (screens.quiz.hidden) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !state.answered) {
      var btn = el.choices.children[n - 1];
      if (btn) handleAnswer(btn);
    }
  });
})();
