/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria.
 
 * @author State of Victoria
 * @version 1.0.0
 */

'use strict';

angular.module('farmbuild.webmapping')
	.factory('webMappingPrint',
		function ($log, $http, $q, farmdata, validations, farmdataConverter) {
			
			var _isDefined = validations.isDefined, _isEmpty = validations.isEmpty,
				_baseLayers = [{
					name: 'Google Satellite',
					value: 'GOOGLE_SATELLITE'
				},{
					name: 'Google Street',
					value: 'GOOGLE_STREET'
				},{
					name: 'VicMap Satellite',
					value: 'VICMAP_SATELLITE'
				},{
					name: 'VicMap Street',
					value: 'VICMAP_STREET'
				}];
			
			
			function _validate(extent, baseMap, title, showPaddocksLabel, includePaddocksTable) {
				
				var result = {
					valid: true,
					errors: []
				};
				
				if (_isEmpty(extent)) {
					$log.error('Webmapping map print: Please pass a valid value for map extent to print the map!');
					result.valid = false;
					result.errors.push('Extent value is empty!');
				}
				
				if (_isEmpty(baseMap)) {
					$log.error('Webmapping map print: Please pass a valid value for baseMap to print the map!');
					result.valid = false;
					result.errors.push('Base Map value is empty!');
				}
				
				if (_isEmpty(title)) {
					$log.error('Webmapping map print: Please pass a valid value for title to print the map!');
					result.valid = false;
					result.errors.push('Title value is empty!');
				}
				
				if (_isEmpty(showPaddocksLabel)) {
					$log.error('Webmapping map print: Please pass a valid value for showPaddocksLabel to print the map!');
					result.valid = false;
					result.errors.push('Show Paddocks Label must be true or false!');
				}
				
				if (_isEmpty(includePaddocksTable)) {
					$log.error('Webmapping map print: Please pass a valid includePaddocksTable to print the map!');
					result.valid = false;
					result.errors.push('Include Paddocks Table must be true or false!');
				}
				
				return result;
			}
			
			function _print(farmData, extent, baseMap, title, showPaddocksLabel, includePaddocksTable, width, height, dpi) {
				$log.info('Map print requested ...', farmData, extent, baseMap, title, showPaddocksLabel, includePaddocksTable, width, height, dpi);
				var deferred = $q.defer(),
					validationResult = _validate(extent, baseMap, title, showPaddocksLabel, includePaddocksTable), webMappingConfigs = angular.fromJson(sessionStorage.webMappingConfigs), printUrl = webMappingConfigs.printUrl;
				
				if (!validationResult.valid) {
					deferred.reject(validationResult.errors);
				}
				
				if (_isEmpty(width)) {
					width = 512;
				}
				
				if (_isEmpty(height)) {
					height = 512;
				}
				
				if (_isEmpty(dpi)) {
					dpi = 96;
				}
				
				if (!farmdata.validate(farmData)) {
					deferred.reject('Invalid farm data!');
				}
				
				$log.info('printUrl', printUrl);
				
				$http.post(printUrl, {
					farmData: farmdataConverter.toGeoJson(farmData),
					extent: extent,
					baseMap: baseMap,
					title: title,
					showPaddocksLabel: showPaddocksLabel,
					includePaddocksTable: includePaddocksTable,
					width: width,
					height: height,
					dpi: dpi
				}, {
					cache: false
				}).then(function (response) {
					deferred.resolve(response.data);
				}, function (response) {
					deferred.reject(['Calling map service failed with this error: ' + response.statusText + '(' + response.status + ')']);
				});
				
				return deferred.promise;
				
			}
			
			return {
				print: _print,
				baseLayers: _baseLayers
			};
			
		});
