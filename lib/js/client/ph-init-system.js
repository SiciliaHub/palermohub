/*!
 * PalermoHub - Sistema di Inizializzazione Completo
 * Orchestrazione finale e coordinamento di tutti i componenti
 * Copyright (c) 2025 Giovan Battista Vitrano (@gbvitrano)
 * Copyright (c) 2025 OpenDataSicilia (@opendatasicilia)
 */

/**
 * SISTEMA DI INIZIALIZZAZIONE PALERMOHUB
 * Coordina il caricamento e l'inizializzazione di tutti i componenti
 */

class PalermoHubInitializer {
    constructor() {
        this.loadOrder = [
            'css',
            'manager', 
            'patches',
            'components',
            'validation'
        ];
        
        this.loadedComponents = new Set();
        this.failedComponents = new Set();
        this.initStartTime = Date.now();
        
        this.config = {
            debug: this.getDebugMode(),
            performance: true,
            retryAttempts: 3,
            timeoutMs: 10000,
            cssFiles: [
                'lib/css/ph-css.css', // CSS principale esistente
                'lib/css/ph-unified.css' // CSS unificato nuovo
            ],
            jsFiles: [
                'js/ph-central-manager.js',
                'js/ph-patches.js'
            ]
        };
        
        this.init();
    }
    
    // =============================================
    // INIZIALIZZAZIONE PRINCIPALE
    // =============================================
    
    init() {
        console.log('[PH-Init] Starting PalermoHub initialization...');
        
        if (this.config.debug) {
            this.enableDebugMode();
        }
        
        if (this.config.performance) {
            this.startPerformanceMonitoring();
        }
        
        this.createLoadingIndicator();
        this.startInitSequence();
    }
    
    async startInitSequence() {
        try {
            for (const phase of this.loadOrder) {
                await this.executePhase(phase);
            }
            
            this.onInitComplete();
            
        } catch (error) {
            this.onInitError(error);
        }
    }
    
    async executePhase(phase) {
        console.log(`[PH-Init] Executing phase: ${phase}`);
        
        switch (phase) {
            case 'css':
                await this.loadCSS();
                break;
            case 'manager':
                await this.loadCentralManager();
                break;
            case 'patches':
                await this.loadPatches();
                break;
            case 'components':
                await this.initializeComponents();
                break;
            case 'validation':
                await this.validateSystem();
                break;
        }
        
        this.loadedComponents.add(phase);
        this.updateLoadingProgress();
    }
    
    // =============================================
    // CARICAMENTO CSS
    // =============================================
    
    async loadCSS() {
        console.log('[PH-Init] Loading CSS files...');
        
        const promises = this.config.cssFiles.map(file => this.loadStylesheet(file));
        
        try {
            await Promise.allSettled(promises);
            
            // Verifica che almeno un CSS sia caricato
            const loaded = promises.filter(p => p.status === 'fulfilled');
            if (loaded.length === 0) {
                throw new Error('No CSS files could be loaded');
            }
            
            // Applica CSS fixes immediati
            this.applyCSSFixes();
            
        } catch (error) {
            console.warn('[PH-Init] CSS loading issues:', error);
            // Continua comunque - CSS non è critico per il funzionamento
        }
    }
    
    loadStylesheet(href) {
        return new Promise((resolve, reject) => {
            // Controlla se già esiste
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            
            link.onload = () => {
                console.log(`[PH-Init] CSS loaded: ${href}`);
                resolve();
            };
            
            link.onerror = () => {
                console.warn(`[PH-Init] CSS failed: ${href}`);
                reject(new Error(`Failed to load CSS: ${href}`));
            };
            
            document.head.appendChild(link);
            
            // Timeout safety
            setTimeout(() => {
                reject(new Error(`CSS load timeout: ${href}`));
            }, this.config.timeoutMs);
        });
    }
    
