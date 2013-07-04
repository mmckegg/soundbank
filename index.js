var EventEmitter = require('events').EventEmitter

module.exports = function(audioContext){

  var masterNode = audioContext.createGain()
  masterNode.events = new EventEmitter()

  var sounds = {}
  var busses = {}

  var activeEnvelopes = {}
  var active = {}
  var groupActive = {}


  masterNode.on = function(event, cb){
    return masterNode.events.on(event, cb)
  }

  masterNode.addSound = function(id, sound){
    var sound = mergeClone(sound, {
      soundbank: masterNode,
      id: id
    })
    sounds[id] = sound
    masterNode.events.emit('change', id)
    return sound
  }


  masterNode.addBus = function(id, bus){
    busses[id] = mergeClone(bus, {
      id: id,
      soundbank: masterNode
    })
    if (bus.output){
      bus.output.connect(masterNode)
    }
  }

  masterNode.removeSound = function(id){
    var sound = sounds[id]
    sound.soundbank = null
    sound.id = null
    sounds[id] = null
    masterNode.events.emit('change', id)
    return sound
  }

  masterNode.getSound = function(id){
    return sounds[id]
  }

  masterNode.getSounds = function(){
    var result = []
    Object.keys(sounds).forEach(function(id){
      if (sounds[id]){
        result.push(sounds[id])
      }
    })
    return result
  }

  masterNode.getBusses = function(){
    var result = []
    Object.keys(busses).forEach(function(id){
      if (busses[id]){
        result.push(busses[id])
      }
    })
    return result
  }


  masterNode.choke = function(at, id, release){
    at = at || audioContext.currentTime

    release = release || 0.01
    var player = active[id]
    var envelope = activeEnvelopes[id]
    if (player){
      if (player.playbackState !== player.FINISHED_STATE){
        envelope.gain.setValueAtTime(envelope.gain.value, at)
        envelope.gain.linearRampToValueAtTime(0, at+release)
        player.stop(at+release)
      }
      active[id] = null
      activeEnvelopes[id] = null
    }
  }

  masterNode.chokeGroup = function(at, groupId){
    at = at || audioContext.currentTime

    var activeId = groupActive[groupId]
    if (activeId){
      masterNode.choke(at, activeId)
      groupActive[groupId] = null
    }
  }

  window.offsetTime = 0

  masterNode.triggerOff = function(at, id){
    var sound = sounds[id]
    if (sound && (sound.mode === 'hold' || sound.mode === 'loop')){
      masterNode.choke(at, id, sound.release)
    }
  }

  masterNode.refresh = function(id){
    var sound = sounds[id]
    var player = active[id]
    var envelope = activeEnvelopes[id]
    if (player){
      var offset = sound.offsetStart || 0
      var length = Math.max(0, sound.buffer.duration - offset - (sound.offsetEnd || 0))
      if (sound.transpose){
        var rateChange = Math.pow(2, sound.transpose / 12)
        player.playbackRate.value = rateChange
      }
      if (sound.mode === 'loop'){
        player.loop = true
        player.loopStart = offset
        player.loopEnd = offset + length
      } else {
        player.loop = false
      }
      if (sound.gain){
        player.gain.value = sound.gain != null ? sound.gain : 1
      }
    }
  }

  masterNode.trigger = function(at, id){
    at = at || audioContext.currentTime

    var sound = sounds[id]
    if (sound){

      // load
      var player = audioContext.createBufferSource()
      player.buffer = sound.buffer

      // sample trim
      var offset = sound.offsetStart || 0
      var length = Math.max(0, sound.buffer.duration - offset - (sound.offsetEnd || 0))

      // loop
      if (sound.mode === 'loop'){
        player.loop = true
        player.loopStart = offset
        player.loopEnd = offset + length
      }

      // transpose
      if (sound.transpose){
        var rateChange = Math.pow(2, sound.transpose / 12)
        player.playbackRate.value = rateChange
        length = length / rateChange
      }

      // envelope
      var attack = sound.attack || 0.01
      var release = sound.release || 0.01
      var gain = sound.gain != null ? sound.gain : 1

      player.gain.value = gain

      var envelope = audioContext.createGain()
      envelope.gain.setValueAtTime(0, at)
      envelope.gain.linearRampToValueAtTime(1, at+attack)
      if (sound.mode !== 'loop'){
        envelope.gain.setValueAtTime(1, at+length-0.01)
        envelope.gain.linearRampToValueAtTime(0, at+length)
      }

      var bus = busses[sound.busId]

      if (bus && bus.input){
        envelope.connect(bus.input)
      } else {
        envelope.connect(masterNode)
      }

      // output
      player.connect(envelope)
      player.start(at, offset, length)

      // sound choke
      masterNode.choke(at, id)
      if (sound.chokeGroup){
        masterNode.chokeGroup(sound.chokeGroup)
        groupActive[sound.chokeGroup] = id
      }

      activeEnvelopes[id] = envelope
      active[id] = player
    }
  }

  return masterNode
}

function mergeClone(){
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