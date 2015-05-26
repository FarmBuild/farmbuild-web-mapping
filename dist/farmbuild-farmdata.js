"use strict";

angular.module("farmbuild.farmdata", [ "farmbuild.core" ]);

window.farmbuild.farmdata = {};

angular.injector([ "ng", "farmbuild.farmdata" ]);

"use strict";

angular.module("farmbuild.farmdata").factory("farmdata", function($log, farmdataSession, farmdataValidator, crsSupported, validations) {
    var farmdata = {
        session: farmdataSession,
        validator: farmdataValidator,
        crsSupported: crsSupported
    }, isEmpty = validations.isEmpty, defaults = {
        id: "" + new Date().getTime(),
        name: "My new farm",
        geometry: {
            type: "Polygon",
            crs: crsSupported[0].name,
            coordinates: []
        }
    }, geometry = function(projectionName) {
        var g = angular.copy(defaults.geometry);
        g.crs = !isEmpty(projectionName) ? projectionName : g.crs;
        return g;
    }, create = function(name, id, projectionName) {
        return {
            version: 1,
            dateCreated: new Date(),
            dateLastUpdated: new Date(),
            id: isEmpty(id) ? defaults.id : id,
            name: isEmpty(name) ? defaults.name : name,
            geometry: geometry(projectionName),
            paddocks: [],
            area: 0,
            areaUnit: "hectare"
        };
    };
    farmdata.defaultValues = function() {
        return angular.copy(defaults);
    };
    farmdata.isFarmData = function(farmData) {
        return farmdataValidator.validate(farmData);
    };
    farmdata.validate = function(farmData) {
        return farmdataValidator.validate(farmData);
    };
    farmdata.create = create;
    farmdata.load = farmdataSession.load;
    farmdata.find = farmdataSession.find;
    farmdata.save = function(farmData) {
        return farmdataSession.save(farmData).find();
    };
    farmdata.update = function(farmData) {
        return farmdataSession.update(farmData).find();
    };
    window.farmbuild.farmdata = farmdata;
    return farmdata;
});

angular.module("farmbuild.farmdata").constant("crsSupported", [ {
    label: "GDA 94 Geographics: EPSG:4283",
    name: "EPSG:4283",
    projection: "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs"
}, {
    label: "WGS 84 Geographics: EPSG:4326",
    name: "EPSG:4326",
    projection: "+proj=longlat +datum=WGS84 +no_defs"
}, {
    label: "Web Mercator: EPSG:3857",
    name: "EPSG:3857",
    projection: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"
}, {
    label: "VicGrid 94: EPSG:3111",
    name: "EPSG:3111",
    projection: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"
}, {
    label: "NSW Lamberts: EPSG:3308",
    name: "EPSG:3308",
    projection: "+proj=lcc +lat_1=-30.75 +lat_2=-35.75 +lat_0=-33.25 +lon_0=147 +x_0=9300000 +y_0=4500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
}, {
    label: "SA Lamberts: EPSG:3107",
    name: "EPSG:3107",
    projection: "+proj=lcc +lat_1=-28 +lat_2=-36 +lat_0=-32 +lon_0=135 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
}, {
    label: "Australian Albers: EPSG:3577",
    name: "EPSG:3577",
    projection: "+proj=aea +lat_1=-18 +lat_2=-36 +lat_0=0 +lon_0=132 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
} ]);

"use strict";

angular.module("farmbuild.farmdata").factory("farmdataSession", function($log, $filter, farmdataValidator, validations) {
    var farmdataSession = {}, isDefined = validations.isDefined;
    farmdataSession.clear = function() {
        sessionStorage.clear();
        return farmdataSession;
    };
    farmdataSession.save = function(farmData) {
        $log.info("saving farmData");
        if (!farmdataValidator.validate(farmData)) {
            $log.error("Unable to save farmData... it is invalid");
            return farmdataSession;
        }
        sessionStorage.setItem("farmData", angular.toJson(farmData));
        return farmdataSession;
    };
    farmdataSession.update = function(farmData) {
        $log.info("update farmData");
        farmData.dateLastUpdated = new Date();
        farmdataSession.save(farmData);
        return farmdataSession;
    };
    farmdataSession.find = function() {
        var json = sessionStorage.getItem("farmData");
        if (json === null) {
            return undefined;
        }
        return angular.fromJson(json);
    };
    farmdataSession.load = function(farmData) {
        if (!farmdataValidator.validate(farmData)) {
            $log.error("Unable to load farmData... it is invalid");
            return undefined;
        }
        return farmdataSession.save(farmData).find();
    };
    farmdataSession.export = function(document, farmData) {
        var a = document.createElement("a"), name = "farmdata-" + farmData.name.replace(/\W+/g, "") + "-" + $filter("date")(new Date(), "yyyyMMddHHmmss") + ".json";
        a.id = "downloadFarmData123456";
        document.body.appendChild(a);
        angular.element(a).attr({
            download: name,
            href: "data:application/json;charset=utf8," + encodeURIComponent(JSON.stringify(farmData, undefined, 2))
        });
        a.click();
    };
    farmdataSession.isLoadFlagSet = function(location) {
        var load = false;
        if (location.href.split("?").length > 1 && location.href.split("?")[1].indexOf("load") === 0) {
            load = location.href.split("?")[1].split("=")[1] === "true";
        }
        return load;
    };
    farmdataSession.setLoadFlag = function(location) {
        var path = farmdataSession.clearLoadFlag(location);
        return path + "?load=true";
    };
    farmdataSession.clearLoadFlag = function(location) {
        var path = location.href.toString(), path = path.substring(0, path.indexOf("?"));
        return path;
    };
    return farmdataSession;
});

"use strict";

"use strict";

angular.module("farmbuild.core").factory("farmdataValidator", function(validations, $log) {
    var farmdataValidator = {}, _isDefined = validations.isDefined, _isArray = validations.isArray, _isPositiveNumber = validations.isPositiveNumber, _isPositiveNumberOrZero = validations.isPositiveNumberOrZero, _isEmpty = validations.isEmpty, _isObject = validations.isObject, _isString = validations.isString, areaUnitDefault = "hectare";
    function errorLog() {}
    function _validate(farmData) {
        $log.info("validating farmData...");
        if (!_isDefined(farmData)) {
            $log.error("farmData is undefined.");
            return false;
        }
        if (!_isObject(farmData)) {
            $log.error("farmData must be a javascript Object.");
            return false;
        }
        if (!farmData.hasOwnProperty("name") || !_isString(farmData.name) || _isEmpty(farmData.name) || !_isDefined(farmData.area) || !_isPositiveNumberOrZero(farmData.area) || !angular.equals(farmData.areaUnit, areaUnitDefault)) {
            $log.error("farmData must have name, area (positve number or zero) and areaUnit (must be " + areaUnitDefault + "): %j", farmData);
            return false;
        }
        return true;
    }
    farmdataValidator.validate = _validate;
    return farmdataValidator;
});