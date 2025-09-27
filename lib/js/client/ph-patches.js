/*!
 * PalermoHub - Patch per File Esistenti
 * Correzioni specifiche per home.js, ph-header.js, ph-footer.js
 * Copyright (c) 2025 Giovan Battista Vitrano (@gbvitrano)
 * Copyright (c) 2025 OpenDataSicilia (@opendatasicilia)
 */

/**
 * PATCH SYSTEM PER PALERMOHUB
 * Applica correzioni ai file esistenti senza riscriverli completamente
 */

class PalermoHubPatches {
    constructor() {
        this.patchesApplied = false;
        this.originalFunctions = new Map();
        this.init();
    }
    
    init() {
        console.log('[Patches] Initializing PalermoHub patches...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.applyPatches());
        } else {
            // Aspetta che i componenti originali siano caricati
            setTimeout(() => this.applyPatches(), 500);
        }
    }
    
    applyPatches() {
        if (this.patchesApplied) return;
        
        console.log('[Patches] Applying patches...');
        
        this.patchHomeJS();
        this.patchHeaderJS();
        this.patchFooterJS();
        this.patchMemoryLeaks();
        this.patchPaginationIssues();
        this.patchSearchSync();
        this.patchMobileIssues();
        
        this.patchesApplied = true;
        console.log('[Patches] All patches applied successfully');
    }
    
    // =============================================
    // PATCH HOME.JS
    // =============================================
    
    patchHomeJS() {
        console.log('[Patches] Patching home.js issues...');
        
        // Fix paginazione non sicura
        this.patchPaginationSafety();
        
        // Fix memory leaks
        this.patchAutoUpdateCleanup();
        
        // Fix display maps safety
        this.patchDisplayMapsSafety();
        
        // Fix date parsing issues
        this.patchDateParsing();
    }
    
    patchPaginationSafety() {
        // Backup funzione originale
        if (window.changePage && !this.originalFunctions.has('changePage')) {
            this.originalFunctions.set('changePage', window.changePage);
        }
        
        // Nuova implementazione sicura
        window.changePage = (direction) => {
            console.log(`[Patch] Safe changePage called: ${direction}`);
            
            // Controlla se il manager centralizzato è disponibile
            if (window.palermoHub && window.palermoHub.state) {
                // Delega al manager centralizzato se disponibile
                return;
            }
            
            // Implementazione di fallback sicura
            const currentPage = parseInt(document.getElementById('current-page')?.textContent) || 1;
            const totalPages = parseInt(document.getElementById('total-pages')?.textContent) || 1;
            
            const newPage = currentPage + direction;
            
            if (newPage < 1 || newPage > totalPages) {
                console.log('[Patch] Page change blocked - out of range');
                return;
            }
            
            // Previeni chiamate multiple rapide
            if (window.changePage._updating) {
                console.log('[Patch] Page change blocked - already updating');
                return;
            }
            
            window.changePage._updating = true;
            
            try {
                // Chiama la funzione originale se esistente
                const original = this.originalFunctions.get('changePage');
                if (original && typeof original === 'function') {
                    original.call(this, direction);
                }
            } catch (error) {
                console.error('[Patch] Error in changePage:', error);
            } finally {
                setTimeout(() => {
                    window.changePage._updating = false;
                }, 500);
            }
        };
    }
    
    patchAutoUpdateCleanup() {
        // Fix interval cleanup
        if (window.setupAutoUpdate && !this.originalFunctions.has('setupAutoUpdate')) {
            this.originalFunctions.set('setupAutoUpdate', window.setupAutoUpdate);
            
            window.setupAutoUpdate = () => {
                // Clear existing interval
                if (window.autoUpdateInterval) {
                    clearInterval(window.autoUpdateInterval);
                }
                
                window.autoUpdateInterval = setInterval(() => {
                    if (typeof window.loadMapsData === 'function') {
                        window.loadMapsData(true);
                    }
                }, 30 * 60 * 1000);
                
                // Registra nel manager centralizzato se disponibile
                if (window.palermoHub && window.palermoHub.config) {
                    window.palermoHub.config.intervals.add(window.autoUpdateInterval);
                }
            };
        }
    }
    
