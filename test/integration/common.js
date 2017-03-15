var should = require('should')
var Arrow = require('arrow')
var server = new Arrow()
var log = server && server.logger || Arrow.createLogger({}, { name: 'MSSQL TEST' })

exports.Arrow = Arrow
exports.server = server
exports.log = log

before(function before(next) {
  exports.connector = server.getConnector('appc.mssql')
  server.start(next)
})

after(function after(next) {
  server.stop(next)
})
