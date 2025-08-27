// header.js - Header e breadcrumbs ottimizzati per mobile + Dark Mode + Dynamic Maps Integration
document.addEventListener('DOMContentLoaded', function() {
    initializeHeader();
    initializeBreadcrumbs();
    setupMobileInteractions();
    
    // Inizializza dark mode
    initializeDarkMode();
    
    // Aggiungi listener per il toggle tema
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
    }
    
    // Listener per preferenze di sistema
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener(function(e) {
            // Solo se l'utente non ha mai impostato una preferenza manualmente
            if (!localStorage.getItem('palermohub-theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                
                const toggle = document.getElementById('theme-toggle-checkbox');
                if (toggle) {
                    toggle.checked = newTheme === 'dark';
                    updateThemeIcon();
                }
            }
        });
    }
});

// ========= HEADER INITIALIZATION =========
function initializeHeader() {
    // Crea l'elemento header
    const header = document.createElement('header');
    header.className = 'ph-header';
    header.setAttribute('role', 'banner');
    
    header.innerHTML = `
        <div class="ph-header-container">
            <div class="ph-logo">
                <img src="legend/pa_hub_new.png" alt="PalermoHub" title="PalermoHub by opendadatasicilia.it">
            </div>
            
            <button class="ph-mobile-toggle" type="button" aria-label="Apri menu" aria-expanded="false" aria-controls="ph-nav">
                <span class="ph-hamburger-line"></span>
                <span class="ph-hamburger-line"></span>
                <span class="ph-hamburger-line"></span>
            </button>
            
            <nav class="ph-nav" id="ph-nav" role="navigation" aria-label="Menu principale">
                <ul class="ph-nav-list">
                    <li><a href="index.html" class="ph-nav-link">Home</a></li>
                    <li><a href="funzion.html" class="ph-nav-link" title="Funzionalità avanzate">Funzionalità avanzate</a></li>
                    <li><a href="geolocalizza.html" class="ph-nav-link" title="Geocodifica il tuo indirizzo">Geocodifica il tuo indirizzo</a></li>
                    <li><a href="strumenti.html" class="ph-nav-link" title="Strumenti utilizzati">Strumenti</a></li>
                    <li><a href="info.html" class="ph-nav-link" title="Privacy">Privacy</a></li>
                    <li><a href="about.html" class="ph-nav-link" title="Informazioni">About</a></li>
                    <li>
                        <label class="theme-toggle" for="theme-toggle-checkbox" title="Cambia tema">
                            <span class="theme-label">Dark Mode</span>
                            <div class="theme-switch">
                                <div class="theme-slider">
                                    <span class="theme-icon">🌙</span>
                                </div>
                            </div>
                            <input type="checkbox" id="theme-toggle-checkbox" style="display: none;">
                        </label>
                    </li>
                </ul>
            </nav>
        </div>
        
        <!-- Breadcrumbs -->
        <div class="ph-breadcrumbs" id="ph-breadcrumbs" style="display: none;" role="navigation" aria-label="Breadcrumb">
            <div class="ph-breadcrumbs-container">
                <ol class="ph-breadcrumbs-list" id="ph-breadcrumbs-list">
                    <li><a href="index.html" class="ph-breadcrumb-link">Home</a></li>
                </ol>
                <div class="ph-active-filters" id="ph-active-filters"></div>
            </div>
        </div>
    `;
    
    // Inserisci l'header
    document.body.insertBefore(header, document.body.firstChild);
    
    // Aggiungi gli stili
    addHeaderStyles();
}

// ========= MAPS METADATA SYSTEM =========
let mapsMetadata = null;

async function loadMapsMetadata() {
    if (mapsMetadata) return mapsMetadata;
    
    try {
        const response = await fetch('https://raw.githubusercontent.com/SiciliaHub/palermohub/refs/heads/PH-release-v2.0/dati-palermo-hub/maps-metadata.json');
        if (!response.ok) throw new Error('Failed to load maps metadata');
        
        mapsMetadata = await response.json();
        console.log('Maps metadata loaded:', Object.keys(mapsMetadata).length, 'maps found');
        return mapsMetadata;
    } catch (error) {
        console.warn('Could not load maps metadata:', error);
        return null;
    }
}

