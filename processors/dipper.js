module.exports = Dipper

function Dipper(audioContext, descriptor){
  if (!(this instanceof Dipper)){
    return new Dipper(audioContext, descriptor)
  }

  this.context = audioContext

  this._dipper = initializeMasterDipper(audioContext)
  this._toDipper = audioContext.createGain()
  this._fromDipper = audioContext.createGain()
  this._dipper.connect(this._fromDipper)

  this.input = audioContext.createGain()
  this.output = audioContext.createGain()

  this.input.connect(this._toDipper)
  this.input.connect(this.output)

  this.update(descriptor)
}

function initializeMasterDipper(context){
  if (!context.globalDipperProcessor){
    context.globalDipperProcessor = context.createScriptProcessor(1024*2, 2, 1)
    var lastValue = 0
    var targetValue = 0

    context.globalDipperProcessor.onaudioprocess = function(e){

      var inputLength = e.inputBuffer.length
      var outputLength = e.inputBuffer.length
      var inputL = e.inputBuffer.getChannelData(0)
      var inputR = e.inputBuffer.getChannelData(1)
      var output = e.outputBuffer.getChannelData(0)

      var rms = 0;
      targetValue = 0

      for (var i=0;i<inputLength;i++){
        targetValue += (Math.abs(inputL[i]) + Math.abs(inputR[i])) / 2
      }

      targetValue = (targetValue / inputLength) * 2

      for (var i=0;i<outputLength;i++){
        var difference = lastValue - targetValue
        if (difference > 0){
          lastValue = lastValue - difference * 0.001 // release
        } else {
          lastValue = lastValue - difference * 0.001 // attack
        }
        output[i] = Math.max(-1, -lastValue)
      }

    }

    var pump = context.createGain()
    pump.gain.value = 0
    pump.connect(context.destination)
    context.globalDipperProcessor.connect(pump)

  }
  return context.globalDipperProcessor
}

Dipper.prototype.sync = function(at){
  //this._modulators.sync(at)
}

Dipper.prototype.connect = function(to){
  this.output.connect(to)
}

Dipper.prototype.disconnect = function(){
  this.output.disconnect()
}

Dipper.prototype.destroy = function(){
  this.disconnect()
  //this._modulators.stop(0)
}

Dipper.prototype.update = function(descriptor){

  if (!this.descriptor || this.descriptor.mode != descriptor.mode){
    if (descriptor.mode === 'trigger'){
      this._fromDipper.disconnect()
      this._toDipper.connect(this._dipper)
    } else {
     this._toDipper.disconnect()
     this._fromDipper.connect(this.output.gain)
    }
  }

  if (!this.descriptor || this.descriptor.ratio != descriptor.ratio){
    this._fromDipper.gain.value = descriptor.ratio != null ? descriptor.ratio : 1
    this._toDipper.gain.value = descriptor.ratio != null ? descriptor.ratio : 1
  }

  this.descriptor = descriptor
}