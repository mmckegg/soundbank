module.exports = function(audioContext, source, at){
  // source: pitch, shape
  var oscillator = audioContext.createOscillator()
  oscillator.frequency.value = getFrequency(source.pitch)

  if (source.shape){
    oscillator.type = source.shape
  }

  oscillator.start(at)
  return oscillator
}

function getFrequency(id){
  return 440 * Math.pow(2, (id - 69.0) / 12.0)
}