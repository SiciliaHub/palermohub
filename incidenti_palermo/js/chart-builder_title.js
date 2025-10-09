// ============================================
// CHART BUILDER - JAVASCRIPT COMPLETO
// Versione: 2.1 - Con Totale e Colore Testo
// ============================================

let customChart = null;
let customChartConfig = {
    type: 'bar',
    dimension: null,
    metric: 'count',
    tipologieSelezionate: [],
    limit: 10,
    orientation: 'vertical',
	customTitle: '',
    colors: {
        mode: 'auto',
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        text: '#1f2937'
    },
    style: {
        borderWidth: 2,
        opacity: 0.8,
        fontSize: 12,
        titleSize: 16,
        legendSize: 12,
        gridOpacity: 0.1,
        showGrid: true,
        showLegend: true,
        tension: 0.4,
        pointRadius: 3,
        fill: true
    },
    variant: {
        stacked: false,
        horizontal: false,
        showValues: true,
        animation: true
    }
};

// ============================================
// GESTIONE MODALI GLOBALE
// ============================================
const ModalManager = {
    activeModals: new Set(),
    
    open(modalId) {
        this.activeModals.add(modalId);
        if (this.activeModals.size === 1) {
            document.body.classList.add('modal-open');
        }
    },
    
    close(modalId) {
        this.activeModals.delete(modalId);
        if (this.activeModals.size === 0) {
            document.body.classList.remove('modal-open');
            document.body.classList.remove('analytics-panel-open');
        }
    }
};

window.ModalManager = ModalManager;

// ============================================
// INIZIALIZZAZIONE
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initChartBuilderUI();
    }, 300);
});

function initChartBuilderUI() {
    const triggerBtn = document.getElementById('chart-builder-trigger');
    const closeBtn = document.getElementById('chart-builder-close');
    const modal = document.getElementById('chart-builder-modal');
    
    if (!triggerBtn || !modal) return;
    
    // Rimuovi listener esistenti
    const newTrigger = triggerBtn.cloneNode(true);
    triggerBtn.parentNode.replaceChild(newTrigger, triggerBtn);
    
    // Click desktop
    newTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openChartBuilder();
    });
    
    // Touch mobile
    let touchStartTime = 0;
    let touchMoved = false;
    
    newTrigger.addEventListener('touchstart', function(e) {
        touchStartTime = Date.now();
        touchMoved = false;
    }, { passive: true });
    
    newTrigger.addEventListener('touchmove', function() {
        touchMoved = true;
    }, { passive: true });
    
    newTrigger.addEventListener('touchend', function(e) {
        const touchDuration = Date.now() - touchStartTime;
        if (!touchMoved && touchDuration < 500) {
            e.preventDefault();
            e.stopPropagation();
            openChartBuilder();
        }
    }, { passive: false });
    
    // Pulsante chiusura
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        newCloseBtn.addEventListener('click', closeChartBuilder);
        newCloseBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            closeChartBuilder();
        }, { passive: false });
    }
    
    // Chiudi cliccando fuori
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeChartBuilder();
        }
    });
    
    initChartBuilder();
}

function openChartBuilder() {
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && analyticsPanel.classList.contains('open')) {
        if (typeof closeAnalytics === 'function') {
            closeAnalytics();
        }
        setTimeout(continueOpenChartBuilder, 100);
    } else {
        continueOpenChartBuilder();
    }
}

function continueOpenChartBuilder() {
    const modal = document.getElementById('chart-builder-modal');
    if (!modal) return;
    
    modal.style.zIndex = '10001';
    modal.classList.add('show');
    ModalManager.open('chart-builder');
    
    try {
        updateChartBuilderFiltersDisplay();
        updateFooterStats();
    } catch (e) {
        console.warn('Errore aggiornamento dati:', e);
    }
}

function closeChartBuilder() {
    const modal = document.getElementById('chart-builder-modal');
    if (modal) {
        modal.classList.remove('show');
        ModalManager.close('chart-builder');
    }
}

// ============================================
// INIZIALIZZAZIONE COMPONENTI
// ============================================
function initChartBuilder() {
    // Chart Type Selection
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            customChartConfig.type = this.dataset.type;
            updateConfigOptions();
        });
    });
    
    // Dimension Select
    const dimensionSelect = document.getElementById('dimension-select');
    if (dimensionSelect) {
        dimensionSelect.addEventListener('change', (e) => {
            customChartConfig.dimension = e.target.value;
        });
    }
    
	// Custom Title Input
