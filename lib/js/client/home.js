// JAVASCRIPT COMPLETO CON LE NUOVE FUNZIONALITÀ E INTEGRAZIONE DROPDOWN FOOTER

// Variabili globali
let allMaps = [];
let filteredMaps = [];
let isGridView = true;
let autoUpdateInterval;
let sortOrder = 'desc';
let selectedSuggestion = -1;
let searchSuggestions = [];
let searchTimeout = null;
let isSearching = false;

// Variabili per lo slider
let currentSlideIndex = 0;
let sliderInterval;
let featuredMaps = [];

// Variabili per breadcrumbs
let navigationPath = [];

// Variabili per la paginazione
let currentViewMode = 'pagination'; // 'infinite' or 'pagination'
let currentPage = 1;
let itemsPerPage = 12;
let totalPages = 1;

// ========= BREADCRUMBS NAVIGATION =========

function updateBreadcrumbs() {
    // Se esiste il sistema globale di breadcrumbs, usalo
    if (typeof window.updatePalermoHubBreadcrumbs === 'function') {
        window.updatePalermoHubBreadcrumbs();
        return;
    }
    
    // Altrimenti usa il sistema locale (fallback)
    const breadcrumbsContainer = document.querySelector('.breadcrumbs-container');
    const categoria = document.getElementById('categoria-filter').value;
    const territorio = document.getElementById('territorio-filter').value;
    const fonte = document.getElementById('fonte-filter').value;
    const anno = document.getElementById('anno-filter').value;
    const tag = document.getElementById('tag-filter').value;
    const collaborazione = document.getElementById('collaborazione-filter').value;
    const searchTerm = document.getElementById('smart-search-input').value;

    // Inizia sempre con Home
    let breadcrumbsHTML = `
        <div class="breadcrumb-item home" onclick="resetAllFilters()">
            <span class="breadcrumb-icon"><i class="fas fa-home"></i></span>
            <span class="breadcrumb-text">Home</span>
        </div>
    `;

    // Array per costruire il percorso
    const pathItems = [];

    // Aggiungi filtri al percorso
    if (categoria) {
        pathItems.push({
            type: 'categoria',
            value: categoria,
            icon: '<i class="fas fa-folder"></i>',
            onclick: `filterByBreadcrumb('categoria', '${categoria}')`
        });
    }

    if (territorio) {
        pathItems.push({
            type: 'territorio',
            value: territorio,
            icon: '<i class="fas fa-map-marked-alt"></i>',
            onclick: `filterByBreadcrumb('territorio', '${territorio}')`
        });
    }

    if (fonte) {
        pathItems.push({
            type: 'fonte',
            value: fonte.split(',')[0].trim(),
            icon: '<i class="fas fa-database"></i>',
            onclick: `filterByBreadcrumb('fonte', '${fonte}')`
        });
    }

    if (collaborazione) {
        pathItems.push({
            type: 'autore',
            value: collaborazione,
            icon: '<i class="fas fa-users"></i>',
            onclick: `filterByBreadcrumb('collaborazione', '${collaborazione}')`
        });
    }

    if (anno) {
        pathItems.push({
            type: 'anno',
            value: anno,
            icon: '<i class="fas fa-calendar-alt"></i>',
            onclick: `filterByBreadcrumb('anno', '${anno}')`
        });
    }

    if (tag) {
        pathItems.push({
            type: 'tag',
            value: tag,
            icon: '<i class="fas fa-tags"></i>',
            onclick: `filterByBreadcrumb('tag', '${tag}')`
        });
    }

    if (searchTerm) {
        pathItems.push({
            type: 'ricerca',
            value: searchTerm,
            icon: '<i class="fas fa-search"></i>',
            onclick: `clearSmartSearch()`
        });
    }

    // Costruisci il HTML per ogni elemento del percorso
    pathItems.forEach((item, index) => {
        breadcrumbsHTML += `
            <span class="breadcrumb-separator">›</span>
            <div class="breadcrumb-item ${index === pathItems.length - 1 ? 'active' : ''}" 
                 onclick="${item.onclick}" 
                 title="Clicca per filtrare solo per ${item.type}">
                <span class="breadcrumb-icon">${item.icon}</span>
                <span class="breadcrumb-text">${item.value}</span>
            </div>
        `;
    });

    breadcrumbsContainer.innerHTML = breadcrumbsHTML;

    // Mostra/nascondi la navigazione breadcrumbs
    const breadcrumbsNav = document.getElementById('breadcrumbs-nav');
    if (pathItems.length > 0) {
        breadcrumbsNav.style.display = 'block';
    } else {
        breadcrumbsNav.style.display = 'none';
    }
}

function filterByBreadcrumb(filterType, value) {
    // Reset tutti i filtri eccetto quello specificato
    document.querySelectorAll('.filter-select').forEach(select => {
        select.value = '';
    });
    document.getElementById('smart-search-input').value = '';
    hideSuggestions();

    // Applica solo il filtro specificato
    switch(filterType) {
        case 'categoria':
            document.getElementById('categoria-filter').value = value;
            break;
        case 'territorio':
            document.getElementById('territorio-filter').value = value;
            break;
        case 'fonte':
            document.getElementById('fonte-filter').value = value;
            break;
        case 'anno':
            document.getElementById('anno-filter').value = value;
            break;
        case 'tag':
            document.getElementById('tag-filter').value = value;
            break;
        case 'collaborazione':
            document.getElementById('collaborazione-filter').value = value;
            break;
    }

    applyFilters();
    scrollToFilters();
}

function scrollToFilters() {
    const mainContent = document.querySelector('.main-content');
    const filtersSection = document.querySelector('.filters-section');
    const offsetTop = filtersSection.offsetTop - mainContent.offsetTop;
    
    mainContent.scrollTo({ 
        top: offsetTop,
        behavior: 'smooth'
    });
}

// ========= HERO SLIDER =========

function initializeSlider() {
    if (allMaps.length === 0) return;

    // Seleziona 5 mappe per lo slider (le più recenti o casuali)
    featuredMaps = selectFeaturedMaps();
    
    if (featuredMaps.length === 0) return;

    createSliderSlides();
    updateSliderInfo();
    startSliderAutoplay();
}