function findMapMetadata(filename) {
    if (!mapsMetadata) return null;
    
    // Il JSON ha la struttura: "filename": { metadata }
    // Proviamo diverse varianti del filename
    const possibleKeys = [
        filename,                              // cie.html
        `./${filename}`,                       // ./cie.html  
        filename.replace('.html', ''),         // cie
        `${filename}`,                        // per sicurezza
    ];
    
    // Prova prima con chiavi esatte
    for (const key of possibleKeys) {
        if (mapsMetadata[key]) {
            return mapsMetadata[key];
        }
    }
    
    // Se non trova, cerca in tutte le chiavi per match parziali
    for (const [key, metadata] of Object.entries(mapsMetadata)) {
        if (key.includes(filename) || key.endsWith(filename)) {
            return metadata;
        }
    }
    
    return null;
}

function getCurrentPageInfo() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    console.log('Getting page info for:', filename);
    
    // Pagine statiche predefinite
    const staticPages = {
        'index.html': { title: '', showBreadcrumbs: false, isHome: true, type: 'home' },
        '': { title: '', showBreadcrumbs: false, isHome: true, type: 'home' },
        'funzion.html': { title: 'Funzionalità Avanzate', showBreadcrumbs: true, isHome: false, type: 'static' },
        'geolocalizza.html': { title: 'Geocodifica Indirizzo', showBreadcrumbs: true, isHome: false, type: 'static' },
        'strumenti.html': { title: 'Strumenti', showBreadcrumbs: true, isHome: false, type: 'static' },
        'info.html': { title: 'Privacy', showBreadcrumbs: true, isHome: false, type: 'static' },
        'about.html': { title: 'About', showBreadcrumbs: true, isHome: false, type: 'static' }
    };
    
    // Controlla se è una pagina statica
    if (staticPages[filename]) {
        console.log('Found static page:', filename);
        return staticPages[filename];
    }
    
    // Cerca nei metadati delle mappe
    const mapData = findMapMetadata(filename);
    if (mapData) {
        console.log('Found map data for:', filename, mapData);
        return {
            title: mapData.titolo || 'Mappa',
            showBreadcrumbs: true,
            isHome: false,
            type: 'map',
            mapData: mapData
        };
    }
    
    console.log('No metadata found for:', filename, 'falling back to default');
    
    // Default per pagine non riconosciute
    return { 
        title: 'Pagina', 
        showBreadcrumbs: true, 
        isHome: false, 
        type: 'unknown' 
    };
}

// ========= BREADCRUMBS SYSTEM =========
function initializeBreadcrumbs() {
    // Carica prima i metadati
    loadMapsMetadata().then(() => {
        updateBreadcrumbs();
        initializeFiltersObserver(); // Usa la nuova funzione migliorata
        
        // Gestisci i parametri URL per i filtri
        setTimeout(handleUrlFilters, 200);
        
        // Forza un aggiornamento iniziale
        setTimeout(() => {
            updateBreadcrumbs();
        }, 500);
    });
}

function updateBreadcrumbs() {
    const pageInfo = getCurrentPageInfo();
    const breadcrumbsEl = document.getElementById('ph-breadcrumbs');
    const breadcrumbsList = document.getElementById('ph-breadcrumbs-list');
    const activeFilters = document.getElementById('ph-active-filters');
    
    if (!pageInfo.showBreadcrumbs && !pageInfo.isHome) {
        breadcrumbsEl.style.display = 'none';
        return;
    }
    
    // Costruisci breadcrumbs base
    let breadcrumbsHTML = '<li><a href="index.html" class="ph-breadcrumb-link">Home</a></li>';
    
    if (pageInfo.type === 'map' && pageInfo.mapData) {
        // Per le mappe, aggiungi categoria e territorio se disponibili
        const mapData = pageInfo.mapData;
        
        if (mapData.categoria) {
            breadcrumbsHTML += `<li><span class="ph-breadcrumb-category">${mapData.categoria}</span></li>`;
        }
        
        if (mapData.territorio && mapData.territorio !== mapData.categoria) {
            breadcrumbsHTML += `<li><span class="ph-breadcrumb-territory">${mapData.territorio}</span></li>`;
        }
        
        breadcrumbsHTML += `<li><span class="ph-breadcrumb-current">${pageInfo.title}</span></li>`;
    } else if (pageInfo.title) {
        breadcrumbsHTML += `<li><span class="ph-breadcrumb-current">${pageInfo.title}</span></li>`;
    }
    
    breadcrumbsList.innerHTML = breadcrumbsHTML;
    
    // Aggiungi metadati come "filtri" per le mappe
    if (pageInfo.type === 'map' && pageInfo.mapData) {
        displayMapMetadata(pageInfo.mapData);
    } else if (pageInfo.isHome) {
        // Aggiungi filtri attivi se siamo nella home
        updateActiveFilters();
    } else {
        activeFilters.innerHTML = '';
    }
    
    // Mostra/nascondi breadcrumbs
    const filters = getActiveFilters();
    if (pageInfo.showBreadcrumbs || pageInfo.isHome && filters.length > 0) {
        breadcrumbsEl.style.display = 'block';
    } else {
        breadcrumbsEl.style.display = 'none';
    }
    
    console.log('Breadcrumbs updated for:', pageInfo.type, pageInfo.title);
}

