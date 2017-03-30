var sql = require('mssql')
var async = require('async')

/**
 * Fetches the schema for your connector.
 *
 * For example, your schema could look something like this:
 * {
 *     objects: {
 *         person: {
 *             first_name: {
 *                 type: 'string',
 *                 required: true
 *             },
 *             last_name: {
 *                 type: 'string',
 *                 required: false
 *             },
 *             age: {
 *                 type: 'number',
 *                 required: false
 *             }
 *         }
 *     }
 * }
 *
 * @param next
 * @returns {*}
 */
exports.fetchSchema = function (next) {
  var self = this
  this.logger.debug('fetchSchema')

  var schema = {
    objects: {},
    database: this.config.database,
    primary_keys: {},
    identity_columns: {}
  }
  var request = new sql.Request(self.connection)

  request.input('catalog', sql.VarChar, self.config.database)

  async.series([
    function fetchPrimaryKeys (next) {
      var query = 'SELECT DISTINCT Col.TABLE_NAME, Col.COLUMN_NAME ' +
        'FROM' +
        ' INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab, ' +
        ' INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE Col ' +
        'WHERE ' +
        ' Col.CONSTRAINT_NAME = Tab.CONSTRAINT_NAME' +
        ' AND Col.TABLE_NAME = Tab.TABLE_NAME' +
        ' AND Tab.CONSTRAINT_TYPE = \'PRIMARY KEY\'' +
        ' AND Col.CONSTRAINT_CATALOG = @catalog'
      request.query(query, function (err, results) {
        if (err) { return next(err) }
        results.forEach(function (result) {
          schema.primary_keys[result.TABLE_NAME] = result.COLUMN_NAME
        })
        next()
      })
    },
    function fetchColumns (next) {
      var query = 'SELECT' +
        ' c.TABLE_NAME, c.COLUMN_NAME, c.IS_NULLABLE, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH,' +
        ' c.NUMERIC_PRECISION, c.NUMERIC_PRECISION_RADIX, c.NUMERIC_SCALE, c.DATETIME_PRECISION ' +
        'FROM' +
        ' INFORMATION_SCHEMA.COLUMNS c ' +
        'WHERE' +
        ' c.table_catalog = @catalog'
      request.query(query, function (err, results) {
        if (err) { return next(err) }
        results.forEach(function resultCallback (result) {
          var entry = schema.objects[result.TABLE_NAME]
          if (!entry) {
            entry = schema.objects[result.TABLE_NAME] = {}
          }
          entry[result.COLUMN_NAME] = result
        })
        next()
      })
    },
    function fetchIdentityColumns (next) {
      var query = 'SELECT' +
        ' o.name AS TABLE_NAME, c.name AS COLUMN_NAME ' +
        'FROM' +
        ' sys.objects o inner join sys.columns c on o.object_id = c.object_id ' +
        'WHERE' +
        ' c.is_identity = 1'
      request.query(query, function (err, results) {
        if (err) { return next(err) }
        results.forEach(function (result) {
          schema.identity_columns[result.TABLE_NAME] = result.COLUMN_NAME
        })
        next()
      })
    }
  ], function () {
    next(null, schema)
  })
}
