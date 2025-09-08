// Variabili globali
        let map;
        let comuniLayer;
        let comuniData = [];
        let candidatureData = [];
        let currentFilters = {
            regione: '',
            provincia: '',
            comune: '',
            avviso: ''
        };
        let tooltip;
        let updateInterval;

        // Variabili per la vista iniziale della mappa
        let initialMapView = {
            center: null,
            zoom: null
        };

        // Variabili per la tabella dati
        let currentTableData = [];
        let tableSortColumn = '';
        let tableSortDirection = 'asc';
        let currentPage = 1;
        let recordsPerPage = 50;

        // Funzioni per gestire il modal informativo
        function openInfoModal() {
            document.getElementById('infoModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeInfoModal() {
            document.getElementById('infoModal').classList.remove('active');
            document.body.style.overflow = '';
        }

        // Funzione per creare link CUP
        function createCupLink(cupCode) {
            if (!cupCode || cupCode === '-' || cupCode.trim() === '') {
                return '-';
            }
            
            const baseUrl = 'https://www.opencup.gov.it/portale/it/web/opencup/home/progetto/-/cup/';
            const fullUrl = baseUrl + encodeURIComponent(cupCode);
            
            return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none; font-weight: 500;" title="Apri dettaglio progetto OpenCUP">${cupCode}</a>`;
        }

        // Mappatura nomi regioni ai codici per i colori
        const regionNameToCode = {
            'Piemonte': '1',
            'Valle d\'Aosta/Vallée d\'Aoste': '2',
            'Lombardia': '3',
            'Trentino-Alto Adige/Südtirol': '4',
            'Veneto': '5',
            'Friuli-Venezia Giulia': '6',
            'Liguria': '7',
            'Emilia-Romagna': '8',
            'Toscana': '9',
            'Umbria': '10',
            'Marche': '11',
            'Lazio': '12',
            'Abruzzo': '13',
            'Molise': '14',
            'Campania': '15',
            'Puglia': '16',
            'Basilicata': '17',
            'Calabria': '18',
            'Sicilia': '19',
            'Sardegna': '20'
        };

        // Palette di colori moderna per le regioni
        const regionColors = {
            '1': '#EF4444',   // Piemonte - Rosso moderno
            '2': '#06B6D4',   // Valle d'Aosta - Ciano
            '3': '#3B82F6',   // Lombardia - Blu
            '4': '#10B981',   // Trentino-Alto Adige - Smeraldo
            '5': '#F59E0B',   // Veneto - Ambra
            '6': '#8B5CF6',   // Friuli-Venezia Giulia - Viola
            '7': '#14B8A6',   // Liguria - Teal
            '8': '#F97316',   // Emilia-Romagna - Arancione
            '9': '#A855F7',   // Toscana - Porpora
            '10': '#0EA5E9',  // Umbria - Sky
            '11': '#FB923C',  // Marche - Arancione chiaro
            '12': '#22C55E',  // Lazio - Verde
            '13': '#EC4899',  // Abruzzo - Rosa
            '14': '#6366F1',  // Molise - Indaco
            '15': '#84CC16',  // Campania - Lime
            '16': '#FBBF24',  // Puglia - Giallo
            '17': '#F87171',  // Basilicata - Rosa-rosso
            '18': '#60A5FA',  // Calabria - Blu chiaro
            '19': '#FACC15',  // Sicilia - Giallo intenso
            '20': '#34D399'   // Sardegna - Verde smeraldo
        };

        // Inizializzazione
        document.addEventListener('DOMContentLoaded', function() {
            // Setup menu mobile
            setupMobileMenu();
            
            initMap();
            loadData();
            setupTooltip();
            setupSearchFilters();
            
            // Gestisce il resize per responsiveness del grafico
            let resizeTimeout;
            window.addEventListener('resize', function() {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function() {
                    updateChart();
                }, 250);
                
                // Aggiorna la vista iniziale per il pulsante home
                clearTimeout(window.resizeMapTimeout);
                window.resizeMapTimeout = setTimeout(function() {
                    const isMobile = window.innerWidth <= 992;
                    const newInitialZoom = isMobile ? 5 : 6;
                    const newInitialCenter = isMobile ? [42.5, 12.5] : [41.9028, 12.4964];
                    
                    // Aggiorna la vista iniziale per il pulsante home
                    initialMapView.center = newInitialCenter;
                    initialMapView.zoom = newInitialZoom;
                }, 250);
            });

            // Gestione chiusura modal con ESC
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    closeDataModal();
                    closeInfoModal();
                }
            });
        });

        // ========== FUNZIONI PER LA TABELLA DATI ==========

        function openDataModal() {
            updateTableData();
            document.getElementById('dataModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeDataModal() {
            document.getElementById('dataModal').classList.remove('active');
            document.body.style.overflow = '';
        }

        function updateTableData() {
            // Ottieni i dati filtrati
            currentTableData = getFilteredData();
            
            // Reset ordinamento e paginazione
            currentPage = 1;
            
            // Aggiorna conteggio record
            document.getElementById('tableRecordCount').textContent = 
                `${currentTableData.length} record trovati`;
            
            renderTable();
            renderPagination();
        }

        function renderTable() {
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';
            
            // Calcola record per la pagina corrente
            const startIndex = (currentPage - 1) * recordsPerPage;
            const endIndex = startIndex + recordsPerPage;
            const pageData = currentTableData.slice(startIndex, endIndex);
            
            pageData.forEach(record => {
                const row = document.createElement('tr');
                
                // Formatta le date
                const dataInvio = formatDate(record.data_invio_candidatura);
                const dataFinanziamento = formatDate(record.data_finanziamento);
                
                // Formatta l'importo
                const importo = formatCurrency(parseFloat(record.importo_finanziamento) || 0);
                
                // Tronca l'avviso se troppo lungo
                const avviso = record.avviso.length > 50 ? 
                    record.avviso.substring(0, 50) + '...' : record.avviso;
                
                // Crea link per il codice CUP
                const cupLink = createCupLink(record.codice_cup);
                
                row.innerHTML = `
                    <td title="${record.regione}">${record.regione}</td>
                    <td title="${record.provincia}">${record.provincia}</td>
                    <td title="${record.comune}">${record.comune}</td>
                    <td title="${record.codice_cup}">${cupLink}</td>
                    <td title="${record.avviso}">${avviso}</td>
                    <td title="${dataInvio}">${dataInvio}</td>
                    <td title="${dataFinanziamento}">${dataFinanziamento}</td>
                    <td title="${importo}">${importo}</td>
                `;
                
                tbody.appendChild(row);
            });
        }

        function renderPagination() {
            const totalPages = Math.ceil(currentTableData.length / recordsPerPage);
            const pagination = document.getElementById('tablePagination');
            pagination.innerHTML = '';
            
            if (totalPages <= 1) return;
            
            // Bottone Precedente
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pagination-btn';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.disabled = currentPage === 1;
            prevBtn.onclick = () => changePage(currentPage - 1);
            pagination.appendChild(prevBtn);
            
            // Calcola range di pagine da mostrare
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            // Prima pagina se necessario
            if (startPage > 1) {
                const firstBtn = document.createElement('button');
                firstBtn.className = 'pagination-btn';
                firstBtn.textContent = '1';
                firstBtn.onclick = () => changePage(1);
                pagination.appendChild(firstBtn);
                
                if (startPage > 2) {
                    const ellipsis = document.createElement('span');
                    ellipsis.textContent = '...';
                    ellipsis.className = 'pagination-info';
                    pagination.appendChild(ellipsis);
                }
            }
            
            // Pagine visibili
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'pagination-btn';
                if (i === currentPage) pageBtn.classList.add('active');
                pageBtn.textContent = i;
                pageBtn.onclick = () => changePage(i);
                pagination.appendChild(pageBtn);
            }
            
            // Ultima pagina se necessario
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    const ellipsis = document.createElement('span');
                    ellipsis.textContent = '...';
                    ellipsis.className = 'pagination-info';
                    pagination.appendChild(ellipsis);
                }
                
                const lastBtn = document.createElement('button');
                lastBtn.className = 'pagination-btn';
                lastBtn.textContent = totalPages;
                lastBtn.onclick = () => changePage(totalPages);
                pagination.appendChild(lastBtn);
            }
            
            // Info pagina
            const info = document.createElement('span');
            info.className = 'pagination-info';
            info.textContent = `Pagina ${currentPage} di ${totalPages}`;
            pagination.appendChild(info);
            
            // Bottone Successivo
            const nextBtn = document.createElement('button');
            nextBtn.className = 'pagination-btn';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.onclick = () => changePage(currentPage + 1);
            pagination.appendChild(nextBtn);
        }

        function changePage(page) {
            const totalPages = Math.ceil(currentTableData.length / recordsPerPage);
            if (page >= 1 && page <= totalPages) {
                currentPage = page;
                renderTable();
                renderPagination();
                
                // Scroll to top della tabella
                document.querySelector('.table-container').scrollTop = 0;
            }
        }

        function sortTable(column) {
            // Rimuovi classi di ordinamento precedenti
            document.querySelectorAll('.data-table th').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Determina direzione dell'ordinamento
            if (tableSortColumn === column) {
                tableSortDirection = tableSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                tableSortDirection = 'asc';
                tableSortColumn = column;
            }
            
            // Applica classe di ordinamento
            const header = document.querySelector(`th[onclick="sortTable('${column}')"]`);
            if (header) {
                header.classList.add(tableSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
            
            // Ordina i dati
            currentTableData.sort((a, b) => {
                let valueA = a[column] || '';
                let valueB = b[column] || '';
                
                // Gestione speciale per importi e date
                if (column === 'importo_finanziamento') {
                    valueA = parseFloat(valueA) || 0;
                    valueB = parseFloat(valueB) || 0;
                } else if (column.includes('data_')) {
                    valueA = new Date(valueA);
                    valueB = new Date(valueB);
                } else {
                    valueA = valueA.toString().toLowerCase();
                    valueB = valueB.toString().toLowerCase();
                }
                
                if (tableSortDirection === 'asc') {
                    return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
                } else {
                    return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
                }
            });
            
            // Reset alla prima pagina e re-render
            currentPage = 1;
            renderTable();
            renderPagination();
        }

        function downloadFilteredCSV() {
            if (currentTableData.length === 0) {
                alert('Nessun dato da scaricare');
                return;
            }

            // Colonne da includere nel CSV
            const columns = [
                'regione',
                'provincia', 
                'comune',
                'codice_cup',
                'avviso',
                'data_invio_candidatura',
                'data_finanziamento',
                'importo_finanziamento'
            ];

            const headers = [
                'Regione',
                'Provincia',
                'Comune', 
                'Codice CUP',
                'Avviso',
                'Data Invio Candidatura',
                'Data Finanziamento',
                'Importo Finanziamento'
            ];

            const csvContent = [
                headers.join(','),
                ...currentTableData.map(row => 
                    columns.map(col => {
                        const value = row[col] || '';
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                
                // Nome file con info sui filtri
                let fileName = 'pa_digitale_2026_filtrati_';
                if (currentFilters.regione) fileName += `${currentFilters.regione.replace(/[^a-zA-Z0-9]/g, '_')}_`;
                if (currentFilters.provincia) fileName += `${currentFilters.provincia.replace(/[^a-zA-Z0-9]/g, '_')}_`;
                if (currentFilters.comune) fileName += `${currentFilters.comune.replace(/[^a-zA-Z0-9]/g, '_')}_`;
                fileName += `${new Date().toISOString().split('T')[0]}.csv`;
                
                link.setAttribute('download', fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }

        function formatDate(dateString) {
            if (!dateString) return '-';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return dateString;
                return date.toLocaleDateString('it-IT');
            } catch (e) {
                return dateString;
            }
        }

        // ========== FUNZIONI ORIGINALI (con alcune modifiche) ==========

        // Setup dei filtri con ricerca
        function setupSearchFilters() {
            // Setup filtri provincia (desktop e mobile)
            setupSearchFilter('provinciaFilter', 'provinciaDropdown', 'provinciaClear', 'provincia');
            setupSearchFilter('provinciaFilterMobile', 'provinciaDropdownMobile', 'provinciaClearMobile', 'provincia');
            
            // Setup filtri comune (desktop e mobile)
            setupSearchFilter('comuneFilter', 'comuneDropdown', 'comuneClear', 'comune');
            setupSearchFilter('comuneFilterMobile', 'comuneDropdownMobile', 'comuneClearMobile', 'comune');
        }

        function setupSearchFilter(inputId, dropdownId, clearId, filterType) {
            const input = document.getElementById(inputId);
            const dropdown = document.getElementById(dropdownId);
            const clearBtn = document.getElementById(clearId);
            
            if (!input || !dropdown || !clearBtn) return;
            
            let allOptions = [];
            
            // Input event per ricerca
            input.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase().trim();
                
                if (searchTerm.length > 0) {
                    clearBtn.classList.add('show');
                    const filteredOptions = allOptions.filter(option => 
                        option.toLowerCase().includes(searchTerm)
                    );
                    showDropdown(dropdown, filteredOptions, filterType, input);
                } else {
                    clearBtn.classList.remove('show');
                    hideDropdown(dropdown);
                }
            });
            
            // Focus event per mostrare tutte le opzioni se input vuoto
            input.addEventListener('focus', function() {
                if (this.value.trim() === '' && allOptions.length > 0) {
                    showDropdown(dropdown, allOptions, filterType, input);
                }
            });
            
            // Click fuori per nascondere dropdown
            document.addEventListener('click', function(e) {
                if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                    hideDropdown(dropdown);
                }
            });
            
            // Clear button
            clearBtn.addEventListener('click', function() {
                input.value = '';
                clearBtn.classList.remove('show');
                hideDropdown(dropdown);
                
                // Reset filtro
                if (filterType === 'provincia') {
                    currentFilters.provincia = '';
                    currentFilters.comune = '';
                    // Clear anche l'altro input provincia
                    const otherInput = inputId.includes('Mobile') ? 
                        document.getElementById('provinciaFilter') : 
                        document.getElementById('provinciaFilterMobile');
                    if (otherInput) otherInput.value = '';
                    
                    // Clear anche comuni
                    clearComuneInputs();
                } else if (filterType === 'comune') {
                    currentFilters.comune = '';
                    // Clear anche l'altro input comune
                    const otherInput = inputId.includes('Mobile') ? 
                        document.getElementById('comuneFilter') : 
                        document.getElementById('comuneFilterMobile');
                    if (otherInput) otherInput.value = '';
                }
                
                updateFilterOptions();
                applyFilters();
            });
            
            // Salva riferimento per aggiornare le opzioni
            input._updateOptions = function(options) {
                allOptions = options;
            };
        }

        function clearComuneInputs() {
            const comuneInputs = ['comuneFilter', 'comuneFilterMobile'];
            comuneInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.value = '';
                    const clearBtnId = id.replace('Filter', 'Clear');
                    const clearBtn = document.getElementById(clearBtnId);
                    if (clearBtn) clearBtn.classList.remove('show');
                }
            });
        }

        function showDropdown(dropdown, options, filterType, input) {
            dropdown.innerHTML = '';
            
            if (options.length === 0) {
                const noResultsOption = document.createElement('div');
                noResultsOption.className = 'filter-option no-results';
                noResultsOption.textContent = `Nessun${filterType === 'provincia' ? 'a provincia' : ' comune'} trovato`;
                dropdown.appendChild(noResultsOption);
            } else {
                options.forEach(option => {
                    const optionElement = document.createElement('div');
                    optionElement.className = 'filter-option';
                    optionElement.textContent = option;
                    optionElement.addEventListener('click', function() {
                        input.value = option;
                        
                        if (filterType === 'provincia') {
                            currentFilters.provincia = option;
                            currentFilters.comune = '';
                            
                            // Aggiorna anche l'altro input provincia
                            const otherInput = input.id.includes('Mobile') ? 
                                document.getElementById('provinciaFilter') : 
                                document.getElementById('provinciaFilterMobile');
                            if (otherInput) otherInput.value = option;
                            
                            // Clear comuni
                            clearComuneInputs();
                        } else if (filterType === 'comune') {
                            currentFilters.comune = option;
                            
                            // Aggiorna anche l'altro input comune
                            const otherInput = input.id.includes('Mobile') ? 
                                document.getElementById('comuneFilter') : 
                                document.getElementById('comuneFilterMobile');
                            if (otherInput) otherInput.value = option;
                        }
                        
                        hideDropdown(dropdown);
                        const clearBtnId = input.id.replace('Filter', 'Clear');
                        const clearBtn = document.getElementById(clearBtnId);
                        if (clearBtn) clearBtn.classList.add('show');
                        
                        updateFilterOptions();
                        applyFilters();
                    });
                    dropdown.appendChild(optionElement);
                });
            }
            
            dropdown.classList.add('show');
        }

        function hideDropdown(dropdown) {
            dropdown.classList.remove('show');
        }

        // Funzione per configurare il menu mobile
        function setupMobileMenu() {
            const mobileMenuToggle = document.getElementById('mobileMenuToggle');
            const mobileMenu = document.getElementById('mobileMenu');
            const mobileMenuClose = document.getElementById('mobileMenuClose');
            const mobileOverlay = document.getElementById('mobileOverlay');
            
            // Apri menu mobile
            mobileMenuToggle.addEventListener('click', function() {
                mobileMenu.classList.add('active');
                mobileOverlay.classList.add('active');
            });
            
            // Chiudi menu mobile
            function closeMobileMenu() {
                mobileMenu.classList.remove('active');
                mobileOverlay.classList.remove('active');
            }
            
            mobileMenuClose.addEventListener('click', closeMobileMenu);
            mobileOverlay.addEventListener('click', closeMobileMenu);
        }

        function initMap() {
            // Rilevamento dispositivo mobile
            const isMobile = window.innerWidth <= 992;
            
            // Zoom e centro adattati per mobile
            const initialZoom = isMobile ? 5 : 6;
            const initialCenter = isMobile ? [42.5, 12.5] : [41.9028, 12.4964];
            
            // Salva la vista iniziale nelle variabili globali
            initialMapView.center = initialCenter;
            initialMapView.zoom = initialZoom;
            
            // Bounds dell'Italia con margine
            const italyBounds = [
                [35.0, 5.0],  // Sud-Ovest (con margine)
                [48.0, 20.0]  // Nord-Est (con margine)
            ];

            map = L.map('map', {
                zoomControl: false, // Disabilita controlli di default
                maxBounds: italyBounds,
                maxBoundsViscosity: 0.8, // Permette un po' di elasticità   
                minZoom: 5,  // Permette di vedere tutta l'Italia
                maxZoom: 16
            }).setView(initialCenter, initialZoom);
            
            // Aggiungi controlli di zoom a destra
            L.control.zoom({
                position: 'topright'
            }).addTo(map);
            
            // Aggiungi il controllo home personalizzato
            const homeControl = L.Control.extend({
                onAdd: function(map) {
                    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
                    
                    container.style.backgroundColor = 'white';
                    container.style.backgroundImage = "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im0zIDkgOS03IDkgN3YxMWEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnoiLz48cG9seWxpbmUgcG9pbnRzPSI5LDIyIDksMTIgMTUsMTIgMTUsMjIiLz48L3N2Zz4=')";
                    container.style.backgroundSize = '60%';
                    container.style.backgroundPosition = 'center';
                    container.style.backgroundRepeat = 'no-repeat';
                    container.style.width = '30px';
                    container.style.height = '30px';
                    container.style.cursor = 'pointer';
                    container.style.border = '2px solid rgba(0,0,0,0.2)';
                    container.style.borderRadius = '4px';
                    container.title = 'Torna alla vista iniziale';
                    
                    container.onclick = function(){
                        resetMapView();
                    }
                    
                    // Previeni la propagazione degli eventi per evitare conflitti con la mappa
                    L.DomEvent.disableClickPropagation(container);
                    
                    return container;
                },
                
                onRemove: function(map) {
                    // Cleanup quando il controllo viene rimosso
                }
            });
            
            // Aggiungi il controllo home in alto a destra, sotto i controlli zoom
            map.addControl(new homeControl({position: 'topright'}));
            
            // Mappa CartoDB Dark per meglio integrarsi con il tema scuro
            L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors, © CartoDB - <a href="https://twitter.com/gbvitrano" title="Giovan Battista Vitrano" target="_blank">@gbvitrano</a> - <a href="http://opendatasicilia.it/" title="opendatasicilia.it" target="_blank">opendatasicilia.it</a>',
                subdomains: 'abcd',
            }).addTo(map);
        }

        // Nuova funzione per resettare la vista della mappa
        function resetMapView() {
            if (map && initialMapView.center && initialMapView.zoom) {
                map.setView(initialMapView.center, initialMapView.zoom);
                
                // Chiudi eventuali popup aperti
                map.closePopup();
                
                // Aggiorna anche la vista iniziale in caso di resize della finestra
                const isMobile = window.innerWidth <= 992;
                const newInitialZoom = isMobile ? 5 : 6;
                const newInitialCenter = isMobile ? [42.5, 12.5] : [41.9028, 12.4964];
                
                initialMapView.center = newInitialCenter;
                initialMapView.zoom = newInitialZoom;
                
                map.setView(newInitialCenter, newInitialZoom);
            }
        }

        function setupTooltip() {
            tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);
        }

        // Funzione per formattare i codici a 6 cifre con zeri iniziali
        function formatTo6Digits(code) {
            let codeStr = String(code).trim();
            const numericValue = parseInt(codeStr, 10);
            if (!isNaN(numericValue)) {
                codeStr = numericValue.toString().padStart(6, '0');
            }
            return codeStr;
        }

        // Mantieni le funzioni originali per la gestione dati
        async function loadData() {
            try {
                // Carica dati comuni JSON
                const comuniResponse = await fetch('pmtiles/comuni_italiani_2025_2.json');
                const comuniGeoJSON = await comuniResponse.json();
                comuniData = comuniGeoJSON.features;

                // Carica dati candidature CSV
                const candidatureResponse = await fetch('https://query.data.world/s/yxkuwlvmx4oxyngoeera3kf4awaje3?dws=00000');
                const candidatureCSV = await candidatureResponse.text();
                candidatureData = parseCSV(candidatureCSV);

                updateDebugInfo(`Comuni totali: ${comuniData.length}, Candidature: ${candidatureData.length}`);

                // Join dei dati
                joinData();
                
                // Crea layer mappa
                createMapLayer();
                
                // Popola filtri
                populateFilters();
                
                // Aggiorna statistiche e grafico
                updateStats();
                updateChart();
                
                // Aggiorna la data dell'ultimo aggiornamento
                updateLastUpdateTime();
                
                document.getElementById('loading').style.display = 'none';
            } catch (error) {
                console.error('Errore nel caricamento dei dati:', error);
                document.getElementById('loading').innerHTML = '<div style="color: #EF4444;">Errore nel caricamento dei dati</div>';
            }
        }

        function parseCSV(csvText) {
            const lines = csvText.split('\n');
            const headers = parseCSVLine(lines[0]);
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = parseCSVLine(lines[i]);
                    if (values.length >= headers.length) {
                        const row = {};
                        headers.forEach((header, index) => {
                            let value = values[index] || '';
                            
                            if (header === 'cod_comune' && value.trim()) {
                                value = formatTo6Digits(value);
                            }
                            
                            row[header] = value;
                        });
                        
                        if (row.cod_comune && row.cod_comune.trim() && row.cod_comune !== '000000') {
                            data.push(row);
                        }
                    }
                }
            }
            
            return data;
        }

        function parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            
            result.push(current.trim());
            return result;
        }

        function joinData() {
            const candidaturePerComune = {};
            
            candidatureData.forEach(candidatura => {
                const codComune = candidatura.cod_comune;
                const importo = parseFloat(candidatura.importo_finanziamento) || 0;
                
                if (!candidaturePerComune[codComune]) {
                    candidaturePerComune[codComune] = {
                        candidature: [],
                        totaleImporto: 0,
                        numeroProgetti: 0,
                        regione: candidatura.regione,
                        provincia: candidatura.provincia,
                        comune: candidatura.comune
                    };
                }
                candidaturePerComune[codComune].candidature.push(candidatura);
                candidaturePerComune[codComune].totaleImporto += importo;
                candidaturePerComune[codComune].numeroProgetti++;
            });

            let joinCount = 0;
            comuniData.forEach(comune => {
                const codComuneJSON = comune.properties.pro_com_t;
                
                if (candidaturePerComune[codComuneJSON]) {
                    comune.properties.candidature = candidaturePerComune[codComuneJSON];
                    joinCount++;
                }
            });

            updateDebugInfo(`Join completato: ${joinCount} comuni matchati`);
        }

        function createMapLayer() {
            if (comuniLayer) {
                map.removeLayer(comuniLayer);
            }

            comuniLayer = L.geoJSON(comuniData, {
                style: function(feature) {
                    return getBaseStyle(feature);
                },
                onEachFeature: function(feature, layer) {
                    layer.on({
                        mouseover: function(e) {
                            const layer = e.target;
                            layer.setStyle({
                                weight: 2,
                                color: '#06B6D4',
                                opacity: 1,
                                fillOpacity: 1
                            });
                            
                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                layer.bringToFront();
                            }

                            showTooltip(e, feature.properties);
                        },
                        mouseout: function(e) {
                            e.target.setStyle(getBaseStyle(feature));
                            hideMapTooltip();
                        },
                        click: function(e) {
                            showComuneInfo(feature.properties);
                            currentFilters.comune = feature.properties.comune;
                            
                            // Aggiorna i filtri
                            updateFilterValue('comuneFilter', feature.properties.comune);
                            updateFilterValue('comuneFilterMobile', feature.properties.comune);
                            
                            applyFilters();
                            map.fitBounds(e.target.getBounds());
                        }
                    });
                }
            }).addTo(map);
        }

        function getBaseStyle(feature) {
            const codReg = feature.properties.cod_reg.toString();
            const hasCandidature = feature.properties.candidature;
            
            let matchesFilter = true;
            if (currentFilters.regione && feature.properties.candidature && 
                feature.properties.candidature.regione !== currentFilters.regione) {
                matchesFilter = false;
            }
            if (currentFilters.provincia && feature.properties.candidature && 
                feature.properties.candidature.provincia !== currentFilters.provincia) {
                matchesFilter = false;
            }
            if (currentFilters.comune && feature.properties.comune !== currentFilters.comune) {
                matchesFilter = false;
            }
            if (currentFilters.avviso && feature.properties.candidature) {
                let hasMatchingAvviso = false;
                feature.properties.candidature.candidature.forEach(c => {
                    if (c.avviso === currentFilters.avviso) {
                        hasMatchingAvviso = true;
                    }
                });
                if (!hasMatchingAvviso) {
                    matchesFilter = false;
                }
            }
            
            return {
                fillColor: regionColors[codReg] || '#64748B',
                weight: 0,
                opacity: 0,
                color: 'transparent',
                fillOpacity: (hasCandidature && matchesFilter) ? 0.8 : 0.2
            };
        }

        function showTooltip(e, properties) {
            const comune = properties.comune;
            const provincia = properties.den_uts;
            const candidature = properties.candidature;
            
            let content = `<strong>${comune}</strong><br/>Provincia: ${provincia}`;
            
            if (candidature) {
                content += `<br/>Progetti: ${candidature.numeroProgetti}`;
                content += `<br/>Importo: €${candidature.totaleImporto.toLocaleString('it-IT')}`;
            } else {
                content += '<br/>Nessun progetto finanziato';
            }

            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(content)
                .style('left', (e.originalEvent.pageX + 10) + 'px')
                .style('top', (e.originalEvent.pageY - 28) + 'px');
        }

        function hideMapTooltip() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        }

        function showComuneInfo(properties) {
            let popupContent = `
                <div style="color: #2c3e50; font-family: 'Inter', sans-serif; min-width: 400px;">
                    <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 12px; margin: -16px -16px 16px -16px; border-radius: 12px 12px 0 0;">
                        <h4 style="margin: 0; font-size: 16px; font-weight: 600;">🏛️ ${properties.comune}</h4>
                        <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">${properties.den_uts} (${properties.sigla})</div>
                    </div>
            `;
            
            if (properties.candidature) {
                popupContent += `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                        <div style="background: #f8fafc; padding: 8px; border-radius: 8px; text-align: center; border-left: 3px solid #10b981;">
                            <div style="font-size: 18px; font-weight: 700; color: #10b981;">${properties.candidature.numeroProgetti}</div>
                            <div style="font-size: 11px; color: #64748b;">Progetti</div>
                        </div>
                        <div style="background: #f8fafc; padding: 8px; border-radius: 8px; text-align: center; border-left: 3px solid #3b82f6;">
                            <div style="font-size: 14px; font-weight: 700; color: #3b82f6;">€${properties.candidature.totaleImporto.toLocaleString('it-IT')}</div>
                            <div style="font-size: 11px; color: #64748b;">Importo totale</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 16px;">
                        <h5 style="margin: 0 0 12px 0; font-size: 14px; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;"><i class='fa-solid fa-list'></i> Dettaglio Progetti</h5>
                        <div style="max-height: 420px; overflow-y: auto;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                <thead>
                                    <tr style="background: #f1f5f9;">
                                        <th style="padding: 8px 4px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1;">CUP</th>
                                        <th style="padding: 8px 4px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1;">Avviso</th>
                                        <th style="padding: 8px 4px; text-align: right; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1;">Importo</th>
                                        <th style="padding: 8px 4px; text-align: center; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1;">Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                
                // Ordina le candidature per importo decrescente
                const candidatureOrdered = [...properties.candidature.candidature].sort((a, b) => 
                    (parseFloat(b.importo_finanziamento) || 0) - (parseFloat(a.importo_finanziamento) || 0)
                );
                
                candidatureOrdered.forEach((candidatura, index) => {
                    const importo = parseFloat(candidatura.importo_finanziamento) || 0;
                    const avvisoShort = candidatura.avviso.length > 30 ? 
                        candidatura.avviso.substring(0, 30) + '...' : candidatura.avviso;
                    const dataFinanziamento = candidatura.data_finanziamento ? 
                        new Date(candidatura.data_finanziamento).toLocaleDateString('it-IT') : '-';
                    const cupCode = candidatura.codice_cup || '-';
                    
                    const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                    
                    // Crea il link CUP per il popup - versione semplificata per HTML inline
                    let cupDisplay = cupCode;
                    if (cupCode && cupCode !== '-' && cupCode.trim() !== '') {
                        const cupUrl = 'https://www.opencup.gov.it/portale/it/web/opencup/home/progetto/-/cup/' + encodeURIComponent(cupCode);
                        cupDisplay = `<a href="${cupUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: none; font-weight: 500;" title="Apri dettaglio progetto OpenCUP">${cupCode}</a>`;
                    }
                    
                    popupContent += `
                        <tr style="background: ${rowBg}; transition: background 0.2s;">
                            <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 10px; color: #6366f1;" title="${cupCode}">${cupDisplay}</td>
                            <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; line-height: 1.3;" title="${candidatura.avviso}">${avvisoShort}</td>
                            <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #059669;">€${importo.toLocaleString('it-IT')}</td>
                            <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #64748b;">${dataFinanziamento}</td>
                        </tr>
                    `;
                });
                
                popupContent += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            } else {
                popupContent += `
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; text-align: center;">
                        <div style="color: #dc2626; font-weight: 500;">Nessun progetto finanziato</div>
                        <div style="color: #6b7280; font-size: 11px; margin-top: 4px;">Questo comune non ha candidature confermate</div>
                    </div>
                `;
            }
            
            popupContent += '</div>';
            
            let comuneLayer = null;
            comuniLayer.eachLayer(function(layer) {
                if (layer.feature.properties.comune === properties.comune) {
                    comuneLayer = layer;
                }
            });
            
            if (comuneLayer) {
                const bounds = comuneLayer.getBounds();
                const center = bounds.getCenter();
                
                L.popup({
                    maxWidth: 500,
                    className: 'comune-popup',
                    autoPan: true,
                    autoPanPadding: [20, 20]
                })
                .setLatLng(center)
                .setContent(popupContent)
                .openOn(map);
            }
        }

        function populateFilters() {
            updateFilterOptions();
            
            // Event listeners per filtri regione
            const regioneFilters = ['regioneFilter', 'regioneFilterMobile'];
            regioneFilters.forEach(filterId => {
                const el = document.getElementById(filterId);
                if (el) {
                    el.addEventListener('change', function() {
                        currentFilters.regione = this.value;
                        currentFilters.provincia = '';
                        currentFilters.comune = '';
                        
                        resetSearchInputs();
                        
                        updateFilterValue('regioneFilter', this.value);
                        updateFilterValue('regioneFilterMobile', this.value);
                        
                        updateFilterOptions();
                        applyFilters();
                    });
                }
            });

            // Event listeners per filtri avviso
            const avvisoFilters = ['avvisoFilter', 'avvisoFilterMobile'];
            avvisoFilters.forEach(filterId => {
                const el = document.getElementById(filterId);
                if (el) {
                    el.addEventListener('change', function() {
                        currentFilters.avviso = this.value;
                        
                        updateFilterValue('avvisoFilter', this.value);
                        updateFilterValue('avvisoFilterMobile', this.value);
                        
                        applyFilters();
                    });
                }
            });
        }

        function resetSearchInputs() {
            const searchInputs = ['provinciaFilter', 'provinciaFilterMobile', 'comuneFilter', 'comuneFilterMobile'];
            searchInputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.value = '';
                    const clearBtnId = id.replace('Filter', 'Clear');
                    const clearBtn = document.getElementById(clearBtnId);
                    if (clearBtn) clearBtn.classList.remove('show');
                }
            });
        }

        function updateFilterOptions() {
            let filteredData = candidatureData;
            
            if (currentFilters.regione) {
                filteredData = filteredData.filter(c => c.regione === currentFilters.regione);
            }

            // Aggiorna Province (search inputs)
            const provinceOptions = [...new Set(filteredData.map(c => c.provincia))].sort();
            updateSearchOptions('provinciaFilter', provinceOptions);
            updateSearchOptions('provinciaFilterMobile', provinceOptions);

            // Filtra ulteriormente per provincia se selezionata
            if (currentFilters.provincia) {
                filteredData = filteredData.filter(c => c.provincia === currentFilters.provincia);
            }

            // Aggiorna Comuni (search inputs)
            const comuniOptions = [...new Set(filteredData.map(c => c.comune))].sort();
            updateSearchOptions('comuneFilter', comuniOptions);
            updateSearchOptions('comuneFilterMobile', comuniOptions);

            // Regioni (solo la prima volta o quando vuoti)
            if (shouldUpdateSelect('regioneFilter')) {
                updateFilterSelect('regioneFilter', candidatureData.map(c => c.regione), currentFilters.regione);
                updateFilterSelect('regioneFilterMobile', candidatureData.map(c => c.regione), currentFilters.regione);
            }

            // Avvisi (solo la prima volta o quando vuoti)
            if (shouldUpdateSelect('avvisoFilter')) {
                updateFilterSelect('avvisoFilter', candidatureData.map(c => c.avviso), currentFilters.avviso);
                updateFilterSelect('avvisoFilterMobile', candidatureData.map(c => c.avviso), currentFilters.avviso);
            }
        }

        function updateSearchOptions(inputId, options) {
            const input = document.getElementById(inputId);
            if (input && input._updateOptions) {
                input._updateOptions(options);
            }
        }

        function shouldUpdateSelect(selectId) {
            const select = document.getElementById(selectId);
            return select && select.children.length <= 1;
        }

        function updateFilterSelect(selectId, values, selectedValue) {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            const uniqueValues = [...new Set(values)].sort();
            
            const allOption = select.querySelector('option[value=""]');
            const allOptionText = allOption ? allOption.textContent : '';
            
            select.innerHTML = '';
            
            const newAllOption = document.createElement('option');
            newAllOption.value = '';
            newAllOption.textContent = allOptionText || getDefaultOptionText(selectId);
            select.appendChild(newAllOption);
            
            uniqueValues.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                
                if (selectId.includes('avviso') && value.length > 50) {
                    option.textContent = value.substring(0, 50) + '...';
                } else {
                    option.textContent = value;
                }
                
                if (value === selectedValue) option.selected = true;
                select.appendChild(option);
            });
        }

        function getDefaultOptionText(selectId) {
            if (selectId.includes('regione')) return 'Tutte le regioni';
            if (selectId.includes('provincia')) return 'Tutte le province';
            if (selectId.includes('comune')) return 'Tutti i comuni';
            if (selectId.includes('avviso')) return 'Tutti gli avvisi';
            return 'Tutti';
        }

        function updateFilterValue(filterId, value) {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                if (filterElement.tagName === 'SELECT') {
                    filterElement.value = value;
                } else if (filterElement.tagName === 'INPUT') {
                    filterElement.value = value;
                    const clearBtnId = filterId.replace('Filter', 'Clear');
                    const clearBtn = document.getElementById(clearBtnId);
                    if (clearBtn) {
                        if (value) {
                            clearBtn.classList.add('show');
                        } else {
                            clearBtn.classList.remove('show');
                        }
                    }
                }
            }
        }

        function applyFilters() {
            updateStats();
            updateChart();
            updateMapLayer();
        }

        function getFilteredData() {
            return candidatureData.filter(candidatura => {
                if (currentFilters.regione && candidatura.regione !== currentFilters.regione) return false;
                if (currentFilters.provincia && candidatura.provincia !== currentFilters.provincia) return false;
                if (currentFilters.comune && candidatura.comune !== currentFilters.comune) return false;
                if (currentFilters.avviso && candidatura.avviso !== currentFilters.avviso) return false;
                return true;
            });
        }

        function updateMapLayer() {
            comuniLayer.eachLayer(function(layer) {
                layer.setStyle(getBaseStyle(layer.feature));
            });
        }

        function updateStats() {
            const filteredData = getFilteredData();
            
            const regioni = new Set(filteredData.map(c => c.regione)).size;
            const comuni = new Set(filteredData.map(c => c.comune)).size;
            const progetti = filteredData.length;
            const importoTotale = filteredData.reduce((sum, c) => {
                return sum + (parseFloat(c.importo_finanziamento) || 0);
            }, 0);

            document.getElementById('statRegioni').textContent = regioni;
            document.getElementById('statComuni').textContent = comuni;
            document.getElementById('statProgetti').textContent = progetti;
            document.getElementById('statImporto').textContent = formatCurrency(importoTotale);
        }

        function updateChart() {
            let chartData = [];
            let title = "";
            let yAxisLabel = "";
            
            // Usa window.currentChartTab per garantire l'accesso alla variabile
            const chartTab = window.currentChartTab || 'dynamic';
            
            // Gestisce i diversi tab
            switch(chartTab) {
                case 'dynamic':
                    // Comportamento dinamico basato sui filtri (logica originale)
                    if (currentFilters.comune) {
                        title = `<i class='fa-solid fa-euro-sign'></i> Importi finanziati per avviso - Comune: ${currentFilters.comune}`;
                        yAxisLabel = "Avviso";
                        
                        const filteredData = candidatureData.filter(c => c.comune === currentFilters.comune);
                        
                        const avvisiData = {};
                        filteredData.forEach(candidatura => {
                            const avviso = candidatura.avviso;
                            const importo = parseFloat(candidatura.importo_finanziamento) || 0;
                            if (!avvisiData[avviso]) {
                                avvisiData[avviso] = 0;
                            }
                            avvisiData[avviso] += importo;
                        });
                        
                        chartData = Object.keys(avvisiData).map(avviso => ({
                            name: avviso,
                            value: avvisiData[avviso]
                        }));
                        
                        chartData.sort((a, b) => b.value - a.value);
                    } else if (currentFilters.provincia) {
                        title = `<i class='fa-solid fa-euro-sign'></i> Importi finanziati per comune - Provincia: ${currentFilters.provincia}`;
                        yAxisLabel = "Comune";
                        
                        const filteredData = candidatureData.filter(c => c.provincia === currentFilters.provincia);
                        
                        const comuniData = {};
                        filteredData.forEach(candidatura => {
                            const comune = candidatura.comune;
                            const importo = parseFloat(candidatura.importo_finanziamento) || 0;
                            if (!comuniData[comune]) {
                                comuniData[comune] = 0;
                            }
                            comuniData[comune] += importo;
                        });
                        
                        chartData = Object.keys(comuniData).map(comune => ({
                            name: comune,
                            value: comuniData[comune]
                        }));
                        
                        chartData.sort((a, b) => b.value - a.value);
                    } else if (currentFilters.regione) {
                        title = `<i class='fa-solid fa-euro-sign'></i>  Importi finanziati per provincia - Regione: ${currentFilters.regione}`;
                        yAxisLabel = "Provincia";
                        
                        const filteredData = candidatureData.filter(c => c.regione === currentFilters.regione);
                        
                        const provinceData = {};
                        filteredData.forEach(candidatura => {
                            const provincia = candidatura.provincia;
                            const importo = parseFloat(candidatura.importo_finanziamento) || 0;
                            if (!provinceData[provincia]) {
                                provinceData[provincia] = 0;
                            }
                            provinceData[provincia] += importo;
                        });
                        
                        chartData = Object.keys(provinceData).map(provincia => ({
                            name: provincia,
                            value: provinceData[provincia]
                        }));
                        
                        chartData.sort((a, b) => b.value - a.value);
                    } else {
                        title = "<i class='fa-solid fa-euro-sign'></i>  Importi finanziati per regione";
                        yAxisLabel = "Regione";
                        
                        const regioniData = {};
                        candidatureData.forEach(candidatura => {
                            const regione = candidatura.regione;
                            const importo = parseFloat(candidatura.importo_finanziamento) || 0;
                            if (!regioniData[regione]) {
                                regioniData[regione] = 0;
                            }
                            regioniData[regione] += importo;
                        });
                        
                        chartData = Object.keys(regioniData).map(regione => ({
                            name: regione,
                            value: regioniData[regione]
                        }));
                        
                        chartData.sort((a, b) => b.value - a.value);
                    }
                    break;
                    
                case 'comuni':
                    title = "<i class='fa-solid fa-euro-sign'></i>  Importi finanziati per comune (Top 50)";
                    yAxisLabel = "Comune";
                    
                    // Applica filtri se presenti (escluso comune)
                    let filteredForComuni = candidatureData;
                    if (currentFilters.regione) {
                        filteredForComuni = filteredForComuni.filter(c => c.regione === currentFilters.regione);
                    }
                    if (currentFilters.provincia) {
                        filteredForComuni = filteredForComuni.filter(c => c.provincia === currentFilters.provincia);
                    }
                    if (currentFilters.avviso) {
                        filteredForComuni = filteredForComuni.filter(c => c.avviso === currentFilters.avviso);
                    }
                    
                    const comuniDataAll = {};
                    filteredForComuni.forEach(candidatura => {
                        const comune = candidatura.comune;
                        const importo = parseFloat(candidatura.importo_finanziamento) || 0;
                        if (!comuniDataAll[comune]) {
                            comuniDataAll[comune] = 0;
                        }
                        comuniDataAll[comune] += importo;
                    });
                    
                    chartData = Object.keys(comuniDataAll).map(comune => ({
                        name: comune,
                        value: comuniDataAll[comune]
                    }));
                    
                    chartData.sort((a, b) => b.value - a.value);
                    // Limita ai primi 50 comuni per leggibilità   
                    chartData = chartData.slice(0, 50);
                    break;
                    
                case 'avvisi':
                    title = "<i class='fa-solid fa-euro-sign'></i> Importi finanziati per avviso";
                    yAxisLabel = "Avviso";
                    
                    // Applica filtri se presenti (escluso avviso)
                    let filteredForAvvisi = candidatureData;
                    if (currentFilters.regione) {
                        filteredForAvvisi = filteredForAvvisi.filter(c => c.regione === currentFilters.regione);
                    }
                    if (currentFilters.provincia) {
                        filteredForAvvisi = filteredForAvvisi.filter(c => c.provincia === currentFilters.provincia);
                    }
                    if (currentFilters.comune) {
                        filteredForAvvisi = filteredForAvvisi.filter(c => c.comune === currentFilters.comune);
                    }
                    
                    const avvisiDataAll = {};
                    filteredForAvvisi.forEach(candidatura => {
                        const avviso = candidatura.avviso;
                        const importo = parseFloat(candidatura.importo_finanziamento) || 0;
                        if (!avvisiDataAll[avviso]) {
                            avvisiDataAll[avviso] = 0;
                        }
                        avvisiDataAll[avviso] += importo;
                    });
                    
                    chartData = Object.keys(avvisiDataAll).map(avviso => ({
                        name: avviso,
                        value: avvisiDataAll[avviso]
                    }));
                    
                    chartData.sort((a, b) => b.value - a.value);
                    break;
            }
            
            document.getElementById("chartTitle").innerHTML = title;
            drawBarChart(chartData, yAxisLabel);
        }

        // Funzione per cambiare tab del grafico (resa globale)
        window.switchChartTab = function(tabName) {
            // Rimuovi classe active da tutti i tab
            document.querySelectorAll('.chart-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Aggiungi classe active al tab selezionato
            document.getElementById(`tab-${tabName}`).classList.add('active');
            
            // Aggiorna il tab corrente
            window.currentChartTab = tabName;
            
            // Aggiorna il grafico
            updateChart();
        }

        function drawBarChart(data, yAxisLabel) {
            d3.select("#chart").selectAll("*").remove();
            
            const barHeight = 30;
            const barPadding = 5;
            const titleHeight = 30;
            const xAxisHeight = 50;
            const chartHeight = Math.max(500, data.length * (barHeight + barPadding) + titleHeight + xAxisHeight);
            
            const margin = { top: 20, right: 30, bottom: 70, left: yAxisLabel === "Comune" ? 110 : 110 };
            const chartContainer = document.querySelector(".chart-container");
            const containerWidth = chartContainer.clientWidth;
            const width = containerWidth - margin.left - margin.right;
            const height = chartHeight - margin.top - margin.bottom;
            
            const svg = d3.select("#chart")
                .attr("width", containerWidth)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            
            const y = d3.scaleBand()
                .range([0, height])
                .domain(data.map(d => d.name))
                .padding(0.1);
            
            const x = d3.scaleLinear()
                .range([0, width])
                .domain([0, d3.max(data, d => d.value)]);
            
            function getBarColor(d) {
                if (yAxisLabel === "Regione") {
                    const regionCode = regionNameToCode[d.name];
                    return regionColors[regionCode] || '#64748B';
                } else {
                    return '#06B6D4';
                }
            }
            
            function getHoverColor(d) {
                if (yAxisLabel === "Regione") {
                    const regionCode = regionNameToCode[d.name];
                    const baseColor = regionColors[regionCode] || '#64748B';
                    return d3.color(baseColor).brighter(0.3);
                } else {
                    return '#0891B2';
                }
            }
            
            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("y", d => y(d.name))
                .attr("height", y.bandwidth())
                .attr("x", 0)
                .attr("width", d => x(d.value))
                .attr("fill", d => getBarColor(d))
                .attr("rx", 4)
                .attr("ry", 4)
                .on("mouseover", function(event, d) {
                    d3.select(this).attr("fill", getHoverColor(d));
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`${d.name}<br/>Importo: €${d.value.toLocaleString('it-IT')}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function(event, d) {
                    d3.select(this).attr("fill", getBarColor(d));
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
            
            svg.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(y))
               // .append("text")
             //   .attr("transform", "rotate(-90)")
             //   .attr("y", -margin.left + 60)
              //  .attr("x", -height / 2)
             //   .attr("dy", "0.71em")
            //    .attr("class", "axis-label")
             //   .style("text-anchor", "end")
            //    .text(yAxisLabel);
            
            svg.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(5).tickFormat(d => formatCurrency(d)))
             //   .append("text")
             //   .attr("x", width / 2)
             //   .attr("y", margin.bottom - 20)
            //    .attr("dy", "0.71em")
            //    .attr("class", "axis-label")
            //    .style("text-anchor", "middle")
            //    .text("Importo (€)");
            
           svg.selectAll(".label")
    .data(data)
    .enter().append("text")
    .attr("class", "label")
    .attr("x", d => {
        const barWidth = x(d.value);
        const textWidth = formatCurrency(d.value).length * 6; // Stima larghezza testo
        return barWidth > textWidth + 20 ? barWidth - 10 : barWidth + 5;
    })
    .attr("y", d => y(d.name) + y.bandwidth() / 2 + 4)
    .attr("dy", ".35em")
    .attr("text-anchor", d => {
        const barWidth = x(d.value);
        const textWidth = formatCurrency(d.value).length * 6;
        return barWidth > textWidth + 20 ? "end" : "start";
    })
    .style("font-size", "11px")
    .style("fill", d => {
        const barWidth = x(d.value);
        const textWidth = formatCurrency(d.value).length * 6;
        return barWidth > textWidth + 20 ? "#FFFFFF" : "#E2E8F0";
    })
    .style("font-weight", "600")
    .style("text-shadow", d => {
        const barWidth = x(d.value);
        const textWidth = formatCurrency(d.value).length * 6;
        return barWidth > textWidth + 20 ? "1px 1px 2px rgba(0,0,0,0.5)" : "none";
    })
    .text(d => formatCurrency(d.value));
        }

        function formatCurrency(value) {
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M€';
            } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'k€';
            } else {
                return '€' + value.toFixed(0);
            }
        }

        function resetFilters() {
            currentFilters = {
                regione: '',
                provincia: '',
                comune: '',
                avviso: ''
            };
            
            const selectIds = ['regioneFilter', 'avvisoFilter', 'regioneFilterMobile', 'avvisoFilterMobile'];
            selectIds.forEach(id => {
                updateFilterValue(id, '');
            });
            
            resetSearchInputs();
            
            const infoPanels = document.querySelectorAll('[id^="infoPanel"]');
            infoPanels.forEach(panel => {
                panel.style.display = 'none';
            });
            
            // Aggiungi il reset della mappa
            resetMapView();
            
            updateFilterOptions();
            applyFilters();
        }

        function updateLastUpdateTime() {
            const now = new Date();
            const formattedDate = now.toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const formattedTime = now.toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const lastUpdateElements = document.querySelectorAll('[id^="lastUpdate"]');
            lastUpdateElements.forEach(element => {
                element.textContent = `${formattedDate} ${formattedTime}`;
            });
        }

        function downloadCSV() {
            if (candidatureData.length === 0) {
                alert('Nessun dato disponibile per il download');
                return;
            }

            const headers = Object.keys(candidatureData[0]);
            const csvContent = [
                headers.join(','),
                ...candidatureData.map(row => 
                    headers.map(header => {
                        const value = row[header] || '';
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `pa_digitale_2026_candidature_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }

        function updateDebugInfo(message) {
            const debugContents = document.querySelectorAll('[id^="debugContent"]');
            debugContents.forEach(content => {
                content.textContent = message;
            });
        }