// VERSIONE CORRETTA - Senza icone esterne
function displayMapMetadata(mapData) {
    const activeFilters = document.getElementById('ph-active-filters');
    if (!activeFilters) return;
    
    let metadataHTML = '';
    
    // Crea "filtri" cliccabili dai metadati della mappa (SENZA icone)
    const metadataFields = [
        { key: 'categoria', label: 'Categoria', value: mapData.categoria, filterParam: 'categoria' },
        { key: 'territorio', label: 'Territorio', value: mapData.territorio, filterParam: 'territorio' },
        { key: 'fonte', label: 'Fonte', value: mapData.fonte, filterParam: 'fonte' },
        { key: 'anno', label: 'Anno', value: mapData.anno, filterParam: 'anno' },
        { key: 'autore', label: 'Autore', value: mapData.autore, filterParam: 'autore' }
    ];
    
    metadataFields.forEach(field => {
        if (field.value && field.value.toString().trim()) {
            const displayValue = field.value.length > 20 ? field.value.substring(0, 20) + '...' : field.value;
            const filterUrl = buildFilterUrl(field.filterParam, field.value);
            
            metadataHTML += `
                <a href="${filterUrl}" class="ph-metadata-tag clickable" data-type="${field.key}" title="Clicca per filtrare per ${field.label}: ${field.value}">
                    ${field.label}: ${displayValue}
                </a>
            `;
        }
    });
    
    // Aggiungi tags cliccabili se presenti (SENZA icone)
    if (mapData.tags && Array.isArray(mapData.tags) && mapData.tags.length > 0) {
        // Mostra solo i primi 3 tag
        mapData.tags.slice(0, 3).forEach(tag => {
            if (tag && tag.trim()) {
                const filterUrl = buildFilterUrl('tag', tag);
                metadataHTML += `
                    <a href="${filterUrl}" class="ph-tag-chip clickable" title="Clicca per filtrare per tag: ${tag}">
                        ${tag}
                    </a>
                `;
            }
        });
        
        if (mapData.tags.length > 3) {
            const allTagsUrl = buildMultiTagUrl(mapData.tags.slice(3));
            metadataHTML += `
                <a href="${allTagsUrl}" class="ph-more-tags clickable" title="Clicca per vedere tutti i tag: ${mapData.tags.slice(3).join(', ')}">
                    +${mapData.tags.length - 3} altri
                </a>
            `;
        }
    }
    
    activeFilters.innerHTML = metadataHTML;
}

// Funzione per costruire URL con filtri
function buildFilterUrl(filterType, filterValue) {
    const baseUrl = 'index.html';
    const params = new URLSearchParams();
    
    // Mappa i tipi di filtro ai parametri URL
    const filterMapping = {
        'categoria': 'categoria',
        'territorio': 'territorio', 
        'fonte': 'fonte',
        'anno': 'anno',
        'autore': 'collaborazione', // Nell'index usa 'collaborazione-filter'
        'tag': 'tag'
    };
    
    const paramName = filterMapping[filterType] || filterType;
    params.set(paramName, filterValue);
    
    return `${baseUrl}?${params.toString()}`;
}

// Funzione per costruire URL con multiple tags
function buildMultiTagUrl(tags) {
    const baseUrl = 'index.html';
    const params = new URLSearchParams();
    
    // Prende il primo tag aggiuntivo per il filtro
    if (tags.length > 0) {
        params.set('tag', tags[0]);
    }
    
    return `${baseUrl}?${params.toString()}`;
}

// Aggiungi funzione per gestire i parametri URL nell'index
function handleUrlFilters() {
    // Questa funzione dovrebbe essere chiamata solo nell'index.html
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Mappa dei parametri URL ai selettori
        const filterSelectors = {
            'categoria': 'categoria-filter',
            'territorio': 'territorio-filter',
            'fonte': 'fonte-filter',
            'anno': 'anno-filter',
            'collaborazione': 'collaborazione-filter',
            'tag': 'tag-filter'
        };
        
        // Applica i filtri dai parametri URL
        let hasFilters = false;
        for (const [param, selector] of Object.entries(filterSelectors)) {
            const value = urlParams.get(param);
            if (value) {
                const filterElement = document.getElementById(selector);
                if (filterElement) {
                    // Aspetta che le opzioni siano caricate
                    setTimeout(() => {
                        filterElement.value = value;
                        filterElement.dispatchEvent(new Event('change', { bubbles: true }));
                        hasFilters = true;
                    }, 500);
                }
            }
        }
        
        // Pulisci l'URL dopo aver applicato i filtri
        if (hasFilters) {
            setTimeout(() => {
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 1000);
        }
    }
}

