module.exports = function applyProviders(context, descriptor){
  var stack = []

  var providers = context.providers || {}
  var result = JSON.parse(JSON.stringify(descriptor))

  var depth = 0

  stack.push({root: true})

  // make the current state available to providers
  context.params = result

  while (stack.length){
    depth += 1
    var next = stack.pop()
    var value = next.root ? result : next.object[next.key]
    if (value instanceof Object && providers[value.node]){
      var provider = providers[value.node]
      value = provider(context, value)
      if (next.root){
        result = value
        context.params = result
      } else {
        next.object[next.key] = value
      }
      stack.unshift(next)
    }

    if (value instanceof Object){
      var keys = Object.keys(value).reverse()
      for (var i=0;i<keys.length;i++){
        var key = keys[i]
        if (value[key] instanceof Object){
          stack.push({object: value, key: key})
        }
      }
    }

    if (depth > 255){
      break
    }

  }

  return result
}