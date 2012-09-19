var test = require('tap').test;
var floody = require(__dirname+'/../index.js');

test('can use floody',function(t){
  var fakeStreamWriteCount= 0;
  var fakeStream = {
    write:function(buf,cb){
      fakeStreamWriteCount++;
      if(cb) cb(null,buf.length);
    }
  };

  var flood = floody(fakeStream,{interval:10});
  process.nextTick(function(){
    flood.write('a',{data:Date.now()});
    flood.write('a',{data:Date.now()});

    process.nextTick(function(){
      flood.write('a',{data:Date.now()});
    });
  });

  var b = 0;
  flood.on('write',function(data,bytes){
    b += bytes;
    if(b < 3) return;

    t.equals(flood.stats.requestedWrites,3,'requested 3 writes');
    t.equals(flood.stats.writes,2,'should have written twice');
    t.equals(flood.stats.bytes,1,'should have written one byte');

    flood.stop();

    t.end();
  });

});