// VERSIONE MIGLIORATA - Con indicatore contatore
function updateActiveFilters() {
    const activeFilters = document.getElementById('ph-active-filters');
    if (!activeFilters) return;
    
    const filters = getActiveFilters();
    let filtersHTML = '';
    
    // Aggiungi indicatore del numero di filtri se > 0
    if (filters.length > 0) {
        filters.forEach(filter => {
            filtersHTML += `
                <button class="ph-filter-tag" onclick="clearFilter('${filter.id}')" title="Rimuovi filtro: ${filter.fullValue || filter.value}">
                    ${filter.label}: ${filter.value}
                    <span class="ph-filter-remove">×</span>
                </button>
            `;
        });
        
        // Aggiungi indicatore se ci sono molti filtri
        if (filters.length > 1) {
            filtersHTML += `<span class="ph-filters-indicator">${filters.length} filtri attivi</span>`;
        }
    }
    
    activeFilters.innerHTML = filtersHTML;
    
    // Mostra/nascondi la sezione filtri
    const breadcrumbs = document.getElementById('ph-breadcrumbs');
    if (breadcrumbs) {
        if (filters.length > 0) {
            breadcrumbs.style.display = 'block';
        } else if (!getCurrentPageInfo().showBreadcrumbs) {
            breadcrumbs.style.display = 'none';
        }
    }
}

// VERSIONE MIGLIORATA - Con valori completi
function getActiveFilters() {
    const filters = [];
    
    const filterMappings = {
        'categoria-filter': 'Categoria',
        'territorio-filter': 'Territorio',
        'fonte-filter': 'Fonte',
        'anno-filter': 'Anno',
        'tag-filter': 'Tag',
        'collaborazione-filter': 'Autore'
    };
    
    // Controlla filtri select
    Object.entries(filterMappings).forEach(([id, label]) => {
        const element = document.getElementById(id);
        if (element && element.value && element.value.trim() && element.value !== 'tutti' && element.value !== '') {
            const fullValue = element.value;
            const displayValue = fullValue.length > 15 ? fullValue.substring(0, 15) + '...' : fullValue;
            filters.push({
                id: id,
                label: label,
                value: displayValue,
                fullValue: fullValue
            });
        }
    });
    
    // Controlla ricerca
    const searchInput = document.getElementById('smart-search-input');
    if (searchInput && searchInput.value && searchInput.value.trim()) {
        const fullValue = searchInput.value.trim();
        const displayValue = fullValue.length > 12 ? fullValue.substring(0, 12) + '...' : fullValue;
        filters.push({
            id: 'search',
            label: 'Ricerca',
            value: displayValue,
            fullValue: fullValue
        });
    }
    
    return filters;
}

// VERSIONE MIGLIORATA - Con debouncing e inizializzazione robusta
function initializeFiltersObserver() {
    // Aspetta che il DOM sia completamente caricato
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(observeFilters, 100);
        });
    } else {
        setTimeout(observeFilters, 100);
    }
    
    // Re-inizializza quando vengono aggiunti nuovi filtri dinamicamente
    const observer = new MutationObserver((mutations) => {
        let shouldReobserve = false;
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    if (node.classList && (
                        node.classList.contains('filter-select') ||
                        node.id === 'smart-search-input' ||
                        node.id === 'clear-filters'
                    )) {
                        shouldReobserve = true;
                    }
                }
            });
        });
        
        if (shouldReobserve) {
            setTimeout(observeFilters, 100);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// VERSIONE MIGLIORATA - Con debouncing ottimizzato
function observeFilters() {
    let updateTimeout;
    
    const debouncedUpdate = () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            updateBreadcrumbs();
        }, 150);
    };
    
    // Osserva filtri select
    const filters = document.querySelectorAll('.filter-select');
    filters.forEach(filter => {
        filter.addEventListener('change', debouncedUpdate);
    });
    
    // Osserva ricerca con debouncing più lungo
    const searchInput = document.getElementById('smart-search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                updateBreadcrumbs();
            }, 400); // Debouncing più lungo per la ricerca
        });
    }
    
    // Osserva reset filtri
    const clearButton = document.getElementById('clear-filters');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            setTimeout(updateBreadcrumbs, 50);
        });
    }
    
    // Osserva anche i pulsanti di reset individuali se esistono
    const resetButtons = document.querySelectorAll('[id$="-reset"], [class*="reset-filter"]');
    resetButtons.forEach(button => {
        button.addEventListener('click', debouncedUpdate);
    });
    
    // Inizializza la visualizzazione dei filtri
    setTimeout(updateBreadcrumbs, 200);
}

