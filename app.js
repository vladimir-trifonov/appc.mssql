/**
 * NOTE: This file is simply for testing this connector and will not
 * be used or packaged with the actual connector when published.
 */
var Arrow = require('arrow')
var server = new Arrow()

var Post = Arrow.createModel('post', {
  fields: {
    title: { type: String },
    content: { type: String }
  },
  connector: 'appc.mssql',
  metadata: {
    'appc.mssql': {
      table: 'TEST_Post'
    }
  }
})
server.addModel(Post)

server.start()
