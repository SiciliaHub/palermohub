// Qgis2threejs Project
project = new Q3D.Project({crs:"EPSG:3857",wgs84Center:{lat:38.1390452435,lon:13.3457965764},proj:"+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs",title:"20170316185615",baseExtent:[1480669.50645,4596018.06789,1490625.05177,4602155.74521],rotation:0,zShift:0.0,width:100.0,zExaggeration:1.0});

// Layer 0
lyr = project.addLayer(new Q3D.DEMLayer({q:1,shading:true,type:"dem",name:"DTM Palermo"}));
