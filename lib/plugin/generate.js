var async = require('async')
var path = require('path')
var fs = require('fs')
var _ = require('lodash')
var sql = require('mssql')

var TYPE = require('../../appc').TYPE

module.exports = {
  name: 'MSSQL Database',
  type: TYPE,
  generator: true,
  execute: generate,

  // fields are inquirer.js "questions". There's a bit more
  // functionality, but it's not mandatory. I'll doc soon.
  fields: [
    {
      type: 'input',
      name: 'mssql_server',
      message: 'What is the server (without port or protocol)?',
      default: 'localhost'
    },
    {
      type: 'input',
      name: 'mssql_port',
      message: 'What is the server port?',
      default: 1433
    },
    {
      type: 'input',
      name: 'mssql_user',
      message: 'What is the username?'
    },
    {
      type: 'password',
      name: 'mssql_password',
      message: 'What is the password?'
    },
    {
      type: 'boolean',
      name: 'mssql_encrypt',
      message: 'Should the connection be encrypted?',
      default: true
    }
  ]
}

// opts will contain answers to all field questions
function generate (appc, opts, callback) {
  var connection
  var arrow = appc.arrow
  var inquirer = appc.inquirer
  var request
  var localConfig
  var db
  var tables
  var tempConnector
  var schema
  var config

  async.series([

    function defineConnection (cb) {
      connection = new sql.Connection(localConfig = {
        server: opts.mssql_server,
        port: +opts.mssql_port,
        user: opts.mssql_user,
        password: opts.mssql_password,
        options: {
          encrypt: opts.mssql_encrypt
        }
      }, function defineConnectionCallback (err) {
        if (err) {
          cb(err)
        } else {
          request = new sql.Request(connection)
          cb()
        }
      })
    },

    function enumerateDatabases (cb) {
      request.query('SELECT * FROM sys.databases', function enumerateDatabasesCallback (err, results) {
        if (err) { return cb(err) }
        var databases = _.reject(results, function filterDatabases (r) { return r.name === 'master' })
        var prompts = [
          {
            type: 'list',
            name: 'db',
            message: 'Which database to use?',
            choices: _.map(databases, function mapDatabasesToChoices (n) {
              return { name: n.name, value: n.name }
            })
          }
        ]
        inquirer.prompt(prompts, function (answers) {
          db = answers.db
          cb()
        })
      })
    },

    function selectDatabase (cb) {
      connection = new sql.Connection(localConfig = {
        database: db,
        server: opts.mssql_server,
        port: +opts.mssql_port,
        user: opts.mssql_user,
        password: opts.mssql_password,
        options: {
          encrypt: opts.mssql_encrypt
        }
      }, function selectDatabaseCallback (err) {
        if (err) {
          cb(err)
        } else {
          request = new sql.Request(connection)
          cb()
        }
      })
    },

    function selectTables (cb) {
      request.query('SELECT * FROM sys.tables', function selectTablesCallback (err, _tables) {
        if (err) { return cb(err) }
        var prompts = [
          {
            type: 'checkbox',
            name: 'tables',
            message: 'Which tables to use?',
            choices: _.map(_tables, function mapTableToChoice (n) {
              return { name: n.name, value: n.name, checked: true }
            })
          }
        ]
        inquirer.prompt(prompts, function tablesChosen (answers) {
          tables = answers.tables
          cb()
        })
      })
    },

    function generateGenericConnector (cb) {
      var cli = new arrow.CLI()
      cli.runCommand('new', ['connector'], function connectorGenerated (err, results) {
        if (err) { return cb(err) }
        config = results
        cb()
      })
    },

    function writeOutConfiguration (cb) {
      var local = path.join(config.dir, 'conf', 'local.js')
      localConfig.database = db
      var content = 'module.exports=' + JSON.stringify({ mssql: localConfig }, '\t', 4) + ';'
      fs.writeFile(local, content, cb)
    },

    function connectConnector (cb) {
      tempConnector = new (require('../index').create(arrow))({
        mssql: localConfig
      })
      tempConnector.connect(cb)
    },

    function fetchingSchema (cb) {
      tempConnector.fetchSchema(function schemaFetched (err, result) {
        if (err) { cb(err) } else {
          schema = result
          cb()
        }
      })
    },

    function writeModels (cb) {
      async.eachSeries(tables, function forEachTable (table, done) {
        var fields = {}
        var model = path.join(config.dir, 'models', table.toLowerCase() + '.js')
        var obj = {
          fields: fields,
          connector: config.name,
          metadata: {}
        }

        for (var key in schema.objects[table]) {
          if (schema.objects[table].hasOwnProperty(key) && key !== 'id') {
            var row = schema.objects[table][key]
            var field = {}
            fields[key] = field
            SetFieldType(row, field)
          }
        }

        obj.metadata[config.name] = {
          table: table
        }

        obj.metadata[config.name].primarykey = schema.primary_keys[table]

        var buffer = "var Arrow = require('arrow');\n\n"
        buffer += "var Model = Arrow.Model.extend('" + table + "'," + JSON.stringify(obj, '\t', 4) + ');\n\n'
        buffer += 'module.exports = Model;\n'

        fs.writeFile(model, buffer, done)
      }, cb)
    },

    function writeOutIndexJS (cb) {
      var from = path.join(__dirname, 'index.tjs')
      var to = path.join(config.dir, 'lib', 'index.js')
      var fromBuf = fs.readFileSync(from).toString()
      var toBuf = _.template(fromBuf, config)
      fs.writeFile(to, toBuf, cb)
    },

    function writeOutPackageJSON (cb) {
      var fromPKG = require(path.join(__dirname, '..', '..', 'package.json'))
      var to = path.join(config.dir, 'package.json')
      var toPKG = require(to)
      var ignore = ['inquirer', 'appc-cli-core'] // these packages don't need to be copied since they are used by this plugin

      // TODO: Once this module is published, we can use "'^' + fromPKG.version" instead.
      toPKG.dependencies[fromPKG.name] = 'git+ssh://' + fromPKG.repository.url

      Object.keys(fromPKG.dependencies).forEach(function configureDependencies (name) {
        if (!(name in toPKG.dependencies) && ignore.indexOf(name) === -1) {
          toPKG.dependencies[name] = fromPKG.dependencies[name]
        }
      })

      fs.writeFile(to, JSON.stringify(toPKG, '\t', 4), cb)
    },

    function disconnect (cb) {
      tempConnector.disconnect(function () {
        connection.close()
        cb()
      })
    }

  ], callback)
}