// ========= STYLES =========
function addHeaderStyles() {
    if (document.getElementById('ph-header-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'ph-header-styles';
    styles.textContent = `
        /* Reset e base */
        .ph-header * {
            box-sizing: border-box;
        }
        
        /* Header principale */
        .ph-header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #e2e8f0;
            position: sticky;
            top: 0;
            z-index: 1000;
            width: 100%;
        }
        
        .ph-header-container {
            width: 100%;
            padding: 0.75rem 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
        }
        
        /* Logo */
        .ph-logo img {
            height: 40px;
            width: auto;
            display: block;
        }
        
        /* Navigazione desktop */
        .ph-nav {
            display: block;
        }
        
        .ph-nav-list {
            display: flex;
            list-style: none;
            margin: 0;
            padding: 0;
            gap: 1.5rem;
            align-items: center;
        }
        
        .ph-nav-link {
            color: #4a5568;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        
        .ph-nav-link:hover,
        .ph-nav-link:focus {
            color: #ff9900;
            background: rgba(255, 153, 0, 0.1);
            outline: none;
        }
        
        /* Menu mobile toggle */
        .ph-mobile-toggle {
            display: none;
            background: none;
            border: none;
            padding: 0.5rem;
            cursor: pointer;
            position: relative;
            width: 40px;
            height: 40px;
            border-radius: 6px;
            transition: background-color 0.2s ease;
        }
        
        .ph-mobile-toggle:hover,
        .ph-mobile-toggle:focus {
            background: rgba(0, 0, 0, 0.05);
            outline: none;
        }
        
        .ph-hamburger-line {
            display: block;
            width: 20px;
            height: 2px;
            background: #4a5568;
            margin: 4px auto;
            transition: all 0.3s ease;
            border-radius: 1px;
        }
        
        /* Animazione hamburger */
        .ph-mobile-toggle[aria-expanded="true"] .ph-hamburger-line:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .ph-mobile-toggle[aria-expanded="true"] .ph-hamburger-line:nth-child(2) {
            opacity: 0;
        }
        
        .ph-mobile-toggle[aria-expanded="true"] .ph-hamburger-line:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -6px);
        }
        
        /* Breadcrumbs */
        .ph-breadcrumbs {
            background: rgba(248, 250, 252, 0.95);
            border-bottom: 1px solid #e2e8f0;
            padding: 0.25rem 0;
        }
        
        .ph-breadcrumbs-container {
            width: 100%;
            padding: 0 2rem;
        }
        
        .ph-breadcrumbs-list {
            display: flex;
            align-items: center;
            list-style: none;
            margin: 0;
            padding: 0;
            font-size: 0.8rem;
            flex-wrap: wrap;
            gap: 0.15rem;
        }
        
        .ph-breadcrumbs-list li {
            display: flex;
            align-items: center;
        }
        
        .ph-breadcrumbs-list li:not(:first-child):before {
            content: "›";
            color: #a0aec0;
            margin: 0 0.5rem;
            font-weight: bold;
        }
        
        .ph-breadcrumb-link {
            color: #ff9900;
            text-decoration: none;
            font-weight: 500;
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .ph-breadcrumb-link:hover,
        .ph-breadcrumb-link:focus {
            background: rgba(255, 153, 0, 0.1);
            outline: none;
        }
        
        .ph-breadcrumb-current {
            color: #4a5568;
            font-weight: 600;
            padding: 0.15rem 0.4rem;
        }
        
        .ph-breadcrumb-category,
        .ph-breadcrumb-territory {
            color: #718096;
            font-weight: 500;
            padding: 0.15rem 0.4rem;
            background: rgba(113, 128, 150, 0.1);
            border-radius: 4px;
        }
        
        /* Filtri attivi con contatore */
        .ph-active-filters {
            margin-top: 0.5rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            align-items: center;
            animation: slideInUp 0.4s ease-out;
            min-height: 1rem;
        }
        
        .ph-active-filters:empty {
            display: none;
        }
        
        .ph-filter-tag {
            background: #e6fffa;
            color: #234e52;
            padding: 0.15rem 0.6rem;
            border-radius: 14px;
            font-size: 0.7rem;
            border: 1px solid #81e6d9;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            font-weight: 500;
        }
        
        .ph-filter-tag:hover {
            background: #fed7d7;
            color: #c53030;
            border-color: #fc8181;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(252, 129, 129, 0.3);
        }
        
        .ph-filter-remove {
            font-weight: bold;
            opacity: 0.7;
            margin-left: 0.2rem;
        }
        
        .ph-filter-tag:hover .ph-filter-remove {
            opacity: 1;
        }
        
        /* Indicatore contatore filtri */
        .ph-filters-indicator {
            background: var(--primary-color, #ff9900);
            color: white;
            padding: 0.1rem 0.4rem;
            border-radius: 10px;
            font-size: 0.6rem;
            font-weight: 600;
            margin-left: 0.5rem;
        }
        
        /* Metadati mappe - SENZA pseudo-elementi problematici */
        .ph-metadata-tag {
            background: #f0f9ff;
            color: #0c4a6e;
            padding: 0.15rem 0.6rem;
            border-radius: 14px;
            font-size: 0.7rem;
            border: 1px solid #7dd3fc;
            display: inline-flex;
            align-items: center;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .ph-metadata-tag.clickable {
            cursor: pointer;
        }
        
        .ph-metadata-tag.clickable:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(255, 153, 0, 0.3);
        }
        
        .ph-tag-chip {
            background: #fef3c7;
            color: #92400e;
            padding: 0.15rem 0.6rem;
            border-radius: 14px;
            font-size: 0.7rem;
            border: 1px solid #fbbf24;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .ph-tag-chip.clickable {
            cursor: pointer;
        }
        
        .ph-tag-chip.clickable:hover {
            background: #fef08a;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(253, 224, 71, 0.4);
            border-color: #eab308;
        }
        
        .ph-more-tags {
            background: #f3f4f6;
            color: #6b7280;
            padding: 0.15rem 0.6rem;
            border-radius: 14px;
            font-size: 0.7rem;
            font-style: italic;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .ph-more-tags.clickable {
            cursor: pointer;
        }
        
        .ph-more-tags.clickable:hover {
            background: #f1f5f9;
            color: #475569;
            transform: translateY(-1px);
            border-color: #cbd5e1;
        }
        
        /* Theme toggle styles */
        .theme-toggle {
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            transition: all 0.3s ease;
            user-select: none;
            text-decoration: none !important;
        }
        
        .theme-toggle:hover {
            background: rgba(255, 153, 0, 0.1);
        }
        
        .theme-switch {
            position: relative;
            width: 48px;
            height: 24px;
            background: #ccc;
            border-radius: 12px;
            transition: background 0.3s ease;
            cursor: pointer;
            flex-shrink: 0;
        }
        
        [data-theme="dark"] .theme-switch {
            background: var(--primary-color, #ff9900);
        }
        
        .theme-slider {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        [data-theme="dark"] .theme-slider {
            transform: translateX(24px);
        }
        
        .theme-icon {
            font-size: 10px;
            line-height: 1;
        }
        
        .theme-label {
            font-size: 0.85rem;
            font-weight: 500;
            color: var(--text-primary, #4a5568);
            white-space: nowrap;
            order: -1;
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
            .ph-nav-list {
                gap: 1rem;
            }
            
            .ph-nav-link {
                font-size: 0.85rem;
                padding: 0.4rem 0.6rem;
            }
        }
        
        @media (max-width: 768px) {
            .ph-header-container {
                padding: 0.5rem 1rem;
            }
            
            .ph-logo img {
                height: 35px;
            }
            
            .ph-mobile-toggle {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .theme-label {
                display: none;
            }
            
            .theme-toggle {
                padding: 0.5rem;
                justify-content: center;
            }
            
            .theme-switch {
                width: 44px;
                height: 22px;
            }
            
            .theme-slider {
                width: 18px;
                height: 18px;
                font-size: 9px;
            }
            
            [data-theme="dark"] .theme-slider {
                transform: translateX(22px);
            }
            
            .ph-nav {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(26, 32, 44, 0.95);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid #4a5568;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                transform: translateY(-100%);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 999;
            }
            
            .ph-nav.active {
                transform: translateY(0);
                opacity: 1;
                visibility: visible;
            }
            
            .ph-nav-list {
                flex-direction: column;
                gap: 0;
                padding: 1rem 0;
            }
            
            .ph-nav-list li {
                width: 100%;
            }
            
            .ph-nav-link {
                display: block;
                width: 100%;
                padding: 0.75rem 1rem;
                text-align: left;
                border-radius: 0;
                font-size: 0.9rem;
                color: #e2e8f0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .ph-nav-link:hover,
            .ph-nav-link:focus {
                color: #ff9900;
                background: rgba(255, 153, 0, 0.1);
            }
            
            .ph-nav-link:last-child {
                border-bottom: none;
            }
            
            .ph-nav .theme-toggle {
                width: 100%;
                padding: 0.75rem 1rem;
                justify-content: space-between;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .ph-nav .theme-label {
                display: block;
                color: #e2e8f0;
                order: 0;
            }
            
            .ph-nav .theme-toggle:hover {
                color: #ff9900;
                background: rgba(255, 153, 0, 0.1);
            }
            
            .ph-nav .theme-toggle:hover .theme-label {
                color: #ff9900;
            }
            
            .ph-breadcrumbs-container {
                padding: 0 1rem;
            }
            
            .ph-breadcrumbs-list {
                font-size: 0.75rem;
            }
            
            .ph-breadcrumbs-list li:not(:first-child):before {
                margin: 0 0.25rem;
            }
            
            .ph-breadcrumb-link,
            .ph-breadcrumb-current {
                padding: 0.1rem 0.3rem;
                font-size: 0.75rem;
            }
            
            .ph-filter-tag,
            .ph-metadata-tag,
            .ph-tag-chip {
                font-size: 0.65rem;
                padding: 0.1rem 0.5rem;
            }
            
            .ph-active-filters {
                max-height: 80px;
                overflow-y: auto;
                padding: 0.25rem 0;
            }
        }
        
        @media (max-width: 480px) {
            .ph-header-container {
                padding: 0.4rem 0.75rem;
            }
            
            .ph-logo img {
                height: 30px;
            }
            
            .ph-breadcrumbs-container {
                padding: 0 0.75rem;
            }
            
            .ph-breadcrumbs-list {
                font-size: 0.7rem;
            }
            
            .ph-breadcrumb-link,
            .ph-breadcrumb-current {
                padding: 0.08rem 0.25rem;
                font-size: 0.7rem;
            }
            
            .ph-active-filters {
                max-height: 60px;
                gap: 0.25rem;
            }
            
            .ph-filter-tag,
            .ph-metadata-tag,
            .ph-tag-chip {
                font-size: 0.6rem;
                padding: 0.08rem 0.4rem;
            }
            
            /* Mostra solo i primi 3 filtri su mobile molto piccolo */
            .ph-filter-tag:nth-child(n+4) {
                display: none;
            }
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Supporto notch */
        @supports(padding: max(0px)) {
            .ph-header-container,
            .ph-breadcrumbs-container {
                padding-left: max(2rem, env(safe-area-inset-left));
                padding-right: max(2rem, env(safe-area-inset-right));
            }
        }
        
        /* Miglioramenti accessibilità */
        @media (prefers-reduced-motion: reduce) {
            .ph-nav,
            .ph-hamburger-line,
            .ph-nav-link,
            .ph-filter-tag,
            .theme-toggle,
            .theme-slider,
            .ph-active-filters {
                transition: none;
                animation: none;
            }
        }
        
        /* Smooth transitions per tutti gli elementi */
        *, *::before, *::after {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
        }
        
        /* Prevent flash of unstyled content */
        [data-theme="dark"] {
            color-scheme: dark;
        }
        
        [data-theme="light"] {
            color-scheme: light;
        }
    `;
    
    document.head.appendChild(styles);
}

// ========= MOBILE INTERACTIONS =========
function setupMobileInteractions() {
    const toggle = document.querySelector('.ph-mobile-toggle');
    const nav = document.querySelector('.ph-nav');
    const navLinks = document.querySelectorAll('.ph-nav-link');
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (!toggle || !nav) return;
    
    // Toggle menu
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileMenu();
    });
    
    // Chiudi menu sui link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
    // Non chiudere menu sul theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    // Chiudi menu cliccando fuori
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.ph-header')) {
            closeMobileMenu();
        }
    });
    
    // Chiudi menu con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });
    
    // Gestisci resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    const toggle = document.querySelector('.ph-mobile-toggle');
    const nav = document.querySelector('.ph-nav');
    
    const isOpen = nav.classList.contains('active');
    
    if (isOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    const toggle = document.querySelector('.ph-mobile-toggle');
    const nav = document.querySelector('.ph-nav');
    
    nav.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Chiudi menu');
    
    // Blocca scroll del body
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    const toggle = document.querySelector('.ph-mobile-toggle');
    const nav = document.querySelector('.ph-nav');
    
    nav.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Apri menu');
    
    // Ripristina scroll del body
    document.body.style.overflow = '';
}

