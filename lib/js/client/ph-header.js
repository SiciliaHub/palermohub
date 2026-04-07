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

// header.js - Header modale con linguetta di controllo + Dark Mode + Dynamic Maps Integration
let isHeaderOpen = true; // Header aperto di default
let mapsMetadata = null;

document.addEventListener('DOMContentLoaded', function() {
    // Crea la linguetta di controllo dell'header
    createHeaderToggleTab();
    
    // Crea l'header modale
    createModalHeader();
    
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
    
    // Inizializza breadcrumbs
    initializeBreadcrumbs();
    
    // Assicurati che l'header sia aperto all'avvio
    ensureHeaderOpen();
});

// ========================================
// LINGUETTA DI CONTROLLO HEADER
// ========================================

function createHeaderToggleTab() {
    const toggleTab = document.createElement('div');
    toggleTab.id = 'header-toggle-tab';
    toggleTab.className = 'header-toggle-tab';
    toggleTab.setAttribute('data-tooltip', 'Nascondi/Mostra Menu');
    toggleTab.innerHTML = `
        <div class="toggle-tab-content" title="PalermoHub - Nascondi/Mostra Menu">
            <div class="tab-pulse"></div>
            <i class="fas fa-bars tab-icon"></i>
            <div class="tab-shine"></div>
        </div>
    `;
    
    // Aggiungi listener per aprire/chiudere l'header
    toggleTab.addEventListener('click', toggleModalHeader);
    
    // Inserisci la linguetta nel body
    document.body.appendChild(toggleTab);
}

function createModalHeader() {
    // Crea l'overlay backdrop
    const headerOverlay = document.createElement('div');
    headerOverlay.id = 'header-modal-overlay';
    headerOverlay.className = 'header-modal-overlay';
    headerOverlay.style.display = 'block'; // Inizialmente visibile
    
    // Crea l'header modale
    const modalHeader = document.createElement('div');
    modalHeader.id = 'modal-header';
    modalHeader.className = 'modal-header';
    modalHeader.style.display = 'block'; // Inizialmente visibile
    
    modalHeader.innerHTML = `
        <div class="modal-header-close-tab" onclick="closeModalHeader()" title="Nascondi menu">
            <div class="close-tab-content">
                <i class="fas fa-chevron-up"></i>
            </div>
        </div>
        
        <div class="modal-header-content">
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
                        <li><a href="strumenti.html" class="ph-nav-link" title="Strumenti utilizzati">Strumenti</a></li>
                        <li><a href="geoimage.html" class="ph-nav-link" title="Georeferenziazione Mappe Storiche">Geoimage</a></li>
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
        </div>
    `;
    
    // Aggiungi listener per NON chiudere cliccando sull'overlay (diverso dal footer)
    // headerOverlay.addEventListener('click', closeModalHeader);
    
    // Inserisci overlay e header nel body
    document.body.appendChild(headerOverlay);
    document.body.appendChild(modalHeader);
    
    // Aggiungi gli stili
    addModalHeaderStyles();
    
    // Evidenzia la pagina attiva nel menu
    highlightActiveMenuPage();
    
    // Setup interazioni mobile
    setupMobileInteractions();
}

function ensureHeaderOpen() {
    isHeaderOpen = true;
    const overlay = document.getElementById('header-modal-overlay');
    const modalHeader = document.getElementById('modal-header');
    const toggleTab = document.getElementById('header-toggle-tab');
    
    if (overlay) {
        overlay.style.display = 'block';
        overlay.classList.add('overlay-visible');
    }
    
    if (modalHeader) {
        modalHeader.style.display = 'block';
        modalHeader.classList.add('modal-header-open');
    }
    
    if (toggleTab) {
        toggleTab.classList.add('tab-active');
        const icon = toggleTab.querySelector('.tab-icon');
        if (icon) icon.className = 'fas fa-times tab-icon';
    }
    
    // Aggiungi padding al body per non coprire il contenuto
    document.body.classList.add('header-modal-open');
    
    // Avvia l'effetto pulse sul pulsante di chiusura dopo un delay
    setTimeout(() => {
        startHeaderClosePulseFor3Seconds();
    }, 1500);
}