    patchDisplayMapsSafety() {
        if (window.displayMaps && !this.originalFunctions.has('displayMaps')) {
            this.originalFunctions.set('displayMaps', window.displayMaps);
            
            window.displayMaps = () => {
                try {
                    const original = this.originalFunctions.get('displayMaps');
                    if (original) {
                        original.call(this);
                    }
                } catch (error) {
                    console.error('[Patch] Error in displayMaps, attempting recovery:', error);
                    
                    // Fallback sicuro
                    const container = document.getElementById('maps-container');
                    if (container) {
                        container.innerHTML = '<div class="loading">⚠️ Errore nel caricamento. Riprova.</div>';
                    }
                }
            };
        }
    }
    
    patchDateParsing() {
        // Migliora la funzione parseDate se esiste
        if (window.parseDate && !this.originalFunctions.has('parseDate')) {
            this.originalFunctions.set('parseDate', window.parseDate);
            
            window.parseDate = (dateString) => {
                if (!dateString || typeof dateString !== 'string') {
                    return new Date(0);
                }
                
                try {
                    const original = this.originalFunctions.get('parseDate');
                    const result = original ? original.call(this, dateString) : new Date(dateString);
                    
                    // Verifica che il risultato sia valido
                    if (isNaN(result.getTime())) {
                        console.warn(`[Patch] Invalid date parsed: "${dateString}"`);
                        return new Date(0);
                    }
                    
                    return result;
                } catch (error) {
                    console.warn(`[Patch] Date parsing error for "${dateString}":`, error);
                    return new Date(0);
                }
            };
        }
    }
    
    // =============================================
    // PATCH HEADER.JS
    // =============================================
    
    patchHeaderJS() {
        console.log('[Patches] Patching header.js issues...');
        
        // Fix conflitti modal
        this.patchHeaderModalConflicts();
        
        // Fix mobile menu issues
        this.patchMobileMenuSafety();
        
        // Fix breadcrumbs conflicts
        this.patchBreadcrumbsConflicts();
    }
    
    patchHeaderModalConflicts() {
        // Patch per prevenire conflitti con footer
        ['openModalHeader', 'closeModalHeader', 'toggleModalHeader'].forEach(funcName => {
            if (window[funcName] && !this.originalFunctions.has(funcName)) {
                this.originalFunctions.set(funcName, window[funcName]);
                
                window[funcName] = (...args) => {
                    // Delega al manager centralizzato se disponibile
                    if (window.palermoHub && window.palermoHub.modalCoordinator) {
                        const action = funcName.replace('Modal', '').replace('Header', '');
                        if (window.palermoHub.modalCoordinator[action + 'Header']) {
                            return window.palermoHub.modalCoordinator[action + 'Header']();
                        }
                    }
                    
                    // Fallback alla funzione originale
                    const original = this.originalFunctions.get(funcName);
                    if (original) {
                        return original.apply(this, args);
                    }
                };
            }
        });
    }
    
    patchMobileMenuSafety() {
        if (window.toggleMobileMenu && !this.originalFunctions.has('toggleMobileMenu')) {
            this.originalFunctions.set('toggleMobileMenu', window.toggleMobileMenu);
            
            window.toggleMobileMenu = () => {
                // Delega al manager centralizzato se disponibile
                if (window.palermoHub && window.palermoHub.toggleMobileMenu) {
                    return window.palermoHub.toggleMobileMenu();
                }
                
                // Implementazione di fallback sicura
                const nav = document.querySelector('.ph-nav');
                const toggle = document.querySelector('.ph-mobile-toggle');
                
                if (!nav || !toggle) return;
                
                const isOpen = nav.classList.contains('active');
                
                if (isOpen) {
                    nav.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                } else {
                    nav.classList.add('active');
                    toggle.setAttribute('aria-expanded', 'true');
                }
            };
        }
    }
    
    patchBreadcrumbsConflicts() {
        // Unifica i sistemi breadcrumbs
        if (window.updatePalermoHubBreadcrumbs && !this.originalFunctions.has('updatePalermoHubBreadcrumbs')) {
            this.originalFunctions.set('updatePalermoHubBreadcrumbs', window.updatePalermoHubBreadcrumbs);
            
            window.updatePalermoHubBreadcrumbs = () => {
                // Delega al manager centralizzato se disponibile
                if (window.palermoHub && window.palermoHub.breadcrumbsSystem) {
                    return window.palermoHub.breadcrumbsSystem.update();
                }
                
                // Fallback
                const original = this.originalFunctions.get('updatePalermoHubBreadcrumbs');
                if (original) {
                    return original.call(this);
                }
            };
        }
    }
    
    // =============================================
    // PATCH FOOTER.JS
    // =============================================
    
