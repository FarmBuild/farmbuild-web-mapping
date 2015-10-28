<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [FarmBuild Web Mapping](#farmbuild-web-mapping)
  - [Getting Started](#getting-started)
  - [Units](#units)
  - [Exception handling](#exception-handling)
  - [Google Analytics for tracking API usage](#google-analytics-for-tracking-api-usage)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

#FarmBuild Web Mapping

This is the web mapping component of FarmBuild project.

version 1.1.0


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
var organisationName = 'your organisation name';
//Calling the track API for the usage
farmbuild.webmapping.ga.trackCalculate(organisationName);
```
