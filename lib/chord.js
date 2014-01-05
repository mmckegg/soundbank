var teoria = require('teoria')

module.exports = function(chordName, root, offset){
  var rootNote = typeof root === 'number' ? teoria.note.fromMIDI(root) : teoria.note(root)
  var notes = rootNote.chord(chordName).notes()
  if (offset != null){
    var position = offset % notes.length
    var multiplier = Math.floor(offset/notes.length)
    return getMIDI(notes[position]) + (multiplier*12)
  } else {
    return notes.map(getMIDI)
  }
}

function getMIDI(note){
  return note.key() + 20
}

