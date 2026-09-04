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
    
    // Sprachneutrale Schlüssel (id/kategorie); die angezeigten Texte kommen aus
    // ARTIKEL_NAMEN / KATEGORIE_LABELS unten, abhängig von state.lang.
    const STANDARD_ARTIKEL = [
        { id: 'milch', emoji: '🥛', kategorie: 'kuehlung' },
        { id: 'butter', emoji: '🧈', kategorie: 'kuehlung' },
        { id: 'eier', emoji: '🥚', kategorie: 'kuehlung' },
        { id: 'brot', emoji: '🍞', kategorie: 'backwaren' },
        { id: 'kaese', emoji: '🧀', kategorie: 'kuehlung' },
        { id: 'joghurt', emoji: '🥛', kategorie: 'kuehlung' },
        { id: 'aepfel', emoji: '🍎', kategorie: 'obst_gemuese' },
        { id: 'bananen', emoji: '🍌', kategorie: 'obst_gemuese' },
        { id: 'nudeln', emoji: '🍝', kategorie: 'vorraete' },
        { id: 'reis', emoji: '🍚', kategorie: 'vorraete' },
        { id: 'kaffee', emoji: '☕', kategorie: 'getraenke' },
        { id: 'wasser', emoji: '💧', kategorie: 'getraenke' },
        { id: 'tomaten', emoji: '🍅', kategorie: 'obst_gemuese' },
        { id: 'zwiebeln', emoji: '🧅', kategorie: 'obst_gemuese' },
        { id: 'kartoffeln', emoji: '🥔', kategorie: 'obst_gemuese' },
        { id: 'haehnchen', emoji: '🍗', kategorie: 'fleisch' },
        { id: 'wurst', emoji: '🌭', kategorie: 'fleisch' },
        { id: 'olivenoel', emoji: '🫒', kategorie: 'vorraete' },
        { id: 'zucker', emoji: '🧂', kategorie: 'vorraete' },
        { id: 'mehl', emoji: '🌾', kategorie: 'vorraete' }
    ];

    const ARTIKEL_NAMEN = {
        de: {
            milch: 'Milch', butter: 'Butter', eier: 'Eier', brot: 'Brot', kaese: 'Käse',
            joghurt: 'Joghurt', aepfel: 'Äpfel', bananen: 'Bananen', nudeln: 'Nudeln', reis: 'Reis',
            kaffee: 'Kaffee', wasser: 'Wasser', tomaten: 'Tomaten', zwiebeln: 'Zwiebeln',
            kartoffeln: 'Kartoffeln', haehnchen: 'Hähnchen', wurst: 'Wurst', olivenoel: 'Olivenöl',
            zucker: 'Zucker', mehl: 'Mehl'
        },
        en: {
            milch: 'Milk', butter: 'Butter', eier: 'Eggs', brot: 'Bread', kaese: 'Cheese',
            joghurt: 'Yogurt', aepfel: 'Apples', bananen: 'Bananas', nudeln: 'Pasta', reis: 'Rice',
            kaffee: 'Coffee', wasser: 'Water', tomaten: 'Tomatoes', zwiebeln: 'Onions',
            kartoffeln: 'Potatoes', haehnchen: 'Chicken', wurst: 'Sausage', olivenoel: 'Olive Oil',
            zucker: 'Sugar', mehl: 'Flour'
        }
    };

    const KATEGORIE_REIHENFOLGE = [
        'obst_gemuese',
        'kuehlung',
        'fleisch',
        'backwaren',
        'vorraete',
        'getraenke',
        'sonstiges'
    ];

    const KATEGORIE_LABELS = {
        de: {
            obst_gemuese: 'Obst & Gemüse', kuehlung: 'Kühlung', fleisch: 'Fleisch',
            backwaren: 'Backwaren', vorraete: 'Vorräte', getraenke: 'Getränke', sonstiges: 'Sonstiges'
        },
        en: {
            obst_gemuese: 'Fruit & Vegetables', kuehlung: 'Refrigerated', fleisch: 'Meat',
            backwaren: 'Bakery', vorraete: 'Pantry', getraenke: 'Beverages', sonstiges: 'Other'
        }
    };

    // Migration: vor diesem Feature wurde das deutsche Label direkt als
    // kategorie-Wert gespeichert. Bildet solche Altdaten auf die neuen Schlüssel ab.
    const KATEGORIE_LEGACY_DE_ZU_KEY = Object.fromEntries(
        Object.entries(KATEGORIE_LABELS.de).map(([key, label]) => [label, key])
    );

    const STRINGS = {
        de: {
            headerPlanen: 'Einkauf planen',
            headerEinkauf: 'Einkauf',
            inputPlaceholder: 'Artikel hinzufügen...',
            ariaHinzufuegen: 'Hinzufügen',
            sectionHaeufig: 'Häufig gekauft',
            emptyTitle: 'Deine Liste ist noch leer',
            emptyText: 'Füge Artikel hinzu, um deinen nächsten Einkauf optimal vorzubereiten.',
            btnVorschlaege: 'Vorschläge ansehen',
            sectionListe: 'Einkaufsliste',
            btnStartEinkauf: 'Einkauf starten',
            ariaVoice: 'Spracheingabe',
            ariaZurueck: 'Zurück',
            progressLabel: 'Fortschritt',
            progressCount: (checked, total) => `${checked} von ${total} erledigt`,
            btnAbschliessen: 'Einkauf abschließen',
            dialogTitle: 'Einkauf abschließen?',
            dialogText: 'Die Liste wird geleert und dein Einkauf wird beendet. Dieser Vorgang kann nicht rückgängig gemacht werden.',
            btnConfirmAbschluss: 'Abschließen & Leeren',
            btnCancelAbschluss: 'Abbrechen',
            navPlanen: 'Planen',
            navEinkauf: 'Einkauf',
            ariaLoeschen: 'Löschen',
            ariaDarkMode: 'Dark Mode umschalten',
            ariaLang: 'Sprache wechseln'
        },
        en: {
            headerPlanen: 'Plan Shopping',
            headerEinkauf: 'Shopping',
            inputPlaceholder: 'Add item...',
            ariaHinzufuegen: 'Add',
            sectionHaeufig: 'Frequently Bought',
            emptyTitle: 'Your list is still empty',
            emptyText: 'Add items to get your next shopping trip ready.',
            btnVorschlaege: 'View suggestions',
            sectionListe: 'Shopping List',
            btnStartEinkauf: 'Start Shopping',
            ariaVoice: 'Voice input',
            ariaZurueck: 'Back',
            progressLabel: 'Progress',
            progressCount: (checked, total) => `${checked} of ${total} done`,
            btnAbschliessen: 'Finish Shopping',
            dialogTitle: 'Finish shopping?',
            dialogText: 'The list will be cleared and your shopping trip ended. This cannot be undone.',
            btnConfirmAbschluss: 'Finish & Clear',
            btnCancelAbschluss: 'Cancel',
            navPlanen: 'Plan',
            navEinkauf: 'Shop',
            ariaLoeschen: 'Delete',
            ariaDarkMode: 'Toggle dark mode',
            ariaLang: 'Switch language'
        }
    };

    function t(key) {
        return STRINGS[state.lang][key];
    }

    // ==========================================
    // State
    // ==========================================
    
    let state = {
        liste: [],
        // Kaufhistorie: { name -> { count, emoji, kategorie } }
        history: {},
        darkMode: false,
        lang: 'de'
    };

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
        btnLang: document.getElementById('btn-lang'),
        headerPlanenTitle: document.getElementById('header-planen-title'),
        headerEinkaufTitle: document.getElementById('header-einkauf-title'),
        titleHaeufig: document.getElementById('title-haeufig'),
        emptyTitleEl: document.getElementById('empty-title'),
        emptyTextEl: document.getElementById('empty-text'),
        btnVorschlaegeText: document.getElementById('btn-vorschlaege-text'),
        titleListe: document.getElementById('title-liste'),
        btnStartEinkaufText: document.getElementById('btn-start-einkauf-text'),
        progressLabelText: document.getElementById('progress-label-text'),
        btnAbschliessenText: document.getElementById('btn-abschliessen-text'),
        navPlanenText: document.getElementById('nav-planen-text'),
        navEinkaufText: document.getElementById('nav-einkauf-text'),
        dialogTitleEl: document.getElementById('dialog-title'),
        dialogTextEl: document.getElementById('dialog-text')
    };

    // ==========================================
    // LocalStorage
    // ==========================================
    
    /**
     * Bildet einen evtl. noch deutschen Kategorie-String aus Daten vor diesem
     * Feature auf den neuen sprachneutralen Schlüssel ab.
     */
    function migriereKategorie(kategorie) {
        return KATEGORIE_LEGACY_DE_ZU_KEY[kategorie] || kategorie;
    }

    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                state.liste = (parsed.liste || []).map(a => ({ ...a, kategorie: migriereKategorie(a.kategorie) }));
            }
        } catch (e) {
            console.error('Fehler beim Laden:', e);
            state.liste = [];
        }

        try {
            const hist = localStorage.getItem(HISTORY_KEY);
            if (hist) {
                const parsedHist = JSON.parse(hist);
                state.history = Object.fromEntries(
                    Object.entries(parsedHist).map(([key, item]) => [key, { ...item, kategorie: migriereKategorie(item.kategorie) }])
                );
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
                state.lang = parsed.lang === 'en' ? 'en' : 'de';
            }
        } catch (e) {
            state.darkMode = false;
            state.lang = 'de';
        }
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ liste: state.liste }));
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
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({ darkMode: state.darkMode, lang: state.lang }));
        } catch (e) {
            console.error('Fehler beim Speichern der Einstellungen:', e);
        }
    }

    // ==========================================
    // Kaufhistorie
    // ==========================================

    /**
     * Erhöht den Zähler für alle abgehakten Artikel beim Abschluss des Einkaufs.
     */
    function recordPurchases() {
        state.liste.forEach(artikel => {
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
        STANDARD_ARTIKEL.forEach(artikel => tryAdd({
            ...artikel,
            name: ARTIKEL_NAMEN[state.lang][artikel.id],
            count: 0,
            fromHistory: false
        }));

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
    // Sprache (i18n)
    // ==========================================

    function setText(el, text) {
        if (el) el.textContent = text;
    }

    /**
     * Aktualisiert alle statischen UI-Texte auf die aktuelle Sprache und rendert
     * die sprachabhängigen Teile neu (Kategorien-Überschriften, Standard-Artikel-
     * Chips). Bereits hinzugefügte Artikel behalten den Namen, mit dem sie
     * angelegt wurden – es wird nichts rückwirkend übersetzt.
     */
    function applyLanguage() {
        document.documentElement.lang = state.lang;

        if (elements.btnLang) {
            elements.btnLang.textContent = state.lang === 'de' ? 'EN' : 'DE';
            elements.btnLang.setAttribute('aria-label', t('ariaLang'));
        }

        setText(elements.headerPlanenTitle, t('headerPlanen'));
        setText(elements.headerEinkaufTitle, t('headerEinkauf'));
        if (elements.inputArtikel) elements.inputArtikel.placeholder = t('inputPlaceholder');
        elements.btnAdd?.setAttribute('aria-label', t('ariaHinzufuegen'));
        setText(elements.titleHaeufig, t('sectionHaeufig'));
        setText(elements.emptyTitleEl, t('emptyTitle'));
        setText(elements.emptyTextEl, t('emptyText'));
        setText(elements.btnVorschlaegeText, t('btnVorschlaege'));
        setText(elements.titleListe, t('sectionListe'));
        setText(elements.btnStartEinkaufText, t('btnStartEinkauf'));
        elements.btnVoice?.setAttribute('aria-label', t('ariaVoice'));
        elements.btnBack?.setAttribute('aria-label', t('ariaZurueck'));
        setText(elements.progressLabelText, t('progressLabel'));
        setText(elements.btnAbschliessenText, t('btnAbschliessen'));
        setText(elements.dialogTitleEl, t('dialogTitle'));
        setText(elements.dialogTextEl, t('dialogText'));
        setText(elements.btnConfirmAbschluss, t('btnConfirmAbschluss'));
        setText(elements.btnCancelAbschluss, t('btnCancelAbschluss'));
        setText(elements.navPlanenText, t('navPlanen'));
        setText(elements.navEinkaufText, t('navEinkauf'));
        elements.btnSettings?.setAttribute('aria-label', t('ariaDarkMode'));

        renderChips();
        if (elements.screenEinkauf.classList.contains('active')) {
            renderEinkaufListe();
        }
        updateProgress();
    }

    function toggleLanguage() {
        state.lang = state.lang === 'de' ? 'en' : 'de';
        applyLanguage();
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
        const inListe = new Set(state.liste.map(a => a.name.toLowerCase()));
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
        
        const exists = state.liste.some(a => a.name.toLowerCase() === trimmed.toLowerCase());
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
        state.liste.push({
            id: generateId(),
            name: info ? info.name : trimmed,
            emoji: info ? info.emoji : '🛒',
            kategorie: info ? info.kategorie : 'sonstiges',
            checked: false
        });
        
        saveData();
        renderPlanenListe();
        hideAutocomplete();
        return true;
    }

    function removeArtikel(id) {
        state.liste = state.liste.filter(a => a.id !== id);
        saveData();
        renderPlanenListe();
    }

    function toggleArtikel(id) {
        const artikel = state.liste.find(a => a.id === id);
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
    
    /**
     * Chips: Zeigt häufig gekaufte Artikel (aus History) + Standard-Artikel als Ergänzung.
     */
    function renderChips() {
        const inListe = new Set(state.liste.map(a => a.name.toLowerCase()));
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
        const hasItems = state.liste.length > 0;
        
        elements.emptyState.style.display = hasItems ? 'none' : 'flex';
        elements.sectionListe.style.display = hasItems ? 'block' : 'none';
        elements.ctaPlanen.style.display = hasItems ? 'block' : 'none';
        elements.screenPlanen.classList.toggle('has-items', hasItems);
        
        elements.artikelListe.innerHTML = state.liste.map(artikel => {
            const { emoji, name } = renderArtikelInhalt(artikel);
            return `
                <li class="artikel-item" data-name="${escapeHtml(artikel.name.toLowerCase())}">
                    <div class="artikel-item-left">
                        <div class="artikel-icon">${emoji}</div>
                        <span class="artikel-name">${name}</span>
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
        
        state.liste.forEach(artikel => {
            const kat = artikel.kategorie || 'sonstiges';
            if (!grouped[kat]) grouped[kat] = [];
            grouped[kat].push(artikel);
        });

        const nonEmpty = KATEGORIE_REIHENFOLGE.filter(k => grouped[k]?.length > 0);

        elements.einkaufKategorien.innerHTML = nonEmpty.map(kategorie => `
            <div class="kategorie-section">
                <h3 class="kategorie-title">${KATEGORIE_LABELS[state.lang][kategorie] || kategorie}</h3>
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
                            </div>
                        </li>
                        `;
                    }).join('')}
                </ul>
            </div>
        `).join('');
    }

    function updateProgress() {
        const total = state.liste.length;
        const checked = state.liste.filter(a => a.checked).length;
        const percent = total > 0 ? (checked / total) * 100 : 0;
        
        elements.progressCount.textContent = t('progressCount')(checked, total);
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
        state.liste = [];
        saveData();
        hideDialog();
        renderPlanenListe();
        showScreen('planen');
    }

    // ==========================================
    // Event Listeners
    // ==========================================
    
    function setupEventListeners() {
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
            }
        });
        
        // Einkauf starten
        elements.btnStartEinkauf.addEventListener('click', () => {
            state.liste.forEach(a => a.checked = false);
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

        // Sprache umschalten (DE/EN)
        elements.btnLang?.addEventListener('click', toggleLanguage);

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
        recognition.lang = state.lang === 'en' ? 'en-US' : 'de-DE';
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
        applyLanguage();
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