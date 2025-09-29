/*!
 * PalermoHub - Sistema di Gestione Centralizzato
 * Risolve conflitti tra header, footer e componenti principali
 * Copyright (c) 2025 Giovan Battista Vitrano (@gbvitrano)
 * Copyright (c) 2025 OpenDataSicilia (@opendatasicilia)
 */

/**
 * SISTEMA DI GESTIONE CENTRALIZZATO PALERMOHUB
 * Risolve tutti i conflitti identificati nell'analisi
 */

class PalermoHubManager {
    constructor() {
        this.state = {
            headerOpen: true,
            footerOpen: false,
            mobileMenuOpen: false,
            activeFilters: {},
            currentPage: this.getCurrentPageType(),
            bodyScrollLocked: false,
            zIndexRegistry: new Map()
        };
        
        this.config = {
            zIndexLayers: {
                base: 1000,
                overlay: 9000,
                modal: 9500,
                header: 9600,
                footer: 9700,
                suggestions: 10001,
                toast: 9800,
                debug: 9900
            },
            breakpoints: {
                mobile: 480,
                tablet: 768,
                desktop: 1024,
                large: 1280
            },
            timers: new Set(),
            intervals: new Set(),
            eventListeners: new Map()
        };
        
        this.breadcrumbsSystem = null;
        this.searchSystem = null;
        this.themeSystem = null;
        
        this.init();
    }
    
    // =============================================
    // INIZIALIZZAZIONE E SETUP
    // =============================================
    
    init() {
        console.log('[PalermoHub] Initializing Central Manager...');
        
        // Attendi che il DOM sia pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.setupZIndexManager();
        this.setupBodyManager();
        this.setupModalCoordination(); // Spostato qui prima di eventCoordination
        this.setupBreadcrumbsSystem();
        this.setupSearchSystem();
        this.setupThemeSystem();
        this.setupMobileManager();
        this.setupPerformanceManager();
        this.setupEventCoordination();
        
        // Override delle funzioni esistenti
        this.overrideExistingFunctions();
        
        console.log('[PalermoHub] Central Manager initialized successfully');
    }
    
    // =============================================
    // Z-INDEX MANAGER UNIFICATO
    // =============================================
    
    setupZIndexManager() {
        this.zIndexManager = {
            assign: (element, layer, identifier = null) => {
                if (!element || !this.config.zIndexLayers[layer]) return;
                
                const zIndex = this.config.zIndexLayers[layer];
                element.style.zIndex = zIndex;
                
                if (identifier) {
                    this.state.zIndexRegistry.set(identifier, { element, layer, zIndex });
                }
                
                console.log(`[ZIndex] Assigned ${zIndex} to ${identifier || 'element'} (${layer})`);
            },
            
            release: (identifier) => {
                if (this.state.zIndexRegistry.has(identifier)) {
                    const { element } = this.state.zIndexRegistry.get(identifier);
                    element.style.zIndex = '';
                    this.state.zIndexRegistry.delete(identifier);
                }
            },
            
            getNext: (layer) => {
                const base = this.config.zIndexLayers[layer] || this.config.zIndexLayers.base;
                const existing = Array.from(this.state.zIndexRegistry.values())
                    .filter(item => item.layer === layer)
                    .map(item => item.zIndex);
                
                return existing.length > 0 ? Math.max(...existing) + 1 : base;
            }
        };
    }
    
    // =============================================
    // BODY MANAGER CENTRALIZZATO
    // =============================================
    
    setupBodyManager() {
        this.bodyManager = {
            lockScroll: (reason) => {
                if (!this.state.bodyScrollLocked) {
                    document.body.style.overflow = 'hidden';
                    this.state.bodyScrollLocked = true;
                    console.log(`[Body] Scroll locked: ${reason}`);
                }
            },
            
            unlockScroll: (reason) => {
                if (this.state.bodyScrollLocked) {
                    document.body.style.overflow = '';
                    this.state.bodyScrollLocked = false;
                    console.log(`[Body] Scroll unlocked: ${reason}`);
                }
            },
            
            setPadding: (top = 0, reason = '') => {
                const current = parseInt(document.body.style.paddingTop) || 0;
                if (current !== top) {
                    document.body.style.paddingTop = top > 0 ? `${top}px` : '';
                    console.log(`[Body] Padding set to ${top}px: ${reason}`);
                }
            },
            
            addClass: (className, reason = '') => {
                if (!document.body.classList.contains(className)) {
                    document.body.classList.add(className);
                    console.log(`[Body] Added class ${className}: ${reason}`);
                }
            },
            
            removeClass: (className, reason = '') => {
                if (document.body.classList.contains(className)) {
                    document.body.classList.remove(className);
                    console.log(`[Body] Removed class ${className}: ${reason}`);
                }
            }
        };
    }
    
    // =============================================
    // MODAL COORDINATION SYSTEM
    // =============================================
    
