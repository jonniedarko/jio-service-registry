'use strict';
// src http://lukebond.ghost.io/service-discovery-with-etcd-and-node-js/
var pkgjson = require('./package.json'),
	path = require('path'),
	Etcd = require('node-etcd');

var etcd = new Etcd();

function etcdDiscover(name, options, callback) {
	var key = path.join('/', 'services', name);
	etcd.get(key, options, function (err, value) {
		if (err) {
			return callback(err);
		}
		var value = JSON.parse(value.node.value);
		return callback(null, value, etcd.watcher(key));
	});
}

console.log(pkgjson.name + ' is looking for \'myservice\'...');
etcdDiscover('myservice', {wait: true}, function (err, node, watcher) {
	if (err) {
		console.log(err.message);
		process.exit(1);
	}
	console.log(pkgjson.name + ' discovered node: ', node);
	watcher
		.on('change', function (data) {
			console.log('Value changed; new value: ', node);
		})
		.on('expire', function (data) {
			console.log('Value expired.');
		})
		.on('delete', function (data) {
			console.log('Value deleted.');
		});
});