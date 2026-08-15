L.Control.Toolbar = L.Control.extend({
    options: {
        position: "topleft",
        homeCenter: null,
        homeZoom: null
    },

    onAdd: function(map) {
        this._map = map;
        this._dropdowns = {};

        var container = L.DomUtil.create("div", "map-toolbar leaflet-control");
        L.DomEvent.disableClickPropagation(container);
        if (!L.Browser.touch) {
            L.DomEvent.disableScrollPropagation(container);
        }

        // pulsante "+" visibile solo mobile (CSS): apre/chiude gli strumenti
        // secondari per lasciare la pillola compatta di default, come il
        // resto della toolbar il timeslider non e' mai nascosto da questo
        this._dialToggle = L.DomUtil.create("a", "map-toolbar-btn map-toolbar-dial-toggle", container);
        this._dialToggle.href = "#";
        this._dialToggle.title = "Altri strumenti";
        this._dialToggle.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';
        L.DomEvent.on(this._dialToggle, "click", function(e) {
            L.DomEvent.stop(e);
            this.toggleDial();
        }, this);

        var homeBtn = L.DomUtil.create("a", "map-toolbar-btn map-toolbar-home map-toolbar-collapsible", container);
        homeBtn.href = "#";
        homeBtn.title = "Torna alla vista iniziale";
        homeBtn.innerHTML = '<i class="fa fa-home" aria-hidden="true"></i>';
        L.DomEvent.on(homeBtn, "click", function(e) {
            L.DomEvent.stop(e);
            if (this.options.homeCenter && this.options.homeZoom != null) {
                map.setView(this.options.homeCenter, this.options.homeZoom);
            }
        }, this);

        var fullscreenBtn = L.DomUtil.create("a", "map-toolbar-btn map-toolbar-fullscreen map-toolbar-collapsible", container);
        fullscreenBtn.href = "#";
        fullscreenBtn.title = "Schermo intero";
        fullscreenBtn.innerHTML = '<i class="fa fa-expand" aria-hidden="true"></i>';
        L.DomEvent.on(fullscreenBtn, "click", function(e) {
            L.DomEvent.stop(e);
            var doc = document;
            var el = document.documentElement;
            var isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
            if (!isFullscreen) {
                (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen).call(el);
            } else {
                (doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen).call(doc);
            }
        }, this);

        var updateFullscreenState = function() {
            var doc = document;
            var isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
            if (isFullscreen) {
                L.DomUtil.addClass(fullscreenBtn, "active");
                fullscreenBtn.innerHTML = '<i class="fa fa-compress" aria-hidden="true"></i>';
                fullscreenBtn.title = "Esci da schermo intero";
            } else {
                L.DomUtil.removeClass(fullscreenBtn, "active");
                fullscreenBtn.innerHTML = '<i class="fa fa-expand" aria-hidden="true"></i>';
                fullscreenBtn.title = "Schermo intero";
            }
        };
        ["fullscreenchange", "webkitfullscreenchange", "msfullscreenchange"].forEach(function(evt) {
            document.addEventListener(evt, updateFullscreenState);
        });

        this._basemapsWrap = this._createDropdownButton(container, "basemaps", "fa-map-o", "Scegli la mappa");
        this._searchWrap = this._createDropdownButton(container, "search", "fa-search", "Cerca un indirizzo");
        L.DomUtil.addClass(this._basemapsWrap, "map-toolbar-collapsible");
        L.DomUtil.addClass(this._searchWrap, "map-toolbar-collapsible");

        this._timesliderSlot = L.DomUtil.create("div", "map-toolbar-timeslider-slot", container);

        var infoBtn = L.DomUtil.create("a", "map-toolbar-btn map-toolbar-info map-toolbar-collapsible", container);
        infoBtn.href = "#";
        infoBtn.title = "Come funziona la mappa";
        infoBtn.innerHTML = '<i class="fa fa-info" aria-hidden="true"></i>';
        L.DomEvent.on(infoBtn, "click", function(e) {
            L.DomEvent.stop(e);
            if (window.jQuery) {
                jQuery("#modal-basemap-help").flythat("open");
            }
        }, this);

        var self = this;
        L.DomEvent.on(document, "click", function(e) {
            Object.keys(self._dropdowns).forEach(function(name) {
                var d = self._dropdowns[name];
                if (!d.wrap.contains(e.target)) { self.closeDropdown(name); }
            });
            if (!container.contains(e.target)) { self.closeDial(); }
        });
        L.DomEvent.on(document, "keydown", function(e) {
            if (e.keyCode === 27) { self.closeAllDropdowns(); self.closeDial(); }
        });

        this._container = container;
        return container;
    },

    // crea pulsante + wrapper dropdown vuoto (il contenuto viene innestato
    // dopo con attachSearch/attachBasemaps), registrandolo in _dropdowns
    // cosi' apertura/chiusura e "click fuori per chiudere" sono generici
    _createDropdownButton: function(container, name, iconClass, title) {
        var wrap = L.DomUtil.create("div", "map-toolbar-dropdown-wrap", container);
        var btn = L.DomUtil.create("a", "map-toolbar-btn map-toolbar-" + name, wrap);
        btn.href = "#";
        btn.title = title;
        var icon = L.DomUtil.create("i", "fa " + iconClass, btn);
        icon.setAttribute("aria-hidden", "true");
        var img = L.DomUtil.create("img", "map-toolbar-btn-img", btn);
        img.alt = "";
        var dropdown = L.DomUtil.create("div", "map-toolbar-dropdown", wrap);

        this._dropdowns[name] = { wrap: wrap, btn: btn, dropdown: dropdown, icon: icon, img: img };

        L.DomEvent.on(btn, "click", function(e) {
            L.DomEvent.stop(e);
            this.toggleDropdown(name);
        }, this);

        return wrap;
    },

    // sposta il nodo dello slider temporale (creato dal controllo basemaps)
    // dentro la toolbar, cosi' resta sempre visibile invece che nascosto
    // dentro il pannello basemaps in alto a destra
    attachTimeslider: function(node) {
        if (node && this._timesliderSlot) {
            this._timesliderSlot.appendChild(node);
        }
        return this;
    },

    // integra un controllo leaflet gia' creato ma non aggiunto alla mappa
    // (niente addTo) dentro il dropdown "name": ne richiama onAdd() a mano
    // e lo innesta nel wrapper, togliendo .leaflet-control perche' altrimenti
    // la regola che nasconde i controlli nel corner sinistro (vedi
    // L.Control.Toolbar.css) lo farebbe sparire di nuovo essendo ora
    // discendente della toolbar
    _attachControl: function(name, control, focusEl) {
        var d = this._dropdowns[name];
        if (!control || !d) { return this; }
        var node = control.onAdd(this._map);
        L.DomUtil.removeClass(node, "leaflet-control");
        d.dropdown.appendChild(node);
        d.control = control;
        d.focusEl = focusEl;
        return this;
    },

    attachSearch: function(geocoderControl) {
        return this._attachControl("search", geocoderControl, "_input");
    },

    attachBasemaps: function(basemapsControl) {
        // registrato PRIMA di _attachControl: onAdd() del controllo basemaps
        // spara subito un evento "basemapchange" iniziale (icona di partenza),
        // e onAdd() viene chiamato proprio dentro _attachControl qui sotto
        basemapsControl.on("basemapchange", function(e) {
            this._setButtonImage("basemaps", e.url, e.title);
        }, this);
        // l'icona del pulsante mostra sempre la mappa base attiva (come
        // faceva il vecchio indicatore "chiuso" del pannello basemaps),
        // aggiornata ogni volta che il controllo cambia mappa
        this._attachControl("basemaps", basemapsControl);
        return this;
    },

    _setButtonImage: function(name, url, title) {
        var d = this._dropdowns[name];
        if (!d || !url) { return; }
        d.img.src = url;
        if (title) { d.btn.title = title; }
        L.DomUtil.addClass(d.btn, "has-img");
    },

    toggleDropdown: function(name) {
        var d = this._dropdowns[name];
        if (!d) { return; }
        if (L.DomUtil.hasClass(d.dropdown, "open")) {
            this.closeDropdown(name);
        } else {
            this.openDropdown(name);
        }
    },

    openDropdown: function(name) {
        var self = this;
        Object.keys(this._dropdowns).forEach(function(other) {
            if (other !== name) { self.closeDropdown(other); }
        });
        var d = this._dropdowns[name];
        if (!d) { return; }
        L.DomUtil.addClass(d.dropdown, "open");
        L.DomUtil.addClass(d.btn, "active");
        if (d.control && d.focusEl && d.control[d.focusEl]) {
            d.control[d.focusEl].focus();
        }
    },

    closeDropdown: function(name) {
        var d = this._dropdowns[name];
        if (!d) { return; }
        L.DomUtil.removeClass(d.dropdown, "open");
        L.DomUtil.removeClass(d.btn, "active");
    },

    closeAllDropdowns: function() {
        var self = this;
        Object.keys(this._dropdowns).forEach(function(name) { self.closeDropdown(name); });
    },

    // solo mobile (il pulsante e' nascosto via CSS su desktop): mostra/nasconde
    // i pulsanti .map-toolbar-collapsible, il timeslider resta sempre visibile
    toggleDial: function() {
        if (L.DomUtil.hasClass(this._container, "dial-open")) {
            this.closeDial();
        } else {
            this.openDial();
        }
    },

    openDial: function() {
        L.DomUtil.addClass(this._container, "dial-open");
        L.DomUtil.addClass(this._dialToggle, "active");
        this._dialToggle.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
        this._dialToggle.title = "Chiudi altri strumenti";
    },

    closeDial: function() {
        if (!L.DomUtil.hasClass(this._container, "dial-open")) { return; }
        L.DomUtil.removeClass(this._container, "dial-open");
        L.DomUtil.removeClass(this._dialToggle, "active");
        this._dialToggle.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';
        this._dialToggle.title = "Altri strumenti";
        this.closeAllDropdowns();
    }
});

L.control.toolbar = function(options) {
    return new L.Control.Toolbar(options);
};