    setupModalCoordination() {
        this.modalCoordinator = {
            openHeader: () => {
                if (this.state.footerOpen) {
                    this.modalCoordinator.closeFooter();
                }
                
                this.state.headerOpen = true;
                this.updateHeaderUI();
                this.bodyManager.addClass('header-modal-open', 'header opened');
                
                const headerEl = document.getElementById('modal-header');
                const overlayEl = document.getElementById('header-modal-overlay');
                
                if (headerEl && overlayEl) {
                    this.zIndexManager.assign(overlayEl, 'overlay', 'header-overlay');
                    this.zIndexManager.assign(headerEl, 'header', 'header-modal');
                    
                    overlayEl.style.display = 'block';
                    headerEl.style.display = 'block';
                    
                    setTimeout(() => {
                        overlayEl.classList.add('overlay-visible');
                        headerEl.classList.add('modal-header-open');
                    }, 10);
                }
                
                this.calculateBodyPadding();
                console.log('[Modal] Header opened');
            },
            
            closeHeader: () => {
                this.state.headerOpen = false;
                this.updateHeaderUI();
                this.bodyManager.removeClass('header-modal-open', 'header closed');
                
                const headerEl = document.getElementById('modal-header');
                const overlayEl = document.getElementById('header-modal-overlay');
                
                if (headerEl && overlayEl) {
                    overlayEl.classList.remove('overlay-visible');
                    headerEl.classList.remove('modal-header-open');
                    
                    setTimeout(() => {
                        overlayEl.style.display = 'none';
                        headerEl.style.display = 'none';
                        this.zIndexManager.release('header-overlay');
                        this.zIndexManager.release('header-modal');
                    }, 400);
                }
                
                this.bodyManager.setPadding(0, 'header closed');
                console.log('[Modal] Header closed');
            },
            
            openFooter: () => {
                if (this.state.headerOpen) {
                    this.modalCoordinator.closeHeader();
                }
                
                this.state.footerOpen = true;
                this.updateFooterUI();
                this.bodyManager.lockScroll('footer opened');
                
                const footerEl = document.getElementById('modal-footer');
                const overlayEl = document.getElementById('footer-modal-overlay');
                
                if (footerEl && overlayEl) {
                    this.zIndexManager.assign(overlayEl, 'overlay', 'footer-overlay');
                    this.zIndexManager.assign(footerEl, 'footer', 'footer-modal');
                    
                    overlayEl.style.display = 'block';
                    footerEl.style.display = 'block';
                    
                    setTimeout(() => {
                        overlayEl.classList.add('overlay-visible');
                        footerEl.classList.add('modal-footer-open');
                    }, 10);
                }
                
                console.log('[Modal] Footer opened');
            },
            
            closeFooter: () => {
                this.state.footerOpen = false;
                this.updateFooterUI();
                this.bodyManager.unlockScroll('footer closed');
                
                const footerEl = document.getElementById('modal-footer');
                const overlayEl = document.getElementById('footer-modal-overlay');
                
                if (footerEl && overlayEl) {
                    overlayEl.classList.remove('overlay-visible');
                    footerEl.classList.remove('modal-footer-open');
                    
                    setTimeout(() => {
                        overlayEl.style.display = 'none';
                        footerEl.style.display = 'none';
                        this.zIndexManager.release('footer-overlay');
                        this.zIndexManager.release('footer-modal');
                    }, 400);
                }
                
                console.log('[Modal] Footer closed');
            }
        };
    }
    
    // =============================================
    // BREADCRUMBS SYSTEM UNIFICATO
    // =============================================
    
