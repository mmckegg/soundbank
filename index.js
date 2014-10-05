var ActiveList = require('./lib/active_list')
var SlotReferences = require('./lib/slot_references')

var slotTypes = {
  default: require('audio-slot'),
  modulator: require('audio-slot/modulator')
}

var createMeddler = require('audio-meddle')

var applyProviders = require('./lib/apply_providers')
var applyEmitter = require('./lib/apply_emitter')
var IAC = require('inheritable-audio-context')

////////////////////////////////////////////////


module.exports = function(parentAudioContext){

  var audioContext = IAC(parentAudioContext, true)

  var soundbank = audioContext.createGain()
  soundbank._context = audioContext

  var output = audioContext.createGain()
  var meddler = createMeddler(audioContext)

  audioContext.inputs = {
    'meddler': meddler
  }


  meddler.connect(output)
  output.connect(soundbank)

  // turn the AudioNode into an EventEmitter
  applyEmitter(soundbank)

  var activeGroups = ActiveList()

  var slots = soundbank._slots = {}
  var descriptors = {}
  var resolvedDescriptors = {}
  var slotReferences = SlotReferences()

  soundbank.update = function(descriptor){
    descriptors[descriptor.id] = descriptor
    refreshSlot(descriptor.id)
    slotReferences.lookup(descriptor.id).forEach(refreshSlot)
    soundbank.emit('change', descriptors[descriptor.id])
  }

  soundbank.remove = function(id){
    var descriptor = descriptors[id] = {id: id, _deleted: true}
    refreshSlot(descriptor.id)
    slotReferences.lookup(descriptor.id).forEach(refreshSlot)
    ;delete descriptors[descriptor.id]
    soundbank.emit('change', descriptor)
  }

  soundbank.getDescriptor = function(id){
    return descriptors[id] || {id: String(id)}
  }

  soundbank.getDescriptors = function(){
    return Object.keys(descriptors).map(function(id){
      return descriptors[id]
    })
  }

  soundbank.triggerOn = function(id, at){
    at = at || audioContext.currentTime
    soundbank.choke(id, at)

    var slot = slots[id]
    if (slot){

      if (slot.chokeGroup){
        activeGroups.set(slot.chokeGroup, slot, at)
      }

      slot.triggerOn(at)

      var descriptor = resolvedDescriptors[id]
      if (descriptor.inputMode === 'meddler'){
        meddler.start(descriptor.id, at)
      }

    }
  }

  soundbank.triggerOff = function(id, at){
    at = at || audioContext.currentTime
    var slot = slots[id]
    if (slot){
      slot.triggerOff(at)
      meddler.stop(id, at)
    }
  }

  soundbank.choke = function(id, at){
    at = at || audioContext.currentTime
    var slot = slots[id]
    if (slot){
      slot.choke(at)
    }
    // choke group
    var groupSlot = slot && slot.chokeGroup && activeGroups.get(slot.chokeGroup, at)
    if (groupSlot){
      activeGroups.remove(slot.chokeGroup, at)
      groupSlot.choke(at)
    }
  }

  function refreshSlot(id){

    var oldDescriptor = resolvedDescriptors[id] || {}
    var descriptor = descriptors[id]
    var slot = slots[id]
    var ctor = slotTypes[descriptor.node] || slotTypes['default']

    if (descriptor._deleted){
      ctor = null
    }

    var context = IAC(audioContext)
    context.params = descriptor
    context.descriptors = descriptors
    context.slotReferences = []

    descriptor = applyProviders(context, descriptor)
    slotReferences.update(id, context.slotReferences)

    // update existing slot
    if (slot){
      if (!ctor || !(slot instanceof ctor)){

        if (audioContext.inputs[id]){
          audioContext.inputs[id].disconnect()
        }

        slot.update({})
        slot.disconnect()
        slot = slots[id] = null
        meddler.remove(id)

      } else {

        if (oldDescriptor.output != descriptor.output || oldDescriptor.inputMode != descriptor.inputMode){
          updateOutput(slot, descriptor)
        }

        slot.update(descriptor)

      }
    } 

    // create new slot
    if (!slot && ctor) {
      slot = slots[id] = ctor(audioContext, descriptor)

      if (audioContext.inputs[id] && slot.input){
        audioContext.inputs[id].connect(slot.input)
      }

      updateOutput(slot, descriptor)
      meddler.add(id, slot)
    }

    // emit with providers
    resolvedDescriptors[id] = descriptor
    soundbank.emit('refresh', descriptor)
  }

  function getSlotDescriptor(id){
    return descriptors[id]
  }

  function updateOutput(slot, descriptor){
    slot.disconnect()
    if (descriptor.inputMode === 'meddler'){
      // do nothing, output will be patched on trigger
    } else if (!('output' in descriptor) || descriptor.output === true || descriptor.output == ''){
      slot.connect(output)
    } else if (Array.isArray(descriptor.output)){
      descriptor.output.forEach(function(output){
        slot.connect(getInput(output))
      })
    } else if (typeof descriptor.output === 'string'){
      slot.connect(getInput(descriptor.output))
    }
  }

  function getInput(id){
    if (!audioContext.inputs[id]){
      audioContext.inputs[id] = audioContext.createGain()

      var slot = slots[id]
      if (slot && slot.input){
        audioContext.inputs[id].connect(slot.input)
      }

    }
    return audioContext.inputs[id]
  }

  return soundbank
}

function merge(){
  var result = {}
  for (var i=0;i<arguments.length;i++){
    var obj = arguments[i]
    if (obj){
      Object.keys(obj).forEach(function(key){
        result[key] = obj[key]
      })
    }
  }
  return result
}