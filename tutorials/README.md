#Web Mapping with FarmBuild Web Mapping API (Tutorial)

In this tutorial I will walk you through FarmBuild Web Mapping API to give you some ideas on how you can utilise it in your applications.<br/>
I start off by describing FarmBuild Web Mapping main components and I will continue with creating a complete web mapping example.<br/>
The example is part of farmbuild-web-mapping github repository.<br/>
<a href="https://github.com/FarmBuild/farmbuild-web-mapping/tree/master/examples">https://github.com/FarmBuild/farmbuild-web-mapping/tree/master/examples</a>

Web Mapping is using OpenLayers library. so you need to have a good understanding of OpenLayers to use these APIs.

##Understanding API

You will find an API folder in the root of github repository which contains all the API docs.<br/>
Please visit <a href="https://rawgit.com/FarmBuild/farmbuild-web-mapping/master/docs/farmbuild-web-mapping/1.1.0/index.html">API docs</a> to learn more about APIs.

By looking at the API doc you can see that there are different name spaces available through the left side menu.<br/>
By clicking on each namespace you are able to see its sub namespaces and methods.
For example if you click on webmapping which is the root namespace, you will see "actions, events, ga, measurement, olHelper, paddocks, paddocks/groups, paddocks/types, parcels".<br/>
Scroll down and you will see there are methods such as: create and export, with a complete description about each one.

"actions" contains a bunch of useful web mapping interactions. In OpenLayers there is concept called interaction that describes the way you can interact with the vectors on the map.<br/>
Here we do use the same concept and provide some higher level interactions that is necessary for doing web mapping.
Under this namespace you will find interactions such as: drawing, editing and snapping.

"events" namespace provides some hooks for you to understand about certain events in web mapping.
For example you can register for events to understand when drawing is finished, when a feature is selected/deselected or when map base layer is changed.

"olHelper" namespace provides functions to help you do common web mapping tasks easily.<br/>
For example you can use it initialise farm/paddocks vector layer and initialise web mapping.

paddocks/groups, paddocks/types namespaces are concerned with defining the references for types and groups of paddocks.<br/>
You can customise based on you application need and you can eventually persist these values in your farmdata.

We will have a closer look at most of these APIs through this tutorial.

##Getting Started ...

In this example I wil be using AngularJS to create the client-side application and that is all we need for now.

###First HTML page
There is a index.html file in the root of example folder. This is first page of this example. It contains all necessary form components for load and create.

You need to add couple JavaScript files here:<br>
FarmBuild core library: `<script src="../dist/farmbuild-core.js"></script>`<br> 
FarmBuild farmdata library: `<script src="../dist/farmbuild-farmdata.js"></script>`<br>
FarmBuild webmapping library `<script src="../dist/farmbuild-webmapping.js"></script>`<br>
AngularJS is embedded of FarmBuildCore library, so I dont need to add it.

I am also using bootstrap as css framework.<br>
`<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css">`

###Defining our application in AngularJS world

First of all we need to define our application in AngularJS terms.
The "index.js" file in the root of examples contains the application definition.

`angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])`

"farmbuild.webmapping.examples" is the application's name and we are defining "farmbuild.webmapping" as a dependency.

Reading through first page you will find that some of the functions are defined on `$scope` variable. In AngularJS `$scope` is kind of the glue between your HTML templates and your JS controllers.
Read more about `$scope`: <a href="https://docs.angularjs.org/guide/scope">https://docs.angularjs.org/guide/scope</a>

If you look at the first page in your browser you can see there are two separate ways you start with.<br/>
First one is to create a farmdata from scratch which utilises `webmapping.create`<br/>
Second one is to load an existing farmdata which uses `webmapping.load`

To provide load and create functions, I neet to create an controller. I will call it "FarmCtrl"<br/>
`angular.module('farmbuild.webmapping.examples').controller('FarmCtrl', function ($scope, $log, webmapping) {})`
<pre>
$scope.farmData = {};
/**
 * Array of farmdata's supported crs
 * Get first item in the Array
*/
$scope.crsSupported = webmapping.farmdata.crsSupported;
$scope.farmNew = {crs: $scope.crsSupported[0].name};
</pre>

