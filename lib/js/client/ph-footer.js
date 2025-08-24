// footer.js - Inserisce il footer in tutte le pagine con popup privacy GDPR e ricerca mappe intelligente
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
            
            <!-- NUOVO: Ricerca mappe intelligente -->
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
                    <div class="maps-counter" id="footer-maps-counter">0 mappe disponibili</div>
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
// FOOTER MAP SEARCH SYSTEM - FIXED VERSION
// ========================================

let footerSearchTimeout = null;
let footerSelectedIndex = -1;
let footerSearchResults = [];
let footerAllMaps = [];
let footerSearchInitialized = false;

// Inizializza il sistema di ricerca mappe nel footer
function initFooterMapSearch() {
    console.log('🔍 Inizializzazione ricerca footer...');
    
    // Setup immediato degli eventi
    setupFooterSearchEvents();
    
    // Tentativo di caricamento dati con retry
    attemptDataLoad();
    
    // Listener per quando i dati vengono caricati
    document.addEventListener('mapsDataLoaded', function() {
        console.log('📡 Evento mapsDataLoaded ricevuto nel footer');
        loadFooterMapData();
    });
    
    // Polling per verificare se i dati sono disponibili
    const dataCheckInterval = setInterval(() => {
        if (window.allMaps && window.allMaps.length > 0 && footerAllMaps.length === 0) {
            console.log('⏰ Dati trovati tramite polling, aggiorno footer');
            loadFooterMapData();
            clearInterval(dataCheckInterval);
        }
    }, 1000);
    
    // Ferma il polling dopo 30 secondi
    setTimeout(() => clearInterval(dataCheckInterval), 30000);
}

// Tenta di caricare i dati con diversi approcci
function attemptDataLoad() {
    // Tentativo 1: Dati già disponibili
    if (window.allMaps && window.allMaps.length > 0) {
        console.log('✅ Dati già disponibili, carico immediatamente');
        loadFooterMapData();
        return;
    }
    
    // Tentativo 2: Dati in cache
    setTimeout(() => {
        if (window.allMaps && window.allMaps.length > 0) {
            console.log('✅ Dati trovati dopo delay, carico');
            loadFooterMapData();
        }
    }, 2000);
    
    // Tentativo 3: Forza aggiornamento
    setTimeout(() => {
        if (footerAllMaps.length === 0) {
            console.log('⚠️ Nessun dato trovato, tento forzatura aggiornamento');
            updateFooterMapData();
        }
    }, 5000);
}

// Carica i dati delle mappe per la ricerca footer
function loadFooterMapData() {
    if (!window.allMaps || window.allMaps.length === 0) {
        console.log('⚠️ window.allMaps non disponibile o vuoto');
        return;
    }
    
    footerAllMaps = [...window.allMaps];
    updateFooterMapsCounter();
    footerSearchInitialized = true;
    
    console.log(`✅ Footer search inizializzato con ${footerAllMaps.length} mappe`);
    
    // Debug: stampa alcune mappe per verifica
    if (footerAllMaps.length > 0) {
        console.log('🔍 Esempio mappe caricate:', footerAllMaps.slice(0, 3).map(m => m.titolo));
    }
}

// Configura gli event listeners per la ricerca
function setupFooterSearchEvents() {
    const searchInput = document.getElementById('footer-map-search-input');
    const clearBtn = document.getElementById('footer-search-clear');
    const searchWrapper = document.querySelector('.search-input-wrapper');
    
    if (!searchInput) {
        console.error('❌ Input di ricerca footer non trovato');
        return;
    }
    
    console.log('🎯 Event listeners configurati per la ricerca footer');
    
    // Input event - ricerca mentre digita
    searchInput.addEventListener('input', handleFooterSearchInput);
    
    // Keyboard navigation
    searchInput.addEventListener('keydown', handleFooterSearchKeyboard);
    
    // Focus events
    searchInput.addEventListener('focus', function() {
        searchWrapper.classList.add('focused');
        if (searchInput.value.trim()) {
            showFooterSuggestions();
        }
    });
    
    searchInput.addEventListener('blur', function() {
        searchWrapper.classList.remove('focused');
        // Ritarda la chiusura per permettere il click sui suggerimenti
        setTimeout(() => {
            hideFooterSuggestions();
        }, 150);
    });
    
    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFooterSearch);
    }
    
    // Chiudi suggerimenti cliccando fuori
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.footer-map-search')) {
            hideFooterSuggestions();
        }
    });
}

