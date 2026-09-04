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
            ariaLang: 'Sprache wechseln',
            ariaListeWechseln: 'Liste wechseln',
            ariaListeAnlegen: 'Liste anlegen',
            ariaUmbenennen: 'Umbenennen',
            placeholderNeueListe: 'Neue Liste...',
            confirmListeLoeschen: (name) => `"${name}" wirklich löschen?`,
            ariaMengeVerringern: 'Menge verringern',
            ariaMengeErhoehen: 'Menge erhöhen',
            ariaExport: 'Liste exportieren',
            ariaImport: 'Liste importieren',
            ariaShareApp: 'App per QR-Code teilen',
            qrDialogTitle: 'App teilen',
            qrDialogText: 'Diesen Code scannen, um die App zu öffnen.',
            btnSchliessen: 'Schließen',
            exportLeerAlert: 'Deine Liste ist leer – es gibt nichts zu exportieren.',
            importUngueltigAlert: 'Diese Datei enthält keine gültige Einkaufsliste.',
            importJsonFehlerAlert: 'Datei konnte nicht gelesen werden: kein gültiges JSON.',
            importLesefehlerAlert: 'Datei konnte nicht gelesen werden.',
            importErgebnis: (importiert, uebersprungen) => {
                const teile = [`${importiert} Artikel importiert`];
                if (uebersprungen > 0) teile.push(`${uebersprungen} bereits vorhanden übersprungen`);
                return teile.join(', ') + '.';
            }
        },
        en: {
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
            ariaLang: 'Switch language',
            ariaListeWechseln: 'Switch list',
            ariaListeAnlegen: 'Create list',
            ariaUmbenennen: 'Rename',
            placeholderNeueListe: 'New list...',
            confirmListeLoeschen: (name) => `Delete "${name}"?`,
            ariaMengeVerringern: 'Decrease quantity',
            ariaMengeErhoehen: 'Increase quantity',
            ariaExport: 'Export list',
            ariaImport: 'Import list',
            ariaShareApp: 'Share app via QR code',
            qrDialogTitle: 'Share app',
            qrDialogText: 'Scan this code to open the app.',
            btnSchliessen: 'Close',
            exportLeerAlert: 'Your list is empty – there is nothing to export.',
            importUngueltigAlert: 'This file does not contain a valid shopping list.',
            importJsonFehlerAlert: 'Could not read file: invalid JSON.',
            importLesefehlerAlert: 'Could not read file.',
            importErgebnis: (importiert, uebersprungen) => {
                const teile = [`${importiert} item${importiert === 1 ? '' : 's'} imported`];
                if (uebersprungen > 0) teile.push(`${uebersprungen} already present, skipped`);
                return teile.join(', ') + '.';
            }
        }
    };

    function t(key) {
        return STRINGS[state.lang][key];
    }

    // ==========================================
    // State
    // ==========================================
    
    let state = {
        // Mehrere benannte Listen: [{ id, name, items: [...] }]
        listen: [],
        aktiveListeId: null,
        // Kaufhistorie ist listenübergreifend: { name -> { count, emoji, kategorie } }
        history: {},
        darkMode: false,
        lang: 'de'
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
        btnNeueListe: document.getElementById('btn-neue-liste'),
        btnExport: document.getElementById('btn-export'),
        btnImport: document.getElementById('btn-import'),
        inputImportFile: document.getElementById('input-import-file'),
        btnLang: document.getElementById('btn-lang'),
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
        dialogTextEl: document.getElementById('dialog-text'),
        btnShareApp: document.getElementById('btn-share-app'),
        qrDialogOverlay: document.getElementById('qr-dialog-overlay'),
        qrDialogTitleEl: document.getElementById('qr-dialog-title'),
        qrDialogTextEl: document.getElementById('qr-dialog-text'),
        qrCanvas: document.getElementById('qr-canvas'),
        qrUrlText: document.getElementById('qr-url'),
        btnCloseQr: document.getElementById('btn-close-qr')
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
            const parsed = saved ? JSON.parse(saved) : null;

            if (parsed && Array.isArray(parsed.listen) && parsed.listen.length > 0) {
                // Migration: menge-Feld nachziehen + evtl. noch deutsche Kategorie-Strings auf Schlüssel abbilden
                state.listen = parsed.listen.map(liste => ({
                    ...liste,
                    items: (liste.items || []).map(a => ({ menge: 1, ...a, kategorie: migriereKategorie(a.kategorie) }))
                }));
                state.aktiveListeId = parsed.listen.some(l => l.id === parsed.aktiveListeId)
                    ? parsed.aktiveListeId
                    : parsed.listen[0].id;
            } else if (parsed && Array.isArray(parsed.liste)) {
                // Migration: Daten von vor dem Mehrere-Listen-Feature (eine namenlose Liste),
                // dabei zugleich menge-Feld und Kategorie-Schlüssel auf älteren Artikeln nachziehen
                const id = generateId();
                state.listen = [{
                    id,
                    name: 'Einkaufsliste',
                    items: parsed.liste.map(a => ({ menge: 1, ...a, kategorie: migriereKategorie(a.kategorie) }))
                }];
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
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({ darkMode: state.darkMode, lang: state.lang }));
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

        // headerPlanenTitle zeigt den Namen der aktiven Liste (siehe renderPlanenListe),
        // keinen statischen Bildschirmtitel - der wird hier bewusst nicht überschrieben.
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
        elements.btnListePicker?.setAttribute('aria-label', t('ariaListeWechseln'));
        elements.btnNeueListe?.setAttribute('aria-label', t('ariaListeAnlegen'));
        if (elements.inputNeueListe) elements.inputNeueListe.placeholder = t('placeholderNeueListe');
        elements.btnExport?.setAttribute('aria-label', t('ariaExport'));
        elements.btnImport?.setAttribute('aria-label', t('ariaImport'));
        elements.btnShareApp?.setAttribute('aria-label', t('ariaShareApp'));
        setText(elements.qrDialogTitleEl, t('qrDialogTitle'));
        setText(elements.qrDialogTextEl, t('qrDialogText'));
        setText(elements.btnCloseQr, t('btnSchliessen'));

        renderPlanenListe();
        if (elements.screenEinkauf.classList.contains('active')) {
            renderEinkaufListe();
        }
        if (elements.listenDropdown?.classList.contains('active')) {
            renderListenDropdown();
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
            kategorie: info ? info.kategorie : 'sonstiges',
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
    // Export & Import
    // ==========================================

    /**
     * Exportiert die aktuelle Liste als JSON-Datei (Datei-Download).
     */
    function exportListe() {
        const items = aktiveListe().items;
        if (items.length === 0) {
            alert(t('exportLeerAlert'));
            return;
        }

        const payload = {
            app: 'einkaufsliste',
            version: 1,
            exportedAt: new Date().toISOString(),
            listeName: aktiveListe().name,
            liste: items.map(a => ({ name: a.name, emoji: a.emoji, kategorie: a.kategorie, menge: a.menge }))
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `einkaufsliste_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    /**
     * Führt eine importierte Liste mit der bestehenden zusammen.
     * Artikel mit bereits vorhandenem Namen werden übersprungen.
     */
    function importListe(data) {
        if (!data || !Array.isArray(data.liste)) {
            alert(t('importUngueltigAlert'));
            return;
        }

        const items = aktiveListe().items;
        const bekannteNamen = new Set(items.map(a => a.name.toLowerCase()));
        let importiert = 0;
        let uebersprungen = 0;

        data.liste.forEach(item => {
            if (!item || typeof item.name !== 'string' || !item.name.trim()) return;
            const name = item.name.trim();
            const key = name.toLowerCase();
            if (bekannteNamen.has(key)) {
                uebersprungen++;
                return;
            }
            items.push({
                id: generateId(),
                name,
                emoji: typeof item.emoji === 'string' && item.emoji ? item.emoji : '🛒',
                kategorie: typeof item.kategorie === 'string' && item.kategorie ? item.kategorie : 'sonstiges',
                menge: Number.isInteger(item.menge) ? Math.min(MENGE_MAX, Math.max(MENGE_MIN, item.menge)) : 1,
                checked: false
            });
            bekannteNamen.add(key);
            importiert++;
        });

        saveData();
        renderPlanenListe();

        alert(t('importErgebnis')(importiert, uebersprungen));
    }

    function handleImportFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                importListe(JSON.parse(reader.result));
            } catch (e) {
                alert(t('importJsonFehlerAlert'));
            }
        };
        reader.onerror = () => alert(t('importLesefehlerAlert'));
        reader.readAsText(file);
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
                    <button class="listen-item-icon" data-action="umbenennen" aria-label="${t('ariaUmbenennen')}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                        </svg>
                    </button>
                    <button class="listen-item-icon" data-action="loeschen" aria-label="${t('ariaLoeschen')}" ${state.listen.length <= 1 ? 'disabled' : ''}>
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
                        <button class="menge-btn" data-delta="-1" aria-label="${t('ariaMengeVerringern')}" ${artikel.menge <= MENGE_MIN ? 'disabled' : ''}>−</button>
                        <span class="menge-value">${artikel.menge}</span>
                        <button class="menge-btn" data-delta="1" aria-label="${t('ariaMengeErhoehen')}" ${artikel.menge >= MENGE_MAX ? 'disabled' : ''}>+</button>
                    </div>
                    <button class="btn-delete" data-id="${artikel.id}" aria-label="${t('ariaLoeschen')}">
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
        aktiveListe().items = [];
        saveData();
        hideDialog();
        renderPlanenListe();
        showScreen('planen');
    }

    // ==========================================
    // App per QR-Code teilen
    // ==========================================

    /**
     * Zeichnet einen QR-Code für die aktuelle App-URL auf ein Canvas und legt
     * das App-Icon mittig darüber. Fehlerkorrektur-Level 'H' verkraftet bis zu
     * ~30% verdeckte Fläche, ein zentrales Logo bleibt also problemlos scanbar.
     */
    function renderAppQrCode(url) {
        const canvas = elements.qrCanvas;
        if (!canvas || typeof qrcode === 'undefined') return;

        const qr = qrcode(0, 'H');
        qr.addData(url);
        qr.make();

        // Ruhezone: Scanner brauchen mindestens 4 Module weißen Rand rundherum,
        // sonst wird der Code oft gar nicht erst als QR-Code erkannt.
        const QUIET_ZONE_MODULES = 4;
        const moduleCount = qr.getModuleCount();
        const cellSize = Math.max(4, Math.floor(280 / (moduleCount + QUIET_ZONE_MODULES * 2)));
        const quietZonePx = QUIET_ZONE_MODULES * cellSize;
        const size = moduleCount * cellSize + quietZonePx * 2;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000000';
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    ctx.fillRect(quietZonePx + col * cellSize, quietZonePx + row * cellSize, cellSize, cellSize);
                }
            }
        }

        const logo = new Image();
        logo.onload = () => {
            const logoSize = size * 0.22;
            const pad = logoSize * 0.14;
            const x = (size - logoSize) / 2;
            const y = (size - logoSize) / 2;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);
            ctx.drawImage(logo, x, y, logoSize, logoSize);
        };
        logo.src = 'icons/icon-192.png';
    }

    function showQrDialog() {
        const url = location.origin + location.pathname;
        elements.qrUrlText.textContent = url;
        renderAppQrCode(url);
        elements.qrDialogOverlay.classList.add('active');
    }

    function hideQrDialog() {
        elements.qrDialogOverlay.classList.remove('active');
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
                if (liste && confirm(t('confirmListeLoeschen')(liste.name))) {
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

        // App per QR-Code teilen
        elements.btnShareApp?.addEventListener('click', showQrDialog);
        elements.btnCloseQr?.addEventListener('click', hideQrDialog);
        elements.qrDialogOverlay?.addEventListener('click', (e) => {
            if (e.target === elements.qrDialogOverlay) hideQrDialog();
        });

        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                showScreen(item.dataset.screen);
            });
        });
        
        // Dark Mode Toggle (Einstellungen-Button → wird zur Sonne/Mond)
        elements.btnSettings?.addEventListener('click', toggleDarkMode);

        // Liste exportieren / importieren
        elements.btnExport?.addEventListener('click', exportListe);
        elements.btnImport?.addEventListener('click', () => elements.inputImportFile.click());
        elements.inputImportFile?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImportFile(file);
            e.target.value = '';
        });

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
        setupEventListeners();
        registerServiceWorker();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();