###Create a new farmdata from scratch
When creating a farmdata you can couple of parameters:
- name: The name of the farm
- id: The ID of this farm in case if you manage this farm in an external system, so you can map the farmData
- projectionName: The projection name
- options: an object that describes configuration for different sections. Currently you can specify an array for paddockGroups and paddockTypes.<br>
You can construct the default values for paddock types and groups in your application and pass it to api on creation,
your default values will override api default values. (eg: [{name: 'Business Default Type 1'}]).

Passing defaults values in this way is optional and if omitted api default values will be used.
If you like to extend api default values you can get api ones and add your own values (eg: webmapping.paddocks.types.toArray()).

Here I am defining `myPaddockTypes` and I am extending api defaults to add my custom types.<br>
With the `paddockGroups` I am completely overriding api defaults with `myPaddockGroups`.<br>
After setting the desired configuration for farmdata, I create the farmdata, passing this configuration as myOptions to `webmapping.create` function.
`create` function returns the farmdata and then I load it into webmapping using `webmapping.load(created)`.

`directToSide()` function is simply redirecting browser to the web mapping example page.

<pre>
$scope.createNew = function (farmNew) {
    $log.info('$scope.createNew %j', farmNew);
    
    var myPaddockGroups = [
            {name: 'Business Default Group 1', paddocks: []},
            {name: 'Business Default Group 2', paddocks: []}
        ],
        apiPaddockTypes = webmapping.paddocks.types.toArray(),
        myPaddockTypes = [{name: 'Business Default Type 1'}],
        myOptions = {
            paddockGroups: myPaddockGroups,
            /**
             * Example of type containing api paddock types and custom types, concat is a JavaScript method to concat two Arrays.
             * You may use any other library or function to concat these arrays.
             */
            paddockTypes: apiPaddockTypes.concat(myPaddockTypes)
        },

        /**
         * Create farmdata with this configurations, ,look at the api docs for more description.
         */
        created = webmapping.create(farmNew.name, farmNew.id, farmNew.crs, myOptions);

    if (!created) {
        $scope.noResult = true;
        return;
    }

    /**
     * Loading farmdata into session storage, webmapping utilises browser session storage to persist data while you change things.
     * Later you can use export function to download the updated farmdata as a json file.
     */
    webmapping.load(created);
    directToSide();
}
</pre>

###Load an existing farmdata
If you already have valid farmdata, you want to load it into Web Mapping. So instead of create, I want to have something like a load function.<br>
`load` function receives farmdata as json string value, and I use angular to convert it to JavaScript object.

<pre>
/**
 * Load farmdata if you already have valid one.
 * This function is called using the onReadFile directive.
 */
$scope.loadFarmData = function ($fileContent) {
    $log.info('$scope.loadFarmData $fileContent..');

    try {
        $scope.farmData = {};
        var farmData = webmapping.load(angular.fromJson($fileContent));

        if (!angular.isDefined(farmData)) {
            $scope.noResult = true;
            return;
        }

        directToSide();
    } catch (e) {
        console.error('farmbuild.webmapping.examples > load: Your file should be in json format: ', e);
        $scope.noResult = true;
    }
};
</pre>

To load farmdata from a local file I am wrinting an AngularJS directives.

Directives are markers on a DOM element (such as an attribute,
element name, comment or CSS class) that tell AngularJS's HTML compiler ($compile) to attach a specified behavior to that DOM element (e.g. via event listeners),
or even to transform the DOM element and its children<br>
visit https://docs.angularjs.org/guide/directive for more information

<pre>
angular.module('farmbuild.webmapping.examples').directive('onReadFile', function ($parse, $log) {
	return {
		restrict: 'A',
		scope: false,
		link: function (scope, element, attrs) {
			var fn = $parse(attrs.onReadFile);

			element.on('change', function (onChangeEvent) {
				//var file =  (onChangeEvent.srcElement || onChangeEvent.target).files[0]
				var file = (onChangeEvent.target).files[0]
				$log.info('onReadFile.onChange... onChangeEvent.srcElement:%s, ' +
					'onChangeEvent.target:%s, (onChangeEvent.srcElement || onChangeEvent.target).files[0]: %s',
					onChangeEvent.srcElement, onChangeEvent.target,
					angular.toJson(file))

				var reader = new FileReader();

				reader.onload = function (onLoadEvent) {
					//console.log('reader.onload', angular.toJson(onLoadEvent));
					scope.$apply(function () {
						fn(scope, {$fileContent: onLoadEvent.target.result});
					});
				};
				reader.onerror = function (onLoadEvent) {
					//console.log('reader.onload', angular.toJson(onLoadEvent));
				};

				reader.readAsText((onChangeEvent.srcElement || onChangeEvent.target).files[0]);
			});
		}
	};
})
</pre>

