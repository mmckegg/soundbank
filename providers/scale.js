var teoria = require('teoria')

module.exports = function(context, descriptor){
  var scale = descriptor.scale || 'major'
  var root = descriptor.root || 'C'
  var offset = (descriptor.offset || 0) + (context.params.offset || 0)
  return getNote(scale, root, offset)
}

function getNote(scaleName, root, offset){
  var rootNote = typeof root === 'number' ? teoria.note.fromMIDI(root) : teoria.note(root)
  var scale = rootNote.scale(scaleName)
  var length = scale.scale.length
  var position = mod(offset, length)
  var multiplier = Math.floor(offset/length)
  return getMIDI(scale.get(position + 1)) + (multiplier*12)
}

function getMIDI(note){
  return note.key() + 20
}

function mod(n, m) {
  return ((n%m)+m)%m
}