function selectFeaturedMaps() {
    if (allMaps.length === 0) return [];

    // Prendi le 5 mappe più recenti o le prime 5 se non c'è anno
    const sortedMaps = [...allMaps].sort((a, b) => {
        const yearA = parseInt(a.anno) || 0;
        const yearB = parseInt(b.anno) || 0;
        return yearB - yearA;
    });

    return sortedMaps.slice(0, 5);
}

function createSliderSlides() {
    const slidesWrapper = document.getElementById('slides-wrapper');
    const dotsContainer = document.getElementById('slider-dots');
    
    if (!featuredMaps.length) {
        slidesWrapper.innerHTML = '<div class="hero-slide"><div class="slide-overlay"><div class="slide-title">Caricamento mappe...</div></div></div>';
        return;
    }

    // Crea le slides
    slidesWrapper.innerHTML = featuredMaps.map((map, index) => {
        const imageUrl = getImageUrl(map, index);
        const fallbackUrl = createFallbackImage();
        
        return `
            <div class="hero-slide" onclick="openMap('${map.url || map.URL || ''}')">
                <img src="${imageUrl}" 
                     alt="${map.titolo}" 
                     class="slide-image"
                     onerror="this.src='${fallbackUrl}';">
                <div class="slide-overlay">
                    <div class="slide-title">${map.titolo}</div>
                    <div class="slide-description">${map.descrizione || 'Scopri questa mappa interattiva'}</div>
                    <div class="slide-meta">
                        <div class="slide-category">${map.categoria || 'Generale'}</div>
                        <div class="slide-territory">${map.territorio || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Crea i dots
    dotsContainer.innerHTML = featuredMaps.map((_, index) => 
        `<div class="slider-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`
    ).join('');

    // Reset della posizione
    currentSlideIndex = 0;
    updateSliderPosition();
}

function updateSliderInfo() {
    document.getElementById('current-slide').textContent = currentSlideIndex + 1;
    document.getElementById('total-slides').textContent = featuredMaps.length;
}

function changeSlide(direction) {
    if (featuredMaps.length === 0) return;

    currentSlideIndex += direction;
    
    if (currentSlideIndex >= featuredMaps.length) {
        currentSlideIndex = 0;
    } else if (currentSlideIndex < 0) {
        currentSlideIndex = featuredMaps.length - 1;
    }
    
    updateSliderPosition();
    updateSliderDots();
    updateSliderInfo();
    
    // Reset dell'autoplay
    stopSliderAutoplay();
    startSliderAutoplay();
}

function goToSlide(index) {
    currentSlideIndex = index;
    updateSliderPosition();
    updateSliderDots();
    updateSliderInfo();
    
    stopSliderAutoplay();
    startSliderAutoplay();
}

function updateSliderPosition() {
    const slidesWrapper = document.getElementById('slides-wrapper');
    const translateX = -(currentSlideIndex * 20); // 20% per slide
    slidesWrapper.style.transform = `translateX(${translateX}%)`;
}

function updateSliderDots() {
    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlideIndex);
    });
}

function startSliderAutoplay() {
    sliderInterval = setInterval(() => {
        changeSlide(1);
    }, 5000); // Cambia slide ogni 5 secondi
}

function stopSliderAutoplay() {
    if (sliderInterval) {
        clearInterval(sliderInterval);
    }
}

// Pausa autoplay quando mouse entra nello slider
function pauseSliderOnHover() {
    const slider = document.getElementById('hero-slider');
    
    slider.addEventListener('mouseenter', stopSliderAutoplay);
    slider.addEventListener('mouseleave', startSliderAutoplay);
}

// ========= RICERCA INTELLIGENTE MIGLIORATA =========

class SmartSearch {
    constructor() {
        this.searchIndex = new Map();
        this.stopWords = new Set(['il', 'la', 'di', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'a', 'e', 'o', 'ma', 'se', 'del', 'della', 'dei', 'delle', 'nel', 'nella', 'nei', 'nelle', 'sul', 'sulla', 'sui', 'sulle']);
        this.buildSearchIndex();
    }