const customTitleInput = document.getElementById('custom-title-input');
if (customTitleInput) {
    customTitleInput.addEventListener('input', (e) => {
        customChartConfig.customTitle = e.target.value.trim();
    });
}
	
    // Metric Select
    const metricSelect = document.getElementById('metric-select');
    if (metricSelect) {
        metricSelect.addEventListener('change', (e) => {
            customChartConfig.metric = e.target.value;
            updateTipologieVisibility();
        });
    }
    
    // Tipologie Checkboxes
    initTipologieCheckboxes();
    
    // Limit Select
    const limitSelect = document.getElementById('limit-select');
    if (limitSelect) {
        limitSelect.addEventListener('change', (e) => {
            customChartConfig.limit = parseInt(e.target.value);
        });
    }
    
    // Orientation Select
    const orientationSelect = document.getElementById('orientation-select');
    if (orientationSelect) {
        orientationSelect.addEventListener('change', (e) => {
            customChartConfig.orientation = e.target.value;
        });
    }
    
    // Color Mode
    const colorModeSelect = document.getElementById('color-mode-select');
    if (colorModeSelect) {
        colorModeSelect.addEventListener('change', (e) => {
            customChartConfig.colors.mode = e.target.value;
            updateColorControls();
        });
    }
    
    // Color Pickers
    initColorPickers();
    
    // Range Controls
    initRangeControls();
    
    // Variant Checkboxes
    initVariantCheckboxes();
    
    // Action Buttons
    const generateBtn = document.getElementById('btn-generate-chart');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateCustomChart);
    }
    
    const resetBtn = document.getElementById('btn-reset-builder');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetChartBuilder);
    }
    
    const downloadBtn = document.getElementById('btn-download-custom-chart');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadCustomChart);
    }
    
    // Preset Buttons
    document.querySelectorAll('.apply-preset').forEach(btn => {
        btn.addEventListener('click', function() {
            applyStylePreset(this.dataset.preset);
        });
    });
    
    // Listener per aggiornamento filtri
    window.addEventListener('filtersUpdated', () => {
        if (document.getElementById('chart-builder-modal').classList.contains('show')) {
            updateChartBuilderFiltersDisplay();
            updateFooterStats();
        }
    });
}

// ============================================
// TIPOLOGIE CHECKBOXES
// ============================================
function initTipologieCheckboxes() {
    const checkboxes = document.querySelectorAll('.tipologia-checkbox input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            const tipo = this.value;
            const parent = this.closest('.tipologia-checkbox');
            
            if (this.checked) {
                customChartConfig.tipologieSelezionate.push(tipo);
                parent.classList.add('checked');
            } else {
                customChartConfig.tipologieSelezionate = customChartConfig.tipologieSelezionate.filter(t => t !== tipo);
                parent.classList.remove('checked');
            }
        });
    });
}

function updateTipologieVisibility() {
    const tipologieGroup = document.getElementById('tipologie-group');
    if (tipologieGroup) {
        tipologieGroup.style.display = customChartConfig.metric === 'tipologia' ? 'block' : 'none';
    }
}

// ============================================
// COLOR CONTROLS
// ============================================
function initColorPickers() {
    const primaryColor = document.getElementById('primary-color');
    if (primaryColor) {
        primaryColor.addEventListener('input', (e) => {
            customChartConfig.colors.primary = e.target.value;
        });
    }
    
    const primaryGradient = document.getElementById('primary-color-gradient');
    if (primaryGradient) {
        primaryGradient.addEventListener('input', (e) => {
            customChartConfig.colors.primary = e.target.value;
        });
    }
    
    const secondaryColor = document.getElementById('secondary-color');
    if (secondaryColor) {
        secondaryColor.addEventListener('input', (e) => {
            customChartConfig.colors.secondary = e.target.value;
        });
    }
    
    // Color Picker per testo con aggiornamento automatico
    const textColor = document.getElementById('text-color');
    if (textColor) {
        textColor.addEventListener('input', (e) => {
            customChartConfig.colors.text = e.target.value;
            // Aggiorna automaticamente se il grafico esiste
            if (customChart) {
                updateChartColors();
            }
        });
    }
}

function updateColorControls() {
    const mode = customChartConfig.colors.mode;
    const singleGroup = document.getElementById('single-color-group');
    const gradientGroup = document.getElementById('gradient-color-group');
    
    if (singleGroup) singleGroup.style.display = mode === 'single' ? 'block' : 'none';
    if (gradientGroup) gradientGroup.style.display = mode === 'gradient' ? 'block' : 'none';
}

