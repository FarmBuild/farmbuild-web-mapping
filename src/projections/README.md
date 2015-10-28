<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [FarmData supported projections](#farmdata-supported-projections)
  - [GDA 94 geographics: EPSG:4283](#gda-94-geographics-epsg4283)
  - [WGS 84 Geographics: EPSG:4326](#wgs-84-geographics-epsg4326)
  - [Web Mercator: EPSG:3857](#web-mercator-epsg3857)
  - [VicGrid 94: EPSG:3111](#vicgrid-94-epsg3111)
  - [NSW Lamberts: EPSG:3308](#nsw-lamberts-epsg3308)
  - [SA Lamberts: EPSG:3107](#sa-lamberts-epsg3107)
  - [Australian Albers: EPSG:3577](#australian-albers-epsg3577)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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

## VicGrid 94: EPSG:3111
```
proj4.defs("EPSG:3857","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");
```
<a href="http://epsg.io/3111" target="_blank">more details</a>

## NSW Lamberts: EPSG:3308
```
proj4.defs("EPSG:3308","+proj=lcc +lat_1=-30.75 +lat_2=-35.75 +lat_0=-33.25 +lon_0=147 +x_0=9300000 +y_0=4500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
```
<a href="http://epsg.io/3308" target="_blank">more details</a>

## SA Lamberts: EPSG:3107
```
proj4.defs("EPSG:3107","+proj=lcc +lat_1=-28 +lat_2=-36 +lat_0=-32 +lon_0=135 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
```
<a href="http://epsg.io/3107" target="_blank">more details</a>

## Australian Albers: EPSG:3577
```
proj4.defs("EPSG:3577","+proj=aea +lat_1=-18 +lat_2=-36 +lat_0=0 +lon_0=132 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
```
<a href="http://epsg.io/3577" target="_blank">more details</a>

