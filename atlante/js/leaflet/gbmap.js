(function() {

  var basemaps = {
 	       osm : L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:'&copy;<a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      minZoom: 13, maxZoom: 17, maxNativeZoom: 17
        }),

 google_road : L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                attribution: 'Source: Google Road - Map data ©2015 Google',
				minZoom: 13, maxZoom: 17, maxNativeZoom: 17
              }),
			  
 esri_standard : L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Source: ESRI Standard',
				minZoom: 13, maxZoom: 17, maxNativeZoom: 17
              }),
			  
 esri_satellite : L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Source: ESRI Satellite',
				minZoom: 13, maxZoom: 17, maxNativeZoom: 17
              }),
			  
 google_satellite : L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                attribution: 'Source: Google Satellite - Map data ©2015 Google',
				minZoom: 13, maxZoom: 17, maxNativeZoom: 17
              })
  };

  var groups = {
    omira: new L.LayerGroup(),
    irta: new L.LayerGroup(),
    sas: new L.LayerGroup()
  };

 L.tileLayer.mask("http://mapwarper.net/maps/tile/19706/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank"  title="Leaflet-tileoverlay-mask">Leaflet-tileoverlay-mask</a> - Cartografia storica - Carta Tecnica di Palermo - Omira 1935 - Rielaborazione di: <a href="https://twitter.com/aborruso" target="_blank" title="Andrea Borruso">@aborruso</a>, <a href="https://twitter.com/napo"target="_blank" title="Maurizio Napolitano">@napo</a>, <a href=" https://twitter.com/Piersoft" target="_blank" title="Francesco Piero Paolicelli">@piersoft</a>, <a href="https://twitter.com/cirospat" target="_blank" title="Ciro Spataro">@cirospat</a> e <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano">@gbvitrano</a>',minZoom: 13, maxZoom: 17, maxNativeZoom: 17
        }).addTo(groups.omira);
		
 L.tileLayer.mask("http://mapwarper.net/maps/tile/19792/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask">Leaflet-tileoverlay-mask</a> - Cartografia storica - Carta Tecnica di Palermo - Irta 1956 -Rielaborazione di: <a href="https://twitter.com/aborruso" target="_blank" title="Andrea Borruso">@aborruso</a>, <a href="https://twitter.com/napo"target="_blank" title="Maurizio Napolitano">@napo</a>, <a href=" https://twitter.com/Piersoft" target="_blank" title="Francesco Piero Paolicelli">@piersoft</a>, <a href="https://twitter.com/cirospat" target="_blank" title="Ciro Spataro">@cirospat</a> e <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano">@gbvitrano</a>', minZoom: 13, maxZoom: 17, maxNativeZoom: 17
        }).addTo(groups.irta);
		
 L.tileLayer.mask("http://mapwarper.net/maps/tile/19785/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask">Leaflet-tileoverlay-mask</a> - Cartografia storica - Carta Tecnica di Palermo - Sas 1987 - Rielaborazione di: <a href="https://twitter.com/aborruso" target="_blank" title="Andrea Borruso">@aborruso</a>, <a href="https://twitter.com/napo"target="_blank" title="Maurizio Napolitano">@napo</a>, <a href=" https://twitter.com/Piersoft" target="_blank" title="Francesco Piero Paolicelli">@piersoft</a>, <a href="https://twitter.com/cirospat" target="_blank" title="Ciro Spataro">@cirospat</a> e <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano">@gbvitrano</a>', minZoom: 13, maxZoom: 17, maxNativeZoom: 17
        }).addTo(groups.sas);

  window.ExampleData = {
    LayerGroups: groups,
    Basemaps: basemaps
  };

}());
