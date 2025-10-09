// Footer Modal Management - VERSIONE MOBILE-COMPATIBLE FIXED
(function() {
    'use strict';
    
    let isModalOpen = false;
    let activeTooltip = null;
    
    // ModalManager globale migliorato
    const ModalManager = window.ModalManager || {
        activeModals: new Set(),
        open(id) { 
            this.activeModals.add(id);
            // Usa 'other-modal-open' invece di 'modal-open' per footer-modal
            if (id !== 'footer-modal' && id !== 'chart-builder-modal') {
                document.body.classList.add('other-modal-open');
            }
        },
        close(id) { 
            this.activeModals.delete(id);
            if (this.activeModals.size === 0) {
                document.body.classList.remove('other-modal-open');
                document.body.classList.remove('modal-open');
            }
        },
        isAnyOpen() { return this.activeModals.size > 0; }
    };
    
    // Esponi ModalManager globalmente
    window.ModalManager = ModalManager;
    
    function init() {
        console.log('Footer Modal: Inizializzazione...');
        setupEventListeners();
        initializeTooltips();
    }
    
    function setupEventListeners() {
        const footerBtn = document.getElementById('footer-info-btn');
        const footerModal = document.getElementById('footer-modal');
        const footerOverlay = document.getElementById('footer-modal-overlay');
        const closeBtn = document.getElementById('footer-modal-close');
        const backToTopBtn = document.getElementById('back-to-top-btn');
        const modalContent = document.querySelector('.footer-modal-content');
        
        if (!footerBtn || !footerModal || !footerOverlay) {
            console.error('Footer Modal: Elementi non trovati nel DOM');
            return;
        }
        
        // ========================================
        // PULSANTE APERTURA - GESTIONE TOUCH MIGLIORATA
        // ========================================
        let touchStartTime = 0;
        let touchMoved = false;
        let touchStartY = 0;
        let isProcessing = false;
        
        // Rimuovi tutti i listener esistenti
        const newFooterBtn = footerBtn.cloneNode(true);
        footerBtn.parentNode.replaceChild(newFooterBtn, footerBtn);
        
        // Desktop click
        newFooterBtn.addEventListener('click', function(e) {
            if (isProcessing) return;
            e.preventDefault();
            e.stopPropagation();
            console.log('Footer Modal: Click desktop');
            toggleModal();
        });
        
        // Mobile touch start
        newFooterBtn.addEventListener('touchstart', function(e) {
            touchStartTime = Date.now();
            touchMoved = false;
            touchStartY = e.touches[0].clientY;
            console.log('Footer Modal: Touch start');
            
            // Feedback visivo immediato
            newFooterBtn.style.transform = 'translateX(-50%) scale(0.95)';
        }, { passive: true });
        
        // Mobile touch move
        newFooterBtn.addEventListener('touchmove', function(e) {
            const touchCurrentY = e.touches[0].clientY;
            if (Math.abs(touchCurrentY - touchStartY) > 10) {
                touchMoved = true;
                // Ripristina feedback visivo se si muove
                newFooterBtn.style.transform = 'translateX(-50%) scale(1)';
            }
        }, { passive: true });
        
        // Mobile touch end - CRITICO
        newFooterBtn.addEventListener('touchend', function(e) {
            if (isProcessing) {
                console.log('Footer Modal: Touch già in elaborazione, ignoro');
                return;
            }
            
            const touchDuration = Date.now() - touchStartTime;
            
            console.log('Footer Modal: Touch end', {
                moved: touchMoved,
                duration: touchDuration
            });
            
            // Ripristina feedback visivo
            newFooterBtn.style.transform = 'translateX(-50%) scale(1)';
            
            if (!touchMoved && touchDuration < 500) {
                isProcessing = true;
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Footer Modal: Touch valido - toggle modal');
                toggleModal();
                
                // Reset flag dopo 500ms
                setTimeout(() => {
                    isProcessing = false;
                }, 500);
            }
        }, { passive: false });
        
        // Touch cancel
        newFooterBtn.addEventListener('touchcancel', function() {
            console.log('Footer Modal: Touch cancel');
            newFooterBtn.style.transform = 'translateX(-50%) scale(1)';
            isProcessing = false;
        }, { passive: true });
        
        // ========================================
        // TAB SWITCHING
        // ========================================
        document.querySelectorAll('.footer-tab').forEach(tab => {
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
            
            newTab.addEventListener('click', () => switchTab(newTab.dataset.tab));
            
            newTab.addEventListener('touchend', function(e) {
                e.preventDefault();
                switchTab(newTab.dataset.tab);
            }, { passive: false });
        });
        
        // ========================================
        // PULSANTE CHIUSURA
        // ========================================
        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            
            newCloseBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            });
            
            newCloseBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            }, { passive: false });
        }
        
        // ========================================
        // OVERLAY
        // ========================================
        if (footerOverlay) {
            footerOverlay.addEventListener('click', closeModal);
            footerOverlay.addEventListener('touchend', function(e) {
                e.preventDefault();
                closeModal();
            }, { passive: false });
        }
        
        // ========================================
        // BACK TO TOP
        // ========================================
        if (backToTopBtn && modalContent) {
            modalContent.addEventListener('scroll', () => {
                if (modalContent.scrollTop > 200) {
                    backToTopBtn.classList.add('show');
                } else {
                    backToTopBtn.classList.remove('show');
                }
            });
            
            backToTopBtn.addEventListener('click', () => {
                modalContent.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
            
            backToTopBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                modalContent.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }, { passive: false });
        }
        
        // ========================================
        // KEYBOARD
        // ========================================
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal();
            }
            if (e.key === 'Escape' && activeTooltip) {
                closeTooltip();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (activeTooltip && !e.target.closest('.as-is-term') && !e.target.closest('.as-is-tooltip')) {
                closeTooltip();
            }
        });
    }
    
    function initializeTooltips() {
        const asIsTerms = document.querySelectorAll('.as-is-term');
        
        asIsTerms.forEach(term => {
            term.style.cursor = 'help';
            term.style.textDecoration = 'underline dotted';
            term.style.textDecorationColor = '#666';
            
            term.addEventListener('click', (e) => {
                e.stopPropagation();
                showTooltip(term);
            });
            
            term.addEventListener('mouseenter', () => {
                term.style.textDecorationColor = '#0066cc';
            });
            
            term.addEventListener('mouseleave', () => {
                term.style.textDecorationColor = '#666';
            });
        });
    }
    
    function showTooltip(element) {
        closeTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'as-is-tooltip';
        tooltip.innerHTML = `
            <div class="as-is-tooltip-content">
                <button class="as-is-tooltip-close" aria-label="Chiudi">&times;</button>
                <h4>Cosa significa "as is"?</h4>
                <p>I dati sono forniti <strong>"as is"</strong> (letteralmente "così come sono") significa che:</p>
                <ul>
                    <li>Le informazioni sono presentate nel loro stato attuale, senza modifiche o verifiche aggiuntive</li>
                    <li>Non viene fornita alcuna garanzia sulla loro accuratezza, completezza o aggiornamento</li>
                    <li>L'utente accetta i dati nella loro forma originale e si assume la responsabilità del loro utilizzo</li>
                    <li>Il fornitore non è responsabile per eventuali errori o omissioni nei dati</li>
                </ul>
                <p class="as-is-note">⚠️ Si consiglia sempre di verificare i dati critici prima dell'utilizzo.</p>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        positionTooltip(tooltip, element);
        
        const closeBtn = tooltip.querySelector('.as-is-tooltip-close');
        closeBtn.addEventListener('click', closeTooltip);
        
        setTimeout(() => {
            tooltip.classList.add('show');
        }, 10);
        
        activeTooltip = tooltip;
    }
    
    function positionTooltip(tooltip, element) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top = rect.bottom + window.scrollY + 10;
        let left = rect.left + window.scrollX;
        
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 20;
        }
        
        if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
            top = rect.top + window.scrollY - tooltipRect.height - 10;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }
    
    function closeTooltip() {
        if (activeTooltip) {
            activeTooltip.classList.remove('show');
            setTimeout(() => {
                if (activeTooltip && activeTooltip.parentNode) {
                    activeTooltip.parentNode.removeChild(activeTooltip);
                }
                activeTooltip = null;
            }, 300);
        }
    }
    
    function toggleModal() {
        console.log('Footer Modal: Toggle chiamato, stato attuale:', isModalOpen);
        if (isModalOpen) {
            closeModal();
        } else {
            openModal();
        }
    }
    
    function openModal() {
        console.log('Footer Modal: Apertura modale...');
        
        // Chiudi chart builder se aperto
        const chartBuilderModal = document.getElementById('chart-builder-modal');
        if (chartBuilderModal && chartBuilderModal.classList.contains('show')) {
            console.log('Footer Modal: Chart Builder aperto, chiusura...');
            if (typeof window.closeChartBuilder === 'function') {
                window.closeChartBuilder();
            } else {
                chartBuilderModal.classList.remove('show');
            }
            setTimeout(continueOpenFooterModal, 100);
            return;
        }
        
        // Chiudi analytics panel se aperto
        const analyticsPanel = document.getElementById('analytics-panel');
        if (analyticsPanel && analyticsPanel.classList.contains('open')) {
            console.log('Footer Modal: Analytics panel aperto, chiusura...');
            analyticsPanel.classList.remove('open');
            document.body.classList.remove('analytics-panel-open');
            setTimeout(continueOpenFooterModal, 100);
            return;
        }
        
        continueOpenFooterModal();
    }
    
    function continueOpenFooterModal() {
        const modal = document.getElementById('footer-modal');
        const overlay = document.getElementById('footer-modal-overlay');
        const btn = document.getElementById('footer-info-btn');
        
        if (!modal || !overlay || !btn) {
            console.error('Footer Modal: Elementi non trovati');
            return;
        }
        
        // Imposta z-index espliciti
        modal.style.zIndex = '10000';
        overlay.style.zIndex = '9999';
        
        // Apri modal
        modal.classList.add('open');
        overlay.classList.add('show');
        
        // NON nascondere il pulsante con display:none, ma con opacity
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
        btn.style.transform = 'translateX(-50%) scale(0.8)';
        
        isModalOpen = true;
        
        // Registra nel ModalManager (NON aggiunge body.modal-open)
        ModalManager.open('footer-modal');
        
        console.log('Footer Modal: Modale aperta', {
            modalOpen: modal.classList.contains('open'),
            overlayShow: overlay.classList.contains('show'),
            zIndexModal: modal.style.zIndex,
            zIndexOverlay: overlay.style.zIndex
        });
        
        // Re-inizializza tooltips
        setTimeout(initializeTooltips, 100);
		
		// Genera URL se il tab condividi è già attivo
    setTimeout(() => {
        const activeTab = document.querySelector('.footer-tab.active');
        if (activeTab && activeTab.dataset.tab === 'condividi') {
            generateShareUrl();
            console.log('✅ URL generato all\'apertura del modal (tab condividi attivo)');
        }
    }, 500);
		
    }
    
    function closeModal() {
        console.log('Footer Modal: Chiusura modale...');
        
        const modal = document.getElementById('footer-modal');
        const overlay = document.getElementById('footer-modal-overlay');
        const btn = document.getElementById('footer-info-btn');
        const backToTopBtn = document.getElementById('back-to-top-btn');
        
        if (!modal || !overlay || !btn) {
            console.error('Footer Modal: Elementi non trovati per chiusura');
            return;
        }
        
        // Chiudi modal
        modal.classList.remove('open');
        overlay.classList.remove('show');
        
        if (backToTopBtn) {
            backToTopBtn.classList.remove('show');
        }
        
        closeTooltip();
        
        // Ripristina pulsante con animazione
        setTimeout(() => {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            btn.style.transform = 'translateX(-50%) scale(1)';
        }, 400);
        
        isModalOpen = false;
        
        // Deregistra dal ModalManager
        ModalManager.close('footer-modal');
        
        console.log('Footer Modal: Modale chiusa');
    }
    
	
function switchTab(tabName) {
    console.log('Footer Modal: Switch tab:', tabName);
    
    document.querySelectorAll('.footer-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.footer-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedContent = document.getElementById(`tab-${tabName}`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
    
    closeTooltip();
    
    const modalContent = document.querySelector('.footer-modal-content');
    if (modalContent) {
        modalContent.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    setTimeout(initializeTooltips, 100);
    
    // ✅ AGGIUNGI QUESTO: Genera URL quando si apre il tab condividi
    if (tabName === 'condividi') {
        setTimeout(() => {
            generateShareUrl();
            console.log('✅ URL generato per tab condividi');
        }, 200);
    }
}
  
// Esponi funzioni globalmente
    window.footerModalDebug = {
        isOpen: () => isModalOpen,
        open: openModal,
        close: closeModal,
        toggle: toggleModal
    };
    
    // ✅ AGGIUNGI QUESTE RIGHE
    window.copyFooterShareUrl = copyFooterShareUrl;
    window.generateShareUrl = generateShareUrl;
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('Footer Modal script caricato e inizializzato');
	
	
	// ========================================
    // SISTEMA CONDIVISIONE
    // ========================================
   
function initShareSystem() {
    console.log('🚀 Inizializzazione sistema condivisione');
    
    const shareUrlInput = document.getElementById('footer-share-url-input');
    const copyBtn = document.getElementById('footer-copy-share-url');
    
    if (shareUrlInput && copyBtn) {
        // Rimuovi listener esistenti
        const newCopyBtn = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
        
        // Aggiungi nuovo listener
        newCopyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            copyFooterShareUrl();
        });
        
        console.log('✅ Event listener copia URL aggiunto');
    } else {
        console.error('❌ Elementi condivisione non trovati:', {
            input: !!shareUrlInput,
            button: !!copyBtn
        });
    }
    
    // Genera URL quando si clicca sul tab
    const condividiTab = document.querySelector('[data-tab="condividi"]');
    if (condividiTab) {
        condividiTab.addEventListener('click', () => {
            setTimeout(generateShareUrl, 300);
        });
        console.log('✅ Event listener tab condividi aggiunto');
    }
}
	
function generateShareUrl() {
    console.log('🔗 generateShareUrl chiamata');
    
    const shareUrlInput = document.getElementById('footer-share-url-input');
    if (!shareUrlInput) {
        console.error('❌ Input URL non trovato');
        return;
    }
    
    // ✅ USA DIRETTAMENTE L'URL DEL BROWSER (che include già filtri + hash MapLibre)
    const fullUrl = window.location.href;
    
    console.log('✅ URL generato:', fullUrl);
    
    shareUrlInput.value = fullUrl;
    
    // Verifica se ci sono filtri attivi
    const hasFilters = window.location.search && window.location.search.length > 1;
    shareUrlInput.placeholder = hasFilters ? 'URL con filtri attivi' : 'URL della vista corrente';
}
	
	async function copyFooterShareUrl() {
    console.log('📋 Tentativo di copia URL');
    
    const urlInput = document.getElementById('footer-share-url-input');
    const copyBtn = document.getElementById('footer-copy-share-url');
    const feedback = document.getElementById('footer-copy-feedback');
    
    if (!urlInput) {
        console.error('❌ Input URL non trovato');
        return;
    }
    
    if (!urlInput.value || urlInput.value === '' || urlInput.value === 'Generando link...') {
        console.warn('⚠️ Nessun URL da copiare, genero prima l\'URL');
        generateShareUrl();
        
        // Aspetta che l'URL sia generato
        setTimeout(() => copyFooterShareUrl(), 100);
        return;
    }
    
    console.log('📝 URL da copiare:', urlInput.value);
    
    try {
        // Metodo 1: Clipboard API (moderno)
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(urlInput.value);
            console.log('✅ Copiato con Clipboard API');
        } 
        // Metodo 2: execCommand (fallback)
        else {
            urlInput.select();
            urlInput.setSelectionRange(0, 99999); // Per mobile
            const success = document.execCommand('copy');
            console.log('✅ Copiato con execCommand:', success);
            
            if (!success) {
                throw new Error('execCommand failed');
            }
        }
        
        // Feedback visivo sul pulsante
        if (copyBtn) {
            const originalHTML = copyBtn.innerHTML;
            const originalBg = copyBtn.style.background;
            
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.style.background = '#10b981';
            copyBtn.disabled = true;
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.background = originalBg;
                copyBtn.disabled = false;
            }, 2000);
        }
        
        // Feedback testuale
        if (feedback) {
            feedback.textContent = '✅ Link copiato negli appunti!';
            feedback.style.color = '#10b981';
            feedback.style.fontWeight = '600';
            feedback.style.opacity = '1';
            
            setTimeout(() => {
                feedback.style.opacity = '0';
                setTimeout(() => {
                    feedback.textContent = '';
                }, 300);
            }, 3000);
        }
        
    } catch (err) {
        console.error('❌ Errore nella copia:', err);
        
        // Fallback: mostra messaggio per copia manuale
        if (feedback) {
            feedback.textContent = '⚠️ Seleziona il testo e premi CTRL+C (o CMD+C su Mac)';
            feedback.style.color = '#ff9900';
            feedback.style.fontWeight = '600';
            feedback.style.opacity = '1';
            
            // Seleziona automaticamente il testo per facilitare la copia manuale
            urlInput.focus();
            urlInput.select();
            urlInput.setSelectionRange(0, 99999);
            
            setTimeout(() => {
                feedback.style.opacity = '0';
                setTimeout(() => {
                    feedback.textContent = '';
                }, 300);
            }, 5000);
        }
    }
}

	
    window.shareOnSocial = function(platform) {
        generateShareUrl();
        
        const urlInput = document.getElementById('footer-share-url-input');
        if (!urlInput || !urlInput.value) return;
        
        const shareUrl = urlInput.value;
        const title = 'Incidenti Stradali Palermo 2015-2023 - Dashboard Interattiva';
        
        let socialUrl;
        switch (platform) {
            case 'facebook':
                socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`;
                break;
            case 'twitter':
                socialUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}&hashtags=OpenData,Palermo,Sicilia`;
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
                const emailBody = encodeURIComponent(`Ciao,\n\nHo trovato questa dashboard interattiva sugli incidenti stradali a Palermo che volevo condividere con te:\n\n${shareUrl}\n\nBuona esplorazione!`);
                socialUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
                break;
            default:
                return;
        }
        
        if (platform === 'email') {
            window.location.href = socialUrl;
        } else {
            window.open(socialUrl, '_blank', 'width=600,height=400');
        }
    };
    
    // Esponi funzioni globalmente
    window.footerModalDebug = {
        isOpen: () => isModalOpen,
        open: openModal,
        close: closeModal,
        toggle: toggleModal
    };
	
})();