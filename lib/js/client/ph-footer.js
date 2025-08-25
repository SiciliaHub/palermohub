// footer.js - Inserisce il footer in tutte le pagine con popup privacy GDPR e ricerca intelligente
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
            <div class="footer-social">
             <!--   <div class="social-title">Condividi</div> -->
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
            
            <!-- Footer Search - NUOVA COLONNA -->
            <div class="footer-search">
                <div class="footer-search-wrapper">
                    <div class="footer-search-input-container" id="footer-search-input-container">
                        <div class="footer-search-icon"><i class="fas fa-search"></i></div>
                        <input type="text" 
                               id="footer-search-input" 
                               class="footer-search-input" 
                               placeholder="Cerca mappe..."
                               autocomplete="off"
                               autocorrect="off"
                               spellcheck="false">
                        <button id="footer-search-clear" class="footer-search-clear" title="Cancella ricerca">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Suggerimenti intelligenti - si aprono verso l'alto -->
                    <div id="footer-search-suggestions" class="footer-search-suggestions">
                        <div class="footer-suggestions-header">
                            <div class="footer-suggestions-title"><i class="fas fa-bullseye"></i> Risultati</div>
                            <div class="footer-suggestions-count" id="footer-suggestions-count">0</div>
                        </div>
                        <div class="footer-suggestions-list" id="footer-suggestions-list">
                            <!-- I suggerimenti verranno generati dinamicamente -->
                        </div>
                    </div>
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
    
    // Carica gli stili per la ricerca nel footer
    loadFooterSearchStyles();
    
    // Inizializza il popup privacy
    initPrivacyPopup();
    
    // Inizializza la ricerca nel footer
    initFooterSearch();
});

// ========================================
// RICERCA INTELLIGENTE NEL FOOTER
// ========================================

