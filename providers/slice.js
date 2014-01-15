module.exports = function(context, descriptor){
  var steps = descriptor.steps || 4
  var step = descriptor.step != null ? descriptor.step : (context.params.offset || 0)
  var trim = descriptor.trim || [0, 1]
  var length = (trim[1] - trim[0]) / steps
  var start = trim[0] + (step * length)
  return [start, start+length]
}