// ========= DARK MODE FUNCTIONALITY =========

// Funzione per inizializzare il dark mode
function initializeDarkMode() {
    // Carica il tema salvato o imposta default
    const savedTheme = localStorage.getItem('palermohub-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Aggiorna il toggle se esiste
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
        updateThemeIcon();
    }
    
    console.log(`PalermoHub Theme initialized: ${savedTheme}`);
}

// Funzione per cambiare tema
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Applica il nuovo tema
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Salva la preferenza
    localStorage.setItem('palermohub-theme', newTheme);
    
    // Aggiorna l'icona
    updateThemeIcon();
    
    // Feedback visivo opzionale
    console.log(`Theme switched to: ${newTheme}`);
    
    // Trigger evento personalizzato per altri componenti
    const event = new CustomEvent('themeChanged', { detail: { theme: newTheme } });
    document.dispatchEvent(event);
}

// Funzione per aggiornare l'icona del toggle
// Sostituisci la funzione updateThemeIcon() esistente con questa versione aggiornata

function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    const themeLabel = document.querySelector('.theme-label');
    const logo = document.querySelector('.ph-logo img');
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Aggiorna l'icona del toggle
    if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        
        if (themeLabel) {
            themeLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        }
    }
    
    // Aggiorna il logo
    if (logo) {
        logo.src = isDark ? 'legend/pa_hub_new_white.png' : 'legend/pa_hub_new.png';
        // Aggiungi attributo alt appropriato
        logo.alt = isDark ? 'PalermoHub - White Logo' : 'PalermoHub';
    }
}

