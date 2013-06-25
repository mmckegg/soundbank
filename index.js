var EventEmitter = require('events').EventEmitter

module.exports = function(audioContext){

  var masterNode = audioContext.createGain()
  masterNode.events = new EventEmitter()

  var sounds = {}

  var activeEnvelopes = {}
  var active = {}
  var groupActive = {}

  function time(plus){
    if (plus){
      return audioContext.currentTime + plus
    } else {
      return audioContext.currentTime
    }
  }

  masterNode.on = function(event, cb){
    return masterNode.events.on(event, cb)
  }

  masterNode.addSound = function(id, sound){
    // should probably clone sound at this point
    sound.soundbank = masterNode
    sound.id = id
    sounds[id] = sound
    masterNode.events.emit('change', id)
    return sound
  }

  masterNode.getSound = function(id){
    return sounds[id]
  }

  masterNode.choke = function(id, release){
    release = release || 0.01
    var player = active[id]
    var envelope = activeEnvelopes[id]
    if (player){
      if (player.playbackState !== player.FINISHED_STATE){
        envelope.gain.setValueAtTime(envelope.gain.value, time())
        envelope.gain.linearRampToValueAtTime(0, time(release))
        player.stop(time(release))
      }
      active[id] = null
      activeEnvelopes[id] = null
    }
  }

  masterNode.chokeGroup = function(groupId){
    var activeId = groupActive[groupId]
    if (activeId){
      masterNode.choke(activeId)
      groupActive[groupId] = null
    }
  }

  window.offsetTime = 0

  masterNode.triggerOff = function(id){
    var sound = sounds[id]
    if (sound && (sound.mode === 'hold' || sound.mode === 'loop')){
      masterNode.choke(id, sound.release)
    }
  }

  masterNode.refresh = function(id){
    var sound = sounds[id]
    var player = active[id]
    var envelope = active[id]
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
        envelope.gain.value = sound.gain
      }
    }
  }

  masterNode.trigger = function(id){
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
      var envelope = audioContext.createGain()
      envelope.gain.setValueAtTime(0, time())
      envelope.gain.linearRampToValueAtTime(gain, time(attack))
      if (sound.mode !== 'loop'){
        envelope.gain.setValueAtTime(gain, time(length-0.01))
        envelope.gain.linearRampToValueAtTime(0, time(length))
      }
      envelope.connect(masterNode)

      // output
      player.connect(envelope)
      player.start(0, offset, length)

      // sound choke
      masterNode.choke(id)
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