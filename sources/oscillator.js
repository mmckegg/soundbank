module.exports = function(audioContext, source, at){
  // source: pitch, shape
  var oscillator = audioContext.createOscillator()
  oscillator.detune.value = (source.pitch - 69) * 100

  if (source.shape){
    oscillator.type = source.shape
  }

  if (source.vibrato){ // [freq, amp]
    var sine = audioContext.createOscillator()
    var amp = audioContext.createGain()
    sine.start(at)
    sine.frequency.value = source.vibrato[0] || 1
    amp.gain.value = source.vibrato[1] || 0
    sine.connect(amp)
    amp.connect(oscillator.frequency)
  }

  oscillator.start(at)
  return oscillator
}