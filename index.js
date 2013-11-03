var Sound = require('./sound')
var ChangeStream = require('./lib/change_stream')

var applyStream = require('./lib/apply_stream')
var mergeInto = require('./lib/merge_into')

var loadSample = require('./lib/load_sample')

////////////////////////////////////////////////


module.exports = function(audioContext){

  var soundbank = audioContext.createGain()

  var activeSounds = {}
  var activeGroups = {}

  var sounds = {}

  applyStream(soundbank, function(event){

    if (Array.isArray(event)){
      event = { // schedule event for immediate playback if not already scheduled
        time: audioContext.currentTime,
        data: event
      }
    }

    if (event.data[2]){
      soundbank.triggerOn(event.data[1], event.time)
    } else {
      soundbank.triggerOff(event.data[1], event.time)
    }

    this.queue(event)
  })

  soundbank.getChangeStream = function(){
    return ChangeStream(soundbank)
  }

  soundbank.update = function(sound){
    Sound.prime(audioContext, sound)
    var currentSound = sounds[sound.id]
    if (currentSound){
      mergeInto(currentSound, sound)
    } else {
      sounds[sound.id] = sound
    }
    soundbank.emit('change', sounds[sound.id])
  }

  soundbank.getSounds = function(){
    return Object.keys(sounds).map(function(id){
      return sounds[id]
    })
  }

  soundbank.triggerOn = function(id, at){
    soundbank.choke(id, at)

    var sound = sounds[id]
    if (sound){
      var player = Sound(audioContext, sound, at)
      player.connect(soundbank)
      activeSounds[id] = player

      if (sound.chokeGroup){
        activeGroups[sound.chokeGroup] = player
      }
    }
  }

  soundbank.triggerOff = function(id, at){
    var player = activeSounds[id]
    if (player){
      player.stop(at)
    }
  }

  soundbank.choke = function(id, at){
    var player = activeSounds[id]
    if (player){
      player.choke(at)
    }

    // choke group
    var sound = sounds[id]
    if (sound && sound.chokeGroup && activeGroups[sound.chokeGroup]){
      activeGroups[sound.chokeGroup].choke(at)
    }
  }

  soundbank.loadSample = function(url, cb){
    var sampleCache = audioContext.sampleCache = audioContext.sampleCache || {}
    loadSample(url, audioContext, function(err, audioData){
      sampleCache[url] = audioData
      cb&&cb(err, audioData)
    })
  }

  return soundbank
}