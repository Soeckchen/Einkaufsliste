/**
 * Einkaufslisten-App
 * Lokale Datenspeicherung mit LocalStorage
 */

(function() {
    'use strict';

    // ==========================================
    // Daten & Konfiguration
    // ==========================================
    
    const STORAGE_KEY = 'einkaufsliste_data';
    const HISTORY_KEY = 'einkaufsliste_history';
    const SETTINGS_KEY = 'einkaufsliste_settings';
    
    const STANDARD_ARTIKEL = [
        { name: 'Milch', emoji: '🥛', kategorie: 'Kühlung' },
        { name: 'Butter', emoji: '🧈', kategorie: 'Kühlung' },
        { name: 'Eier', emoji: '🥚', kategorie: 'Kühlung' },
        { name: 'Brot', emoji: '🍞', kategorie: 'Backwaren' },
        { name: 'Käse', emoji: '🧀', kategorie: 'Kühlung' },
        { name: 'Joghurt', emoji: '🥛', kategorie: 'Kühlung' },
        { name: 'Äpfel', emoji: '🍎', kategorie: 'Obst & Gemüse' },
        { name: 'Bananen', emoji: '🍌', kategorie: 'Obst & Gemüse' },
        { name: 'Nudeln', emoji: '🍝', kategorie: 'Vorräte' },
        { name: 'Reis', emoji: '🍚', kategorie: 'Vorräte' },
        { name: 'Kaffee', emoji: '☕', kategorie: 'Getränke' },
        { name: 'Wasser', emoji: '💧', kategorie: 'Getränke' },
        { name: 'Tomaten', emoji: '🍅', kategorie: 'Obst & Gemüse' },
        { name: 'Zwiebeln', emoji: '🧅', kategorie: 'Obst & Gemüse' },
        { name: 'Kartoffeln', emoji: '🥔', kategorie: 'Obst & Gemüse' },
        { name: 'Hähnchen', emoji: '🍗', kategorie: 'Fleisch' },
        { name: 'Wurst', emoji: '🌭', kategorie: 'Fleisch' },
        { name: 'Olivenöl', emoji: '🫒', kategorie: 'Vorräte' },
        { name: 'Zucker', emoji: '🧂', kategorie: 'Vorräte' },
        { name: 'Mehl', emoji: '🌾', kategorie: 'Vorräte' }
    ];

    const KATEGORIE_REIHENFOLGE = [
        'Obst & Gemüse',
        'Kühlung',
        'Fleisch',
        'Backwaren',
        'Vorräte',
        'Getränke',
        'Sonstiges'
    ];

    // ==========================================
    // State
    // ==========================================
    
    let state = {
        // Mehrere benannte Listen: [{ id, name, items: [...] }]
        listen: [],
        aktiveListeId: null,
        // Kaufhistorie ist listenübergreifend: { name -> { count, emoji, kategorie } }
        history: {},
        darkMode: false
    };

    /**
     * Die gerade ausgewählte Liste – einziger Zugriffspunkt auf die Artikel,
     * die in Planen/Einkauf angezeigt werden.
     */
    function aktiveListe() {
        return state.listen.find(l => l.id === state.aktiveListeId);
    }

    // ==========================================
    // DOM Elemente
    // ==========================================
    
    const elements = {
        screenPlanen: document.getElementById('screen-planen'),
        screenEinkauf: document.getElementById('screen-einkauf'),
        inputArtikel: document.getElementById('input-artikel'),
        btnAdd: document.getElementById('btn-add'),
        chipsContainer: document.getElementById('chips-container'),
        emptyState: document.getElementById('empty-state'),
        sectionListe: document.getElementById('section-liste'),
        artikelListe: document.getElementById('artikel-liste'),
        ctaPlanen: document.getElementById('cta-planen'),
        btnStartEinkauf: document.getElementById('btn-start-einkauf'),
        btnVorschlaege: document.getElementById('btn-vorschlaege'),
        sectionHaeufig: document.getElementById('section-haeufig'),
        btnBack: document.getElementById('btn-back'),
        progressCount: document.getElementById('progress-count'),
        progressFill: document.getElementById('progress-fill'),
        einkaufKategorien: document.getElementById('einkauf-kategorien'),
        btnAbschliessen: document.getElementById('btn-abschliessen'),
        dialogOverlay: document.getElementById('dialog-overlay'),
        btnConfirmAbschluss: document.getElementById('btn-confirm-abschluss'),
        btnCancelAbschluss: document.getElementById('btn-cancel-abschluss'),
        navItems: document.querySelectorAll('.nav-item'),
        btnVoice: document.getElementById('btn-voice'),
        btnSettings: document.getElementById('btn-settings'),
        autocompleteList: document.getElementById('autocomplete-list'),
        headerPlanenTitle: document.getElementById('header-planen-title'),
        btnListePicker: document.getElementById('btn-liste-picker'),
        listenDropdown: document.getElementById('listen-dropdown'),
        listenDropdownListe: document.getElementById('listen-dropdown-liste'),
        inputNeueListe: document.getElementById('input-neue-liste'),
        btnNeueListe: document.getElementById('btn-neue-liste')
    };

    // ==========================================
    // LocalStorage
    // ==========================================
    
    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : null;

            if (parsed && Array.isArray(parsed.listen) && parsed.listen.length > 0) {
                // Migration: ältere Listen kannten noch kein "menge"-Feld pro Artikel
                state.listen = parsed.listen.map(liste => ({
                    ...liste,
                    items: (liste.items || []).map(a => ({ menge: 1, ...a }))
                }));
                state.aktiveListeId = parsed.listen.some(l => l.id === parsed.aktiveListeId)
                    ? parsed.aktiveListeId
                    : parsed.listen[0].id;
            } else if (parsed && Array.isArray(parsed.liste)) {
                // Migration: Daten von vor dem Mehrere-Listen-Feature (eine namenlose Liste),
                // dabei zugleich fehlendes "menge"-Feld auf älteren Artikeln nachziehen
                const id = generateId();
                state.listen = [{ id, name: 'Einkaufsliste', items: parsed.liste.map(a => ({ menge: 1, ...a })) }];
                state.aktiveListeId = id;
            }
        } catch (e) {
            console.error('Fehler beim Laden:', e);
        }

        if (state.listen.length === 0) {
            const id = generateId();
            state.listen = [{ id, name: 'Einkaufsliste', items: [] }];
            state.aktiveListeId = id;
        }

        try {
            const hist = localStorage.getItem(HISTORY_KEY);
            if (hist) {
                state.history = JSON.parse(hist);
            }
        } catch (e) {
            console.error('Fehler beim Laden der Historie:', e);
            state.history = {};
        }

        try {
            const settings = localStorage.getItem(SETTINGS_KEY);
            if (settings) {
                const parsed = JSON.parse(settings);
                state.darkMode = parsed.darkMode || false;
            }
        } catch (e) {
            state.darkMode = false;
        }
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ listen: state.listen, aktiveListeId: state.aktiveListeId }));
        } catch (e) {
            console.error('Fehler beim Speichern:', e);
        }
    }

    function saveHistory() {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
        } catch (e) {
            console.error('Fehler beim Speichern der Historie:', e);
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({ darkMode: state.darkMode }));
        } catch (e) {
            console.error('Fehler beim Speichern der Einstellungen:', e);
        }
    }

    // ==========================================
    // Listen-Verwaltung
    // ==========================================

    function erstelleListe(name) {
        const trimmed = name.trim();
        if (!trimmed) return;
        const id = generateId();
        state.listen.push({ id, name: trimmed, items: [] });
        state.aktiveListeId = id;
        saveData();
        renderPlanenListe();
        renderListenDropdown();
    }

    function waehleListe(id) {
        if (id === state.aktiveListeId) return;
        state.aktiveListeId = id;
        saveData();
        renderPlanenListe();
        renderListenDropdown();
    }

    function benenneListeUm(id, neuerName) {
        const liste = state.listen.find(l => l.id === id);
        if (!liste) return;
        const trimmed = neuerName.trim();
        if (trimmed) {
            liste.name = trimmed;
            saveData();
            renderPlanenListe();
        }
        renderListenDropdown();
    }

    function loescheListe(id) {
        if (state.listen.length <= 1) return; // mindestens eine Liste bleibt immer bestehen
        state.listen = state.listen.filter(l => l.id !== id);
        if (state.aktiveListeId === id) {
            state.aktiveListeId = state.listen[0].id;
        }
        saveData();
        renderPlanenListe();
        renderListenDropdown();
    }

    // ==========================================
    // Kaufhistorie
    // ==========================================

    /**
     * Erhöht den Zähler für alle abgehakten Artikel beim Abschluss des Einkaufs.
     */
    function recordPurchases() {
        aktiveListe().items.forEach(artikel => {
            const key = artikel.name.toLowerCase();
            if (!state.history[key]) {
                state.history[key] = {
                    name: artikel.name,
                    emoji: artikel.emoji,
                    kategorie: artikel.kategorie,
                    count: 0
                };
            }
            state.history[key].count += 1;
        });
        saveHistory();
    }

    /**
     * Gibt die Artikel der Kaufhistorie sortiert nach Häufigkeit zurück.
     */
    function getHistorySorted() {
        return Object.values(state.history)
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Durchsucht Kaufhistorie (priorisiert, nach Häufigkeit) und Standard-Artikel
     * nach `query`, schließt Namen aus `excludeNames` aus und dedupliziert nach Name.
     * exact=true vergleicht auf Gleichheit statt auf Teilstring (für Direkt-Lookups).
     */
    function getArtikelPool({ query = '', exact = false, excludeNames = new Set(), limit = Infinity } = {}) {
        const q = query.toLowerCase().trim();
        const results = [];
        const seen = new Set();

        const tryAdd = (item) => {
            const key = item.name.toLowerCase();
            if (seen.has(key) || excludeNames.has(key)) return;
            if (q && (exact ? key !== q : !key.includes(q))) return;
            results.push(item);
            seen.add(key);
        };

        getHistorySorted().forEach(item => tryAdd({ ...item, fromHistory: true }));
        STANDARD_ARTIKEL.forEach(artikel => tryAdd({ ...artikel, count: 0, fromHistory: false }));

        return results.slice(0, limit);
    }

    // ==========================================
    // Dark Mode
    // ==========================================

    function applyDarkMode() {
        document.documentElement.classList.toggle('dark-mode', state.darkMode);
        // Icon tauschen: Sonne ↔ Mond
        const icon = elements.btnSettings ? elements.btnSettings.querySelector('svg') : null;
        if (icon) {
            if (state.darkMode) {
                // Mond-Icon
                icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
            } else {
                // Sonnen-Icon
                icon.innerHTML = `
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
            }
        }
    }

    function toggleDarkMode() {
        state.darkMode = !state.darkMode;
        applyDarkMode();
        saveSettings();
    }

    // ==========================================
    // HTML-Escaping
    // ==========================================

    /**
     * Escaped Text für sichere Einbettung in innerHTML (Text- und Attribut-Kontext).
     */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Escaptes Emoji/Name (+ optionalem Mengen-Badge) für eine Artikel-Karte.
     * Zentralisiert die Escaping- und Badge-Logik, die sonst in jeder
     * render-Funktion einzeln wiederholt werden müsste.
     */
    function renderArtikelInhalt(artikel, { count = 0, countClass = '' } = {}) {
        return {
            emoji: artikel.emoji ? escapeHtml(artikel.emoji) : '',
            name: escapeHtml(artikel.name),
            badge: count > 0 ? ` <span class="${countClass}">${count}×</span>` : ''
        };
    }

    // ==========================================
    // Autocomplete
    // ==========================================

    /**
     * Erstellt Autocomplete-Vorschläge basierend auf Eingabe.
     * Priorisiert: 1. Kaufhistorie (nach count), 2. Standard-Artikel
     */
    function getAutocompleteItems(query) {
        if (!query || query.length < 1) return [];
        const inListe = new Set(aktiveListe().items.map(a => a.name.toLowerCase()));
        return getArtikelPool({ query, excludeNames: inListe, limit: 6 });
    }

    function showAutocomplete(query) {
        const list = elements.autocompleteList;
        if (!list) return;

        const items = getAutocompleteItems(query);

        if (items.length === 0) {
            list.style.display = 'none';
            return;
        }

        list.innerHTML = items.map(item => {
            const { emoji, name, badge } = renderArtikelInhalt(item, { count: item.count, countClass: 'autocomplete-count' });
            return `
                <li class="autocomplete-item" data-name="${name}">
                    <span class="autocomplete-emoji">${emoji}</span>
                    <span class="autocomplete-name">${name}</span>
                    ${badge}
                </li>
            `;
        }).join('');
        list.style.display = 'block';
    }

    function hideAutocomplete() {
        const list = elements.autocompleteList;
        if (list) list.style.display = 'none';
    }

    // ==========================================
    // Artikel Funktionen
    // ==========================================

    let lastId = 0;

    /**
     * Monoton steigende ID. Date.now() allein kollidiert, wenn zwei Artikel
     * innerhalb derselben Millisekunde hinzugefügt werden.
     */
    function generateId() {
        lastId = Math.max(Date.now(), lastId + 1);
        return lastId;
    }

    function findArtikelInfo(name) {
        const [match] = getArtikelPool({ query: name, exact: true, limit: 1 });
        return match ? { name: match.name, emoji: match.emoji, kategorie: match.kategorie } : undefined;
    }

    function addArtikel(name) {
        const trimmed = name.trim();
        if (!trimmed) return false;
        
        const exists = aktiveListe().items.some(a => a.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
            const lower = trimmed.toLowerCase();
            const existingItem = Array.from(elements.artikelListe.children)
                .find(el => el.dataset.name === lower);
            if (existingItem) {
                existingItem.classList.add('shake');
                setTimeout(() => existingItem.classList.remove('shake'), 300);
            }
            return false;
        }

        const info = findArtikelInfo(trimmed);
        aktiveListe().items.push({
            id: generateId(),
            name: info ? info.name : trimmed,
            emoji: info ? info.emoji : '🛒',
            kategorie: info ? info.kategorie : 'Sonstiges',
            menge: 1,
            checked: false
        });

        saveData();
        renderPlanenListe();
        hideAutocomplete();
        return true;
    }

    function removeArtikel(id) {
        const liste = aktiveListe();
        liste.items = liste.items.filter(a => a.id !== id);
        saveData();
        renderPlanenListe();
    }

    const MENGE_MIN = 1;
    const MENGE_MAX = 99;

    function changeMenge(id, delta) {
        const artikel = aktiveListe().items.find(a => a.id === id);
        if (!artikel) return;
        artikel.menge = Math.min(MENGE_MAX, Math.max(MENGE_MIN, artikel.menge + delta));
        saveData();
        renderPlanenListe();
    }

    function toggleArtikel(id) {
        const artikel = aktiveListe().items.find(a => a.id === id);
        if (artikel) {
            artikel.checked = !artikel.checked;
            saveData();
            renderEinkaufListe();
            updateProgress();
        }
    }

    // ==========================================
    // Rendering
    // ==========================================

    // id der Liste, die im Dropdown gerade per Inline-Edit umbenannt wird (sonst null)
    let umbenennenId = null;

    /**
     * Zeigt/versteckt das Listen-Dropdown und rendert es bei Bedarf neu.
     */
    function toggleListenDropdown(open) {
        if (!elements.listenDropdown) return;
        const soll = open ?? !elements.listenDropdown.classList.contains('active');
        elements.listenDropdown.classList.toggle('active', soll);
        if (soll) renderListenDropdown();
    }

    /**
     * Rendert die Listen-Übersicht im Dropdown: Name, Artikelanzahl,
     * Umbenennen/Löschen-Icons. Löschen ist deaktiviert, wenn nur eine Liste existiert.
     */
    function renderListenDropdown() {
        if (!elements.listenDropdownListe) return;

        elements.listenDropdownListe.innerHTML = state.listen.map(liste => {
            const istAktiv = liste.id === state.aktiveListeId;
            const nameBereich = liste.id === umbenennenId
                ? `<input type="text" class="listen-item-input" data-id="${liste.id}" value="${escapeHtml(liste.name)}">`
                : `<button class="listen-item-select" data-action="waehlen">
                       <span class="listen-item-name">${escapeHtml(liste.name)}</span>
                       <span class="listen-item-count">${liste.items.length}</span>
                   </button>`;

            return `
                <li class="listen-item ${istAktiv ? 'aktiv' : ''}" data-id="${liste.id}">
                    ${nameBereich}
                    <button class="listen-item-icon" data-action="umbenennen" aria-label="Umbenennen">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        </svg>
                    </button>
                    <button class="listen-item-icon" data-action="loeschen" aria-label="Löschen" ${state.listen.length <= 1 ? 'disabled' : ''}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </li>
            `;
        }).join('');

        const input = elements.listenDropdownListe.querySelector('.listen-item-input');
        if (input) {
            input.focus();
            input.select();
        }
    }

    /**
     * Chips: Zeigt häufig gekaufte Artikel (aus History) + Standard-Artikel als Ergänzung.
     */
    function renderChips() {
        const inListe = new Set(aktiveListe().items.map(a => a.name.toLowerCase()));
        const chips = getArtikelPool({ excludeNames: inListe, limit: 8 });

        elements.chipsContainer.innerHTML = chips.map(artikel => {
            const { emoji, name, badge } = renderArtikelInhalt(artikel, { count: artikel.count, countClass: 'chip-count' });
            return `
                <button class="chip" data-name="${name}">
                    ${emoji ? emoji + ' ' : ''}${name}${badge}
                </button>
            `;
        }).join('');
    }

    function renderPlanenListe() {
        const items = aktiveListe().items;
        const hasItems = items.length > 0;

        elements.headerPlanenTitle.textContent = aktiveListe().name;
        elements.emptyState.style.display = hasItems ? 'none' : 'flex';
        elements.sectionListe.style.display = hasItems ? 'block' : 'none';
        elements.ctaPlanen.style.display = hasItems ? 'block' : 'none';
        elements.screenPlanen.classList.toggle('has-items', hasItems);

        elements.artikelListe.innerHTML = items.map(artikel => {
            const { emoji, name } = renderArtikelInhalt(artikel);
            return `
                <li class="artikel-item" data-name="${escapeHtml(artikel.name.toLowerCase())}">
                    <div class="artikel-item-left">
                        <div class="artikel-icon">${emoji}</div>
                        <span class="artikel-name">${name}</span>
                    </div>
                    <div class="menge-stepper" data-id="${artikel.id}">
                        <button class="menge-btn" data-delta="-1" aria-label="Menge verringern" ${artikel.menge <= MENGE_MIN ? 'disabled' : ''}>−</button>
                        <span class="menge-value">${artikel.menge}</span>
                        <button class="menge-btn" data-delta="1" aria-label="Menge erhöhen" ${artikel.menge >= MENGE_MAX ? 'disabled' : ''}>+</button>
                    </div>
                    <button class="btn-delete" data-id="${artikel.id}" aria-label="Löschen">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </li>
            `;
        }).join('');
        
        renderChips();
    }

    function renderEinkaufListe() {
        const grouped = {};
        KATEGORIE_REIHENFOLGE.forEach(k => grouped[k] = []);

        aktiveListe().items.forEach(artikel => {
            const kat = artikel.kategorie || 'Sonstiges';
            if (!grouped[kat]) grouped[kat] = [];
            grouped[kat].push(artikel);
        });
        
        const nonEmpty = KATEGORIE_REIHENFOLGE.filter(k => grouped[k]?.length > 0);
        
        elements.einkaufKategorien.innerHTML = nonEmpty.map(kategorie => `
            <div class="kategorie-section">
                <h3 class="kategorie-title">${kategorie}</h3>
                <ul class="einkauf-liste">
                    ${grouped[kategorie].map(artikel => {
                        const { name } = renderArtikelInhalt(artikel);
                        return `
                        <li class="einkauf-item ${artikel.checked ? 'checked' : ''}" data-id="${artikel.id}">
                            <div class="checkbox">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div class="einkauf-item-content">
                                <span class="einkauf-item-name">${name}</span>
                                ${artikel.menge > 1 ? `<span class="einkauf-item-detail">${artikel.menge}×</span>` : ''}
                            </div>
                        </li>
                        `;
                    }).join('')}
                </ul>
            </div>
        `).join('');
    }

    function updateProgress() {
        const total = aktiveListe().items.length;
        const checked = aktiveListe().items.filter(a => a.checked).length;
        const percent = total > 0 ? (checked / total) * 100 : 0;
        
        elements.progressCount.textContent = `${checked} von ${total} erledigt`;
        elements.progressFill.style.width = `${percent}%`;
    }

    // ==========================================
    // Navigation
    // ==========================================
    
    function showScreen(screenName) {
        elements.screenPlanen.classList.toggle('active', screenName === 'planen');
        elements.screenEinkauf.classList.toggle('active', screenName === 'einkauf');
        
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.screen === screenName);
        });
        
        if (screenName === 'einkauf') {
            renderEinkaufListe();
            updateProgress();
        }
    }

    // ==========================================
    // Dialog
    // ==========================================
    
    function showDialog() {
        elements.dialogOverlay.classList.add('active');
    }

    function hideDialog() {
        elements.dialogOverlay.classList.remove('active');
    }

    function completeEinkauf() {
        // Kaufhistorie aktualisieren bevor Liste geleert wird
        recordPurchases();
        aktiveListe().items = [];
        saveData();
        hideDialog();
        renderPlanenListe();
        showScreen('planen');
    }

    // ==========================================
    // Event Listeners
    // ==========================================
    
    function setupEventListeners() {
        // Listen-Dropdown öffnen/schließen
        elements.btnListePicker?.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleListenDropdown();
        });

        document.addEventListener('click', (e) => {
            if (!elements.listenDropdown?.classList.contains('active')) return;
            if (!e.target.closest('#listen-dropdown') && !e.target.closest('#btn-liste-picker')) {
                toggleListenDropdown(false);
            }
        });

        // Liste wählen / umbenennen / löschen
        elements.listenDropdownListe?.addEventListener('click', (e) => {
            const item = e.target.closest('.listen-item');
            if (!item) return;
            const id = parseInt(item.dataset.id, 10);
            const action = e.target.closest('[data-action]')?.dataset.action;

            if (action === 'waehlen') {
                waehleListe(id);
                toggleListenDropdown(false);
            } else if (action === 'umbenennen') {
                umbenennenId = id;
                renderListenDropdown();
            } else if (action === 'loeschen') {
                const liste = state.listen.find(l => l.id === id);
                if (liste && confirm(`"${liste.name}" wirklich löschen?`)) {
                    loescheListe(id);
                }
            }
        });

        // Inline-Umbenennen: Enter bestätigt (via blur), Escape bricht ab
        elements.listenDropdownListe?.addEventListener('keydown', (e) => {
            if (!e.target.classList.contains('listen-item-input')) return;
            if (e.key === 'Enter') {
                e.target.blur();
            } else if (e.key === 'Escape') {
                umbenennenId = null;
                renderListenDropdown();
            }
        });

        elements.listenDropdownListe?.addEventListener('blur', (e) => {
            if (!e.target.classList.contains('listen-item-input')) return;
            const id = parseInt(e.target.dataset.id, 10);
            if (umbenennenId !== id) return; // bereits per Escape abgebrochen
            umbenennenId = null;
            benenneListeUm(id, e.target.value);
        }, true);

        // Neue Liste anlegen
        const commitNeueListe = () => {
            if (!elements.inputNeueListe) return;
            erstelleListe(elements.inputNeueListe.value);
            elements.inputNeueListe.value = '';
            toggleListenDropdown(false);
        };
        elements.btnNeueListe?.addEventListener('click', commitNeueListe);
        elements.inputNeueListe?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                commitNeueListe();
            }
        });

        // Artikel hinzufügen
        elements.btnAdd.addEventListener('click', () => {
            if (addArtikel(elements.inputArtikel.value)) {
                elements.inputArtikel.value = '';
                elements.inputArtikel.focus();
            }
        });
        
        elements.inputArtikel.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (addArtikel(elements.inputArtikel.value)) {
                    elements.inputArtikel.value = '';
                }
            }
            // Escape: Autocomplete schließen
            if (e.key === 'Escape') {
                hideAutocomplete();
            }
        });

        // Autocomplete bei Eingabe
        elements.inputArtikel.addEventListener('input', (e) => {
            showAutocomplete(e.target.value);
        });

        elements.inputArtikel.addEventListener('blur', () => {
            // Kurze Verzögerung damit Klick auf Autocomplete-Item noch registriert wird
            setTimeout(hideAutocomplete, 150);
        });

        // Autocomplete-Item klicken
        if (elements.autocompleteList) {
            elements.autocompleteList.addEventListener('click', (e) => {
                const item = e.target.closest('.autocomplete-item');
                if (item) {
                    const name = item.dataset.name;
                    if (addArtikel(name)) {
                        elements.inputArtikel.value = '';
                        elements.inputArtikel.focus();
                    }
                }
            });
        }

        // Chips klicken
        elements.chipsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip');
            if (chip) {
                addArtikel(chip.dataset.name);
            }
        });
        
        // Artikel löschen
        elements.artikelListe.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const id = parseInt(deleteBtn.dataset.id, 10);
                removeArtikel(id);
                return;
            }

            // Menge per Stepper anpassen
            const mengeBtn = e.target.closest('.menge-btn');
            if (mengeBtn) {
                const id = parseInt(mengeBtn.closest('.menge-stepper').dataset.id, 10);
                const delta = parseInt(mengeBtn.dataset.delta, 10);
                changeMenge(id, delta);
            }
        });
        
        // Einkauf starten
        elements.btnStartEinkauf.addEventListener('click', () => {
            aktiveListe().items.forEach(a => a.checked = false);
            saveData();
            showScreen('einkauf');
        });
        
        // Vorschläge Button: scrollt zu "Häufig gekauft"
        elements.btnVorschlaege?.addEventListener('click', () => {
            elements.sectionHaeufig.scrollIntoView({ behavior: 'smooth' });
        });
        
        // Zurück Button
        elements.btnBack.addEventListener('click', () => {
            showScreen('planen');
        });
        
        // Einkauf Items abhaken
        elements.einkaufKategorien.addEventListener('click', (e) => {
            const item = e.target.closest('.einkauf-item');
            if (item) {
                const id = parseInt(item.dataset.id, 10);
                toggleArtikel(id);
            }
        });
        
        // Einkauf abschließen
        elements.btnAbschliessen.addEventListener('click', showDialog);
        elements.btnConfirmAbschluss.addEventListener('click', completeEinkauf);
        elements.btnCancelAbschluss.addEventListener('click', hideDialog);
        
        elements.dialogOverlay.addEventListener('click', (e) => {
            if (e.target === elements.dialogOverlay) hideDialog();
        });
        
        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                showScreen(item.dataset.screen);
            });
        });
        
        // Dark Mode Toggle (Einstellungen-Button → wird zur Sonne/Mond)
        elements.btnSettings?.addEventListener('click', toggleDarkMode);

        // ==========================================
        // Diktierfunktion – Firefox-kompatibel
        // ==========================================
        if (elements.btnVoice) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (SpeechRecognition) {
                // Browser unterstützt Diktierfunktion → Button anzeigen
                elements.btnVoice.style.display = 'flex';
                elements.btnVoice.addEventListener('click', startVoiceInput);
            } else {
                // Kein Support (z.B. Firefox ohne Flag) → Button ausblenden
                elements.btnVoice.style.display = 'none';
            }
        }
    }

    // ==========================================
    // Diktierfunktion
    // ==========================================
    
    function startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'de-DE';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        elements.btnVoice.classList.add('listening');
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            elements.inputArtikel.value = transcript;
            addArtikel(transcript);
            elements.inputArtikel.value = '';
        };
        
        recognition.onend = () => {
            elements.btnVoice.classList.remove('listening');
        };
        
        recognition.onerror = (e) => {
            console.warn('Diktierfehler:', e.error);
            elements.btnVoice.classList.remove('listening');
        };
        
        recognition.start();
    }

    // ==========================================
    // Service Worker
    // ==========================================
    
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(() => console.log('Service Worker registriert'))
                .catch(err => console.warn('SW Registrierung fehlgeschlagen:', err));
        }
    }

    // ==========================================
    // Init
    // ==========================================
    
    function init() {
        loadData();
        applyDarkMode();
        renderChips();
        renderPlanenListe();
        setupEventListeners();
        registerServiceWorker();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();