var Envelope = require('./lib/envelope')

var sources = {
  'sample': require('./sources/sample'),
  'oscillator': require('./sources/oscillator'),
  'multi': function(audioContext, source, at){
    // source: pitch, shape
    var multi = audioContext.createGain()

    multi.players = []

    source.sounds && source.sounds.forEach(function(sound){
      var player = Sound(audioContext, sound, at)
      player.connect(multi)
      multi.players.push(player)
    })

    multi.stop = stopMulti
    multi.choke = chokeMulti

    return multi
  }
}

sources.multi.prime = function(audioContext, sound, cb){
  sound.sounds && forEach(sound.sounds, function(s, next){
    Sound.prime(audioContext, s, next)
  }, cb)
}

var Sound = module.exports = function(audioContext, sound, at){
  var player = audioContext.createGain()

  player.gain.value = sound.gain != null ? sound.gain : 1

  player.envelope = Envelope(audioContext, sound.envelope, at)
  player.envelope.connect(player)

  if (sound.source && sources[sound.source.type]){
    player.source = sources[sound.source.type](audioContext, sound.source, at)
    if (player.source.maxLength){
      var release = player.envelope.release || 0
      player.envelope.stop(at + player.source.maxLength - release)
    }
    player.source.connect(player.envelope)
  }

  player.stop = stop
  player.choke = choke

  return player
}

module.exports.prime = function(audioContext, sound, cb){
  if (sound.source && sources[sound.source.type] && sources[sound.source.type].prime){
    sources[sound.source.type].prime(audioContext, sound.source, cb)
  }
}

function choke(at){
  if (this.envelope && this.source && this.source.playbackState !== this.source.FINISHED_STATE){
    this.source.stop(at+0.01)
  }
}

function stop(at){
  if (this.source && this.envelope && !this.source.oneshot){
    if (!this.source.playbackState || this.source.playbackState !== this.source.FINISHED_STATE){
      var release = this.envelope.release || 0
      this.envelope.stop(at)
      this.source.stop(at+release)
    }
  }
}

function stopMulti(at){
  console.log('stop multi')
  this.players.forEach(function(player){
    player.stop(at)
  })
}

function chokeMulti(at){
  this.players.forEach(function(player){
    player.choke(at)
  })
}

function forEach(array, fn, cb){
  var i = -1
  function next(err){
    if (err) return cb&&cb(err)
    i += 1
    if (i<array.length){
      fn(array[i], next, i)
    } else {
      cb&&cb(null)
    }
  }
  next()
}