import { roles, scale, questions, maxScore, scoreAnswers } from './quiz-data.mjs';

const $ = id => document.getElementById(id);
const answers = Array(questions.length).fill(null);
$('quiz-progress').setAttribute('aria-valuemax', String(questions.length));
let currentQuestion = 0;
let activeScreen = 'intro';

function showScreen(screen) {
  activeScreen = screen;
  for (const name of ['intro', 'quiz', 'result']) $(name + '-screen').hidden = name !== screen;
  $('landing-nav').hidden = screen !== 'intro';
  $('header-start').textContent = screen === 'intro' ? 'Пройти квіз ↗' : 'До запитань ↗';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function focusTitle(id) { $(id).focus({ preventScroll: true }); }

function updateProgress() {
  const completed = answers.filter(value => value !== null).length;
  $('quiz-progress').setAttribute('aria-valuenow', String(completed));
  $('progress-fill').style.width = completed / questions.length * 100 + '%';
}

function renderQuestion() {
  const question = questions[currentQuestion];
  $('question-count').textContent = 'Запитання ' + (currentQuestion + 1) + ' з ' + questions.length;
  $('question-title').textContent = question.text;
  $('answers').querySelectorAll('label').forEach(label => label.remove());
  scale.forEach((labelText, value) => {
    const label = document.createElement('label');
    label.className = 'answer';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'frequency';
    input.value = String(value);
    input.checked = answers[currentQuestion] === value;
    const dot = document.createElement('span');
    dot.className = 'radio-dot';
    dot.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'answer-label';
    text.textContent = labelText;
    const key = document.createElement('span');
    key.className = 'key-hint';
    key.textContent = String(value + 1);
    key.setAttribute('aria-hidden', 'true');
    input.addEventListener('change', () => {
      answers[currentQuestion] = value;
      $('next').disabled = false;
      updateProgress();
    });
    label.append(input, dot, text, key);
    $('answers').append(label);
  });
  $('next').disabled = answers[currentQuestion] === null;
  $('previous').disabled = currentQuestion === 0;
  $('next-label').textContent = currentQuestion === questions.length - 1 ? 'Мій результат' : 'Далі';
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'instant' });
  focusTitle('question-title');
}

function startQuiz() {
  const unanswered = answers.indexOf(null);
  currentQuestion = unanswered === -1 ? 0 : unanswered;
  showScreen('quiz');
  renderQuestion();
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderRole(key, emphasize) {
  const role = roles[key];
  const article = element('article', 'result-role');
  const heading = element('div', 'result-role-heading');
  const symbol = element('span', 'symbol ' + role.color, role.symbol);
  symbol.setAttribute('aria-hidden', 'true');
  heading.append(symbol, element('h2', '', role.name));
  article.append(heading, element('p', '', emphasize ? role.reflection : role.description));
  if (emphasize) {
    article.append(element('h3', '', 'Можлива потреба за реакцією'), element('p', '', role.need));
    article.append(element('h3', '', 'Запитай себе'), element('p', 'reflection-question', role.question));
    article.append(element('h3', '', role.direction));
    const list = element('ul');
    role.steps.forEach(step => list.append(element('li', '', step)));
    article.append(list);
    const practice = element('div', 'practice');
    practice.append(element('div', 'practice-label', 'Фраза, яку можна спробувати'), element('p', '', role.sentence));
    article.append(practice);
  } else {
    article.append(element('h3', '', 'Маленький крок'), element('p', '', role.steps[0]));
  }
  return article;
}

function showResult() {
  let result;
  try { result = scoreAnswers(answers); } catch {
    currentQuestion = answers.indexOf(null);
    if (currentQuestion < 0) currentQuestion = 0;
    showScreen('quiz'); renderQuestion(); return;
  }
  showScreen('result');
  if (result.kind === 'low') {
    $('result-title').textContent = 'Без вираженої провідної ролі';
    $('result-badge').textContent = 'У ВИБРАНОМУ КОНТЕКСТІ';
    $('result-summary').textContent = 'Ти рідко впізнаєш себе в запропонованих реакціях. Це не оцінка якості твоїх стосунків: на відповіді впливають контекст, останні події та те, як ти зараз сприймаєш себе. Нижче — підказки для подальшого самоспостереження.';
  } else if (result.kind === 'mixed') {
    $('result-title').textContent = 'Кілька знайомих сценаріїв';
    $('result-badge').textContent = result.leaders.map(key => roles[key].name).join(' · ');
    $('result-summary').textContent = 'Бали за цими ролями однакові або близькі. Не потрібно обирати один ярлик: реакції можуть змінюватися залежно від ситуації. Подивися, у які моменти з’являється кожен сценарій і що допомагає тобі повернути відчуття вибору.';
  } else {
    const leading = roles[result.ranked[0]];
    $('result-title').textContent = 'Частіше відгукується роль «' + leading.name + '»';
    $('result-badge').textContent = 'СЦЕНАРІЙ, А НЕ ЯРЛИК';
    $('result-summary').textContent = 'У цьому проходженні ти частіше впізнаєш реакції, пов’язані з цією роллю. Це привід придивитися до звичної поведінки в конкретних ситуаціях. Твоя особистість набагато ширша за цей результат.';
  }
  $('score-rows').replaceChildren();
  result.ranked.forEach(key => {
    const row = element('div', 'score-row');
    row.append(element('span', 'score-label', roles[key].name));
    const track = element('div', 'score-track');
    track.setAttribute('aria-hidden', 'true');
    const fill = element('div', 'score-fill ' + roles[key].color);
    fill.style.width = result.scores[key] / maxScore * 100 + '%';
    track.append(fill);
    row.append(track, element('span', 'score-value', result.scores[key] + ' / ' + maxScore));
    $('score-rows').append(row);
  });
  $('result-details').replaceChildren();
  result.ranked.forEach(key => $('result-details').append(renderRole(key, result.kind !== 'low' && result.leaders.includes(key))));
  focusTitle('result-title');
}

function goHome() { showScreen('intro'); focusTitle('intro-title'); }
$('brand-home').addEventListener('click', goHome);
$('quiz-home').addEventListener('click', goHome);
$('header-start').addEventListener('click', startQuiz);
$('start-quiz').addEventListener('click', startQuiz);
$('previous').addEventListener('click', () => {
  if (currentQuestion === 0) return;
  currentQuestion -= 1;
  renderQuestion();
});
$('next').addEventListener('click', () => {
  if (answers[currentQuestion] === null) return;
  if (currentQuestion === questions.length - 1) { showResult(); return; }
  currentQuestion += 1;
  renderQuestion();
});
$('edit-answers').addEventListener('click', () => { currentQuestion = 0; showScreen('quiz'); renderQuestion(); });
$('restart').addEventListener('click', () => { answers.fill(null); startQuiz(); });
$('print-result').addEventListener('click', () => window.print());
document.addEventListener('keydown', event => {
  if (activeScreen !== 'quiz' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.matches('textarea,input:not([type="radio"]),select'))) return;
  const value = Number(event.key) - 1;
  if (!/^[1-3]$/.test(event.key)) return;
  event.preventDefault();
  const input = $('answers').querySelector('input[value="' + value + '"]');
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.focus();
});