// ========= UTILITY FUNCTIONS =========

// VERSIONE MIGLIORATA - Più robusta e con logging
function clearFilter(filterId) {
    if (filterId === 'search') {
        const searchInput = document.getElementById('smart-search-input');
        if (searchInput) {
            searchInput.value = '';
            // Trigger l'evento input per aggiornare i risultati
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Se esiste la funzione globale per pulire la ricerca
            if (typeof window.clearSmartSearch === 'function') {
                window.clearSmartSearch();
            }
            
            // Se esiste un pulsante di reset per la ricerca, cliccalo
            const searchClearBtn = document.querySelector('.search-clear-btn');
            if (searchClearBtn) {
                searchClearBtn.click();
            }
        }
    } else {
        const element = document.getElementById(filterId);
        if (element) {
            element.value = '';
            // Trigger l'evento change per aggiornare i risultati
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    // Trigger aggiornamento filtri se esiste
    if (typeof window.applyFilters === 'function') {
        setTimeout(() => {
            window.applyFilters();
        }, 50);
    }
    
    // Aggiorna i breadcrumbs
    setTimeout(updateBreadcrumbs, 100);
    
    // Log per debug
    console.log(`Filter cleared: ${filterId}`);
}

// ========= GLOBAL EXPORTS =========
window.updatePalermoHubBreadcrumbs = updateBreadcrumbs;
window.clearFilter = clearFilter;
window.clearSpecificFilter = clearFilter; // Compatibilità 
window.clearSearch = () => clearFilter('search');

// Funzioni per debug e testing
window.forceUpdateFilters = function() {
    updateBreadcrumbs();
    console.log('Filters updated manually');
};

window.getCurrentFiltersState = function() {
    const state = {
        activeFilters: getActiveFilters(),
        pageInfo: getCurrentPageInfo(),
        breadcrumbsVisible: document.getElementById('ph-breadcrumbs')?.style.display !== 'none'
    };
    console.log('Current filters state:', state);
    return state;
};

// Esporta funzioni per uso globale
window.PalermoHubTheme = {
    toggle: toggleTheme,
    setTheme: function(theme) {
        if (theme === 'light' || theme === 'dark') {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('palermohub-theme', theme);
            const toggle = document.getElementById('theme-toggle-checkbox');
            if (toggle) {
                toggle.checked = theme === 'dark';
                updateThemeIcon();
            }
        }
    },
    getTheme: function() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    },
    onThemeChange: function(callback) {
        document.addEventListener('themeChanged', callback);
    }
};

// Aggiungi CSS principale se non esiste
if (!document.getElementById('palermohub-styles')) {
    const link = document.createElement('link');
    link.id = 'palermohub-styles';
    link.rel = 'stylesheet';
    link.href = 'lib/css/ph-css.css';
    document.head.appendChild(link);
}