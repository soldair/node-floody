
var through = require('through');

module.exports = function(options){
  options = options||{};

  var em
  , writes = []
  , buf = []
  , bufLen = 0
  , lastWrite = 0
  , interval = options.interval||100
  , maxBufferLen = options.maxBufferLen||10240
  , windowSize = options.windowSize||50
  ;

  // so for floody to be helpful in some contexts i need the meta data associated with every write
  // instead of providing a fs style write callback interface when floody writes
  var write = function(data,meta){

    em.stats.requestedWrites++;
    // just got a write save the time between last write and this.
    var now = Date.now();
    writes.push(now); 

    // write events are emitted with an array of data from all of the writes combined into one.
    if(meta) em.data.push(meta);

    if(writes.length > windowSize) writes.shift();

    data = data instanceof Buffer ? data : new Buffer(data);
    bufLen += data.length;

    buf.push(data);

    if(em.shouldWrite()) em._write();

  };

  em = through(function(){},function(){
    clearInterval(this._polling);
  });

  em.write = function(data,meta){
    write(data,meta)
    return !this.paused;
  } 

  em.lastFlush = Date.now();
  em.data = [];
  em.stats = {bytes:0,requestedWrites:0,writes:0};

  em.shouldWrite = function(){ 
    if(!bufLen) return false;

    var now = Date.now();
    if(now-em.lastFlush >= interval) return true;
    if(bufLen > maxBufferLen && maxBufferLen > -1) return true;

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

  em._write = function() {
    var metaData = this.data;
    this.data = [];
    this.stats.writes++;

    buf = em._concat(buf);

    this.emit('data',buf);
    if(metaData.length) em.emit('write',metaData,bufLen);
    em.stats.bytes += bufLen; 

    buf = [];
    bufLen = 0;
    this.lastFlush = Date.now();
  };

  em._polling = setInterval(function(){
    if(em.shouldWrite()) em._write();
  },interval);

  // 0.6 doesnt have Buffer.concat
  em._concat = Buffer.concat||function(buffers){
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
