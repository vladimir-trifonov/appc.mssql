/**
 * Disconnects from your data store.
 * @param next
 */
exports.disconnect = function (next) {
  if (this.connection) {
    this.connection.close()
    this.connection = null
  }
  next()
}