    buildSearchIndex() {
        allMaps.forEach((map, index) => {
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
        if (!query || query.length < 2) {
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
            const map = allMaps[index];
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
        
        return results.slice(0, 8);
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
                highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
            }
        });
        
        return highlightedText;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

let smartSearch = null;

function initializeSmartSearch() {
    smartSearch = new SmartSearch();
}

function handleSmartSearchInput(event) {
    const query = event.target.value.trim();
    const clearBtn = document.getElementById('search-clear-btn');
    
    clearBtn.classList.toggle('visible', query.length > 0);
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    if (query.length < 2) {
        hideSuggestions();
        applyFilters();
        return;
    }
    
    showSearchStatus('Ricerca in corso...', true);
    
    searchTimeout = setTimeout(() => {
        performSmartSearch(query);
    }, 300);
}

function performSmartSearch(query) {
    if (!smartSearch) {
        hideSearchStatus();
        return;
    }
    
    isSearching = true;
    
    try {
        const results = smartSearch.search(query);
        displaySmartSuggestions(results, query);
        
        applyFilters();
        
        const resultText = results.length + ' risultat' + (results.length !== 1 ? 'i' : 'o') + ' trovat' + (results.length !== 1 ? 'i' : 'o');
        showSearchStatus(resultText, false);
        
    } catch (error) {
        console.error('Errore nella ricerca:', error);
        showSearchStatus('Errore nella ricerca', false);
        hideSuggestions();
    } finally {
        isSearching = false;
    }
}

function showSearchStatus(message, searching) {
    searching = searching || false;
    const statusElement = document.getElementById('search-status');
    statusElement.innerHTML = searching 
        ? '<div class="search-spinner"></div> ' + message
        : message;
    statusElement.className = 'search-status' + (searching ? ' searching' : '');
}

function hideSearchStatus() {
    const statusElement = document.getElementById('search-status');
    statusElement.textContent = '';
    statusElement.className = 'search-status';
}

function displaySmartSuggestions(results, query) {
    const suggestionsContainer = document.getElementById('smart-suggestions');
    const suggestionsList = document.getElementById('suggestions-list');
    const suggestionsCount = document.getElementById('suggestions-count');
    
    searchSuggestions = results;
    selectedSuggestion = -1;
    
    suggestionsCount.textContent = results.length + " risultat" + (results.length !== 1 ? 'i' : 'o');
    
    if (results.length === 0) {
        suggestionsList.innerHTML = '<div class="no-results-suggestion">' +
            '<div class="icon"><i class="fas fa-search"></i></div>' +
            '<div>Nessun risultato trovato per "<strong>' + query + '</strong>"</div>' +
            '<div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">' +
                'Prova con parole chiave diverse o meno specifiche' +
            '</div>' +
        '</div>';
    } else {
        suggestionsList.innerHTML = results.map((result, index) => {
            const relevanceClass = result.relevance > 0.7 ? 'high' : 
                                 result.relevance > 0.4 ? 'medium' : 'low';
            
            const imageUrl = getImageUrl(result.map, index);
            const relevancePercent = Math.round(result.relevance * 100);
            
            return '<div class="suggestion-item" data-index="' + index + '">' +
                '<img src="' + imageUrl + '" ' +
                     'alt="' + result.map.titolo + '" ' +
                     'class="suggestion-preview"' +
                     'onerror="this.style.display=\'none\'">' +
                '<div class="suggestion-content">' +
                    '<div class="suggestion-title">' + result.highlightedTitle + '</div>' +
                    '<div class="suggestion-description">' + result.highlightedDescription + '</div>' +
                    '<div class="suggestion-meta">' +
                        '<span class="suggestion-match-type">' + result.matchType + '</span>' +
                        '<span class="suggestion-tag">' + (result.map.territorio || 'N/A') + '</span>' +
                        '<span class="suggestion-tag">' + (result.map.anno || 'N/A') + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="suggestion-relevance ' + relevanceClass + '" ' +
                     'title="Rilevanza: ' + relevancePercent + '%"></div>' +
            '</div>';
        }).join('');
    }
    
    suggestionsContainer.classList.add('visible');
    
    suggestionsList.querySelectorAll('.suggestion-item').forEach((item, index) => {
        item.addEventListener('click', () => selectSmartSuggestion(index));
    });
}

function selectSmartSuggestion(index) {
    if (index >= 0 && index < searchSuggestions.length) {
        const result = searchSuggestions[index];
        
        openMap(result.map.url || result.map.URL || '');
        
        hideSuggestions();
    }
}

function handleSmartSearchKeyboard(event) {
    const suggestionsContainer = document.getElementById('smart-suggestions');
    
    if (!suggestionsContainer.classList.contains('visible')) {
        return;
    }
    
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            selectedSuggestion = Math.min(selectedSuggestion + 1, searchSuggestions.length - 1);
            updateSuggestionSelection();
            break;
        case 'ArrowUp':
            event.preventDefault();
            selectedSuggestion = Math.max(selectedSuggestion - 1, -1);
            updateSuggestionSelection();
            break;
        case 'Enter':
            event.preventDefault();
            if (selectedSuggestion >= 0) {
                selectSmartSuggestion(selectedSuggestion);
            } else {
                hideSuggestions();
                applyFilters();
            }
            break;
        case 'Escape':
            hideSuggestions();
            break;
    }
}

function updateSuggestionSelection() {
    const items = document.querySelectorAll('.suggestion-item');
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedSuggestion);
    });
    
    if (selectedSuggestion >= 0) {
        const selectedItem = items[selectedSuggestion];
        if (selectedItem) {
            selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
}

function hideSuggestions() {
    document.getElementById('smart-suggestions').classList.remove('visible');
    selectedSuggestion = -1;
    hideSearchStatus();
}

function clearSmartSearch() {
    document.getElementById('smart-search-input').value = '';
    document.getElementById('search-clear-btn').classList.remove('visible');
    hideSuggestions();
    applyFilters();
}

// ========= RESTO DELLE FUNZIONI ORIGINALI =========

function parseDate(dateString) {
    if (!dateString) return new Date(0);
    
    const formats = [
        /(\d{4})-(\d{2})-(\d{2})/,
        /(\d{2})\/(\d{2})\/(\d{4})/,
        /(\d{2})-(\d{2})-(\d{4})/,
        /(\d{4})\/(\d{2})\/(\d{2})/,
    ];
    
    for (let format of formats) {
        const match = dateString.match(format);
        if (match) {
            if (format.source.includes('(\\d{4})')) {
                return new Date(match[1], match[2] - 1, match[3]);
            } else {
                return new Date(match[3], match[2] - 1, match[1]);
            }
        }
    }
    
    const parsed = Date.parse(dateString);
    return isNaN(parsed) ? new Date(0) : new Date(parsed);
}

function sortMapsByDate() {
    filteredMaps.sort((a, b) => {
        const dateA = parseDate(a.anno || a.data || a.created || '');
        const dateB = parseDate(b.anno || b.data || b.created || '');
        
        if (sortOrder === 'desc') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });
    
    displayMaps();
    updateSortIndicator();
}

function updateSortIndicator() {
    const indicator = document.querySelector('.sort-indicator');
    if (indicator) {
        indicator.textContent = sortOrder === 'desc' ? '↓' : '↑';
    }
}


// AGGIORNAMENTO PER LA FUNZIONE loadMapsData in home.js
// Sostituire la parte finale della funzione loadMapsData con questo codice:

async function loadMapsData(showMessage = false) {
    try {
        if (showMessage) {
            document.getElementById('maps-container').innerHTML = 
                '<div class="loading">Aggiornamento dati in corso...</div>';
        }

        const csvFilePath = 'dati-palermo-hub/palermo-hub.csv';
        
        const response = await fetch(csvFilePath);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            delimiter: ',',
            quotes: true,
            quoteChar: '"',
            escapeChar: '"',
            transformHeader: function(header) {
                return header.trim().toLowerCase();
            },
            transform: function(value, header) {
                return value ? value.trim() : '';
            },
            complete: function(results) {
                allMaps = results.data.filter(row => row.titolo && row.titolo.trim() !== '');
                
                console.log(`📊 home.js: Caricati ${allMaps.length} record dal CSV`);
                
                filteredMaps = [...allMaps];
                populateFilters();
                applyFilters();
                updateStatistics();
                updateLastUpdateTime();
                initializeSmartSearch();
                initializeSlider();
                updateBreadcrumbs();
                
                // ✅ INTEGRAZIONE RICERCA FOOTER - VERSIONE AGGIORNATA
                console.log('📡 home.js: Sincronizzando dati con footer search...');
                
                // Trigger evento personalizzato per il footer
                document.dispatchEvent(new CustomEvent('mapsDataLoaded', { 
                    detail: { maps: allMaps, count: allMaps.length, source: 'home.js' } 
                }));
                
                // Aggiorna direttamente il footer con retry
                if (typeof window.updateFooterMapData === 'function') {
                    // Tentativo immediato
                    setTimeout(() => {
                        console.log('🔄 home.js: Primo tentativo updateFooterMapData...');
                        window.updateFooterMapData();
                    }, 100);
                    
                    // Tentativo di backup
                    setTimeout(() => {
                        console.log('🔄 home.js: Secondo tentativo updateFooterMapData...');
                        window.updateFooterMapData();
                    }, 500);
                } else {
                    console.log('⚠️ home.js: updateFooterMapData non disponibile');
                }
                
                // Aggiorna anche loadFooterMapData se esiste
                if (typeof window.loadFooterMapData === 'function') {
                    setTimeout(() => {
                        console.log('🔄 home.js: Chiamando loadFooterMapData...');
                        window.loadFooterMapData();
                    }, 300);
                } else {
                    console.log('⚠️ home.js: loadFooterMapData non disponibile');
                }
            },
            error: function(error) {
                console.error('❌ home.js: Errore nel parsing del CSV:', error);
                document.getElementById('maps-container').innerHTML = 
                    '<div class="no-results">⚠ Errore nel parsing del CSV</div>';
            }
        });
    } catch (error) {
        console.error('❌ home.js: Errore nel caricamento dati:', error);
        document.getElementById('maps-container').innerHTML = 
            '<div class="no-results">⚠ Errore nel caricamento dei dati: ' + error.message + '</div>';
    }
}

