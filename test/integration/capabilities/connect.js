exports.connect = {
  goodConfig: require('../../../conf/local').connectors['appc.mssql'],
  badConfig: {
    user: 'a-bad-user',
    password: 'and-a-bad-password',
    server: 'a-bad-database-url.database.windows.net',
    port: 1433,
    database: 'a-bad-db-name',

    generateModelsFromSchema: true,
    modelAutogen: true,

    options: {
      encrypt: true
    }
  }
}