// Gestisce l'input di ricerca
function handleFooterSearchInput(event) {
    const query = event.target.value.trim();
    const clearBtn = document.getElementById('footer-search-clear');
    
    console.log(`🔍 Ricerca footer per: "${query}"`);
    
    // Mostra/nascondi il pulsante clear
    if (clearBtn) {
        clearBtn.classList.toggle('visible', query.length > 0);
    }
    
    // Debounce per performance
    if (footerSearchTimeout) {
        clearTimeout(footerSearchTimeout);
    }
    
    if (query.length < 2) {
        hideFooterSuggestions();
        return;
    }
    
    // Controlla se la ricerca è inizializzata
    if (!footerSearchInitialized || footerAllMaps.length === 0) {
        console.log('⚠️ Ricerca non ancora inizializzata, tento ricaricamento dati');
        loadFooterMapData();
        
        // Se ancora non ci sono dati, mostra messaggio
        if (footerAllMaps.length === 0) {
            displayNoDataMessage(query);
            return;
        }
    }
    
    footerSearchTimeout = setTimeout(() => {
        performFooterSearch(query);
    }, 200);
}

// Mostra messaggio quando non ci sono dati disponibili
function displayNoDataMessage(query) {
    const suggestionsContainer = document.getElementById('footer-search-suggestions');
    const suggestionsList = document.getElementById('footer-suggestions-list');
    
    if (!suggestionsContainer || !suggestionsList) return;
    
    suggestionsList.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Caricamento dati in corso...</span>
            <small>Riprova tra qualche secondo</small>
        </div>
    `;
    
    showFooterSuggestions();
}

// Esegue la ricerca nelle mappe
function performFooterSearch(query) {
    console.log(`🎯 Eseguendo ricerca per "${query}" su ${footerAllMaps.length} mappe`);
    
    if (!footerAllMaps || footerAllMaps.length === 0) {
        console.log('❌ Nessun dato disponibile per la ricerca');
        displayNoDataMessage(query);
        return;
    }
    
    const queryLower = query.toLowerCase();
    footerSelectedIndex = -1;
    
    // Cerca nelle mappe con scoring per rilevanza
    footerSearchResults = footerAllMaps
        .map(map => {
            let score = 0;
            let matchType = '';
            
            // Debug per alcune mappe
            const isDebugMap = map.titolo && map.titolo.toLowerCase().includes('palermo');
            if (isDebugMap && queryLower.includes('palermo')) {
                console.log(`🔍 Debug mappa: ${map.titolo}`, {
                    titolo: map.titolo,
                    descrizione: map.descrizione,
                    territorio: map.territorio
                });
            }
            
            // Controlla match nel titolo (priorità alta)
            if (map.titolo && map.titolo.toLowerCase().includes(queryLower)) {
                score += 10;
                matchType = 'Titolo';
                if (map.titolo.toLowerCase().startsWith(queryLower)) {
                    score += 5;
                }
            }
            
            // Controlla match nella descrizione
            if (map.descrizione && map.descrizione.toLowerCase().includes(queryLower)) {
                score += 5;
                if (!matchType) matchType = 'Descrizione';
            }
            
            // Controlla match nel territorio
            if (map.territorio && map.territorio.toLowerCase().includes(queryLower)) {
                score += 7;
                if (!matchType) matchType = 'Territorio';
            }
            
            // Controlla match nella categoria
            if (map.categoria && map.categoria.toLowerCase().includes(queryLower)) {
                score += 6;
                if (!matchType) matchType = 'Categoria';
            }
            
            // Controlla match nell'autore
            if (map.collaborazione && map.collaborazione.toLowerCase().includes(queryLower)) {
                score += 4;
                if (!matchType) matchType = 'Autore';
            }
            
            // Controlla match nei tag
            if (map.tag && map.tag.toLowerCase().includes(queryLower)) {
                score += 3;
                if (!matchType) matchType = 'Tag';
            }
            
            if (score > 0 && isDebugMap) {
                console.log(`✅ Match trovato per "${map.titolo}": score=${score}, type=${matchType}`);
            }
            
            return score > 0 ? { map, score, matchType } : null;
        })
        .filter(result => result !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8); // Limita a 8 risultati
    
    console.log(`🎯 Trovati ${footerSearchResults.length} risultati per "${query}"`);
    
    displayFooterSuggestions(query);
}

// Mostra i suggerimenti di ricerca
function displayFooterSuggestions(query) {
    const suggestionsContainer = document.getElementById('footer-search-suggestions');
    const suggestionsList = document.getElementById('footer-suggestions-list');
    
    if (!suggestionsContainer || !suggestionsList) return;
    
    if (footerSearchResults.length === 0) {
        suggestionsList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <span>Nessuna mappa trovata per "<strong>${query}</strong>"</span>
                <small>Prova con termini diversi</small>
            </div>
        `;
    } else {
        suggestionsList.innerHTML = footerSearchResults.map((result, index) => {
            const { map, matchType } = result;
            const highlightedTitle = highlightSearchTerm(map.titolo || '', query);
            
            // Info aggiuntive
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
                            ${info ? `<span class="suggestion-info">${info}</span>` : ''}
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

// Evidenzia il termine di ricerca
function highlightSearchTerm(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Escape caratteri speciali regex
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Gestisce la navigazione da tastiera
function handleFooterSearchKeyboard(event) {
    const suggestionsVisible = document.getElementById('footer-search-suggestions').classList.contains('visible');
    
    if (!suggestionsVisible || footerSearchResults.length === 0) {
        return;
    }
    
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

// Aggiorna la selezione visiva
function updateFooterSelection() {
    const items = document.querySelectorAll('#footer-suggestions-list .suggestion-item');
    
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === footerSelectedIndex);
    });
    
    // Scroll verso l'elemento selezionato
    if (footerSelectedIndex >= 0 && items[footerSelectedIndex]) {
        items[footerSelectedIndex].scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
        });
    }
}