// AGGIUNTA: Funzione per verificare la sincronizzazione
function checkFooterSync() {
    console.log('🔍 home.js: Verifica sincronizzazione footer:', {
        allMaps: allMaps ? allMaps.length : 'undefined',
        updateFooterMapDataExists: typeof window.updateFooterMapData === 'function',
        loadFooterMapDataExists: typeof window.loadFooterMapData === 'function'
    });
    
    // Forza aggiornamento se i dati sono disponibili
    if (allMaps && allMaps.length > 0) {
        if (typeof window.updateFooterMapData === 'function') {
            console.log('🔄 home.js: Forzatura aggiornamento footer...');
            window.updateFooterMapData();
        }
        if (typeof window.loadFooterMapData === 'function') {
            window.loadFooterMapData();
        }
    }
}

// Esporta la funzione per uso globale
window.checkFooterSync = checkFooterSync;








function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('it-IT');
    document.getElementById('last-update').textContent = 
        'Ultimo aggiornamento: ' + dateString + ' alle ' + timeString;
}

function updateStatistics() {
    if (allMaps.length === 0) return;

    const categories = new Set();
    const territories = new Set();
    const authors = new Set();

    allMaps.forEach(map => {
        if (map.categoria) {
            map.categoria.split(',').forEach(cat => {
                categories.add(cat.trim());
            });
        }
        
        if (map.territorio) {
            map.territorio.split(',').forEach(territory => {
                territories.add(territory.trim());
            });
        }
        
        if (map.collaborazione) {
            map.collaborazione.split(',').forEach(author => {
                authors.add(author.trim());
            });
        }
    });

    document.getElementById('total-maps').textContent = allMaps.length;
    document.getElementById('total-categories').textContent = categories.size;
    document.getElementById('total-territories').textContent = territories.size;
    document.getElementById('total-authors').textContent = authors.size;
    document.getElementById('filtered-maps').textContent = filteredMaps.length;
}

function setupAutoUpdate() {
    autoUpdateInterval = setInterval(() => {
        loadMapsData(true);
    }, 30 * 60 * 1000);
}

function filterByTag(tagName) {
    document.querySelectorAll('.filter-select').forEach(select => {
        if (select.id !== 'tag-filter') {
            select.value = '';
        }
    });
    document.getElementById('smart-search-input').value = '';
    hideSuggestions();
    
    document.getElementById('tag-filter').value = tagName;
    applyFilters();
    
    scrollToFilters();
}

function filterByAuthor(authorName) {
    document.querySelectorAll('.filter-select').forEach(select => {
        if (select.id !== 'collaborazione-filter') {
            select.value = '';
        }
    });
    document.getElementById('smart-search-input').value = '';
    hideSuggestions();
    
    document.getElementById('collaborazione-filter').value = authorName;
    applyFilters();
    
    scrollToFilters();
}