// ============================================
// RANGE CONTROLS
// ============================================
function initRangeControls() {
    initRangeControl('border-width', 'border-width-value', (val) => {
        customChartConfig.style.borderWidth = parseFloat(val);
    });
    
    initRangeControl('opacity', 'opacity-value', (val) => {
        customChartConfig.style.opacity = parseFloat(val);
    });
    
    initRangeControl('font-size', 'font-size-value', (val) => {
        customChartConfig.style.fontSize = parseInt(val);
    }, 'px');
    
    initRangeControl('title-size', 'title-size-value', (val) => {
        customChartConfig.style.titleSize = parseInt(val);
    }, 'px');
    
    initRangeControl('legend-size', 'legend-size-value', (val) => {
        customChartConfig.style.legendSize = parseInt(val);
    }, 'px');
    
    initRangeControl('grid-opacity', 'grid-opacity-value', (val) => {
        customChartConfig.style.gridOpacity = parseFloat(val);
    });
    
    initRangeControl('tension', 'tension-value', (val) => {
        customChartConfig.style.tension = parseFloat(val);
    });
    
    initRangeControl('point-radius', 'point-radius-value', (val) => {
        customChartConfig.style.pointRadius = parseInt(val);
    }, 'px');
}

function initRangeControl(inputId, displayId, callback, suffix = '') {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    
    if (input && display) {
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            display.textContent = value + suffix;
            callback(value);
        });
    }
}

// ============================================
// VARIANT CHECKBOXES
// ============================================
function initVariantCheckboxes() {
    const stackedCb = document.getElementById('stacked-variant');
    if (stackedCb) {
        stackedCb.addEventListener('change', (e) => {
            customChartConfig.variant.stacked = e.target.checked;
        });
    }
    
    const horizontalCb = document.getElementById('horizontal-variant');
    if (horizontalCb) {
        horizontalCb.addEventListener('change', (e) => {
            customChartConfig.variant.horizontal = e.target.checked;
        });
    }
    
    const showValuesCb = document.getElementById('show-values');
    if (showValuesCb) {
        showValuesCb.addEventListener('change', (e) => {
            customChartConfig.variant.showValues = e.target.checked;
        });
    }
    
    const showGridCb = document.getElementById('show-grid');
    if (showGridCb) {
        showGridCb.addEventListener('change', (e) => {
            customChartConfig.style.showGrid = e.target.checked;
        });
    }
    
    const showLegendCb = document.getElementById('show-legend');
    if (showLegendCb) {
        showLegendCb.addEventListener('change', (e) => {
            customChartConfig.style.showLegend = e.target.checked;
        });
    }
    
    const fillAreaCb = document.getElementById('fill-area');
    if (fillAreaCb) {
        fillAreaCb.addEventListener('change', (e) => {
            customChartConfig.style.fill = e.target.checked;
        });
    }
    
    const animationCb = document.getElementById('animation');
    if (animationCb) {
        animationCb.addEventListener('change', (e) => {
            customChartConfig.variant.animation = e.target.checked;
        });
    }
}

// ============================================
// CONFIG OPTIONS UPDATE
// ============================================
function updateConfigOptions() {
    const type = customChartConfig.type;
    
    const orientationGroup = document.getElementById('orientation-group');
    if (orientationGroup) {
        orientationGroup.style.display = type === 'bar' ? 'block' : 'none';
    }
    
    const stackedGroup = document.getElementById('stacked-group');
    if (stackedGroup) {
        stackedGroup.style.display = ['bar', 'line'].includes(type) ? 'block' : 'none';
    }
    
    const horizontalGroup = document.getElementById('horizontal-group');
    if (horizontalGroup) {
        horizontalGroup.style.display = type === 'bar' ? 'block' : 'none';
    }
    
    const fillGroup = document.getElementById('fill-group');
    if (fillGroup) {
        fillGroup.style.display = type === 'line' ? 'block' : 'none';
    }
    
    const tensionGroup = document.getElementById('tension-group');
    if (tensionGroup) {
        tensionGroup.style.display = ['line', 'radar'].includes(type) ? 'block' : 'none';
    }
    
    const pointGroup = document.getElementById('point-group');
    if (pointGroup) {
        pointGroup.style.display = ['line', 'scatter'].includes(type) ? 'block' : 'none';
    }
}

