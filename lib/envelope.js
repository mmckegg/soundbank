module.exports = function(audioContext, envelope, at){
  var node = audioContext.createGain()

  envelope = envelope || []

  node.attack = envelope[0] || 0.01
  node.release = envelope[1] || 0.01

  node.gain.setValueAtTime(0, at)
  node.gain.linearRampToValueAtTime(1, at+node.attack)

  node.stop = stop
  node.choke = choke

  node.update = update

  return node
}

function update(envelope){
  this.release = envelope && envelope[1] || 0.01
}

function stop(at){
  this.gain.setValueAtTime(1, at)
  this.gain.linearRampToValueAtTime(0, at+this.release)
}

function choke(at, release){
  var release = release || 0.01
  this.gain.setValueAtTime(1, at)
  this.gain.linearRampToValueAtTime(0, at+release)
}