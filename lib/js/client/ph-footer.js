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

const __ph_auth__ = "gbv-ods-2025-authentic";
// footer.js - Footer semplificato con funzionalità  di condivisione
document.addEventListener('DOMContentLoaded', function() {
    // Crea l'elemento footer
    const footer = document.createElement('footer');
    footer.className = 'footer';
    
    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-text">
                <strong>PalermoHub</strong> è un'iniziativa civica per democratizzare l'accesso ai dati territoriali, partendo da Palermo per creare un modello replicabile in altri contesti urbani.<br>
                Rende visibili e accessibili dati che spesso sono sepolti in documenti tecnici o siti istituzionali difficili da navigare, é un po’ come tradurre il “burocratese” in linguaggio normale e presentarlo in modo visivamente comprensibile.
            </div>
            
            <div class="footer-social">
                <div class="social-buttons">
                    <a href="#" class="social-btn share-btn" title="Condividi questa ricerca" onclick="openSharePopup()">
                        <i class="fas fa-share-alt"></i>
                    </a>
                    <a href="https://github.com/SiciliaHub/palermohub" class="social-btn github" title="Repository GitHub - PalermoHub di opendatasicilia.it é come una grande biblioteca digitale piena di mappe interattive di Palermo e della Sicilia. Invece di libri sugli scaffali, qui trovi centinaia di mappe che mostrano tutto quello che può interessarti della città : dal traffico ai monumenti, dalla geologia alle piste ciclabili. Rende visibili e accessibili dati che spesso sono sepolti in documenti tecnici o siti istituzionali difficili da navigare, é un pò come tradurre il burocratese in linguaggio normale e presentarlo in modo visivamente comprensibile." target="_blank">
                        <i class="fa-brands fa-github"></i>
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

    // Carica Font Awesome se non é già  presente
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
    
    // Inizializza il sistema di condivisione
    initShareSystem();
});

// ========================================
// SISTEMA DI CONDIVISIONE
// ========================================

function initShareSystem() {
    // Crea il popup di condivisione
    createSharePopup();
    
    // Aggiungi gli stili specifici per la condivisione
    loadShareStyles();
}