function populateFilters() {
    const currentFilters = {
        categoria: document.getElementById('categoria-filter').value,
        territorio: document.getElementById('territorio-filter').value,
        fonte: document.getElementById('fonte-filter').value,
        anno: document.getElementById('anno-filter').value,
        tag: document.getElementById('tag-filter').value,
        collaborazione: document.getElementById('collaborazione-filter').value
    };

    let baseMaps = [...allMaps];
    
    if (currentFilters.categoria) {
        baseMaps = baseMaps.filter(map => 
            map.categoria && map.categoria.split(',').some(cat => cat.trim() === currentFilters.categoria)
        );
    }
    if (currentFilters.territorio) {
        baseMaps = baseMaps.filter(map => 
            map.territorio && map.territorio.split(',').some(t => t.trim() === currentFilters.territorio)
        );
    }
    if (currentFilters.fonte) {
        baseMaps = baseMaps.filter(map => 
            map.fontedati && map.fontedati.split(',').some(f => f.trim() === currentFilters.fonte)
        );
    }
    if (currentFilters.anno) {
        baseMaps = baseMaps.filter(map => map.anno === currentFilters.anno);
    }
    if (currentFilters.collaborazione) {
        baseMaps = baseMaps.filter(map => 
            map.collaborazione && map.collaborazione.split(',').some(c => c.trim() === currentFilters.collaborazione)
        );
    }
    if (currentFilters.tag) {
        baseMaps = baseMaps.filter(map => 
            map.tag && map.tag.split(',').some(t => t.trim() === currentFilters.tag)
        );
    }

    const filters = {
        'categoria-filter': new Set(),
        'territorio-filter': new Set(),
        'fonte-filter': new Set(),
        'anno-filter': new Set(),
        'tag-filter': new Set(),
        'collaborazione-filter': new Set()
    };

    baseMaps.forEach(map => {
        if (map.categoria) {
            map.categoria.split(',').forEach(cat => {
                const cleanCat = cat.trim();
                if (cleanCat) filters['categoria-filter'].add(cleanCat);
            });
        }
        
        if (map.territorio) {
            map.territorio.split(',').forEach(territory => {
                const cleanTerritory = territory.trim();
                if (cleanTerritory) filters['territorio-filter'].add(cleanTerritory);
            });
        }
        
        if (map.fontedati) {
            map.fontedati.split(',').forEach(fonte => {
                const cleanFonte = fonte.trim();
                if (cleanFonte) filters['fonte-filter'].add(cleanFonte);
            });
        }
        
        if (map.anno) {
            filters['anno-filter'].add(map.anno.trim());
        }
        
        if (map.collaborazione) {
            map.collaborazione.split(',').forEach(collab => {
                const cleanCollab = collab.trim();
                if (cleanCollab) filters['collaborazione-filter'].add(cleanCollab);
            });
        }
        
        if (map.tag) {
            map.tag.split(',').forEach(tag => {
                const cleanTag = tag.trim();
                if (cleanTag) filters['tag-filter'].add(cleanTag);
            });
        }
    });

    Object.keys(filters).forEach(filterId => {
        const select = document.getElementById(filterId);
        const currentValue = select.value;
        
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        const sortedValues = Array.from(filters[filterId]).sort();
        
        sortedValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
        
        if (currentValue && sortedValues.includes(currentValue)) {
            select.value = currentValue;
        } else if (currentValue && !sortedValues.includes(currentValue)) {
            select.value = '';
        }
    });
}

function applyFilters() {
    const categoria = document.getElementById('categoria-filter').value;
    const territorio = document.getElementById('territorio-filter').value;
    const fonte = document.getElementById('fonte-filter').value;
    const anno = document.getElementById('anno-filter').value;
    const tag = document.getElementById('tag-filter').value;
    const collaborazione = document.getElementById('collaborazione-filter').value;
    const searchTerm = document.getElementById('smart-search-input').value.toLowerCase();

    filteredMaps = allMaps.filter(map => {
        const matchesCategoria = !categoria || (map.categoria && 
            map.categoria.split(',').some(cat => cat.trim() === categoria));
        
        const matchesTerritorio = !territorio || (map.territorio && 
            map.territorio.split(',').some(t => t.trim() === territorio));
        
        const matchesFonte = !fonte || (map.fontedati && 
            map.fontedati.split(',').some(f => f.trim() === fonte));
        
        const matchesAnno = !anno || map.anno === anno;
        
        const matchesCollaborazione = !collaborazione || (map.collaborazione && 
            map.collaborazione.split(',').some(c => c.trim() === collaborazione));
        
        const matchesTag = !tag || (map.tag && 
            map.tag.split(',').some(t => t.trim() === tag));
        
        const matchesSearch = !searchTerm || 
            map.titolo.toLowerCase().includes(searchTerm) ||
            (map.descrizione && map.descrizione.toLowerCase().includes(searchTerm)) ||
            (map.tag && map.tag.toLowerCase().includes(searchTerm)) ||
            (map.territorio && map.territorio.toLowerCase().includes(searchTerm)) ||
            (map.collaborazione && map.collaborazione.toLowerCase().includes(searchTerm));

        return matchesCategoria && matchesTerritorio && matchesFonte && 
               matchesAnno && matchesTag && matchesCollaborazione && matchesSearch;
    });

    populateFilters();
    sortMapsByDate();
    updateMapCount();
    updateStatistics();
    updateBreadcrumbs();
}

function createFallbackImage() {
    const svg = '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">' +
        '<rect width="100%" height="100%" fill="#f0f2f5"/>' +
        '<text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" ' +
              'fill="#657786" text-anchor="middle" dy=".3em">' +
            'Immagine non disponibile' +
        '</text>' +
    '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function getImageUrl(mapData, index) {
    const possibleImageFields = ['img', 'image', 'immagine', 'foto', 'picture'];
    let imageField = null;
    
    for (const field of possibleImageFields) {
        if (mapData[field] && mapData[field].trim() !== '') {
            imageField = mapData[field];
            break;
        }
    }
    
    if (!imageField || imageField.trim() === '') {
        return createFallbackImage();
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
        return createFallbackImage();
    }
}

// ========= SISTEMA BREADCRUMBS SEMPLICE PER MAPPE =========

// Modifica la funzione originale openMap per aggiungere parametri
function openMapWithBreadcrumbs(url, mapData) {
    if (!url || url === '') return;
    
    // Costruisci i parametri per i breadcrumbs
    const params = new URLSearchParams();
    
    if (mapData.titolo) {
        params.set('mapTitle', encodeURIComponent(mapData.titolo));
    }
    if (mapData.categoria) {
        params.set('categoria', encodeURIComponent(mapData.categoria.split(',')[0].trim()));
    }
    if (mapData.territorio) {
        params.set('territorio', encodeURIComponent(mapData.territorio.split(',')[0].trim()));
    }
    if (mapData.anno) {
        params.set('anno', encodeURIComponent(mapData.anno));
    }
    if (mapData.collaborazione) {
        params.set('autore', encodeURIComponent(mapData.collaborazione.split(',')[0].trim()));
    }
    
    // Aggiungi i parametri all'URL della mappa
    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = url + separator + params.toString();
    
    // Apri la mappa (stesso comportamento originale)
    window.location.href = finalUrl;
}

