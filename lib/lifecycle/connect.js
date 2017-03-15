var sql = require('mssql')

/**
 * Connects to your data store; this connection can later be used by your connector's methods.
 * @param next
 */
exports.connect = function (next) {
  this.connection = new sql.Connection(this.config, function (err) {
    if (err) {
      next(err)
    } else {
      next()
    }
  })
}
