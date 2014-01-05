module.exports = function(object){
  var target = []
  addRefs(object, target)
  return target
}

var matcher = /get\(([^\),]*)\)/g

function addRefs(object, target){
  if (Array.isArray(object)){
    object.forEach(function(x){
      addRefs(x, target)
    })
  } else if (object instanceof Object) {
    if (object.$){
      object.$.replace(matcher, function(_, ref){
        target.push(JSON.parse(ref))
      })
    } else {
      var res = {}
      Object.keys(object).forEach(function(key){
        addRefs(object[key], target)
      })
      return res
    }
  } else {
    return object
  }
}