var should = require('should'),
	Arrow = require('arrow'),
	server = new Arrow(),
	log = server && server.logger || Arrow.createLogger({}, {name: 'MSSQL TEST'});

exports.Arrow = Arrow;
exports.server = server;
exports.log = log;

before(function before(next) {
	exports.connector = server.getConnector('appc.mssql');
	server.start(next);
});

after(function after(next) {
	server.stop(next);
});
