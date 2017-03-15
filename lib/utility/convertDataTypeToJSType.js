exports.convertDataTypeToJSType = function convertDataTypeToJSType (dataType) {
  switch (dataType) {
    case 'tinyint':
    case 'smallint':
    case 'mediumint':
    case 'bigint':
    case 'int':
    case 'integer':
    case 'float':
    case 'bit':
    case 'double':
    case 'binary':
      return Number
    case 'timestamp':
      return String
    case 'date':
    case 'datetime':
    case 'time':
    case 'year':
      return Date
    default:
      return String
  }
}
