var _ = require('lodash')
var Arrow = require('arrow')
var sql = require('mssql')

/**
 * Queries for particular model records.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {ArrowQueryOptions} options Query options.
 * @param {Function} callback Callback passed an Error object (or null if successful) and the model records.
 * @throws {Error} Failed to parse query options.
 */
exports.query = function (Model, options, callback) {
  // TODO: Parse through this for potential SQL injection attacks.
  var self = this
  var key
  var table = this.getTableName(Model)
  var primaryKeyColumn = this.getPrimaryKeyColumn(Model)
  var keys = primaryKeyColumn
  var whereQuery = ''
  var pagingQuery = ''
  var orderQuery = ''

  var request = new sql.Request(this.connection)

  var sel = Model.translateKeysForPayload(options.sel)
  var unsel = Model.translateKeysForPayload(options.unsel)
  if (sel) {
    keys += ', ' + _.keys(_.omit(sel, primaryKeyColumn)).join(', ')
  } else if (unsel) {
    keys += ', ' + _.keys(_.omit(_.omit(this.getTableSchema(Model), primaryKeyColumn), _.keys(unsel))).join(', ')
  } else {
    keys = '*'
  }

  var where = Model.translateKeysForPayload(options.where)
  if (where && Object.keys(where).length > 0) {
    whereQuery = ' WHERE'
    for (key in where) {
      if (where.hasOwnProperty(key)) {
        whereQuery += ' ' + key
        if (where[key] && where[key].$like) {
          whereQuery += ' LIKE'
          where[key] = where[key].$like
        } else {
          whereQuery += ' ='
        }
        whereQuery += ' @' + key
      }
    }
    this.addValuesToSQLRequest(Model, where, request, false)
  }

  if (typeof options.order === 'string') {
    options.order = options.order
      .split(',')
      .reduce(function (res, prop) {
        res[prop] = 1
        return res
      }, {})
  }

  var order = Model.translateKeysForPayload(options.order)

  if (order && Object.keys(order).length > 0) {
    orderQuery = ' ORDER BY'
    for (key in order) {
      if (order.hasOwnProperty(key)) {
        orderQuery += ' ' + key + ' '
        if (order[key] === 1) {
          orderQuery += 'ASC'
        } else {
          orderQuery += 'DESC'
        }
        orderQuery += ','
      }
    }
    if (orderQuery[orderQuery.length - 1] === ',') {
      orderQuery = orderQuery.slice(0, -1)
    }
  }

  var query = 'SELECT'
  if (options.skip) {
    if (!orderQuery) {
      orderQuery = ' ORDER BY ' + primaryKeyColumn + ' ASC'
    }
    pagingQuery += ' OFFSET ' + (+options.skip) + ' ROWS'
    pagingQuery += ' FETCH NEXT ' + (+options.limit) + ' ROWS ONLY'
  } else {
    query += ' TOP ' + (+options.limit || 1000)
  }

  query += ' ' + keys + ' FROM ' + table + whereQuery + orderQuery + pagingQuery
  this.logger.debug('query query:', query)
  this.logger.debug('query query values:', where)
  request.query(query, function queryQueryCallback (err, results) {
    if (err) {
      self.logger.trace('query error:', err)
      return callback(err)
    }
    if (results) {
      var rows = []
      for (var i = 0; i < results.length; i++) {
        var row = results[i]
        var instance = Model.instance(self.transformRow(Model, row), true)
        if (primaryKeyColumn) { instance.setPrimaryKey(row[primaryKeyColumn]) }
        rows.push(instance)
      }
      self.logger.trace('query results:', rows)
      return callback(null, new Arrow.Collection(Model, rows))
    } else {
      self.logger.trace('query results:', 'none')
      callback()
    }
  })
}
