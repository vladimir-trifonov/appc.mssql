exports.getPrimaryKeyColumn = function getPrimaryKeyColumn (Model) {
  var pk = Model.getMeta('primarykey')
  if (pk) {
    return pk
  }
  var name = this.getTableName(Model)
  var tableSchema = this.getTableSchema(Model)
  var primaryKeyColumn = this.metadata.schema.primary_keys[name]
  var column = primaryKeyColumn && tableSchema && tableSchema[primaryKeyColumn]

  if (column && column.COLUMN_NAME) {
    return column && column.COLUMN_NAME
  }
  throw new Error(Model.name + ' does not have a primary key column!')
}