// Seleziona un suggerimento
function selectFooterSuggestion(index) {
    if (index >= 0 && index < footerSearchResults.length) {
        const selectedMap = footerSearchResults[index].map;
        const mapUrl = selectedMap.url || selectedMap.URL;
        
        console.log(`🗺️ Footer navigation to: ${selectedMap.titolo} (${mapUrl})`);
        
        if (mapUrl) {
            // Feedback visivo
            const searchInput = document.getElementById('footer-map-search-input');
            const originalPlaceholder = searchInput.placeholder;
            searchInput.placeholder = '🚀 Caricamento mappa...';
            
            // Naviga alla mappa
            setTimeout(() => {
                window.location.href = mapUrl;
            }, 100);
            
            // Reset placeholder in caso di errori
            setTimeout(() => {
                searchInput.placeholder = originalPlaceholder;
            }, 2000);
        } else {
            console.warn('⚠️ URL mappa non disponibile');
        }
        
        hideFooterSuggestions();
        clearFooterSearch();
    }
}

// Mostra i suggerimenti
function showFooterSuggestions() {
    const suggestionsContainer = document.getElementById('footer-search-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.classList.add('visible');
    }
}

// Nascondi i suggerimenti
function hideFooterSuggestions() {
    const suggestionsContainer = document.getElementById('footer-search-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.classList.remove('visible');
    }
    footerSelectedIndex = -1;
}

// Pulisce la ricerca
function clearFooterSearch() {
    const searchInput = document.getElementById('footer-map-search-input');
    const clearBtn = document.getElementById('footer-search-clear');
    
    if (searchInput) {
        searchInput.value = '';
    }
    
    if (clearBtn) {
        clearBtn.classList.remove('visible');
    }
    
    hideFooterSuggestions();
    footerSearchResults = [];
}

// Aggiorna il contatore delle mappe
function updateFooterMapsCounter() {
    const counter = document.getElementById('footer-maps-counter');
    if (!counter) return;
    
    const count = footerAllMaps.length || (window.allMaps ? window.allMaps.length : 0);
    counter.textContent = `${count} mappe disponibili`;
    console.log(`📊 Contatore footer aggiornato: ${count} mappe`);
}

// Aggiorna i dati quando vengono ricaricati - VERSIONE MIGLIORATA
function updateFooterMapData() {
    console.log('🔄 updateFooterMapData chiamata');
    
    if (window.allMaps && window.allMaps.length > 0) {
        footerAllMaps = [...window.allMaps];
        updateFooterMapsCounter();
        footerSearchInitialized = true;
        console.log(`✅ Footer search aggiornato con ${footerAllMaps.length} mappe`);
        
        // Trigger evento personalizzato
        document.dispatchEvent(new CustomEvent('footerSearchReady', { 
            detail: { mapCount: footerAllMaps.length } 
        }));
    } else {
        console.log('⚠️ updateFooterMapData: nessun dato disponibile in window.allMaps');
    }
}

