// footer.js - VERSIONE DEFINITIVA CON SINCRONIZZAZIONE FORZATA
document.addEventListener('DOMContentLoaded', function() {
    // Crea l'elemento footer
    const footer = document.createElement('footer');
    footer.className = 'footer';
    
    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-text">
                <strong>PalermoHub</strong> è una piattaforma dedicata alla visualizzazione e condivisione di mappe e dati geografici open data.<br>
                Un progetto per rendere accessibili i dati territoriali di Palermo e della Sicilia.<br>
                Esplora, analizza e scopri il territorio attraverso mappe interattive e dati aperti.
            </div>
            
            <!-- RICERCA MAPPE INTELLIGENTE -->
            <div class="footer-map-search">
                <div class="search-header">
                    <i class="fas fa-search"></i>
                    <label for="footer-map-search-input">Cerca una mappa:</label>
                </div>
                <div class="search-container">
                    <div class="search-input-wrapper">
                        <input type="text" 
                               id="footer-map-search-input" 
                               class="footer-search-input" 
                               placeholder="Digita il nome della mappa..."
                               autocomplete="off"
                               autocorrect="off"
                               spellcheck="false">
                        <button id="footer-search-clear" class="footer-search-clear" title="Pulisci ricerca">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="maps-counter" id="footer-maps-counter">Caricamento dati...</div>
                </div>
                
                <!-- Suggerimenti dropdown -->
                <div id="footer-search-suggestions" class="footer-search-suggestions">
                    <div class="suggestions-list" id="footer-suggestions-list">
                        <!-- Suggerimenti popolati dinamicamente -->
                    </div>
                </div>
            </div>
            
            <div class="footer-social">
                <div class="social-buttons">
                    <a href="#" class="social-btn facebook" title="Condividi su Facebook" onclick="shareOnFacebook()">
                        <i class="fa-brands fa-facebook-f"></i>
                    </a>
                    <a href="#" class="social-btn twitter" title="Condividi su X (Twitter)" onclick="shareOnTwitter()">
                        <i class="fa-brands fa-x-twitter"></i>
                    </a>
                    <a href="#" class="social-btn telegram" title="Condividi su Telegram" onclick="shareOnTelegram()">
                        <i class="fa-brands fa-telegram"></i>
                    </a>
                    <a href="#" class="social-btn whatsapp" title="Condividi su WhatsApp" onclick="shareOnWhatsApp()">
                        <i class="fa-brands fa-whatsapp"></i>
                    </a>
                    <a href="#" class="social-btn bluesky" title="Condividi su Bluesky" onclick="shareOnBluesky()">
                        <i class="fa-brands fa-bluesky"></i>
                    </a>
                    <a href="https://groups.google.com/g/opendatasicilia?pli=1" class="social-btn bluesky" title="mailing list OpenDataSicilia.it" target="_blank">
                        <i class="fa fa-envelope"></i>
                    </a>
                </div>
            </div>
            <div class="footer-credits">
                <strong>Autore</strong> <a href="https://opendatasicilia.it" title="@opendatasicilia" target="_blank">@opendatasicilia</a><br>
                <strong>Sviluppo:</strong> <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - <a href="https://claude.ai" target="_blank">Claude AI (Anthropic)</a><br>
                <strong>Licenza:</strong> <a href="https://creativecommons.org/licenses/by-sa/4.0/" title="Attribuzione-CondividiAlloStessoModo 4.0 Internazionale" target="_blank">CC BY-SA 4.0</a><br>
                <a href="#" onclick="showPrivacySettings()" style="text-decoration: underline; color: var(--primary-color);">Gestisci Privacy</a>               
            </div>
        </div>
    `;
    
    // Inserisci il footer alla fine del body
    document.body.appendChild(footer);

    // Carica Font Awesome 7 se non è già presente
    if (!document.querySelector('link[href*="fontawesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
    
    // Inizializza il popup privacy
    initPrivacyPopup();
    
    // Inizializza la ricerca mappe intelligente
    initFooterMapSearch();
});

// ========================================
// FOOTER MAP SEARCH SYSTEM - SOLUZIONE DEFINITIVA
// ========================================

let footerSearchTimeout = null;
let footerSelectedIndex = -1;
let footerSearchResults = [];
let footerAllMaps = [];
let footerDataCheckInterval = null;

// SISTEMA DI SINCRONIZZAZIONE FORZATA
function initFooterMapSearch() {
    console.log('🚀 Footer Search: Inizializzazione sistema...');
    
    // Setup eventi subito
    setupFooterSearchEvents();
    
    // STRATEGIA 1: Controllo immediato
    tryImmediateSync();
    
    // STRATEGIA 2: Polling aggressivo
    startDataPolling();
    
    // STRATEGIA 3: Listener eventi globali
    setupGlobalListeners();
    
    // STRATEGIA 4: Intercettazione diretta
    interceptWindowAllMaps();
}

// STRATEGIA 1: Controllo immediato dei dati
function tryImmediateSync() {
    console.log('🎯 Footer: Tentativo sincronizzazione immediata...');
    
    if (window.allMaps && Array.isArray(window.allMaps) && window.allMaps.length > 0) {
        console.log(`✅ Footer: Dati immediatamente disponibili (${window.allMaps.length} mappe)`);
        syncFooterData(window.allMaps);
        return true;
    }
    
    // Controlla anche variabili globali alternative
    if (window.filteredMaps && Array.isArray(window.filteredMaps) && window.filteredMaps.length > 0) {
        console.log(`✅ Footer: Dati trovati in filteredMaps (${window.filteredMaps.length} mappe)`);
        syncFooterData(window.filteredMaps);
        return true;
    }
    
    console.log('⚠️ Footer: Nessun dato immediato trovato');
    return false;
}

// STRATEGIA 2: Polling aggressivo
function startDataPolling() {
    console.log('⏰ Footer: Avvio polling dati...');
    
    let attempts = 0;
    const maxAttempts = 60; // 60 secondi
    
    footerDataCheckInterval = setInterval(() => {
        attempts++;
        
        // Controlla window.allMaps
        if (window.allMaps && Array.isArray(window.allMaps) && window.allMaps.length > 0) {
            console.log(`✅ Footer: Dati trovati via polling (tentativo ${attempts}, ${window.allMaps.length} mappe)`);
            syncFooterData(window.allMaps);
            clearInterval(footerDataCheckInterval);
            return;
        }
        
        // Controlla cache localStorage
        try {
            const cached = localStorage.getItem('palermoHubCSVData');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
                    console.log(`✅ Footer: Dati trovati in cache (${parsed.data.length} mappe)`);
                    syncFooterData(parsed.data);
                    clearInterval(footerDataCheckInterval);
                    return;
                }
            }
        } catch (e) {
            // Ignora errori cache
        }
        
        // Log periodico
        if (attempts % 10 === 0) {
            console.log(`⏰ Footer: Polling tentativo ${attempts}/${maxAttempts}`);
        }
        
        // Stop dopo 60 tentativi
        if (attempts >= maxAttempts) {
            console.log('❌ Footer: Polling timeout, carico direttamente CSV');
            clearInterval(footerDataCheckInterval);
            loadCSVDirectly();
        }
    }, 1000);
}

// STRATEGIA 3: Listener eventi globali
function setupGlobalListeners() {
    // Listener evento personalizzato
    document.addEventListener('mapsDataLoaded', function(event) {
        console.log('📡 Footer: Ricevuto evento mapsDataLoaded', event.detail);
        if (event.detail && event.detail.maps && event.detail.maps.length > 0) {
            syncFooterData(event.detail.maps);
        }
    });
    
    // Listener per quando window.allMaps cambia
    let lastKnownLength = 0;
    const checkWindowAllMaps = () => {
        if (window.allMaps && window.allMaps.length !== lastKnownLength) {
            lastKnownLength = window.allMaps.length;
            if (lastKnownLength > 0) {
                console.log(`📊 Footer: Rilevato cambio window.allMaps (${lastKnownLength} mappe)`);
                syncFooterData(window.allMaps);
            }
        }
    };
    
    // Controlla ogni 2 secondi
    setInterval(checkWindowAllMaps, 2000);
}

// STRATEGIA 4: Intercettazione diretta
function interceptWindowAllMaps() {
    // Intercetta assegnazioni a window.allMaps
    let originalAllMaps = null;
    
    Object.defineProperty(window, '_allMaps', {
        get: function() {
            return originalAllMaps;
        },
        set: function(value) {
            originalAllMaps = value;
            if (value && Array.isArray(value) && value.length > 0) {
                console.log(`🔄 Footer: Intercettato window.allMaps assignment (${value.length} mappe)`);
                setTimeout(() => syncFooterData(value), 100);
            }
        }
    });
    
    // Sostituisci window.allMaps con property interceptor
    if (window.allMaps) {
        window._allMaps = window.allMaps;
    }
    
    Object.defineProperty(window, 'allMaps', {
        get: function() {
            return window._allMaps;
        },
        set: function(value) {
            window._allMaps = value;
        }
    });
}

// FUNZIONE PRINCIPALE: Sincronizza dati footer
// Modifica la funzione syncFooterData
function syncFooterData(mapsData) {
    if (!mapsData || !Array.isArray(mapsData) || mapsData.length === 0) {
        console.log('⚠️ Footer: Dati invalidi ricevuti per sync');
        return;
    }
    
    console.log(`🔄 Footer: Sincronizzazione in corso (${mapsData.length} mappe)...`);
    
    // Filtra dati validi
    footerAllMaps = mapsData.filter(map => 
        map && typeof map === 'object' && map.titolo && map.titolo.trim()
    );
    
    console.log(`✅ Footer: ${footerAllMaps.length} mappe valide sincronizzate`);
    
    // DEBUG: mostra gli URL delle prime 5 mappe
    if (footerAllMaps.length > 0) {
        console.log('🔍 Footer: URL delle prime 5 mappe:');
        footerAllMaps.slice(0, 5).forEach((map, i) => {
            console.log(`${i+1}. "${map.titolo}" -> URL: "${map.url || map.URL}"`);
        });
    }
    
    // Aggiorna contatore
    updateFooterMapsCounter();
    
    // Stop polling se attivo
    if (footerDataCheckInterval) {
        clearInterval(footerDataCheckInterval);
        footerDataCheckInterval = null;
    }
    
    // Trigger evento di successo
    document.dispatchEvent(new CustomEvent('footerSearchReady', {
        detail: { count: footerAllMaps.length }
    }));
    
    console.log('🎉 Footer: Sincronizzazione completata!');
}

// FALLBACK: Carica CSV direttamente
async function loadCSVDirectly() {
    console.log('📥 Footer: Caricamento diretto CSV...');
    
    try {
        const response = await fetch('dati-palermo-hub/palermo-hub.csv');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const csvText = await response.text();
        
        // Parse CSV con PapaParse
        if (typeof Papa !== 'undefined') {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    const data = results.data.filter(row => row.titolo && row.titolo.trim());
                    console.log(`📊 Footer: CSV caricato direttamente (${data.length} mappe)`);
                    syncFooterData(data);
                },
                error: function(error) {
                    console.error('❌ Footer: Errore parsing CSV:', error);
                }
            });
        } else {
            console.error('❌ Footer: PapaParse non disponibile');
        }
    } catch (error) {
        console.error('❌ Footer: Errore caricamento CSV:', error);
        updateFooterMapsCounter('Errore caricamento');
    }
}

// Setup eventi di ricerca
function setupFooterSearchEvents() {
    console.log('🎛️ Footer: Setup eventi ricerca...');
    
    const searchInput = document.getElementById('footer-map-search-input');
    const clearBtn = document.getElementById('footer-search-clear');
    const searchWrapper = document.querySelector('.search-input-wrapper');
    
    if (!searchInput) {
        console.error('❌ Footer: Input ricerca non trovato');
        return;
    }
    
    // Event listeners
    searchInput.addEventListener('input', handleFooterSearchInput);
    searchInput.addEventListener('keydown', handleFooterSearchKeyboard);
    
    searchInput.addEventListener('focus', function() {
        searchWrapper?.classList.add('focused');
        if (searchInput.value.trim()) {
            showFooterSuggestions();
        }
    });
    
    searchInput.addEventListener('blur', function() {
        searchWrapper?.classList.remove('focused');
        setTimeout(() => hideFooterSuggestions(), 150);
    });
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFooterSearch);
    }
    
    // Chiudi suggerimenti cliccando fuori
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.footer-map-search')) {
            hideFooterSuggestions();
        }
    });
    
    console.log('✅ Footer: Eventi ricerca configurati');
}

// Gestisce input ricerca
function handleFooterSearchInput(event) {
    const query = event.target.value.trim();
    const clearBtn = document.getElementById('footer-search-clear');
    
    console.log(`🔍 Footer: Ricerca "${query}" (dati disponibili: ${footerAllMaps.length})`);
    
    if (clearBtn) {
        clearBtn.classList.toggle('visible', query.length > 0);
    }
    
    if (footerSearchTimeout) {
        clearTimeout(footerSearchTimeout);
    }
    
    if (query.length < 2) {
        hideFooterSuggestions();
        return;
    }
    
    // Verifica dati disponibili
    if (!footerAllMaps || footerAllMaps.length === 0) {
        console.log('⚠️ Footer: Nessun dato per ricerca, mostro messaggio attesa');
        showWaitingMessage(query);
        
        // Riprova sync
        tryImmediateSync();
        return;
    }
    
    footerSearchTimeout = setTimeout(() => {
        performFooterSearch(query);
    }, 200);
}

// Mostra messaggio di attesa
function showWaitingMessage(query) {
    const suggestionsContainer = document.getElementById('footer-search-suggestions');
    const suggestionsList = document.getElementById('footer-suggestions-list');
    
    if (!suggestionsContainer || !suggestionsList) return;
    
    suggestionsList.innerHTML = `
        <div class="no-results">
            <i class="fas fa-clock"></i>
            <span>Caricamento dati in corso...</span>
            <small>La ricerca sarà disponibile tra poco</small>
        </div>
    `;
    
    showFooterSuggestions();
}

// Esegue ricerca
function performFooterSearch(query) {
    console.log(`🎯 Footer: Ricerca "${query}" su ${footerAllMaps.length} mappe`);
    
    if (!footerAllMaps || footerAllMaps.length === 0) {
        showWaitingMessage(query);
        return;
    }
    
    const queryLower = query.toLowerCase();
    footerSelectedIndex = -1;
    
    footerSearchResults = footerAllMaps
        .map(map => {
            let score = 0;
            let matchType = '';
            
            // Ricerca nei campi
            const searchFields = [
                { field: 'titolo', weight: 10, label: 'Titolo' },
                { field: 'descrizione', weight: 5, label: 'Descrizione' },
                { field: 'territorio', weight: 7, label: 'Territorio' },
                { field: 'categoria', weight: 6, label: 'Categoria' },
                { field: 'collaborazione', weight: 4, label: 'Autore' },
                { field: 'tag', weight: 3, label: 'Tag' }
            ];
            
            for (const { field, weight, label } of searchFields) {
                const value = map[field];
                if (value && typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
                    score += weight;
                    if (!matchType) matchType = label;
                    
                    // Bonus per match esatto all'inizio
                    if (value.toLowerCase().startsWith(queryLower)) {
                        score += weight * 0.5;
                    }
                }
            }
            
            return score > 0 ? { map, score, matchType } : null;
        })
        .filter(result => result !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    
    console.log(`🎯 Footer: Trovati ${footerSearchResults.length} risultati`);
    
    displayFooterSuggestions(query);
}

// Mostra suggerimenti
function displayFooterSuggestions(query) {
    const suggestionsContainer = document.getElementById('footer-search-suggestions');
    const suggestionsList = document.getElementById('footer-suggestions-list');
    
    if (!suggestionsContainer || !suggestionsList) return;
    
    if (footerSearchResults.length === 0) {
        suggestionsList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <span>Nessuna mappa trovata per "<strong>${escapeHtml(query)}</strong>"</span>
                <small>Prova con termini diversi</small>
            </div>
        `;
    } else {
        suggestionsList.innerHTML = footerSearchResults.map((result, index) => {
            const { map, matchType } = result;
            const highlightedTitle = highlightSearchTerm(map.titolo || '', query);
            
            const infoElements = [];
            if (map.territorio) infoElements.push(map.territorio.split(',')[0].trim());
            if (map.anno) infoElements.push(map.anno);
            const info = infoElements.join(' • ');
            
            return `
                <div class="suggestion-item" data-index="${index}" onclick="selectFooterSuggestion(${index})">
                    <div class="suggestion-content">
                        <div class="suggestion-title">${highlightedTitle}</div>
                        <div class="suggestion-meta">
                            <span class="match-type">${matchType}</span>
                            ${info ? `<span class="suggestion-info">${escapeHtml(info)}</span>` : ''}
                        </div>
                    </div>
                    <div class="suggestion-arrow">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    showFooterSuggestions();
}

// Utility functions
function highlightSearchTerm(text, query) {
    if (!text || !query) return escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Navigazione tastiera
function handleFooterSearchKeyboard(event) {
    const suggestionsVisible = document.getElementById('footer-search-suggestions')?.classList.contains('visible');
    
    if (!suggestionsVisible || footerSearchResults.length === 0) return;
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            footerSelectedIndex = Math.min(footerSelectedIndex + 1, footerSearchResults.length - 1);
            updateFooterSelection();
            break;
        case 'ArrowUp':
            event.preventDefault();
            footerSelectedIndex = Math.max(footerSelectedIndex - 1, -1);
            updateFooterSelection();
            break;
        case 'Enter':
            event.preventDefault();
            if (footerSelectedIndex >= 0) {
                selectFooterSuggestion(footerSelectedIndex);
            }
            break;
        case 'Escape':
            event.preventDefault();
            hideFooterSuggestions();
            break;
    }
}

function updateFooterSelection() {
    const items = document.querySelectorAll('#footer-suggestions-list .suggestion-item');
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === footerSelectedIndex);
    });
    
    if (footerSelectedIndex >= 0 && items[footerSelectedIndex]) {
        items[footerSelectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

function selectFooterSuggestion(index) {
    if (index >= 0 && index < footerSearchResults.length) {
        const selectedMap = footerSearchResults[index].map;
        const mapUrl = selectedMap.url || selectedMap.URL;
        
        console.log(`🗺️ Footer: Navigazione a "${selectedMap.titolo}" (${mapUrl})`);
        
        if (mapUrl && mapUrl.trim()) {
            // Feedback visivo
            const searchInput = document.getElementById('footer-map-search-input');
            if (searchInput) {
                const originalPlaceholder = searchInput.placeholder;
                searchInput.placeholder = '🚀 Caricamento mappa...';
                setTimeout(() => {
                    searchInput.placeholder = originalPlaceholder;
                }, 3000);
            }
            
            // Naviga
            window.location.href = mapUrl.trim();
        } else {
            console.warn('⚠️ Footer: URL mappa non valido');
        }
    }
    
    hideFooterSuggestions();
    clearFooterSearch();
}

function showFooterSuggestions() {
    const container = document.getElementById('footer-search-suggestions');
    if (container) container.classList.add('visible');
}

function hideFooterSuggestions() {
    const container = document.getElementById('footer-search-suggestions');
    if (container) container.classList.remove('visible');
    footerSelectedIndex = -1;
}

function clearFooterSearch() {
    const searchInput = document.getElementById('footer-map-search-input');
    const clearBtn = document.getElementById('footer-search-clear');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    
    hideFooterSuggestions();
    footerSearchResults = [];
}

function updateFooterMapsCounter(customText = null) {
    const counter = document.getElementById('footer-maps-counter');
    if (!counter) return;
    
    if (customText) {
        counter.textContent = customText;
        return;
    }
    
    const count = footerAllMaps.length;
    counter.textContent = count > 0 
        ? `${count} mappe disponibili` 
        : 'Caricamento dati...';
    
    console.log(`📊 Footer: Contatore aggiornato - ${counter.textContent}`);
}

// Esporta funzioni globali
window.updateFooterMapData = function() {
    console.log('🔄 updateFooterMapData chiamata');
    tryImmediateSync();
};

window.loadFooterMapData = function() {
    console.log('🔄 loadFooterMapData chiamata');
    tryImmediateSync();
};

window.debugFooterSearch = function() {
    console.log('🔍 DEBUG Footer Search:', {
        footerAllMaps: footerAllMaps.length,
        windowAllMaps: window.allMaps ? window.allMaps.length : 'undefined',
        searchReady: footerAllMaps.length > 0,
        sampleMaps: footerAllMaps.slice(0, 3).map(m => m.titolo)
    });
};

// ========================================
// SISTEMA PRIVACY - CODICE ESISTENTE
// ========================================

let privacySettings = {
    necessary: true,
    analytics: false,
    social: false,
    functional: false
};

function initPrivacyPopup() {
    const savedSettings = getCookie('palermohub_privacy_settings');
    const consentGiven = getCookie('palermohub_privacy_consent');
    
    if (savedSettings) {
        privacySettings = JSON.parse(savedSettings);
        applyPrivacySettings();
    }
    
    if (!consentGiven) {
        setTimeout(() => {
            showPrivacyPopup();
        }, 1500);
    }
    
    createPrivacyPopup();
}

function createPrivacyPopup() {
    const popupHTML = `
        <div id="privacy-popup" class="privacy-popup" style="display: none;">
            <div class="privacy-backdrop"></div>
            <div class="privacy-content">
                <div class="privacy-header">
                    <i class="fa fa-shield-alt"></i>
                    <h3>Rispettiamo la tua Privacy</h3>
                    <button class="privacy-close" onclick="hidePrivacyPopup()">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
                
                <div class="privacy-body">
                    <p>PalermoHub utilizza cookie e tecnologie simili per migliorare la tua esperienza di navigazione. Puoi scegliere quali categorie di cookie accettare.</p>
                    
                    <div class="privacy-options">
                        <div class="privacy-option">
                            <div class="privacy-option-header">
                                <label class="privacy-switch">
                                    <input type="checkbox" checked disabled>
                                    <span class="privacy-slider"></span>
                                </label>
                                <strong>Cookie Necessari</strong>
                                <span class="privacy-required">Richiesti</span>
                            </div>
                            <p>Cookie essenziali per il funzionamento del sito web. Non possono essere disabilitati.</p>
                        </div>
                        
                        <div class="privacy-option">
                            <div class="privacy-option-header">
                                <label class="privacy-switch">
                                    <input type="checkbox" id="analytics-cookie">
                                    <span class="privacy-slider"></span>
                                </label>
                                <strong>Cookie Analitici</strong>
                            </div>
                            <p>Ci aiutano a capire come i visitatori interagiscono con il sito raccogliendo informazioni in forma anonima.</p>
                        </div>
                        
                        <div class="privacy-option">
                            <div class="privacy-option-header">
                                <label class="privacy-switch">
                                    <input type="checkbox" id="social-cookie">
                                    <span class="privacy-slider"></span>
                                </label>
                                <strong>Cookie Social Media</strong>
                            </div>
                            <p>Permettono di condividere contenuti sui social network e migliorano l'esperienza di condivisione.</p>
                        </div>
                        
                        <div class="privacy-option">
                            <div class="privacy-option-header">
                                <label class="privacy-switch">
                                    <input type="checkbox" id="functional-cookie">
                                    <span class="privacy-slider"></span>
                                </label>
                                <strong>Cookie Funzionali</strong>
                            </div>
                            <p>Migliorano le funzionalità del sito e la personalizzazione (es. lingua, preferenze utente).</p>
                        </div>
                    </div>
                </div>
                
                <div class="privacy-footer">
                    <button class="privacy-btn privacy-btn-secondary" onclick="acceptNecessaryOnly()">
                        Solo Necessari
                    </button>
                    <button class="privacy-btn privacy-btn-primary" onclick="acceptSelectedCookies()">
                        Accetta Selezionati
                    </button>
                    <button class="privacy-btn privacy-btn-success" onclick="acceptAllCookies()">
                        Accetta Tutti
                    </button>
                </div>
                
                <div class="privacy-links">
                    <a href="./info.html" onclick="showPrivacyPolicy()">Informativa Privacy</a>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    loadPrivacyCSS();
}

function showPrivacyPopup() {
    const popup = document.getElementById('privacy-popup');
    if (popup) {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        loadSavedPrivacySettings();
        setTimeout(() => {
            popup.classList.add('privacy-popup-show');
        }, 10);
    }
}

function hidePrivacyPopup() {
    const popup = document.getElementById('privacy-popup');
    if (popup) {
        popup.classList.remove('privacy-popup-show');
        document.body.style.overflow = '';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);
    }
}

function showPrivacySettings() {
    showPrivacyPopup();
}

function loadSavedPrivacySettings() {
    document.getElementById('analytics-cookie').checked = privacySettings.analytics;
    document.getElementById('social-cookie').checked = privacySettings.social;
    document.getElementById('functional-cookie').checked = privacySettings.functional;
}

function acceptNecessaryOnly() {
    privacySettings = {
        necessary: true,
        analytics: false,
        social: false,
        functional: false
    };
    
    savePrivacySettings();
    hidePrivacyPopup();
    showPrivacyNotification('Solo i cookie necessari sono stati abilitati.');
}

function acceptSelectedCookies() {
    privacySettings = {
        necessary: true,
        analytics: document.getElementById('analytics-cookie').checked,
        social: document.getElementById('social-cookie').checked,
        functional: document.getElementById('functional-cookie').checked
    };
    
    savePrivacySettings();
    hidePrivacyPopup();
    showPrivacyNotification('Le tue preferenze sui cookie sono state salvate.');
}

function acceptAllCookies() {
    privacySettings = {
        necessary: true,
        analytics: true,
        social: true,
        functional: true
    };
    
    savePrivacySettings();
    hidePrivacyPopup();
    showPrivacyNotification('Tutti i cookie sono stati abilitati.');
}

function savePrivacySettings() {
    setCookie('palermohub_privacy_settings', JSON.stringify(privacySettings), 365);
    setCookie('palermohub_privacy_consent', 'true', 365);
    applyPrivacySettings();
}

function applyPrivacySettings() {
    // Implementazione esistente
}

function showPrivacyNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'privacy-notification';
    notification.innerHTML = `
        <i class="fa fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('privacy-notification-show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('privacy-notification-show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function showPrivacyPolicy() {
   window.open('/info.html', '_parent');
}

function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function loadPrivacyCSS() {
    // Implementazione esistente degli stili privacy
}

// Funzioni social sharing
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title || 'PalermoHub - Mappe e Dati Open Data');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
}

function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title || 'PalermoHub - Mappe e Dati Open Data');
    const hashtags = 'PalermoHub,OpenData,Palermo,Sicilia';
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}&hashtags=${hashtags}`, '_blank', 'width=600,height=400');
}

function shareOnTelegram() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title || 'PalermoHub - Mappe e Dati Open Data');
    window.open(`https://t.me/share/url?url=${url}&text=${title}`, '_blank', 'width=600,height=400');
}

function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title || 'PalermoHub - Mappe e Dati Open Data');
    window.open(`https://wa.me/?text=${title}%20${url}`, '_blank', 'width=600,height=400');
}

function shareOnBluesky() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title || 'PalermoHub - Mappe e Dati Open Data');
    const text = `${title} ${url}`;
    window.open(`https://bsky.app/intent/compose?text=${text}`, '_blank', 'width=600,height=400');
}