const test = require('tap').test
const transformRowMethod = require('../../../lib/utility/transformRow').transformRow

test('### transformRow Without Buffer ###', function (t) {
  const row = {
    rid: 22,
    title: 'My Title'
  }

  const response = transformRowMethod('Model', row)

  t.equal(response.rid, 22)
  t.equal(response.title, 'My Title')
  t.ok(response, row)

  t.end()
})

test('### transformRow With Buffer ###', function (t) {
  const row = {
    rid: 22,
    title: new Buffer('My Title')
  }

  const response = transformRowMethod('Model', row)

  t.equal(response.rid, 22)
  t.equal(response.title, '4d79205469746c65')
  t.ok(response, row)

  t.end()
})
