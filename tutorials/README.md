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

