// header.js - Inserisce l'header in tutte le pagine
document.addEventListener('DOMContentLoaded', function() {
    // Crea l'elemento header
    const header = document.createElement('header');
    header.className = 'header';
    
    header.innerHTML = `
        <div class="header-content">
            <div class="logo">
                <h1></h1><img src="legend/pa_hub000.png" alt="PalermoHub" title="PalermoHub by opendadatasicilia.it" width="224" height="45" border="0">
            </div>
            <nav>
                <ul class="nav-links">
                    <li><a href="index.html" Title="Home - PalermoHub">Home</a></li>
                    <li><a href="wiki.html" title="Funzionalità avanzate di ricerca e filtraggio" target="_parent">Funzionalità avanzate</a></li>
                    <li><a href="geolocalizza.html" title="Geocodifica il tuo indirizzo" target="_parent">Geocodifica il tuo indirizzo</a></li>
                    <li><a href="strumenti.html" title="I principali strumenti usati per realizzare le mappe" target="_parent">Strumenti</a></li>
                    <li><a href="info.html" title="Informativa privacy estesa" target="_parent">Privacy</a></li>
                    <li><a href="about.html" title="About" target="_parent">About</a></li>
                </ul>
            </nav>
        </div>
    `;
    
    // Inserisci l'header all'inizio del body
    document.body.insertBefore(header, document.body.firstChild);
    
    // Aggiungi il CSS se non è già stato aggiunto
    if (!document.getElementById('palermohub-styles')) {
        const link = document.createElement('link');
        link.id = 'palermohub-styles';
        link.rel = 'stylesheet';
        link.href = 'styles.css';
        document.head.appendChild(link);
    }
});