    patchFooterJS() {
        console.log('[Patches] Patching footer.js issues...');
        
        // Fix conflitti modal
        this.patchFooterModalConflicts();
        
        // Fix search synchronization
        this.patchFooterSearchSync();
        
        // Fix privacy popup conflicts
        this.patchPrivacyPopupConflicts();
    }
    
    patchFooterModalConflicts() {
        ['openModalFooter', 'closeModalFooter', 'toggleModalFooter'].forEach(funcName => {
            if (window[funcName] && !this.originalFunctions.has(funcName)) {
                this.originalFunctions.set(funcName, window[funcName]);
                
                window[funcName] = (...args) => {
                    // Delega al manager centralizzato se disponibile
                    if (window.palermoHub && window.palermoHub.modalCoordinator) {
                        const action = funcName.replace('Modal', '').replace('Footer', '');
                        if (window.palermoHub.modalCoordinator[action + 'Footer']) {
                            return window.palermoHub.modalCoordinator[action + 'Footer']();
                        }
                    }
                    
                    // Fallback
                    const original = this.originalFunctions.get(funcName);
                    if (original) {
                        return original.apply(this, args);
                    }
                };
            }
        });
    }
    
    patchFooterSearchSync() {
        // Migliora la sincronizzazione ricerca
        if (window.handleFooterSearchInput && !this.originalFunctions.has('handleFooterSearchInput')) {
            this.originalFunctions.set('handleFooterSearchInput', window.handleFooterSearchInput);
            
            window.handleFooterSearchInput = (event, pageType) => {
                // Delega al manager centralizzato se disponibile
                if (window.palermoHub && window.palermoHub.searchSystem) {
                    // Il manager centralizzato gestisce già la sincronizzazione
                    return;
                }
                
                // Fallback con miglioramenti
                try {
                    const original = this.originalFunctions.get('handleFooterSearchInput');
                    if (original) {
                        original.call(this, event, pageType);
                    }
                } catch (error) {
                    console.error('[Patch] Error in footer search input:', error);
                }
            };
        }
    }
    
    patchPrivacyPopupConflicts() {
        // Fix z-index privacy popup
        if (window.showPrivacyPopup && !this.originalFunctions.has('showPrivacyPopup')) {
            this.originalFunctions.set('showPrivacyPopup', window.showPrivacyPopup);
            
            window.showPrivacyPopup = () => {
                const popup = document.getElementById('privacy-popup');
                if (popup) {
                    // Applica z-index alto per evitare conflitti
                    if (window.palermoHub && window.palermoHub.zIndexManager) {
                        window.palermoHub.zIndexManager.assign(popup, 'toast', 'privacy-popup');
                    } else {
                        popup.style.zIndex = '10000';
                    }
                }
                
                const original = this.originalFunctions.get('showPrivacyPopup');
                if (original) {
                    original.call(this);
                }
            };
        }
    }
    
    // =============================================
    // PATCH MEMORY LEAKS
    // =============================================
    
    patchMemoryLeaks() {
        console.log('[Patches] Patching memory leaks...');
        
        // Patch global intervals
        this.patchGlobalIntervals();
        
        // Patch event listeners
        this.patchEventListeners();
        
        // Patch window beforeunload
        this.patchWindowUnload();
    }
    
    patchGlobalIntervals() {
        // Override setTimeout e setInterval per tracking migliore
        if (!window._originalSetTimeout) {
            window._originalSetTimeout = window.setTimeout;
            window._originalSetInterval = window.setInterval;
            window._originalClearTimeout = window.clearTimeout;
            window._originalClearInterval = window.clearInterval;
            
            const activeTimeouts = new Set();
            const activeIntervals = new Set();
            
            window.setTimeout = function(callback, delay, ...args) {
                const id = window._originalSetTimeout.call(this, (...callbackArgs) => {
                    activeTimeouts.delete(id);
                    return callback.apply(this, callbackArgs);
                }, delay, ...args);
                activeTimeouts.add(id);
                return id;
            };
            
            window.setInterval = function(callback, delay, ...args) {
                const id = window._originalSetInterval.call(this, callback, delay, ...args);
                activeIntervals.add(id);
                return id;
            };
            
            window.clearTimeout = function(id) {
                activeTimeouts.delete(id);
                return window._originalClearTimeout.call(this, id);
            };
            
            window.clearInterval = function(id) {
                activeIntervals.delete(id);
                return window._originalClearInterval.call(this, id);
            };
            
            // Cleanup globale
            window._cleanupAllTimers = () => {
                console.log(`[Patch] Cleaning up ${activeTimeouts.size} timeouts and ${activeIntervals.size} intervals`);
                activeTimeouts.forEach(id => window.clearTimeout(id));
                activeIntervals.forEach(id => window.clearInterval(id));
            };
        }
    }
    