function toggleModalHeader() {
    if (isHeaderOpen) {
        closeModalHeader();
    } else {
        openModalHeader();
    }
}

function openModalHeader() {
    if (isHeaderOpen) return;
    
    isHeaderOpen = true;
    const overlay = document.getElementById('header-modal-overlay');
    const modalHeader = document.getElementById('modal-header');
    const toggleTab = document.getElementById('header-toggle-tab');
    
    // Mostra overlay e header
    if (overlay) {
        overlay.style.display = 'block';
        setTimeout(() => overlay.classList.add('overlay-visible'), 10);
    }
    
    if (modalHeader) {
        modalHeader.style.display = 'block';
        setTimeout(() => modalHeader.classList.add('modal-header-open'), 10);
    }
    
    // Aggiorna linguetta
    if (toggleTab) {
        toggleTab.classList.add('tab-active');
        const icon = toggleTab.querySelector('.tab-icon');
        if (icon) icon.className = 'fas fa-times tab-icon';
    }
    
    // Aggiungi padding al body per non coprire il contenuto
    document.body.classList.add('header-modal-open');
    
    // Trigger eventi personalizzati
    window.dispatchEvent(new CustomEvent('headerModalOpened'));
    
    // Avvia l'effetto pulse sul pulsante di chiusura dopo un delay
    setTimeout(() => {
        startHeaderClosePulseFor3Seconds();
    }, 1500);
}

function closeModalHeader() {
    if (!isHeaderOpen) return;
    
    // Ferma l'effetto pulse quando si chiude
    stopHeaderClosePulse();
    
    isHeaderOpen = false;
    const overlay = document.getElementById('header-modal-overlay');
    const modalHeader = document.getElementById('modal-header');
    const toggleTab = document.getElementById('header-toggle-tab');
    
    // Nascondi overlay e header con animazione
    if (overlay) {
        overlay.classList.remove('overlay-visible');
    }
    
    if (modalHeader) {
        modalHeader.classList.remove('modal-header-open');
    }
    
    // Rimuovi padding dal body
    document.body.classList.remove('header-modal-open');
    
    // Nascondi completamente dopo l'animazione
    setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
        if (modalHeader) modalHeader.style.display = 'none';
    }, 400);
    
    // Aggiorna linguetta
    if (toggleTab) {
        toggleTab.classList.remove('tab-active');
        const icon = toggleTab.querySelector('.tab-icon');
        if (icon) icon.className = 'fas fa-bars tab-icon';
    }
    
    // Trigger eventi personalizzati
    window.dispatchEvent(new CustomEvent('headerModalClosed'));
}

// ========================================
// EFFETTO PULSE HEADER CLOSE TAB (3 SECONDI)
// ========================================

function startHeaderClosePulseFor3Seconds() {
    const closeTab = document.querySelector('.modal-header-close-tab');
    console.log('startHeaderClosePulseFor3Seconds chiamata:', closeTab, 'isHeaderOpen:', isHeaderOpen);
    
    if (closeTab && isHeaderOpen) {
        console.log('Applicando classe header-close-pulse-active');
        closeTab.classList.add('header-close-pulse-active');
        
        // Verifica che la classe sia stata applicata
        setTimeout(() => {
            console.log('Classi elemento close tab:', closeTab.className);
            console.log('Ha classe pulse?', closeTab.classList.contains('header-close-pulse-active'));
        }, 100);
        
        // Ferma l'animazione dopo 3 secondi
        setTimeout(() => {
            console.log('Fermando pulse close tab dopo 3 secondi');
            stopHeaderClosePulse();
        }, 3000);
    } else {
        console.log('Pulse close tab non avviato - elemento:', !!closeTab, 'header aperto:', isHeaderOpen);
    }
}

function stopHeaderClosePulse() {
    const closeTab = document.querySelector('.modal-header-close-tab');
    if (closeTab) {
        console.log('Rimuovendo classe header-close-pulse-active');
        closeTab.classList.remove('header-close-pulse-active');
    }
}

