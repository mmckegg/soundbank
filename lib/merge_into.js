var mergeInto = module.exports = function(original, changed, options){

  var removedItems = []
  var addedItems = []

  var preserveKeys = options && options.preserveKeys || []
  var removeUnused = !options || !options.extend

  var newKeys = Object.keys(changed)
  var originalLength = Array.isArray(original) && original.length

  newKeys.forEach(function(key){
    // only update actual attributes - ignore meta attributes
    if (!isMeta(key)){
      if (original[key] !== changed[key]){
        if ((original[key] instanceof Object) && (changed[key] instanceof Object)){
          // recursive update
          var result = mergeInto(original[key], changed[key])
          result.addedItems.forEach(function(item){
            addedItems.push(item)
          })
          result.removedItems.forEach(function(item){
            removedItems.push(item)
          })
        } else {
          original[key] = changed[key]
          
          // for handling element sources that are strings/numbers rather than objects
          if (original.$proxy && original.$proxy[key]){
            original.$proxy[key].value = changed[key]
          }
          
        }
      }
    }

  })

  if (Array.isArray(original)){
    for (var i=changed.length;i<original.length;i++){
      if (original.$proxy && original.$proxy[i]){
        removedItems.push({collection: original, item: original.$proxy[i], index: i})
      } else {
        removedItems.push({collection: original, item: original[i], index: i})
      }
    }
    for (var i=originalLength;i<changed.length;i++){
      addedItems.push({collection: original, item: original[i], index: i})
    }
    
    // remove unused keys
    // truncate to length of new array
    original.length = changed.length
    if (original.$proxy){
      original.$proxy.length = changed.length
    }
  } else if (removeUnused) {
    Object.keys(original).filter(function(key){
      return !isMeta(key) && (!~newKeys.indexOf(key)) && (!~preserveKeys.indexOf(key))
    }).forEach(function(key){
      delete original[key]
    })
  }

  return {removedItems: removedItems, addedItems: addedItems}
}

function isMeta (key){
  return (typeof key === 'string' && key.charAt(0) === '$')
}