var StringTypeRE = /^(VARCHAR|NULL|STRING|VAR_STRING|CHAR|TEXT|MEDIUMTEXT|BLOB)/i
var NumberTypeRE = /^(DECIMAL|TINY|SHORT|LONG|FLOAT|DOUBLE|NEWDECIMAL|INT24|BIGINT|INT|TINYINT|SMALLINT|MEDIUMINT|BIT)/i
var DateTypeRE = /^(TIMESTAMP|DATE|TIME|DATETIME|YEAR|NEWDATE)/i
var ArrayTypeRE = /^(ENUM|SET)/i
var LengthRE = /\(([\d]+)\)/
var EnumRE = /\((['\w\s,]+)\)/

function SetFieldType (row, field) {
  var type = row.DATA_TYPE

  if (StringTypeRE.test(type)) {
    field.type = 'string'
    SetFieldLength(type, field)
  } else if (NumberTypeRE.test(type)) {
    field.type = 'number'
    SetFieldLength(type, field)
  } else if (DateTypeRE.test(type)) {
    field.type = 'date'
  } else if (ArrayTypeRE.test(type)) {
    field.type = 'array'
    var m = EnumRE.exec(type)
    if (m && m.length > 1) {
      field.values = m[1].replace(/'/g, '').split(',')
    }
  } else {
    console.log('Not sure how to handle field type:', type)
    field.type = 'object'
  }
}

function SetFieldLength (type, field) {
  if (LengthRE.test(type)) {
    var m = LengthRE.exec(type)
    field.maxlength = parseInt(m[1])
  }
}

/*
 exports.DECIMAL     = 0x00; // aka DECIMAL
 exports.TINY        = 0x01; // aka TINYINT, 1 byte
 exports.SHORT       = 0x02; // aka SMALLINT, 2 bytes
 exports.LONG        = 0x03; // aka INT, 4 bytes
 exports.FLOAT       = 0x04; // aka FLOAT, 4-8 bytes
 exports.DOUBLE      = 0x05; // aka DOUBLE, 8 bytes
 exports.NULL        = 0x06; // NULL (used for prepared statements, I think)
 exports.TIMESTAMP   = 0x07; // aka TIMESTAMP
 exports.LONGLONG    = 0x08; // aka BIGINT, 8 bytes
 exports.INT24       = 0x09; // aka MEDIUMINT, 3 bytes
 exports.DATE        = 0x0a; // aka DATE
 exports.TIME        = 0x0b; // aka TIME
 exports.DATETIME    = 0x0c; // aka DATETIME
 exports.YEAR        = 0x0d; // aka YEAR, 1 byte (don't ask)
 exports.NEWDATE     = 0x0e; // aka ?
 exports.VARCHAR     = 0x0f; // aka VARCHAR (?)
 exports.BIT         = 0x10; // aka BIT, 1-8 byte
 exports.NEWDECIMAL  = 0xf6; // aka DECIMAL
 exports.ENUM        = 0xf7; // aka ENUM
 exports.SET         = 0xf8; // aka SET
 exports.TINY_BLOB   = 0xf9; // aka TINYBLOB, TINYTEXT
 exports.MEDIUM_BLOB = 0xfa; // aka MEDIUMBLOB, MEDIUMTEXT
 exports.LONG_BLOB   = 0xfb; // aka LONGBLOG, LONGTEXT
 exports.BLOB        = 0xfc; // aka BLOB, TEXT
 exports.VAR_STRING  = 0xfd; // aka VARCHAR, VARBINARY
 exports.STRING      = 0xfe; // aka CHAR, BINARY
 exports.GEOMETRY    = 0xff; // aka GEOMETRY
 */
