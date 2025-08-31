// ==========================================
// MENU DASHBOARD - JAVASCRIPT COMPLETO
// ==========================================

// Variabili globali per gestire lo stato del menu
let isDashboardOpen = false;
let isAnimating = false;

// Inizializzazione quando la pagina è caricata
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    addEventListeners();
    addHoverEffects();
});

// ==========================================
// FUNZIONI PRINCIPALI DEL MENU
// ==========================================

/**
 * Inizializza il dashboard e imposta gli stili di base
 */
function initializeDashboard() {
    const menu = document.getElementById('dashboardMenu');
    const overlay = document.getElementById('overlay');
    
    if (menu) {
        menu.style.display = 'none';
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(-20px) scale(0.95)';
        menu.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    if (overlay) {
        overlay.style.display = 'none';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
    }
    
    console.log('Dashboard inizializzato correttamente');
}

/**
 * Funzione principale per aprire/chiudere il dashboard
 */
function toggleDashboard() {
    if (isAnimating) return; // Previene click multipli durante l'animazione
    
    if (isDashboardOpen) {
        closeDashboard();
    } else {
        openDashboard();
    }
}

/**
 * Apre il dashboard con animazione
 */
function openDashboard() {
    isAnimating = true;
    isDashboardOpen = true;
    
    const menu = document.getElementById('dashboardMenu');
    const overlay = document.getElementById('overlay');
    const button = document.querySelector('.dashboard-trigger');
    
    // Mostra overlay
    if (overlay) {
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.style.opacity = '0.5';
        }, 10);
    }
    
    // Anima il pulsante
    if (button) {
        button.style.transform = 'scale(1.1) rotate(180deg)';
        button.style.background = '#e55a2b';
    }
    
    // Mostra e anima il menu
    if (menu) {
        menu.style.display = 'block';
        setTimeout(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'translateY(0) scale(1)';
        }, 10);
    }
    
    // Reset animating flag
    setTimeout(() => {
        isAnimating = false;
    }, 300);
    
    console.log('Dashboard aperto');
}

/**
 * Chiude il dashboard con animazione
 */
function closeDashboard() {
    isAnimating = true;
    isDashboardOpen = false;
    
    const menu = document.getElementById('dashboardMenu');
    const overlay = document.getElementById('overlay');
    const button = document.querySelector('.dashboard-trigger');
    
    // Anima il pulsante
    if (button) {
        button.style.transform = 'scale(1) rotate(0deg)';
        button.style.background = '#ff6b35';
    }
    
    // Nasconde overlay
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
    
    // Anima e nasconde il menu
    if (menu) {
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(-20px) scale(0.95)';
        setTimeout(() => {
            menu.style.display = 'none';
        }, 300);
    }
    
    // Reset animating flag
    setTimeout(() => {
        isAnimating = false;
    }, 300);
    
    console.log('Dashboard chiuso');
}

/**
 * Chiude tutti i menu aperti
 */
function closeAllMenus() {
    if (isDashboardOpen) {
        closeDashboard();
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

/**
 * Aggiunge tutti gli event listeners necessari
 */
function addEventListeners() {
    
    // Click fuori dal menu per chiuderlo
    document.addEventListener('click', function(event) {
        const menu = document.getElementById('dashboardMenu');
        const button = document.querySelector('.dashboard-trigger');
        const closeButton = document.querySelector('.dashboard-close');
        
        // Se il menu è aperto e il click è fuori dal menu e dal pulsante
        if (isDashboardOpen && 
            menu && !menu.contains(event.target) && 
            button && !button.contains(event.target) &&
            closeButton && !closeButton.contains(event.target)) {
            closeDashboard();
        }
    });
    
    // Chiusura con tasto ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && isDashboardOpen) {
            closeDashboard();
        }
    });
    
    // Click sull'overlay per chiudere
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', closeDashboard);
    }
    
    // Previeni la chiusura quando si clicca dentro il menu
    const menu = document.getElementById('dashboardMenu');
    if (menu) {
        menu.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
    
    console.log('Event listeners aggiunti');
}

/**
 * Aggiunge effetti hover ai link del menu
 */
function addHoverEffects() {
    const widgetLinks = document.querySelectorAll('.widget-link');
    
    widgetLinks.forEach(link => {
        // Hover in
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            this.style.background = 'rgba(255,255,255,1)';
        });
        
        // Hover out
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
            this.style.background = 'rgba(255,255,255,0.8)';
        });
    });
    
    console.log('Effetti hover aggiunti ai widget links');
}

// ==========================================
// FUNZIONI UTILITY
// ==========================================

/**
 * Controlla se il menu è attualmente aperto
 */
function isDashboardMenuOpen() {
    return isDashboardOpen;
}

/**
 * Forza la chiusura del menu (utile per chiamate esterne)
 */
function forceDashboardClose() {
    if (isDashboardOpen) {
        closeDashboard();
    }
}

/**
 * Forza l'apertura del menu (utile per chiamate esterne)
 */
function forceDashboardOpen() {
    if (!isDashboardOpen) {
        openDashboard();
    }
}

/**
 * Ridimensiona il menu in base alla dimensione della finestra
 */
function resizeDashboard() {
    const menu = document.getElementById('dashboardMenu');
    if (!menu) return;
    
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Adatta il menu per schermi piccoli
    if (windowWidth < 768) {
        menu.style.right = '10px';
        menu.style.left = '10px';
        menu.style.maxWidth = 'none';
        menu.style.maxHeight = (windowHeight * 0.8) + 'px';
    } else {
        menu.style.right = '20px';
        menu.style.left = 'auto';
        menu.style.maxWidth = '400px';
        menu.style.maxHeight = '70vh';
    }
}

// Event listener per il ridimensionamento della finestra
window.addEventListener('resize', resizeDashboard);

// ==========================================
// ANIMAZIONI AVANZATE (OPZIONALE)
// ==========================================

/**
 * Aggiunge animazione di "pulse" al pulsante quando ci sono notifiche
 */
function addPulseAnimation() {
    const button = document.querySelector('.dashboard-trigger');
    if (!button) return;
    
    button.style.animation = 'pulse 2s infinite';
    
    // CSS per l'animazione (da aggiungere al CSS)
    if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.textContent = `
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(255, 107, 53, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0); }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Rimuove l'animazione di pulse
 */
function removePulseAnimation() {
    const button = document.querySelector('.dashboard-trigger');
    if (button) {
        button.style.animation = 'none';
    }
}

// ==========================================
// FUNZIONI DI DEBUG (OPZIONALE)
// ==========================================

/**
 * Funzione di debug per testare il menu
 */
function debugDashboard() {
    console.log('=== DEBUG DASHBOARD ===');
    console.log('Menu aperto:', isDashboardOpen);
    console.log('Animazione in corso:', isAnimating);
    console.log('Elemento menu:', document.getElementById('dashboardMenu'));
    console.log('Elemento overlay:', document.getElementById('overlay'));
    console.log('Pulsante trigger:', document.querySelector('.dashboard-trigger'));
    console.log('=====================');
}

// Esponi funzioni globalmente per uso esterno
window.toggleDashboard = toggleDashboard;
window.closeAllMenus = closeAllMenus;
window.isDashboardMenuOpen = isDashboardMenuOpen;
window.forceDashboardClose = forceDashboardClose;
window.forceDashboardOpen = forceDashboardOpen;
window.debugDashboard = debugDashboard;

console.log('Menu Dashboard JavaScript caricato correttamente!');