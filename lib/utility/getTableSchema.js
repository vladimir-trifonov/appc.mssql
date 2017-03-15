exports.getTableSchema = function getTableSchema (Model) {
  var name = this.getTableName(Model)
  return this.metadata.schema.objects[name]
}
