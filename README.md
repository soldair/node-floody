[![Build Status](https://secure.travis-ci.org/soldair/node-floody.png)](http://travis-ci.org/soldair/node-floody)

# floody
combines floods of small stream writes while not delaying or buffering writes when not flooded. buffers only up to configured ammount and only keeps buffer around for at most configured interval.

## example

```js
var fs = require('fs')
, floody = require('floody')
, ws = fs.createWriteStream('file.txt')
;

var flood = floody(ws);

// imaginary function that produces thousands of lines of data
var thousandsOfLines = getThousandsOfLines();

flood.on('write',function(arrayOfData,bytes){
  // arrayOfData is an array of the data argument to floody.write
  // for all of the writes it combined into one.
});

thousandsOfLines.forEach(function(line){
  process.nextTick(function(){
  	flood.write(format(line),1);
  });
});

// when you are done
flood.stop();

// to get data on flood writes to real writes
console.log(flood.stats)

```

## api

floody(stream,options)
  - stream is an object that hass a write method and calls a callback.
  - options
    - interval the max time to wait with a buffer before writing it
    - maxBufferLen the max size the buffer can reach before being flushed
  - returns new flood object

flood.write (buffer,data)
  - buffer may be a string and it will be written to stream
  - data is anything you want an array of all of the data is passed the the flood.on('write') event handler

flood.stop
  - turns off the interval for floody. at this point the object is done.

flood.on
  - flood emits events
    - write (dataArray,bytes)
      - dataArray is an array of all of the data arguments passed to flood.write
      - bytes is the number of bytes just written
    - end
      - flood has been stopped

## woo hoo!

let me know if you have issues or comments. i hope its useful.

