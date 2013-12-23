var Overdrive = require('../vendor/overdrive')
module.exports = function(audioContext, descriptor){

  var overdrive = new Overdrive(audioContext, {
    preBand: descriptor.band || 1.0,
    color: descriptor.color || 4000,
    drive: descriptor.drive != null ? descriptor.drive : 0.8,
    postCut: descriptor.cut || 8000
  })

  return {
    descriptor: descriptor,
    input: overdrive.input,
    output: overdrive.output,
    effect: overdrive,
    connect: connect,
    disconnect: disconnect,
    update: update
  }
}

function update(descriptor){
  if (this.descriptor.band != descriptor.band){
    this.effect.preBand = descriptor.band
  }
  if (this.descriptor.color != descriptor.color){
    this.effect.color = descriptor.color
  }
  if (this.descriptor.drive != descriptor.drive){
    this.effect.drive = descriptor.drive
  }
  if (this.descriptor.cut != descriptor.cut){
    this.effect.postCut = descriptor.cut
  }
  this.descriptor = descriptor
}

function connect(to){
  this.output.connect(to)
}

function disconnect(channel){
  this.output.disconnect(channel)
}