// Classe SmartSearch standalone per il footer
class FooterSmartSearch {
    constructor() {
        this.allMaps = [];
        this.searchIndex = new Map();
        this.stopWords = new Set(['il', 'la', 'di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'a', 'e', 'o', 'ma', 'se', 'del', 'della', 'dei', 'delle', 'nel', 'nella', 'nei', 'nelle', 'sul', 'sulla', 'sui', 'sulle']);
        this.isInitialized = false;
        this.loadData();
    }

    async loadData() {
        try {
            const csvFilePath = 'dati-palermo-hub/palermo-hub.csv';
            const response = await fetch(csvFilePath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            
            // Usa PapaParse se disponibile, altrimenti parsing semplice
            if (typeof Papa !== 'undefined') {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    delimiter: ',',
                    quotes: true,
                    quoteChar: '"',
                    escapeChar: '"',
                    transformHeader: (header) => header.trim().toLowerCase(),
                    transform: (value) => value ? value.trim() : '',
                    complete: (results) => {
                        this.allMaps = results.data.filter(row => row.titolo && row.titolo.trim() !== '');
                        this.buildSearchIndex();
                        this.isInitialized = true;
                        console.log(`Footer Search: Loaded ${this.allMaps.length} maps`);
                    }
                });
            } else {
                // Fallback parsing semplice
                this.parseCSVSimple(csvText);
            }
        } catch (error) {
            console.error('Errore nel caricamento dati per footer search:', error);
        }
    }

    parseCSVSimple(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        this.allMaps = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] ? values[index].trim() : '';
                });
                if (row.titolo && row.titolo.trim()) {
                    this.allMaps.push(row);
                }
            }
        }
        
        this.buildSearchIndex();
        this.isInitialized = true;
        console.log(`Footer Search: Loaded ${this.allMaps.length} maps (simple parser)`);
    }

    buildSearchIndex() {
        this.allMaps.forEach((map, index) => {
            const searchableText = this.getSearchableText(map).toLowerCase();
            const words = this.tokenize(searchableText);
            
            words.forEach(word => {
                if (!this.searchIndex.has(word)) {
                    this.searchIndex.set(word, new Set());
                }
                this.searchIndex.get(word).add(index);
            });
        });
    }

    getSearchableText(map) {
        return [
            map.titolo || '',
            map.descrizione || '',
            map.territorio || '',
            map.categoria || '',
            map.collaborazione || '',
            map.tag || '',
            map.fontedati || '',
            map.anno || ''
        ].join(' ');
    }

    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !this.stopWords.has(word));
    }

    calculateRelevance(map, query) {
        const queryWords = this.tokenize(query.toLowerCase());
        if (queryWords.length === 0) return 0;

        let score = 0;
        const weights = {
            titolo: 10,
            descrizione: 5,
            territorio: 8,
            categoria: 7,
            collaborazione: 6,
            tag: 4,
            fontedati: 3,
            anno: 2
        };

        queryWords.forEach(word => {
            Object.keys(weights).forEach(field => {
                const fieldValue = (map[field] || '').toLowerCase();
                
                if (fieldValue.includes(word)) {
                    score += weights[field];
                    
                    if (fieldValue.startsWith(word)) {
                        score += weights[field] * 0.5;
                    }
                    
                    const fieldWords = fieldValue.split(/\s+/);
                    if (fieldWords.includes(word)) {
                        score += weights[field] * 0.3;
                    }
                }
                
                if (this.fuzzyMatch(word, fieldValue)) {
                    score += weights[field] * 0.3;
                }
            });
        });

        return score / (queryWords.length * 10);
    }

    fuzzyMatch(word, text) {
        if (word.length < 3) return false;
        
        const threshold = Math.floor(word.length * 0.2);
        return text.split(/\s+/).some(textWord => {
            if (Math.abs(textWord.length - word.length) > threshold) return false;
            
            let differences = 0;
            const minLength = Math.min(word.length, textWord.length);
            
            for (let i = 0; i < minLength; i++) {
                if (word[i] !== textWord[i]) differences++;
                if (differences > threshold) return false;
            }
            
            return differences <= threshold;
        });
    }

    search(query) {
        if (!this.isInitialized || !query || query.length < 2) {
            return [];
        }

        const results = [];
        const queryWords = this.tokenize(query.toLowerCase());
        
        if (queryWords.length === 0) {
            return [];
        }

        const candidateIndices = new Set();
        queryWords.forEach(word => {
            if (this.searchIndex.has(word)) {
                this.searchIndex.get(word).forEach(index => {
                    candidateIndices.add(index);
                });
            }
            
            for (const [indexedWord, indices] of this.searchIndex.entries()) {
                if (indexedWord.includes(word) || word.includes(indexedWord)) {
                    indices.forEach(index => candidateIndices.add(index));
                }
            }
        });

        candidateIndices.forEach(index => {
            const map = this.allMaps[index];
            const relevance = this.calculateRelevance(map, query);
            
            if (relevance > 0.1) {
                results.push({
                    map: map,
                    relevance: relevance,
                    matchType: this.getMatchType(map, query),
                    highlightedTitle: this.highlightText(map.titolo || '', query),
                    highlightedDescription: this.highlightText(map.descrizione || '', query)
                });
            }
        });

        results.sort((a, b) => b.relevance - a.relevance);
        
        return results.slice(0, 6); // Limitiamo a 6 risultati per il footer
    }

    getMatchType(map, query) {
        const queryLower = query.toLowerCase();
        
        if ((map.titolo || '').toLowerCase().includes(queryLower)) {
            return 'Titolo';
        } else if ((map.descrizione || '').toLowerCase().includes(queryLower)) {
            return 'Descrizione';
        } else if ((map.territorio || '').toLowerCase().includes(queryLower)) {
            return 'Territorio';
        } else if ((map.collaborazione || '').toLowerCase().includes(queryLower)) {
            return 'Autore';
        } else if ((map.categoria || '').toLowerCase().includes(queryLower)) {
            return 'Categoria';
        } else if ((map.tag || '').toLowerCase().includes(queryLower)) {
            return 'Tag';
        }
        
        return 'Generico';
    }

    highlightText(text, query) {
        if (!text || !query) return text;
        
        const queryWords = this.tokenize(query.toLowerCase());
        let highlightedText = text;
        
        queryWords.forEach(word => {
            if (word.length >= 2) {
                const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
                highlightedText = highlightedText.replace(regex, '<span class="footer-highlight">$1</span>');
            }
        });
        
        return highlightedText;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Variabili globali per la ricerca nel footer
let footerSmartSearch = null;
let footerSearchTimeout = null;
let footerSelectedSuggestion = -1;
let footerSearchSuggestions = [];

// Inizializza la ricerca nel footer
function initFooterSearch() {
    footerSmartSearch = new FooterSmartSearch();
    
    const searchInput = document.getElementById('footer-search-input');
    const searchContainer = document.getElementById('footer-search-input-container');
    const clearBtn = document.getElementById('footer-search-clear');

    if (searchInput) {
        searchInput.addEventListener('input', handleFooterSearchInput);
        searchInput.addEventListener('keydown', handleFooterSearchKeyboard);
        
        searchInput.addEventListener('focus', function() {
            searchContainer.classList.add('focused');
        });
        
        searchInput.addEventListener('blur', function() {
            searchContainer.classList.remove('focused');
            setTimeout(hideFooterSuggestions, 200);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearFooterSearch);
    }

    // Chiudi suggerimenti quando si clicca fuori
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.footer-search-wrapper')) {
            hideFooterSuggestions();
        }
    });
}