    applyCSSFixes() {
        // Fix immediati per CSS conflicts
        const style = document.createElement('style');
        style.id = 'ph-init-fixes';
        style.textContent = `
            /* Fix immediati z-index */
            .header-toggle-tab { z-index: 9600 !important; }
            .footer-toggle-tab { z-index: 9700 !important; }
            .modal-header { z-index: 9600 !important; }
            .modal-footer { z-index: 9700 !important; }
            .privacy-popup { z-index: 9800 !important; }
            .share-popup { z-index: 9800 !important; }
            
            /* Fix body transitions */
            body {
                transition: padding-top 0.3s ease, overflow 0.1s ease !important;
            }
            
            /* Loading indicator */
            .ph-loading-indicator {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                background: rgba(255, 255, 255, 0.95);
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            
            [data-theme="dark"] .ph-loading-indicator {
                background: rgba(31, 41, 55, 0.95);
                color: #f9fafb;
            }
            
            .ph-loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #e5e7eb;
                border-top: 4px solid #ff9900;
                border-radius: 50%;
                animation: ph-spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            
            @keyframes ph-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .ph-loading-text {
                color: #6b7280;
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
            }
            
            .ph-loading-progress {
                width: 200px;
                height: 4px;
                background: #e5e7eb;
                border-radius: 2px;
                overflow: hidden;
                margin: 1rem auto 0;
            }
            
            .ph-loading-bar {
                height: 100%;
                background: linear-gradient(90deg, #ff9900, #ff7700);
                width: 0%;
                transition: width 0.3s ease;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // =============================================
    // CARICAMENTO COMPONENTI JAVASCRIPT
    // =============================================
    
    async loadCentralManager() {
        console.log('[PH-Init] Loading Central Manager...');
        
        // Se il manager è già presente, skip
        if (window.palermoHub && window.palermoHub instanceof Object) {
            console.log('[PH-Init] Central Manager already present');
            return;
        }
        
        try {
            // Carica il manager se non è inline
            if (!window.PalermoHubManager) {
                await this.loadScript('js/ph-central-manager.js');
            }
            
            // Verifica che sia stato caricato correttamente
            if (!window.palermoHub || !window.PalermoHubManager) {
                throw new Error('Central Manager failed to initialize');
            }
            
            // Attendi che il manager sia completamente inizializzato
            await this.waitForManager();
            
        } catch (error) {
            console.error('[PH-Init] Failed to load Central Manager:', error);
            throw error;
        }
    }
    
    async loadPatches() {
        console.log('[PH-Init] Loading Patches System...');
        
        try {
            // Carica il sistema di patch se non è inline  
            if (!window.palermoHubPatches && !window.PalermoHubPatches) {
                await this.loadScript('js/ph-patches.js');
            }
            
            // Verifica che le patch siano state applicate
            if (window.palermoHubPatches) {
                const status = window.palermoHubPatches.getStatus();
                if (!status.applied) {
                    console.warn('[PH-Init] Patches not applied, retrying...');
                    await this.delay(500);
                    window.palermoHubPatches.applyPatches();
                }
            }
            
        } catch (error) {
            console.warn('[PH-Init] Patches loading issues:', error);
            // Le patch non sono critiche, continua
        }
    }
    
    async initializeComponents() {
        console.log('[PH-Init] Initializing existing components...');
        
        // Inizializza componenti esistenti in ordine sicuro
        const initSequence = [
            { name: 'home', init: () => this.initHomeComponent() },
            { name: 'header', init: () => this.initHeaderComponent() },
            { name: 'footer', init: () => this.initFooterComponent() },
            { name: 'breadcrumbs', init: () => this.initBreadcrumbs() },
            { name: 'search', init: () => this.initSearchSystem() },
            { name: 'theme', init: () => this.initThemeSystem() }
        ];
        
        for (const component of initSequence) {
            try {
                await component.init();
                console.log(`[PH-Init] ${component.name} initialized`);
            } catch (error) {
                console.warn(`[PH-Init] ${component.name} initialization issues:`, error);
                this.failedComponents.add(component.name);
            }
        }
    }
    
    async validateSystem() {
        console.log('[PH-Init] Validating system integrity...');
        
        const validations = [
            { name: 'Manager', test: () => window.palermoHub && typeof window.palermoHub.state === 'object' },
            { name: 'Z-Index', test: () => this.validateZIndex() },
            { name: 'Modal System', test: () => this.validateModals() },
            { name: 'Responsive', test: () => this.validateResponsive() },
            { name: 'Event Listeners', test: () => this.validateEventListeners() },
            { name: 'Memory Management', test: () => this.validateMemoryManagement() }
        ];
        
        const results = [];
        
        for (const validation of validations) {
            try {
                const result = validation.test();
                results.push({ name: validation.name, passed: result, error: null });
                
                if (!result) {
                    console.warn(`[PH-Init] Validation failed: ${validation.name}`);
                }
            } catch (error) {
                results.push({ name: validation.name, passed: false, error: error.message });
                console.error(`[PH-Init] Validation error in ${validation.name}:`, error);
            }
        }
        
        this.validationResults = results;
        
        const failedValidations = results.filter(r => !r.passed);
        if (failedValidations.length > 0) {
            console.warn(`[PH-Init] ${failedValidations.length} validations failed`);
        }
    }
    
    // =============================================
    // INIZIALIZZAZIONE COMPONENTI SPECIFICI
    // =============================================
    
    async initHomeComponent() {
        console.log('[PH-Init] Initializing home component...');
        
        // Verifica che le funzioni home esistano
        const homeFunctions = [
            'loadMapsData',
            'displayMaps', 
            'applyFilters',
            'changePage'
        ];
        
        for (const func of homeFunctions) {
            if (typeof window[func] !== 'function') {
                console.warn(`[PH-Init] Home function missing: ${func}`);
            }
        }
        
        // PRIORITÀ ASSOLUTA: Caricamento dati
        if (this.isHomePage()) {
            console.log('[PH-Init] Home page detected, prioritizing data loading...');
            
            // Se i dati sono già caricati, non interferire
            if (window.allMaps && window.allMaps.length > 0) {
                console.log(`[PH-Init] Data already present: ${window.allMaps.length} maps`);
                return;
            }
            
            // Carica dati immediatamente usando funzione originale
            if (typeof window.loadMapsData === 'function') {
                console.log('[PH-Init] Calling original loadMapsData immediately...');
                
                try {
                    // Chiamata immediata senza delay
                    window.loadMapsData();
                    
                    // Monitora il caricamento
                    this.monitorDataLoading();
                    
                } catch (error) {
                    console.error('[PH-Init] Error calling loadMapsData:', error);
                }
            } else {
                console.error('[PH-Init] loadMapsData function not found!');
            }
        }
    }
    
    monitorDataLoading() {
        console.log('[PH-Init] Monitoring data loading...');
        
        let attempts = 0;
        const maxAttempts = 20; // 10 secondi
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.allMaps && window.allMaps.length > 0) {
                console.log(`[PH-Init] ✅ Data loading successful: ${window.allMaps.length} maps loaded`);
                clearInterval(checkInterval);
                
                // Dispatch evento di successo
                document.dispatchEvent(new CustomEvent('palermoHubDataLoaded', {
                    detail: { totalMaps: window.allMaps.length }
                }));
                
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error('[PH-Init] ❌ Data loading timeout after 10 seconds');
                clearInterval(checkInterval);
                
                // Tenta caricamento fallback se il manager è disponibile
                if (window.palermoHub && window.palermoHub.fallbackDataLoading) {
                    console.log('[PH-Init] Attempting fallback data loading...');
                    window.palermoHub.fallbackDataLoading();
                } else {
                    this.showDataLoadingFailure();
                }
                
                return;
            }
            
            console.log(`[PH-Init] Waiting for data... attempt ${attempts}/${maxAttempts}`);
        }, 500);
    }
    
    showDataLoadingFailure() {
        const container = document.getElementById('maps-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; border: 2px solid #f87171; border-radius: 8px; background: #fef2f2; margin: 2rem auto; max-width: 500px;">
                    <h3 style="color: #dc2626;">⚠️ Errore Caricamento Dati</h3>
                    <p>I dati delle mappe non sono stati caricati.</p>
                    <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem;">
                        Ricarica Pagina
                    </button>
                    <details style="margin-top: 1rem; text-align: left;">
                        <summary>Debug Info</summary>
                        <p>allMaps: ${window.allMaps ? window.allMaps.length : 'undefined'}</p>
                        <p>loadMapsData: ${typeof window.loadMapsData}</p>
                        <p>Papa Parse: ${typeof window.Papa}</p>
                    </details>
                </div>
            `;
        }
    }
    
    async initHeaderComponent() {
        // Verifica esistenza elementi header
        const headerEl = document.getElementById('modal-header');
        const toggleEl = document.getElementById('header-toggle-tab');
        
        if (!headerEl || !toggleEl) {
            console.warn('[PH-Init] Header elements missing');
            return;
        }
        
        // Assicura stato iniziale corretto
        if (window.palermoHub && window.palermoHub.modalCoordinator) {
            // Il manager centralizzato gestisce lo stato
            window.palermoHub.modalCoordinator.openHeader();
        } else {
            // Fallback per compatibilità
            if (typeof window.openModalHeader === 'function') {
                window.openModalHeader();
            }
        }
    }
    
    async initFooterComponent() {
        // Verifica esistenza elementi footer
        const footerEl = document.getElementById('modal-footer');
        const toggleEl = document.getElementById('footer-toggle-tab');
        
        if (!footerEl || !toggleEl) {
            console.warn('[PH-Init] Footer elements missing');
            return;
        }
        
        // Assicura che footer sia chiuso inizialmente
        if (window.palermoHub && window.palermoHub.modalCoordinator) {
            window.palermoHub.modalCoordinator.closeFooter();
        } else {
            if (typeof window.closeModalFooter === 'function') {
                window.closeModalFooter();
            }
        }
    }
    
    async initBreadcrumbs() {
        // Sincronizza i sistemi breadcrumbs
        if (window.palermoHub && window.palermoHub.breadcrumbsSystem) {
            await this.delay(100);
            window.palermoHub.breadcrumbsSystem.update();
        } else if (typeof window.updatePalermoHubBreadcrumbs === 'function') {
            await this.delay(100);
            window.updatePalermoHubBreadcrumbs();
        }
    }
    
    async initSearchSystem() {
        // Verifica sincronizzazione search
        if (window.palermoHub && window.palermoHub.searchSystem) {
            // Il manager centralizzato gestisce la sincronizzazione
            return;
        }
        
        // Fallback per sincronizzazione manuale
        const mainInput = document.getElementById('smart-search-input');
        const footerInput = document.getElementById('modal-footer-search-input');
        
        if (mainInput && footerInput) {
            // Setup sincronizzazione basilare
            this.setupBasicSearchSync(mainInput, footerInput);
        }
    }
    
    async initThemeSystem() {
        // Inizializza tema
        if (window.palermoHub && window.palermoHub.themeSystem) {
            // Il manager centralizzato gestisce il tema
            return;
        }
        
        // Fallback per gestione tema basilare
        const savedTheme = localStorage.getItem('palermohub-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const toggles = document.querySelectorAll('#theme-toggle-checkbox');
        toggles.forEach(toggle => {
            toggle.checked = savedTheme === 'dark';
        });
    }
    
    // =============================================
    // VALIDAZIONI SISTEMA
    // =============================================
    
    validateZIndex() {
        const elements = [
            { el: document.getElementById('modal-header'), expectedZ: 9600 },
            { el: document.getElementById('modal-footer'), expectedZ: 9700 },
            { el: document.getElementById('header-toggle-tab'), expectedZ: 9600 },
            { el: document.getElementById('footer-toggle-tab'), expectedZ: 9700 }
        ];
        
        for (const { el, expectedZ } of elements) {
            if (el) {
                const computedZ = parseInt(window.getComputedStyle(el).zIndex);
                if (computedZ !== expectedZ) {
                    console.warn(`[PH-Init] Z-index mismatch for ${el.id}: ${computedZ} !== ${expectedZ}`);
                    return false;
                }
            }
        }
        
        return true;
    }
    
    validateModals() {
        const headerEl = document.getElementById('modal-header');
        const footerEl = document.getElementById('modal-footer');
        
        if (!headerEl || !footerEl) return false;
        
        // Verifica che i modal non siano aperti contemporaneamente
        const headerOpen = headerEl.classList.contains('modal-header-open');
        const footerOpen = footerEl.classList.contains('modal-footer-open');
        
        if (headerOpen && footerOpen) {
            console.warn('[PH-Init] Both modals are open simultaneously');
            return false;
        }
        
        return true;
    }
    
    validateResponsive() {
        // Verifica che breakpoints CSS siano applicati
        const testEl = document.createElement('div');
        testEl.style.cssText = 'width: 480px; display: none;';
        document.body.appendChild(testEl);
        
        const isValid = window.getComputedStyle(testEl).width === '480px';
        
        document.body.removeChild(testEl);
        return isValid;
    }
    
    validateEventListeners() {
        // Verifica che event listeners chiave esistano
        const criticalElements = [
            'header-toggle-tab',
            'footer-toggle-tab', 
            'modal-header-close-tab',
            'modal-footer-close-tab'
        ];
        
        for (const id of criticalElements) {
            const el = document.getElementById(id);
            if (el && !el.onclick && !this.hasEventListeners(el)) {
                console.warn(`[PH-Init] Missing event listeners for ${id}`);
                return false;
            }
        }
        
        return true;
    }
    
    validateMemoryManagement() {
        // Verifica cleanup systems
        if (window.palermoHub && window.palermoHub.config) {
            const { timers, intervals, eventListeners } = window.palermoHub.config;
            
            // Verifica che esistano sistemi di tracking
            return timers instanceof Set && 
                   intervals instanceof Set && 
                   eventListeners instanceof Map;
        }
        
        // Verifica fallback systems
        return typeof window._cleanupAllTimers === 'function';
    }
    
    // =============================================
    // UTILITY E HELPER
    // =============================================
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Controlla se già caricato
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            
            document.head.appendChild(script);
            
            setTimeout(() => {
                reject(new Error(`Script load timeout: ${src}`));
            }, this.config.timeoutMs);
        });
    }
    
    async waitForManager() {
        const maxWait = 5000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (window.palermoHub && 
                window.palermoHub.state && 
                typeof window.palermoHub.state === 'object') {
                return;
            }
            await this.delay(100);
        }
        
        throw new Error('Central Manager initialization timeout');
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getDebugMode() {
        return new URLSearchParams(window.location.search).has('debug') ||
               localStorage.getItem('ph-debug') === 'true' ||
               window.location.hostname === 'localhost';
    }
    
    isHomePage() {
        const path = window.location.pathname;
        return path === '/' || path.endsWith('/index.html') || path === '';
    }
    
    hasEventListeners(element) {
        // Verifica approssimativa se l'elemento ha event listeners
        return element._events || 
               element.eventListenerList || 
               Object.keys(element).some(key => key.startsWith('on'));
    }
    
    setupBasicSearchSync(mainInput, footerInput) {
        mainInput.addEventListener('input', (e) => {
            if (footerInput.value !== e.target.value) {
                footerInput.value = e.target.value;
            }
        });
        
        footerInput.addEventListener('input', (e) => {
            if (mainInput.value !== e.target.value) {
                mainInput.value = e.target.value;
            }
        });
    }
    
    // =============================================
    // UI E FEEDBACK
    // =============================================
    
    createLoadingIndicator() {
        if (document.getElementById('ph-loading-indicator')) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'ph-loading-indicator';
        indicator.className = 'ph-loading-indicator';
        indicator.innerHTML = `
            <div class="ph-loading-spinner"></div>
            <div class="ph-loading-text">Inizializzazione PalermoHub...</div>
            <div class="ph-loading-progress">
                <div class="ph-loading-bar" id="ph-loading-bar"></div>
            </div>
        `;
        
        document.body.appendChild(indicator);
    }
    
    updateLoadingProgress() {
        const progressBar = document.getElementById('ph-loading-bar');
        const text = document.querySelector('.ph-loading-text');
        
        if (progressBar) {
            const progress = (this.loadedComponents.size / this.loadOrder.length) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        if (text) {
            const current = Array.from(this.loadedComponents).pop();
            if (current) {
                text.textContent = `Caricamento ${current}...`;
            }
        }
    }
    
    removeLoadingIndicator() {
        const indicator = document.getElementById('ph-loading-indicator');
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.remove();
            }, 300);
        }
    }
    
    enableDebugMode() {
        // DEBUG MODE DISATTIVATO - Non fare nulla
        return;
        
        /* Codice originale commentato:
        console.log('[PH-Init] Debug mode enabled');
        
        // Aggiungi indicatore visuale
        const debugIndicator = document.createElement('div');
        debugIndicator.className = 'dev-indicator';
        debugIndicator.textContent = 'DEBUG MODE';
        document.body.appendChild(debugIndicator);
        
        // Aggiungi classe debug al body
        document.body.classList.add('debug-mode');
        */
    }
    
    startPerformanceMonitoring() {
        this.perfMetrics = {
            initStart: this.initStartTime,
            phases: new Map(),
            memory: {
                initial: performance.memory ? performance.memory.usedJSHeapSize : 0
            }
        };
        
        // Monitor di performance
        const originalPhaseExecution = this.executePhase.bind(this);
        this.executePhase = async function(phase) {
            const start = performance.now();
            await originalPhaseExecution(phase);
            const duration = performance.now() - start;
            
            this.perfMetrics.phases.set(phase, duration);
            console.log(`[PH-Init] Phase ${phase} took ${duration.toFixed(2)}ms`);
        }.bind(this);
    }
    
    // =============================================
    // COMPLETION E ERROR HANDLING
    // =============================================
    
    onInitComplete() {
        const duration = Date.now() - this.initStartTime;
        
        console.log(`[PH-Init] Initialization completed in ${duration}ms`);
        
        if (this.config.performance && this.perfMetrics) {
            this.logPerformanceMetrics();
        }
        
        this.removeLoadingIndicator();
        
        // Dispatch evento di completamento
        document.dispatchEvent(new CustomEvent('palermoHubReady', {
            detail: {
                duration,
                loadedComponents: Array.from(this.loadedComponents),
                failedComponents: Array.from(this.failedComponents),
                validationResults: this.validationResults
            }
        }));
        
        // Cleanup inizializzatore
        this.cleanup();
        
        console.log('[PH-Init] PalermoHub is ready! 🚀');
    }
    
    onInitError(error) {
        console.error('[PH-Init] Initialization failed:', error);
        
        this.removeLoadingIndicator();
        
        // Mostra errore all'utente
        this.showErrorMessage(error);
        
        // Dispatch evento di errore
        document.dispatchEvent(new CustomEvent('palermoHubError', {
            detail: { error, failedComponents: Array.from(this.failedComponents) }
        }));
    }
    
    showErrorMessage(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fee2e2;
            color: #991b1b;
            padding: 2rem;
            border-radius: 8px;
            max-width: 500px;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        `;
        
        errorDiv.innerHTML = `
            <h3>⚠️ Errore di Inizializzazione</h3>
            <p>Si è verificato un problema durante il caricamento di PalermoHub.</p>
            <details style="margin-top: 1rem; text-align: left;">
                <summary style="cursor: pointer;">Dettagli tecnici</summary>
                <pre style="font-size: 0.8rem; margin-top: 0.5rem; white-space: pre-wrap;">${error.message}</pre>
            </details>
            <button onclick="this.parentNode.remove()" style="margin-top: 1rem; padding: 0.5rem 1rem; border: none; background: #991b1b; color: white; border-radius: 4px; cursor: pointer;">
                Chiudi
            </button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-rimuovi dopo 10 secondi
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 10000);
    }
    
    logPerformanceMetrics() {
        console.group('[PH-Init] Performance Metrics');
        
        console.log(`Total initialization time: ${Date.now() - this.initStartTime}ms`);
        
        this.perfMetrics.phases.forEach((duration, phase) => {
            console.log(`${phase}: ${duration.toFixed(2)}ms`);
        });
        
        if (performance.memory) {
            const current = performance.memory.usedJSHeapSize;
            const initial = this.perfMetrics.memory.initial;
            const increase = current - initial;
            
            console.log(`Memory usage increase: ${(increase / 1024 / 1024).toFixed(2)}MB`);
        }
        
        console.groupEnd();
    }
    
    cleanup() {
        // Cleanup dell'inizializzatore stesso
        delete this.perfMetrics;
        delete this.config;
        this.loadedComponents.clear();
        this.failedComponents.clear();
    }
}

// =============================================
// AUTO-INIZIALIZZAZIONE
// =============================================

// Inizializza automaticamente quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.palermoHubInit = new PalermoHubInitializer();
    });
} else {
    // DOM già pronto
    window.palermoHubInit = new PalermoHubInitializer();
}

// Export per utilizzo manuale
window.PalermoHubInitializer = PalermoHubInitializer;

console.log('[PH-Init] PalermoHub Initializer loaded');
