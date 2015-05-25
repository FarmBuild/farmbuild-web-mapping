# FarmData supported projections

FarmData supports the following projections and provide a set of APIs to convert between them (using proj4js).
The conversion definitions are referenced from <a href="http://epsg.io/">epsg.io</a>

## GDA 94 geographics: EPSG:4283
<a href="http://epsg.io/">Definition</a>
```
proj4.defs("EPSG:4326","+proj=longlat +datum=WGS84 +no_defs");
```

* WGS 84 Geographics: EPSG:4326
* Web Mercator: EPSG:3857
* VicGrid 94: EPSG:3111
* NSW Lamberts: EPSG:3308
* SA Lamberts: EPSG:3107
* Australian Albers: EPSG:3577

The