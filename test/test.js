var test = require('tap').test;
var floody = require(__dirname+'/../index.js');


test('can use floody',function(t){

  var flood = floody({interval:10});
  process.nextTick(function(){
    flood.write('a',{data:Date.now()});
    flood.write('a',{data:Date.now()});

    process.nextTick(function(){
      flood.write('a',{data:Date.now()});
    });
  });

  var b = 0;
  var written ='';
  flood.on('write',function(data,bytes){

    b += bytes;
    if(b < 3) return;

    t.equals(flood.stats.requestedWrites,3,'requested 3 writes');
    t.equals(flood.stats.writes,2,'should have written twice');
    t.equals(flood.stats.bytes,1,'should have written one byte');
    t.equals(data.length ,2,'should have data values');

    t.ok(data[1].data,'should have date key in data object i set');
    t.equals(written,'aaa','fake stream should not destroy written data');
    
    flood.end();

    t.end();
  }).on('data',function(data){
    written += data.toString();
  });

});

test('0.6 concat shim doesnt mess up data',function(t){
  
  var flood = floody({interval:10}); 
  var buf = flood._concat([new Buffer('1'),new Buffer('23')]);

  t.equals(buf.toString(),'123',"concat shim should not destroy data");

  flood.end();
  t.end();
});