##Web Maping page
This is the second page of this example where we show the actual map and we will provide some function to do vector editing on map.

###Second HTML page
This page is quite simple. We have couple of more css files to describe the look of the map controls.
We have made these available so you can customise the controls look based on your application.

Here you need to add couple of more JavaScript files:<br>
OpenLayers JS library: `<script src="../../lib/ol/ol.js" type="text/javascript"></script>`<br>
Proj4 JS library(we are using this to convert between projections): `<script src="../../dist/proj4/proj4.js"></script>`<br>
Turf.js(we are using this to do geoprocessing): `<script src="../../dist/turf/turf.min.js"></script>`<br>
Google map api: `<script src="https://maps.google.com/maps/api/js?v=3&amp;sensor=false&libraries=places"></script>`<br>
FarmBuild core library: `<script src="../dist/farmbuild-core.js"></script>`<br> 
FarmBuild farmdata library: `<script src="../dist/farmbuild-farmdata.js"></script>`<br>
FarmBuild webmapping library `<script src="../dist/farmbuild-webmapping.js"></script>`<br>
AngularJS is embedded of FarmBuildCore library, so I dont need to add it.

In this example I am using a bootstarp css grid to create a two column layout.<br>
On the left side I will be showing selected feature and farm attributes and also I am providing buttons for different actions such as: export, apply and clearing session.<br>
```
<div class="col-md-4 col-lg-3"
 style="overflow: auto;display: block;height: 100%;padding-top: 10px;padding-bottom: 10px;">
	<paddock-details ng-include="'paddock-details.tpl.html'"></paddock-details>
	<farm-details ng-include="'farm-details.tpl.html'"></farm-details>
</div>
```
I am putting the map on the right side, and give it more space:
```
<div class="col-md-8 col-lg-9">
	<div id="map" class="map">
	    <input type="text" id="locationAutoComplete" class="address-search addon">
	    <wrapper>
	        <select id="layers" class="farm-layers addon" ng-model="selectedLayer" ng-change="selectLayer()">
	            <option value="">Select Edit Layer</option>
	            <option value="farm">Farm</option>
	            <option value="paddocks">Paddocks</option>
	        </select>
	    </wrapper>
	</div>
	<div id="gmap" class="fill"></div>
	<div id="olmap" class="fill"></div>
</div>
```

The only noticable thing here is I am adding two element to attach my maps to them:

`<div id="gmap" class="fill"></div>`<br>
`<div id="olmap" class="fill"></div>`

Because Google doesn't allow us to directly access their tiles, we need to show google map as a separate layer.<br>
See Paul Spencer's post on the OL3 mailing list for a more complete explanation.<br>
https://groups.google.com/d/msgid/ol3-dev/e35d8f2a-9cd7-4109-b812-c4401c11dd31%40googlegroups.com?utm_medium=email&utm_source=footer

Example of a GMaps map with an ol3 map as control, to give users a Google base map with ol3 content on top.
http://openlayers.org/en/v3.0.0/examples/google-map.html

Google does not permit the use of their tiles outside of their API.
OL2 integrated Google in a way that did not directly contravene this limitation but which was in a grey area.
The Google integration in OL2 was broken several times by changes in the Google API.
In particular, synchronization of animated movement of the Google Map with other OL content became impossible.
The technical burden of supporting direct integration with Google Maps was considered too high for OL3.
Therefore, it is not possible to seamlessly integrate it with OL3 nor will this likely be supported in the future unless Google allows direct access to their tiles (which seems unlikely).
The example you quoted shows one possible way of integrating with Google Maps by injecting OL content into the Google Maps API.
There are some limitations, particularly the problem of synchronizing animations.
Bing, on the other hand, does allow direct access to their tiles and so the Bing content can be integrated directly into OL3.
You'll need to research what the limitations are on Bing tiles - there is some level of free use but it is likely that if you are using them at the level you indicate you will exceed the free use.

