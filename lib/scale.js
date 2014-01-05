var teoria = require('teoria')

module.exports = function(scaleName, root, offset){
  var rootNote = typeof root === 'number' ? teoria.note.fromMIDI(root) : teoria.note(root)
  var scale = rootNote.scale(scaleName)
  var length = scale.scale.length
  var position = offset % length
  var multiplier = Math.floor(offset/length)
  return getMIDI(scale.get(position + 1)) + (multiplier*12)
}

function getMIDI(note){
  return note.key() + 20
}