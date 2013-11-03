module.exports = function(url, context, cb){

  if (!/^(([a-z0-9\-]+)?:)|\//.test(url)){
    url = 'filesystem:' + window.location.origin + '/persistent/' + url
  }

  readFileArrayBuffer(url, function(err, data){  if(err)return cb&&cb(err)
    context.decodeAudioData(data, function(buffer){
      cb(null, buffer)
    }, function(err){
      cb(err)
    })
  })
}

function readFileArrayBuffer(url, cb){
  var request = new window.XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    cb(null, request.response)
  }
  request.onerror = cb
  request.send();
}