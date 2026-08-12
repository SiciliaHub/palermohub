L.Control.Basemaps = L.Control.extend({
    _map: null,
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Event,
    options: {
        position: "topright",
        tileX: 0,
        tileY: 0,
        tileZ: 0,
        layers: [] // list of basemap layer objects, first in list is default and added to map with this control
    },
    basemap: null,
    onAdd: function(map) {
        this._map = map;
        var container = L.DomUtil.create("div", "basemaps leaflet-control closed");

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
                    // intercept open click on mobile devices and show options
                    if (this.options.basemaps.length > 2 && L.Browser.mobile) {
                        if (L.DomUtil.hasClass(container, "closed")) {
                            L.DomUtil.removeClass(container, "closed");
                            return;
                        }
                    }

                    if (this._mode === "overlay") {
                        if (!overlayLayer || overlayLayer === this.overlayLayer) { return; }
                        if (this.overlayLayer) { map.removeLayer(this.overlayLayer); }
                        map.addLayer(overlayLayer);
                        this.overlayLayer = overlayLayer;

                        var prevOverlayNode = container.getElementsByClassName("basemap overlay-active")[0];
                        if (prevOverlayNode) { L.DomUtil.removeClass(prevOverlayNode, "overlay-active"); }
                        L.DomUtil.addClass(basemapNode, "overlay-active");

                        L.DomUtil.addClass(container, "closed");
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

                        L.DomUtil.addClass(container, "closed");
                    }
                },
                this
            );
        }, this);

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
                    '<div>Clicca un cerchietto per selezionarlo: il bordo arancione o blu indica quello attivo. Il pannello si richiude da solo quando allontani il mouse.</div></div>';

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

        if (this.options.basemaps.length > 2 && !L.Browser.mobile) {
            L.DomEvent.on(
                container,
                "mouseenter",
                function() {
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

        this._container = container;
        return this._container;
    }
});

L.control.basemaps = function(options) {
    return new L.Control.Basemaps(options);
};
