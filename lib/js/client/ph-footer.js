// footer.js - Footer semplificato senza ricerca ridondante
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
                    <a href="https://groups.google.com/g/opendatasicilia?pli=1" class="social-btn email" title="mailing list OpenDataSicilia.it" target="_blank">
                        <i class="fa fa-envelope"></i>
                    </a>
                </div>
            </div>
            
            <!-- Search semplificato - solo per pagine non-index -->
            <div class="footer-search" id="footer-search-section">
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

    // Carica Font Awesome se non è già presente
    if (!document.querySelector('link[href*="fontawesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
    
    // Carica gli stili
    loadFooterStyles();
    
    // Inizializza il popup privacy
    initPrivacyPopup();
    
    // Inizializza la ricerca semplificata
    initFooterSearch();
});

// ========================================
// RICERCA FOOTER SEMPLIFICATA
// ========================================

function initFooterSearch() {
    const searchInput = document.getElementById('footer-search-input');
    const searchContainer = document.getElementById('footer-search-input-container');
    const clearBtn = document.getElementById('footer-search-clear');
    const currentPage = getCurrentPageType();

    if (searchInput) {
        searchInput.addEventListener('input', (e) => handleFooterSearchInput(e, currentPage));
        searchInput.addEventListener('keydown', (e) => handleFooterSearchKeydown(e, currentPage));
        
        searchInput.addEventListener('focus', function() {
            searchContainer.classList.add('focused');
        });
        
        searchInput.addEventListener('blur', function() {
            searchContainer.classList.remove('focused');
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearFooterSearch);
    }

    // Imposta placeholder e comportamento in base alla pagina
    updateFooterSearchForPage(currentPage);
}

function getCurrentPageType() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    if (page === '' || page === 'index.html') {
        return 'index';
    } else {
        return 'other';
    }
}

function updateFooterSearchForPage(pageType) {
    const searchSection = document.getElementById('footer-search-section');
    const searchInput = document.getElementById('footer-search-input');
    
    if (pageType === 'index') {
        // Nell'index: nascondi completamente la ricerca
        searchSection.style.display = 'none';
        // Aggiorna layout footer per centrare le icone social
        document.querySelector('.footer-content').classList.add('index-layout');
    } else {
        // Altre pagine: mostra ricerca con placeholder informativo
        searchSection.style.display = 'block';
        searchInput.placeholder = "Cerca mappe per titolo, descrizione, autore, territorio.. (la ricerca ti porterà alla homepage)";
        document.querySelector('.footer-content').classList.remove('index-layout');
    }
}

function handleFooterSearchInput(event, pageType) {
    const query = event.target.value.trim();
    const clearBtn = document.getElementById('footer-search-clear');
    
    clearBtn.classList.toggle('visible', query.length > 0);

    if (pageType === 'index') {
        // Se siamo nell'index, usa la ricerca esistente
        if (typeof window.handleSmartSearchInput === 'function') {
            // Sincronizza con il campo di ricerca principale
            const mainSearchInput = document.getElementById('smart-search-input');
            if (mainSearchInput && mainSearchInput.value !== query) {
                mainSearchInput.value = query;
                mainSearchInput.dispatchEvent(new Event('input'));
            }
        }
    }
    // Per altre pagine non facciamo nulla durante la digitazione
}

function handleFooterSearchKeydown(event, pageType) {
    if (event.key === 'Enter') {
        const query = event.target.value.trim();
        if (query.length < 2) return;

        if (pageType === 'index') {
            // Se siamo nell'index, attiva la ricerca esistente
            if (typeof window.performSmartSearch === 'function') {
                window.performSmartSearch(query);
            }
        } else {
            // Redirect verso index con parametro di ricerca
            const searchUrl = `index.html?search=${encodeURIComponent(query)}`;
            window.location.href = searchUrl;
        }
    }
}

function clearFooterSearch() {
    const searchInput = document.getElementById('footer-search-input');
    searchInput.value = '';
    document.getElementById('footer-search-clear').classList.remove('visible');
    
    // Se siamo nell'index, pulisci anche la ricerca principale
    if (getCurrentPageType() === 'index') {
        if (typeof window.clearSmartSearch === 'function') {
            window.clearSmartSearch();
        }
    }
}

// ========================================
// STILI FOOTER SEMPLIFICATI
// ========================================

