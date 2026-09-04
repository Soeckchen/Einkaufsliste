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
        liste: [],
        currentScreen: 'planen',
        // Kaufhistorie: { name -> { count, emoji, kategorie } }
        history: {},
        darkMode: false
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
        autocompleteList: document.getElementById('autocomplete-list')
    };

    // ==========================================
    // LocalStorage
    // ==========================================
    
    function loadData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                state.liste = parsed.liste || [];
            }
        } catch (e) {
            console.error('Fehler beim Laden:', e);
            state.liste = [];
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
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({ darkMode: state.darkMode }));
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
        const q = query.toLowerCase().trim();
        const inListe = new Set(state.liste.map(a => a.name.toLowerCase()));

        const results = [];
        const seen = new Set();

        // 1. Aus Kaufhistorie (sortiert nach count)
        getHistorySorted().forEach(item => {
            const key = item.name.toLowerCase();
            if (key.includes(q) && !inListe.has(key) && !seen.has(key)) {
                results.push({ ...item, fromHistory: true });
                seen.add(key);
            }
        });

        // 2. Aus Standard-Artikeln
        STANDARD_ARTIKEL.forEach(artikel => {
            const key = artikel.name.toLowerCase();
            if (key.includes(q) && !inListe.has(key) && !seen.has(key)) {
                results.push({ ...artikel, count: 0, fromHistory: false });
                seen.add(key);
            }
        });

        return results.slice(0, 6);
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
    
    function findArtikelInfo(name) {
        const normalized = name.toLowerCase().trim();
        // Zuerst in History suchen (enthält echte Nutzerdaten)
        if (state.history[normalized]) {
            const h = state.history[normalized];
            return { name: h.name, emoji: h.emoji, kategorie: h.kategorie };
        }
        return STANDARD_ARTIKEL.find(a => a.name.toLowerCase() === normalized);
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
            id: Date.now(),
            name: info ? info.name : trimmed,
            emoji: info ? info.emoji : '🛒',
            kategorie: info ? info.kategorie : 'Sonstiges',
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

        // Aus History (häufigste zuerst)
        const fromHistory = getHistorySorted()
            .filter(a => !inListe.has(a.name.toLowerCase()))
            .slice(0, 8);

        // Wenn History leer: Standard-Artikel als Fallback
        let chips = fromHistory;
        if (chips.length < 8) {
            const seen = new Set(chips.map(a => a.name.toLowerCase()));
            const fallback = STANDARD_ARTIKEL
                .filter(a => !inListe.has(a.name.toLowerCase()) && !seen.has(a.name.toLowerCase()))
                .slice(0, 8 - chips.length);
            chips = [...chips, ...fallback];
        }

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
        
        elements.progressCount.textContent = `${checked} von ${total} erledigt`;
        elements.progressFill.style.width = `${percent}%`;
    }

    // ==========================================
    // Navigation
    // ==========================================
    
    function showScreen(screenName) {
        state.currentScreen = screenName;
        
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
                const id = parseInt(deleteBtn.dataset.id);
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
                const id = parseInt(item.dataset.id);
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