    patchEventListeners() {
        // Migliora il tracking degli event listeners
        if (!window._originalAddEventListener) {
            window._originalAddEventListener = EventTarget.prototype.addEventListener;
            window._originalRemoveEventListener = EventTarget.prototype.removeEventListener;
            
            const eventListenerRegistry = new WeakMap();
            
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (!eventListenerRegistry.has(this)) {
                    eventListenerRegistry.set(this, new Map());
                }
                const listeners = eventListenerRegistry.get(this);
                if (!listeners.has(type)) {
                    listeners.set(type, new Set());
                }
                listeners.get(type).add(listener);
                
                return window._originalAddEventListener.call(this, type, listener, options);
            };
            
            EventTarget.prototype.removeEventListener = function(type, listener, options) {
                const listeners = eventListenerRegistry.get(this);
                if (listeners && listeners.has(type)) {
                    listeners.get(type).delete(listener);
                }
                
                return window._originalRemoveEventListener.call(this, type, listener, options);
            };
        }
    }
    
    patchWindowUnload() {
        // Migliora il cleanup al beforeunload
        if (!window._palermoHubUnloadPatched) {
            const originalUnloadHandlers = [];
            
            // Cattura handlers esistenti
            const existingHandler = window.onbeforeunload;
            if (existingHandler) {
                originalUnloadHandlers.push(existingHandler);
            }
            
            window.addEventListener('beforeunload', () => {
                console.log('[Patch] Enhanced cleanup on beforeunload');
                
                // Cleanup timers
                if (window._cleanupAllTimers) {
                    window._cleanupAllTimers();
                }
                
                // Cleanup autoupdate
                if (window.autoUpdateInterval) {
                    clearInterval(window.autoUpdateInterval);
                }
                
                // Cleanup slider
                if (window.sliderInterval) {
                    clearInterval(window.sliderInterval);
                }
                
                // Reset body state
                document.body.style.overflow = '';
                document.body.style.paddingTop = '';
                document.body.className = '';
                
                // Chiama handler originali
                originalUnloadHandlers.forEach(handler => {
                    try {
                        handler();
                    } catch (e) {
                        console.warn('[Patch] Error in original unload handler:', e);
                    }
                });
            });
            
            window._palermoHubUnloadPatched = true;
        }
    }
    
    // =============================================
    // PATCH PAGINATION ISSUES
    // =============================================
    
    patchPaginationIssues() {
        console.log('[Patches] Patching pagination issues...');
        
        // Fix setItemsPerPage
        if (window.setItemsPerPage && !this.originalFunctions.has('setItemsPerPage')) {
            this.originalFunctions.set('setItemsPerPage', window.setItemsPerPage);
            
            window.setItemsPerPage = (value) => {
                const newValue = parseInt(value);
                if (isNaN(newValue) || newValue <= 0) {
                    console.warn('[Patch] Invalid items per page value:', value);
                    return;
                }
                
                console.log(`[Patch] Safe setItemsPerPage: ${newValue}`);
                
                try {
                    const original = this.originalFunctions.get('setItemsPerPage');
                    if (original) {
                        original.call(this, newValue);
                    }
                } catch (error) {
                    console.error('[Patch] Error in setItemsPerPage:', error);
                }
            };
        }
        
        // Fix setViewMode
        if (window.setViewMode && !this.originalFunctions.has('setViewMode')) {
            this.originalFunctions.set('setViewMode', window.setViewMode);
            
            window.setViewMode = (mode) => {
                if (mode !== 'infinite' && mode !== 'pagination') {
                    console.warn('[Patch] Invalid view mode:', mode);
                    return;
                }
                
                console.log(`[Patch] Safe setViewMode: ${mode}`);
                
                try {
                    const original = this.originalFunctions.get('setViewMode');
                    if (original) {
                        original.call(this, mode);
                    }
                } catch (error) {
                    console.error('[Patch] Error in setViewMode:', error);
                }
            };
        }
    }
    
    // =============================================
    // PATCH SEARCH SYNC
    // =============================================
    
    patchSearchSync() {
        console.log('[Patches] Patching search synchronization...');
        
        // Fix syncFooterSearch se esiste
        if (window.syncFooterSearch && !this.originalFunctions.has('syncFooterSearch')) {
            this.originalFunctions.set('syncFooterSearch', window.syncFooterSearch);
            
            window.syncFooterSearch = (query, source = 'main') => {
                if (window.palermoHub && window.palermoHub.searchSystem) {
                    // Il manager centralizzato gestisce già la sincronizzazione
                    return;
                }
                
                try {
                    const original = this.originalFunctions.get('syncFooterSearch');
                    if (original) {
                        original.call(this, query, source);
                    }
                } catch (error) {
                    console.error('[Patch] Error in syncFooterSearch:', error);
                }
            };
        }
        
        // Fix clearSmartSearch
        if (window.clearSmartSearch && !this.originalFunctions.has('clearSmartSearch')) {
            this.originalFunctions.set('clearSmartSearch', window.clearSmartSearch);
            
            window.clearSmartSearch = () => {
                if (window.palermoHub && window.palermoHub.searchSystem) {
                    return window.palermoHub.searchSystem.clear();
                }
                
                try {
                    const original = this.originalFunctions.get('clearSmartSearch');
                    if (original) {
                        original.call(this);
                    }
                } catch (error) {
                    console.error('[Patch] Error in clearSmartSearch:', error);
                }
            };
        }
    }
    
    // =============================================
    // PATCH MOBILE ISSUES
    // =============================================
    
    patchMobileIssues() {
        console.log('[Patches] Patching mobile issues...');
        
        // Fix touch events conflicts
        this.patchTouchEvents();
        
        // Fix viewport issues
        this.patchViewportIssues();
        
        // Fix mobile filters
        this.patchMobileFilters();
    }
    
    patchTouchEvents() {
        // Previeni conflitti touch events
        if (!window._touchEventsPatchApplied) {
            let isHandlingTouch = false;
            
            document.addEventListener('touchstart', () => {
                isHandlingTouch = true;
                setTimeout(() => { isHandlingTouch = false; }, 500);
            }, { passive: true });
            
            // Patch per prevenire eventi multipli
            const originalTouchHandlers = [];
            
            ['touchstart', 'touchmove', 'touchend'].forEach(eventType => {
                document.addEventListener(eventType, (e) => {
                    if (isHandlingTouch && e.type === 'touchstart') {
                        // Previeni handler multipli per lo stesso touch
                        return;
                    }
                }, { passive: true, capture: true });
            });
            
            window._touchEventsPatchApplied = true;
        }
    }
    
    patchViewportIssues() {
        // Fix viewport height su mobile
        if (!window._viewportPatchApplied) {
            const setViewportHeight = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };
            
            setViewportHeight();
            
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(setViewportHeight, 250);
            });
            
            window.addEventListener('orientationchange', () => {
                setTimeout(setViewportHeight, 500);
            });
            
            window._viewportPatchApplied = true;
        }
    }
    
    patchMobileFilters() {
        // Fix mobile filters se setupMobileFilters esiste
        if (window.setupMobileFilters && !this.originalFunctions.has('setupMobileFilters')) {
            this.originalFunctions.set('setupMobileFilters', window.setupMobileFilters);
            
            window.setupMobileFilters = () => {
                if (window.palermoHub && window.palermoHub.mobileManager) {
                    // Il manager centralizzato gestisce già i mobile filters
                    return;
                }
                
                try {
                    const original = this.originalFunctions.get('setupMobileFilters');
                    if (original) {
                        original.call(this);
                    }
                } catch (error) {
                    console.error('[Patch] Error in setupMobileFilters:', error);
                }
            };
        }
    }
    
    // =============================================
    // UTILITY METHODS
    // =============================================
    
    restoreOriginalFunction(functionName) {
        if (this.originalFunctions.has(functionName)) {
            window[functionName] = this.originalFunctions.get(functionName);
            this.originalFunctions.delete(functionName);
            console.log(`[Patches] Restored original function: ${functionName}`);
        }
    }
    
    restoreAllFunctions() {
        this.originalFunctions.forEach((originalFunc, functionName) => {
            window[functionName] = originalFunc;
        });
        this.originalFunctions.clear();
        console.log('[Patches] All original functions restored');
    }
    
    getStatus() {
        return {
            applied: this.patchesApplied,
            patchedFunctions: Array.from(this.originalFunctions.keys()),
            timestamp: new Date().toISOString()
        };
    }
}

// =============================================
// INIZIALIZZAZIONE PATCHES
// =============================================

// Inizializza il sistema di patch
window.palermoHubPatches = new PalermoHubPatches();

// Export per debug e controllo
window.PalermoHubPatches = PalermoHubPatches;

console.log('[Patches] PalermoHub patches system loaded');
