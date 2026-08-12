L.Control.GeocoderOds = L.Control.extend({
    options: {
        position: "topright",
        placeholder: "Cerca un indirizzo...",
        viewbox: "13.28,38.20,13.43,38.06",
        zoom: 17
    },

    onAdd: function(map) {
        this._map = map;

        var container = L.DomUtil.create("div", "leaflet-control-geocoder-ods leaflet-control");
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        var form = L.DomUtil.create("div", "geocoder-ods-form", container);

        var icon = L.DomUtil.create("i", "fa fa-search geocoder-ods-icon", form);
        icon.setAttribute("aria-hidden", "true");

        var input = L.DomUtil.create("input", "geocoder-ods-input", form);
        input.type = "text";
        input.placeholder = this.options.placeholder;
        input.autocomplete = "off";

        var clearBtn = L.DomUtil.create("a", "geocoder-ods-clear", form);
        clearBtn.href = "#";
        clearBtn.innerHTML = "&times;";
        clearBtn.style.display = "none";

        var results = L.DomUtil.create("div", "geocoder-ods-results", container);
        results.style.display = "none";

        this._input = input;
        this._results = results;
        this._clearBtn = clearBtn;
        this._marker = null;
        this._timer = null;

        L.DomEvent.on(input, "input", this._onInput, this);
        L.DomEvent.on(input, "keydown", this._onKeyDown, this);
        L.DomEvent.on(clearBtn, "click", this._onClear, this);

        return container;
    },

    _onInput: function() {
        var value = this._input.value.trim();
        this._clearBtn.style.display = value ? "block" : "none";

        if (this._timer) { clearTimeout(this._timer); }

        if (value.length < 3) {
            this._hideResults();
            return;
        }

        this._timer = setTimeout(L.Util.bind(function() {
            this._search(value);
        }, this), 350);
    },

    _onKeyDown: function(e) {
        if (e.keyCode === 27) {
            this._onClear(e);
        }
    },

    _onClear: function(e) {
        if (e) { L.DomEvent.stop(e); }
        this._input.value = "";
        this._clearBtn.style.display = "none";
        this._hideResults();
        this._input.focus();
    },

    _search: function(query) {
        var url = "https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=0&accept-language=it"
            + "&viewbox=" + this.options.viewbox + "&bounded=0"
            + "&q=" + encodeURIComponent(query);

        fetch(url, { headers: { "Accept": "application/json" } })
            .then(L.Util.bind(function(res) { return res.json(); }, this))
            .then(L.Util.bind(this._showResults, this))
            .catch(L.Util.bind(function() { this._hideResults(); }, this));
    },

    _showResults: function(items) {
        var results = this._results;
        results.innerHTML = "";

        if (!items || !items.length) {
            var empty = L.DomUtil.create("div", "geocoder-ods-empty", results);
            empty.textContent = "Nessun risultato";
            results.style.display = "block";
            return;
        }

        items.forEach(L.Util.bind(function(item) {
            var row = L.DomUtil.create("a", "geocoder-ods-result", results);
            row.href = "#";
            row.textContent = item.display_name;
            L.DomEvent.on(row, "click", L.Util.bind(function(e) {
                L.DomEvent.stop(e);
                this._selectResult(item);
            }, this));
        }, this));

        results.style.display = "block";
    },

    _selectResult: function(item) {
        var latlng = L.latLng(parseFloat(item.lat), parseFloat(item.lon));
        this._map.setView(latlng, this.options.zoom);

        if (this._marker) { this._map.removeLayer(this._marker); }
        this._marker = L.marker(latlng).addTo(this._map)
            .bindPopup(item.display_name)
            .openPopup();

        this._input.value = item.display_name;
        this._hideResults();
    },

    _hideResults: function() {
        this._results.style.display = "none";
        this._results.innerHTML = "";
    }
});

L.control.geocoderOds = function(options) {
    return new L.Control.GeocoderOds(options);
};