function loadFooterStyles() {
    const cssId = 'footer-styles-css';
    if (!document.getElementById(cssId)) {
        const style = document.createElement('style');
        style.id = cssId;
        style.innerHTML = `
            /* Footer Content - Layout adattivo */
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

            /* Layout per index (senza ricerca) - icone social centrate */
            .footer-content.index-layout {
                grid-template-columns: 2fr auto 2fr;
                /*justify-items: center;*/
            }

            .footer-content.index-layout .footer-social {
                grid-column: 2;
                justify-self: center;
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

            /* Footer Search - Solo per pagine non-index */
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

            /* Responsive - Mobile */
            @media (max-width: 768px) {
                .footer-content,
                .footer-content.index-layout {
                    grid-template-columns: 1fr;
                    grid-template-rows: auto auto auto auto;
                    gap: 1.5rem;
                    text-align: center;
                    padding: 1rem;
                  /*  justify-items: center;*/
                }

                .footer-text {
                    order: 1;
                    font-size: 0.7rem;
                }

                .footer-social {
                    order: 2;
                    grid-column: 1;
                }

                .footer-search {
                    order: 3;
                    min-width: auto;
                    max-width: 100%;
                }

                .footer-credits {
                    order: 4;
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ========================================
// SUPPORTO PER PARAMETRI URL NELL'INDEX
// ========================================

// Funzione per gestire i parametri di ricerca nell'URL (solo per index)
function handleUrlSearchParams() {
    if (getCurrentPageType() !== 'index') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    
    if (searchParam) {
        // Aspetta che la ricerca principale sia inizializzata
        setTimeout(() => {
            const mainSearchInput = document.getElementById('smart-search-input');
            const footerSearchInput = document.getElementById('footer-search-input');
            
            if (mainSearchInput) {
                mainSearchInput.value = searchParam;
                mainSearchInput.dispatchEvent(new Event('input'));
            }
            
            if (footerSearchInput) {
                footerSearchInput.value = searchParam;
            }
            
            // Rimuovi il parametro dall'URL per pulire la history
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 500);
    }
}

// Inizializza il supporto URL params
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(handleUrlSearchParams, 1000);
});

// ========================================
// RESTO DELLE FUNZIONI (Privacy + Social)
// ========================================

// [Tutte le funzioni per privacy e social sharing rimangono identiche al file originale]
// ... [codice privacy e social identico] ...

// Variabili globali per la gestione privacy
let privacySettings = {
    necessary: true,      
    analytics: false,     
    social: false,        
    functional: false     
};

function initPrivacyPopup() {
    const savedSettings = getCookie('palermohub_privacy_settings');
    const consentGiven = getCookie('palermohub_privacy_consent');
    
    if (savedSettings) {
        privacySettings = JSON.parse(savedSettings);
        applyPrivacySettings();
    }
    
    if (!consentGiven) {
        setTimeout(() => {
            showPrivacyPopup();
        }, 1500);
    }
    
    createPrivacyPopup();
}

function createPrivacyPopup() {
    const popupHTML = `
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
                    <p>PalermoHub utilizza cookie e tecnologie simili per migliorare la tua esperienza di navigazione.</p>
                    
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
                            <p>Cookie essenziali per il funzionamento del sito web.</p>
                        </div>
                        
                        <div class="privacy-option">
                            <div class="privacy-option-header">
                                <label class="privacy-switch">
                                    <input type="checkbox" id="analytics-cookie">
                                    <span class="privacy-slider"></span>
                                </label>
                                <strong>Cookie Analitici</strong>
                            </div>
                            <p>Ci aiutano a capire come i visitatori interagiscono con il sito.</p>
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
                    <a href="./info.html">Informativa Privacy</a>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    loadPrivacyCSS();
}

// [Resto delle funzioni privacy identiche...]

function showPrivacyPopup() {
    const popup = document.getElementById('privacy-popup');
    if (popup) {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => popup.classList.add('privacy-popup-show'), 10);
    }
}

function hidePrivacyPopup() {
    const popup = document.getElementById('privacy-popup');
    if (popup) {
        popup.classList.remove('privacy-popup-show');
        document.body.style.overflow = '';
        setTimeout(() => popup.style.display = 'none', 300);
    }
}

function showPrivacySettings() { showPrivacyPopup(); }
function acceptNecessaryOnly() { 
    privacySettings = { necessary: true, analytics: false, social: false, functional: false };
    savePrivacySettings(); hidePrivacyPopup();
}
function acceptSelectedCookies() {
    privacySettings = {
        necessary: true,
        analytics: document.getElementById('analytics-cookie').checked,
        social: false, functional: false
    };
    savePrivacySettings(); hidePrivacyPopup();
}
function acceptAllCookies() {
    privacySettings = { necessary: true, analytics: true, social: true, functional: true };
    savePrivacySettings(); hidePrivacyPopup();
}

function savePrivacySettings() {
    setCookie('palermohub_privacy_settings', JSON.stringify(privacySettings), 365);
    setCookie('palermohub_privacy_consent', 'true', 365);
    applyPrivacySettings();
}

function applyPrivacySettings() {
    console.log('Privacy settings applied:', privacySettings);
}

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

function loadPrivacyCSS() {
    const cssId = 'privacy-popup-css';
    if (!document.getElementById(cssId)) {
        const style = document.createElement('style');
        style.id = cssId;
        style.innerHTML = `
            .privacy-popup { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; }
            .privacy-popup-show { opacity: 1 !important; }
            .privacy-backdrop { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); }
            .privacy-content { background: white; border-radius: 16px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
            .privacy-header { padding: 2rem 2rem 0; display: flex; align-items: center; gap: 1rem; }
            .privacy-header i { font-size: 2rem; color: var(--primary-color, #ff9900); }
            .privacy-header h3 { margin: 0; color: #333; font-size: 1.5rem; flex-grow: 1; }
            .privacy-close { position: absolute; top: 1rem; right: 1rem; background: #f5f5f5; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
            .privacy-body { padding: 1rem 2rem; }
            .privacy-option { border: 1px solid #e0e0e0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
            .privacy-option-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
            .privacy-switch { position: relative; display: inline-block; width: 48px; height: 24px; }
            .privacy-switch input { opacity: 0; width: 0; height: 0; }
            .privacy-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
            .privacy-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .privacy-slider { background-color: var(--primary-color, #ff9900); }
            input:checked + .privacy-slider:before { transform: translateX(24px); }
            .privacy-required { background: #e8f5e8; color: #2e7d32; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
            .privacy-footer { padding: 1rem 2rem 2rem; display: flex; gap: 1rem; flex-wrap: wrap; }
            .privacy-btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; flex: 1; min-width: 120px; }
            .privacy-btn-secondary { background: #f5f5f5; color: #666; }
            .privacy-btn-primary { background: var(--primary-color, #ff9900); color: white; }
            .privacy-btn-success { background: #4CAF50; color: white; }
            .privacy-links { text-align: center; padding: 0 2rem 2rem; }
        `;
        document.head.appendChild(style);
    }
}

// Funzioni social sharing
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
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
    window.open(`https://bsky.app/intent/compose?text=${title} ${url}`, '_blank', 'width=600,height=400');
}