# FarmData supported projections

FarmData supports the following projections and provide a set of APIs to convert between them (using proj4js).
The conversion definitions are referenced from <a href="http://epsg.io/" target="_blank">epsg.io</a>
* GDA 94 geographics: EPSG:4283
* WGS 84 Geographics: EPSG:4326
* Web Mercator: EPSG:3857
* VicGrid 94: EPSG:3111
* NSW Lamberts: EPSG:3308
* SA Lamberts: EPSG:3107
* Australian Albers: EPSG:3577

## GDA 94 geographics: EPSG:4283
```
proj4.defs("EPSG:4283","+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
```
<a href="http://epsg.io/4283" target="_blank">more details</a>

## WGS 84 Geographics: EPSG:4326
```
proj4.defs("EPSG:4326","+proj=longlat +datum=WGS84 +no_defs");
```
<a href="http://epsg.io/4326" target="_blank">more details</a>

## Web Mercator: EPSG:3857
```
proj4.defs("EPSG:3857","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");
```
<a href="http://epsg.io/3857" target="_blank">more details</a>

* VicGrid 94: EPSG:3111
* NSW Lamberts: EPSG:3308
* SA Lamberts: EPSG:3107
* Australian Albers: EPSG:3577

The