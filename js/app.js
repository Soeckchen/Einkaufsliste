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
        currentScreen: 'planen'
    };

    // ==========================================
    // DOM Elemente
    // ==========================================
    
    const elements = {
        // Screens
        screenPlanen: document.getElementById('screen-planen'),
        screenEinkauf: document.getElementById('screen-einkauf'),
        
        // Planen
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
        
        // Einkauf
        btnBack: document.getElementById('btn-back'),
        progressCount: document.getElementById('progress-count'),
        progressFill: document.getElementById('progress-fill'),
        einkaufKategorien: document.getElementById('einkauf-kategorien'),
        btnAbschliessen: document.getElementById('btn-abschliessen'),
        
        // Dialog
        dialogOverlay: document.getElementById('dialog-overlay'),
        btnConfirmAbschluss: document.getElementById('btn-confirm-abschluss'),
        btnCancelAbschluss: document.getElementById('btn-cancel-abschluss'),
        
        // Navigation
        navItems: document.querySelectorAll('.nav-item'),
        
        // Voice
        btnVoice: document.getElementById('btn-voice')
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
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                liste: state.liste
            }));
        } catch (e) {
            console.error('Fehler beim Speichern:', e);
        }
    }

    // ==========================================
    // Artikel Funktionen
    // ==========================================
    
    function findArtikelInfo(name) {
        const normalized = name.toLowerCase().trim();
        return STANDARD_ARTIKEL.find(a => a.name.toLowerCase() === normalized);
    }

    function addArtikel(name) {
        const trimmed = name.trim();
        if (!trimmed) return false;
        
        // Prüfen ob bereits vorhanden
        const exists = state.liste.some(a => a.name.toLowerCase() === trimmed.toLowerCase());
        if (exists) {
            // Visuelles Feedback
            const existingItem = document.querySelector(`[data-name="${trimmed.toLowerCase()}"]`);
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
    
    function renderChips() {
        // Zeige nur Chips die noch nicht in der Liste sind
        const inListe = new Set(state.liste.map(a => a.name.toLowerCase()));
        const verfuegbar = STANDARD_ARTIKEL.filter(a => !inListe.has(a.name.toLowerCase()));
        
        elements.chipsContainer.innerHTML = verfuegbar.slice(0, 8).map(artikel => `
            <button class="chip" data-name="${artikel.name}">
                ${artikel.name}
            </button>
        `).join('');
    }

    function renderPlanenListe() {
        const hasItems = state.liste.length > 0;
        
        // UI States
        elements.emptyState.style.display = hasItems ? 'none' : 'flex';
        elements.sectionListe.style.display = hasItems ? 'block' : 'none';
        elements.ctaPlanen.style.display = hasItems ? 'block' : 'none';
        elements.screenPlanen.classList.toggle('has-items', hasItems);
        
        // Liste rendern
        elements.artikelListe.innerHTML = state.liste.map(artikel => `
            <li class="artikel-item" data-name="${artikel.name.toLowerCase()}">
                <div class="artikel-item-left">
                    <div class="artikel-icon">${artikel.emoji}</div>
                    <span class="artikel-name">${artikel.name}</span>
                </div>
                <button class="btn-delete" data-id="${artikel.id}" aria-label="Löschen">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </li>
        `).join('');
        
        // Chips aktualisieren
        renderChips();
    }

    function renderEinkaufListe() {
        // Nach Kategorie gruppieren
        const grouped = {};
        KATEGORIE_REIHENFOLGE.forEach(k => grouped[k] = []);
        
        state.liste.forEach(artikel => {
            const kat = artikel.kategorie || 'Sonstiges';
            if (!grouped[kat]) grouped[kat] = [];
            grouped[kat].push(artikel);
        });
        
        // Leere Kategorien entfernen
        const nonEmpty = KATEGORIE_REIHENFOLGE.filter(k => grouped[k]?.length > 0);
        
        elements.einkaufKategorien.innerHTML = nonEmpty.map(kategorie => `
            <div class="kategorie-section">
                <h3 class="kategorie-title">${kategorie}</h3>
                <ul class="einkauf-liste">
                    ${grouped[kategorie].map(artikel => `
                        <li class="einkauf-item ${artikel.checked ? 'checked' : ''}" data-id="${artikel.id}">
                            <div class="checkbox">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div class="einkauf-item-content">
                                <span class="einkauf-item-name">${artikel.name}</span>
                            </div>
                        </li>
                    `).join('')}
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
        
        // Screens
        elements.screenPlanen.classList.toggle('active', screenName === 'planen');
        elements.screenEinkauf.classList.toggle('active', screenName === 'einkauf');
        
        // Navigation
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.screen === screenName);
        });
        
        // Einkauf Screen initialisieren
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
        });
        
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
            // Alle Checks zurücksetzen
            state.liste.forEach(a => a.checked = false);
            saveData();
            showScreen('einkauf');
        });
        
        // Vorschläge Button
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
        
        // Dialog Overlay klicken
        elements.dialogOverlay.addEventListener('click', (e) => {
            if (e.target === elements.dialogOverlay) {
                hideDialog();
            }
        });
        
        // Navigation
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                showScreen(item.dataset.screen);
            });
        });
        
        // Voice Button (Platzhalter für zukünftige Spracheingabe)
        elements.btnVoice?.addEventListener('click', () => {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                startVoiceInput();
            } else {
                alert('Spracheingabe wird von diesem Browser nicht unterstützt.');
            }
        });
    }

    // ==========================================
    // Voice Input (Optional)
    // ==========================================
    
    function startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
        
        recognition.onerror = () => {
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
                .catch(err => console.log('SW Registrierung fehlgeschlagen:', err));
        }
    }

    // ==========================================
    // Init
    // ==========================================
    
    function init() {
        loadData();
        renderChips();
        renderPlanenListe();
        setupEventListeners();
        registerServiceWorker();
    }

    // DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
