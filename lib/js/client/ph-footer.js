// footer.js - Inserisce il footer in tutte le pagine
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
            <div class="footer-credits">
                <strong>Autore</strong> <a href="https://opendatasicilia.it" title="@opendatasicilia" target="_blank">@opendatasicilia</a><br>
                <strong>Sviluppo:</strong> <a href="https://www.linkedin.com/in/gbvitrano/" title="@gbvitrano" target="_blank">@gbvitrano</a> - <a href="https://claude.ai" target="_blank">Claude AI (Anthropic)</a><br>
                <strong>Licenza:</strong> <a href="https://creativecommons.org/licenses/by-sa/4.0/" title="Attribuzione-CondividiAlloStessoModo 4.0 Internazionale" target="_blank">CC BY-SA 4.0</a>               
            </div>
        </div>
    `;
    
    // Inserisci il footer alla fine del body
    document.body.appendChild(footer);
});