/*!
 * PalermoHub - Interactive Maps Platform
 * Copyright (c) 2025 Giovan Battista Vitrano (@gbvitrano)
 * Copyright (c) 2025 OpenDataSicilia (@opendatasicilia)
 * 
 * Licensed under CC BY-SA 4.0
 * https://creativecommons.org/licenses/by-sa/4.0/
 * 
 * Attribution required: 
 * - Keep this header intact
 * - Credit original authors in any derivative work
 * - Link back to: https://palermohub.opendatasicilia.it
 * 
 * Created: 2025
 * Repository: https://github.com/SiciliaHub/palermohub
 */

// JAVASCRIPT COMPLETO CON CORREZIONI PAGINAZIONE E LINK

// ========= VARIABILI GLOBALI CORRETTE =========
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

// Variabili per la paginazione - CORRETTE E SICURE
let currentViewMode = 'pagination';
let currentPage = 1;
let itemsPerPage = 36;
let totalPages = 1;
let isUpdatingPagination = false; // Flag per prevenire aggiornamenti simultanei

// ========= FUNZIONI HELPER SICURE PER ENCODING =========

function safeJsonEncode(obj) {
    try {
        return JSON.stringify(obj)
            .replace(/\\/g, '\\\\')      // Escape backslashes
            .replace(/'/g, '&#39;')      // Escape single quotes  
            .replace(/"/g, '&quot;')     // Escape double quotes
            .replace(/\n/g, '\\n')       // Escape newlines
            .replace(/\r/g, '\\r')       // Escape carriage returns
            .replace(/\t/g, '\\t')       // Escape tabs
            .replace(/\u0000-\u001f/g, ''); // Remove control characters
    } catch (error) {
        console.error('Error encoding JSON:', error);
        return '';
    }
}

function safeJsonDecode(str) {
    if (!str || typeof str !== 'string') return null;
    
    try {
        // Reverse the encoding
        const decoded = str
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
            
        return JSON.parse(decoded);
    } catch (error) {
        console.error('Error decoding JSON:', error);
        return null;
    }
}

function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    
    // Remove any potentially dangerous characters
    return url.trim()
        .replace(/[<>"']/g, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '');
}

function sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/[<>"']/g, '').trim();
}

// ========= INTEGRAZIONE FOOTER - NUOVE FUNZIONI =========

// Espone funzioni per il footer
window.handleSmartSearchInput = handleSmartSearchInput;
window.performSmartSearch = performSmartSearch;
window.clearSmartSearch = clearSmartSearch;
window.smartSearchInstance = null;

// Sincronizzazione ricerca footer <-> principale
function syncFooterSearch(query, source = 'main') {
    const mainInput = document.getElementById('smart-search-input');
    const footerInput = document.getElementById('footer-search-input');
    
    if (source === 'main' && footerInput && footerInput.value !== query) {
        footerInput.value = query;
        const clearBtn = document.getElementById('footer-search-clear');
        if (clearBtn) clearBtn.classList.toggle('visible', query.length > 0);
    } else if (source === 'footer' && mainInput && mainInput.value !== query) {
        mainInput.value = query;
        const clearBtn = document.getElementById('search-clear-btn');
        if (clearBtn) clearBtn.classList.toggle('visible', query.length > 0);
    }
}

// Gestione parametri URL per ricerca
function handleSearchUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    
    if (searchParam && searchParam.trim()) {
        setTimeout(() => {
            const mainInput = document.getElementById('smart-search-input');
            const footerInput = document.getElementById('footer-search-input');
            
            if (mainInput) {
                mainInput.value = searchParam;
                mainInput.dispatchEvent(new Event('input'));
            }
            
            if (footerInput) {
                footerInput.value = searchParam;
            }
            
            // Pulisci URL
            const newUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, newUrl);
        }, 1000);
    }
}

// ========= BREADCRUMBS NAVIGATION =========

function updateBreadcrumbs() {
    // Se esiste il sistema globale di breadcrumbs, usalo
    if (typeof window.updatePalermoHubBreadcrumbs === 'function') {
        window.updatePalermoHubBreadcrumbs();
        return;
    }
    
    // Altrimenti usa il sistema locale (fallback)
    const breadcrumbsContainer = document.querySelector('.breadcrumbs-container');
    if (!breadcrumbsContainer) return;
    
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

    const pathItems = [];

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

    const breadcrumbsNav = document.getElementById('breadcrumbs-nav');
    if (breadcrumbsNav) {
        breadcrumbsNav.style.display = pathItems.length > 0 ? 'block' : 'none';
    }
}

function filterByBreadcrumb(filterType, value) {
    document.querySelectorAll('.filter-select').forEach(select => {
        select.value = '';
    });
    document.getElementById('smart-search-input').value = '';
    syncFooterSearch('', 'main');
    hideSuggestions();

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
    if (mainContent && filtersSection) {
        const offsetTop = filtersSection.offsetTop - mainContent.offsetTop;
        mainContent.scrollTo({ 
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// ========= HERO SLIDER =========

function initializeSlider() {
    if (allMaps.length === 0) return;

    featuredMaps = selectFeaturedMaps();
    
    if (featuredMaps.length === 0) return;

    createSliderSlides();
    updateSliderInfo();
    startSliderAutoplay();
}

function selectFeaturedMaps() {
    if (allMaps.length === 0) return [];

    const sortedMaps = [...allMaps].sort((a, b) => {
        const dateA = parseDate(a.data || a.anno || a.created || '');
        const dateB = parseDate(b.data || b.anno || b.created || '');
        return dateB - dateA;  // Dal più recente al più vecchio
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

    dotsContainer.innerHTML = featuredMaps.map((_, index) => 
        `<div class="slider-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`
    ).join('');

    currentSlideIndex = 0;
    updateSliderPosition();
}

function updateSliderInfo() {
    const currentSlideEl = document.getElementById('current-slide');
    const totalSlidesEl = document.getElementById('total-slides');
    if (currentSlideEl) currentSlideEl.textContent = currentSlideIndex + 1;
    if (totalSlidesEl) totalSlidesEl.textContent = featuredMaps.length;
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
    if (slidesWrapper) {
        const translateX = -(currentSlideIndex * 20);
        slidesWrapper.style.transform = `translateX(${translateX}%)`;
    }
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
    }, 5000);
}

function stopSliderAutoplay() {
    if (sliderInterval) {
        clearInterval(sliderInterval);
    }
}

function pauseSliderOnHover() {
    const slider = document.getElementById('hero-slider');
    if (slider) {
        slider.addEventListener('mouseenter', stopSliderAutoplay);
        slider.addEventListener('mouseleave', startSliderAutoplay);
    }
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
    window.smartSearchInstance = smartSearch; // Esporta per il footer
}

function handleSmartSearchInput(event) {
    const query = event.target.value.trim();
    const clearBtn = document.getElementById('search-clear-btn');
    
    if (clearBtn) clearBtn.classList.toggle('visible', query.length > 0);
    
    // Sincronizza con il footer
    syncFooterSearch(query, 'main');
    
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
    const statusElement = document.getElementById('search-status');
    if (statusElement) {
        statusElement.innerHTML = searching 
            ? '<div class="search-spinner"></div> ' + message
            : message;
        statusElement.className = 'search-status' + (searching ? ' searching' : '');
    }
}

function hideSearchStatus() {
    const statusElement = document.getElementById('search-status');
    if (statusElement) {
        statusElement.textContent = '';
        statusElement.className = 'search-status';
    }
}

function displaySmartSuggestions(results, query) {
    const suggestionsContainer = document.getElementById('smart-suggestions');
    const suggestionsList = document.getElementById('suggestions-list');
    const suggestionsCount = document.getElementById('suggestions-count');
    
    if (!suggestionsContainer || !suggestionsList || !suggestionsCount) return;
    
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
                '<div class="suggestion-relevance ' + relevanceClass + '"></div>' +
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
    
    if (!suggestionsContainer || !suggestionsContainer.classList.contains('visible')) {
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
    const suggestionsContainer = document.getElementById('smart-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.classList.remove('visible');
    }
    selectedSuggestion = -1;
    hideSearchStatus();
}

function clearSmartSearch() {
    const searchInput = document.getElementById('smart-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    
    // Sincronizza con il footer
    syncFooterSearch('', 'main');
    
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

async function loadMapsData(showMessage = false) {
    try {
        if (showMessage) {
            const container = document.getElementById('maps-container');
            if (container) {
                container.innerHTML = '<div class="loading">Aggiornamento dati in corso...</div>';
            }
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
                
                filteredMaps = [...allMaps];
                populateFilters();
                applyFilters();
                updateStatistics();
                updateLastUpdateTime();
                initializeSmartSearch();
                initializeSlider();
                updateBreadcrumbs();
                
                // Gestisci parametri URL dopo il caricamento
                setTimeout(handleSearchUrlParams, 500);
            },
            error: function(error) {
                const container = document.getElementById('maps-container');
                if (container) {
                    container.innerHTML = '<div class="no-results">⚠ Errore nel parsing del CSV</div>';
                }
            }
        });
    } catch (error) {
        const container = document.getElementById('maps-container');
        if (container) {
            container.innerHTML = '<div class="no-results">⚠ Errore nel caricamento dei dati: ' + error.message + '</div>';
        }
    }
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('it-IT');
    const updateEl = document.getElementById('last-update');
    if (updateEl) {
        updateEl.textContent = 'Ultimo aggiornamento: ' + dateString + ' alle ' + timeString;
    }
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

    const elements = {
        'total-maps': allMaps.length,
        'total-categories': categories.size,
        'total-territories': territories.size,
        'total-authors': authors.size,
        'filtered-maps': filteredMaps.length
    };

    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
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
    syncFooterSearch('', 'main');
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
    syncFooterSearch('', 'main');
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
    
    // Applica filtri esistenti per limitare le opzioni
    Object.entries(currentFilters).forEach(([key, value]) => {
        if (!value) return;
        
        const fieldMap = {
            categoria: 'categoria',
            territorio: 'territorio', 
            fonte: 'fontedati',
            anno: 'anno',
            tag: 'tag',
            collaborazione: 'collaborazione'
        };
        
        const field = fieldMap[key];
        if (!field) return;
        
        if (key === 'anno') {
            baseMaps = baseMaps.filter(map => map[field] === value);
        } else {
            baseMaps = baseMaps.filter(map => 
                map[field] && map[field].split(',').some(item => item.trim() === value)
            );
        }
    });

    const filters = {
        'categoria-filter': new Set(),
        'territorio-filter': new Set(),
        'fonte-filter': new Set(),
        'anno-filter': new Set(),
        'tag-filter': new Set(),
        'collaborazione-filter': new Set()
    };

    baseMaps.forEach(map => {
        const fieldMap = {
            'categoria-filter': 'categoria',
            'territorio-filter': 'territorio',
            'fonte-filter': 'fontedati', 
            'anno-filter': 'anno',
            'tag-filter': 'tag',
            'collaborazione-filter': 'collaborazione'
        };

        Object.entries(fieldMap).forEach(([filterId, field]) => {
            if (map[field]) {
                if (field === 'anno') {
                    filters[filterId].add(map[field].trim());
                } else {
                    map[field].split(',').forEach(item => {
                        const cleanItem = item.trim();
                        if (cleanItem) filters[filterId].add(cleanItem);
                    });
                }
            }
        });
    });

    Object.keys(filters).forEach(filterId => {
        const select = document.getElementById(filterId);
        if (!select) return;
        
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

// ========= FUNZIONI LINK CON CTRL+CLICK =========

function handleMapClick(event, url, mapData) {
    event.preventDefault();
    
    if (event.ctrlKey || event.metaKey || event.which === 2) {
        // Ctrl+Click o Click centrale del mouse - apri in nuova finestra
        openMapWithBreadcrumbs(url, mapData, true);
    } else {
        // Click normale - apri nella stessa finestra
        openMapWithBreadcrumbs(url, mapData, false);
    }
}

function openMapWithBreadcrumbs(url, mapData, newWindow = false) {
    if (!url || url === '') return;
    
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
    
    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = url + separator + params.toString();
    
    if (newWindow) {
        window.open(finalUrl, '_blank');
    } else {
        window.location.href = finalUrl;
    }
}

function updateMapCount() {
    const mapCountEl = document.getElementById('maps-count');
    if (mapCountEl) {
        mapCountEl.textContent = '🗺️ ' + filteredMaps.length + ' di ' + allMaps.length + ' mappe';
    }
}

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
    syncFooterSearch('', 'main');
    hideSuggestions();
    applyFilters();
}

function clearFilters() {
    resetAllFilters();
}

function toggleView() {
    isGridView = !isGridView;
    const button = document.getElementById('view-toggle');
    if (button) {
        button.innerHTML = isGridView ? '<i class="fas fa-list"></i> Lista' : '<i class="fas fa-th"></i> Griglia';
    }
    displayMaps();
}

function toggleSort() {
    sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    sortMapsByDate();
}

function showActiveFiltersPopup() {
    const overlay = document.getElementById('popup-overlay');
    const popup = document.getElementById('active-filters-popup');
    if (overlay) overlay.classList.add('visible');
    if (popup) popup.classList.add('visible');
}

function hideActiveFiltersPopup() {
    const overlay = document.getElementById('popup-overlay');
    const popup = document.getElementById('active-filters-popup');
    if (overlay) overlay.classList.remove('visible');
    if (popup) popup.classList.remove('visible');
}

function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    const mainContent = document.querySelector('.main-content');
    
    if (!backToTopButton || !mainContent) return;
    
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

function setupMobileFilters() {
    document.querySelectorAll('.filter-select').forEach(select => {
        select.addEventListener('touchstart', function(e) {
            if (window.innerWidth <= 768) {
                e.stopPropagation();
            }
        });
    });
    
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

// ========= FUNZIONE SETVIEWMODE CORRETTA =========
function setViewMode(mode) {
    console.log(`[VIEW] Setting view mode to: ${mode}`);
    
    if (mode !== 'infinite' && mode !== 'pagination') {
        console.error(`[VIEW] Invalid view mode: ${mode}`);
        return;
    }
    
    currentViewMode = mode;
    
    // Update UI buttons
    const infiniteBtn = document.getElementById('infinite-scroll-btn');
    const paginationBtn = document.getElementById('pagination-btn');
    
    if (infiniteBtn) infiniteBtn.classList.toggle('active', mode === 'infinite');
    if (paginationBtn) paginationBtn.classList.toggle('active', mode === 'pagination');
    
    // Reset alla prima pagina quando si cambia modalità - MA SOLO SE NECESSARIO
    if (mode === 'pagination' && currentPage > 1) {
        console.log('[VIEW] Resetting to page 1 due to mode change');
        currentPage = 1;
    }
    
    // Aggiorna la visualizzazione
    displayMaps();
}
const _ph_signature = "PH2025GBV" + "ODS" + Date.now().toString(36);
function updatePaginationVisibility() {
    const paginationControls = document.getElementById('pagination-controls');
    const itemsPerPageContainer = document.querySelector('.items-per-page-container');
    
    if (currentViewMode === 'pagination') {
        if (paginationControls) paginationControls.style.display = 'flex';
        if (itemsPerPageContainer) itemsPerPageContainer.style.display = 'block';
    } else {
        if (paginationControls) paginationControls.style.display = 'none';
        if (itemsPerPageContainer) itemsPerPageContainer.style.display = 'none';
    }
}

// ========= FUNZIONE UPDATEPAGINATIONCONTROLS CORRETTA =========
function updatePaginationControls() {
    // Solo aggiorna se siamo in modalità paginazione
    if (currentViewMode !== 'pagination') return;
    
    console.log(`[PAGINATION] Updating controls - Current: ${currentPage}, Total: ${totalPages}`);
    
    const currentPageEl = document.getElementById('current-page');
    const totalPagesEl = document.getElementById('total-pages');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    // Aggiorna i numeri di pagina
    if (currentPageEl) {
        currentPageEl.textContent = currentPage;
        console.log(`[PAGINATION] Updated current page display: ${currentPage}`);
    }
    if (totalPagesEl) {
        totalPagesEl.textContent = totalPages;
        console.log(`[PAGINATION] Updated total pages display: ${totalPages}`);
    }
    
    // Aggiorna stato dei pulsanti
    if (prevBtn) {
        const shouldDisablePrev = currentPage <= 1;
        prevBtn.disabled = shouldDisablePrev;
        console.log(`[PAGINATION] Previous button disabled: ${shouldDisablePrev}`);
    }
    
    if (nextBtn) {
        const shouldDisableNext = currentPage >= totalPages || totalPages === 0;
        nextBtn.disabled = shouldDisableNext;
        console.log(`[PAGINATION] Next button disabled: ${shouldDisableNext}`);
    }
}

// ========= FUNZIONE CAMBIO PAGINA CORRETTA =========
function changePage(direction) {
    console.log(`[PAGINATION] changePage called with direction: ${direction}, currentPage: ${currentPage}, totalPages: ${totalPages}`);
    
    // Solo funziona in modalità paginazione
    if (currentViewMode !== 'pagination') {
        console.log('[PAGINATION] Not in pagination mode, returning');
        return;
    }
    
    // Previeni aggiornamenti simultanei
    if (isUpdatingPagination) {
        console.log('[PAGINATION] Update already in progress, returning');
        return;
    }
    
    // Calcola la nuova pagina
    const newPage = currentPage + direction;
    console.log(`[PAGINATION] Calculated newPage: ${newPage}`);
    
    // Verifica limiti rigorosi
    if (newPage < 1) {
        console.log('[PAGINATION] Cannot go below page 1');
        return;
    }
    
    if (newPage > totalPages) {
        console.log(`[PAGINATION] Cannot go above page ${totalPages}`);
        return;
    }
    
    // Set flag per prevenire aggiornamenti simultanei
    isUpdatingPagination = true;
    
    // Aggiorna currentPage
    const oldPage = currentPage;
    currentPage = newPage;
    console.log(`[PAGINATION] Page changed from ${oldPage} to ${currentPage}`);
    
    try {
        // Rigenera la visualizzazione
        displayMaps();
        
        // Scroll alla sezione mappe con debounce
        setTimeout(() => {
            const mapsSection = document.querySelector('.maps-section');
            if (mapsSection) {
                mapsSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);
        
    } catch (error) {
        console.error('[PAGINATION] Error in displayMaps:', error);
        // Ripristina la pagina precedente in caso di errore
        currentPage = oldPage;
    } finally {
        // Reset flag dopo un breve delay
        setTimeout(() => {
            isUpdatingPagination = false;
        }, 200);
    }
}

// ========= FUNZIONE SETITEMSPERPAGE CORRETTA =========
function setItemsPerPage(value) {
    const newItemsPerPage = parseInt(value);
    console.log(`[PAGINATION] Changing items per page from ${itemsPerPage} to ${newItemsPerPage}`);
    
    if (isNaN(newItemsPerPage) || newItemsPerPage <= 0) {
        console.error(`[PAGINATION] Invalid items per page value: ${value}`);
        return;
    }
    
    // Calcola quale elemento era il primo nella pagina corrente
    const currentFirstItem = (currentPage - 1) * itemsPerPage;
    
    // Aggiorna il valore
    itemsPerPage = newItemsPerPage;
    
    // Solo se siamo in modalità paginazione, ricalcola la pagina corrente
    if (currentViewMode === 'pagination') {
        // Calcola la nuova pagina che contiene il primo elemento della pagina precedente
        const newPage = Math.floor(currentFirstItem / itemsPerPage) + 1;
        currentPage = Math.max(1, newPage);
        
        console.log(`[PAGINATION] Adjusted to page ${currentPage} to maintain position`);
        
        displayMaps();
    }
}

// ========= FUNZIONE DISPLAYMAPS CORRETTA E SICURA =========
function displayMaps() {
    console.log(`[DISPLAY] displayMaps called - Mode: ${currentViewMode}, Page: ${currentPage}, Items: ${itemsPerPage}`);
    
    const container = document.getElementById('maps-container');
    if (!container) {
        console.error('[DISPLAY] Maps container not found');
        return;
    }
    
    container.className = isGridView ? 'maps-grid' : 'maps-list';

    if (!filteredMaps || filteredMaps.length === 0) {
        console.log('[DISPLAY] No filtered maps available');
        container.innerHTML = '<div class="no-results"><i class="fas fa-search"></i> Nessuna mappa trovata con i filtri selezionati</div>';
        updatePaginationVisibility();
        updatePaginationControls();
        return;
    }

    let mapsToDisplay = [];
    
    // Gestione in base alla modalità 
    if (currentViewMode === 'pagination') {
        console.log('[DISPLAY] Processing pagination mode');
        
        totalPages = Math.ceil(filteredMaps.length / itemsPerPage);
        console.log(`[DISPLAY] Total pages calculated: ${totalPages} (${filteredMaps.length} maps / ${itemsPerPage} per page)`);
        
        if (totalPages > 0) {
            if (currentPage > totalPages) {
                console.log(`[DISPLAY] Current page ${currentPage} > total pages ${totalPages}, adjusting to ${totalPages}`);
                currentPage = totalPages;
            } else if (currentPage < 1) {
                console.log(`[DISPLAY] Current page ${currentPage} < 1, adjusting to 1`);
                currentPage = 1;
            }
        } else {
            console.log('[DISPLAY] No pages available, setting to page 1');
            currentPage = 1;
            totalPages = 1;
        }
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        console.log(`[DISPLAY] Slice calculation: startIndex=${startIndex}, endIndex=${endIndex}`);
        console.log(`[DISPLAY] Available maps: ${filteredMaps.length}`);
        
        if (startIndex >= filteredMaps.length) {
            console.error(`[DISPLAY] ERROR: startIndex ${startIndex} >= filteredMaps.length ${filteredMaps.length}`);
            currentPage = 1;
            startIndex = 0;
            endIndex = itemsPerPage;
        }
        
        mapsToDisplay = filteredMaps.slice(startIndex, endIndex);
        console.log(`[DISPLAY] Maps to display: ${mapsToDisplay.length}`);
        
        updatePaginationControls();
        
    } else {
        console.log('[DISPLAY] Processing infinite scroll mode');
        mapsToDisplay = filteredMaps;
        totalPages = 1;
    }
    
    updatePaginationVisibility();

    if (mapsToDisplay.length === 0) {
        console.log('[DISPLAY] No maps to display for current page');
        container.innerHTML = '<div class="no-results"><i class="fas fa-info-circle"></i> Nessuna mappa disponibile per questa pagina</div>';
        return;
    }
    
    console.log(`[DISPLAY] Rendering ${mapsToDisplay.length} maps`);
    
    // ========= RENDERING SICURO DELLE MAPPE =========
    container.innerHTML = mapsToDisplay.map((map, index) => {
        // Validazione e pulizia dati
        if (!map || typeof map !== 'object') {
            console.warn('[DISPLAY] Invalid map data:', map);
            return '';
        }

        const tags = map.tag ? map.tag.split(',').slice(0, 3).map(tag => {
            const cleanTag = sanitizeText(tag);
            if (!cleanTag) return '';
            return `<span class="meta-tag" onclick="filterByTag('${cleanTag.replace(/'/g, '&#39;')}'); event.stopPropagation();" title="Clicca per filtrare per questo tag">${cleanTag}</span>`;
        }).filter(tag => tag).join('') : '';

        const authors = map.collaborazione ? map.collaborazione.split(',').map(author => {
            const cleanAuthor = sanitizeText(author);
            if (!cleanAuthor) return '';
            return `<span class="author-tag" onclick="filterByAuthor('${cleanAuthor.replace(/'/g, '&#39;')}'); event.stopPropagation();" title="Clicca per filtrare per questo autore">${cleanAuthor}</span>`;
        }).filter(author => author).join('') : '<span class="author-tag">N/A</span>';

        const imageUrl = getImageUrl(map, index);
        const fallbackUrl = createFallbackImage();
        const territories = map.territorio ? map.territorio.split(',').map(t => sanitizeText(t)).filter(t => t).join(', ') : 'N/A';

        // ENCODING SICURO DEI DATI
        const mapDataEncoded = safeJsonEncode(map);
        const mapUrl = sanitizeUrl(map.url || map.URL || '');
        
        // Debug per verificare i dati
        console.log(`[DISPLAY] Map ${index}: URL="${mapUrl}", Data length=${mapDataEncoded.length}`);
        
        // Assicurati che tutti i campi siano stringhe valide
        const safeTitle = sanitizeText(map.titolo) || 'Titolo non disponibile';
        const safeDescription = sanitizeText(map.descrizione) || 'Nessuna descrizione disponibile';
        const safeAnno = sanitizeText(map.anno) || 'N/A';
        const safeCategoria = sanitizeText(map.categoria) || 'N/A';
        const safeFonte = sanitizeText((map.fontedati || 'N/A').split(',')[0]) || 'N/A';

        if (isGridView) {
            return `<div class="map-card" 
                         data-map-url="${mapUrl}" 
                         data-map-data="${mapDataEncoded}"
                         data-map-index="${index}">
                <img src="${imageUrl}" 
                     alt="${safeTitle}" 
                     class="map-image" 
                     onerror="this.src='${fallbackUrl}';">
                <div class="map-content">
                    <h3 class="map-title">${safeTitle}</h3>
                    <p class="map-description">${safeDescription}</p>
                    <div class="map-meta">${tags}</div>
                    <div class="map-authors">
                        <strong><i class="fas fa-users"></i> Autori:</strong>
                        <div class="author-list">${authors}</div>
                    </div>
                    <div class="map-info">
                        <div class="map-info-item"><strong><i class="fas fa-map-marked-alt"></i> Territorio:</strong> ${territories}</div>
                        <div class="map-info-item"><strong><i class="fas fa-calendar-alt"></i> Anno:</strong> ${safeAnno}</div>
                        <div class="map-info-item"><strong><i class="fas fa-database"></i> Fonte:</strong> ${safeFonte}</div>
                        <div class="map-info-item"><strong><i class="fas fa-folder"></i> Categoria:</strong> ${safeCategoria}</div>
                    </div>
                </div>
            </div>`;
        } else {
            return `<div class="map-card" 
                         data-map-url="${mapUrl}" 
                         data-map-data="${mapDataEncoded}"
                         data-map-index="${index}">
                <img src="${imageUrl}" 
                     alt="${safeTitle}" 
                     class="map-image" 
                     onerror="this.src='${fallbackUrl}';">
                <div class="map-content">
                    <h3 class="map-title">${safeTitle}</h3>
                    <p class="map-description">${safeDescription}</p>
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
                        <div class="map-info-value">${safeAnno}</div>
                    </div>
                    <div class="map-info-item">
                        <div class="map-info-label"><i class="fas fa-database"></i> Fonte Dati</div>
                        <div class="map-info-value">${safeFonte}</div>
                    </div>
                    <div class="map-info-item">
                        <div class="map-info-label"><i class="fas fa-folder"></i> Categoria</div>
                        <div class="map-info-value">${safeCategoria}</div>
                    </div>
                </div>
            </div>`;
        }
    }).filter(html => html).join('');

    // ========= EVENT LISTENERS ROBUSTI E SICURI =========
    const cards = container.querySelectorAll('.map-card');
    console.log(`[DISPLAY] Adding event listeners to ${cards.length} cards`);
    
    cards.forEach((card, index) => {
        // Verifica che la card abbia i dati necessari
        const mapUrl = card.dataset.mapUrl;
        const mapDataStr = card.dataset.mapData;
        const mapIndex = card.dataset.mapIndex;
        
        if (!mapUrl) {
            console.warn(`[DISPLAY] Card ${index} missing map URL`);
            return;
        }
        
        if (!mapDataStr) {
            console.warn(`[DISPLAY] Card ${index} missing map data`);
            return;
        }
        
        // Event listener per click normale
        card.addEventListener('click', function(event) {
            // Ignora click su tag e author
            if (event.target.closest('.meta-tag, .author-tag')) {
                return;
            }
            
            console.log(`[EVENT] Card ${index} clicked, URL: ${mapUrl}`);
            
            const mapData = safeJsonDecode(mapDataStr);
            if (!mapData) {
                console.error(`[EVENT] Failed to decode map data for card ${index}`);
                // Fallback: usa solo l'URL
                if (mapUrl) {
                    handleMapClick(event, mapUrl, { titolo: 'Mappa', url: mapUrl });
                }
                return;
            }
            
            handleMapClick(event, mapUrl, mapData);
        });
        
        // Event listener per middle click
        card.addEventListener('mouseup', function(event) {
            if (event.which === 2) { // Middle click
                event.preventDefault();
                
                console.log(`[EVENT] Card ${index} middle clicked, URL: ${mapUrl}`);
                
                const mapData = safeJsonDecode(mapDataStr);
                if (!mapData) {
                    console.error(`[EVENT] Failed to decode map data for middle click on card ${index}`);
                    if (mapUrl) {
                        openMapWithBreadcrumbs(mapUrl, { titolo: 'Mappa', url: mapUrl }, true);
                    }
                    return;
                }
                
                openMapWithBreadcrumbs(mapUrl, mapData, true);
            }
        });
        
        // Verifica periodica dei link (debugging)
        if (index < 3) { // Solo per le prime 3 card per evitare spam
            console.log(`[DEBUG] Card ${index} - URL: "${mapUrl}", DataLength: ${mapDataStr.length}`);
        }
    });
    
    console.log('[DISPLAY] Rendering completed successfully');
}

// ========= FUNZIONE APPLYFILTERS MODIFICATA =========
function applyFilters() {
    const filterValues = {
        categoria: document.getElementById('categoria-filter')?.value || '',
        territorio: document.getElementById('territorio-filter')?.value || '',
        fonte: document.getElementById('fonte-filter')?.value || '',
        anno: document.getElementById('anno-filter')?.value || '',
        tag: document.getElementById('tag-filter')?.value || '',
        collaborazione: document.getElementById('collaborazione-filter')?.value || '',
        searchTerm: (document.getElementById('smart-search-input')?.value || '').toLowerCase()
    };

    console.log('[FILTERS] Applying filters:', filterValues);

    filteredMaps = allMaps.filter(map => {
        const checks = {
            categoria: !filterValues.categoria || (map.categoria && 
                map.categoria.split(',').some(cat => cat.trim() === filterValues.categoria)),
            
            territorio: !filterValues.territorio || (map.territorio && 
                map.territorio.split(',').some(t => t.trim() === filterValues.territorio)),
            
            fonte: !filterValues.fonte || (map.fontedati && 
                map.fontedati.split(',').some(f => f.trim() === filterValues.fonte)),
            
            anno: !filterValues.anno || map.anno === filterValues.anno,
            
            collaborazione: !filterValues.collaborazione || (map.collaborazione && 
                map.collaborazione.split(',').some(c => c.trim() === filterValues.collaborazione)),
            
            tag: !filterValues.tag || (map.tag && 
                map.tag.split(',').some(t => t.trim() === filterValues.tag)),
            
            search: !filterValues.searchTerm || 
                map.titolo.toLowerCase().includes(filterValues.searchTerm) ||
                (map.descrizione && map.descrizione.toLowerCase().includes(filterValues.searchTerm)) ||
                (map.tag && map.tag.toLowerCase().includes(filterValues.searchTerm)) ||
                (map.territorio && map.territorio.toLowerCase().includes(filterValues.searchTerm)) ||
                (map.collaborazione && map.collaborazione.toLowerCase().includes(filterValues.searchTerm))
        };

        return Object.values(checks).every(check => check);
    });

    console.log(`[FILTERS] Filtered ${filteredMaps.length} maps from ${allMaps.length} total`);

    populateFilters();
    
    // Reset alla prima pagina SOLO quando si applicano filtri, NON durante la navigazione
    if (!isUpdatingPagination) {
        console.log('[FILTERS] Resetting to page 1 due to filter change');
        currentPage = 1;
    }
    
    // Ordina i risultati
// Versione semplificata che ordina sempre dal più recente al più vecchio
filteredMaps.sort((a, b) => {
    const dateA = parseDate(a.data || a.anno || a.created || '');
    const dateB = parseDate(b.data || b.anno || b.created || '');
    return dateB - dateA;  // Sempre dal più recente al più vecchio
});
    
    // Aggiorna visualizzazione
    displayMaps();
    updateMapCount();
    updateStatistics();
    updateBreadcrumbs();
    updateSortIndicator();
}

filteredMaps.sort((a, b) => {
    const dateA = parseDate(a.data || a.anno || a.created || '');
    const dateB = parseDate(b.data || b.anno || b.created || '');
    
    if (sortOrder === 'desc') {
        return dateB - dateA;  // ← dateB - dateA = più recente prima
    } else {
        return dateA - dateB;  // ← dateA - dateB = più vecchio prima
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

// ========= FUNZIONE DI DEBUGGING PER VERIFICARE I LINK =========
function debugCardLinks() {
    const cards = document.querySelectorAll('.map-card');
    console.log(`[DEBUG] Found ${cards.length} cards`);
    
    cards.forEach((card, index) => {
        const url = card.dataset.mapUrl;
        const data = card.dataset.mapData;
        const hasClickListener = card.onclick !== null || card.addEventListener !== undefined;
        
        console.log(`[DEBUG] Card ${index}:`, {
            hasUrl: !!url,
            urlLength: url ? url.length : 0,
            hasData: !!data,
            dataLength: data ? data.length : 0,
            hasListener: hasClickListener,
            url: url ? url.substring(0, 50) + '...' : 'MISSING'
        });
        
        if (!url || !data) {
            console.error(`[DEBUG] Card ${index} is missing essential data!`);
        }
    });
}

// ========= INIZIALIZZAZIONE EVENT LISTENERS CORRETTA =========
document.addEventListener('DOMContentLoaded', function() {
    console.log('[INIT] Initializing PalermoHub');
    
    // Inizializza componenti base
    initBackToTop();
    loadMapsData();
    setupAutoUpdate();
    pauseSliderOnHover();
    setViewMode('pagination'); // IMPORTANTE: Inizia con paginazione attiva
    setupMobileFilters();

    // Filtri tradizionali
    document.querySelectorAll('.filter-select').forEach(select => {
        select.addEventListener('change', applyFilters);
    });

    // Ricerca intelligente
    const searchInput = document.getElementById('smart-search-input');
    const searchContainer = document.getElementById('search-input-container');
    const clearBtn = document.getElementById('search-clear-btn');

    if (searchInput) {
        searchInput.addEventListener('input', handleSmartSearchInput);
        searchInput.addEventListener('keydown', handleSmartSearchKeyboard);
        
        searchInput.addEventListener('focus', function() {
            if (searchContainer) searchContainer.classList.add('focused');
        });
        
        searchInput.addEventListener('blur', function() {
            if (searchContainer) searchContainer.classList.remove('focused');
            setTimeout(hideSuggestions, 200);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearSmartSearch);
    }

    // ========= EVENT LISTENERS CORRETTI E SICURI =========
    const elements = {
        'clear-filters': clearFilters,
        'view-toggle': toggleView,
        'sort-btn': toggleSort,
        'show-filters': showActiveFiltersPopup,
        'popup-close': hideActiveFiltersPopup,
        'popup-overlay': hideActiveFiltersPopup,
        'popup-reset': function() {
            resetAllFilters();
            hideActiveFiltersPopup();
        },
        'popup-apply': hideActiveFiltersPopup,
        'infinite-scroll-btn': () => setViewMode('infinite'),
        'pagination-btn': () => setViewMode('pagination'),
        'prev-page': () => {
            console.log('[EVENT] Previous page clicked');
            changePage(-1);
        },
        'next-page': () => {
            console.log('[EVENT] Next page clicked');
            changePage(1);
        }
    };

    Object.entries(elements).forEach(([id, handler]) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', handler);
            console.log(`[INIT] Event listener attached to ${id}`);
        } else {
            console.warn(`[INIT] Element not found: ${id}`);
        }
    });

    const itemsPerPageSelect = document.getElementById('items-per-page-select');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            console.log(`[EVENT] Items per page changed to: ${e.target.value}`);
            setItemsPerPage(e.target.value);
        });
    }

    // Chiudi suggerimenti quando si clicca fuori
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.smart-search-container')) {
            hideSuggestions();
        }
    });

    // Esponi funzioni al window per compatibilità con sistema breadcrumbs globale
    window.applyFilters = applyFilters;
    window.clearSmartSearch = clearSmartSearch;
    window.displayMaps = displayMaps;
    window.openMapWithBreadcrumbs = openMapWithBreadcrumbs;
    window.handleMapClick = handleMapClick;
    window.changePage = changePage;
    window.setViewMode = setViewMode;
    window.debugCardLinks = debugCardLinks; // Esponi la funzione di debug

    // Pulizia al chiudere la finestra
    window.addEventListener('beforeunload', function() {
        if (autoUpdateInterval) {
            clearInterval(autoUpdateInterval);
        }
        if (sliderInterval) {
            clearInterval(sliderInterval);
        }
    });
    
    console.log('[INIT] PalermoHub initialization completed');
});