module.exports = Modulators

function Modulators(audioContext){
  if (!(this instanceof Modulators)) return new Modulators(audioContext)
  this.context = audioContext
  this._started = false
  this.activeModulators = []
}

Modulators.prototype.apply = function(target, descriptor, defaultOrValueHandler){
  if (descriptor && descriptor instanceof Object){
    if (descriptor.value){
      target.value = getValue(descriptor.value, defaultOrValueHandler)
    }
    if (target.currentModulator && target.currentModulator.descriptor.type === descriptor.type){
      target.currentModulator.update(descriptor)
    } else {
      removeModulator(this, target)
      var ctor = this.context.modulators[descriptor.type]
      if (ctor){
        target.currentModulator = ctor(this.context, descriptor, target)
        this.activeModulators.push(target.currentModulator)
        if (this._started){
          target.currentModulator.start(0)
        }
      }
    }
  } else {
    removeModulator(this, target)
    target.value = getValue(descriptor, defaultOrValueHandler)
  }
}

Modulators.prototype.start = function(at){
  if (!this._started){
    for (var i=0;i<this.activeModulators.length;i++){
      var modulator = this.activeModulators[i]
      modulator.start(at)
    }
    this._started = true
    return true
  }
}

Modulators.prototype.sync = function(at){
  if (this._started && !this._stopped){
    for (var i=0;i<this.activeModulators.length;i++){
      var modulator = this.activeModulators[i]
      modulator.sync && modulator.sync(at)
    }
    return true
  }
}

Modulators.prototype.stop = function(at){
  var stopAt = at
  if (this._started && !this._stopped){
    for (var i=0;i<this.activeModulators.length;i++){
      var modulator = this.activeModulators[i]
      var res = modulator.stop(at)
      if (res > stopAt){
        stopAt = res
      }
    }
    this._stopped = true
  }
  return stopAt
}

Modulators.prototype.choke = function(at){
  var stopAt = at
  for (var i=0;i<this.activeModulators.length;i++){
    var modulator = this.activeModulators[i]
    var res = modulator.choke ? modulator.choke(at) : modulator.stop(at)
    if (res && res > stopAt){
      stopAt = res
    }
  }
  return stopAt
}

function removeModulator(modulators, target){
  if (target.currentModulator){
    var index = modulators.activeModulators.indexOf(target.currentModulator)
    if (~index){
      modulators.activeModulators.splice(index, 1)
    }
    target.currentModulator.disconnect()
    target.currentModulator = null
  }
}


function getValue(value, handler){
  if (handler != null){
    if (typeof handler === 'function'){
      return handler(value)
    } else {
      return value != null ? value : handler
    }
  } else {
    return value
  }
}