// ========= EVIDENZIAZIONE PAGINA ATTIVA =========
function highlightActiveMenuPage() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    console.log('Current page for menu highlighting:', currentPage);
    
    const pageMapping = {
        'index.html': 'index.html',
        '': 'index.html',
        'funzion.html': 'funzion.html',
        'geolocalizza.html': 'geolocalizza.html',
        'strumenti.html': 'strumenti.html',
        'info.html': 'info.html',
        'about.html': 'about.html'
    };
    
    const activePage = pageMapping[currentPage] || currentPage;
    
    document.querySelectorAll('.ph-nav-link.active').forEach(link => {
        link.classList.remove('active');
    });
    
    const navLinks = document.querySelectorAll('.ph-nav-link');
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        
        if (linkHref === activePage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
            console.log('Menu item activated:', linkHref);
        }
        else if ((activePage === 'index.html' || activePage === '' || currentPath === '/') && linkHref === 'index.html') {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
            console.log('Home menu item activated');
        }
        else {
            link.removeAttribute('aria-current');
        }
    });
}

function updateActiveMenuState() {
    highlightActiveMenuPage();
}

// ========= MAPS METADATA SYSTEM =========
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
    
    const possibleKeys = [
        filename,
        `./${filename}`,
        filename.replace('.html', ''),
        `${filename}`,
    ];
    
    for (const key of possibleKeys) {
        if (mapsMetadata[key]) {
            return mapsMetadata[key];
        }
    }
    
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
    
    const staticPages = {
        'index.html': { title: '', showBreadcrumbs: false, isHome: true, type: 'home' },
        '': { title: '', showBreadcrumbs: false, isHome: true, type: 'home' },
        'funzion.html': { title: 'Funzionalità Avanzate', showBreadcrumbs: true, isHome: false, type: 'static' },
        'geolocalizza.html': { title: 'Geocodifica Indirizzo', showBreadcrumbs: true, isHome: false, type: 'static' },
        'strumenti.html': { title: 'Strumenti', showBreadcrumbs: true, isHome: false, type: 'static' },
        'geoimage.html': { title: 'Geoimage — Georeferenziazione Mappe Storiche', showBreadcrumbs: true, isHome: false, type: 'static' },
        'info.html': { title: 'Privacy', showBreadcrumbs: true, isHome: false, type: 'static' },
        'about.html': { title: 'About', showBreadcrumbs: true, isHome: false, type: 'static' }
    };
    
    if (staticPages[filename]) {
        console.log('Found static page:', filename);
        return staticPages[filename];
    }
    
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
    
    return { 
        title: 'Pagina', 
        showBreadcrumbs: true, 
        isHome: false, 
        type: 'unknown' 
    };
}