// ============================================
// PRESET STYLES
// ============================================
function applyStylePreset(preset) {
    const presets = {
        minimal: {
            borderWidth: 1,
            opacity: 0.6,
            fontSize: 10,
            titleSize: 14,
            legendSize: 10,
            gridOpacity: 0.05
        },
        default: {
            borderWidth: 2,
            opacity: 0.8,
            fontSize: 12,
            titleSize: 16,
            legendSize: 12,
            gridOpacity: 0.1
        },
        bold: {
            borderWidth: 4,
            opacity: 1,
            fontSize: 14,
            titleSize: 20,
            legendSize: 14,
            gridOpacity: 0.2
        },
        clean: {
            borderWidth: 0,
            opacity: 0.9,
            fontSize: 11,
            titleSize: 18,
            legendSize: 11,
            gridOpacity: 0
        }
    };
    
    if (presets[preset]) {
        Object.assign(customChartConfig.style, presets[preset]);
        
        // Update UI
        const updateInput = (id, value, displayId, suffix = '') => {
            const input = document.getElementById(id);
            const display = document.getElementById(displayId);
            if (input) input.value = value;
            if (display) display.textContent = value + suffix;
        };
        
        updateInput('border-width', presets[preset].borderWidth, 'border-width-value');
        updateInput('opacity', presets[preset].opacity, 'opacity-value');
        updateInput('font-size', presets[preset].fontSize, 'font-size-value', 'px');
        updateInput('title-size', presets[preset].titleSize, 'title-size-value', 'px');
        updateInput('legend-size', presets[preset].legendSize, 'legend-size-value', 'px');
        updateInput('grid-opacity', presets[preset].gridOpacity, 'grid-opacity-value');
    }
}

// ============================================
// FILTERS DISPLAY
// ============================================
// ============================================
// FILTERS DISPLAY - RINOMINATA PER EVITARE CONFLITTI
// ============================================
function updateChartBuilderFiltersDisplay() {  // ✅ RINOMINATA
    const container = document.getElementById('custom-chart-filters');
    if (!container) return;
    
    const activeFilters = [];
    
    if (typeof currentFilters !== 'undefined') {
        Object.entries(currentFilters).forEach(([key, value]) => {
            if (value && value !== '') {
                let label = key.replace('filter-', '').replace(/-/g, ' ');
                
                // Nomi più friendly
                const friendlyNames = {
                    'data selezionata': 'Data',
                    'anno': 'Anno',
                    'mese': 'Mese',
                    'giorno settimana': 'Giorno',
                    'tipologia': 'Tipo',
                    'circoscrizione': 'Circoscrizione',
                    'quartiere': 'Quartiere',
                    'giorno notte': 'Periodo',
                    'feriale weekend': 'Tipo Giorno'
                };
                
                label = friendlyNames[label] || label;
                activeFilters.push({ label, value });
            }
        });
    }
    
    if (activeFilters.length === 0) {
        container.innerHTML = '<span class="no-filters">Nessun filtro applicato</span>';
    } else {
        container.innerHTML = activeFilters.map(f => 
            `<span class="filter-badge">
                <i class="fas fa-filter"></i>
                ${f.label}: ${f.value}
            </span>`
        ).join('');
    }
}

function updateFooterStats() {
    const totalEl = document.getElementById('custom-chart-total');
    const periodEl = document.getElementById('custom-chart-period');
    
    if (!totalEl || !periodEl) return;
    
    const data = typeof getFilteredData !== 'undefined' ? getFilteredData() : [];
    totalEl.textContent = `${data.length.toLocaleString('it-IT')} incidenti`;
    
    let period = '2015-2023';
    if (typeof currentFilters !== 'undefined' && currentFilters['filter-anno']) {
        period = currentFilters['filter-anno'];
        if (currentFilters['filter-mese']) {
            period += ` - ${currentFilters['filter-mese']}`;
        }
    }
    periodEl.textContent = period;
}

// ============================================
// CHART GENERATION
// ============================================
function generateCustomChart() {
    if (!customChartConfig.dimension) {
        alert('⚠️ Seleziona una dimensione per generare il grafico');
        return;
    }
    
    const filteredData = typeof getFilteredData !== 'undefined' ? getFilteredData() : [];
    
    if (filteredData.length === 0) {
        alert('⚠️ Nessun dato disponibile con i filtri attuali');
        return;
    }
    
    const chartData = prepareChartData(filteredData);
    renderCustomChart(chartData);
}

function prepareChartData(data) {
    const dimension = customChartConfig.dimension;
    const metric = customChartConfig.metric;
    const limit = customChartConfig.limit;
    
    let aggregatedData = {};
    
    if (metric === 'count') {
        data.forEach(row => {
            const value = row[dimension];
            if (value && value !== 'null') {
                aggregatedData[value] = (aggregatedData[value] || 0) + 1;
            }
        });
    } else if (metric === 'tipologia') {
        const tipiDaUsare = customChartConfig.tipologieSelezionate.length > 0 
            ? customChartConfig.tipologieSelezionate 
            : ['M', 'R', 'F', 'C', 'TOTAL'];
        
        data.forEach(row => {
            const value = row[dimension];
            const tipo = row['Tipologia'];
            if (value && value !== 'null') {
                if (!aggregatedData[value]) {
                    aggregatedData[value] = { M: 0, R: 0, F: 0, C: 0, TOTAL: 0 };
                }
                // Incrementa la tipologia specifica
                if (tipo && ['M', 'R', 'F', 'C'].includes(tipo)) {
                    aggregatedData[value][tipo]++;
                }
                // Incrementa sempre il totale
                aggregatedData[value].TOTAL++;
            }
        });
    }
    
    let dataArray = Object.entries(aggregatedData).map(([key, value]) => ({
        label: key,
        value: value
    }));
    
    if (metric === 'count') {
        dataArray.sort((a, b) => b.value - a.value);
    } else {
        dataArray.sort((a, b) => {
            const totalA = Object.values(a.value).reduce((sum, v) => sum + v, 0);
            const totalB = Object.values(b.value).reduce((sum, v) => sum + v, 0);
            return totalB - totalA;
        });
    }
    
    if (limit > 0) {
        dataArray = dataArray.slice(0, limit);
    }
    
    dataArray = sortByDimension(dataArray, dimension);
    
    return dataArray;
}

