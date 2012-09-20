var test = require('tap').test;
var floody = require(__dirname+'/../index.js');


test('can use floody',function(t){
  var fakeStreamWriteCount= 0;
  var written = '';
  var fakeStream = {
    write:function(buf,cb){
      fakeStreamWriteCount++;
      written += buf.toString();
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
    t.equals(data.length ,2,'should have data values');
    t.ok(data[1].data,'should have date key in data object i set');
    t.equals(written,'aaa','fake stream should not destroy written data');
    
    flood.stop();

    t.end();
  });

});

test('0.6 concat shim doesnt mess up data',function(t){
  
  var fakeStream = {write:function(buf,cb){cb()}};
  var flood = floody(fakeStream,{interval:10}); 
  var buf = flood._concat([new Buffer('1'),'2',new Buffer('34'),'5']);

  t.equals(buf.toString(),'12345',"concat shim should not destroy data");

  flood.stop();
  t.end();
});
