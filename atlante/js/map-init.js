        // bounding box del Comune di Palermo con un margine oltre il confine amministrativo
        var southWest = L.latLng(38.0570, 13.2181),
            northEast = L.latLng(38.2546, 13.4598),
    	      bounds = L.latLngBounds(southWest, northEast);

        var INITIAL_CENTER = [38.1157,13.3613];
        var INITIAL_ZOOM = 15;
        var map = L.map('map', {attributionControl:true, maxBounds: bounds, maxBoundsViscosity: 1.0}).setView(INITIAL_CENTER, INITIAL_ZOOM);

// il marker-icon.png di default non è sotto atlante/css/images (dove Leaflet lo cerca in base a leaflet.css), ma qui: fix icona rotta nel popup del geocoder
L.Icon.Default.imagePath = 'atlante/images/';

var basemaps = [
		  		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
     attribution:'&copy;<a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
      minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
	  label: 'OpenStreetMap', caption: 'OSM', group: 'Basi moderne'
        }),

  L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
  attribution: 'Source: Google Road - Map data ©2015 Google',
  minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
	 	  label: 'Google Road', caption: 'Google', group: 'Basi moderne'
              }),

  L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
  attribution: 'Source: Google Satellite - Map data ©2015 Google',
  minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
  label: 'Google Satellite', caption: 'Satellite', group: 'Basi moderne'
              }),

<!-- carte storiche -->

 L.tileLayer('https://mapwarper.net/maps/tile/60119/{z}/{x}/{y}.png', {
 attribution: 'Base cartografica: Città di Palermo 1580 - carta di Maiocco e Bonifacio',
 minZoom: 13,   maxZoom: 17, maxNativeZoom: 17,
 label: 'Città di Palermo 1580 - carta di Maiocco e Bonifacio | gallica.bnf.fr / BnF Bibliothèque nationale de France',
 iconURL: 'legend/basemap/1580_clip.jpg', caption: '1580', group: '1500-1800', georefAccuracy: 'bassa'
              }),

 L.tileLayer('https://mapwarper.net/maps/tile/60176/{z}/{x}/{y}.png', {
 attribution: 'Base cartografica: Città di Palermo 1754',
 minZoom: 13,   maxZoom: 17, maxNativeZoom: 17,
 label: 'La città di Palermo di Giuseppe Vasi, 1754-59 | Library of Congress Geography and Map Division Washington',
 iconURL: 'legend/basemap/1754_clip.jpg', caption: '1754', group: '1500-1800', georefAccuracy: 'bassa'
              }),

 L.tileLayer('https://mapwarper.net/maps/tile/60203/{z}/{x}/{y}.png', {
 attribution: 'Base cartografica: Pianta topografica Palermo 1860',
 minZoom: 13,   maxZoom: 17, maxNativeZoom: 17,
 label: 'Pianta topografica | Palermo 1860 circa | Harvard Map Collection, Harvard University',
 iconURL: 'legend/basemap/1860_clip.jpg', caption: '1860', group: '1800-1900', georefAccuracy: 'bassa'
              }),

 L.tileLayer('https://mapwarper.net/maps/tile/60203/{z}/{x}/{y}.png', {
 attribution: 'Base cartografica: Costa nord, Baia di Palermo 1877',
 minZoom: 13,   maxZoom: 17, maxNativeZoom: 17,
 label: 'Costa nord, Baia di Palermo 1877 1:36,417 | Fonte: Wisconsin-Milwaukee University',
 iconURL: 'legend/basemap/1877_clip.jpg', caption: '1877', group: '1800-1900', georefAccuracy: 'media'
              }),

 L.tileLayer('https://mapwarper.net/maps/tile/33126/{z}/{x}/{y}.png', {
 attribution: 'Base cartografica: Città di Palermo 1882',
 minZoom: 13,   maxZoom: 17, maxNativeZoom: 17,
 label: 'Nuova pianta della Città di Palermo 1882 | gallica.bnf.fr / BnF Bibliothèque nationale de France',
 iconURL: 'legend/basemap/1882_clip.jpg', caption: '1882', group: '1800-1900', georefAccuracy: 'media'
              }),

 L.tileLayer('https://mapwarper.net/maps/tile/60209/{z}/{x}/{y}.png', {
 attribution: 'Base cartografica: Nuova pianta della Città di Palermo 1891',
 minZoom: 13,   maxZoom: 17, maxNativeZoom: 17,
 label: 'Nuova pianta della Città di Palermo 1891 | Harvard Map Collection, Harvard University',
 iconURL: 'legend/basemap/1891_clip.jpg', caption: '1891', group: '1800-1900', georefAccuracy: 'media'
			   }),

 L.tileLayer('https://mapwarper.net/maps/tile/19658/{z}/{x}/{y}.png', {
 attribution: 'Base cartografica: Carta tecnica 1893',
 minZoom: 13,   maxZoom: 17, maxNativeZoom: 17,
 label: 'Carta tecnica 1893',
 iconURL: 'legend/basemap/1893_clip.jpg', caption: '1893', group: '1800-1900', georefAccuracy: 'media'
              }),

 L.tileLayer('https://mapwarper.net/maps/tile/25750/{z}/{x}/{y}.png', {
 attribution: 'Base cartografica: Carta Tecnica di Palermo - Ufficio Tecnico Comunale  1908',
 minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
 label: 'Carta Tecnica di Palermo - Ufficio Tecnico Comunale  1908',
 iconURL: 'legend/basemap/ctc_clip.jpg', caption: '1908', group: '1900-oggi', georefAccuracy: 'media'
              }),

 L.tileLayer('https://mapwarper.net/maps/tile/19706/{z}/{x}/{y}.png', {
 attribution: 'Base cartografica: Omira 1935',
 minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
 label: 'Omira 1935',
 iconURL: 'legend/basemap/omira_clip.jpg', caption: '1935', group: '1900-oggi', georefAccuracy: 'alta'
              }),

  L.tileLayer('https://mapwarper.net/maps/tile/19792/{z}/{x}/{y}.png', {
  attribution: 'Base cartografica: Carta Tecnica di Palermo - Irta 1956',
  minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
  label: 'Carta Tecnica di Palermo - Irta 1956',
  iconURL: 'legend/basemap/irta_clip.jpg', caption: '1956', group: '1900-oggi', georefAccuracy: 'alta'
              }),

  L.tileLayer('https://mapwarper.net/maps/tile/52666/{z}/{x}/{y}.png', {
  attribution: 'Base cartografica: Piano Regolatore Generale 1962',
  minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
  label: 'Piano Regolatore Generale 1962',
  iconURL: 'legend/basemap/prg62_clip.jpg', caption: '1962', group: '1900-oggi', georefAccuracy: 'alta'
              }),

  L.tileLayer('https://mapwarper.net/maps/tile/19785/{z}/{x}/{y}.png', {
  attribution: 'Base cartografica: Carta Tecnica di Palermo - Sas 1987',
  minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
  label: 'Carta Tecnica di Palermo - Sas 1987',
  iconURL: 'legend/basemap/sas_clip.jpg', caption: '1987', group: '1900-oggi', georefAccuracy: 'alta'}),

 L.tileLayer('https://palermohub.github.io/PRG2004/CSG/{z}/{x}/{y}.png', {
 attribution: 'Base cartografica: Carta Tecnica Comunale CSG 2k 1989/91',
 minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
 label: 'Carta Tecnica Comunale CSG 2k 1989/91',
 iconURL: 'legend/basemap/irta_clip.jpg', caption: '1989', group: '1900-oggi', georefAccuracy: 'alta'
              }),

    L.tileLayer('https://mapwarper.net/maps/tile/52867/{z}/{x}/{y}.png', {
  attribution: 'Base cartografica: P.P.E. del centro storico 1993',
  minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
  label: 'P.P.E. del centro storico 1993',
  iconURL: 'legend/basemap/ppe_clip.jpg', caption: '1993', group: '1900-oggi', georefAccuracy: 'alta'}),

  L.tileLayer('https://mapwarper.net/maps/tile/45321/{z}/{x}/{y}.png', {
  attribution: 'Base cartografica: U.S. Army Map Service, 1941 Series 4229 | Palermo',
  minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
  label: 'U.S. Army Map Service, 1941 Series 4229 | Palermo',
  iconURL: 'legend/basemap/us41_clip.jpg', caption: '1941', group: '1900-oggi', georefAccuracy: 'media'}),

  L.tileLayer('https://mapwarper.net/maps/tile/45304/{z}/{x}/{y}.png', {
  attribution: 'Base cartografica: U.S. Army Map Service, 1943-1944 | City Plans Palermo',
  minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
  label: 'U.S. Army Map Service, 1943-1944 | City Plans Palermo',
  iconURL: 'legend/basemap/us43_clip.jpg', caption: '1943', group: '1900-oggi', georefAccuracy: 'media'}),

  L.tileLayer('https://mapwarper.net/maps/tile/56402/{z}/{x}/{y}.png', {
  attribution: 'Base cartografica: Variante Generale 2004',
  minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
  label: 'Variante Generale 2004',
  iconURL: 'legend/basemap/prg04_clip.jpg', caption: '2004', group: 'Cartografia tecnica', georefAccuracy: 'alta'}),

 L.tileLayer('https://siciliahub.github.io/Tiles/ctr_pa_2k/{z}/{x}/{y}.png', {
 attribution: 'Base cartografica: Carta Tecnica Comunale 2k 2007/09',
 minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
 label: 'Carta Tecnica Comunale 2k 2007/09',
 iconURL: 'legend/basemap/irta_clip.jpg', caption: '2007', group: 'Cartografia tecnica', georefAccuracy: 'alta'
              }),