function sortByDimension(dataArray, dimension) {
    const monthOrder = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const dayOrder = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
    const seasonOrder = ['Primavera', 'Estate', 'Autunno', 'Inverno'];
    const timeOrder = ['Notte', 'Alba', 'Mattina', 'Pranzo', 'Pomeriggio', 'Sera'];
    
    if (dimension === 'Mese') {
        return dataArray.sort((a, b) => monthOrder.indexOf(a.label) - monthOrder.indexOf(b.label));
    } else if (dimension === 'Giorno settimana') {
        return dataArray.sort((a, b) => dayOrder.indexOf(a.label) - dayOrder.indexOf(b.label));
    } else if (dimension === 'Stagione') {
        return dataArray.sort((a, b) => seasonOrder.indexOf(a.label) - seasonOrder.indexOf(b.label));
    } else if (dimension === 'Fascia oraria dettagliata (6 fasce)') {
        return dataArray.sort((a, b) => timeOrder.indexOf(a.label) - timeOrder.indexOf(b.label));
    } else if (dimension === 'Anno') {
        return dataArray.sort((a, b) => parseInt(a.label) - parseInt(b.label));
    }
    
    return dataArray;
}

// ============================================
// CHART RENDERING
// ============================================
function renderCustomChart(data) {
    const canvas = document.getElementById('custom-chart-canvas');
    const wrapper = document.getElementById('chart-wrapper-custom');
    const placeholder = document.querySelector('.preview-placeholder');
    
    if (!canvas) return;
    
    if (wrapper) {
        wrapper.style.display = 'block';
        wrapper.classList.add('active');
    }
    if (placeholder) placeholder.style.display = 'none';
    
    if (customChart) {
        customChart.destroy();
    }
    
    const chartDatasets = prepareChartDatasets(data);
    const chartLabels = data.map(d => d.label);
    
    const config = {
        type: customChartConfig.type,
        data: {
            labels: chartLabels,
            datasets: chartDatasets
        },
        options: getChartOptions()
    };
    
    customChart = new Chart(canvas, config);
}

function prepareChartDatasets(data) {
    const metric = customChartConfig.metric;
    const type = customChartConfig.type;
    const style = customChartConfig.style;
    const colors = customChartConfig.colors;
    
    if (metric === 'count') {
        const values = data.map(d => d.value);
        let bgColors, borderColors;
        
        if (colors.mode === 'single') {
            bgColors = values.map(() => hexToRgba(colors.primary, style.opacity));
            borderColors = values.map(() => colors.primary);
        } else if (colors.mode === 'gradient') {
            bgColors = generateGradientColors(data.length, colors.primary, colors.secondary, style.opacity);
            borderColors = bgColors.map(c => c.replace(/[\d.]+\)$/g, '1)'));
        } else {
            // Usa colori di default come analytics
            if (['pie', 'doughnut', 'polarArea'].includes(type)) {
                const baseColors = generateColors(data.length);
                bgColors = baseColors.map(c => hexToRgba(c, style.opacity));
                borderColors = baseColors;
            } else {
                bgColors = generateGradientColors(data.length, '#3b82f6', '#8b5cf6', style.opacity);
                borderColors = bgColors.map(c => c.replace(/[\d.]+\)$/g, '1)'));
            }
        }
        
        return [{
            label: 'Incidenti',
            data: values,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: style.borderWidth,
            fill: type === 'line' ? style.fill : true,
            tension: style.tension,
            pointRadius: style.pointRadius,
            pointHoverRadius: style.pointRadius + 2,
            pointBackgroundColor: borderColors,
            pointBorderColor: '#fff',
            pointBorderWidth: 1
        }];
    } else {
        // Metric tipologia
        const tipologieMap = {
            'M': { label: 'Mortali', color: '#ef4444' },
            'R': { label: 'Riserva', color: '#a855f7' },
            'F': { label: 'Feriti', color: '#f59e0b' },
            'C': { label: 'Cose', color: '#10b981' },
            'TOTAL': { label: 'Totale', color: '#3b82f6' }
        };
        
        const tipiDaVisualizzare = customChartConfig.tipologieSelezionate.length > 0 
            ? customChartConfig.tipologieSelezionate 
            : ['M', 'R', 'F', 'C', 'TOTAL'];
        
        return tipiDaVisualizzare.map(tipo => ({
            label: tipologieMap[tipo].label,
            data: data.map(d => d.value[tipo] || 0),
            backgroundColor: hexToRgba(tipologieMap[tipo].color, style.opacity),
            borderColor: tipologieMap[tipo].color,
            borderWidth: style.borderWidth,
            fill: type === 'line' ? style.fill : true,
            tension: style.tension,
            pointRadius: style.pointRadius,
            pointBackgroundColor: tipologieMap[tipo].color,
            pointBorderColor: '#fff',
            pointBorderWidth: 1
        }));
    }
}