function createSharePopup() {
    const sharePopupHTML = `
        <div id="share-popup" class="share-popup" style="display: none;">
            <div class="share-backdrop" onclick="closeSharePopup()"></div>
            <div class="share-content">
                <div class="share-header">
                    <h3><i class="fas fa-share-alt"></i> Condividi Ricerca</h3>
                    <button class="share-close" onclick="closeSharePopup()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="share-body">
                    <div class="share-description">
                        <p>Condividi questa ricerca con i filtri applicati:</p>
                        <div id="share-active-filters" class="share-filters-preview">
                            <div class="no-filters">Nessun filtro attivo</div>
                        </div>
                    </div>
                    
                    <div class="share-url-section">
                        <label for="share-url-input">Link di condivisione:</label>
                        <div class="share-url-container">
                            <input type="text" 
                                   id="share-url-input" 
                                   class="share-url-input" 
                                   readonly 
                                   placeholder="Generando link...">
                            <button id="copy-share-url" class="copy-btn" onclick="copyShareUrl()" title="Copia negli appunti">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        <div id="copy-feedback" class="copy-feedback"></div>
                    </div>
                    
                    <div class="share-social-section">
                        <p>Oppure condividi direttamente su:</p>
                        <div class="share-social-buttons">
						                            <button class="share-social-btn telegram" onclick="shareCurrentSearchOn('telegram')" title="Condividi su Telegram">
                                <i class="fa-brands fa-telegram"></i>
                                <span>Telegram</span>
                            </button>
                            <button class="share-social-btn whatsapp" onclick="shareCurrentSearchOn('whatsapp')" title="Condividi su WhatsApp">
                                <i class="fa-brands fa-whatsapp"></i>
                                <span>WhatsApp</span>
                            </button>
						
                            <button class="share-social-btn facebook" onclick="shareCurrentSearchOn('facebook')" title="Condividi su Facebook">
                                <i class="fa-brands fa-facebook-f"></i>
                                <span>Facebook</span>
                            </button>
                            <button class="share-social-btn twitter" onclick="shareCurrentSearchOn('twitter')" title="Condividi su X (Twitter)">
                                <i class="fa-brands fa-x-twitter"></i>
                                <span>X (Twitter)</span>
                            </button>

                            <button class="share-social-btn bluesky" onclick="shareCurrentSearchOn('bluesky')" title="Condividi su Bluesky">
                                <i class="fa-brands fa-bluesky"></i>
                                <span>Bluesky</span>
                            </button>
                            <button class="share-social-btn email" onclick="shareCurrentSearchOn('email')" title="Condividi via Email">
                                <i class="fas fa-envelope"></i>
                                <span>Email</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', sharePopupHTML);
}

function getCurrentFiltersForSharing() {
    const filters = {};
    
    // Mappa dei filtri con i loro ID e nomi per display
    const filterMappings = {
        'categoria-filter': { param: 'categoria', label: 'Categoria' },
        'territorio-filter': { param: 'territorio', label: 'Territorio' },
        'fonte-filter': { param: 'fonte', label: 'Fonte Dati' },
        'anno-filter': { param: 'anno', label: 'Anno' },
        'tag-filter': { param: 'tag', label: 'Tag' },
        'collaborazione-filter': { param: 'collaborazione', label: 'Autore' },
        'smart-search-input': { param: 'search', label: 'Ricerca' }
    };
    
    const activeFilters = [];
    
    Object.entries(filterMappings).forEach(([elementId, config]) => {
        const element = document.getElementById(elementId);
        if (element && element.value && element.value.trim() && element.value !== '') {
            filters[config.param] = element.value.trim();
            activeFilters.push({
                label: config.label,
                value: element.value.trim()
            });
        }
    });
    
    return { urlParams: filters, displayFilters: activeFilters };
}

function generateShareUrl(filters) {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    
    // Aggiungi i filtri come parametri URL
    Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
            params.set(key, value);
        }
    });
    
    // Aggiungi un timestamp per rendere il link unico (opzionale)
    params.set('shared', Date.now().toString(36));
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}

function openSharePopup() {
    const popup = document.getElementById('share-popup');
    if (!popup) return;
    
    // Ottieni i filtri correnti
    const { urlParams, displayFilters } = getCurrentFiltersForSharing();
    
    // Aggiorna la preview dei filtri
    updateShareFiltersPreview(displayFilters);
    
    // Genera l'URL di condivisione
    const shareUrl = generateShareUrl(urlParams);
    const shareUrlInput = document.getElementById('share-url-input');
    if (shareUrlInput) {
        shareUrlInput.value = shareUrl;
    }
    
    // Mostra il popup
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Animazione di entrata
    setTimeout(() => {
        popup.classList.add('share-popup-show');
    }, 10);
}

function closeSharePopup() {
    const popup = document.getElementById('share-popup');
    if (!popup) return;
    
    popup.classList.remove('share-popup-show');
    document.body.style.overflow = '';
    
    setTimeout(() => {
        popup.style.display = 'none';
    }, 300);
}

function updateShareFiltersPreview(activeFilters) {
    const container = document.getElementById('share-active-filters');
    if (!container) return;
    
    if (activeFilters.length === 0) {
        container.innerHTML = '<div class="no-filters">Nessun filtro attivo - condividerai la vista principale</div>';
        return;
    }
    
    const filtersHTML = activeFilters.map(filter => {
        const displayValue = filter.value.length > 25 ? filter.value.substring(0, 25) + '...' : filter.value;
        return `
            <div class="share-filter-tag" title="${filter.label}: ${filter.value}">
                <strong>${filter.label}:</strong> ${displayValue}
            </div>
        `;
    }).join('');
    
    container.innerHTML = filtersHTML;
}

async function copyShareUrl() {
    const urlInput = document.getElementById('share-url-input');
    const copyBtn = document.getElementById('copy-share-url');
    const feedback = document.getElementById('copy-feedback');
    
    if (!urlInput || !urlInput.value) return;
    
    try {
        // Usa l'API Clipboard se disponibile
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(urlInput.value);
        } else {
            // Fallback per browser pià¹ vecchi
            urlInput.select();
            urlInput.setSelectionRange(0, 99999);
            document.execCommand('copy');
        }
        
        // Feedback visivo
        if (copyBtn) {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.style.background = '#10b981';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.background = '';
            }, 2000);
        }
        
        if (feedback) {
            feedback.textContent = 'âœ" Link copiato negli appunti!';
            feedback.className = 'copy-feedback success';
            
            setTimeout(() => {
                feedback.textContent = '';
                feedback.className = 'copy-feedback';
            }, 3000);
        }
        
    } catch (err) {
        console.error('Errore nella copia:', err);
        
        if (feedback) {
            feedback.textContent = 'âš  Errore nella copia. Seleziona e copia manualmente.';
            feedback.className = 'copy-feedback error';
            
            // Seleziona il testo per la copia manuale
            urlInput.select();
            urlInput.setSelectionRange(0, 99999);
            
            setTimeout(() => {
                feedback.textContent = '';
                feedback.className = 'copy-feedback';
            }, 5000);
        }
    }
}

function shareCurrentSearchOn(platform) {
    const urlInput = document.getElementById('share-url-input');
    if (!urlInput || !urlInput.value) return;
    
    const shareUrl = urlInput.value;
    const { displayFilters } = getCurrentFiltersForSharing();
    
    // Crea un titolo descrittivo
    let title = 'PalermoHub - Mappe e Dati Open Data';
    let description = 'Esplora mappe interattive di Palermo e della Sicilia';
    
    if (displayFilters.length > 0) {
        const filterNames = displayFilters.map(f => f.label).slice(0, 2);
        title += ` - Filtri: ${filterNames.join(', ')}`;
        if (displayFilters.length > 2) {
            title += ` e altri ${displayFilters.length - 2}`;
        }
        description = `Ricerca filtrata per: ${displayFilters.map(f => `${f.label}: ${f.value}`).join(', ')}`;
    }
    
    let socialUrl;
    switch (platform) {
        case 'facebook':
            // CORREZIONE: Usa l'endpoint corretto e aggiungi parametro quote per il testo
            socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`;
            break;
        case 'twitter':
            socialUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}&hashtags=PalermoHub,OpenData,Palermo,Sicilia`;
            break;
        case 'telegram':
            socialUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
            break;
        case 'whatsapp':
            socialUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`;
            break;
        case 'bluesky':
            const blueskyText = `${title} ${shareUrl}`;
            socialUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(blueskyText)}`;
            break;
        case 'email':
            const emailSubject = encodeURIComponent(title);
            const emailBody = encodeURIComponent(`Ciao,\n\nHo trovato questa ricerca interessante su PalermoHub che volevo condividere con te:\n\n${description}\n\nPuoi vedere i risultati qui: ${shareUrl}\n\nPalermoHub é una piattaforma di mappe interattive e dati aperti su Palermo e la Sicilia.\n\nBuona esplorazione!`);
            socialUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
            break;
        default:
            return;
    }
    
    if (platform === 'email') {
        // Per l'email usa window.location per aprire il client di posta
        window.location.href = socialUrl;
    } else {
        // CORREZIONE: Dimensioni finestra ottimizzate per Facebook e altri social
        const windowFeatures = platform === 'facebook' 
            ? 'width=626,height=436,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no'
            : 'width=600,height=400,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no';
        window.open(socialUrl, '_blank', windowFeatures);
    }
    
    // Chiudi il popup dopo un breve delay
    setTimeout(() => {
        closeSharePopup();
    }, 500);
}

function loadShareStyles() {
    const cssId = 'share-popup-styles';
    if (!document.getElementById(cssId)) {
        const style = document.createElement('style');
        style.id = cssId;
        style.innerHTML = `
            /* Icona di condivisione rossa */
            .social-btn.share-btn {
                background: #ff9900 !important;
                color: white !important;
                border-color: #ff9900 !important;
            }
            
            .social-btn.share-btn::before {
                background: #ff9900 !important;
            }
            
            .social-btn.share-btn:hover {
                background: #ff9900 !important;
                color: white !important;
                border-color: #ff9900 !important;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
            }
            
            /* Popup di condivisione */
            .share-popup {
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
            
            .share-popup-show {
                opacity: 1 !important;
            }
            
            .share-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }
            
            .share-content {
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            
            .share-popup-show .share-content {
                transform: scale(1);
            }
            
            .share-header {
                padding: 2rem 2rem 1rem;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .share-header h3 {
                margin: 0;
                color: #374151;
                font-size: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .share-header i {
                color: #ff9900;
            }
            
            .share-close {
                background: #f3f4f6;
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .share-close:hover {
                background: #e5e7eb;
                transform: scale(1.1);
            }
            
            .share-body {
                padding: 1.5rem 2rem 2rem;
            }
            
            .share-description {
                margin-bottom: 2rem;
            }
            
            .share-description > p {
                margin: 0 0 1rem;
                color: #6b7280;
                font-size: 0.95rem;
            }
            
            .share-filters-preview {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 1rem;
                min-height: 60px;
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                align-items: flex-start;
            }
            
            .share-filters-preview .no-filters {
                color: #9ca3af;
                font-style: italic;
                width: 100%;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 40px;
            }
            
            .share-filter-tag {
                background: #eff6ff;
                color: #1e40af;
                padding: 0.4rem 0.75rem;
                border-radius: 20px;
                font-size: 0.85rem;
                border: 1px solid #bfdbfe;
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                font-weight: 500;
                max-width: 200px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .share-url-section {
                margin-bottom: 2rem;
            }
            
            .share-url-section > label {
                display: block;
                margin-bottom: 0.75rem;
                color: #374151;
                font-weight: 600;
                font-size: 0.9rem;
            }
            
            .share-url-container {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 0.75rem;
            }
            
            .share-url-input {
                flex: 1;
                padding: 0.75rem;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 0.9rem;
                font-family: monospace;
                background: #f9fafb;
                color: #374151;
                outline: none;
                transition: border-color 0.3s ease;
            }
            
            .share-url-input:focus {
                border-color: #ff9900;
            }
            
            .copy-btn {
                padding: 0.75rem 1rem;
                background: #ff9900;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                white-space: nowrap;
            }
            
            .copy-btn:hover {
                background: #ff9900;
                transform: translateY(-1px);
            }
            
            .copy-feedback {
                font-size: 0.85rem;
                margin-top: 0.5rem;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .copy-feedback.success {
                opacity: 1;
                color: #10b981;
                font-weight: 600;
            }
            
            .copy-feedback.error {
                opacity: 1;
                color: #ff9900;
                font-weight: 600;
            }
            
            .share-social-section {
                border-top: 1px solid #e5e7eb;
                padding-top: 2rem;
            }
            
            .share-social-section > p {
                margin: 0 0 1.5rem;
                color: #6b7280;
                font-size: 0.95rem;
            }
            
            .share-social-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
            }
            
            .share-social-btn {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 600;
                text-decoration: none;
                color: #374151;
            }
            
            .share-social-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .share-social-btn.facebook:hover {
                border-color: #1877f2;
                color: #1877f2;
            }
            
            .share-social-btn.twitter:hover {
                border-color: #000000;
                color: #000000;
            }
            
            .share-social-btn.telegram:hover {
                border-color: #0088cc;
                color: #0088cc;
            }
            
            .share-social-btn.whatsapp:hover {
                border-color: #25d366;
                color: #25d366;
            }
            
            .share-social-btn.bluesky:hover {
                border-color: #00d4ff;
                color: #00d4ff;
            }
            
            .share-social-btn.email:hover {
                border-color: #ff9900;
                color: #ff9900;
            }
            
            .share-social-btn i {
                font-size: 1.25rem;
            }
            
            /* Dark mode */
            [data-theme="dark"] .share-content {
                background: #1f2937;
                color: #f9fafb;
            }
            
            [data-theme="dark"] .share-header {
                border-bottom-color: #374151;
            }
            
            [data-theme="dark"] .share-header h3 {
                color: #f9fafb;
            }
            
            [data-theme="dark"] .share-close {
                background: #374151;
                color: #d1d5db;
            }
            
            [data-theme="dark"] .share-close:hover {
                background: #4b5563;
            }
            
            [data-theme="dark"] .share-description > p {
                color: #d1d5db;
            }
            
            [data-theme="dark"] .share-filters-preview {
                background: #374151;
                border-color: #4b5563;
            }
            
            [data-theme="dark"] .share-filters-preview .no-filters {
                color: #9ca3af;
            }
            
            [data-theme="dark"] .share-filter-tag {
                background: #1e40af;
                color: #bfdbfe;
                border-color: #3730a3;
            }
            
            [data-theme="dark"] .share-url-input {
                background: #374151;
                border-color: #4b5563;
                color: #f9fafb;
            }
            
            [data-theme="dark"] .share-url-input:focus {
                border-color: #ff9900;
            }
            
            [data-theme="dark"] .share-social-section {
                border-top-color: #374151;
            }
            
            [data-theme="dark"] .share-social-section > p {
                color: #d1d5db;
            }
            
            [data-theme="dark"] .share-social-btn {
                background: #374151;
                border-color: #4b5563;
                color: #d1d5db;
            }
            
            [data-theme="dark"] .share-social-btn:hover {
                background: #4b5563;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .share-content {
                    width: 95%;
                }
                
                .share-header,
                .share-body {
                    padding-left: 1.5rem;
                    padding-right: 1.5rem;
                }
                
                .share-header h3 {
                    font-size: 1.25rem;
                }
                
                .share-social-buttons {
                    grid-template-columns: 1fr;
                }
                
                .share-url-container {
                    flex-direction: column;
                }
                
                .copy-btn {
                    align-self: flex-end;
                }
            }
            
            @media (max-width: 480px) {
                .share-header,
                .share-body {
                    padding-left: 1rem;
                    padding-right: 1rem;
                }
                
                .share-filter-tag {
                    font-size: 0.8rem;
                    padding: 0.3rem 0.6rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ========================================
// RESTO DELLE FUNZIONI ORIGINALI (Privacy + Social)
// ========================================

// Ricerca footer semplificata (codice invariato)
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
        searchSection.style.display = 'none';
        document.querySelector('.footer-content').classList.add('index-layout');
    } else {
        searchSection.style.display = 'block';
        searchInput.placeholder = "Cerca mappe per titolo, descrizione, autore, territorio.. (la ricerca ti porterà  alla homepage)";
        document.querySelector('.footer-content').classList.remove('index-layout');
    }
}

function handleFooterSearchInput(event, pageType) {
    const query = event.target.value.trim();
    const clearBtn = document.getElementById('footer-search-clear');
    
    clearBtn.classList.toggle('visible', query.length > 0);

    if (pageType === 'index') {
        if (typeof window.handleSmartSearchInput === 'function') {
            const mainSearchInput = document.getElementById('smart-search-input');
            if (mainSearchInput && mainSearchInput.value !== query) {
                mainSearchInput.value = query;
                mainSearchInput.dispatchEvent(new Event('input'));
            }
        }
    }
}

function handleFooterSearchKeydown(event, pageType) {
    if (event.key === 'Enter') {
        const query = event.target.value.trim();
        if (query.length < 2) return;

        if (pageType === 'index') {
            if (typeof window.performSmartSearch === 'function') {
                window.performSmartSearch(query);
            }
        } else {
            const searchUrl = `index.html?search=${encodeURIComponent(query)}`;
            window.location.href = searchUrl;
        }
    }
}

function clearFooterSearch() {
    const searchInput = document.getElementById('footer-search-input');
    searchInput.value = '';
    document.getElementById('footer-search-clear').classList.remove('visible');
    
    if (getCurrentPageType() === 'index') {
        if (typeof window.clearSmartSearch === 'function') {
            window.clearSmartSearch();
        }
    }
}

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
// FUNZIONI PRIVACY
// ========================================

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

var __creator_gbv__ = "palermohub_2025";
var __org_ods__ = "opendatasicilia";

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

// ========================================
// FUNZIONI SOCIAL SHARING (FUNZIONI DI FALLBACK - AGGIORNATE)
// ========================================

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


function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title || 'PalermoHub - Mappe e Dati Open Data');
    // CORREZIONE: Usa l'endpoint corretto con il parametro quote
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`, '_blank', 'width=626,height=436,scrollbars=yes,resizable=yes');
}

function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title || 'PalermoHub - Mappe e Dati Open Data');
    const hashtags = 'PalermoHub,OpenData,Palermo,Sicilia';
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}&hashtags=${hashtags}`, '_blank', 'width=600,height=400');
}

function shareOnBluesky() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title || 'PalermoHub - Mappe e Dati Open Data');
    window.open(`https://bsky.app/intent/compose?text=${title} ${url}`, '_blank', 'width=600,height=400');
}