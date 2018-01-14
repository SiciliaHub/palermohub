/*
 * L.Control.CartographicScale
 * Show the cartographic scale of the map view
 * https://github.com/GreenInfo-Network/L.Control.CartographicScale
 */

L.Control.CartographicScale = L.Control.extend({
    options: {
        position: 'bottomright',
        text: 'Map scale'
    },
    initialize: function(options) {
        L.setOptions(this, options);
        this.map = null;
    },
    onAdd: function (map) {
        // add a linkage to the map, since we'll be managing map layers
        this.map = map;

        // create our button: uses FontAwesome cuz that font is... awesome
        // assign this here control as a property of the visible DIV, so we can be more terse when writing click-handlers on that visible DIV
        this.controlDiv           = L.DomUtil.create('div', 'leaflet-control-cartoscale');
        this.controlDiv.control   = this;
        this.controlDiv.innerHTML = ' ';
        L.DomEvent
            .addListener(this.controlDiv, 'mousedown', L.DomEvent.stopPropagation)
            .addListener(this.controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(this.controlDiv, 'click', L.DomEvent.preventDefault);

        // listen for map pan/zoom changes to update our scale, and do it right now too
        this.map.on('moveend', this.updateScaleReadout, this);
        this.map.on('resize', this.updateScaleReadout, this);
        this.updateScaleReadout();

        // done!
        return this.controlDiv;
    },
    onRemove: function (map) {
        this.map.off('moveend', this.updateScaleReadout, this);
        this.map.off('resize', this.updateScaleReadout, this);
        this.map = null;
    },
    updateScaleReadout: function () {
        var b = this.map.getBounds();
        var s = this.map.getSize();
        var realmeters  = b.getSouthWest().distanceTo( b.getNorthEast() );
        var pixels      = Math.sqrt( (s.x*s.x) + (s.y*s.y) );
        var screen_dpi  = 96;
        var pxmeters    = (pixels / screen_dpi) / 39.3701;
        var scale       = realmeters / pxmeters;

        // round it to K and M instead of ten-digit numbers
        if      (scale >= 9500 && scale <= 950000)  scale = Math.round(scale / 1000) + "K";
        else if (scale >= 950000)                   scale = Math.round(scale / 1000000) + "M";
        else                                        scale = Math.round(scale);

        this.controlDiv.innerHTML = this.options.text + ' ' + '1:' + scale;
    }
});

L.cartographicScaleControl = function (options) {
    return new L.Control.CartographicScale(options);
};