function getChartOptions() {
    const type = customChartConfig.type;
    const style = customChartConfig.style;
    const variant = customChartConfig.variant;
    const dimension = customChartConfig.dimension;
    const textColor = customChartConfig.colors.text;
    
    // ✅ Costruisci titolo con titolo personalizzato o dimension
    let titleText = customChartConfig.customTitle || dimension;
    
    if (typeof currentFilters !== 'undefined') {
        const filters = [];
        if (currentFilters['filter-anno']) filters.push(currentFilters['filter-anno']);
        if (currentFilters['filter-mese']) filters.push(currentFilters['filter-mese']);
        if (currentFilters['filter-giorno-settimana']) filters.push(currentFilters['filter-giorno-settimana']);
        if (currentFilters['filter-tipologia']) {
            const tipoNames = { M: 'Mortali', R: 'Riserva', F: 'Feriti', C: 'Cose' };
            filters.push(tipoNames[currentFilters['filter-tipologia']]);
        }
        if (filters.length > 0) {
            titleText += ' - ' + filters.join(' • ');
        }
    }
    
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: variant.animation ? { duration: 750 } : false,
        plugins: {
            legend: {
                display: style.showLegend,
                position: 'bottom',
                labels: {
                    color: textColor,
                    font: { size: style.legendSize, family: 'Titillium Web' },
                    padding: 15,
                    usePointStyle: true
                }
            },
            title: {
                display: true,
                text: titleText,
                color: textColor,
                font: { size: style.titleSize, weight: 'bold', family: 'Titillium Web' },
                padding: 20
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                padding: 12,
                titleFont: { size: style.fontSize + 1, weight: 'bold' },
                bodyFont: { size: style.fontSize },
                titleColor: '#fff',
                bodyColor: '#fff'
            },
            datalabels: {
                display: function(context) {
                    if (['line', 'scatter', 'bubble'].includes(type)) {
                        return false;
                    }
                    return variant.showValues;
                },
                color: textColor,
                anchor: function(context) {
                    if (['pie', 'doughnut', 'polarArea'].includes(type)) {
                        return 'end';
                    }
                    if (type === 'radar') {
                        return 'end';
                    }
                    const value = context.dataset.data[context.dataIndex];
                    const max = Math.max(...context.dataset.data);
                    return value > max * 0.2 ? 'center' : 'end';
                },
                align: function(context) {
                    if (['pie', 'doughnut', 'polarArea'].includes(type)) {
                        return 'end';
                    }
                    if (type === 'radar') {
                        return 'end';
                    }
                    const value = context.dataset.data[context.dataIndex];
                    const max = Math.max(...context.dataset.data);
                    return value > max * 0.2 ? 'center' : 'end';
                },
                offset: function(context) {
                    if (['pie', 'doughnut', 'polarArea'].includes(type)) {
                        return 10;
                    }
                    if (type === 'radar') {
                        return 10;
                    }
                    const value = context.dataset.data[context.dataIndex];
                    const max = Math.max(...context.dataset.data);
                    return value > max * 0.2 ? 0 : 4;
                },
                font: { 
                    weight: 'bold', 
                    size: style.fontSize - 1,
                    family: 'Titillium Web'
                },
                borderRadius: 4,
                padding: { top: 3, right: 5, bottom: 3, left: 5 }
            }
        }
    };
    
    if (type === 'bar') {
        baseOptions.indexAxis = variant.horizontal || customChartConfig.orientation === 'horizontal' ? 'y' : 'x';
        baseOptions.scales = {
            x: {
                stacked: variant.stacked,
                ticks: { 
                    color: textColor, 
                    font: { size: style.fontSize } 
                },
                grid: { 
                    display: style.showGrid, 
                    color: `rgba(148, 163, 184, ${style.gridOpacity})` 
                }
            },
            y: {
                stacked: variant.stacked,
                beginAtZero: true,
                ticks: { 
                    color: textColor, 
                    font: { size: style.fontSize } 
                },
                grid: { 
                    display: style.showGrid, 
                    color: `rgba(148, 163, 184, ${style.gridOpacity})` 
                }
            }
        };
    } else if (type === 'line') {
        baseOptions.scales = {
            x: {
                ticks: { 
                    color: textColor, 
                    font: { size: style.fontSize } 
                },
                grid: { 
                    display: style.showGrid, 
                    color: `rgba(148, 163, 184, ${style.gridOpacity})` 
                }
            },
            y: {
                stacked: variant.stacked,
                beginAtZero: true,
                ticks: { 
                    color: textColor, 
                    font: { size: style.fontSize } 
                },
                grid: { 
                    display: style.showGrid, 
                    color: `rgba(148, 163, 184, ${style.gridOpacity})` 
                }
            }
        };
    } else if (type === 'radar') {
        baseOptions.scales = {
            r: {
                beginAtZero: true,
                ticks: { 
                    color: textColor, 
                    backdropColor: 'transparent',
                    font: { size: style.fontSize },
                    showLabelBackdrop: false
                },
                grid: { color: `rgba(148, 163, 184, ${style.gridOpacity * 3})` },
                angleLines: { color: `rgba(148, 163, 184, ${style.gridOpacity * 3})` },
                pointLabels: { 
                    color: textColor, 
                    font: { size: style.fontSize, weight: '600' } 
                }
            }
        };
    } else if (type === 'polarArea') {
        baseOptions.scales = {
            r: {
                beginAtZero: true,
                ticks: { 
                    color: textColor, 
                    backdropColor: 'transparent',
                    font: { size: style.fontSize },
                    showLabelBackdrop: false
                },
                grid: { color: `rgba(148, 163, 184, ${style.gridOpacity * 3})` }
            }
        };
    }
    
    return baseOptions;
}



