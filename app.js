const STORAGE_KEY = 'szczesliwy-los-v1';
const statuses = { active: 'Bierze udział', won: 'Już wygrał(a)', excluded: 'Nie bierze udziału' };
const normalize = name => name.trim().replace(/\s+/g, ' ');
const keyFor = name => normalize(name).toLocaleLowerCase('pl');
function validateState(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.people) || !Array.isArray(data.history)) throw new Error('Nieprawidłowy format kopii.');
  const seen = new Set();
  const people = data.people.map(p => {
    if (!p || typeof p.name !== 'string' || !normalize(p.name) || !Object.hasOwn(statuses, p.status)) throw new Error('Nieprawidłowy uczestnik.');
    const name = normalize(p.name), key = keyFor(name);
    if (seen.has(key)) throw new Error('Powtórzone osoby w kopii.');
    seen.add(key);
    return { name, status: p.status };
  });
  const history = data.history.map(h => {
    if (!h || typeof h.name !== 'string' || !seen.has(keyFor(h.name)) || typeof h.date !== 'string' || !Number.isFinite(Date.parse(h.date)) || !['draw', 'manual'].includes(h.source)) throw new Error('Nieprawidłowa historia.');
    if (!people.some(p => keyFor(p.name) === keyFor(h.name) && p.status === 'won')) throw new Error('Historia nie zgadza się ze statusem uczestnika.');
    return { name: normalize(h.name), date: h.date, source: h.source };
  });
  return { version: 1, people, history };
}
function randomIndex(length) {
  const range = 2 ** 32, limit = range - range % length, bytes = new Uint32Array(1);
  do { crypto.getRandomValues(bytes); } while (bytes[0] >= limit);
  return bytes[0] % length;
}
const $ = id => document.getElementById(id);
let state = { version: 1, people: window.INITIAL_PARTICIPANTS.map(p => ({ ...p })), history: [] };
let storageBlocked = false;
let savedSnapshot = null;
function message(text, error = false) { $('message').textContent = text; $('message').classList.toggle('error', error); }
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  savedSnapshot = saved;
  if (saved !== null) state = validateState(JSON.parse(saved));
  else { state = validateState(state); localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); savedSnapshot = JSON.stringify(state); }
} catch {
  storageBlocked = true;
  message('Nie można odczytać lub zapisać danych. Losowanie jest zablokowane, aby nie utracić historii. Zachowaj dotychczasową kopię i wczytaj ją w przeglądarce z dostępnym zapisem.', true);
}
function commit(next) {
  try {
    if (localStorage.getItem(STORAGE_KEY) !== savedSnapshot) {
      storageBlocked = true;
      message("Dane zmieniły się w innej karcie. Odśwież stronę przed kolejną zmianą.", true);
      render(); return false;
    }
    const validated = validateState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    savedSnapshot = JSON.stringify(validated);
    state = validated; storageBlocked = false; render(); return true;
  } catch {
    message('Nie udało się zapisać zmiany. Nie została zastosowana. Sprawdź dostępność pamięci przeglądarki i pobierz kopię danych.', true);
    render(); return false;
  }
}
function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function render() {
  const active = state.people.filter(p => p.status === 'active');
  $('eligible-count').textContent = active.length;
  $('won-count').textContent = state.people.filter(p => p.status === 'won').length;
  $('excluded-count').textContent = state.people.filter(p => p.status === 'excluded').length;
  $('total-count').textContent = `${state.people.length} osób`;
  $('draw').disabled = storageBlocked || !active.length;
  $('participants').replaceChildren();
  if (!state.people.length) $('participants').append(element('p', 'empty', 'Dodaj pierwszych uczestników poniżej.'));
  state.people.forEach((person, index) => {
    const row = element('div', `person ${person.status}`);
    row.append(element('span', 'avatar', person.name.split(' ').slice(0,2).map(s => Array.from(s)[0]).join('')));
    const info = element('div', 'person-info');
    info.append(element('div', 'person-name', person.name), element('div', 'person-status', statuses[person.status]));
    const select = element('select'); select.setAttribute('aria-label', `Status: ${person.name}`); select.disabled = storageBlocked;
    Object.entries(statuses).forEach(([value, label]) => { const option = element('option', '', label); option.value = value; select.append(option); });
    select.value = person.status;
    select.addEventListener('change', () => {
      if (person.status === 'won' && !window.confirm(`Przywrócić udział osoby ${person.name}? Jej wpis w historii zostanie usunięty.`)) { select.value = person.status; return; }
      const next = structuredClone(state); next.people[index].status = select.value;
      next.history = next.history.filter(h => keyFor(h.name) !== keyFor(person.name));
      if (select.value === 'won') next.history.unshift({ name: person.name, date: new Date().toISOString(), source: 'manual' });
      if (commit(next)) { clearWinner(); message('Status zapisany.'); }
    });
    row.append(info, select); $('participants').append(row);
  });
  $('history').replaceChildren();
  if (!state.history.length) $('history').append(element('li', 'empty', 'Tutaj pojawią się zwycięzcy. Osoby, które wygrały wcześniej, oznacz na liście jako „Już wygrał(a)”.'));
  state.history.forEach(h => {
    const row = element('li');
    row.append(element('span', '', h.name));
    const date = element('time', '', h.source === 'manual' ? 'Wcześniejsza wygrana' : new Date(h.date).toLocaleDateString('pl-PL'));
    date.dateTime = h.date; row.append(date); $('history').append(row);
  });
}
function clearWinner() { $('winner').textContent = 'Twój zwycięzca czeka na swój moment.'; $('result-note').textContent = 'Zwycięzca automatycznie wypada z kolejnych losowań.'; }
$('add').addEventListener('click', () => {
  if (storageBlocked) return;
  const next = structuredClone(state), seen = new Set(next.people.map(p => keyFor(p.name)));
  let count = 0;
  $('names').value.split(/\r?\n/).map(normalize).filter(Boolean).forEach(name => {
    if (!seen.has(keyFor(name))) { next.people.push({ name, status: 'active' }); seen.add(keyFor(name)); count++; }
  });
  if (!count) { message('Nie ma nowych osób do dodania.', true); return; }
  if (commit(next)) { $('names').value = ''; message(`Dodano osób: ${count}. Lista została zapisana.`); }
});
$('draw').addEventListener('click', () => {
  if (storageBlocked) return;
  const eligible = state.people.filter(p => p.status === 'active');
  if (!eligible.length) { message('Nie ma osób uprawnionych do losowania.', true); return; }
  if (!window.confirm(`Wylosować jednego zwycięzcę spośród ${eligible.length} osób? Wynik zostanie zapisany, a zwycięzca wyłączony z kolejnych losowań.`)) return;
  const person = eligible[randomIndex(eligible.length)], next = structuredClone(state);
  next.people.find(p => p.name === person.name).status = 'won';
  next.history.unshift({ name: person.name, date: new Date().toISOString(), source: 'draw' });
  if (commit(next)) {
    $('winner').textContent = person.name; $('result-note').textContent = 'Gratulacje! Wygrana zapisana. Ta osoba nie bierze udziału w kolejnych losowaniach.';
    message('Wynik zapisany. Pobierz kopię, aby zabezpieczyć historię.');
  }
});
$('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = element('a');
  link.href = url; link.download = `szczesliwy-los-${new Date().toISOString().slice(0,10)}.json`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('Pobrano kopię listy i historii.');
});
$('import').addEventListener('change', async () => {
  const file = $('import').files[0]; if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('Kopia jest zbyt duża (maksymalnie 5 MB).');
    const next = validateState(JSON.parse(await file.text()));
    if (window.confirm('Wczytanie kopii zastąpi obecną listę i historię. Kontynuować?') && commit(next)) { clearWinner(); message('Wczytano i zapisano listę oraz historię.'); }
  } catch { message('Nie można wczytać pliku. Wybierz poprawną kopię JSON pobraną z programu (maksymalnie 5 MB).', true); }
  finally { $('import').value = ''; }
});
render();

window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY || event.key === null) {
    storageBlocked = true; render();
    message("Dane zmieniły się w innej karcie. Odśwież stronę, aby odczytać aktualną listę.", true);
  }
});