    setupBreadcrumbsSystem() {
        this.breadcrumbsSystem = {
            container: null,
            activeFilters: {},
            
            init: () => {
                this.breadcrumbsSystem.container = document.getElementById('ph-breadcrumbs');
                this.observeFilters();
            },
            
            update: () => {
                const pageInfo = this.getCurrentPageInfo();
                const filters = this.getActiveFilters();
                
                this.renderBreadcrumbs(pageInfo, filters);
                this.updateActiveFiltersDisplay(filters);
                
                // Decisione visibilità
                const shouldShow = pageInfo.showBreadcrumbs || 
                                 (pageInfo.isHome && filters.length > 0) ||
                                 pageInfo.type === 'map';
                
                if (this.breadcrumbsSystem.container) {
                    this.breadcrumbsSystem.container.style.display = shouldShow ? 'block' : 'none';
                }
            },
            
            clearFilter: (filterId) => {
                console.log(`[Breadcrumbs] Clearing filter: ${filterId}`);
                
                if (filterId === 'search') {
                    const searchInputs = [
                        document.getElementById('smart-search-input'),
                        document.getElementById('modal-footer-search-input')
                    ];
                    
                    searchInputs.forEach(input => {
                        if (input) {
                            input.value = '';
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    });
                    
                    // Chiudi suggerimenti se esistono
                    if (typeof window.hideSuggestions === 'function') {
                        window.hideSuggestions();
                    }
                } else {
                    const element = document.getElementById(filterId);
                    if (element) {
                        element.value = '';
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                
                // Applica filtri se disponibile
                if (typeof window.applyFilters === 'function') {
                    setTimeout(() => window.applyFilters(), 50);
                }
                
                // Aggiorna breadcrumbs
                setTimeout(() => this.breadcrumbsSystem.update(), 100);
            }
        };
        
        this.breadcrumbsSystem.init();
    }
    
    // =============================================
    // SEARCH SYSTEM COORDINATO
    // =============================================
    
    setupSearchSystem() {
        this.searchSystem = {
            mainInput: null,
            footerInput: null,
            
            init: () => {
                this.searchSystem.mainInput = document.getElementById('smart-search-input');
                this.searchSystem.footerInput = document.getElementById('modal-footer-search-input');
                
                this.setupSearchSync();
                this.fixSearchSuggestionsZIndex();
            },
            
            setupSearchSync: () => {
                const syncInputs = (sourceInput, targetInput, reason) => {
                    if (sourceInput && targetInput && sourceInput.value !== targetInput.value) {
                        targetInput.value = sourceInput.value;
                        console.log(`[Search] Synced ${reason}: "${sourceInput.value}"`);
                        
                        // Aggiorna pulsanti clear
                        this.updateSearchClearButtons(sourceInput.value);
                    }
                };
                
                if (this.searchSystem.mainInput) {
                    this.searchSystem.mainInput.addEventListener('input', (e) => {
                        syncInputs(e.target, this.searchSystem.footerInput, 'main → footer');
                    });
                }
                
                if (this.searchSystem.footerInput) {
                    this.searchSystem.footerInput.addEventListener('input', (e) => {
                        syncInputs(e.target, this.searchSystem.mainInput, 'footer → main');
                    });
                }
            },
            
            clear: () => {
                [this.searchSystem.mainInput, this.searchSystem.footerInput].forEach(input => {
                    if (input) {
                        input.value = '';
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                });
                
                this.updateSearchClearButtons('');
                
                if (typeof window.hideSuggestions === 'function') {
                    window.hideSuggestions();
                }
            }
        };
        
        this.searchSystem.init();
    }
    
    // =============================================
    // FIX Z-INDEX SUGGERIMENTI RICERCA
    // =============================================
    
    fixSearchSuggestionsZIndex() {
        console.log('[Search] Applying z-index fix for search suggestions...');
        
        // Applica z-index ai suggerimenti esistenti
        this.applySuggestionsZIndex();
        
        // Monitor per nuovi suggerimenti
        const observer = new MutationObserver(() => {
            this.applySuggestionsZIndex();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
        
        // Salva observer per cleanup
        if (!this.config.observers) {
            this.config.observers = [];
        }
        this.config.observers.push(observer);
    }
    
    applySuggestionsZIndex() {
        const suggestionsSelectors = [
            '.smart-suggestions',
            '#smart-suggestions', 
            '.suggestions-container',
            '.search-suggestions',
            '.suggestions-list',
            '#suggestions-list',
            '.suggestion-item',
            '.search-status',
            '#search-status',
            '.suggestions-count',
            '#suggestions-count'
        ];
        
        const suggestionLayerZ = this.config.zIndexLayers.suggestions;
        
        suggestionsSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el && el.style) {
                    this.zIndexManager.assign(el, 'suggestions', selector);
                    
                    // Assicura posizionamento relativo
                    if (el.style.position === '' || el.style.position === 'static') {
                        el.style.position = 'relative';
                    }
                }
            });
        });
        
        // Fix container ricerca
        const searchContainers = document.querySelectorAll('.smart-search-container, .search-input-container, #search-input-container');
        searchContainers.forEach(el => {
            if (el && el.style) {
                el.style.position = 'relative';
                el.style.zIndex = suggestionLayerZ;
            }
        });
    }
    
    // =============================================
    // THEME SYSTEM UNIFICATO
    // =============================================
    
    setupThemeSystem() {
        this.themeSystem = {
            current: 'light',
            
            init: () => {
                this.themeSystem.current = localStorage.getItem('palermohub-theme') || 
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                
                this.themeSystem.apply(this.themeSystem.current);
                this.setupThemeToggle();
                this.setupSystemPreferenceListener();
            },
            
            apply: (theme) => {
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('palermohub-theme', theme);
                this.themeSystem.current = theme;
                
                // Aggiorna tutti i toggle presenti
                const toggles = document.querySelectorAll('#theme-toggle-checkbox');
                toggles.forEach(toggle => {
                    toggle.checked = theme === 'dark';
                });
                
                this.updateThemeUI();
                
                // Dispatch evento per altri componenti
                document.dispatchEvent(new CustomEvent('themeChanged', { 
                    detail: { theme } 
                }));
                
                console.log(`[Theme] Applied: ${theme}`);
            },
            
            toggle: () => {
                const newTheme = this.themeSystem.current === 'light' ? 'dark' : 'light';
                this.themeSystem.apply(newTheme);
            },
            
            setupThemeToggle: () => {
                const toggles = document.querySelectorAll('#theme-toggle-checkbox');
                toggles.forEach(toggle => {
                    toggle.addEventListener('change', () => {
                        this.themeSystem.toggle();
                    });
                });
            },
            
            setupSystemPreferenceListener: () => {
                if (window.matchMedia) {
                    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                    mediaQuery.addListener((e) => {
                        if (!localStorage.getItem('palermohub-theme')) {
                            this.themeSystem.apply(e.matches ? 'dark' : 'light');
                        }
                    });
                }
            }
        };
        
        this.themeSystem.init();
    }
    
    // =============================================
    // MOBILE MANAGER COORDINATO
    // =============================================
    
    setupMobileManager() {
        this.mobileManager = {
            init: () => {
                this.setupResponsiveBreakpoints();
                this.setupTouchCoordination();
                this.setupMobileMenus();
                this.setupViewportHandling();
            },
            
            setupResponsiveBreakpoints: () => {
                Object.entries(this.config.breakpoints).forEach(([name, width]) => {
                    const mediaQuery = window.matchMedia(`(max-width: ${width}px)`);
                    mediaQuery.addListener(() => {
                        document.body.setAttribute('data-viewport', this.getCurrentViewport());
                    });
                });
                
                // Set initial viewport
                document.body.setAttribute('data-viewport', this.getCurrentViewport());
            },
            
            setupTouchCoordination: () => {
                let touchStartY = 0;
                let touchEndY = 0;
                
                document.addEventListener('touchstart', (e) => {
                    touchStartY = e.changedTouches[0].screenY;
                }, { passive: true });
                
                document.addEventListener('touchend', (e) => {
                    touchEndY = e.changedTouches[0].screenY;
                    this.handleSwipeGesture(touchStartY, touchEndY);
                }, { passive: true });
            },
            
            setupMobileMenus: () => {
                const hamburger = document.querySelector('.ph-mobile-toggle');
                if (hamburger) {
                    this.addEventListener(hamburger, 'click', (e) => {
                        e.preventDefault();
                        this.toggleMobileMenu();
                    });
                }
            },
            
            setupViewportHandling: () => {
                // Gestione viewport height per mobile
                const setViewportHeight = () => {
                    const vh = window.innerHeight * 0.01;
                    document.documentElement.style.setProperty('--vh', `${vh}px`);
                };
                
                setViewportHeight();
                this.addEventListener(window, 'resize', setViewportHeight);
                this.addEventListener(window, 'orientationchange', setViewportHeight);
            }
        };
        
        this.mobileManager.init();
    }
    
    // =============================================
    // PERFORMANCE MANAGER
    // =============================================
    
    setupPerformanceManager() {
        this.performanceManager = {
            init: () => {
                this.setupMemoryCleanup();
                this.setupTimerManagement();
                this.setupDebouncing();
            },
            
            setupMemoryCleanup: () => {
                // Cleanup periodico
                const cleanupInterval = setInterval(() => {
                    this.cleanupUnusedElements();
                    this.cleanupEventListeners();
                }, 5 * 60 * 1000); // Ogni 5 minuti
                
                this.config.intervals.add(cleanupInterval);
                
                // Cleanup al beforeunload
                this.addEventListener(window, 'beforeunload', () => {
                    this.cleanup();
                });
            },
            
            setupTimerManagement: () => {
                // Override setTimeout e setInterval per tracking
                const originalSetTimeout = window.setTimeout;
                const originalSetInterval = window.setInterval;
                
                window.setTimeout = (callback, delay, ...args) => {
                    const id = originalSetTimeout(callback, delay, ...args);
                    this.config.timers.add(id);
                    return id;
                };
                
                window.setInterval = (callback, delay, ...args) => {
                    const id = originalSetInterval(callback, delay, ...args);
                    this.config.intervals.add(id);
                    return id;
                };
            },
            
            setupDebouncing: () => {
                this.debounce = (func, wait) => {
                    let timeout;
                    return function executedFunction(...args) {
                        const later = () => {
                            clearTimeout(timeout);
                            func(...args);
                        };
                        clearTimeout(timeout);
                        timeout = setTimeout(later, wait);
                    };
                };
                
                this.throttle = (func, limit) => {
                    let inThrottle;
                    return function(...args) {
                        if (!inThrottle) {
                            func.apply(this, args);
                            inThrottle = true;
                            setTimeout(() => inThrottle = false, limit);
                        }
                    };
                };
            }
        };
        
        this.performanceManager.init();
    }
    
    // =============================================
    // EVENT COORDINATION
    // =============================================
    
    setupEventCoordination() {
        this.eventCoordinator = {
            init: () => {
                this.setupGlobalEventListeners();
                this.setupKeyboardHandling();
                this.setupWindowEvents();
            },
            
            setupGlobalEventListeners: () => {
                // ESC key per chiudere modal
                this.addEventListener(document, 'keydown', (e) => {
                    if (e.key === 'Escape') {
                        if (this.state.footerOpen) {
                            this.modalCoordinator.closeFooter();
                        } else if (this.state.mobileMenuOpen) {
                            this.closeMobileMenu();
                        }
                    }
                });
                
                // Click outside per chiudere mobile menu
                this.addEventListener(document, 'click', (e) => {
                    if (this.state.mobileMenuOpen && !e.target.closest('#modal-header')) {
                        this.closeMobileMenu();
                    }
                });
            },
            
            setupKeyboardHandling: () => {
                // Tab navigation enhancement
                this.addEventListener(document, 'keydown', (e) => {
                    if (e.key === 'Tab') {
                        document.body.classList.add('keyboard-navigation');
                    }
                });
                
                this.addEventListener(document, 'mousedown', () => {
                    document.body.classList.remove('keyboard-navigation');
                });
            },
            
            setupWindowEvents: () => {
                this.addEventListener(window, 'resize', this.debounce(() => {
                    this.handleWindowResize();
                }, 250));
                
                this.addEventListener(window, 'orientationchange', () => {
                    setTimeout(() => this.handleWindowResize(), 500);
                });
            }
        };
        
        this.eventCoordinator.init();
    }
    
    // =============================================
    // UTILITY METHODS
    // =============================================
    
    getCurrentPageType() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        const staticPages = {
            'index.html': 'home',
            '': 'home',
            'funzion.html': 'static',
            'geolocalizza.html': 'static',
            'strumenti.html': 'static',
            'info.html': 'static',
            'about.html': 'static'
        };
        
        return staticPages[filename] || 'map';
    }
    