<!-- crt 10k -->
  L.tileLayer('https://siciliahub.github.io/palermohub/carto/ctr_pa_10k/{z}/{x}/{y}.png', {
  attribution: 'Base cartografica: Carta Tecnica Regionale 10k 2012/13',
  minZoom: 13,   maxZoom: 18, maxNativeZoom: 18,
  label: 'Carta Tecnica Regionale 10k',
  iconURL: 'legend/basemap/ctr_clip.jpg', caption: '2012', group: 'Cartografia tecnica', georefAccuracy: 'alta'}),

	 ];
	<!-- fine base mappa -->	
		
	<!-- scala mappa -->		
		var graphicScale = L.control.graphicScale({
		doubleLine: true,
		fill: 'hollow',
        showSubunits: true
	}).addTo(map);
		
<!-- muose coordinate -->
L.control.mousePosition().addTo(map);

<!-- ricerca indirizzo / geocoding -->
// creato ma non aggiunto alla mappa qui: viene innestato nella toolbar
// tramite toolbar.attachSearch() piu' sotto
var geocoderOdsControl = L.control.geocoderOds();
  map.on("mousemove", function(e) {
  palermo1580.setCenter(e.containerPoint.x, e.containerPoint.y); palermo1754.setCenter(e.containerPoint.x, e.containerPoint.y); nuova.setCenter(e.containerPoint.x, e.containerPoint.y); palermo1860.setCenter(e.containerPoint.x, e.containerPoint.y); palermo1877.setCenter(e.containerPoint.x, e.containerPoint.y); palermo1891.setCenter(e.containerPoint.x, e.containerPoint.y); palermo1893.setCenter(e.containerPoint.x, e.containerPoint.y); omira.setCenter(e.containerPoint.x, e.containerPoint.y); irta.setCenter(e.containerPoint.x, e.containerPoint.y); 
  sas.setCenter(e.containerPoint.x, e.containerPoint.y); csg.setCenter(e.containerPoint.x, e.containerPoint.y); ctc.setCenter(e.containerPoint.x, e.containerPoint.y); City_Plans_Palermo.setCenter(e.containerPoint.x, e.containerPoint.y); Palermo_50k.setCenter(e.containerPoint.x, e.containerPoint.y); 
  prg04.setCenter(e.containerPoint.x, e.containerPoint.y); ctc2k.setCenter(e.containerPoint.x, e.containerPoint.y); prg62.setCenter(e.containerPoint.x, e.containerPoint.y); ppecs.setCenter(e.containerPoint.x, e.containerPoint.y); osm.setCenter(e.containerPoint.x, e.containerPoint.y); google.setCenter(e.containerPoint.x, e.containerPoint.y); googlesat.setCenter(e.containerPoint.x, e.containerPoint.y); ctr10k.setCenter(e.containerPoint.x, e.containerPoint.y); 
         })
	
  var osm = L.tileLayer.mask("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:'&copy;<a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
  minZoom: 13,   maxZoom: 18, maxNativeZoom: 18, label: 'OpenStreetMap', caption: 'OSM', group: 'Basi moderne'});

 var google = L.tileLayer.mask("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
 attribution:'Source: Google Road - Map data ©2021 Google',
 minZoom: 13,   maxZoom: 18, maxNativeZoom: 18, label: 'Google Road', caption: 'Google', group: 'Basi moderne'});

 var googlesat = L.tileLayer.mask("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
 attribution:'Source: Google Satellite - Map data ©2021 Google',
 minZoom: 13,   maxZoom: 18, maxNativeZoom: 18, label: 'Google Satellite', caption: 'Satellite', group: 'Basi moderne'});
 