// ========= BREADCRUMBS SYSTEM =========
function initializeBreadcrumbs() {
    loadMapsMetadata().then(() => {
        updateBreadcrumbs();
        initializeFiltersObserver();
        
        setTimeout(handleUrlFilters, 200);
        
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
    
    let breadcrumbsHTML = '<li><a href="index.html" class="ph-breadcrumb-link">Home</a></li>';
    
    if (pageInfo.type === 'map' && pageInfo.mapData) {
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
    
    if (pageInfo.type === 'map' && pageInfo.mapData) {
        displayMapMetadata(pageInfo.mapData);
    } else if (pageInfo.isHome) {
        updateActiveFilters();
    } else {
        activeFilters.innerHTML = '';
    }
    
    const filters = getActiveFilters();
    if (pageInfo.showBreadcrumbs || pageInfo.isHome && filters.length > 0) {
        breadcrumbsEl.style.display = 'block';
    } else {
        breadcrumbsEl.style.display = 'none';
    }
    
    console.log('Breadcrumbs updated for:', pageInfo.type, pageInfo.title);
}

function displayMapMetadata(mapData) {
    const activeFilters = document.getElementById('ph-active-filters');
    if (!activeFilters) return;
    
    let metadataHTML = '';
    
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
    
    if (mapData.tags && Array.isArray(mapData.tags) && mapData.tags.length > 0) {
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

function buildFilterUrl(filterType, filterValue) {
    const baseUrl = 'index.html';
    const params = new URLSearchParams();
    
    const filterMapping = {
        'categoria': 'categoria',
        'territorio': 'territorio', 
        'fonte': 'fonte',
        'anno': 'anno',
        'autore': 'collaborazione',
        'tag': 'tag'
    };
    
    const paramName = filterMapping[filterType] || filterType;
    params.set(paramName, filterValue);
    
    return `${baseUrl}?${params.toString()}`;
}

function buildMultiTagUrl(tags) {
    const baseUrl = 'index.html';
    const params = new URLSearchParams();
    
    if (tags.length > 0) {
        params.set('tag', tags[0]);
    }
    
    return `${baseUrl}?${params.toString()}`;
}

function handleUrlFilters() {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        const urlParams = new URLSearchParams(window.location.search);
        
        const filterSelectors = {
            'categoria': 'categoria-filter',
            'territorio': 'territorio-filter',
            'fonte': 'fonte-filter',
            'anno': 'anno-filter',
            'collaborazione': 'collaborazione-filter',
            'tag': 'tag-filter'
        };
        
        let hasFilters = false;
        for (const [param, selector] of Object.entries(filterSelectors)) {
            const value = urlParams.get(param);
            if (value) {
                const filterElement = document.getElementById(selector);
                if (filterElement) {
                    setTimeout(() => {
                        filterElement.value = value;
                        filterElement.dispatchEvent(new Event('change', { bubbles: true }));
                        hasFilters = true;
                    }, 500);
                }
            }
        }
        
        if (hasFilters) {
            setTimeout(() => {
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 1000);
        }
    }
}

function updateActiveFilters() {
    const activeFilters = document.getElementById('ph-active-filters');
    if (!activeFilters) return;
    
    const filters = getActiveFilters();
    let filtersHTML = '';
    
    if (filters.length > 0) {
        filters.forEach(filter => {
            filtersHTML += `
                <button class="ph-filter-tag" onclick="clearFilter('${filter.id}')" title="Rimuovi filtro: ${filter.fullValue || filter.value}">
                    ${filter.label}: ${filter.value}
                    <span class="ph-filter-remove">×</span>
                </button>
            `;
        });
        
        if (filters.length > 1) {
            filtersHTML += `<span class="ph-filters-indicator">${filters.length} filtri attivi</span>`;
        }
    }
    
    activeFilters.innerHTML = filtersHTML;
    
    const breadcrumbs = document.getElementById('ph-breadcrumbs');
    if (breadcrumbs) {
        if (filters.length > 0) {
            breadcrumbs.style.display = 'block';
        } else if (!getCurrentPageInfo().showBreadcrumbs) {
            breadcrumbs.style.display = 'none';
        }
    }
}

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

function initializeFiltersObserver() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(observeFilters, 100);
        });
    } else {
        setTimeout(observeFilters, 100);
    }
    
    const observer = new MutationObserver((mutations) => {
        let shouldReobserve = false;
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
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

function observeFilters() {
    let updateTimeout;
    
    const debouncedUpdate = () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
            updateBreadcrumbs();
        }, 150);
    };
    
    const filters = document.querySelectorAll('.filter-select');
    filters.forEach(filter => {
        filter.addEventListener('change', debouncedUpdate);
    });
    
    const searchInput = document.getElementById('smart-search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                updateBreadcrumbs();
            }, 400);
        });
    }
    
    const clearButton = document.getElementById('clear-filters');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            setTimeout(updateBreadcrumbs, 50);
        });
    }
    
    const resetButtons = document.querySelectorAll('[id$="-reset"], [class*="reset-filter"]');
    resetButtons.forEach(button => {
        button.addEventListener('click', debouncedUpdate);
    });
    
    setTimeout(updateBreadcrumbs, 200);
}

// ========= MOBILE INTERACTIONS =========
function setupMobileInteractions() {
    const toggle = document.querySelector('.ph-mobile-toggle');
    const nav = document.querySelector('.ph-nav');
    const navLinks = document.querySelectorAll('.ph-nav-link');
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (!toggle || !nav) return;
    
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileMenu();
    });
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });
    
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#modal-header')) {
            closeMobileMenu();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });
    
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
}

