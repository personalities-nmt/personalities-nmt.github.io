// === Налаштування шляхів до портретів ===
const PORTRAITS_BASE = "./img/portraits/"; // якщо зображення в /portraits, зміни на "./portraits/"

// === Утиліти ===
const normalize = (s) =>
    (s || "")
        .toString()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

const parseDate = (s) => {
    // очікуємо DD.MM.YYYY; повертаємо Date або null
    if (!s) return null;
    const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!m) return null;
    const [, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d.getTime()) ? null : d;
};

// === Сортування ===
const comparators = {
    name_asc: (a, b) => normalize(a.name).localeCompare(normalize(b.name), "uk"),
    name_desc: (a, b) => normalize(b.name).localeCompare(normalize(a.name), "uk"),
    born_asc: (a, b) => (parseDate(a.born)?.getTime() ?? Infinity) - (parseDate(b.born)?.getTime() ?? Infinity),
    born_desc: (a, b) => (parseDate(b.born)?.getTime() ?? -Infinity) - (parseDate(a.born)?.getTime() ?? -Infinity),
    died_asc: (a, b) => (parseDate(a.died)?.getTime() ?? Infinity) - (parseDate(b.died)?.getTime() ?? Infinity),
    died_desc: (a, b) => (parseDate(b.died)?.getTime() ?? -Infinity) - (parseDate(a.died)?.getTime() ?? -Infinity),
};

// === Рендер картки ===
function createCard(p) {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "card__img";
    img.alt = `Портрет: ${p.name}`;
    img.loading = "lazy";
    img.src = PORTRAITS_BASE + p.portrait;
    img.onerror = () => {
        img.src = "cover.png";
    }; // запасне зображення

    const body = document.createElement("div");
    body.className = "card__body";

    const title = document.createElement("h3");
    title.className = "card__title";
    title.textContent = p.name;

    const meta = document.createElement("div");
    meta.className = "card__meta";
    const born = p.born ? `${p.born}` : "";
    const died = p.died ? ` — ${p.died}` : "";
    meta.textContent = [born, died].join("");

    const descr = document.createElement("p");
    descr.textContent = p.description || "";

    const kwWrap = document.createElement("div");
    kwWrap.className = "card__keywords";
    (p.keywords || []).forEach((k) => {
        const t = document.createElement("span");
        t.className = "card__tag";
        t.textContent = k;
        kwWrap.appendChild(t);
    });

    body.append(title, meta, descr, kwWrap);
    card.append(img, body);
    return card;
}

// === Рендер списку ===
function renderList(data) {
    const root = document.getElementById("cards");
    root.innerHTML = "";
    if (!data.length) {
        const empty = document.createElement("p");
        empty.textContent = "Нічого не знайдено.";
        root.appendChild(empty);
        return;
    }
    const frag = document.createDocumentFragment();
    data.forEach((p) => frag.appendChild(createCard(p)));
    root.appendChild(frag);
}

// === Пошук по всіх полях ===
function makeSearchPredicate(q) {
    const nq = normalize(q);
    if (!nq) return () => true;
    return (p) => {
        const haystack = [p.name, p.portrait, p.born, p.died, p.description, ...(p.keywords || [])].map(normalize).join(" ");
        return haystack.includes(nq);
    };
}

// === Дебаунс для пошуку ===
function debounce(fn, ms = 200) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

// === Контролери ===
const $q = document.getElementById("searchInput");
const $sort = document.getElementById("sortSelect");

function applyAndRender() {
    const predicate = makeSearchPredicate($q.value);
    const sortKey = $sort.value in comparators ? $sort.value : "name_asc";
    const list = PERSONS.filter(predicate).slice().sort(comparators[sortKey]);
    renderList(list);
    // синхронізуємо URL (необов’язково)
    const url = new URL(location);
    url.searchParams.set("q", $q.value);
    url.searchParams.set("sort", sortKey);
    history.replaceState(null, "", url);
}

// ініціалізація з URL-параметрів
(function initFromURL() {
    const url = new URL(location);
    const q = url.searchParams.get("q") || "";
    const sort = url.searchParams.get("sort") || "name_asc";
    $q.value = q;
    $sort.value = sort;
})();

// слухачі
$q.addEventListener("input", debounce(applyAndRender, 200));
$sort.addEventListener("change", applyAndRender);

// перший рендер
applyAndRender();
