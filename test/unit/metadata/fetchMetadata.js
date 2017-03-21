const test = require('tap').test
const server = require('./../../server.js')
const sinon = require('sinon')
const fetchMedataData = require('../../../lib/metadata/fetchMetadata').fetchMetadata
var ARROW
var CONNECTOR

test('### Start Arrow ###', function (t) {
  server()
    .then((inst) => {
      ARROW = inst
      CONNECTOR = ARROW.getConnector('appc.mssql')
      t.ok(ARROW, 'Arrow has been started')
      t.end()
    })
    .catch((err) => {
      t.threw(err)
    })
})

test('### fetchMetadata ###', function (t) {
  const cb = function () { }
  const cbSpy = sinon.spy(cb)

  fetchMedataData.bind(CONNECTOR, cbSpy)()
  const fields = cbSpy.args[0][1].fields

  t.ok(cbSpy.calledOnce)

  t.equal(fields[0].name, 'server')
  t.ok(fields[0].required)

  t.equal(fields[1].name, 'user')
  t.ok(fields[1].required)

  t.equal(fields[2].name, 'password')
  t.equal(fields[2].subtype, 'password')
  t.notOk(fields[2].required)

  t.equal(fields[3].name, 'port')
  t.equal(fields[3].subtype, 'integer')
  t.notOk(fields[3].required)
  t.equal(fields[3].default, 1433)

  t.equal(fields[4].name, 'database')
  t.ok(fields[4].required)

  t.equal(fields[5].name, 'connectionTimeout')
  t.equal(fields[5].subtype, 'integer')
  t.notOk(fields[5].required)
  t.equal(fields[5].default, 15000)

  t.equal(fields[6].name, 'requestTimeout')
  t.equal(fields[6].subtype, 'integer')
  t.notOk(fields[6].required)
  t.equal(fields[6].default, 15000)

  t.end()
})

test('### Stop Arrow ###', function (t) {
  ARROW.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
