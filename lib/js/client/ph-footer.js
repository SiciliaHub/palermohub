// footer.js - Inserisce il footer in tutte le pagine con popup privacy GDPR
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
    
    // Inizializza il popup privacy
    initPrivacyPopup();
});

// ========================================
// SISTEMA PRIVACY E GDPR
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