// ============================================
// COLOR UTILITIES
// ============================================
function generateColors(count) {
    const baseColors = [
        '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', 
        '#ef4444', '#ec4899', '#06b6d4', '#84cc16'
    ];
    return baseColors.slice(0, count);
}

function generateGradientColors(count, startColor, endColor, opacity = 1) {
    const start = hexToRgb(startColor);
    const end = hexToRgb(endColor);
    const colors = [];
    
    for (let i = 0; i < count; i++) {
        const ratio = count > 1 ? i / (count - 1) : 0;
        const r = Math.round(start.r + (end.r - start.r) * ratio);
        const g = Math.round(start.g + (end.g - start.g) * ratio);
        const b = Math.round(start.b + (end.b - start.b) * ratio);
        colors.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
    }
    
    return colors;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
}

function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// ============================================
// RESET & DOWNLOAD
// ============================================
function resetChartBuilder() {
    customChartConfig = {
        type: 'bar',
        dimension: null,
        metric: 'count',
        tipologieSelezionate: [],
        limit: 10,
        orientation: 'vertical',
		customTitle: '',
        colors: {
            mode: 'auto',
            primary: '#3b82f6',
            secondary: '#8b5cf6',
            text: '#1f2937'
        },
        style: {
            borderWidth: 2,
            opacity: 0.8,
            fontSize: 12,
            titleSize: 16,
            legendSize: 12,
            gridOpacity: 0.1,
            showGrid: true,
            showLegend: true,
            tension: 0.4,
            pointRadius: 3,
            fill: true
        },
        variant: {
            stacked: false,
            horizontal: false,
            showValues: true,
            animation: true
        }
    };
    
    // Reset UI
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === 'bar') btn.classList.add('active');
    });
    
    const selects = ['dimension-select', 'metric-select', 'limit-select', 'orientation-select', 'color-mode-select'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.selectedIndex = 0;
    });
    
    document.querySelectorAll('.tipologia-checkbox input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.tipologia-checkbox').classList.remove('checked');
    });
    
    // Reset color pickers
    const primaryColor = document.getElementById('primary-color');
    if (primaryColor) primaryColor.value = '#3b82f6';
    
    const primaryGradient = document.getElementById('primary-color-gradient');
    if (primaryGradient) primaryGradient.value = '#3b82f6';
    
    const secondaryColor = document.getElementById('secondary-color');
    if (secondaryColor) secondaryColor.value = '#8b5cf6';
    
    const textColor = document.getElementById('text-color');
    if (textColor) textColor.value = '#1f2937';
    
    applyStylePreset('default');
    
    if (customChart) {
        customChart.destroy();
        customChart = null;
    }
    
    const wrapper = document.getElementById('chart-wrapper-custom');
    const placeholder = document.querySelector('.preview-placeholder');
    if (wrapper) wrapper.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
}