var palermo1580 = L.tileLayer.mask("https://mapwarper.net/maps/tile/60119/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank"  title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Palermo , città principalissima nella Sicilia | Presbiter Horatius Maiocchus inventor ; Natalis Bonifatius fecit, Romae apud Claudii Duchetti | Autore  Bonifazio , Natale ( 1538-1592 ). Graveur | Fonte: gallica.bnf.fr / BnF Bibliothèque nationale de France - Rielaborazione di: <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>', minZoom: 13,   maxZoom: 17, maxNativeZoom: 17, label: 'Città di Palermo 1580 | Fonte: gallica.bnf.fr / BnF', iconURL: 'legend/basemap/1580_clip.jpg', caption: '1580', group: '1500-1800' });
	        
var palermo1754 = L.tileLayer.mask("https://mapwarper.net/maps/tile/60176/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank"  title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - La città di Palermo di Giuseppe Vasi, 1754-59 | Fonte: Library of Congress Geography and Map Division Washington - Rielaborazione di: <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>', minZoom: 13,   maxZoom: 17, maxNativeZoom: 17, label: 'Città di Palermo 1754 | Fonte: Library of Congress Geography and Map Division Washington', iconURL: 'legend/basemap/1754_clip.jpg', caption: '1754', group: '1500-1800' });

var palermo1860 = L.tileLayer.mask("https://mapwarper.net/maps/tile/60203/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank"  title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Pianta topografica | Palermo 1860 circa | Fonte: Harvard Map Collection, Harvard University - Rielaborazione di: <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>', minZoom: 13,   maxZoom: 17, maxNativeZoom: 17, label: 'Pianta topografica | Palermo 1860 circa | Fonte: Harvard Map Collection, Harvard University', iconURL: 'legend/basemap/1860_clip.jpg', caption: '1860', group: '1800-1900' });

var palermo1877 = L.tileLayer.mask("https://mapwarper.net/maps/tile/60399/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank"  title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Costa nord, Baia di Palermo 1877 1:36,417 | Fonte: Wisconsin-Milwaukee University - Rielaborazione di: <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>', minZoom: 13,   maxZoom: 17, maxNativeZoom: 17, label: 'Costa nord, Baia di Palermo 1877 | 1:36,417 | Fonte: Wisconsin-Milwaukee University', iconURL: 'legend/basemap/1877_clip.jpg', caption: '1877', group: '1800-1900' });

var nuova = L.tileLayer.mask("https://mapwarper.net/maps/tile/33126/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank"  title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Nuova pianta della Città di Palermo 1:1k | Seconda edizione Riveduta 1882 Luigi Pedone Laurieri - Editore | Lit. Bizzarrelli & Sanzò - Fonte: gallica.bnf.fr / BnF Bibliothèque nationale de France - Rielaborazione di: <a href="https://twitter.com/aborruso" target="_blank" title="Andrea Borruso" rel="noopener noreferrer">@aborruso</a>, e <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>', minZoom: 13,   maxZoom: 17, maxNativeZoom: 17, label: 'Città di Palermo 1882 | 1:1k Fonte: gallica.bnf.fr / BnF', iconURL: 'legend/basemap/1882_clip.jpg', caption: '1882', group: '1800-1900' });
	  
var palermo1891 = L.tileLayer.mask("https://mapwarper.net/maps/tile/60209/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank"  title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Nuova pianta della Città di Palermo 1891 1:10k | Carlo Clausen, editore | Fonte: Harvard Map Collection, Harvard University - Rielaborazione di: <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>', minZoom: 13,   maxZoom: 17, maxNativeZoom: 17, label: 'Nuova pianta della Città di Palermo 1891 1:10k | Fonte: Harvard Map Collection, Harvard University', iconURL: 'legend/basemap/1891_clip.jpg', caption: '1891', group: '1800-1900' });

 var palermo1893 = L.tileLayer.mask("https://mapwarper.net/maps/tile/19658/{z}/{x}/{y}.png ", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank"  title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Cartografia storica - Carta Tecnica di Palermo - 1893 | 1:13K - Rielaborazione di: <a href="https://twitter.com/aborruso" target="_blank" title="Andrea Borruso" rel="noopener noreferrer">@aborruso</a>, <a href="https://twitter.com/napo"target="_blank" title="Maurizio Napolitano" rel="noopener noreferrer">@napo</a>, <a href=" https://twitter.com/Piersoft" target="_blank" title="Francesco Piero Paolicelli" rel="noopener noreferrer">@piersoft</a>, <a href="https://twitter.com/cirospat" target="_blank" title="Ciro Spataro" rel="noopener noreferrer">@cirospat</a> e <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>',
minZoom: 13,   maxZoom: 16, maxNativeZoom: 16, label: 'Carta tecnica 1893 | 1:13k (max zoom 16)', iconURL: 'legend/basemap/1893_clip.jpg', caption: '1893', group: '1800-1900'});
   							
var omira = L.tileLayer.mask("https://mapwarper.net/maps/tile/19706/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank"  title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Cartografia storica - Carta Tecnica di Palermo - Omira 1935 | 1:5K - Rielaborazione di: <a href="https://twitter.com/aborruso" target="_blank" title="Andrea Borruso" rel="noopener noreferrer">@aborruso</a>, <a href="https://twitter.com/napo"target="_blank" title="Maurizio Napolitano" rel="noopener noreferrer">@napo</a>, <a href=" https://twitter.com/Piersoft" target="_blank" title="Francesco Piero Paolicelli" rel="noopener noreferrer">@piersoft</a>, <a href="https://twitter.com/cirospat" target="_blank" title="Ciro Spataro" rel="noopener noreferrer">@cirospat</a> e <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>',
minZoom: 13,   maxZoom: 18, maxNativeZoom: 18, label: 'Carta tecnica Omira 1935 | 1:5k', iconURL: 'legend/basemap/omira_clip.jpg', caption: '1935', group: '1900-oggi'}).addTo(map);

var irta = L.tileLayer.mask("https://mapwarper.net/maps/tile/19792/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Cartografia storica - Carta Tecnica di Palermo - Irta 1956 | 1:5k - Rielaborazione di: <a href="https://twitter.com/aborruso" target="_blank" title="Andrea Borruso" rel="noopener noreferrer">@aborruso</a>, <a href="https://twitter.com/napo"target="_blank" title="Maurizio Napolitano" rel="noopener noreferrer">@napo</a>, <a href=" https://twitter.com/Piersoft" target="_blank" title="Francesco Piero Paolicelli" rel="noopener noreferrer">@piersoft</a>, <a href="https://twitter.com/cirospat" target="_blank" title="Ciro Spataro" rel="noopener noreferrer">@cirospat</a> e <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>',
minZoom: 13,   maxZoom: 18, maxNativeZoom: 18, label: 'Carta tecnica Irta 1956 | 1:5k', iconURL: 'legend/basemap/irta_clip.jpg', caption: '1956', group: '1900-oggi'});
	
var prg62 = L.tileLayer.mask("https://mapwarper.net/maps/tile/52666/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - PRG aggiornato con i provvedimenti del d.p.r.s. n 110/a del 28/06/1962 e con le successive varianti fino a giugno 1984 | 1:5k - Rielaborazione di: <a href="https://twitter.com/aborruso" target="_blank" title="Andrea Borruso" rel="noopener noreferrer">@aborruso</a>,  <a href="https://twitter.com/cirospat" target="_blank" title="Ciro Spataro" rel="noopener noreferrer">@cirospat</a> e <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>',
minZoom: 13,   maxZoom: 18, maxNativeZoom: 18, label: 'Piano Regolatore Generale 1962 | 1:5k', iconURL: 'legend/basemap/prg62_clip.jpg', caption: '1962', group: '1900-oggi'});

var prg04 = L.tileLayer.mask("https://siciliahub.github.io/mappe/palermo_hub/data/prg2004/{z}/{x}/{y}.png", { attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Variante Generale al P.R.G. vigente al 2016 | 1:5k - Rielaborazione di: <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>', minZoom: 13,   maxZoom: 17, maxNativeZoom: 17, tms: true, label: 'Variante Generale 2004 | 1:5k (max zoom 17)', iconURL: 'legend/basemap/prg04_clip.jpg', caption: '2004', group: 'Cartografia tecnica' });

var ctc2k = L.tileLayer.mask("https://siciliahub.github.io/Tiles/ctr_pa_2k/{z}/{x}/{y}.png", { attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Carta Tecnica Comunale 2k 2007/09 - Rielaborazione di: <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>', minZoom: 13,   maxZoom: 18, maxNativeZoom: 18, label: 'Carta Tecnica Comunale 2k 2007/09', iconURL: 'legend/basemap/irta_clip.jpg', caption: '2007', group: 'Cartografia tecnica' });

var ctr10k = L.tileLayer.mask("https://siciliahub.github.io/mappe/palermo_hub/data/ctr10k/{z}/{x}/{y}.png", { attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Carta Tecnica Regionale 10k 2012/13 | 1:10k - Rielaborazione di: <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>', minZoom: 12,   maxZoom: 17, maxNativeZoom: 17, tms: true, label: 'Carta Tecnica Regionale | 1:10k 2012/13 (max zoom 17)', iconURL: 'legend/basemap/ctr_clip.jpg', caption: '2012', group: 'Cartografia tecnica' });

	
var sas = L.tileLayer.mask("https://mapwarper.net/maps/tile/19785/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Cartografia storica - Carta Tecnica di Palermo - Sas 1987 | 1:5k - Rielaborazione di: <a href="https://twitter.com/aborruso" target="_blank" title="Andrea Borruso" rel="noopener noreferrer">@aborruso</a>, <a href="https://twitter.com/napo"target="_blank" title="Maurizio Napolitano" rel="noopener noreferrer">@napo</a>, <a href=" https://twitter.com/Piersoft" target="_blank" title="Francesco Piero Paolicelli" rel="noopener noreferrer">@piersoft</a>, <a href="https://twitter.com/cirospat" target="_blank" title="Ciro Spataro" rel="noopener noreferrer">@cirospat</a> e <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>',
minZoom: 13,   maxZoom: 18, maxNativeZoom: 18, label: 'Carta tecnica Sas 1987 | 1:5k', iconURL: 'legend/basemap/sas_clip.jpg', caption: '1987', group: '1900-oggi' });

var csg = L.tileLayer.mask("https://palermohub.github.io/PRG2004/CSG/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Carta Tecnica Comunale CSG 2k 1989/91 - Rielaborazione di: <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>',
minZoom: 13,   maxZoom: 18, maxNativeZoom: 18, label: 'Carta Tecnica Comunale CSG 2k 1989/91', iconURL: 'legend/basemap/irta_clip.jpg', caption: '1989', group: '1900-oggi' });

var ctc = L.tileLayer.mask("https://mapwarper.net/maps/tile/25750/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Cartografia storica - Carta Tecnica di Palermo - Ufficio Tecnico Comunale 1:8k | 1908 - Rielaborazione di: <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>',
minZoom: 13,   maxZoom: 18, maxNativeZoom: 18, label: 'Carta tecnica Municipale 1908 | 1:8k', iconURL: 'legend/basemap/ctc_clip.jpg', caption: '1908', group: '1900-oggi'});

var City_Plans_Palermo = L.tileLayer.mask("https://mapwarper.net/maps/tile/45304/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Cartografia storica - City Plans Palermo 1:10k- U.S. Army Map Service, 1943-1944 - Rielaborazione di: <a href="https://twitter.com/aborruso" target="_blank" title="Andrea Borruso" rel="noopener noreferrer">@aborruso</a>, <a href="https://twitter.com/napo"target="_blank" title="Maurizio Napolitano" rel="noopener noreferrer">@napo</a>, <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>',
minZoom: 13,   maxZoom: 17, maxNativeZoom: 17, label: 'U.S. Army Map Service, 1943-1944 | City Plans Palermo 1:10k', iconURL: 'legend/basemap/us43_clip.jpg', caption: '1943', group: '1900-oggi'});

var Palermo_50k = L.tileLayer.mask("https://mapwarper.net/maps/tile/45321/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Cartografia storica - Palermo 1:50k | Series 4229, U.S. Army Map Service, 1941 - Rielaborazione di: <a href="https://twitter.com/aborruso" target="_blank" title="Andrea Borruso" rel="noopener noreferrer">@aborruso</a>, <a href="https://twitter.com/napo"target="_blank" title="Maurizio Napolitano" rel="noopener noreferrer">@napo</a>, e <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>',
minZoom: 13,   maxZoom: 17, maxNativeZoom: 17, label: 'U.S. Army Map Service, 1941 Series 4229 | Palermo 1:50k', iconURL: 'legend/basemap/us41_clip.jpg', caption: '1941', group: '1900-oggi'});

var ppecs = L.tileLayer.mask("https://mapwarper.net/maps/tile/52867/{z}/{x}/{y}.png", {
      attribution: '<a href="https://github.com/frogcat/leaflet-tileoverlay-mask" target="_blank" title="Leaflet-tileoverlay-mask" rel="noopener noreferrer">Leaflet-tileoverlay-mask</a> - Piano Particolareggiato Esecutivo del centro storico di Palermo - Palermo 1:500 - Rielaborazione di: <a href="https://twitter.com/gbvitrano" target="_blank" title="Giovan Battista Vitrano" rel="noopener noreferrer">@gbvitrano</a>  per <a href="https://twitter.com/opendatasicilia" target="_blank" title="opendatasicilia" rel="noopener noreferrer">@opendatasicilia</a>',
minZoom: 13,   maxZoom: 18, maxNativeZoom: 18, label: 'P.P.E. del centro storico 1993 | 1:500', iconURL: 'legend/basemap/ppe_clip.jpg', caption: '1993', group: '1900-oggi'});

<!-- credits -->
var credctrl = L.controlCredits({
    image: "lib/images/opendatasicilia_dredits.png",
    link: "https://opendatasicilia.it/",
    text: "Interactive mapping<br/>by opendatasicilia"
}).addTo(map);

var overlayBasemaps = [osm, google, googlesat, palermo1580, palermo1754, palermo1860, palermo1877, nuova, palermo1891, palermo1893, ctc, omira, irta, prg62, sas, csg, ppecs, Palermo_50k, City_Plans_Palermo, prg04, ctc2k, ctr10k];

<!-- una sola mappa storica sovrapposta alla volta: le due strisce a cerchietti aggiungono/rimuovono layer con map.addLayer/removeLayer, che non genera l'evento overlayadd del vecchio L.Control.Layers - qui si ascolta l'evento nativo layeradd -->
var basemapCaptionToTab = {
	'1580': 'storia', '1754': 'storia', '1860': 'storia', '1877': 'storia',
	'1882': 'storia', '1891': 'storia', '1893': 'storia',
	'1935': 'omira', '1941': 'usarmymap', '1943': 'usarmymap',
	'1956': 'irta', '1962': 'prg62', '1987': 'sas', '1993': 'ppe', '2004': 'prg',
	'1989': 'ctr2012', '2007': 'ctr2012', '2012': 'ctr2012'
};
function syncBasemapDot(layer) {
	// pallino blu sull'icona della sidebar corrispondente alla mappa storica sovrapposta in uso
	var tabs = document.querySelectorAll('.sidebar-tabs .basemap-current');
	for (var i = 0; i < tabs.length; i++) { tabs[i].classList.remove('basemap-current'); }
	var caption = layer && layer.options && layer.options.caption;
	var tabId = basemapCaptionToTab[caption];
	if (tabId) {
		var link = document.querySelector('.sidebar-tabs a[href="#' + tabId + '"]');
		if (link) { link.closest('li').classList.add('basemap-current'); }
	}
}
var sideBySideActive = false;
var sideBySideControl = null;
var sbsRightLayer = null;
var sbsHiddenOverlay = null;

map.on('layeradd', function(e) {
	if (overlayBasemaps.indexOf(e.layer) === -1) { return; }
	overlayBasemaps.forEach(function(layer) {
		if (layer !== e.layer && map.hasLayer(layer)) { map.removeLayer(layer); }
	});
	syncBasemapDot(e.layer);
	applyOcchioSettings(e.layer);
	if (sideBySideActive) { refreshSideBySide(e.layer); }
});
// la mappa storica di default è già aggiunta al caricamento, prima che il listener sopra si registri: sync iniziale esplicito
overlayBasemaps.forEach(function(layer) {
	if (map.hasLayer(layer)) { syncBasemapDot(layer); }
});
			var hash = new L.Hash(map);
			var sidebar = L.control.sidebar('sidebar').addTo(map);
			var sidebarRight = L.control.sidebar('sidebar-right', { position: 'right' }).addTo(map);
			var sidebarRightEl0 = document.getElementById('sidebar-right');
			var sidebarRightFab = document.getElementById('sidebar-right-fab');
			if (sidebarRightFab) {
				sidebarRightFab.addEventListener('click', function () {
					sidebarRight.open('cartoline');
				});
			}
			var sidebarLeftEl0 = document.getElementById('sidebar');
			var sidebarLeftFab = document.getElementById('sidebar-left-fab');
			if (sidebarLeftFab) {
				sidebarLeftFab.addEventListener('click', function () {
					sidebar.open('home');
				});
			}

			// bug Chromium (mobile viewport meta, verificato con Playwright headless
			// in isMobile+hasTouch, cioe' la stessa modalita' del device toolbar di
			// Chrome/Brave DevTools): #sidebar-right chiusa resta position:fixed e
			// si sposta fuori schermo solo via transform (translateX molto ampio,
			// vedi CSS #sidebar-right.sidebar.collapsed). Questo box, pur invisibile,
			// viene comunque conteggiato nel calcolo del layout viewport mobile,
			// gonfiando window.innerWidth ben oltre la larghezza reale dello schermo
			// (misurato: 430px -> 900px) e scentrando qualunque elemento posizionato
			// con left:50% (la toolbar in alto, in primis). overflow:hidden su
			// html/body NON basta a evitarlo (verificato). Fix: display:none quando
			// chiusa (rimuove il box dal layout), ripristinato solo durante
			// l'animazione di apertura/chiusura cosi' lo scivolamento resta visibile.
			(function () {
				var hideTimer = null;
				if (sidebarRightEl0.classList.contains('collapsed')) { sidebarRightEl0.style.display = 'none'; }
				new MutationObserver(function () {
					clearTimeout(hideTimer);
					if (sidebarRightEl0.classList.contains('collapsed')) {
						hideTimer = setTimeout(function () { sidebarRightEl0.style.display = 'none'; }, 360);
					} else {
						sidebarRightEl0.style.display = '';
					}
				}).observe(sidebarRightEl0, { attributes: true, attributeFilter: ['class'] });
			})();

			// stesso fix del box off-canvas della destra, ma solo sotto i 768px:
			// da 768px in su la sinistra resta la striscia 40px normale (mai
			// off-canvas), quindi il bug del innerWidth gonfiato non si applica.
			(function () {
				var hideTimer = null;
				var mq = window.matchMedia('(max-width: 767px)');
				function sync() {
					clearTimeout(hideTimer);
					if (!mq.matches) { sidebarLeftEl0.style.display = ''; return; }
					if (sidebarLeftEl0.classList.contains('collapsed')) {
						hideTimer = setTimeout(function () { sidebarLeftEl0.style.display = 'none'; }, 360);
					} else {
						sidebarLeftEl0.style.display = '';
					}
				}
				if (mq.matches && sidebarLeftEl0.classList.contains('collapsed')) { sidebarLeftEl0.style.display = 'none'; }
				new MutationObserver(sync).observe(sidebarLeftEl0, { attributes: true, attributeFilter: ['class'] });
				mq.addEventListener('change', sync);
			})();
		   var toolbar = L.control.toolbar({
			   homeCenter: INITIAL_CENTER,
			   homeZoom: INITIAL_ZOOM
		   }).addTo(map);
		   toolbar.attachSearch(geocoderOdsControl);
	   var basemapsControl = L.control.basemaps({
            basemaps: basemaps,
            overlays: overlayBasemaps,
            tileX: 0,
            tileY: 0,
            tileZ: 1,
            embedded: true
		    });
	   // niente map.addControl: il pannello basemaps viene innestato
	   // direttamente nel dropdown della toolbar (vedi attachBasemaps)
	   toolbar.attachBasemaps(basemapsControl);

	   // sposta lo slider temporale (creato dal controllo basemaps) dentro la
	   // toolbar in alto, cosi' resta sempre visibile invece che nascosto nel
	   // pannello basemaps
	   var timesliderNode = basemapsControl._container.querySelector('.basemaps-timeslider');
	   if (timesliderNode) { toolbar.attachTimeslider(timesliderNode); }

// pulsante "side by side" in toolbar: confronta la mappa di base attuale
// (basemapsControl.basemap, es. OSM) con la mappa storica attualmente
// sovrapposta come "occhio di bue" (basemapsControl.overlayLayer), affiancate
// da uno slider trascinabile (vedi atlante/js/sidebyside/L.Control.SideBySide.js).
// Il layer storico usato per il confronto NON e' quello mascherato a cerchio
// (in overlayBasemaps: il suo container reale resta nascosto apposta per
// l'effetto "occhio di bue", vedi leaflet-tileoverlay-mask.js) ma il suo
// gemello semplice nell'array "basemaps" (stessa URL tile, usato altrimenti
// solo per le icone del pannello mappe): i due array sono allineati per indice.
// Iniettato qui invece che in L.Control.Toolbar.js perche' la funzionalita'
// e' esclusiva di questa pagina.
var sbsBtn = L.DomUtil.create('a', 'map-toolbar-btn map-toolbar-sidebyside');
sbsBtn.href = '#';
sbsBtn.title = 'Confronta affiancate (side by side)';
sbsBtn.innerHTML = '<i class="fa fa-columns" aria-hidden="true"></i>';
var infoBtnNode = toolbar._container.querySelector('.map-toolbar-info');
if (infoBtnNode) { toolbar._container.insertBefore(sbsBtn, infoBtnNode); } else { toolbar._container.appendChild(sbsBtn); }
L.DomEvent.disableClickPropagation(sbsBtn);

// versione "piatta" (senza occhio di bue) del layer storico mascherato: viene
// clonata al volo dalla URL/opzioni del layer mascherato stesso, invece di
// riusare l'array "basemaps" (pensato solo per le icone del pannello: alcune
// voci li' dentro hanno URL diverse/rotte rispetto al layer mascherato
// corrispondente, es. la voce 2012 punta a un percorso che risponde 404).
// La clona viene tenuta in cache sul layer mascherato per non ricrearla ad
// ogni refresh.
function getRealCounterpart(overlayLayer) {
	if (!overlayLayer) { return null; }
	if (!overlayLayer._sbsPlainLayer) {
		overlayLayer._sbsPlainLayer = L.tileLayer(overlayLayer._url, overlayLayer.options);
	}
	return overlayLayer._sbsPlainLayer;
}

// (ri)costruisce il confronto con la coppia di layer attualmente scelta
// dall'utente (base + storica sovrapposta). overlayLayerHint viene passato
// dal listener layeradd quando il cambio arriva da li': in quel momento
// basemapsControl.overlayLayer non e' ancora aggiornato (viene assegnato
// dopo l'addLayer che genera l'evento), quindi si usa il layer appena
// aggiunto invece di rileggerlo dal controllo.
function refreshSideBySide(overlayLayerHint) {
	var leftLayer = basemapsControl.basemap;
	var overlayLayer = overlayLayerHint || basemapsControl.overlayLayer;
	var rightLayer = getRealCounterpart(overlayLayer);

	if (sbsHiddenOverlay && sbsHiddenOverlay !== overlayLayer && sbsHiddenOverlay._e1) {
		sbsHiddenOverlay._e1.style.display = '';
		sbsHiddenOverlay = null;
	}

	// preserva la posizione dello slider attraverso il refresh, invece di
	// farlo ripartire sempre dal centro ad ogni cambio mappa
	var previousRatio = sideBySideControl ? sideBySideControl._range.value : 50;

	// il vecchio controllo va rimosso PRIMA di rimuovere il vecchio rightLayer
	// dalla mappa: SideBySide.remove() pulisce lo style.clip leggendo
	// getContainer() dei layer che stava confrontando, e removeLayer() azzera
	// quel container (torna null) - nell'ordine sbagliato getContainer()
	// lancia un errore che interrompe il resto del refresh, lasciando lo stato
	// bloccato per tutti i cambi successivi.
	if (sideBySideControl) { sideBySideControl.remove(); sideBySideControl = null; }
	if (sbsRightLayer && sbsRightLayer !== rightLayer && map.hasLayer(sbsRightLayer)) {
		map.removeLayer(sbsRightLayer);
	}

	if (!rightLayer || !leftLayer || rightLayer === leftLayer) {
		// nessuna mappa storica selezionata (o coincide con la base): il confronto non ha senso
		deactivateSideBySide();
		return;
	}

	sbsRightLayer = rightLayer;
	if (!map.hasLayer(rightLayer)) { map.addLayer(rightLayer); }
	// POC: la storica (rightLayer) resta disegnata a tutta pagina (vedi
	// blendRight in L.Control.SideBySide-poc.js) invece che ritagliata solo
	// sulla meta' destra, cosi' abbassando la trasparenza della base
	// (leftLayer, vedi slider "Trasparenza mappa di base") si intravede
	// anche a sinistra. Ma per funzionare la base deve stare SOPRA nello
	// stack di disegno, altrimenti la storica (ritagliata a tutta pagina)
	// coprirebbe anche la meta' sinistra: portArla in primo piano ora che
	// rightLayer e' stato (ri)aggiunto sopra di lei.
	leftLayer.bringToFront();
	// nasconde il cerchietto "occhio di bue" (SVG di leaflet-tileoverlay-mask.js) del
	// layer storico mascherato, altrimenti resta visibile sovrapposto al confronto
	if (overlayLayer && overlayLayer._e1) {
		sbsHiddenOverlay = overlayLayer;
		overlayLayer._e1.style.display = 'none';
	}

	sideBySideControl = L.control.sideBySide([leftLayer], [rightLayer], { initialRatio: previousRatio, blendRight: true }).addTo(map);
	L.DomUtil.addClass(sbsBtn, 'active');
	if (basemapsControl.basemap) { basemapsControl.basemap.setOpacity(baseOpacity); }
}

function activateSideBySide() {
	if (!basemapsControl.overlayLayer) {
		alert('Seleziona prima una mappa storica dal pannello mappe: verra\' confrontata con la mappa di base attuale.');
		return;
	}
	sideBySideActive = true;
	refreshSideBySide();
}

function deactivateSideBySide() {
	sideBySideActive = false;
	if (sideBySideControl) { sideBySideControl.remove(); sideBySideControl = null; }
	if (sbsHiddenOverlay && sbsHiddenOverlay._e1) { sbsHiddenOverlay._e1.style.display = ''; }
	sbsHiddenOverlay = null;
	if (sbsRightLayer && map.hasLayer(sbsRightLayer)) { map.removeLayer(sbsRightLayer); }
	sbsRightLayer = null;
	L.DomUtil.removeClass(sbsBtn, 'active');
}

L.DomEvent.on(sbsBtn, 'click', function(e) {
	L.DomEvent.stop(e);
	if (L.DomUtil.hasClass(sbsBtn, 'disabled')) { return; }
	if (sideBySideActive) { deactivateSideBySide(); } else { activateSideBySide(); }
});

// mentre il confronto e' attivo, il cambio di mappa di base aggiorna il
// confronto invece di uscirne (vedi anche map.on('layeradd') per l'overlay)
basemapsControl.on('basemapchange', function() {
	if (sideBySideActive) { refreshSideBySide(); }
	if (basemapsControl.basemap) { basemapsControl.basemap.setOpacity(baseOpacity); }
});

// aggiunge un passo sulla modalita' confronto affiancato al pannello guida del
// selettore mappe (L.Control.Basemaps_02_timeslider.js e' condiviso con altre
// pagine che non hanno questo pulsante, quindi il passo si aggiunge qui via JS
// invece che nel file sorgente del controllo)
var basemapsHelpPanel = basemapsControl._container.querySelector('.basemaps-help-panel');
if (basemapsHelpPanel) {
	var sbsHelpStep = L.DomUtil.create('div', 'basemap-help-step', basemapsHelpPanel);
	sbsHelpStep.innerHTML = '<i class="fa fa-columns" aria-hidden="true"></i>' +
		'<div>L\'icona <strong>a colonne</strong> nella barra degli strumenti attiva il confronto <strong>affiancato</strong>: mostra la mappa storica sovrapposta e quella di base divise da uno slider trascinabile, al posto dell\'effetto "occhio di bue". Abbassando la trasparenza della mappa di base (vedi icona <strong>impostazioni</strong>) si intravede la mappa storica anche a sinistra del divisore.</div>';

	var settingsHelpStep = L.DomUtil.create('div', 'basemap-help-step', basemapsHelpPanel);
	settingsHelpStep.innerHTML = '<i class="fa fa-sliders" aria-hidden="true"></i>' +
		'<div>L\'icona <strong>impostazioni</strong> nella barra degli strumenti apre un pannello per regolare il <strong>raggio</strong> e la <strong>trasparenza</strong> dell\'effetto "occhio di bue", e la <strong>trasparenza della mappa di base</strong> nel confronto affiancato.</div>';
}

// POC: pannello impostazioni confronto (raggio/trasparenza occhio di bue +
// trasparenza mappa di base nel confronto affiancato). Iniettato qui come il
// pulsante side-by-side sopra, con dropdown "fatto a mano" (non registrato in
// toolbar._dropdowns: quel meccanismo di apertura/chiusura e' privato al file
// condiviso L.Control.Toolbar.js, che qui non tocchiamo per restare isolati
// nella copia POC) ma stile riuso dalle classi .map-toolbar-dropdown-wrap/
// .map-toolbar-dropdown gia' definite in L.Control.Toolbar.css.
var occhioRadius = 150;   // px, default plugin: maskWidth 300 => raggio 150
var occhioOpacity = 1;    // 0-1, trasparenza persistente cerchio occhio di bue
var baseOpacity = 1;      // 0-1, trasparenza layer base (side by side e vista normale)

function applyOcchioSettings(layer) {
	if (layer && layer.setMaskRadius) {
		layer.setMaskRadius(occhioRadius);
		layer.setMaskOpacity(occhioOpacity);
	}
}
// applica ai layer occhio di bue gia' presenti sulla mappa al caricamento
// (es. la mappa storica di default aggiunta inline con .addTo(map))
overlayBasemaps.forEach(function(layer) {
	if (map.hasLayer(layer)) { applyOcchioSettings(layer); }
});

var settingsWrap = L.DomUtil.create('div', 'map-toolbar-dropdown-wrap');
var settingsBtn = L.DomUtil.create('a', 'map-toolbar-btn map-toolbar-occhio-settings', settingsWrap);
settingsBtn.href = '#';
settingsBtn.title = 'Impostazioni confronto (raggio/trasparenza)';
settingsBtn.innerHTML = '<i class="fa fa-sliders" aria-hidden="true"></i>';
var settingsPanel = L.DomUtil.create('div', 'map-toolbar-dropdown occhio-settings-panel', settingsWrap);
settingsPanel.innerHTML =
	'<div class="occhio-settings-row">' +
		'<label for="occhio-radius-range">Raggio occhio di bue: <span id="occhio-radius-value">' + occhioRadius + '</span> px</label>' +
		'<input type="range" id="occhio-radius-range" min="40" max="400" step="10" value="' + occhioRadius + '">' +
	'</div>' +
	'<div class="occhio-settings-row">' +
		'<label for="occhio-opacity-range">Trasparenza mappa storica (occhio di bue): <span id="occhio-opacity-value">100</span>%</label>' +
		'<input type="range" id="occhio-opacity-range" min="0" max="100" step="5" value="100">' +
	'</div>' +
	'<div class="occhio-settings-row">' +
		'<label for="base-opacity-range">Trasparenza mappa di base (confronto affiancato): <span id="base-opacity-value">100</span>%</label>' +
		'<input type="range" id="base-opacity-range" min="0" max="100" step="5" value="100">' +
	'</div>';
if (infoBtnNode) { toolbar._container.insertBefore(settingsWrap, infoBtnNode); } else { toolbar._container.appendChild(settingsWrap); }
L.DomEvent.disableClickPropagation(settingsWrap);

L.DomEvent.on(settingsBtn, 'click', function(e) {
	L.DomEvent.stop(e);
	L.DomUtil.hasClass(settingsPanel, 'open') ? L.DomUtil.removeClass(settingsPanel, 'open') : L.DomUtil.addClass(settingsPanel, 'open');
});
L.DomEvent.on(document, 'click', function(e) {
	if (!settingsWrap.contains(e.target)) { L.DomUtil.removeClass(settingsPanel, 'open'); }
});

document.getElementById('occhio-radius-range').addEventListener('input', function(e) {
	occhioRadius = parseInt(e.target.value, 10);
	document.getElementById('occhio-radius-value').textContent = occhioRadius;
	applyOcchioSettings(basemapsControl.overlayLayer);
});
document.getElementById('occhio-opacity-range').addEventListener('input', function(e) {
	occhioOpacity = parseInt(e.target.value, 10) / 100;
	document.getElementById('occhio-opacity-value').textContent = e.target.value;
	applyOcchioSettings(basemapsControl.overlayLayer);
});
document.getElementById('base-opacity-range').addEventListener('input', function(e) {
	baseOpacity = parseInt(e.target.value, 10) / 100;
	document.getElementById('base-opacity-value').textContent = e.target.value;
	if (basemapsControl.basemap) { basemapsControl.basemap.setOpacity(baseOpacity); }
});

// tab "Condividi": link, icone social e impostazioni iframe aggiornati in base alla vista corrente della mappa
function updateShareTab() {
	var currentUrl = window.location.href;
	var urlInput = document.getElementById('share_url');
	if (urlInput) { urlInput.value = currentUrl; }

	var baseUrl = window.location.origin + window.location.pathname;
	var includeView = document.getElementById('iframe_include_view');
	var widthInput = document.getElementById('iframe_width');
	var heightInput = document.getElementById('iframe_height');
	var iframeSrc = (includeView && includeView.checked) ? currentUrl : baseUrl;
	var width = (widthInput && widthInput.value.trim()) || '100%';
	var height = (heightInput && heightInput.value.trim()) || '800';

	var iframeCode = '<iframe width="' + width + '" height="' + height + 'px" frameborder="0" src="' + iframeSrc + '"></iframe>\n' +
		'<a href="' + iframeSrc + '" title="Visualizza l’Atlante delle carte tecniche storiche di Palermo a schermo intero">Visualizza a schermo intero</a>';

	var iframeTextarea = document.getElementById('iframe');
	if (iframeTextarea) { iframeTextarea.value = iframeCode; }

	var fullscreenLink = document.getElementById('share_fullscreen_link');
	if (fullscreenLink) { fullscreenLink.href = iframeSrc; }

	var shareText = document.title || 'Atlante delle carte tecniche storiche di Palermo';
	var encodedUrl = encodeURIComponent(currentUrl);
	var encodedText = encodeURIComponent(shareText);
	var shareLinks = {
		facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
		twitter: 'https://twitter.com/intent/tweet?url=' + encodedUrl + '&text=' + encodedText,
		whatsapp: 'https://api.whatsapp.com/send?text=' + encodedText + '%20' + encodedUrl,
		telegram: 'https://t.me/share/url?url=' + encodedUrl + '&text=' + encodedText,
		linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl,
		email: 'mailto:?subject=' + encodedText + '&body=' + encodedUrl
	};
	var socialLinks = document.querySelectorAll('#share-social a[data-share]');
	for (var s = 0; s < socialLinks.length; s++) {
		var type = socialLinks[s].getAttribute('data-share');
		if (shareLinks[type]) { socialLinks[s].href = shareLinks[type]; }
	}
}

function copyShareField(btn) {
	var el = document.getElementById(btn.getAttribute('data-copy-target'));
	if (!el) { return; }
	el.select();
	el.setSelectionRange(0, el.value.length);
	var showCopied = function() {
		var original = btn.innerHTML;
		btn.innerHTML = '<i class="fa fa-check" aria-hidden="true"></i>';
		setTimeout(function() { btn.innerHTML = original; }, 1200);
	};
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(el.value).then(showCopied, function() {
			document.execCommand('copy');
			showCopied();
		});
	} else {
		document.execCommand('copy');
		showCopied();
	}
}

var shareCopyButtons = document.querySelectorAll('.share-copy-btn');
for (var c = 0; c < shareCopyButtons.length; c++) {
	shareCopyButtons[c].addEventListener('click', function() { copyShareField(this); });
}

var shareSettingIds = ['iframe_width', 'iframe_height', 'iframe_include_view'];
for (var f = 0; f < shareSettingIds.length; f++) {
	var settingEl = document.getElementById(shareSettingIds[f]);
	if (settingEl) {
		settingEl.addEventListener('input', updateShareTab);
		settingEl.addEventListener('change', updateShareTab);
	}
}

sidebar.on('content', function(e) { if (e.id === 'share') { updateShareTab(); } });
window.addEventListener('hashchange', function() {
	var sharePane = document.getElementById('share');
	if (sharePane && sharePane.classList.contains('active')) { updateShareTab(); }
});
updateShareTab();

