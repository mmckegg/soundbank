var loadSample = require('../lib/load_sample')


module.exports = function(audioContext, source, at){
  var sampleCache = audioContext.sampleCache || {}

  // load
  var player = audioContext.createBufferSource()
  if (sampleCache[source.url] && sampleCache[source.url] !== true){
    player.buffer = sampleCache[source.url]
  }

  // sample trim
  var offset = source.offsetStart || 0
  player.length = Math.max(0, player.buffer.duration - offset - (source.offsetEnd || 0))

  // loop
  if (source.mode === 'loop'){
    player.loop = true
    player.loopStart = offset
    player.loopEnd = offset + player.length
  }

  if (source.mode === 'oneshot'){
    player.mode = 'oneshot'
  }

  // transpose
  if (source.transpose){
    var rateChange = Math.pow(2, source.transpose / 12)
    player.playbackRate.value = rateChange
    player.length = player.length / rateChange
  }

  player.start(at, offset, player.length)
  return player
}



module.exports.prime = function(audioContext, source, cb){
  var sampleCache = audioContext.sampleCache = audioContext.sampleCache || {}
  if (sampleCache[source.url]){
    cb&&cb()
  } else {
    sampleCache[source.url] = true // mark to show loading
    loadSample(source.url, audioContext, function(err, audioData){
      sampleCache[source.url] = audioData
    })
  }
}

// channel: gain / bus / sends
// envelope: attack / sustain / release
// sound: type=sample / transpose / url / mode / start / end
