var EventEmitter = require('events').EventEmitter;

module.exports = function(stream,options){
  var em = new EventEmitter()
  , writes = []
  , buf = []
  , bufLen = 0
  , lastWrite = 0
  ;
  options = options||{};

  var interval = options.interval||100;
  var maxBufferLen = options.maxBufferLen||10240;

  em.lastFlush = Date.now();
  em.stream = stream;
  em.data = [];
  em.stats = {bytes:0,requestedWrites:0,writes:0};
  em.write = function(value,data){
    this.stats.requestedWrites++;
    // just got a write save the time between last write and this.
    var now = Date.now();
    writes.push(now); 

    // write events are emitted with an array of data from all of the writes combined into one.
    em.data.push(data);

    if(writes.length > 50) writes.shift();

    value = value instanceof Buffer ? value : new Buffer(value);
    bufLen += value.length;

    buf.push(value);

    if(this.shouldWrite()) this._write();
  };

  em.shouldWrite = function(){ 
    if(!bufLen) return false;

    var now = Date.now();
    if(now-em.lastFlush >= interval) return true;
    if(bufLen > maxBufferLen) return true;

    // is the next write probably going to happen within the interval?
    if(writes && writes.length) {
      // first write should just be written.
      if(writes.length == 1) return true;

      var sum = 0;
      writes.forEach(function(d,k){ if(k-1 > 0) sum += d-writes[k-1]; });

      var nextWrite = (sum/writes.length);
      if((now+nextWrite)-em.lastFlush > interval) {
        return true;
      }
    }
  };

  em._write = function(){
    var resData = this.data;
    this.data = [];
    var bl = bufLen;
    this.stats.writes++;


    if(Buffer.concat) buf = Buffer.concat(buf);
    else buf = em._concat(buf);

    this.stream.write(buf,function(){
      em.emit('write',resData,bl);
      em.stats.bytes += bufLen;
    });

    buf = [];
    bufLen = 0;
    this.lastFlush = Date.now();
  };

  em.end = em.stop = function(){
    clearInterval(this._polling);
    this.emit('end');
  };

  em._polling = setInterval(function(){
    if(em.shouldWrite()) em._write();
  },interval);

  // 0.6 doesnt have Buffer.concat
  em._concat = function(buffers){
      var len = 0;
      buffers.forEach(function(b,k){
        if(!(b instanceof Buffer)) b = new Buffer(''+b);
        len += b.length;
        buffers[k] = b;
      });
      combinedBuf = new Buffer(len);
      var added = 0;
      buffers.forEach(function(b){
        b.copy(combinedBuf,added);
        added += b.length;
      }); 
      return combinedBuf;
  };

  return em;
};
