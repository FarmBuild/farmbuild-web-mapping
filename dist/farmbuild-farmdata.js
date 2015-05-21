"use strict";

angular.module("farmbuild.farmdata", [ "farmbuild.core" ]);

window.farmbuild.farmdata = {};

angular.injector([ "ng", "farmbuild.farmdata" ]);

"use strict";

angular.module("farmbuild.farmdata").factory("farmdata", function(farmdataSession, farmdataValidator, validations) {
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
    farmdata.create = function(name) {
        return create(name);
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

angular.module("farmbuild.farmdata").factory("farmdataSession", function($log, farmdataValidator, validations) {
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
    return farmdataSession;
});

"use strict";

angular.module("farmbuild.core").factory("farmdataValidator", function(validations, $log) {
    var farmdataValidator = {}, _isDefined = validations.isDefined, _isArray = validations.isArray, _isPositiveNumber = validations.isPositiveNumber, _isEmpty = validations.isEmpty, _isObject = validations.isObject, _isString = validations.isString;
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
        if (!farmData.hasOwnProperty("name") || !_isString(farmData.name) || _isEmpty(farmData.name)) {
            $log.error("farmData must have a name property and cannot be empty.");
            return false;
        }
        return true;
    }
    farmdataValidator.validate = _validate;
    return farmdataValidator;
});

"use strict";