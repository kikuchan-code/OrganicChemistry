// =========================================================
// クイズ共通ロジック（虫食い入力・採点・正解表示）
//
// 使い方：各ページで Quiz.init(buildBlanks) を呼ぶ。
//   buildBlanks … 「虫食いにする」押下時に穴を作る関数。
//                 穴にするセルは Quiz.makeInput(cell) で入力欄に差し替える。
// 必要な要素ID：blank-button / check-button / show-answers-button / score-result
// =========================================================

const Quiz = (() => {
    let answerShown = false;

    const el = id => document.getElementById(id);

    // 全角→半角などを揃え、前後の空白を除く（大文字小文字は区別する：Cl と CL は別物）
    const normalize = s => String(s).normalize('NFKC').trim();

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 数値入力を範囲内に丸め、入力欄にも反映して返す
    function readInt(id, min, max, fallback) {
        const input = el(id);
        let n = parseInt(input.value, 10);
        if (Number.isNaN(n)) n = fallback;
        n = Math.min(Math.max(n, min), max);
        input.value = n;
        return n;
    }

    const inputs = () => document.querySelectorAll('input.blank-input');

    function setScore(text) {
        el('score-result').textContent = text;
    }

    function resetState() {
        answerShown = false;
        el('show-answers-button').disabled = false;
        setScore('');
    }

    // cell の中身を入力欄に差し替える（正解は元のテキスト）
    function makeInput(cell) {
        const answer = cell.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'blank-input';
        input.dataset.answer = answer;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('autocorrect', 'off');

        cell.textContent = '';
        cell.appendChild(input);   // 先にDOMへ入れる（フォントを正しく測るため）

        function textWidth(text) {
            const probe = document.createElement('span');
            probe.style.cssText =
                'visibility:hidden;position:absolute;white-space:pre;' +
                'font:' + getComputedStyle(input).font;
            probe.textContent = text || ' ';
            document.body.appendChild(probe);
            const w = probe.offsetWidth;
            probe.remove();
            return w;
        }

        // 正解と入力のどちらか長い方に合わせる
        input.resizeInput = () => {
            const w = Math.max(textWidth(input.value), textWidth(answer));
            input.style.width = `${w + 40}px`;
        };

        input.addEventListener('input', () => {
            input.resizeInput();
            input.classList.remove('correct', 'wrong', 'show-answer');
        });

        input.resizeInput();
        return input;
    }

    function check() {
        if (answerShown) {
            alert('正解表示後は採点できません。');
            return;
        }

        const list = inputs();
        if (list.length === 0) {
            setScore('先に「虫食いにする」を押してください。');
            return;
        }

        let correct = 0;

        list.forEach(input => {
            input.classList.remove('correct', 'wrong', 'show-answer');

            if (normalize(input.value) === normalize(input.dataset.answer)) {
                input.classList.add('correct');
                correct++;
            } else {
                input.classList.add('wrong');
            }
        });

        const rate = Math.round(correct / list.length * 100);
        setScore(`${list.length}問中 ${correct}問正解（正答率 ${rate}%）`);
    }

    function show() {
        const list = inputs();
        if (list.length === 0) {
            setScore('先に「虫食いにする」を押してください。');
            return;
        }

        answerShown = true;

        list.forEach(input => {
            if (normalize(input.value) !== normalize(input.dataset.answer)) {
                input.value = input.dataset.answer;
                input.resizeInput();
                input.classList.remove('correct', 'wrong');
                input.classList.add('show-answer');
            }
            input.readOnly = true;
        });

        el('show-answers-button').disabled = true;
    }

    function init(buildBlanks) {
        el('blank-button').addEventListener('click', () => {
            resetState();
            buildBlanks();
        });
        el('check-button').addEventListener('click', check);
        el('show-answers-button').addEventListener('click', show);
    }

    return { init, makeInput, shuffle, readInt };
})();
