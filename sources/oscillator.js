var Modulators = require('../lib/modulators')
module.exports = Oscillator

function Oscillator(audioContext, descriptor, at){
  if (!(this instanceof Oscillator)) return new Oscillator(audioContext, descriptor, at)

  this.context = audioContext
  this._modulators = Modulators(audioContext)
  this._osc = audioContext.createOscillator()
  this._amp = audioContext.createGain()
  this._osc.connect(this._amp)

  this.output = this._amp

  this.update(descriptor)

  this._osc.start(at)
  this._modulators.start(at)
}

Oscillator.prototype.triggerOff = function(at){
  if (!this.stopped){
    this._osc.stop(this._modulators.stop(at))
    this.stopped = true
    return true
  }
}

Oscillator.prototype.choke = function(at){
  if (!this.stopped){
    this._osc.stop(this._modulators.choke(at))
    this.stopped = true
    return true
  }
}

Oscillator.prototype.update = function(descriptor){

  // roll off amp with frequency increase
  var ampRolloff = (Math.exp((descriptor.note||0)/127)-1) * 0.5
  var amp = JSON.parse(JSON.stringify(descriptor.amp != null ? descriptor.amp : 1))
  if (amp instanceof Object){
    amp.value = amp.value - (ampRolloff*amp.value)
  } else if (typeof amp == 'number'){
    amp = amp - (ampRolloff*amp)
  }

  if (!this.descriptor || descriptor.note !== this.descriptor.note){
    this._modulators.apply(this._osc.detune, descriptor.note, getCentsFromNote)
  }

  if (!this.descriptor || descriptor.amp !== this.descriptor.amp || descriptor.note !== this.descriptor.note){
    this._modulators.apply(this._amp.gain, amp, 0.6)
  }

  if (!this.descriptor || descriptor.frequency !== this.descriptor.frequency){
    this._modulators.apply(this._osc.frequency, descriptor.frequency, 440)
  }

  if (!this.descriptor || descriptor.shape !== this.descriptor.shape){
    this._osc.type = descriptor.shape || 'sine'
  }

  this.descriptor = descriptor
}

Oscillator.prototype.connect = function(to){
  this.output.connect(to)
}

Oscillator.prototype.disconnect = function(channel){
  this.output.disconnect(channel)
}

function getCentsFromNote(note){
  note = note != null ? note : 72
  return (note - 69) * 100
}