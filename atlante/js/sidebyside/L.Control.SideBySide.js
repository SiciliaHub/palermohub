// Confronto affiancato di due gruppi di layer sulla stessa mappa Leaflet:
// clippa (CSS clip:rect) i container DOM dei layer a sinistra/destra di uno
// slider trascinabile, mantenendo entrambi i layer aggiunti alla mappa.
//
// Non estende L.Control: il divisore deve coprire l'intera mappa, mentre
// L.Control.addTo() lo inserirebbe in uno degli angoli (leaflet-top/right ecc,
// caselle piccole pensate per pulsanti), spostandolo li' invece di lasciarlo
// a schermo intero.
L.Control.SideBySide = function(leftLayers, rightLayers, options) {
    this._leftLayers = leftLayers instanceof Array ? leftLayers : [leftLayers];
    this._rightLayers = rightLayers instanceof Array ? rightLayers : [rightLayers];
    this.options = options || {};
};

L.Control.SideBySide.prototype.addTo = function(map) {
    this._map = map;

    var container = L.DomUtil.create("div", "leaflet-sbs-container");
    this._divider = L.DomUtil.create("div", "leaflet-sbs-divider", container);
    this._range = L.DomUtil.create("input", "leaflet-sbs-range", container);
    this._range.type = "range";
    this._range.min = 0;
    this._range.max = 100;
    this._range.value = (this.options && this.options.initialRatio != null) ? this.options.initialRatio : 50;
    this._range.setAttribute("aria-label", "Sposta il confronto affiancato");

    L.DomEvent.disableClickPropagation(container);
    map.getContainer().appendChild(container);
    L.DomUtil.addClass(map.getContainer(), "leaflet-sbs");

    L.DomEvent.on(this._range, "input", this._updateClip, this);
    map.on("move zoom zoomend resize", this._updateClip, this);

    this._container = container;
    this._updateClip();
    return this;
};

L.Control.SideBySide.prototype.remove = function() {
    var map = this._map;
    if (!map) { return this; }
    L.DomEvent.off(this._range, "input", this._updateClip, this);
    map.off("move zoom zoomend resize", this._updateClip, this);
    L.DomUtil.removeClass(map.getContainer(), "leaflet-sbs");
    this._clearClip(this._leftLayers);
    this._clearClip(this._rightLayers);
    if (this._container && this._container.parentNode) {
        this._container.parentNode.removeChild(this._container);
    }
    this._map = null;
    return this;
};

L.Control.SideBySide.prototype._clearClip = function(layers) {
    layers.forEach(function(layer) {
        var el = layer.getContainer && layer.getContainer();
        if (el) { el.style.clip = ""; }
    });
};

L.Control.SideBySide.prototype._updateClip = function() {
    var map = this._map;
    var size = map.getSize();
    var nw = map.containerPointToLayerPoint([0, 0]);
    var se = map.containerPointToLayerPoint(size);
    var ratio = this._range.value / 100;
    var dividerX = size.x * ratio;
    var clipX = nw.x + (se.x - nw.x) * ratio;

    this._divider.style.left = dividerX + "px";
    this._range.style.width = size.x + "px";

    var clipLeft = "rect(" + [nw.y, clipX, se.y, nw.x].join("px,") + "px)";
    var clipRight = "rect(" + [nw.y, se.x, se.y, clipX].join("px,") + "px)";

    this._leftLayers.forEach(function(layer) {
        var el = layer.getContainer && layer.getContainer();
        if (el) { el.style.clip = clipLeft; }
    });
    this._rightLayers.forEach(function(layer) {
        var el = layer.getContainer && layer.getContainer();
        if (el) { el.style.clip = clipRight; }
    });
};

L.control.sideBySide = function(leftLayers, rightLayers, options) {
    return new L.Control.SideBySide(leftLayers, rightLayers, options);
};