###Web Mapping JavaScript
I create another AngularJS controller to contain web mapping functions. I will call it "MapCtrl".<br>
The controller's dependencies are passed as parameters to controller function:<br>
```
.controller('MapCtrl',
		function ($scope, $log, $location, $rootScope, $filter, webmapping) {}))
```

First I will define all required variable. It is a good practice to define all your variables at the top of function block. I am also assigning different webmapping namespaces to local variables to have shorter names when I use them.
```
var dataProjection,

/**  This example is using Web Mercator: EPSG:3857 to display data on google map */
featureProjection = 'EPSG:3857',

/**
 * This is passed to ol.Map on creation to adjust maximum zoom level
 */
maxZoom = 19,

/**
 * In order to create google map we need to pass the container element in DOM
 */
googleMapElement = document.getElementById('gmap'),
googleMap,
olMap,

/**
 * putting different webmapping namespaces in local variables for easier access
 */
actions = webmapping.actions,
measurement = webmapping.measurement,
parcels = webmapping.parcels,
olHelper = webmapping.olHelper,
paddocks = webmapping.paddocks;

$scope.measuredValue = 0;
$scope.farmData = {};
$scope.farmChanged = false;
$scope.paddockChanged = false;
$scope.noResult = $scope.farmLoaded = false;
$scope.selectedLayer = '';
$scope.selectedPaddock = {
	name: '',
	type: '',
	comment: '',
	group: ''
};
$scope.donutDrawing = false;
```

Functions that are not defined on `$scope` variable are internal and therefore only accessed inside this controller.<br>

`createGoogleMap`: Here I create a google map object. Notice that creation of map objects for google map and openLayers map are deliberately outside of api so you can pass customise and pass it to webmapping api.

```
/**  Create google map object, customise the map object as you like. */
function createGoogleMap(type) {
	return new google.maps.Map(googleMapElement, {
		disableDefaultUI: true,
		keyboardShortcuts: false,
		draggable: false,
		disableDoubleClickZoom: true,
		scrollwheel: false,
		streetViewControl: false,
		mapTypeId: type
	})
}
```

`createOpenLayerMap`: Next step is to create OpenLayers map. You can create map object and pass it to api. Here you can use a couple of api helper functions to help you create correct base layers for farm and paddocks and also to do the integration with google map.

```
/** Create openlayers map object, customise the map object as you like. */
function createOpenLayerMap(geoJsons) {

	/** it is recommended to use these helper functions to create your farm and paddocks layers
	 If you are using olHelper.createBaseLayers(), use olHelper.init() to initialise webmapping
	 If you are using olHelper.createBaseLayersWithGoogleMaps(), use olHelper.initWithGoogleMap() to initialise webmapping
	 */
	var farmLayers = olHelper.createFarmLayers(geoJsons, dataProjection),
	//baseLayers = olHelper.createBaseLayers();
		baseLayers = olHelper.createBaseLayersWithGoogleMaps();

	return new ol.Map({
		layers: [baseLayers, farmLayers],
		target: 'olmap',
		keyboardEventTarget: googleMapElement,
		view: new ol.View({
			rotation: 0,
			maxZoom: maxZoom
		}),
		interactions: ol.interaction.defaults({
			altShiftDragRotate: false,
			dragPan: false,
			rotate: false,
			mouseWheelZoom: true
		}).extend([new ol.interaction.DragPan()])
	})
}
```



`loadParcels`: this function uses `webmapping.parcels.load()` to show parcels on map. You need to pass 4 parameter.<br>
In this example I only call loadParcels if the zoom level is more than 14. This is because loaing parcels layer on a big extent can exhaust browser resources.
```
function loadParcels() {
	var parcelsServiceUrl = 'https://farmbuild-wfs-stg.agriculture.vic.gov.au/geoserver/farmbuild/wfs',
		parcelsExtent, extentProjection, responseProjection;

	/**
	 * in this example we use the same projection for extent data and response,
	 * but they can be different based on your application setting.
	 */
	extentProjection = responseProjection = featureProjection;

	if ($scope.selectedLayer === '' || olMap.getView().getZoom() < 14) {
		return;
	}
	parcelsExtent = olMap.getView().calculateExtent(olMap.getSize());
	parcels.load(parcelsServiceUrl, parcelsExtent, extentProjection, responseProjection);
}
```


