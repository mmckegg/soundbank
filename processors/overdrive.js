var InternalOverdrive = require('../vendor/overdrive')

module.exports = Overdrive

function Overdrive(audioContext, descriptor){
  if (!(this instanceof Overdrive)){
    return new Overdrive(audioContext, descriptor)
  }

  var overdrive = new InternalOverdrive(audioContext, {
    preBand: descriptor.band || 1.0,
    color: descriptor.color || 4000,
    drive: descriptor.drive != null ? descriptor.drive : 0.8,
    postCut: descriptor.cut || 8000
  })

  this.descriptor = descriptor
  this.input = overdrive.input
  this.output = overdrive.output
  this._overdrive = overdrive
}

Overdrive.prototype.update = function(descriptor){
  if (this.descriptor.band != descriptor.band){
    this._overdrive.preBand = descriptor.band
  }
  if (this.descriptor.color != descriptor.color){
    this._overdrive.color = descriptor.color
  }
  if (this.descriptor.drive != descriptor.drive){
    this._overdrive.drive = descriptor.drive
  }
  if (this.descriptor.cut != descriptor.cut){
    this._overdrive.postCut = descriptor.cut
  }
  this.descriptor = descriptor
}

Overdrive.prototype.connect = function (to){
  this.output.connect(to)
}

Overdrive.prototype.disconnect = function(channel){
  this.output.disconnect(channel)
}

Overdrive.prototype.destroy = function(){
  this.disconnect()
}