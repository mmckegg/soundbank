var jsonQuery = require('json-query')

module.exports = function(context, descriptor){
  return jsonQuery(descriptor.path, {rootContext: context.workingParams}).value
}