function closeMobileMenu() {
    const toggle = document.querySelector('.ph-mobile-toggle');
    const nav = document.querySelector('.ph-nav');
    
    nav.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Apri menu');
}

// ========= DARK MODE FUNCTIONALITY =========
function initializeDarkMode() {
    const savedTheme = localStorage.getItem('palermohub-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
        updateThemeIcon();
    }
    
    console.log(`PalermoHub Theme initialized: ${savedTheme}`);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('palermohub-theme', newTheme);
    updateThemeIcon();
    
    console.log(`Theme switched to: ${newTheme}`);
    
    const event = new CustomEvent('themeChanged', { detail: { theme: newTheme } });
    document.dispatchEvent(event);
}

function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    const themeLabel = document.querySelector('.theme-label');
    const logo = document.querySelector('.ph-logo img');
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        
        if (themeLabel) {
            themeLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        }
    }
    
    if (logo) {
        logo.src = isDark ? 'legend/pa_hub_new_white.png' : 'legend/pa_hub_new.png';
        logo.alt = isDark ? 'PalermoHub - White Logo' : 'PalermoHub';
    }
}

// ========= UTILITY FUNCTIONS =========
function clearFilter(filterId) {
    if (filterId === 'search') {
        const searchInput = document.getElementById('smart-search-input');
        if (searchInput) {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            if (typeof window.clearSmartSearch === 'function') {
                window.clearSmartSearch();
            }
            
            const searchClearBtn = document.querySelector('.search-clear-btn');
            if (searchClearBtn) {
                searchClearBtn.click();
            }
        }
    } else {
        const element = document.getElementById(filterId);
        if (element) {
            element.value = '';
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    if (typeof window.applyFilters === 'function') {
        setTimeout(() => {
            window.applyFilters();
        }, 50);
    }
    
    setTimeout(updateBreadcrumbs, 100);
    
    console.log(`Filter cleared: ${filterId}`);
}

// ========= STYLES =========
function addModalHeaderStyles() {
    if (document.getElementById('ph-modal-header-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'ph-modal-header-styles';
    styles.textContent = `
        /* Reset e base */
        .modal-header * {
            box-sizing: border-box;
        }
        
        /* Linguetta di controllo dell'header */
        .header-toggle-tab {
            position: fixed;
            top: 0px;
            right: 20px;
            z-index: 9999;
            background: linear-gradient(135deg, var(--primary-color, #ff9900) 0%, #ff7700 100%);
            color: white;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 12px rgba(255, 153, 0, 0.4);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            user-select: none;
            width: 48px;
            height: 32px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .header-toggle-tab::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            background: linear-gradient(45deg, #ff9900, #ff7700, #ff9900, #ff7700);
            background-size: 400% 400%;
            border-radius: 0 0 8px 8px;
            z-index: -1;
            animation: borderGlow 3s ease-in-out infinite;
            opacity: 0.6;
        }
        
        @keyframes borderGlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .header-toggle-tab:hover {
            box-shadow: 0 2px 16px rgba(255, 153, 0, 0.6);
            background: linear-gradient(135deg, #ff7700 0%, #ff5500 100%);
            width: 52px;
            height: 36px;
        }
        
        .header-toggle-tab.tab-active {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 12px rgba(34, 197, 94, 0.4);
            width: 52px;
            height: 36px;
        }
        
        .header-toggle-tab.tab-active::before {
            background: linear-gradient(45deg, #22c55e, #16a34a, #22c55e, #16a34a);
            border-radius: 0 0 8px 8px;
        }
        
        .header-toggle-tab.tab-active:hover {
            background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            width: 56px;
            height: 40px;
        }
        
        .toggle-tab-content {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            position: relative;
            padding: 0;
        }
        
        .tab-pulse {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 5px;
            height: 5px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            animation: pulseCompact 2s ease-in-out infinite;
        }
        
        .header-toggle-tab.tab-active .tab-pulse,
        .header-toggle-tab:hover .tab-pulse {
            display: none;
        }
        
        @keyframes pulseCompact {
            0%, 100% {
                opacity: 0.3;
                transform: scale(0.8);
            }
            50% {
                opacity: 1;
                transform: scale(1.3);
            }
        }
        
        .tab-shine {
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transition: left 0.5s ease-in-out;
        }
        
        .header-toggle-tab:hover .tab-shine {
            left: 100%;
        }
        
        .tab-icon {
            font-size: 1.1rem;
            filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
            transition: transform 0.3s ease;
            position: relative;
            z-index: 1;
        }
        
        .header-toggle-tab:hover .tab-icon {
            transform: scale(1.15);
        }
        
        .header-toggle-tab.tab-active .tab-icon {
            transform: rotate(90deg);
        }
        
        .header-toggle-tab::after {
            content: attr(data-tooltip);
            position: absolute;
            top: 100%;
            left: 0;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transform: translateY(-5px);
            transition: all 0.3s ease;
            z-index: 10000;
        }
        
        .header-toggle-tab:hover::after {
            opacity: 1;
            transform: translateY(0);
        }
        
        /* Overlay backdrop */
        .header-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            backdrop-filter: none;
            z-index: 9998;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            pointer-events: none;
        }
        
        .header-modal-overlay.overlay-visible {
            opacity: 1;
            visibility: visible;
        }
        
        /* Header modale */
        .modal-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #e2e8f0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            transform: translateY(-100%);
            transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        
        .modal-header.modal-header-open {
            transform: translateY(0);
        }
        
        .modal-header-close-tab {
            position: absolute;
            bottom: -32px;
            right: 20px;
            background: linear-gradient(135deg, #ff9900 0%, #ff7700 100%);
            border: none;
            border-radius: 0 0 8px 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: none!important;
            color: white;
            padding: 0px;
            width: 48px;
            height: 32px;
            box-shadow: 0 2px 12px rgba(255, 153, 0, 0.4);
            z-index: 9998!important;
			overflow: hidden!important;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        /* EFFETTO PULSE CLOSE TAB - VERSIONE ROBUSTA */
        .modal-header-close-tab.header-close-pulse-active {
            animation: headerClosePulse 1.5s ease-out 2 !important;
            transition: none !important;
        }
        
        /* Disabilita hover durante pulse */
        .modal-header-close-tab.header-close-pulse-active:hover {
            animation: headerClosePulse 1.5s ease-out 2 !important;
            transform: none !important;
        }
        
        @keyframes headerClosePulse {
            0% {
                box-shadow: 0 2px 12px rgba(255, 153, 0, 0.4), 0 0 0 0 rgba(255, 153, 0, 0.9) !important;
                transform: scale(1) !important;
                border: 2px solid rgba(255, 255, 255, 0.3) !important;
            }
            50% {
                box-shadow: 0 2px 12px rgba(255, 153, 0, 0.6), 0 0 0 30px rgba(255, 153, 0, 0.4) !important;
                transform: scale(1.15) !important;
                border: 4px solid rgba(255, 153, 0, 0.9) !important;
            }
            100% {
                box-shadow: 0 2px 12px rgba(255, 153, 0, 0.4), 0 0 0 50px rgba(255, 153, 0, 0) !important;
                transform: scale(1) !important;
                border: 2px solid rgba(255, 255, 255, 0.3) !important;
            }
        }
        
        /* Ferma il pulse quando l'utente interagisce */
        .modal-header-close-tab:hover.header-close-pulse-active {
            animation: none !important;
        }
        
        .modal-header-close-tab::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #ff9900 0%, #ff9900 100%);
            opacity: 0;
            border-radius: 0 0 6px 6px;
        }
        
        .modal-header-close-tab:hover::before {
            opacity: 1;
        }
        
        .close-tab-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            position: relative;
            z-index: 1;
        }
        
        .close-tab-content i {
            font-size: 1rem;
            transition: transform 0.3s ease;
            filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
        }
        
        .modal-header-close-tab:hover {
            box-shadow: 0 4px 16px rgba(255, 153, 0, 0.6);
        }
        
        .modal-header-close-tab:hover .close-tab-content i {
            transform: scale(1.1);
        }
        
        /* Contenuto header */
        .modal-header-content {
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
            position: relative;
        }
        
        .ph-nav-link:hover,
        .ph-nav-link:focus {
            color: #ff9900;
            background: rgba(255, 153, 0, 0.1);
            outline: none;
        }
        
        .ph-nav-link:active {
            color: #ff9900;
            background: rgba(255, 153, 0, 0.2);
            transform: scale(0.98);
            box-shadow: inset 0 2px 4px rgba(255, 153, 0, 0.3);
        }
        
        .ph-nav-link.active {
            color: #ff9900;
            background: rgba(255, 153, 0, 0.15);
            font-weight: 600;
            position: relative;
        }
        
        .ph-nav-link.active::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            height: 2px;
            border-radius: 1px;
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
        
        /* Filtri attivi */
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
        
        .ph-filters-indicator {
            background: var(--primary-color, #ff9900);
            color: white;
            padding: 0.1rem 0.4rem;
            border-radius: 10px;
            font-size: 0.6rem;
            font-weight: 600;
            margin-left: 0.5rem;
        }
        
        /* Metadati mappe */
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
            .header-toggle-tab {
                top: 0px;
                right: 15px;
                width: 44px;
                height: 30px;
            }
            
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
            
            .ph-nav-link:active {
                color: #ff9900;
                background: rgba(255, 153, 0, 0.25);
                transform: scale(0.95);
                box-shadow: inset 0 2px 6px rgba(255, 153, 0, 0.4);
            }
            
            .ph-nav-link.active {
                color: #ff9900;
                background: rgba(255, 153, 0, 0.2);
                font-weight: 600;
                border-left: 4px solid #ff9900;
                padding-left: calc(1rem - 4px);
            }
            
            .ph-nav-link.active::after {
                display: none;
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
            .header-toggle-tab {
                top: 0px;
                right: 10px;
                width: 42px;
                height: 28px;
            }
            
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
        
        @supports(padding: max(0px)) {
            .ph-header-container,
            .ph-breadcrumbs-container {
                padding-left: max(2rem, env(safe-area-inset-left));
                padding-right: max(2rem, env(safe-area-inset-right));
            }
        }
        
        @media (prefers-reduced-motion: reduce) {
            .modal-header,
            .ph-hamburger-line,
            .ph-nav-link,
            .ph-filter-tag,
            .theme-toggle,
            .theme-slider,
            .ph-active-filters,
            .header-toggle-tab {
                transition: none;
                animation: none;
            }
        }
        
        *, *::before, *::after {
            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
        }
        
        [data-theme="dark"] {
            color-scheme: dark;
        }
        
        [data-theme="light"] {
            color-scheme: light;
        }
        
        /* Padding body quando header è aperto per evitare sovrapposizioni */
        body.header-modal-open {
            padding-top: 130px;
            transition: padding-top 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        
        /* Responsive padding */
        @media (max-width: 768px) {
            body.header-modal-open {
                padding-top: 100px;
            }
        }
        
        @media (max-width: 480px) {
            body.header-modal-open {
                padding-top: 90px;
            }
        }
        
        /* Ridotto motion per accessibilità */
        @media (prefers-reduced-motion: reduce) {
            body.header-modal-open {
                transition: none;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

var __creator_gbv__ = "palermohub_2025";
var __org_ods__ = "opendatasicilia";

// ========= GLOBAL EXPORTS =========
window.updatePalermoHubBreadcrumbs = updateBreadcrumbs;
window.updateActiveMenuState = updateActiveMenuState;
window.clearFilter = clearFilter;
window.clearSpecificFilter = clearFilter;
window.clearSearch = () => clearFilter('search');
window.openModalHeader = openModalHeader;
window.closeModalHeader = closeModalHeader;
window.toggleModalHeader = toggleModalHeader;

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

if (!document.getElementById('palermohub-styles')) {
    const link = document.createElement('link');
    link.id = 'palermohub-styles';
    link.rel = 'stylesheet';
    link.href = 'lib/css/ph-css.css';
    document.head.appendChild(link);
}