function handleFooterSearchInput(event) {
    const query = event.target.value.trim();
    const clearBtn = document.getElementById('footer-search-clear');
    
    clearBtn.classList.toggle('visible', query.length > 0);
    
    if (footerSearchTimeout) {
        clearTimeout(footerSearchTimeout);
    }
    
    if (query.length < 2) {
        hideFooterSuggestions();
        return;
    }
    
    footerSearchTimeout = setTimeout(() => {
        performFooterSearch(query);
    }, 300);
}

function performFooterSearch(query) {
    if (!footerSmartSearch || !footerSmartSearch.isInitialized) {
        hideFooterSuggestions();
        return;
    }
    
    try {
        const results = footerSmartSearch.search(query);
        displayFooterSuggestions(results, query);
        
    } catch (error) {
        console.error('Errore nella ricerca footer:', error);
        hideFooterSuggestions();
    }
}

function displayFooterSuggestions(results, query) {
    const suggestionsContainer = document.getElementById('footer-search-suggestions');
    const suggestionsList = document.getElementById('footer-suggestions-list');
    const suggestionsCount = document.getElementById('footer-suggestions-count');
    
    footerSearchSuggestions = results;
    footerSelectedSuggestion = -1;
    
    suggestionsCount.textContent = results.length + " risultat" + (results.length !== 1 ? 'i' : 'o');
    
    if (results.length === 0) {
        suggestionsList.innerHTML = `<div class="footer-no-results">
            <div class="icon"><i class="fas fa-search"></i></div>
            <div>Nessun risultato trovato per "<strong>${query}</strong>"</div>
        </div>`;
    } else {
        suggestionsList.innerHTML = results.map((result, index) => {
            const imageUrl = getFooterImageUrl(result.map, index);
            
            return `<div class="footer-suggestion-item" data-index="${index}">
                <img src="${imageUrl}" 
                     alt="${result.map.titolo}" 
                     class="footer-suggestion-preview"
                     onerror="this.style.display='none'">
                <div class="footer-suggestion-content">
                    <div class="footer-suggestion-title">${result.highlightedTitle}</div>
                    <div class="footer-suggestion-description">${result.highlightedDescription}</div>
                    <div class="footer-suggestion-meta">
                        <span class="footer-match-type">${result.matchType}</span>
                        <span class="footer-suggestion-tag">${result.map.territorio || 'N/A'}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
    }
    
    suggestionsContainer.classList.add('visible');
    
    // Aggiungi event listeners
    suggestionsList.querySelectorAll('.footer-suggestion-item').forEach((item, index) => {
        item.addEventListener('click', () => selectFooterSuggestion(index));
    });
}

function selectFooterSuggestion(index) {
    if (index >= 0 && index < footerSearchSuggestions.length) {
        const result = footerSearchSuggestions[index];
        const mapUrl = result.map.url || result.map.URL || '';
        
        if (mapUrl) {
            window.open(mapUrl, '_blank');
        }
        
        hideFooterSuggestions();
    }
}

function handleFooterSearchKeyboard(event) {
    const suggestionsContainer = document.getElementById('footer-search-suggestions');
    
    if (!suggestionsContainer.classList.contains('visible')) {
        return;
    }
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            footerSelectedSuggestion = Math.min(footerSelectedSuggestion + 1, footerSearchSuggestions.length - 1);
            updateFooterSuggestionSelection();
            break;
        case 'ArrowUp':
            event.preventDefault();
            footerSelectedSuggestion = Math.max(footerSelectedSuggestion - 1, -1);
            updateFooterSuggestionSelection();
            break;
        case 'Enter':
            event.preventDefault();
            if (footerSelectedSuggestion >= 0) {
                selectFooterSuggestion(footerSelectedSuggestion);
            } else {
                // Se non c'è selezione ma ci sono risultati, apri il primo
                if (footerSearchSuggestions.length > 0) {
                    selectFooterSuggestion(0);
                }
            }
            break;
        case 'Escape':
            hideFooterSuggestions();
            break;
    }
}

function updateFooterSuggestionSelection() {
    const items = document.querySelectorAll('.footer-suggestion-item');
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === footerSelectedSuggestion);
    });
    
    if (footerSelectedSuggestion >= 0) {
        const selectedItem = items[footerSelectedSuggestion];
        if (selectedItem) {
            selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
}

function hideFooterSuggestions() {
    document.getElementById('footer-search-suggestions').classList.remove('visible');
    footerSelectedSuggestion = -1;
}

function clearFooterSearch() {
    document.getElementById('footer-search-input').value = '';
    document.getElementById('footer-search-clear').classList.remove('visible');
    hideFooterSuggestions();
}

function getFooterImageUrl(mapData, index) {
    const possibleImageFields = ['img', 'image', 'immagine', 'foto', 'picture'];
    let imageField = null;
    
    for (const field of possibleImageFields) {
        if (mapData[field] && mapData[field].trim() !== '') {
            imageField = mapData[field];
            break;
        }
    }
    
    if (!imageField || imageField.trim() === '') {
        return createFooterFallbackImage();
    }
    
    let cleanUrl = String(imageField)
        .trim()
        .replace(/^["'`\s]+|["'`\s]+$/g, '')
        .replace(/[\r\n\t]/g, '')
        .replace(/[^\x20-\x7E]/g, '');
    
    if (!cleanUrl.match(/^https?:\/\//)) {
        const fileName = cleanUrl.split('/').pop();
        return 'legend/clip_index/' + fileName;
    }
    
    try {
        const urlObj = new URL(cleanUrl);
        return urlObj.href;
    } catch (error) {
        return createFooterFallbackImage();
    }
}

function createFooterFallbackImage() {
    const svg = '<svg width="60" height="40" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="100%" height="100%" fill="#f0f2f5"/>' +
        '<text x="50%" y="50%" font-family="Arial, sans-serif" font-size="8" ' +
              'fill="#657786" text-anchor="middle" dy=".3em">' +
            'No img' +
        '</text>' +
    '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Carica gli stili per la ricerca nel footer
function loadFooterSearchStyles() {
    const cssId = 'footer-search-css';
    if (!document.getElementById(cssId)) {
        const head = document.getElementsByTagName('head')[0];
        const style = document.createElement('style');
        style.id = cssId;
        style.innerHTML = `
            /* ========================================
               FOOTER 4-COLUMN LAYOUT WITH SEARCH
               ======================================== */

            /* Footer Content - 4 colonne */
            .footer-content {
                padding: 1.5rem 0;
                display: grid;
                grid-template-columns: 2fr auto auto 2fr;
                gap: 2rem;
                align-items: center;
                max-width: 1400px;
                margin: 0 auto;
                padding-left: 2rem;
                padding-right: 2rem;
            }

            .footer-text {
                color: var(--text-primary);
                line-height: 1.4;
                font-size: 0.75rem;
            }

            .footer-social {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            }

            .social-buttons {
                display: flex;
                gap: 0.6rem;
                align-items: center;
            }

            .social-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: var(--background-main);
                color: var(--text-secondary);
                text-decoration: none;
                transition: all 0.3s ease;
                font-size: 0.8rem;
                border: 1px solid var(--border-color);
                position: relative;
                overflow: hidden;
            }

            .social-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--primary-color);
                transform: scale(0);
                transition: transform 0.3s ease;
                border-radius: 50%;
                z-index: 0;
            }

            .social-btn i {
                position: relative;
                z-index: 1;
                transition: color 0.3s ease;
            }

            .social-btn:hover::before {
                transform: scale(1);
            }

            .social-btn:hover {
                color: white;
                border-color: var(--primary-color);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 153, 0, 0.3);
            }

            /* Footer Search - NUOVA SEZIONE */
            .footer-search {
                position: relative;
                min-width: 280px;
            }

            .footer-search-wrapper {
                position: relative;
            }

            .footer-search-input-container {
                position: relative;
                display: flex;
                align-items: center;
                background: rgba(255, 255, 255, 0.9);
                border: 2px solid #e2e8f0;
                border-radius: 20px;
                padding: 0.5rem 0.75rem;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            }

            .footer-search-input-container.focused {
                border-color: var(--primary-color);
                box-shadow: 0 2px 12px rgba(255, 153, 0, 0.25);
                background: white;
            }

            .footer-search-icon {
                color: #a0aec0;
                font-size: 0.9rem;
                margin-right: 0.5rem;
                transition: color 0.3s ease;
            }

            .footer-search-input-container.focused .footer-search-icon {
                color: var(--primary-color);
            }

            .footer-search-input {
                flex: 1;
                border: none;
                outline: none;
                font-size: 0.85rem;
                background: transparent;
                color: #2d3748;
                font-weight: 500;
            }

            .footer-search-input::placeholder {
                color: #a0aec0;
                font-weight: 400;
            }

            .footer-search-clear {
                background: none;
                border: none;
                color: #a0aec0;
                cursor: pointer;
                padding: 0.2rem;
                border-radius: 50%;
                transition: all 0.3s ease;
                opacity: 0;
                visibility: hidden;
                transform: scale(0.8);
            }

            .footer-search-clear.visible {
                opacity: 1;
                visibility: visible;
                transform: scale(1);
            }

            .footer-search-clear:hover {
                color: #e53e3e;
                background: #fed7d7;
            }

            /* Suggestions - SI APRONO VERSO L'ALTO */
            .footer-search-suggestions {
                position: absolute;
                bottom: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 2px solid var(--primary-color);
                border-radius: 10px;
                box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
                opacity: 0;
                visibility: hidden;
                transform: translateY(8px);
                transition: all 0.3s ease;
                z-index: 1000;
                max-height: 350px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }

            .footer-search-suggestions.visible {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .footer-suggestions-header {
                background: linear-gradient(135deg, rgba(255, 153, 0, 0.1), rgba(167, 199, 231, 0.1));
                padding: 0.6rem 0.75rem;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .footer-suggestions-title {
                font-weight: 600;
                color: #2d3748;
                font-size: 0.8rem;
                display: flex;
                align-items: center;
                gap: 0.4rem;
            }

            .footer-suggestions-title i {
                color: var(--primary-color);
            }

            .footer-suggestions-count {
                background: white;
                border: 1px solid #e2e8f0;
                color: #718096;
                padding: 0.2rem 0.5rem;
                border-radius: 10px;
                font-size: 0.7rem;
                font-weight: 600;
            }

            .footer-suggestions-list {
                max-height: 260px;
                overflow-y: auto;
            }

            .footer-suggestion-item {
                display: flex;
                align-items: center;
                gap: 0.6rem;
                padding: 0.6rem 0.75rem;
                cursor: pointer;
                transition: all 0.2s ease;
                border-bottom: 1px solid #f7fafc;
            }

            .footer-suggestion-item:hover,
            .footer-suggestion-item.selected {
                background: linear-gradient(135deg, rgba(255, 153, 0, 0.1), rgba(167, 199, 231, 0.1));
            }

            .footer-suggestion-item:last-child {
                border-bottom: none;
            }

            .footer-suggestion-preview {
                width: 50px;
                height: 35px;
                object-fit: cover;
                border-radius: 4px;
                border: 2px solid #e2e8f0;
                flex-shrink: 0;
                transition: border-color 0.2s ease;
            }

            .footer-suggestion-item:hover .footer-suggestion-preview {
                border-color: var(--primary-color);
            }

            .footer-suggestion-content {
                flex: 1;
                min-width: 0;
            }

            .footer-suggestion-title {
                font-weight: 600;
                color: #2d3748;
                font-size: 0.8rem;
                line-height: 1.3;
                margin-bottom: 0.2rem;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .footer-suggestion-description {
                color: #718096;
                font-size: 0.7rem;
                line-height: 1.4;
                margin-bottom: 0.4rem;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }

            .footer-suggestion-meta {
                display: flex;
                gap: 0.4rem;
                flex-wrap: wrap;
            }

            .footer-match-type {
                background: var(--primary-color);
                color: white;
                padding: 0.1rem 0.4rem;
                border-radius: 8px;
                font-size: 0.65rem;
                font-weight: 600;
            }

            .footer-suggestion-tag {
                background: #e6fffa;
                color: #234e52;
                padding: 0.1rem 0.4rem;
                border-radius: 8px;
                font-size: 0.65rem;
                font-weight: 600;
                border: 1px solid #81e6d9;
            }

            .footer-no-results {
                padding: 1.5rem 0.75rem;
                text-align: center;
                color: #718096;
            }

            .footer-no-results .icon {
                font-size: 1.5rem;
                margin-bottom: 0.75rem;
                opacity: 0.5;
            }

            .footer-highlight {
                background: linear-gradient(120deg, rgba(255, 153, 0, 0.4) 0%, rgba(255, 153, 0, 0.2) 100%);
                padding: 0.1rem 0.2rem;
                border-radius: 3px;
                font-weight: 600;
            }

            .footer-credits {
                text-align: right;
                color: var(--text-secondary);
                font-size: 0.75rem;
            }

            .footer-credits a {
                color: var(--text-secondary);
                text-decoration: underline;
                font-weight: 600;
            }

            .footer-credits a:hover {
                color: var(--primary-color);
            }

            /* Dark Mode Support */
            [data-theme="dark"] .footer-search-input-container {
                background: rgba(30, 30, 30, 0.95);
                border-color: var(--border-color);
            }

            [data-theme="dark"] .footer-search-input-container.focused {
                border-color: var(--primary-color);
                box-shadow: 0 2px 12px rgba(255, 167, 38, 0.25);
                background: var(--white);
            }

            [data-theme="dark"] .footer-search-icon {
                color: var(--text-muted);
            }

            [data-theme="dark"] .footer-search-input-container.focused .footer-search-icon {
                color: var(--primary-color);
            }

            [data-theme="dark"] .footer-search-input {
                color: var(--text-primary);
            }

            [data-theme="dark"] .footer-search-input::placeholder {
                color: var(--text-muted);
            }

            [data-theme="dark"] .footer-search-suggestions {
                background: var(--white);
                border-color: var(--primary-color);
            }

            [data-theme="dark"] .footer-suggestions-header {
                background: linear-gradient(135deg, rgba(255, 167, 38, 0.15), rgba(100, 181, 246, 0.1));
                border-bottom-color: var(--border-color);
            }

            [data-theme="dark"] .footer-suggestions-title {
                color: var(--text-primary);
            }

            [data-theme="dark"] .footer-suggestions-count {
                background: var(--background-main);
                border-color: var(--border-color);
                color: var(--text-secondary);
            }

            [data-theme="dark"] .footer-suggestion-item {
                border-bottom-color: var(--border-color);
            }

            [data-theme="dark"] .footer-suggestion-item:hover,
            [data-theme="dark"] .footer-suggestion-item.selected {
                background: linear-gradient(135deg, rgba(255, 167, 38, 0.15), rgba(100, 181, 246, 0.1));
            }

            [data-theme="dark"] .footer-suggestion-title {
                color: var(--text-primary);
            }

            [data-theme="dark"] .footer-suggestion-description {
                color: var(--text-secondary);
            }

            [data-theme="dark"] .footer-suggestion-preview {
                border-color: var(--border-color);
            }

            [data-theme="dark"] .footer-suggestion-item:hover .footer-suggestion-preview {
                border-color: var(--primary-color);
            }

            [data-theme="dark"] .footer-no-results {
                color: var(--text-muted);
            }

            [data-theme="dark"] .footer-highlight {
                background: linear-gradient(120deg, rgba(255, 167, 38, 0.4) 0%, rgba(255, 167, 38, 0.2) 100%);
                color: var(--text-primary);
            }

            /* Scrollbar personalizzata */
            .footer-suggestions-list::-webkit-scrollbar {
                width: 4px;
            }

            .footer-suggestions-list::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 2px;
            }

            .footer-suggestions-list::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 2px;
            }

            .footer-suggestions-list::-webkit-scrollbar-thumb:hover {
                background: var(--primary-color);
            }

            [data-theme="dark"] .footer-suggestions-list::-webkit-scrollbar-track {
                background: var(--border-color);
            }

            [data-theme="dark"] .footer-suggestions-list::-webkit-scrollbar-thumb {
                background: var(--text-muted);
            }

            /* Responsive - Mobile */
            @media (max-width: 768px) {
                .footer-content {
                    grid-template-columns: 1fr;
                    grid-template-rows: auto auto auto auto;
                    gap: 1.5rem;
                    text-align: center;
                    padding: 1rem;
                }

                .footer-text {
                    order: 1;
                    font-size: 0.7rem;
                }

                .footer-social {
                    order: 2;
                }

                .footer-search {
                    order: 3;
                    min-width: auto;
                    max-width: 100%;
                }

                .footer-search-input-container {
                    padding: 0.6rem 0.8rem;
                }

                .footer-search-input {
                    font-size: 0.9rem;
                }

                .footer-suggestions-header {
                    padding: 0.6rem 0.8rem;
                }

                .footer-suggestion-item {
                    padding: 0.6rem 0.8rem;
                    gap: 0.6rem;
                }

                .footer-suggestion-preview {
                    width: 45px;
                    height: 32px;
                }

                .footer-suggestion-title {
                    font-size: 0.8rem;
                }

                .footer-suggestion-description {
                    font-size: 0.7rem;
                }

                .footer-credits {
                    order: 4;
                    text-align: center;
                }

                .social-buttons {
                    gap: 0.8rem;
                }

                .social-btn {
                    width: 32px;
                    height: 32px;
                    font-size: 0.9rem;
                }
            }

            @media (max-width: 480px) {
                .footer-content {
                    gap: 1rem;
                    padding: 0.75rem;
                }

                .footer-search-input-container {
                    padding: 0.5rem 0.7rem;
                }

                .footer-search-icon {
                    font-size: 0.85rem;
                    margin-right: 0.4rem;
                }

                .footer-search-input {
                    font-size: 0.85rem;
                }

                .footer-suggestion-item {
                    padding: 0.5rem;
                    gap: 0.5rem;
                }

                .footer-suggestion-preview {
                    width: 40px;
                    height: 28px;
                }

                .footer-suggestions-list {
                    max-height: 220px;
                }

                .social-buttons {
                    gap: 0.6rem;
                }

                .social-btn {
                    width: 28px;
                    height: 28px;
                    font-size: 0.8rem;
                }
            }
        `;
        head.appendChild(style);
    }
}

// ========================================
// SISTEMA PRIVACY E GDPR (resto del codice...)
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
                    <a href="./info.html" onclick="showPrivacyPolicy()">Informativa Privacy</a> <!-- | 
                   <a href="#" onclick="showCookiePolicy()">Cookie Policy</a> -->
                </div>
            </div>
        </div>
        
        <!-- Banner Cookie Minimale (alternativo) -->
        <div id="cookie-banner" class="cookie-banner" style="display: none;">
            <div class="cookie-banner-content">
                <div class="cookie-text">
                    <i class="fa fa-cookie-bite"></i>
                    <span>Questo sito utilizza cookie per migliorare la tua esperienza di navigazione.</span>
                </div>
                <div class="cookie-buttons">
                    <button class="cookie-btn cookie-btn-settings" onclick="showPrivacySettings()">
                        <i class="fa fa-cog"></i> Gestisci
                    </button>
                    <button class="cookie-btn cookie-btn-accept" onclick="acceptAllCookies()">
                        <i class="fa fa-check"></i> Accetta Tutti
                    </button>
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
    // Qui puoi aggiungere la logica per abilitare/disabilitare servizi
    // in base alle impostazioni dell'utente
    
    if (privacySettings.analytics) {
        // Abilita Google Analytics o altri servizi analitici
        console.log('Analytics abilitato');
        // loadGoogleAnalytics();
    } else {
        console.log('Analytics disabilitato');
    }
    
    if (privacySettings.social) {
        // Abilita widget social
        console.log('Social media abilitato');
        // enableSocialWidgets();
    } else {
        console.log('Social media disabilitato');
    }
    
    if (privacySettings.functional) {
        // Abilita funzionalità aggiuntive
        console.log('Cookie funzionali abilitati');
        // enableFunctionalCookies();
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
  //  alert('Qui verrebbe mostrata l\'informativa sulla privacy completa.\nDa implementare con il contenuto specifico del sito.');
   window.open('/info.html', '_parent');
}

// Mostra cookie policy (da implementare)
function showCookiePolicy() {
    alert('Qui verrebbe mostrata la cookie policy completa.\nDa implementare con il contenuto specifico del sito.');
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

// Carica gli stili CSS per il popup privacy
function loadPrivacyCSS() {
    const cssId = 'privacy-popup-css';
    if (!document.getElementById(cssId)) {
        const head = document.getElementsByTagName('head')[0];
        const link = document.createElement('style');
        link.id = cssId;
        link.innerHTML = `
            /* Privacy Popup Styles */
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
            
            .privacy-popup-show {
                opacity: 1 !important;
            }
            
            .privacy-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }
            
            .privacy-content {
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                transform: translateY(20px);
                transition: transform 0.3s ease;
            }
            
            .privacy-popup-show .privacy-content {
                transform: translateY(0);
            }
            
            .privacy-header {
                padding: 2rem 2rem 0;
                display: flex;
                align-items: center;
                gap: 1rem;
                position: relative;
            }
            
            .privacy-header i {
                font-size: 2rem;
                color: var(--primary-color, #ff9900);
            }
            
            .privacy-header h3 {
                margin: 0;
                color: #333;
                font-size: 1.5rem;
                flex-grow: 1;
            }
            
            .privacy-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: #f5f5f5;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .privacy-close:hover {
                background: #e0e0e0;
                transform: scale(1.1);
            }
            
            .privacy-body {
                padding: 1rem 2rem;
            }
            
            .privacy-body > p {
                margin-bottom: 1.5rem;
                color: #666;
                line-height: 1.6;
            }
            
            .privacy-options {
                space-y: 1rem;
            }
            
            .privacy-option {
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
                transition: all 0.3s ease;
            }
            
            .privacy-option:hover {
                border-color: var(--primary-color, #ff9900);
                box-shadow: 0 2px 8px rgba(255, 153, 0, 0.1);
            }
            
            .privacy-option-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 0.5rem;
            }
            
            .privacy-switch {
                position: relative;
                display: inline-block;
                width: 48px;
                height: 24px;
                flex-shrink: 0;
            }
            
            .privacy-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .privacy-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 24px;
            }
            
            .privacy-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            input:checked + .privacy-slider {
                background-color: var(--primary-color, #ff9900);
            }
            
            input:checked + .privacy-slider:before {
                transform: translateX(24px);
            }
            
            input:disabled + .privacy-slider {
                background-color: #4CAF50;
                cursor: not-allowed;
            }
            
            .privacy-required {
                background: #e8f5e8;
                color: #2e7d32;
                padding: 0.2rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .privacy-option strong {
                flex-grow: 1;
                color: #333;
            }
            
            .privacy-option p {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .privacy-footer {
                padding: 1rem 2rem 2rem;
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .privacy-btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                flex: 1;
                min-width: 120px;
            }
            
            .privacy-btn-secondary {
                background: #f5f5f5;
                color: #666;
            }
            
            .privacy-btn-secondary:hover {
                background: #e0e0e0;
            }
            
            .privacy-btn-primary {
                background: var(--primary-color, #ff9900);
                color: white;
            }
            
            .privacy-btn-primary:hover {
                background: #e6870a;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 153, 0, 0.3);
            }
            
            .privacy-btn-success {
                background: #4CAF50;
                color: white;
            }
            
            .privacy-btn-success:hover {
                background: #45a049;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
            }
            
            .privacy-links {
                text-align: center;
                padding: 0 2rem 2rem;
                border-top: 1px solid #f0f0f0;
                margin-top: 1rem;
                padding-top: 1rem;
            }
            
            .privacy-links a {
                color: var(--primary-color, #ff9900);
                text-decoration: none;
                font-size: 0.9rem;
            }
            
            .privacy-links a:hover {
                text-decoration: underline;
            }
            
            /* Privacy Notification */
            .privacy-notification {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                background: #4CAF50;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10001;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            }
            
            .privacy-notification-show {
                transform: translateX(0) !important;
            }
            
            /* Cookie Banner (alternativo minimalista) */
            .cookie-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(255, 255, 255, 0.98);
                border-top: 1px solid #e0e0e0;
                padding: 1rem;
                z-index: 9999;
                backdrop-filter: blur(10px);
                box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .cookie-banner-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
            }
            
            .cookie-text {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #666;
                font-size: 0.9rem;
            }
            
            .cookie-text i {
                color: var(--primary-color, #ff9900);
                font-size: 1.2rem;
            }
            
            .cookie-buttons {
                display: flex;
                gap: 0.5rem;
            }
            
            .cookie-btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.3rem;
            }
            
            .cookie-btn-settings {
                background: #f5f5f5;
                color: #666;
            }
            
            .cookie-btn-settings:hover {
                background: #e0e0e0;
            }
            
            .cookie-btn-accept {
                background: var(--primary-color, #ff9900);
                color: white;
            }
            
            .cookie-btn-accept:hover {
                background: #e6870a;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(255, 153, 0, 0.3);
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .privacy-content {
                    width: 95%;
                    max-height: 95vh;
                }
                
                .privacy-header {
                    padding: 1.5rem 1.5rem 0;
                }
                
                .privacy-header h3 {
                    font-size: 1.2rem;
                }
                
                .privacy-body {
                    padding: 1rem 1.5rem;
                }
                
                .privacy-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    flex-direction: column;
                }
                
                .privacy-btn {
                    min-width: auto;
                }
                
                .cookie-banner-content {
                    flex-direction: column;
                    text-align: center;
                    gap: 0.8rem;
                }
                
                .privacy-notification {
                    bottom: 1rem;
                    right: 1rem;
                    left: 1rem;
                    text-align: center;
                }
            }
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