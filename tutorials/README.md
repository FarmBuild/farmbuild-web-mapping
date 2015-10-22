#Web Mapping with FarmBuild Web Mapping API (Tutorial)

In this tutorial I will walk you through FarmBuild Web Mapping API to give you some ideas on how you can utilise it in your applications.<br/>
I start off by describing FarmBuild Web Mapping main components and I will continue with creating a complete web mapping example.<br/>
The example is part of farmbuild-web-mapping github repository.<br/>
<a href="https://github.com/FarmBuild/farmbuild-web-mapping/tree/master/examples">https://github.com/FarmBuild/farmbuild-web-mapping/tree/master/examples</a>

Web Mapping is using OpenLayers library. so you need to have a good understanding of OpenLayers to use these APIs.

#Understanding API

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

#Getting Started ...

In this example I wil be using AngularJS to create the client-side application and that is all we need for now.

#First things first

First of all we need to define our application in AngularJS terms.
The "index.js" file in the root of examples contains the application definition.

`angular.module('farmbuild.webmapping.examples', ['farmbuild.webmapping'])`

"farmbuild.webmapping.examples" is the application's name and we are defining "farmbuild.webmapping" as a dependency.

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

#Create a new farmdata from scratch
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

#Load an existing farmdata
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
