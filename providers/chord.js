var teoria = require('teoria')

module.exports = function(context, descriptor){
  var chord = descriptor.chord || 'major'
  var root = descriptor.root || 'C'
  var offset = (descriptor.offset || 0) + (context.params.offset || 0)
  return getNotes(chord, root, offset)
}

function getNotes(chordName, root, offset){
  var rootNote = typeof root === 'number' ? teoria.note.fromMIDI(root) : teoria.note(root)
  var notes = rootNote.chord(chordName).notes()
  return notes.map(function(note){
    return note.key() + 20 + (offset || 0)
  })
}

