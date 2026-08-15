L.Control.Basemaps = L.Control.extend({
    _map: null,
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
    options: {
        position: "topright",
        tileX: 0,
        tileY: 0,
        tileZ: 0,
        layers: [], // list of basemap layer objects, first in list is default and added to map with this control
        // se true: niente stato "closed" compatto, niente hover-per-aprire,
        // niente doppio-tap su mobile. Usato quando il pannello e' innestato
        // in un dropdown esterno (toolbar) che gia' gestisce apertura/chiusura
        embedded: false
    },
    basemap: null,
    onAdd: function(map) {
        this._map = map;
        var container = L.DomUtil.create("div", "basemaps leaflet-control" + (this.options.embedded ? "" : " closed"));

        // disable events
        L.DomEvent.disableClickPropagation(container);
        if (!L.Browser.touch) {
            L.DomEvent.disableScrollPropagation(container);
        }

        if (this.options.title) {
            var titleNode = L.DomUtil.create("div", "basemaps-title", container);
            titleNode.textContent = this.options.title;
        }

        this._mode = "base";
        this.overlayLayer = null;

        // precisione della georeferenziazione: giudizio editoriale (non una misura), su 3 fasce,
        // per non far credere che lo swipe/l'occhio di bue siano accurati quanto le mappe moderne
        // anche per i rilievi ottocenteschi non triangolati
        var ACCURACY_META = {
            alta: { label: "Precisione alta", title: "Precisione alta: rilievo aerofotogrammetrico o cartografia tecnica moderna, buona corrispondenza con la mappa attuale." },
            media: { label: "Precisione media", title: "Precisione media: rilievo topografico/catastale pre-aerofotogrammetria, corrispondenza approssimativa con la mappa attuale." },
            bassa: { label: "Precisione bassa", title: "Precisione bassa: disegno o incisione storica non rilevata scientificamente, la sovrapposizione è puramente indicativa." }
        };
        function setAccuracyDot(dotNode, accuracy) {
            if (!dotNode) { return; }
            dotNode.className = "basemaps-timeslider-accuracy";
            var meta = ACCURACY_META[accuracy];
            if (!meta) { dotNode.style.display = "none"; dotNode.title = ""; return; }
            dotNode.style.display = "";
            L.DomUtil.addClass(dotNode, "basemaps-timeslider-accuracy-" + accuracy);
            dotNode.title = meta.title;
        }

        if (this.options.overlays) {
            var modeRow = L.DomUtil.create("div", "basemaps-mode", container);
            var modeIndicator = L.DomUtil.create("span", "basemaps-mode-indicator", modeRow);
            var baseBtn = L.DomUtil.create("a", "basemaps-mode-btn active", modeRow);
            baseBtn.href = "#";
            baseBtn.textContent = "Base cartografica";
            var overlayBtn = L.DomUtil.create("a", "basemaps-mode-btn", modeRow);
            overlayBtn.href = "#";
            overlayBtn.textContent = "Storica sovrapposta";

            var modeDescription = L.DomUtil.create("div", "basemaps-mode-description", container);
            var modeDescriptions = {
                base: "Seleziona la cartografia da usare come base.",
                overlay: "Seleziona la cartografia storica da sovrapporre alla mappa attuale."
            };
            modeDescription.textContent = modeDescriptions.base;

            L.DomEvent.on(baseBtn, "click", function(e) {
                L.DomEvent.stop(e);
                this._mode = "base";
                L.DomUtil.addClass(baseBtn, "active");
                L.DomUtil.removeClass(overlayBtn, "active");
                L.DomUtil.removeClass(modeRow, "mode-overlay");
                modeDescription.textContent = modeDescriptions.base;
                L.DomUtil.removeClass(container, "closed");
            }, this);
            L.DomEvent.on(overlayBtn, "click", function(e) {
                L.DomEvent.stop(e);
                this._mode = "overlay";
                L.DomUtil.addClass(overlayBtn, "active");
                L.DomUtil.removeClass(baseBtn, "active");
                L.DomUtil.addClass(modeRow, "mode-overlay");
                modeDescription.textContent = modeDescriptions.overlay;
                L.DomUtil.removeClass(container, "closed");
            }, this);

            // trova l'overlay già attivo sulla mappa (es. la mappa storica di default) per mostrarlo evidenziato fin da subito
            this.options.overlays.forEach(function(o) {
                if (o && map.hasLayer(o)) {
                    this.overlayLayer = o;
                }
            }, this);

            var currentYear = new Date().getFullYear();
            var modernCount = 0;
            var yearEntries = [];
            this.options.basemaps.forEach(function(d, i) {
                var overlayLayer = this.options.overlays[i];
                var caption = d.options && d.options.caption;
                if (!overlayLayer || !caption) { return; }
                var year = null;
                if (/^\d{4}$/.test(caption)) {
                    year = parseInt(caption, 10);
                } else if (d.options && d.options.group === "Basi moderne") {
                    // OSM/Google/Satellite non hanno un anno storico: rappresentano la cartografia
                    // di oggi, quindi diventano l'estremo destro dello slider (anno corrente).
                    // Ora che la traccia è in anni reali, più basi moderne allo stesso anno
                    // finirebbero sovrapposte nello stesso punto: le si distanzia di un anno
                    // l'una dall'altra, restando comunque vicinissime a "oggi".
                    year = currentYear - modernCount;
                    modernCount++;
                }
                if (year) {
                    yearEntries.push({ year: year, layer: overlayLayer, node: null, label: (d.options && d.options.label) || caption, accuracy: d.options && d.options.georefAccuracy });
                }
            }, this);
            yearEntries.sort(function(a, b) { return a.year - b.year; });

            // punto di partenza dello slider: l'overlay già attivo in mappa
            // (rilevato sopra), non semplicemente il primo/piu' vecchio anno
            var initialEntry = yearEntries[0];
            for (var ie = 0; ie < yearEntries.length; ie++) {
                if (yearEntries[ie].layer === this.overlayLayer) { initialEntry = yearEntries[ie]; break; }
            }

            var sliderInput = null;
            var sliderYearLabel = null;
            var sliderNameLabel = null;
            var sliderAccuracyDot = null;
            if (yearEntries.length >= 2) {
                var sliderRow = L.DomUtil.create("div", "basemaps-timeslider", container);
                var sliderLabelRow = L.DomUtil.create("div", "basemaps-timeslider-label", sliderRow);
                var sliderYearFrom = L.DomUtil.create("span", "basemaps-timeslider-bound", sliderLabelRow);
                sliderYearFrom.textContent = yearEntries[0].year;
                var sliderCurrentWrap = L.DomUtil.create("span", "basemaps-timeslider-current-wrap", sliderLabelRow);
                sliderYearLabel = L.DomUtil.create("span", "basemaps-timeslider-current", sliderCurrentWrap);
                sliderYearLabel.textContent = initialEntry.year;
                sliderAccuracyDot = L.DomUtil.create("span", "basemaps-timeslider-accuracy", sliderCurrentWrap);
                var sliderYearTo = L.DomUtil.create("span", "basemaps-timeslider-bound", sliderLabelRow);
                sliderYearTo.textContent = yearEntries[yearEntries.length - 1].year;

                var sliderTrack = L.DomUtil.create("div", "basemaps-timeslider-track", sliderRow);
                var sliderPrevBtn = L.DomUtil.create("a", "basemaps-timeslider-nav basemaps-timeslider-prev", sliderTrack);
                sliderPrevBtn.href = "#";
                sliderPrevBtn.innerHTML = "&#10094;";
                sliderPrevBtn.title = "Mappa precedente";

                sliderInput = L.DomUtil.create("input", "basemaps-timeslider-input", sliderTrack);
                sliderInput.type = "range";
                // min/max/value in anni reali (non indici): il browser posiziona
                // thumb e tacche linearmente sul valore, quindi la distanza fisica
                // sullo slider riflette la distanza cronologica reale tra le mappe.
                sliderInput.min = yearEntries[0].year;
                sliderInput.max = yearEntries[yearEntries.length - 1].year;
                sliderInput.step = 1;
                sliderInput.value = initialEntry.year;

                var sliderNextBtn = L.DomUtil.create("a", "basemaps-timeslider-nav basemaps-timeslider-next", sliderTrack);
                sliderNextBtn.href = "#";
                sliderNextBtn.innerHTML = "&#10095;";
                sliderNextBtn.title = "Mappa successiva";

                var sliderTicksId = "basemaps-timeslider-ticks-" + L.Util.stamp(this);
                var sliderTicks = L.DomUtil.create("datalist", null, sliderRow);
                sliderTicks.id = sliderTicksId;
                for (var ti = 0; ti < yearEntries.length; ti++) {
                    var tickOption = L.DomUtil.create("option", null, sliderTicks);
                    tickOption.value = yearEntries[ti].year;
                }
                sliderInput.setAttribute("list", sliderTicksId);

                var nameRow = L.DomUtil.create("div", "basemaps-timeslider-name-row", sliderRow);
                sliderNameLabel = L.DomUtil.create("span", "basemaps-timeslider-name", nameRow);
                sliderNameLabel.textContent = initialEntry.label;
                sliderNameLabel.title = initialEntry.label;
                setAccuracyDot(sliderAccuracyDot, initialEntry.accuracy);

                // legenda fissa della precisione: sta nell'angolo bottomleft di Leaflet,
                // che leaflet-sidebar.css gia' sincronizza (transition + offset) con
                // l'apertura/chiusura della sidebar, quindi nessun sync JS aggiuntivo serve
                var accuracyLegend = L.control({ position: "bottomleft" });
                accuracyLegend.onAdd = function() {
                    var legendDiv = L.DomUtil.create("div", "basemaps-accuracy-legend");
                    L.DomEvent.disableClickPropagation(legendDiv);
                    legendDiv.title = "Precisione della georeferenziazione delle mappe storiche";
                    var legendTitle = L.DomUtil.create("div", "basemaps-accuracy-legend-title", legendDiv);
                    legendTitle.textContent = "Precisione georeferenziazione";
                    ["alta", "media", "bassa"].forEach(function(key) {
                        var row = L.DomUtil.create("div", "basemaps-accuracy-legend-row", legendDiv);
                        row.title = ACCURACY_META[key].title;
                        var dot = L.DomUtil.create("span", "basemaps-timeslider-accuracy", row);
                        setAccuracyDot(dot, key);
                        var label = L.DomUtil.create("span", "basemaps-accuracy-legend-label", row);
                        label.textContent = ACCURACY_META[key].label;
                    });
                    // legenda parte sempre aperta (anche mobile); tap per espandere/richiudere
                    L.DomEvent.on(legendDiv, "click", function () {
                        legendDiv.classList.toggle("collapsed");
                    });
                    return legendDiv;
                };
                accuracyLegend.addTo(map);
                this._accuracyLegend = accuracyLegend;
            }
        }

        var self = this;

        function updateSliderForLayer(layer) {
            if (!sliderInput) { return; }
            for (var k = 0; k < yearEntries.length; k++) {
                if (yearEntries[k].layer === layer) {
                    sliderInput.value = yearEntries[k].year;
                    if (sliderYearLabel) { sliderYearLabel.textContent = yearEntries[k].year; }
                    if (sliderNameLabel) {
                        sliderNameLabel.textContent = yearEntries[k].label;
                        sliderNameLabel.title = yearEntries[k].label;
                    }
                    setAccuracyDot(sliderAccuracyDot, yearEntries[k].accuracy);
                    return;
                }
            }
        }

        function applyOverlayLayer(newLayer, newNode, closePanel) {
            if (!newLayer || newLayer === self.overlayLayer) { return; }
            if (self.overlayLayer) { map.removeLayer(self.overlayLayer); }
            map.addLayer(newLayer);
            self.overlayLayer = newLayer;

            var prevActive = container.getElementsByClassName("basemap overlay-active")[0];
            if (prevActive) { L.DomUtil.removeClass(prevActive, "overlay-active"); }
            if (newNode) { L.DomUtil.addClass(newNode, "overlay-active"); }

            if (closePanel && !self.options.embedded) { L.DomUtil.addClass(container, "closed"); }

            updateSliderForLayer(newLayer);
        }

        var lastGroup = null;

        this.options.basemaps.forEach(function(d, i) {
            var basemapClass = "basemap";

            if (d.options && d.options.group && d.options.group !== lastGroup) {
                lastGroup = d.options.group;
                var groupHeader = L.DomUtil.create("h4", "basemaps-group", container);
                groupHeader.textContent = lastGroup;
            }

            var overlayLayer = this.options.overlays ? this.options.overlays[i] : null;
            if (overlayLayer && overlayLayer === this.overlayLayer) {
                basemapClass += " overlay-active";
            }

            if (i === 0) {
                this.basemap = d;
                this._map.addLayer(d);
                basemapClass += " active";
            } else if (i === 1) {
                basemapClass += " alt";
            }
            var url;
            if (d.options.iconURL) {
                url = d.options.iconURL;
            } else {
                var coords = { x: this.options.tileX, y: this.options.tileY };
                url = L.Util.template(
                    d._url,
                    L.extend(
                        {
                            s: d._getSubdomain(coords),
                            x: coords.x,
                            y: d.options.tms ? d._globalTileRange.max.y - coords.y : coords.y,
                            z: this.options.tileZ
                        },
                        d.options
                    )
                );

                if (d instanceof L.TileLayer.WMS) {
                    // d may not yet be initialized, yet functions below expect ._map to be set
                    d._map = map;

                    // unfortunately, calling d.getTileUrl() does not work due to scope issues
                    // have to replicate some of the logic from L.TileLayer.WMS

                    // adapted from L.TileLayer.WMS::onAdd
                    var crs = d.options.crs || map.options.crs;
                    var wmsParams = L.extend({}, d.wmsParams);
                    var wmsVersion = parseFloat(wmsParams.version);
                    var projectionKey = wmsVersion >= 1.3 ? "crs" : "srs";
                    wmsParams[projectionKey] = crs.code;

                    // adapted from L.TileLayer.WMS::getTileUrl
                    var coords2 = L.point(coords);
                    coords2.z = this.options.tileZ;
                    var tileBounds = d._tileCoordsToBounds(coords2);
                    var nw = crs.project(tileBounds.getNorthWest());
                    var se = crs.project(tileBounds.getSouthEast());
                    var bbox = (wmsVersion >= 1.3 && crs === L.CRS.EPSG4326
                        ? [se.y, nw.x, nw.y, se.x]
                        : [nw.x, se.y, se.x, nw.y]
                    ).join(",");

                    url +=
                        L.Util.getParamString(wmsParams, url, d.options.uppercase) +
                        (d.options.uppercase ? "&BBOX=" : "&bbox=") +
                        bbox;
                }
            }

            var basemapNode = L.DomUtil.create("div", basemapClass, container);
            var imgNode = L.DomUtil.create("img", null, basemapNode);
            imgNode.src = url;
            if (overlayLayer) {
                for (var ye = 0; ye < yearEntries.length; ye++) {
                    if (yearEntries[ye].layer === overlayLayer) {
                        yearEntries[ye].node = basemapNode;
                        break;
                    }
                }
            }
            if (d.options && d.options.label) {
                imgNode.title = d.options.label;
            }
            if (d.options && d.options.caption) {
                var captionNode = L.DomUtil.create("span", "basemap-caption", basemapNode);
                captionNode.textContent = d.options.caption;
            }

            L.DomEvent.on(
                basemapNode,
                "click",
                function() {
                    // intercept open click on mobile devices, and on desktop when il pannello
                    // resta chiuso in modalità overlay (lo slider compatto non apre più con l'hover)
                    // salta l'intercetto in modalità "embedded": l'apertura/chiusura e' gia'
                    // gestita dal dropdown esterno, quindi ogni click deve selezionare subito
                    if (!this.options.embedded && this.options.basemaps.length > 2 && (L.Browser.mobile || this._mode === "overlay")) {
                        if (L.DomUtil.hasClass(container, "closed")) {
                            L.DomUtil.removeClass(container, "closed");
                            return;
                        }
                    }

                    if (this._mode === "overlay") {
                        applyOverlayLayer(overlayLayer, basemapNode, true);
                        return;
                    }

                    //if different, remove previous basemap, and add new one
                    if (d != this.basemap) {
                        map.removeLayer(this.basemap);
                        map.addLayer(d);
                        d.bringToBack();
                        map.fire("baselayerchange", d);
                        this.basemap = d;

                        L.DomUtil.removeClass(container.getElementsByClassName("basemap active")[0], "active");
                        L.DomUtil.addClass(basemapNode, "active");

                        var altIdx = (i + 0) % this.options.basemaps.length;
                        L.DomUtil.removeClass(container.getElementsByClassName("basemap alt")[0], "alt");
                        L.DomUtil.addClass(container.getElementsByClassName("basemap")[altIdx], "alt");

                        // stessa icona "compatta" di sempre (il nodo .basemap.alt): la si
                        // notifica a chi la usa come icona del pulsante mappe (es. la toolbar)
                        this.fire("basemapchange", { url: imgNode.src, title: imgNode.title });

                        if (!this.options.embedded) { L.DomUtil.addClass(container, "closed"); }
                    }
                },
                this
            );
        }, this);

        // trova la entry con l'anno più vicino al valore trascinato: la traccia ora
        // è in anni reali, quindi tra due mappe storiche ci sono anni "vuoti"
        function nearestEntryIndex(year) {
            var bestIdx = 0;
            var bestDiff = Infinity;
            for (var n = 0; n < yearEntries.length; n++) {
                var diff = Math.abs(yearEntries[n].year - year);
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestIdx = n;
                }
            }
            return bestIdx;
        }

        if (sliderInput) {
            L.DomEvent.on(sliderInput, "input", function() {
                var idx = nearestEntryIndex(parseInt(sliderInput.value, 10));
                var entry = yearEntries[idx];
                if (entry) {
                    applyOverlayLayer(entry.layer, entry.node, false);
                }
            }, this);

            var goToSliderIndex = function(delta) {
                var idx = nearestEntryIndex(parseInt(sliderInput.value, 10)) + delta;
                idx = Math.max(0, Math.min(yearEntries.length - 1, idx));
                var entry = yearEntries[idx];
                if (entry) {
                    sliderInput.value = entry.year;
                    applyOverlayLayer(entry.layer, entry.node, false);
                }
            };

            L.DomEvent.on(sliderPrevBtn, "click", function(e) {
                L.DomEvent.stop(e);
                goToSliderIndex(-1);
            }, this);
            L.DomEvent.on(sliderNextBtn, "click", function(e) {
                L.DomEvent.stop(e);
                goToSliderIndex(1);
            }, this);
        }

        if (this.options.overlays) {
            var helpToggle = L.DomUtil.create("a", "basemaps-help-toggle", container);
            helpToggle.href = "#";
            helpToggle.innerHTML = '<i class="fa fa-question-circle" aria-hidden="true"></i> Come funziona il selettore delle mappe';

            var helpPanel = L.DomUtil.create("div", "basemaps-help-panel", container);
            helpPanel.innerHTML =
                '<div class="basemap-help-step"><i class="fa fa-mouse-pointer" aria-hidden="true"></i>' +
                    '<div>In alto a destra c\'è un cerchietto: passaci sopra col mouse (o toccalo su mobile) per aprire il pannello completo.</div></div>' +
                '<div class="basemap-help-step"><i class="fa fa-toggle-on" aria-hidden="true"></i>' +
                    '<div>Nel pannello scegli la modalità: <strong>Base</strong> oppure <strong>Storica sovrapposta</strong>.</div></div>' +
                '<div class="basemap-help-step"><i class="fa fa-globe" aria-hidden="true"></i>' +
                    '<div>Modalità <strong>Base</strong>: i cerchietti cambiano la mappa di sfondo (satellite, OpenStreetMap...).</div></div>' +
                '<div class="basemap-help-step"><i class="fa fa-clone" aria-hidden="true"></i>' +
                    '<div>Modalità <strong>Storica sovrapposta</strong>: i cerchietti sovrappongono una mappa storica del passato su quella attuale.</div></div>' +
                '<div class="basemap-help-step"><i class="fa fa-hand-pointer-o" aria-hidden="true"></i>' +
                    '<div>Clicca un cerchietto per selezionarlo: il bordo arancione o blu indica quello attivo. Il pannello si richiude da solo quando allontani il mouse.</div></div>' +
                '<div class="basemap-help-step"><i class="fa fa-sliders" aria-hidden="true"></i>' +
                    '<div>In basso trovi lo <strong>slider temporale</strong>: trascinalo per scorrere velocemente tra tutte le mappe storiche in ordine cronologico, dal 1893 a oggi.</div></div>' +
                '<div class="basemap-help-step"><i class="fa fa-circle" aria-hidden="true"></i>' +
                    '<div>Il <strong>pallino colorato</strong> vicino al nome della mappa storica indica quanto è affidabile la sua georeferenziazione: ' +
                    '<span class="basemaps-timeslider-accuracy basemaps-timeslider-accuracy-alta basemap-help-accuracy-sample"></span> <strong>verde</strong> = rilievo aerofotogrammetrico o cartografia tecnica moderna, buona corrispondenza; ' +
                    '<span class="basemaps-timeslider-accuracy basemaps-timeslider-accuracy-media basemap-help-accuracy-sample"></span> <strong>giallo</strong> = rilievo pre-aerofotogrammetria, corrispondenza approssimativa; ' +
                    '<span class="basemaps-timeslider-accuracy basemaps-timeslider-accuracy-bassa basemap-help-accuracy-sample"></span> <strong>rosso</strong> = disegno o incisione storica non rilevata scientificamente, sovrapposizione puramente indicativa. ' +
                    'È un giudizio editoriale sulla fonte, non una misura: lo swipe e l\'occhio di bue non vanno letti come pixel-perfect su queste mappe.</div></div>';

            L.DomEvent.on(helpToggle, "click", function(e) {
                L.DomEvent.stop(e);
                if (L.DomUtil.hasClass(helpPanel, "open")) {
                    L.DomUtil.removeClass(helpPanel, "open");
                    L.DomUtil.removeClass(helpToggle, "open");
                } else {
                    L.DomUtil.addClass(helpPanel, "open");
                    L.DomUtil.addClass(helpToggle, "open");
                }
            }, this);
        }

        if (!this.options.embedded && this.options.basemaps.length > 2 && !L.Browser.mobile) {
            L.DomEvent.on(
                container,
                "mouseenter",
                function() {
                    // in modalità overlay lo slider compatto resta interattivo a pannello chiuso:
                    // l'hover non deve riaprire il pannello intero, altrimenti coprirebbe lo slider
                    // ogni volta che ci si avvicina per trascinarlo. Si riapre con un click esplicito.
                    if (this._mode === "overlay" && sliderInput) { return; }
                    L.DomUtil.removeClass(container, "closed");
                },
                this
            );

            L.DomEvent.on(
                container,
                "mouseleave",
                function() {
                    L.DomUtil.addClass(container, "closed");
                },
                this
            );
        }

        // notifica l'icona di partenza (la mappa base davvero attiva, non
        // quella "alt" suggerita) a chi la usa come icona del pulsante
        // mappe (es. la toolbar): all'avvio e' sempre basemaps[0] (OSM)
        var initialActiveImg = container.querySelector(".basemap.active img");
        if (initialActiveImg) {
            this.fire("basemapchange", { url: initialActiveImg.src, title: initialActiveImg.title });
        }

        this._container = container;
        return this._container;
    },
    onRemove: function(map) {
        if (this._accuracyLegend) { map.removeControl(this._accuracyLegend); }
    }
});

L.control.basemaps = function(options) {
    return new L.Control.Basemaps(options);
};