// Modifica la funzione displayMaps per usare la nuova apertura
function displayMapsWithBreadcrumbs() {
    const container = document.getElementById('maps-container');
    container.className = isGridView ? 'maps-grid' : 'maps-list';

    if (filteredMaps.length === 0) {
        container.innerHTML = '<div class="no-results"><i class="fas fa-search"></i> Nessuna mappa trovata con i filtri selezionati</div>';
        // Nascondi i controlli di paginazione se non ci sono risultati
        document.getElementById('pagination-controls').style.display = 'none';
        return;
    }

    // Calcola le mappe da visualizzare in base alla modalità 
    let mapsToDisplay = filteredMaps;
    
    if (currentViewMode === 'pagination') {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        mapsToDisplay = filteredMaps.slice(startIndex, endIndex);
        
        // Mostra i controlli di paginazione
        document.getElementById('pagination-controls').style.display = 'flex';
        updatePaginationControls();
    } else {
        // Nascondi i controlli di paginazione per lo scroll infinito
        document.getElementById('pagination-controls').style.display = 'none';
    }

    container.innerHTML = mapsToDisplay.map((map, index) => {
        const tags = map.tag ? map.tag.split(',').slice(0, 3).map(tag => 
            `<span class="meta-tag" onclick="filterByTag('${tag.trim()}'); event.stopPropagation();" title="Clicca per filtrare per questo tag">${tag.trim()}</span>`
        ).join('') : '';

        const authors = map.collaborazione ? map.collaborazione.split(',').map(author => 
            `<span class="author-tag" onclick="filterByAuthor('${author.trim()}'); event.stopPropagation();" title="Clicca per filtrare per questo autore">${author.trim()}</span>`
        ).join('') : '<span class="author-tag">N/A</span>';

        const imageUrl = getImageUrl(map, index);
        const fallbackUrl = createFallbackImage();
        const territories = map.territorio ? map.territorio.split(',').map(t => t.trim()).join(', ') : 'N/A';

        // Escape dei dati per JSON
        const mapDataJson = JSON.stringify(map).replace(/"/g, '&quot;');

        if (isGridView) {
            return `<div class="map-card" onclick="openMapWithBreadcrumbs('${map.url || map.URL || ''}', ${mapDataJson})">
                <img src="${imageUrl}" 
                     alt="${map.titolo}" 
                     class="map-image" 
                     onerror="this.src='${fallbackUrl}';">
                <div class="map-content">
                    <h3 class="map-title">${map.titolo}</h3>
                    <p class="map-description">${map.descrizione || 'Nessuna descrizione disponibile'}</p>
                    <div class="map-meta">${tags}</div>
                    <div class="map-authors">
                        <strong><i class="fas fa-users"></i> Autori:</strong>
                        <div class="author-list">${authors}</div>
                    </div>
                    <div class="map-info">
                        <div class="map-info-item"><strong><i class="fas fa-map-marked-alt"></i> Territorio:</strong> ${territories}</div>
                        <div class="map-info-item"><strong><i class="fas fa-calendar-alt"></i> Anno:</strong> ${map.anno || 'N/A'}</div>
                        <div class="map-info-item"><strong><i class="fas fa-database"></i> Fonte:</strong> ${(map.fontedati || 'N/A').split(',')[0].trim()}</div>
                        <div class="map-info-item"><strong><i class="fas fa-folder"></i> Categoria:</strong> ${map.categoria || 'N/A'}</div>
                    </div>
                </div>
            </div>`;
        } else {
            return `<div class="map-card" onclick="openMapWithBreadcrumbs('${map.url || map.URL || ''}', ${mapDataJson})">
                <img src="${imageUrl}" 
                     alt="${map.titolo}" 
                     class="map-image" 
                     onerror="this.src='${fallbackUrl}';">
                <div class="map-content">
                    <h3 class="map-title">${map.titolo}</h3>
                    <p class="map-description">${map.descrizione || 'Nessuna descrizione disponibile'}</p>
                    <div class="map-meta">${tags}</div>
                    <div class="map-authors">
                        <strong><i class="fas fa-users"></i> Autori:</strong>
                        <div class="author-list">${authors}</div>
                    </div>
                </div>
                <div class="map-info-sidebar">
                    <div class="map-info-item">
                        <div class="map-info-label"><i class="fas fa-map-marked-alt"></i> Territorio</div>
                        <div class="map-info-value">${territories}</div>
                    </div>
                    <div class="map-info-item">
                        <div class="map-info-label"><i class="fas fa-calendar-alt"></i> Anno</div>
                        <div class="map-info-value">${map.anno || 'N/A'}</div>
                    </div>
                    <div class="map-info-item">
                        <div class="map-info-label"><i class="fas fa-database"></i> Fonte Dati</div>
                        <div class="map-info-value">${(map.fontedati || 'N/A').split(',')[0].trim()}</div>
                    </div>
                    <div class="map-info-item">
                        <div class="map-info-label"><i class="fas fa-folder"></i> Categoria</div>
                        <div class="map-info-value">${map.categoria || 'N/A'}</div>
                    </div>
                </div>
            </div>`;
        }
    }).join('');
}

// ========= SISTEMA PER PAGINE MAPPA =========

// Funzione per inizializzare i breadcrumbs nelle pagine mappa
function initMapPageBreadcrumbs() {
    // Controlla se siamo in una pagina diversa dall'index
    const currentPage = window.location.pathname.split('/').pop();
    const isIndexPage = !currentPage || currentPage === 'index.html' || currentPage === '';
    
    if (isIndexPage) return;
    
    // Leggi i parametri dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('mapTitle')) {
        const mapData = {
            titolo: decodeURIComponent(urlParams.get('mapTitle')),
            categoria: urlParams.get('categoria') ? decodeURIComponent(urlParams.get('categoria')) : null,
            territorio: urlParams.get('territorio') ? decodeURIComponent(urlParams.get('territorio')) : null,
            anno: urlParams.get('anno') ? decodeURIComponent(urlParams.get('anno')) : null,
            collaborazione: urlParams.get('autore') ? decodeURIComponent(urlParams.get('autore')) : null
        };
        
        createMapBreadcrumbs(mapData);
    }
}

// Crea i breadcrumbs per la pagina mappa
function createMapBreadcrumbs(mapData) {
    // Usa il sistema globale se disponibile
    if (document.getElementById('ph-breadcrumbs-list')) {
        createGlobalMapBreadcrumbs(mapData);
    } else {
        createLocalMapBreadcrumbs(mapData);
    }
}

