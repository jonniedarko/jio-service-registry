'use strict';
// example based on http://lukebond.ghost.io/service-discovery-with-etcd-and-node-js/

var path = require('path');
// requires passport
var Etcd = require('node-etcd');
var q = require('q');
var TTL = 60 * 60;
var etcd;
var services;// = [];

function discoverService(name, options, cb) {
	var deferred = q.defer();
	var key = name;//path.join('/', 'services', name);
	etcd.get(key, options, function (err, value) {
		if (err || !value) {
			console.log('err', err)
			if (!services.indexOf(name) > -1) {
				services.splice(services.indexOf(name), 1);
			}
			var err = err || 'service not available';
			deferred.reject(err);
		} else {
			console.log('value', value)
			var value = JSON.parse(value.node.value);
			console.log('name', name, typeof name, 'services.indexOf(name)', services.indexOf(name));
			if (services.indexOf(name) == -1) {
				console.log('pushing ', name)
				services.push(name);
			}
			deferred.resolve({value: value, watcher: etcd.watcher(key)});
		}
	});
	return deferred.promise;
}

function registerService(name, info) {
	etcd.set(name, JSON.stringify(info), {ttl:TTL}, console.log);

	setTimeout(function(){
		registerService(name, info);
	}, 5000);
	return name;
}

function checkService(service){
	console.log('services', services, '-', service);
	console.log('services.indexOf('+service+')', services.indexOf(service));
	return services.indexOf(service) > -1;

}
/*
function temp(){
	services = [];
	etcd = new Etcd();//configure
	discoverService('myservice', {wait: false})
		.then(function (service){
			service.watcher
				.on('change', function (data) {
					console.log('Value changed; new value: ', service.value, data);
				})
				.on('expire', function (data) {
					console.log('Value expired.');
				})
				.on('delete', function (data) {
					console.log('Value deleted.');
				});
		})
		.catch(function (err){
			console.log(err.message);
			process.exit(1);
		})
}
temp();*/


module.exports = function (configure) {
	services = [];
	etcd = new Etcd(configure);
	return {
		registerService: registerService,
		discoverService: discoverService,
		checkService: checkService
	};
}
