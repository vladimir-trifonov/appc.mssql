const test = require('tap').test
const convertDataTypeToJSType = require('../../../lib/utility/convertDataTypeToJSType').convertDataTypeToJSType

test('### Test convertDataTypeToJSType success case ###', function (t) {
  var dataTypes = {
    tinyint: 'Number',
    smallint: 'Number',
    mediumint: 'Number',
    bigint: 'Number',
    int: 'Number',
    integer: 'Number',
    float: 'Number',
    bit: 'Number',
    double: 'Number',
    binary: 'Number',
    timestamp: 'String',
    date: 'Date',
    datetime: 'Date',
    time: 'Date',
    year: 'Date',
    someOtherType: 'String'
  }

  Object.keys(dataTypes).forEach(function (key, index) {
    var dataType = convertDataTypeToJSType(key)
    t.equals(dataType.name, dataTypes[key])
  })

  t.end()
})