    getCurrentPageInfo() {
        const type = this.getCurrentPageType();
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        switch (type) {
            case 'home':
                return { title: '', showBreadcrumbs: false, isHome: true, type: 'home' };
            case 'static':
                const titles = {
                    'funzion.html': 'Funzionalità Avanzate',
                    'geolocalizza.html': 'Geocodifica Indirizzo',
                    'strumenti.html': 'Strumenti',
                    'info.html': 'Privacy',
                    'about.html': 'About'
                };
                return { 
                    title: titles[filename] || 'Pagina', 
                    showBreadcrumbs: true, 
                    isHome: false, 
                    type: 'static' 
                };
            default:
                return { 
                    title: 'Mappa', 
                    showBreadcrumbs: true, 
                    isHome: false, 
                    type: 'map' 
                };
        }
    }
    
    getActiveFilters() {
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
            if (element && element.value && element.value.trim() && element.value !== '') {
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
    
    getCurrentViewport() {
        const width = window.innerWidth;
        if (width <= this.config.breakpoints.mobile) return 'mobile';
        if (width <= this.config.breakpoints.tablet) return 'tablet';
        if (width <= this.config.breakpoints.desktop) return 'desktop';
        return 'large';
    }
    
    // =============================================
    // EVENT LISTENER MANAGEMENT
    // =============================================
    
    addEventListener(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        
        const key = `${element.constructor.name}-${event}`;
        if (!this.config.eventListeners.has(key)) {
            this.config.eventListeners.set(key, []);
        }
        this.config.eventListeners.get(key).push({ element, event, handler, options });
    }
    
    removeEventListener(element, event, handler) {
        element.removeEventListener(event, handler);
        
        const key = `${element.constructor.name}-${event}`;
        if (this.config.eventListeners.has(key)) {
            const listeners = this.config.eventListeners.get(key);
            const index = listeners.findIndex(l => l.element === element && l.handler === handler);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    // =============================================
    // CLEANUP E OVERRIDE FUNCTIONS
    // =============================================
    
    cleanup() {
        console.log('[PalermoHub] Starting cleanup...');
        
        // Clear timers e intervals
        this.config.timers.forEach(id => clearTimeout(id));
        this.config.intervals.forEach(id => clearInterval(id));
        
        // Remove event listeners
        this.config.eventListeners.forEach((listeners, key) => {
            listeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        
        // Reset body state
        document.body.style.overflow = '';
        document.body.style.paddingTop = '';
        document.body.className = '';
        
        console.log('[PalermoHub] Cleanup completed');
    }
    
    overrideExistingFunctions() {
        // Override funzioni del header
        window.openModalHeader = () => this.modalCoordinator.openHeader();
        window.closeModalHeader = () => this.modalCoordinator.closeHeader();
        window.toggleModalHeader = () => {
            if (this.state.headerOpen) {
                this.modalCoordinator.closeHeader();
            } else {
                this.modalCoordinator.openHeader();
            }
        };
        
        // Override funzioni del footer
        window.openModalFooter = () => this.modalCoordinator.openFooter();
        window.closeModalFooter = () => this.modalCoordinator.closeFooter();
        window.toggleModalFooter = () => {
            if (this.state.footerOpen) {
                this.modalCoordinator.closeFooter();
            } else {
                this.modalCoordinator.openFooter();
            }
        };
        
        // Override breadcrumbs
        window.updatePalermoHubBreadcrumbs = () => this.breadcrumbsSystem.update();
        window.clearFilter = (filterId) => this.breadcrumbsSystem.clearFilter(filterId);
        
        // Override theme
        window.PalermoHubTheme = this.themeSystem;
        
        // NON sovrascrivere funzioni di caricamento dati critiche
        // Mantieni le funzioni originali: loadMapsData, displayMaps, applyFilters
        
        console.log('[PalermoHub] Functions overridden successfully (data functions preserved)');
    }
    
    // =============================================
    // SUPPORTO CARICAMENTO DATI
    // =============================================
    
    async waitForDataLoading() {
        console.log('[Manager] Waiting for data loading...');
        
        const maxWait = 10000; // 10 secondi
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (window.allMaps && window.allMaps.length > 0) {
                console.log(`[Manager] Data loaded successfully: ${window.allMaps.length} maps`);
                this.ensureDataDisplay();
                return;
            }
            await this.delay(200);
        }
        
        console.warn('[Manager] Data loading timeout, attempting fallback');
        this.fallbackDataLoading();
    }
    
    fallbackDataLoading() {
        console.log('[Manager] Attempting fallback data loading...');
        
        const csvPath = 'dati-palermo-hub/palermo-hub.csv';
        
        fetch(csvPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(csvText => {
                console.log('[Manager] CSV loaded, processing...');
                
                if (window.Papa && window.Papa.parse) {
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
                        complete: (results) => {
                            this.processFallbackData(results.data);
                        },
                        error: (error) => {
                            console.error('[Manager] Papa Parse error:', error);
                            this.showDataError();
                        }
                    });
                } else {
                    console.error('[Manager] Papa Parse not available');
                    this.showDataError();
                }
            })
            .catch(error => {
                console.error('[Manager] Fallback data loading failed:', error);
                this.showDataError();
            });
    }
    
    processFallbackData(data) {
        console.log(`[Manager] Processing ${data.length} fallback records...`);
        
        const validData = data.filter(row => row.titolo && row.titolo.trim() !== '');
        
        if (validData.length === 0) {
            console.error('[Manager] No valid records found');
            this.showDataError();
            return;
        }
        
        // Imposta variabili globali
        window.allMaps = validData;
        window.filteredMaps = [...validData];
        
        console.log(`[Manager] Fallback data loaded: ${validData.length} maps`);
        
        // Inizializza componenti
        this.initializeDataDependentComponents();
        this.ensureDataDisplay();
    }
    
    initializeDataDependentComponents() {
        console.log('[Manager] Initializing data-dependent components...');
        
        try {
            // Popola filtri se la funzione esiste
            if (typeof window.populateFilters === 'function') {
                window.populateFilters();
            }
            
            // Applica filtri se la funzione esiste
            if (typeof window.applyFilters === 'function') {
                window.applyFilters();
            }
            
            // Update statistiche se la funzione esiste
            if (typeof window.updateStatistics === 'function') {
                window.updateStatistics();
            }
            
            // Update ultimo aggiornamento se la funzione esiste
            if (typeof window.updateLastUpdateTime === 'function') {
                window.updateLastUpdateTime();
            }
            
            // Inizializza ricerca intelligente se disponibile
            if (typeof window.initializeSmartSearch === 'function') {
                window.initializeSmartSearch();
            }
            
            // Inizializza slider se disponibile
            if (typeof window.initializeSlider === 'function') {
                window.initializeSlider();
            }
            
        } catch (error) {
            console.error('[Manager] Error initializing data-dependent components:', error);
        }
    }
    
    ensureDataDisplay() {
        console.log('[Manager] Ensuring data display...');
        
        const container = document.getElementById('maps-container');
        if (!container) {
            console.warn('[Manager] Maps container not found');
            return;
        }
        
        if (!window.allMaps || window.allMaps.length === 0) {
            container.innerHTML = '<div class="no-results">Nessun dato disponibile</div>';
            return;
        }
        
        // Usa funzione display originale se disponibile
        if (typeof window.displayMaps === 'function') {
            try {
                window.displayMaps();
                console.log('[Manager] Data displayed using original function');
                return;
            } catch (error) {
                console.error('[Manager] Error with original displayMaps:', error);
            }
        }
        
        // Fallback minimo
        this.basicDataDisplay();
    }
    
    basicDataDisplay() {
        console.log('[Manager] Using basic data display...');
        
        const container = document.getElementById('maps-container');
        if (!container || !window.filteredMaps) return;
        
        container.className = 'maps-grid';
        
        const mapsToShow = window.filteredMaps.slice(0, 36);
        
        container.innerHTML = mapsToShow.map((map) => {
            const title = this.sanitizeText(map.titolo || 'Senza titolo');
            const description = this.sanitizeText(map.descrizione || 'Nessuna descrizione');
            const url = this.sanitizeUrl(map.url || map.URL || '#');
            
            return `
                <div class="map-card" onclick="window.open('${url}', '_blank')" style="
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 1rem;
                    margin: 0.5rem;
                    cursor: pointer;
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">
                    <h3 style="margin: 0 0 0.5rem 0; color: #374151;">${title}</h3>
                    <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">${description.substring(0, 150)}${description.length > 150 ? '...' : ''}</p>
                </div>
            `;
        }).join('');
        
        console.log(`[Manager] Basic display: ${mapsToShow.length} maps shown`);
    }
    
    showDataError() {
        console.error('[Manager] Showing data error message');
        
        const container = document.getElementById('maps-container');
        if (container) {
            container.innerHTML = `
                <div style="
                    text-align: center;
                    padding: 3rem;
                    border: 2px solid #f87171;
                    border-radius: 12px;
                    background: #fef2f2;
                    margin: 2rem auto;
                    max-width: 600px;
                ">
                    <h3 style="color: #dc2626; margin-bottom: 1rem;">Errore Caricamento Dati</h3>
                    <p>Non è stato possibile caricare i dati delle mappe.</p>
                    <button onclick="window.location.reload()" style="
                        padding: 0.75rem 1.5rem;
                        border: none;
                        border-radius: 8px;
                        background: #dc2626;
                        color: white;
                        cursor: pointer;
                        font-weight: 600;
                        margin-top: 1rem;
                    ">
                        Ricarica Pagina
                    </button>
                </div>
            `;
        }
    }
    
    // =============================================
    // HELPER METHODS
    // =============================================
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    sanitizeText(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    sanitizeUrl(url) {
        if (!url || url === '#') return '#';
        try {
            const urlObj = new URL(url, window.location.origin);
            return urlObj.href;
        } catch (e) {
            console.warn('[Manager] Invalid URL:', url);
            return '#';
        }
    }
    
    updateHeaderUI() {
        const toggleTab = document.getElementById('header-toggle-tab');
        if (toggleTab) {
            toggleTab.classList.toggle('tab-active', this.state.headerOpen);
            const icon = toggleTab.querySelector('.tab-icon');
            if (icon) {
                icon.className = this.state.headerOpen ? 'fas fa-times tab-icon' : 'fas fa-bars tab-icon';
            }
        }
    }
    
    updateFooterUI() {
        const toggleTab = document.getElementById('footer-toggle-tab');
        if (toggleTab) {
            toggleTab.classList.toggle('tab-active', this.state.footerOpen);
        }
    }
    
    updateThemeUI() {
        const themeIcons = document.querySelectorAll('.theme-icon');
        const themeLabels = document.querySelectorAll('.theme-label');
        const logos = document.querySelectorAll('.ph-logo img');
        
        const isDark = this.themeSystem.current === 'dark';
        
        themeIcons.forEach(icon => {
            icon.textContent = isDark ? '☀️' : '🌙';
        });
        
        themeLabels.forEach(label => {
            label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        });
        
        logos.forEach(logo => {
            logo.src = isDark ? 'legend/pa_hub_new_white.png' : 'legend/pa_hub_new.png';
        });
    }
    
    calculateBodyPadding() {
        if (this.state.headerOpen) {
            const viewport = this.getCurrentViewport();
            let padding = 130; // Default desktop
            
            switch (viewport) {
                case 'mobile':
                    padding = 90;
                    break;
                case 'tablet':
                    padding = 100;
                    break;
            }
            
            this.bodyManager.setPadding(padding, `header open (${viewport})`);
        }
    }
    
    handleWindowResize() {
        const viewport = this.getCurrentViewport();
        document.body.setAttribute('data-viewport', viewport);
        
        if (this.state.headerOpen) {
            this.calculateBodyPadding();
        }
        
        // Chiudi mobile menu su desktop
        if (viewport !== 'mobile' && viewport !== 'tablet' && this.state.mobileMenuOpen) {
            this.closeMobileMenu();
        }
    }
    
    toggleMobileMenu() {
        this.state.mobileMenuOpen = !this.state.mobileMenuOpen;
        const nav = document.querySelector('.ph-nav');
        const toggle = document.querySelector('.ph-mobile-toggle');
        
        if (nav && toggle) {
            nav.classList.toggle('active', this.state.mobileMenuOpen);
            toggle.setAttribute('aria-expanded', this.state.mobileMenuOpen);
            toggle.setAttribute('aria-label', this.state.mobileMenuOpen ? 'Chiudi menu' : 'Apri menu');
        }
    }
    
    closeMobileMenu() {
        this.state.mobileMenuOpen = false;
        const nav = document.querySelector('.ph-nav');
        const toggle = document.querySelector('.ph-mobile-toggle');
        
        if (nav && toggle) {
            nav.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Apri menu');
        }
    }
    
    updateSearchClearButtons(value) {
        const clearButtons = [
            document.getElementById('search-clear-btn'),
            document.getElementById('modal-footer-search-clear')
        ];
        
        clearButtons.forEach(btn => {
            if (btn) {
                btn.classList.toggle('visible', value.length > 0);
            }
        });
    }
    
    renderBreadcrumbs(pageInfo, filters) {
        const breadcrumbsList = document.getElementById('ph-breadcrumbs-list');
        if (!breadcrumbsList) return;
        
        let html = '<li><a href="index.html" class="ph-breadcrumb-link">Home</a></li>';
        
        if (pageInfo.title && !pageInfo.isHome) {
            html += `<li><span class="ph-breadcrumb-current">${pageInfo.title}</span></li>`;
        }
        
        breadcrumbsList.innerHTML = html;
    }
    
    updateActiveFiltersDisplay(filters) {
        const activeFilters = document.getElementById('ph-active-filters');
        if (!activeFilters) return;
        
        if (filters.length === 0) {
            activeFilters.innerHTML = '';
            return;
        }
        
        let html = '';
        filters.forEach(filter => {
            html += `
                <button class="ph-filter-tag" onclick="window.palermoHub.breadcrumbsSystem.clearFilter('${filter.id}')" 
                        title="Rimuovi filtro: ${filter.fullValue || filter.value}">
                    ${filter.label}: ${filter.value}
                    <span class="ph-filter-remove">×</span>
                </button>
            `;
        });
        
        if (filters.length > 1) {
            html += `<span class="ph-filters-indicator">${filters.length} filtri attivi</span>`;
        }
        
        activeFilters.innerHTML = html;
    }
    
    observeFilters() {
        const debouncedUpdate = this.debounce(() => {
            this.breadcrumbsSystem.update();
        }, 150);
        
        // Observer per nuovi elementi
        const observer = new MutationObserver(() => {
            this.attachFilterListeners(debouncedUpdate);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Attach iniziale
        setTimeout(() => this.attachFilterListeners(debouncedUpdate), 100);
    }
    
    attachFilterListeners(updateCallback) {
        // Filtri select
        const filters = document.querySelectorAll('.filter-select');
        filters.forEach(filter => {
            if (!filter.dataset.phListenerAttached) {
                filter.addEventListener('change', updateCallback);
                filter.dataset.phListenerAttached = 'true';
            }
        });
        
        // Search input
        const searchInput = document.getElementById('smart-search-input');
        if (searchInput && !searchInput.dataset.phListenerAttached) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(updateCallback, 400);
            });
            searchInput.dataset.phListenerAttached = 'true';
        }
        
        // Clear buttons
        const clearButtons = document.querySelectorAll('[id$="-reset"], [class*="reset-filter"], #clear-filters');
        clearButtons.forEach(button => {
            if (!button.dataset.phListenerAttached) {
                button.addEventListener('click', () => {
                    setTimeout(updateCallback, 50);
                });
                button.dataset.phListenerAttached = 'true';
            }
        });
    }
    
    handleSwipeGesture(startY, endY) {
        const swipeThreshold = 100;
        const diff = startY - endY;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe up - chiudi footer se aperto
                if (this.state.footerOpen) {
                    this.modalCoordinator.closeFooter();
                }
            } else {
                // Swipe down - chiudi header se aperto
                if (this.state.headerOpen && this.getCurrentViewport() === 'mobile') {
                    this.modalCoordinator.closeHeader();
                }
            }
        }
    }
    
    cleanupUnusedElements() {
        // Rimuovi elementi temporanei non utilizzati
        const tempElements = document.querySelectorAll('[data-temp="true"]');
        tempElements.forEach(el => {
            if (!el.parentNode) el.remove();
        });
    }
    
    cleanupEventListeners() {
        // Rimuovi listener da elementi non più nel DOM
        this.config.eventListeners.forEach((listeners, key) => {
            this.config.eventListeners.set(key, 
                listeners.filter(l => document.contains(l.element))
            );
        });
    }
}

// =============================================
// INIZIALIZZAZIONE GLOBALE
// =============================================

// Inizializza il manager centralizzato
window.palermoHub = new PalermoHubManager();

// Export per compatibilità
window.PalermoHubManager = PalermoHubManager;

console.log('[PalermoHub] Central Manager loaded and ready');
