"use strict";

angular.module("farmbuild.farmdata", [ "farmbuild.core" ]);

window.farmbuild.farmdata = {};

angular.injector([ "ng", "farmbuild.farmdata" ]);

"use strict";

angular.module("farmbuild.farmdata").factory("farmdata", function($log, farmdataSession, farmdataValidator, validations) {
    var farmdata = {
        session: farmdataSession,
        validator: farmdataValidator
    }, isEmpty = validations.isEmpty, defaults = {
        id: "" + new Date().getTime(),
        name: "My new farm",
        geometry: {
            type: "Polygon",
            crs: "EPSG:4283",
            coordinates: []
        }
    }, create = function(name, id) {
        return {
            version: 1,
            dateCreated: new Date(),
            dateLastUpdated: new Date(),
            id: isEmpty(id) ? defaults.id : id,
            name: isEmpty(name) ? defaults.name : name,
            geometry: angular.copy(defaults.geometry),
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
    farmdata.create = function(name, id) {
        return create(name, id);
    };
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
        a.id = "downloadFarmData";
        document.body.appendChild(a);
        angular.element("a#downloadFarmData").attr({
            download: name,
            href: "data:application/json;charset=utf8," + encodeURIComponent(JSON.stringify(farmData, undefined, 2))
        }).get(0).click();
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

"use strict";