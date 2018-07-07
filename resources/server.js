'use strict';
const hbs=require('hbs');
const express = require('express');
const app = express();
var client=0,camid=[],clientid=[],camno=0;
var server=app.listen(8080,()=>{
  console.log('listening on port 4000')
});
const io = require('socket.io').listen(server);
app.set('view engine','hbs');
app.use("/scripts", express.static(`${__dirname}/app/js`));
app.get('/camera',(req,res)=>{
  res.sendFile(`${__dirname}/app/camera.html`);
});
app.get('/',(req,res)=>{
  // res.render('client.hbs',{});
  res.sendFile(`${__dirname}/app/client.html`);
});

io.on('connection',function(socket){
  socket.on('join',(room)=>{
    socket.join(room);
    console.log('Joined room',socket.id);
  });
  socket.on('channelReady',(obj)=>{
    console.log('got channelReady',obj.id);
    socket.broadcast.to(obj.room).emit('channelReady',obj.id);
  });
  socket.on('myId',(obj)=>{
    io.to(obj.toid).emit('myId',obj.id);
  });
  socket.on('message', function(dobj) {
      io.to(dobj.obj.toid).emit('message',dobj);
  });
  socket.on('cmessage', function(dobj) {
      io.to(dobj.id).emit('cmessage',dobj);
  });
});
