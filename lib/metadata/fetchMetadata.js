var Arrow = require('arrow')

/**
 * Fetches metadata describing your connector's proper configuration.
 * @param next
 */
exports.fetchMetadata = function fetchMetadata (next) {
  next(null, {
    fields: [
      Arrow.Metadata.Text({
        name: 'server',
        description: 'MSSQL Server URL',
        required: true
      }),
      Arrow.Metadata.Text({
        name: 'user',
        description: 'MSSQL User Name',
        required: true
      }),
      Arrow.Metadata.Password({
        name: 'password',
        description: 'MSSQL Password',
        required: false
      }),
      Arrow.Metadata.Integer({
        name: 'port',
        description: 'MSSQL Port',
        required: false,
        'default': 1433
      }),
      Arrow.Metadata.Text({
        name: 'database',
        description: 'MSSQL Database Name',
        required: true
      }),
      Arrow.Metadata.Integer({
        name: 'connectionTimeout',
        description: 'MSSQL Connection Timeout in MS',
        required: false,
        'default': 15000
      }),
      Arrow.Metadata.Integer({
        name: 'requestTimeout',
        description: 'MSSQL Request Timeout in MS',
        required: false,
        'default': 15000
      })
    ]
  })
}
