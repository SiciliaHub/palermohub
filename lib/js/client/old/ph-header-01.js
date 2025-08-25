// header.js - Header e breadcrumbs ottimizzati per mobile + Dark Mode
document.addEventListener('DOMContentLoaded', function() {
    initializeHeader();
    initializeBreadcrumbs();
    setupMobileInteractions();
    
    // NUOVO: Inizializza dark mode
    initializeDarkMode();
    
    // NUOVO: Aggiungi listener per il toggle tema
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
    }
    
    // NUOVO: Listener per preferenze di sistema
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
                <img src="legend/pa_hub000.png" alt="PalermoHub" title="PalermoHub by opendadatasicilia.it">
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
               /* max-width: 1200px;  ← RIMUOVERE questa riga */
    /* margin: 0 auto;     ← RIMUOVERE questa riga */
    width: 100%;            /* ← AGGIUNGERE per larghezza completa */
    padding: 0.75rem 2rem;  /* ← AUMENTARE padding laterale */
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
        
        /* Breadcrumbs - ALTEZZA RIDOTTA */
        .ph-breadcrumbs {
            background: rgba(248, 250, 252, 0.95);
            border-bottom: 1px solid #e2e8f0;
            padding: 0.25rem 0;
        }
        
        .ph-breadcrumbs-container {
    /* max-width: 1200px;  ← RIMUOVERE questa riga */
    /* margin: 0 auto;     ← RIMUOVERE questa riga */
    width: 100%;            /* ← AGGIUNGERE per larghezza completa */
    padding: 0 2rem;        /* ← AUMENTARE padding laterale */
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
        
        /* Filtri attivi - ALTEZZA RIDOTTA */
        .ph-active-filters {
            margin-top: 0.25rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;
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
            display: flex;
            align-items: center;
            gap: 0.2rem;
        }
        
        .ph-filter-tag:hover,
        .ph-filter-tag:focus {
            background: #fed7d7;
            color: #c53030;
            border-color: #fc8181;
            outline: none;
        }
        
        .ph-filter-remove {
            font-weight: bold;
            margin-left: 0.25rem;
        }
        
        /* ========= DARK MODE THEME TOGGLE ========= */
        
        /* Dark Mode Toggle */
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
            background: var(--primary-color);
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
        
        /* Focus states per accessibility */
        .theme-toggle:focus-within {
            outline: 2px solid var(--primary-color, #ff9900);
            outline-offset: 2px;
        }
        
        /* ========= RESPONSIVE ========= */
        
        /* Tablet */
        @media (max-width: 1024px) {
            .ph-nav-list {
                gap: 1rem;
            }
            
            .ph-nav-link {
                font-size: 0.85rem;
                padding: 0.4rem 0.6rem;
            }
        }
        
        /* Mobile landscape e portrait */
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
            
            /* Mobile adjustments for theme toggle */
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
            
            /* Menu mobile - TEMA SCURO quando aperto */
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
            
            /* Mobile nav specific per theme toggle */
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
            
            /* Breadcrumbs mobile - ALTEZZA RIDOTTA */
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
            
            .ph-filter-tag {
                font-size: 0.65rem;
                padding: 0.1rem 0.5rem;
            }
        }
        
        /* Mobile small - ALTEZZA RIDOTTA */
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
            
            /* Nascondi filtri in eccesso */
            .ph-active-filters {
                overflow: hidden;
                position: relative;
            }
            
            .ph-filter-tag:nth-child(n+4) {
                display: none;
            }
        }
        
        /* Supporto notch */
        @supports(padding: max(0px)) {
    .ph-header-container,
    .ph-breadcrumbs-container {
        padding-left: max(2rem, env(safe-area-inset-left));   /* Aggiornato da 1rem a 2rem */
        padding-right: max(2rem, env(safe-area-inset-right)); /* Aggiornato da 1rem a 2rem */
            }
        }
        
        /* Miglioramenti accessibilità */
        @media (prefers-reduced-motion: reduce) {
            .ph-nav,
            .ph-hamburger-line,
            .ph-nav-link,
            .ph-filter-tag,
            .theme-toggle,
            .theme-slider {
                transition: none;
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

// ========= BREADCRUMBS SYSTEM =========
function initializeBreadcrumbs() {
    setTimeout(() => {
        updateBreadcrumbs();
        observeFilters();
    }, 100);
}

function updateBreadcrumbs() {
    const pageInfo = getCurrentPageInfo();
    const breadcrumbsEl = document.getElementById('ph-breadcrumbs');
    const breadcrumbsList = document.getElementById('ph-breadcrumbs-list');
    const activeFilters = document.getElementById('ph-active-filters');
    
    if (!pageInfo.showBreadcrumbs) {
        breadcrumbsEl.style.display = 'none';
        return;
    }
    
    // Costruisci breadcrumbs base
    let breadcrumbsHTML = '<li><a href="index.html" class="ph-breadcrumb-link">Home</a></li>';
    
    if (pageInfo.title) {
        breadcrumbsHTML += `<li><span class="ph-breadcrumb-current">${pageInfo.title}</span></li>`;
    }
    
    breadcrumbsList.innerHTML = breadcrumbsHTML;
    
    // Aggiungi filtri attivi se siamo nella home
    if (pageInfo.isHome) {
        updateActiveFilters();
    } else {
        activeFilters.innerHTML = '';
    }
    
    breadcrumbsEl.style.display = 'block';
}

function updateActiveFilters() {
    const activeFilters = document.getElementById('ph-active-filters');
    if (!activeFilters) return;
    
    const filters = getActiveFilters();
    let filtersHTML = '';
    
    filters.forEach(filter => {
        filtersHTML += `
            <button class="ph-filter-tag" onclick="clearFilter('${filter.id}')" title="Rimuovi filtro">
                ${filter.label}: ${filter.value}
                <span class="ph-filter-remove">×</span>
            </button>
        `;
    });
    
    activeFilters.innerHTML = filtersHTML;
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
    
    // Controlla filtri select
    Object.entries(filterMappings).forEach(([id, label]) => {
        const element = document.getElementById(id);
        if (element && element.value && element.value.trim()) {
            filters.push({
                id: id,
                label: label,
                value: element.value.length > 15 ? element.value.substring(0, 15) + '...' : element.value
            });
        }
    });
    
    // Controlla ricerca
    const searchInput = document.getElementById('smart-search-input');
    if (searchInput && searchInput.value && searchInput.value.trim()) {
        filters.push({
            id: 'search',
            label: 'Ricerca',
            value: searchInput.value.length > 12 ? searchInput.value.substring(0, 12) + '...' : searchInput.value
        });
    }
    
    return filters;
}

function getCurrentPageInfo() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    const pages = {
        'index.html': { title: '', showBreadcrumbs: false, isHome: true },
        '': { title: '', showBreadcrumbs: false, isHome: true },
        'wiki.html': { title: 'Funzionalità Avanzate', showBreadcrumbs: true, isHome: false },
        'geolocalizza.html': { title: 'Geocodifica Indirizzo', showBreadcrumbs: true, isHome: false },
        'strumenti.html': { title: 'Strumenti', showBreadcrumbs: true, isHome: false },
        'info.html': { title: 'Privacy', showBreadcrumbs: true, isHome: false },
        'about.html': { title: 'About', showBreadcrumbs: true, isHome: false }
    };
    
    return pages[filename] || { title: 'Pagina', showBreadcrumbs: true, isHome: false };
}

function observeFilters() {
    // Osserva filtri select
    const filters = document.querySelectorAll('.filter-select');
    filters.forEach(filter => {
        filter.addEventListener('change', () => {
            setTimeout(updateBreadcrumbs, 100);
        });
    });
    
    // Osserva ricerca
    const searchInput = document.getElementById('smart-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            setTimeout(updateBreadcrumbs, 300);
        });
    }
    
    // Osserva reset filtri
    const clearButton = document.getElementById('clear-filters');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            setTimeout(updateBreadcrumbs, 100);
        });
    }
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
function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    const themeLabel = document.querySelector('.theme-label');
    
    if (themeIcon) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        
        if (themeLabel) {
            themeLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        }
    }
}

// ========= UTILITY FUNCTIONS =========
function clearFilter(filterId) {
    if (filterId === 'search') {
        const searchInput = document.getElementById('smart-search-input');
        if (searchInput) {
            searchInput.value = '';
            if (typeof window.clearSmartSearch === 'function') {
                window.clearSmartSearch();
            }
        }
    } else {
        const element = document.getElementById(filterId);
        if (element) {
            element.value = '';
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    // Trigger aggiornamento se esiste
    if (typeof window.applyFilters === 'function') {
        window.applyFilters();
    }
    
    setTimeout(updateBreadcrumbs, 100);
}

// ========= GLOBAL EXPORTS =========
window.updatePalermoHubBreadcrumbs = updateBreadcrumbs;
window.clearFilter = clearFilter;
window.clearSpecificFilter = clearFilter; // Compatibilità 
window.clearSearch = () => clearFilter('search');

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