async function downloadCustomChart() {
    if (!customChart) {
        alert('⚠️ Genera prima un grafico da scaricare');
        return;
    }
    
    const canvas = document.getElementById('custom-chart-canvas');
    if (!canvas) return;
    
    const targetWidth = 800;
    const originalRatio = canvas.height / canvas.width;
    const targetHeight = Math.max(Math.round(targetWidth * originalRatio), 600);
    
    const headerHeight = 100;
    const footerHeight = 70;
    const chartAreaHeight = targetHeight - headerHeight - footerHeight;
    
    // Canvas finale
    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');
    
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    
    // Sfondo bianco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    
    // HEADER - USA IL COLORE DEL TESTO PERSONALIZZATO
    const textColor = customChartConfig.colors.text;
    ctx.fillStyle = textColor;
    ctx.font = 'bold 22px Titillium Web, Arial, sans-serif';
    ctx.textAlign = 'left';
    
    // ✅ COSTRUZIONE TITOLO - UNA SOLA VOLTA
    const baseTitle = customChartConfig.customTitle || customChartConfig.dimension || 'Grafico Analytics';
    let finalTitle = baseTitle;
    
    if (typeof currentFilters !== 'undefined') {
        const filters = [];
        if (currentFilters['filter-anno']) filters.push(currentFilters['filter-anno']);
        if (currentFilters['filter-mese']) filters.push(currentFilters['filter-mese']);
        if (currentFilters['filter-giorno-settimana']) filters.push(currentFilters['filter-giorno-settimana']);
        if (filters.length > 0) {
            finalTitle += ' - ' + filters.join(' • ');
        }
    }
    
    ctx.fillText(finalTitle, 40, 35);
    
    // Filtri
    ctx.font = '13px Titillium Web, Arial, sans-serif';
    const activeFilters = document.getElementById('custom-chart-filters');
    let filtersText = 'Chart Builder - Grafico Personalizzato';
    
    if (activeFilters) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = activeFilters.innerHTML;
        filtersText = tempDiv.textContent || tempDiv.innerText || '';
        filtersText = filtersText.replace(/\(\d+\.?\d*\)/g, '').trim();
    }
    
    const lines = wrapText(ctx, filtersText, targetWidth - 80, 13);
    lines.forEach((line, index) => {
        ctx.fillText(line, 40, 60 + (index * 18));
    });
    
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, headerHeight - 15);
    ctx.lineTo(targetWidth - 40, headerHeight - 15);
    ctx.stroke();
    
    // GRAFICO
    const chartCanvas = document.createElement('canvas');
    const chartWidth = targetWidth - 80;
    const chartHeight = chartAreaHeight;
    
    chartCanvas.width = chartWidth;
    chartCanvas.height = chartHeight;
    
    const chartCtx = chartCanvas.getContext('2d');
    chartCtx.fillStyle = '#FFFFFF';
    chartCtx.fillRect(0, 0, chartWidth, chartHeight);
    chartCtx.drawImage(canvas, 0, 0, chartWidth, chartHeight);
    
    ctx.drawImage(chartCanvas, 40, headerHeight);
    
    // FOOTER - USA IL COLORE DEL TESTO PERSONALIZZATO
    ctx.strokeStyle = '#d1d5db';
    ctx.beginPath();
    ctx.moveTo(40, targetHeight - footerHeight + 10);
    ctx.lineTo(targetWidth - 40, targetHeight - footerHeight + 10);
    ctx.stroke();
    
    ctx.font = '11px Titillium Web, Arial, sans-serif';
    ctx.fillStyle = textColor;
    ctx.fillText('Fonte: dati.gov.it - Rielaborazione: opendatasicilia.it', 40, targetHeight - 40);
    ctx.fillText('https://opendatasicilia.github.io/incidenti_palermo/', 40, targetHeight - 20);
    
    // Logo
    try {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        await new Promise((resolve) => {
            logo.onload = resolve;
            logo.onerror = resolve;
            logo.src = 'img/pa_hub_new.png';
        });
        
        if (logo.complete && logo.naturalWidth > 0) {
            const logoWidth = 100;
            const logoHeight = (logoWidth * logo.naturalHeight) / logo.naturalWidth;
            ctx.drawImage(logo, targetWidth - logoWidth - 40, targetHeight - footerHeight + 15, logoWidth, logoHeight);
        }
    } catch (e) {}
    
    // Download
    const dataURL = finalCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    const safeFilename = (customChartConfig.customTitle || customChartConfig.dimension || 'grafico').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeFilename}_${targetWidth}x${targetHeight}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    ctx.font = `${fontSize}px Titillium Web`;
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}