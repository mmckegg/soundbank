var getReferences = require('./get_references')

module.exports = function(){

  var slotReferences = {}
  var slotReferenceLookup = {}

  return {
    update: function(descriptor){
      var oldReferences = slotReferences[descriptor.id] || []
      var newReferences = getReferences(descriptor)
      
      var remove = diff(oldReferences, newReferences)
      var add = diff(newReferences, oldReferences)

      for (var i=0;i<add.length;i++){
        slotReferenceLookup[add[i]] = slotReferenceLookup[add[i]] || {}
        slotReferenceLookup[add[i]][descriptor.id] = true
      }

      for (var i=0;i<remove.length;i++){
        slotReferenceLookup[remove[i]] && delete slotReferenceLookup[remove[i]][descriptor.id]
      }

      slotReferences[descriptor.id] = newReferences
    },
    lookup: function(id){
      return slotReferenceLookup[id] && Object.keys(slotReferenceLookup[id]) || []
    }
  }
}


function diff(ary1, ary2){
  return ary1.filter(function(i) {return !(ary2.indexOf(i) > -1);});
}