// Crea breadcrumbs nel sistema globale
function createGlobalMapBreadcrumbs(mapData) {
    const breadcrumbsList = document.getElementById('ph-breadcrumbs-list');
    const breadcrumbsEl = document.getElementById('ph-breadcrumbs');
    
    if (!breadcrumbsList) return;
    
    const path = buildBreadcrumbPath(mapData);
    
    let html = '<li><a href="index.html" class="ph-breadcrumb-link">Home</a></li>';
    
    path.forEach((item, index) => {
        if (index === path.length - 1) {
            // Ultimo elemento: nome mappa
            html += `<li><span class="ph-breadcrumb-current map-name">${item.value}</span></li>`;
        } else {
            // Altri elementi: link all'index con filtro
            const filterUrl = createFilterUrl(item.type, item.value);
            html += `<li><a href="${filterUrl}" class="ph-breadcrumb-link" title="Filtra per ${item.type}">${item.value}</a></li>`;
        }
    });
    
    breadcrumbsList.innerHTML = html;
    
    if (breadcrumbsEl) {
        breadcrumbsEl.style.display = 'block';
        breadcrumbsEl.classList.add('map-page-breadcrumbs');
    }
}

// Crea breadcrumbs nel sistema locale
function createLocalMapBreadcrumbs(mapData) {
    let breadcrumbsNav = document.getElementById('breadcrumbs-nav');
    
    if (!breadcrumbsNav) {
        breadcrumbsNav = document.createElement('nav');
        breadcrumbsNav.id = 'breadcrumbs-nav';
        breadcrumbsNav.className = 'breadcrumbs-nav map-page';
        breadcrumbsNav.innerHTML = '<div class="breadcrumbs-container"></div>';
        
        // Inserisci dopo l'header se esiste
        const header = document.querySelector('header, .ph-header');
        if (header) {
            header.insertAdjacentElement('afterend', breadcrumbsNav);
        } else {
            document.body.insertBefore(breadcrumbsNav, document.body.firstChild);
        }
    }
    
    const container = breadcrumbsNav.querySelector('.breadcrumbs-container');
    const path = buildBreadcrumbPath(mapData);
    
    let html = `
        <div class="breadcrumb-item home" onclick="window.location.href='index.html'">
            <span class="breadcrumb-icon"><i class="fas fa-home"></i></span>
            <span class="breadcrumb-text">Home</span>
        </div>
    `;
    
    path.forEach((item, index) => {
        const isLast = index === path.length - 1;
        
        if (isLast) {
            html += `
                <span class="breadcrumb-separator">›</span>
                <div class="breadcrumb-item current-map">
                    <span class="breadcrumb-icon">${item.icon}</span>
                    <span class="breadcrumb-text">${item.value}</span>
                </div>
            `;
        } else {
            const filterUrl = createFilterUrl(item.type, item.value);
            html += `
                <span class="breadcrumb-separator">›</span>
                <div class="breadcrumb-item clickable" onclick="window.location.href='${filterUrl}'" title="Filtra per ${item.type}">
                    <span class="breadcrumb-icon">${item.icon}</span>
                    <span class="breadcrumb-text">${item.value}</span>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
    breadcrumbsNav.style.display = 'block';
}

// Costruisce il percorso dei breadcrumbs
function buildBreadcrumbPath(mapData) {
    const path = [];
    
    if (mapData.categoria) {
        path.push({ type: 'categoria', value: mapData.categoria, icon: '<i class="fas fa-folder"></i>' });
    }
    if (mapData.territorio) {
        path.push({ type: 'territorio', value: mapData.territorio, icon: '<i class="fas fa-map-marked-alt"></i>' });
    }
    if (mapData.anno) {
        path.push({ type: 'anno', value: mapData.anno, icon: '<i class="fas fa-calendar-alt"></i>' });
    }
    if (mapData.collaborazione) {
        path.push({ type: 'autore', value: mapData.collaborazione, icon: '<i class="fas fa-users"></i>' });
    }
    
    // Nome mappa sempre alla fine
    path.push({ type: 'mappa', value: mapData.titolo, icon: '<i class="fas fa-map-marked-alt"></i>' });
    
    return path;
}

// Crea URL per filtri
function createFilterUrl(filterType, value) {
    const baseUrl = 'index.html';
    
    // Mappa i tipi ai parametri URL corretti
    const typeMap = {
        'categoria': 'categoria',
        'territorio': 'territorio', 
        'anno': 'anno',
        'autore': 'autore'
    };
    
    const param = typeMap[filterType] || filterType;
    return `${baseUrl}?${param}=${encodeURIComponent(value)}`;
}

// CSS per i breadcrumbs delle mappe
const mapBreadcrumbsCSS = `
<style>
/* Breadcrumbs per pagine mappa */
.map-page-breadcrumbs {
    background: linear-gradient(135deg, rgba(255, 153, 0, 0.1), rgba(167, 199, 231, 0.1)) !important;
    border: 2px solid rgba(255, 153, 0, 0.3) !important;
}

.ph-breadcrumb-current.map-name {
    background: linear-gradient(135deg, #ff9900, #e6870a);
    color: white;
    padding: 0.4rem 1rem;
    border-radius: 15px;
    font-weight: 700;
}

.breadcrumbs-nav.map-page {
    background: linear-gradient(135deg, rgba(255, 153, 0, 0.1), rgba(167, 199, 231, 0.1));
    border: 2px solid rgba(255, 153, 0, 0.3);
}

.breadcrumb-item.current-map {
    background: linear-gradient(135deg, #ff9900, #e6870a);
    color: white;
    font-weight: 700;
    border-radius: 15px;
    padding: 0.6rem 1.2rem;
}

.breadcrumb-item.clickable:hover {
    background: rgba(255, 153, 0, 0.2);
    color: #ff9900;
    transform: translateY(-1px);
    cursor: pointer;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', mapBreadcrumbsCSS);

// ========= INIZIALIZZAZIONE =========

// Sostituisci displayMaps
if (typeof window !== 'undefined') {
    window.displayMaps = displayMapsWithBreadcrumbs;
    window.openMapWithBreadcrumbs = openMapWithBreadcrumbs;
    
    // Inizializza quando la pagina è pronta
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMapPageBreadcrumbs);
    } else {
        initMapPageBreadcrumbs();
    }
}

function updateMapCount() {
    document.getElementById('maps-count').textContent = 
        '🗺️' + filteredMaps.length + ' di ' + allMaps.length + ' mappe';
}

// MODIFICA: Ora apre nella stessa finestra invece di una nuova
function openMap(url) {
    if (url && url !== '') {
        window.location.href = url;
    }
}

function resetAllFilters() {
    document.querySelectorAll('.filter-select').forEach(select => {
        select.value = '';
    });
    
    document.getElementById('smart-search-input').value = '';
    hideSuggestions();
    applyFilters();
}

function clearFilters() {
    resetAllFilters();
}

function toggleView() {
    isGridView = !isGridView;
    const button = document.getElementById('view-toggle');
    button.innerHTML = isGridView ? '<i class="fas fa-list"></i> Lista' : '<i class="fas fa-th"></i> Griglia';
    displayMaps();
}

function toggleSort() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    sortMapsByDate();
}

function showActiveFiltersPopup() {
    document.getElementById('popup-overlay').classList.add('visible');
    document.getElementById('active-filters-popup').classList.add('visible');
}

function hideActiveFiltersPopup() {
    document.getElementById('popup-overlay').classList.remove('visible');
    document.getElementById('active-filters-popup').classList.remove('visible');
}

function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    const mainContent = document.querySelector('.main-content');
    
    mainContent.addEventListener('scroll', function() {
        if (mainContent.scrollTop > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
    
    backToTopButton.addEventListener('click', function() {
        mainContent.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ========= FUNZIONI PER PAGINAZIONE =========

// Funzione per aggiornare i controlli di paginazione
function updatePaginationControls() {
    totalPages = Math.ceil(filteredMaps.length / itemsPerPage);
    
    // Aggiorna le informazioni sulla pagina
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;
    
    // Abilita/disabilita i pulsanti di navigazione
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
}

// Funzione per cambiare pagina
function changePage(direction) {
    const newPage = currentPage + direction;
    
    if (newPage < 1 || newPage > totalPages) return;
    
    currentPage = newPage;
    displayMaps();
    
    // Scorri verso l'inizio della sezione mappe
    document.querySelector('.maps-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Funzione per cambiare la modalità di visualizzazione
function setViewMode(mode) {
    currentViewMode = mode;
    currentPage = 1; // Resetta alla prima pagina
    
    // Aggiorna lo stato attivo dei pulsanti
    document.getElementById('infinite-scroll-btn').classList.toggle('active', mode === 'infinite');
    document.getElementById('pagination-btn').classList.toggle('active', mode === 'pagination');
    
    displayMaps();
}

// Funzione per cambiare il numero di elementi per pagina
function setItemsPerPage(value) {
    itemsPerPage = parseInt(value);
    currentPage = 1; // Resetta alla prima pagina
    displayMaps();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    initBackToTop();
    loadMapsData();
    setupAutoUpdate();
    pauseSliderOnHover();
    setViewMode('pagination');

    // Filtri tradizionali
    document.querySelectorAll('.filter-select').forEach(select => {
        select.addEventListener('change', applyFilters);
    });

    // Ricerca intelligente
    const searchInput = document.getElementById('smart-search-input');
    const searchContainer = document.getElementById('search-input-container');
    const clearBtn = document.getElementById('search-clear-btn');

    searchInput.addEventListener('input', handleSmartSearchInput);
    searchInput.addEventListener('keydown', handleSmartSearchKeyboard);
    
    searchInput.addEventListener('focus', function() {
        searchContainer.classList.add('focused');
    });
    
    searchInput.addEventListener('blur', function() {
        searchContainer.classList.remove('focused');
        setTimeout(hideSuggestions, 200);
    });

    clearBtn.addEventListener('click', clearSmartSearch);

    // Altri controlli
    document.getElementById('clear-filters').addEventListener('click', clearFilters);
    document.getElementById('view-toggle').addEventListener('click', toggleView);
    document.getElementById('sort-btn').addEventListener('click', toggleSort);
    document.getElementById('show-filters').addEventListener('click', showActiveFiltersPopup);
    
    document.getElementById('popup-close').addEventListener('click', hideActiveFiltersPopup);
    document.getElementById('popup-overlay').addEventListener('click', hideActiveFiltersPopup);
    document.getElementById('popup-reset').addEventListener('click', function() {
        resetAllFilters();
        hideActiveFiltersPopup();
    });
    document.getElementById('popup-apply').addEventListener('click', hideActiveFiltersPopup);

    // Chiudi suggerimenti quando si clicca fuori
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.smart-search-container')) {
            hideSuggestions();
        }
    });

    // Esponi funzioni al window per compatibilità con sistema breadcrumbs globale
    window.applyFilters = applyFilters;
    window.clearSmartSearch = clearSmartSearch;

    // Aggiungi i nuovi event listener per la paginazione
    document.getElementById('infinite-scroll-btn').addEventListener('click', () => setViewMode('infinite'));
    document.getElementById('pagination-btn').addEventListener('click', () => setViewMode('pagination'));
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
    document.getElementById('items-per-page-select').addEventListener('change', (e) => setItemsPerPage(e.target.value));
    
    // Nascondi inizialmente i controlli di paginazione
    // document.getElementById('pagination-controls').style.display = 'none';

    // Pulizia al chiudere la finestra
    window.addEventListener('beforeunload', function() {
        if (autoUpdateInterval) {
            clearInterval(autoUpdateInterval);
        }
        if (sliderInterval) {
            clearInterval(sliderInterval);
        }
    });
});

function setupMobileFilters() {
    // Previene la chiusura accidentale dei menu su mobile
    document.querySelectorAll('.filter-select').forEach(select => {
        select.addEventListener('touchstart', function(e) {
            if (window.innerWidth <= 768) {
                e.stopPropagation();
            }
        });
    });
    
    // Migliora l'esperienza touch per i filtri
    document.querySelectorAll('.filter-group').forEach(group => {
        group.addEventListener('touchstart', function() {
            this.classList.add('touch-active');
        });
        
        group.addEventListener('touchend', function() {
            setTimeout(() => {
                this.classList.remove('touch-active');
            }, 150);
        });
    });
}

// Chiama la funzione nell'evento DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    setupMobileFilters();
});