var Envelope = require('../lib/envelope')

module.exports = Oscillator

function Oscillator(audioContext, descriptor, at){
  if (!(this instanceof Oscillator)) return new Oscillator(audioContext, descriptor, at)

  // descriptor: pitch, shape
  var oscillator = audioContext.createOscillator()
  oscillator.detune.value = (descriptor.pitch - 69) * 100

  if (descriptor.shape){
    oscillator.type = descriptor.shape
  }

  var vibe = this._vibe = {
    sine: audioContext.createOscillator(),
    amp: audioContext.createGain()
  }

  vibe.sine.start(at)
  vibe.sine.frequency.value = descriptor.vibrato[0] || 1
  vibe.amp.gain.value = descriptor.vibrato[1] || 0
  vibe.sine.connect(vibe.amp)
  vibe.amp.connect(oscillator.frequency)

  oscillator.start(at)

  this.player = oscillator
  this.envelope = Envelope(audioContext, descriptor.envelope, at)
  this.descriptor = descriptor
  this.output = this.envelope

  oscillator.connect(this.envelope)
}

Oscillator.prototype.triggerOff = function(at){
  if (!this.stopped){
    this.player.stop(at+this.envelope.release)
    this.envelope.stop(at)
    this.stopped = true
  }
}

Oscillator.prototype.choke = function(at){
  if (!this.stopped){
    this.player.stop(at+0.01)
    this.envelope.choke(at)
    this.stopped = true
  }
}

Oscillator.prototype.update = function(descriptor){
  this.envelope.update(descriptor.envelope)

  // update transpose
  if (descriptor.pitch !== this.descriptor.pitch){
    this.player.detune.value = (descriptor.pitch - 69) * 100
  }

  var oldVibe = this.descriptor.vibrato || [1, 0]
  var newVibe = descriptor.vibrato || [1, 0]

  if (oldVibe[0] != newVibe[0]){
    this._vibe.sine.frequency.value = newVibe[0]
  }
  if (oldVibe[1] != newVibe[1]){
    this._vibe.amp.gain.value = newVibe[1]
  }

  if (descriptor.shape !== this.descriptor.shape){
    this.player.type = descriptor.shape
  }

  this.descriptor = descriptor
}

Oscillator.prototype.connect = function(to){
  this.output.connect(to)
}

Oscillator.prototype.disconnect = function(channel){
  this.output.disconnect(channel)
}