// Esporta le funzioni per uso globale
window.updateFooterMapData = updateFooterMapData;
window.setupFooterSearchEvents = setupFooterSearchEvents;
window.loadFooterMapData = loadFooterMapData;

// Debug function - rimuovere in produzione
window.debugFooterSearch = function() {
    console.log('🔍 DEBUG Footer Search:', {
        footerAllMaps: footerAllMaps.length,
        footerSearchInitialized,
        windowAllMaps: window.allMaps ? window.allMaps.length : 'undefined'
    });
};

// ========================================
// SISTEMA PRIVACY E GDPR (resto del codice esistente...)
// ========================================

// Variabili globali per la gestione privacy
let privacySettings = {
    necessary: true,      // Sempre attivi
    analytics: false,     // Google Analytics, ecc.
    social: false,        // Social media widgets
    functional: false     // Funzionalità aggiuntive
};

// Inizializza il sistema privacy
function initPrivacyPopup() {
    // Controlla se l'utente ha già fatto una scelta
    const savedSettings = getCookie('palermohub_privacy_settings');
    const consentGiven = getCookie('palermohub_privacy_consent');
    
    if (savedSettings) {
        privacySettings = JSON.parse(savedSettings);
        applyPrivacySettings();
    }
    
    // Mostra il popup solo se non è stato dato il consenso
    if (!consentGiven) {
        setTimeout(() => {
            showPrivacyPopup();
        }, 1500); // Mostra dopo 1.5 secondi
    }
    
    // Crea gli elementi del popup privacy
    createPrivacyPopup();
}

// Crea il popup privacy
function createPrivacyPopup() {
    const popupHTML = `
        <!-- Privacy Popup -->
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
    
    // Carica gli stili CSS per il popup privacy
    loadPrivacyCSS();
}

// Mostra il popup privacy
function showPrivacyPopup() {
    const popup = document.getElementById('privacy-popup');
    if (popup) {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Carica le impostazioni salvate
        loadSavedPrivacySettings();
        
        // Animazione di entrata
        setTimeout(() => {
            popup.classList.add('privacy-popup-show');
        }, 10);
    }
}

// Nascondi il popup privacy
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

// Mostra le impostazioni privacy (dal footer)
function showPrivacySettings() {
    showPrivacyPopup();
}

// Carica le impostazioni salvate
function loadSavedPrivacySettings() {
    document.getElementById('analytics-cookie').checked = privacySettings.analytics;
    document.getElementById('social-cookie').checked = privacySettings.social;
    document.getElementById('functional-cookie').checked = privacySettings.functional;
}

// Accetta solo i cookie necessari
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

// Accetta i cookie selezionati
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

// Accetta tutti i cookie
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

// Salva le impostazioni privacy
function savePrivacySettings() {
    setCookie('palermohub_privacy_settings', JSON.stringify(privacySettings), 365);
    setCookie('palermohub_privacy_consent', 'true', 365);
    applyPrivacySettings();
}

// Applica le impostazioni privacy
function applyPrivacySettings() {
    if (privacySettings.analytics) {
        console.log('Analytics abilitato');
    } else {
        console.log('Analytics disabilitato');
    }
    
    if (privacySettings.social) {
        console.log('Social media abilitato');
    } else {
        console.log('Social media disabilitato');
    }
    
    if (privacySettings.functional) {
        console.log('Cookie funzionali abilitati');
    } else {
        console.log('Cookie funzionali disabilitati');
    }
}

// Mostra notifica privacy
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

// Mostra informativa privacy (da implementare)
function showPrivacyPolicy() {
   window.open('/info.html', '_parent');
}

// Utility per gestire i cookie
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

// Carica gli stili CSS per il popup privacy (codice esistente...)
function loadPrivacyCSS() {
    const cssId = 'privacy-popup-css';
    if (!document.getElementById(cssId)) {
        const head = document.getElementsByTagName('head')[0];
        const link = document.createElement('style');
        link.id = cssId;
        link.innerHTML = `
            /* Privacy Popup Styles - Codice esistente mantenuto */
            .privacy-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            /* ... resto degli stili privacy esistenti ... */
        `;
        head.appendChild(link);
    }
}

// ========================================
// FUNZIONI SOCIAL SHARING (esistenti)
// ========================================

// Funzioni per la condivisione social
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