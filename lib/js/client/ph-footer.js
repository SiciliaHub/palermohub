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

// Variabile globale per tracciare lo stato del footer
let isFooterOpen = false;

// footer.js - Footer modale con linguetta di controllo
document.addEventListener('DOMContentLoaded', function() {
    // Crea la linguetta di controllo
    createFooterToggleTab();
    
    // Crea il footer modale
    createModalFooter();
    
    // Carica Font Awesome se non è già presente
    if (!document.querySelector('link[href*="fontawesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
    
    // Carica gli stili
    loadFooterModalStyles();
    
    // Inizializza il popup privacy
    initPrivacyPopup();
    
    // Inizializza la ricerca semplificata
    initFooterSearch();
    
    // Inizializza il sistema di condivisione
    initShareSystem();
    
    // Assicurati che il footer sia chiuso all'avvio
    ensureFooterClosed();
});

// ========================================
// LINGUETTA DI CONTROLLO FOOTER
// ========================================

function createFooterToggleTab() {
    const toggleTab = document.createElement('div');
    toggleTab.id = 'footer-toggle-tab';
    toggleTab.className = 'footer-toggle-tab';
    toggleTab.setAttribute('data-tooltip', 'Info & Strumenti');
    toggleTab.innerHTML = `
        <div class="toggle-tab-content" title="PalermoHub - Info & Strumenti">
            <div class="tab-pulse"></div>
            <i class="fas fa-info-circle tab-icon"></i>
            <div class="tab-shine"></div>
        </div>
    `;
    
    // Aggiungi listener per aprire/chiudere il footer
    toggleTab.addEventListener('click', toggleModalFooter);
    
    // Inserisci la linguetta nel body
    document.body.appendChild(toggleTab);
}

function createModalFooter() {
    // Crea l'overlay backdrop
    const footerOverlay = document.createElement('div');
    footerOverlay.id = 'footer-modal-overlay';
    footerOverlay.className = 'footer-modal-overlay';
    footerOverlay.style.display = 'none'; // Inizialmente nascosto
    
    // Crea il footer modale
    const modalFooter = document.createElement('div');
    modalFooter.id = 'modal-footer';
    modalFooter.className = 'modal-footer';
    modalFooter.style.display = 'none'; // Inizialmente nascosto
    
    modalFooter.innerHTML = `
        <div class="modal-footer-close-tab" onclick="closeModalFooter()" title="Chiudi pannello">
            <div class="close-tab-content">
                <i class="fas fa-chevron-down"></i>
            <!--    <span class="close-tab-text">Chiudi</span> -->
            </div>
        </div>
        
        <div class="modal-footer-header">
            <div class="modal-footer-title">
                <i class="fas fa-info-circle"></i>
                <span>PalermoHub - Info & Strumenti</span>
            </div>
        </div>
        
        <div class="modal-footer-content">
            <div class="footer-content-grid">
                
                <!-- Sezione Informazioni -->
                <div class="footer-section info-section">
                    <h4><i class="fas fa-book-open"></i> PalermoHub</h4>
                    <div class="footer-text">
                        È un'iniziativa civica per democratizzare l'accesso ai dati territoriali, partendo da Palermo per creare un modello replicabile in altri contesti urbani.<br>
                        Rende visibili e accessibili dati che spesso sono sepolti in documenti tecnici o siti istituzionali difficili da navigare, è un po' come tradurre il "burocratese" in linguaggio normale e presentarlo in modo visivamente comprensibile.
                    </div>
                </div>

                <!-- Sezione Condivisione e Social -->
                <div class="footer-section social-section">
                    <h4><i class="fas fa-share-nodes"></i> Condividi & Seguici</h4>
                    <div class="footer-social">
                        <div class="social-buttons">
                            <a href="#" class="social-btn share-btn" title="Condividi questa ricerca" onclick="openSharePopup()">
                                <i class="fas fa-share-alt"></i>
                            </a>
							    <a href="https://opendatasicilia.it" class="social-btn website" title="Sito OpenDataSicilia" target="_blank">
								<i class="fas fa-globe"></i>
							</a>
														<a href="https://www.facebook.com/groups/opendatasicilia" class="social-btn facebook" title="Seguici su Facebook" target="_blank">
								<i class="fa-brands fa-facebook-f"></i>
							</a>
							<a href="https://x.com/opendatasicilia" class="social-btn twitter" title="Seguici su X" target="_blank">
								<i class="fa-brands fa-x-twitter"></i>
							</a>
							<a href="https://t.me/opendatasicilia" class="social-btn telegram" title="Seguici su Telegram" target="_blank">
								<i class="fa-brands fa-telegram"></i>
							</a>
							                            <a href="https://groups.google.com/g/opendatasicilia?pli=1" class="social-btn email" title="mailing list OpenDataSicilia.it" target="_blank">
                                <i class="fa fa-envelope"></i>
                            </a>
							
                            <a href="https://github.com/SiciliaHub/palermohub" class="social-btn github" title="Repository GitHub - PalermoHub" target="_blank">
                                <i class="fa-brands fa-github"></i>
                            </a>

                        </div>
                    </div>
                </div>

                <!-- Sezione Ricerca (ora sempre visibile) -->
                <div class="footer-section search-section" id="modal-footer-search-section">
                    <h4><i class="fas fa-search"></i> Ricerca Rapida</h4>
                    <div class="footer-search-wrapper">
                        <div class="footer-search-input-container" id="modal-footer-search-input-container">
                            <div class="footer-search-icon"><i class="fas fa-search"></i></div>
                            <input type="text" 
                                   id="modal-footer-search-input" 
                                   class="footer-search-input" 
                                   placeholder="Cerca mappe..."
                                   autocomplete="off"
                                   autocorrect="off"
                                   spellcheck="false">
                            <button id="modal-footer-search-clear" class="footer-search-clear" title="Cancella ricerca">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Sezione Credits -->
                <div class="footer-section credits-section">
                    <h4><i class="fas fa-users"></i> Credits & Licenza</h4>
                    <div class="footer-credits">
                        <p><strong>Autore:</strong> <a href="https://opendatasicilia.it" title="@opendatasicilia" target="_blank">@opendatasicilia</a></p>
                        <p><strong>Sviluppo:</strong> <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - <a href="https://claude.ai" target="_blank">Claude AI (Anthropic)</a></p>
                        <p><strong>Licenza:</strong> <a href="https://creativecommons.org/licenses/by-sa/4.0/" title="Attribuzione-CondividiAlloStessoModo 4.0 Internazionale" target="_blank">CC BY-SA 4.0</a></p>
                        <p><a href="#" onclick="showPrivacySettings()" class="privacy-link">Gestisci Privacy</a></p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Aggiungi listener per chiudere cliccando sull'overlay
    footerOverlay.addEventListener('click', closeModalFooter);
    
    // Inserisci overlay e footer nel body
    document.body.appendChild(footerOverlay);
    document.body.appendChild(modalFooter);
}

function ensureFooterClosed() {
    isFooterOpen = false;
    const overlay = document.getElementById('footer-modal-overlay');
    const modalFooter = document.getElementById('modal-footer');
    const toggleTab = document.getElementById('footer-toggle-tab');
    
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('overlay-visible');
    }
    
    if (modalFooter) {
        modalFooter.style.display = 'none';
        modalFooter.classList.remove('modal-footer-open');
    }
    
    if (toggleTab) {
        toggleTab.classList.remove('tab-active');
        const arrow = toggleTab.querySelector('.tab-arrow');
        const text = toggleTab.querySelector('.tab-text');
        if (arrow) arrow.className = 'fas fa-chevron-up tab-arrow';
        if (text) text.textContent = 'Info & Strumenti';
    }
    
    // Ripristina scroll della pagina
    document.body.style.overflow = '';
}

function toggleModalFooter() {
    if (isFooterOpen) {
        closeModalFooter();
    } else {
        openModalFooter();
    }
}

function openModalFooter() {
    if (isFooterOpen) return;
    
    isFooterOpen = true;
    const overlay = document.getElementById('footer-modal-overlay');
    const modalFooter = document.getElementById('modal-footer');
    const toggleTab = document.getElementById('footer-toggle-tab');
    
    // Mostra overlay e footer
    if (overlay) {
        overlay.style.display = 'block';
        setTimeout(() => overlay.classList.add('overlay-visible'), 10);
    }
    
    if (modalFooter) {
        modalFooter.style.display = 'block';
        setTimeout(() => modalFooter.classList.add('modal-footer-open'), 10);
    }
    
    // Aggiorna linguetta
    if (toggleTab) {
        toggleTab.classList.add('tab-active');
        const arrow = toggleTab.querySelector('.tab-arrow');
        const text = toggleTab.querySelector('.tab-text');
        if (arrow) arrow.className = 'fas fa-chevron-down tab-arrow';
        if (text) text.textContent = 'Chiudi Info';
    }
    
    // Previeni scroll della pagina
    document.body.style.overflow = 'hidden';
    
    // Trigger eventi personalizzati
    window.dispatchEvent(new CustomEvent('footerModalOpened'));
}

function closeModalFooter() {
    if (!isFooterOpen) return;
    
    isFooterOpen = false;
    const overlay = document.getElementById('footer-modal-overlay');
    const modalFooter = document.getElementById('modal-footer');
    const toggleTab = document.getElementById('footer-toggle-tab');
    
    // Nascondi overlay e footer con animazione
    if (overlay) {
        overlay.classList.remove('overlay-visible');
    }
    
    if (modalFooter) {
        modalFooter.classList.remove('modal-footer-open');
    }
    
    // Nascondi completamente dopo l'animazione
    setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
        if (modalFooter) modalFooter.style.display = 'none';
    }, 400);
    
    // Aggiorna linguetta
    if (toggleTab) {
        toggleTab.classList.remove('tab-active');
        const arrow = toggleTab.querySelector('.tab-arrow');
        const text = toggleTab.querySelector('.tab-text');
        if (arrow) arrow.className = 'fas fa-chevron-up tab-arrow';
        if (text) text.textContent = 'Info & Strumenti';
    }
    
    // Ripristina scroll della pagina
    document.body.style.overflow = '';
    
    // Trigger eventi personalizzati
    window.dispatchEvent(new CustomEvent('footerModalClosed'));
}

// ========================================
// SISTEMA DI CONDIVISIONE
// ========================================

function initShareSystem() {
    createSharePopup();
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
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
            params.set(key, value);
        }
    });
    
    params.set('shared', Date.now().toString(36));
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}

function openSharePopup() {
    const popup = document.getElementById('share-popup');
    if (!popup) return;
    
    const { urlParams, displayFilters } = getCurrentFiltersForSharing();
    
    updateShareFiltersPreview(displayFilters);
    
    const shareUrl = generateShareUrl(urlParams);
    const shareUrlInput = document.getElementById('share-url-input');
    if (shareUrlInput) {
        shareUrlInput.value = shareUrl;
    }
    
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
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
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(urlInput.value);
        } else {
            urlInput.select();
            urlInput.setSelectionRange(0, 99999);
            document.execCommand('copy');
        }
        
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
            feedback.textContent = '✅ Link copiato negli appunti!';
            feedback.className = 'copy-feedback success';
            
            setTimeout(() => {
                feedback.textContent = '';
                feedback.className = 'copy-feedback';
            }, 3000);
        }
        
    } catch (err) {
        console.error('Errore nella copia:', err);
        
        if (feedback) {
            feedback.textContent = '⚠️ Errore nella copia. Seleziona e copia manualmente.';
            feedback.className = 'copy-feedback error';
            
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
            const emailBody = encodeURIComponent(`Ciao,\n\nHo trovato questa ricerca interessante su PalermoHub che volevo condividere con te:\n\n${description}\n\nPuoi vedere i risultati qui: ${shareUrl}\n\nPalermoHub è una piattaforma di mappe interattive e dati aperti su Palermo e la Sicilia.\n\nBuona esplorazione!`);
            socialUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
            break;
        default:
            return;
    }
    
    if (platform === 'email') {
        window.location.href = socialUrl;
    } else {
        const windowFeatures = platform === 'facebook' 
            ? 'width=626,height=436,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no'
            : 'width=600,height=400,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no';
        window.open(socialUrl, '_blank', windowFeatures);
    }
    
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
            .social-btn.share-btn {
                background: #ff9900 !important;
                color: white !important;
                border-color: #ff9900 !important;
            }
            
            .social-btn.share-btn::before {
                background: #ff9900 !important;
            }
            
            .social-btn.share-btn:hover {
                background: #e68900 !important;
                color: white !important;
                border-color: #e68900 !important;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 153, 0, 0.4) !important;
            }
            
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
                background: #e68900;
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
        `;
        document.head.appendChild(style);
    }
}

// ========================================
// RICERCA FOOTER
// ========================================

function initFooterSearch() {
    const searchInput = document.getElementById('modal-footer-search-input');
    const searchContainer = document.getElementById('modal-footer-search-input-container');
    const clearBtn = document.getElementById('modal-footer-search-clear');
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
    const searchSection = document.getElementById('modal-footer-search-section');
    const searchInput = document.getElementById('modal-footer-search-input');
    
    if (searchSection) {
        if (pageType === 'index') {
            // Per la home page, nascondi completamente la sezione ricerca
            searchSection.style.display = 'none';
            searchSection.style.visibility = 'hidden';
            searchSection.classList.add('hidden');
        } else {
            // Per le altre pagine, mantieni visibile la sezione ricerca
            searchSection.style.display = 'block';
            searchSection.style.visibility = 'visible';
            searchSection.classList.remove('hidden');
        }
    }
    
    if (searchInput) {
        if (pageType === 'index') {
            // Disabilita l'input sulla home page
            searchInput.disabled = true;
            searchInput.placeholder = "";
        } else {
            // Abilita l'input per le altre pagine
            searchInput.disabled = false;
            searchInput.placeholder = "Cerca mappe (ti porterà alla homepage)...";
        }
    }
}

function handleFooterSearchInput(event, pageType) {
    const query = event.target.value.trim();
    const clearBtn = document.getElementById('modal-footer-search-clear');
    
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
    const searchInput = document.getElementById('modal-footer-search-input');
    searchInput.value = '';
    document.getElementById('modal-footer-search-clear').classList.remove('visible');
    
    if (getCurrentPageType() === 'index') {
        if (typeof window.clearSmartSearch === 'function') {
            window.clearSmartSearch();
        }
    }
}

// ========================================
// STILI CSS PER FOOTER MODALE
// ========================================

function loadFooterModalStyles() {
    const cssId = 'footer-modal-styles-css';
    if (!document.getElementById(cssId)) {
        const style = document.createElement('style');
        style.id = cssId;
        style.innerHTML = `
            .footer-toggle-tab {
                position: fixed;
                bottom: 0px;
                right: 20px;
                z-index: 9999;
                background: linear-gradient(135deg, var(--primary-color, #ff9900) 0%, #ff7700 100%);
                color: white;
                border-radius: 8px 8px 0 0;
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
            
            .footer-toggle-tab::before {
                content: '';
                position: absolute;
                top: -1px;
                left: -1px;
                right: -1px;
                bottom: -1px;
                background: linear-gradient(45deg, #ff9900, #ff7700, #ff9900, #ff7700);
                background-size: 400% 400%;
                border-radius: 8px 8px 0 0;
                z-index: -1;
                animation: borderGlow 3s ease-in-out infinite;
                opacity: 0.6;
            }
            
            @keyframes borderGlow {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            
            .footer-toggle-tab:hover {
                box-shadow: 0 2px 16px rgba(255, 153, 0, 0.6);
                background: linear-gradient(135deg, #ff7700 0%, #ff5500 100%);
                width: 52px;
                height: 36px;
            }
            
            .footer-toggle-tab.tab-active {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                border-radius: 8px;
                box-shadow: 0 2px 12px rgba(34, 197, 94, 0.4);
                width: 52px;
                height: 36px;
            }
            
            .footer-toggle-tab.tab-active::before {
                background: linear-gradient(45deg, #22c55e, #16a34a, #22c55e, #16a34a);
                border-radius: 8px;
            }
            
            .footer-toggle-tab.tab-active:hover {
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
            
            .footer-toggle-tab.tab-active .tab-pulse,
            .footer-toggle-tab:hover .tab-pulse {
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
            
            .footer-toggle-tab:hover .tab-shine {
                left: 100%;
            }
            
            .tab-icon {
                font-size: 1.1rem;
                filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
                transition: transform 0.3s ease;
                position: relative;
                z-index: 1;
            }
            
            .footer-toggle-tab:hover .tab-icon {
                transform: scale(1.15);
            }
            
            .footer-toggle-tab.tab-active .tab-icon {
                transform: rotate(180deg);
            }
            
            .footer-toggle-tab::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 100%;
                right: 0;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 0.75rem;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transform: translateY(5px);
                transition: all 0.3s ease;
                z-index: 10000;
            }
            
            .footer-toggle-tab:hover::after {
                opacity: 1;
                transform: translateY(0);
            }
            
            .footer-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(5px);
                z-index: 9998;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .footer-modal-overlay.overlay-visible {
                opacity: 1;
                visibility: none;
            }
            
            .modal-footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                border-radius: 0;
                box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.25);
                z-index: 9999;
                max-height: 60vh;
                overflow-y: auto;
                 transform: translateY(100%);
                transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            
            .modal-footer.modal-footer-open {
                transform: translateY(0);
            }
            
            .modal-footer-close-tab {
              position: absolute;
                top: 0px; /* SPOSTATA all'esterno del pannello */
                right: 20px; /* ALLINEATA alla linguetta di apertura */
                transform: none!important;
                background: linear-gradient(135deg, #ff9900 0%, #ff7700 100%);
                border: none;
                border-radius: 0 0 8px 8px ;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                color: white;
                padding: 0px;
               width: 48px; /* STESSA larghezza della linguetta di apertura */
                height: 32px; /* STESSA altezza della linguetta di apertura */
                box-shadow: 0 -2px 12px rgba(255, 153, 0, 0.4);
                z-index: 10001;
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
            
            .modal-footer-close-tab::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #ff9900 0%, #ff9900 100%);
                opacity: 0;
               /* transition: opacity 0.3s ease;*/
                border-radius: 6px 6px 0 0;
            }
            
            .modal-footer-close-tab:hover::before {
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
            
            .close-tab-text {
                font-size: 0.85rem;
                font-weight: 600;
                white-space: nowrap;
                filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
            }
            
            .modal-footer-close-tab:hover {
                transform: translateY(-3px);
                box-shadow: 0 -4px 16px rgba(255, 153, 0, 0.6);
            }
            
            .modal-footer-close-tab:hover .close-tab-content i {
                transform: scale(1.1);
            }
            
            .modal-footer-header {
                padding: 1rem 2rem;
                border-bottom: 2px solid #e5e7eb;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #f9fafb 0%, #fff 100%);
                border-radius: 0;
                position: sticky;
                top: 0;
                z-index: 10;
                min-height: 60px;
            }
            
            .modal-footer-title {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-size: 1.2rem;
                font-weight: 700;
                color: #374151;
            }
            
            .modal-footer-title i {
                color: var(--primary-color, #ff9900);
                font-size: 1.3rem;
            }
            
            .modal-footer-content {
                padding: 1.5rem 2rem 2rem;
            }
            
            .footer-content-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1.5rem;
                align-items: start;
                align-content: start;
            }
            
            .footer-section {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 0;
                padding: 1.25rem;
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                min-height: 200px;
                align-self: start !important;
                vertical-align: top !important;
                margin: 0 !important;
                position: relative;
                top: 0 !important;
            }
            
            /* NUOVO: Forzatura specifica per ogni box */
            .footer-section.info-section,
            .footer-section.social-section,
            .footer-section.search-section,
            .footer-section.credits-section {
                align-self: flex-start !important;
                vertical-align: top !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                padding-top: 1.25rem !important;
                position: relative !important;
                top: 0 !important;
                transform: translateY(0) !important;
            }
            
            /* NUOVO: Reset forzato per il contenuto del primo box */
            .info-section {
                grid-row-start: 1 !important;
                align-self: start !important;
            }
            
            .info-section .footer-text {
                margin: 0 !important;
                padding: 0 !important;
                align-self: flex-start !important;
                vertical-align: top !important;
                position: relative !important;
                top: 0 !important;
            }
            
            .footer-section:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                border-color: var(--primary-color, #ff9900);
            }
            
            .footer-section h4 {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin: 0 0 1rem;
                color: #374151;
                font-size: 1rem;
                font-weight: 600;
                flex-shrink: 0;
            }
            
            .footer-section h4 i {
                color: var(--primary-color, #ff9900);
                font-size: 1rem;
            }
            
            .footer-text,
            .footer-social,
            .footer-search-wrapper,
            .footer-credits {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: stretch;
                margin: 0;
                padding: 0;
            }
            
            .footer-text {
                color: #6b7280;
                line-height: 1.6;
                font-size: 0.85rem;
                text-align: left;
            }
            
            .footer-social {
                align-items: center;
                gap: 0.75rem;
            }
            
            .social-buttons {
                display: flex;
                gap: 0.75rem;
                align-items: center;
                justify-content: center;
            }
            
            .social-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: white;
                color: #6b7280;
                text-decoration: none;
                transition: all 0.3s ease;
                font-size: 1rem;
                border: 2px solid #e5e7eb;
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
                background: var(--primary-color, #ff9900);
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
                border-color: var(--primary-color, #ff9900);
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(255, 153, 0, 0.3);
            }
            
            .footer-search-wrapper {
                margin-top: 0;
            }
            
            .footer-search-input-container {
                position: relative;
                display: flex;
                align-items: center;
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 0;
                padding: 0.6rem 1rem;
                transition: all 0.3s ease;
            }
            
            .footer-search-input-container.focused {
                border-color: var(--primary-color, #ff9900);
                box-shadow: 0 0 0 3px rgba(255, 153, 0, 0.1);
            }
            
            .footer-search-icon {
                color: #9ca3af;
                font-size: 0.9rem;
                margin-right: 0.75rem;
                transition: color 0.3s ease;
            }
            
            .footer-search-input-container.focused .footer-search-icon {
                color: var(--primary-color, #ff9900);
            }
            
            .footer-search-input {
                flex: 1;
                border: none;
                outline: none;
                font-size: 0.85rem;
                background: transparent;
                color: #374151;
                font-weight: 500;
            }
            
            .footer-search-input::placeholder {
                color: #9ca3af;
                font-weight: 400;
            }
            
            .footer-search-clear {
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                padding: 0.25rem;
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
                color: #dc2626;
                background: #fee2e2;
            }
            
            .footer-credits {
                color: #6b7280;
                font-size: 0.8rem;
                line-height: 1.3;
            }
            
            .footer-credits p {
                margin: 0 0 0.4rem;
                padding: 0;
                line-height: 1.3;
            }
            
            .footer-credits a {
                color: var(--primary-color, #ff9900);
                text-decoration: none;
                font-weight: 600;
                transition: color 0.3s ease;
            }
            
            .footer-credits a:hover {
                color: var(--primary-color-dark, #e68900);
                text-decoration: underline;
            }
            
            .privacy-link {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.4rem 0.8rem;
                background: #f3f4f6;
                border-radius: 0;
                transition: all 0.3s ease;
                margin: 0.4rem 0 0;
                font-size: 0.75rem;
            }
            
            .privacy-link:hover {
                background: #e5e7eb;
                transform: translateY(-1px);
            }
            
            @media (max-width: 1024px) {
                .footer-content-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.25rem;
                }
                
                .modal-footer {
                    max-height: 65vh;
                }
                
                .modal-footer-close-tab {
                    top: 0px;
                    padding: 6px 16px;
                    min-width: 46px;
                }
            }
            
            @media (max-width: 768px) {
                .footer-toggle-tab {
                    bottom: 0px;
                    right: 15px;
                    width: 44px;
                    height: 30px;
                }
                
                .modal-footer {
                    max-height: 70vh;
                }
                
                .modal-footer-close-tab {
                    top: -32px;
                    padding: 6px 12px;
                    min-width: 70px;
                }
                
                .close-tab-text {
                    font-size: 0.75rem;
                }
                
                .modal-footer-header {
                    padding: 0.75rem 1.5rem;
                }
                
                .modal-footer-title {
                    font-size: 1.1rem;
                }
                
                .modal-footer-content {
                    padding: 1rem 1.5rem 1.25rem;
                }
                
                .footer-content-grid {
                    grid-template-columns: 1fr;
                    gap: 1.25rem;
                }
                
                .footer-section {
                    padding: 1rem;
                    min-height: 180px;
                }
            }
            
            @media (max-width: 480px) {
                .footer-toggle-tab {
                    bottom: 0px;
                    right: 10px;
                    width: 42px;
                    height: 28px;
                }
                
                .modal-footer {
                    max-height: 75vh;
                }
                
                .modal-footer-close-tab {
                    top: 0px;
                    padding: 4px 8px;
                    min-width: 50px;
                }
                
                .close-tab-text {
                    display: none;
                }
                
                .modal-footer-header {
                    padding: 0.75rem 1rem;
                }
                
                .modal-footer-content {
                    padding: 1rem;
                }
                
                .footer-section {
                    padding: 0.75rem;
                    min-height: 160px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ========================================
// FUNZIONI PRIVACY
// ========================================

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
            .privacy-popup { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10001; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; }
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
// FUNZIONI SOCIAL SHARING (FALLBACK)
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


// ========================================
// UTILITY GLOBALI
// ========================================

window.openModalFooter = openModalFooter;
window.closeModalFooter = closeModalFooter;
window.toggleModalFooter = toggleModalFooter;
window.openSharePopup = openSharePopup;
window.closeSharePopup = closeSharePopup;
window.showPrivacySettings = showPrivacySettings;


/*!
 * PalermoHub Mobile Fixes
 * Correzioni per problemi di formattazione mobile
 * Copyright (c) 2025 PalermoHub Team
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('[PalermoHub] Applicando fix mobile...');
    
    // Fix 1: Unifica la formattazione dei paragrafi
    applyParagraphFixes();
    
    // Fix 2: Assicura dimensioni corrette del footer button
    applyFooterButtonFixes();
    
    // Fix 3: Monitora cambiamenti dinamici
    setupDynamicFixMonitoring();
    
    console.log('[PalermoHub] Fix mobile applicati con successo');
});

/**
 * Fix 1: Unifica la formattazione dei paragrafi nella home page
 */
function applyParagraphFixes() {
    // Trova tutti i paragrafi che potrebbero avere problemi di formattazione
    const introPararagraphs = document.querySelectorAll('body > p, .search-controls p');
    
    introPararagraphs.forEach((paragraph, index) => {
        // Aggiungi la classe unificata se non è già presente
        if (!paragraph.classList.contains('intro-paragraph')) {
            paragraph.classList.add('intro-paragraph');
        }
        
        // Rimuovi stili inline che potrebbero causare conflitti
        paragraph.removeAttribute('style');
        
        console.log(`[PalermoHub] Paragrafo ${index + 1} aggiornato con classe unificata`);
    });
    
    // Assicurati che il separatore HR abbia lo stile corretto
    const hrElements = document.querySelectorAll('hr');
    hrElements.forEach(hr => {
        hr.style.width = '100%';
        hr.style.height = '2px';
        hr.style.background = 'linear-gradient(to right, transparent, var(--primary-color), transparent)';
        hr.style.margin = '.1rem 20px';
        hr.style.border = 'none';
    });
}

/**
 * Fix 2: Assicura le dimensioni corrette del footer button
 */
function applyFooterButtonFixes() {
    // Funzione per applicare le dimensioni corrette al footer button
    function fixFooterButtonSize() {
        const footerToggleTab = document.getElementById('footer-toggle-tab');
        
        if (footerToggleTab) {
            // Forza le dimensioni corrette in base al viewport
            const isMobile = window.innerWidth <= 768;
            const isSmallMobile = window.innerWidth <= 480;
            
            // Rimuovi tutti gli stili inline che potrebbero interferire
            footerToggleTab.removeAttribute('style');
            
            // Applica le dimensioni corrette tramite dataset per il CSS
            if (isSmallMobile) {
                footerToggleTab.setAttribute('data-size', 'small-mobile');
            } else if (isMobile) {
                footerToggleTab.setAttribute('data-size', 'mobile');
            } else {
                footerToggleTab.setAttribute('data-size', 'desktop');
            }
            
            // Forza il reflow per applicare i nuovi stili
            footerToggleTab.style.display = 'none';
            footerToggleTab.offsetHeight; // trigger reflow
            footerToggleTab.style.display = 'flex';
            
            console.log(`[PalermoHub] Footer button ridimensionato per ${isSmallMobile ? 'small mobile' : isMobile ? 'mobile' : 'desktop'}`);
        }
    }
    
    // Applica il fix immediatamente
    fixFooterButtonSize();
    
    // Applica il fix anche quando la finestra viene ridimensionata
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(fixFooterButtonSize, 100);
    });
    
    // Monitora l'inserimento dinamico del footer button
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1 && (node.id === 'footer-toggle-tab' || node.classList?.contains('footer-toggle-tab'))) {
                    setTimeout(fixFooterButtonSize, 100);
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Fix 3: Monitora cambiamenti dinamici e riapplica i fix se necessario
 */
function setupDynamicFixMonitoring() {
    // Monitora cambiamenti che potrebbero richiedere di riapplicare i fix
    const observer = new MutationObserver(function(mutations) {
        let needsParagraphFix = false;
        let needsFooterFix = false;
        
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    // Controlla se sono stati aggiunti nuovi paragrafi
                    if (node.tagName === 'P' || node.querySelector('p')) {
                        needsParagraphFix = true;
                    }
                    
                    // Controlla se è stato aggiunto il footer button
                    if (node.id === 'footer-toggle-tab' || node.classList?.contains('footer-toggle-tab')) {
                        needsFooterFix = true;
                    }
                }
            });
        });
        
        // Riapplica i fix se necessario
        if (needsParagraphFix) {
            setTimeout(applyParagraphFixes, 100);
        }
        
        if (needsFooterFix) {
            setTimeout(applyFooterButtonFixes, 100);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Utility: Forza l'aggiornamento degli stili CSS
 */
function forceStyleUpdate() {
    // Crea un elemento style temporaneo per forzare il riprocessamento CSS
    const style = document.createElement('style');
    style.textContent = '/* Force CSS reprocess */';
    document.head.appendChild(style);
    
    setTimeout(() => {
        document.head.removeChild(style);
    }, 10);
}

/**
 * Utility: Debug info per verificare l'applicazione dei fix
 */
function logDebugInfo() {
    console.group('[PalermoHub Debug] Mobile Fixes Status');
    
    // Verifica paragrafi
    const paragraphs = document.querySelectorAll('.intro-paragraph');
    console.log(`Paragrafi con classe unificata: ${paragraphs.length}`);
    
    // Verifica footer button
    const footerButton = document.getElementById('footer-toggle-tab');
    if (footerButton) {
        const rect = footerButton.getBoundingClientRect();
        console.log(`Footer button dimensioni: ${rect.width}x${rect.height}`);
        console.log(`Footer button data-size: ${footerButton.getAttribute('data-size')}`);
    } else {
        console.log('Footer button non trovato');
    }
    
    // Verifica viewport
    console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
    console.log(`Mobile: ${window.innerWidth <= 768}`);
    
    console.groupEnd();
}

// Esponi le funzioni per debug (solo in development)
if (window.location.hostname === 'localhost' || window.location.search.includes('debug=true')) {
    window.PalermoHubDebug = {
        applyParagraphFixes,
        applyFooterButtonFixes,
        logDebugInfo,
        forceStyleUpdate
    };
}

// Auto-debug ogni 5 secondi in modalità debug
if (window.location.search.includes('debug=true')) {
    setInterval(logDebugInfo, 5000);
}