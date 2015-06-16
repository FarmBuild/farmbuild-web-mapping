#FarmBuild Web Mapping

This is the webmapping module of farm build JavaScript library.


## Getting Started

To get you started use the navigation on the left side of this page to explore different function of webmapping.


## Units
Area is in Hectare and Length is in metre.

## Exception handling
All functions return undefined in case that there is an error related to wrong input values.

## Google Analytics for tracking API usage
DEDJTR wants to understand the usage of the API, so please include the below API when you call calculate function.
The track API calls GA using its own tracking name so you can embedded in your application even though you already have
GA implementation.

Example
```
var organisationName = 'Spatial Vision';
//Calling the track API for the usage
farmbuild.webmapping.ga.trackCalculate(organisationName);
```
