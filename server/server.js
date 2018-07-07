'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');

var {mongoose}=require('./db/mongoose');
var {User}=require('./models/user');

const publicPath = path.join(__dirname,'../public');
const port = process.env.PORT||3000;


var app = express();
var server=http.createServer(app);
var io=socketIO(server);

var client=0,camid=[],clientid=[],camno=0;

app.use(express.static(publicPath));
app.use(bodyParser.json());

app.post('/signup',(req,res)=>{

  console.log(req.body);

  var user= new User({
    username:req.body.username,
    accessRooms:req.body.accessRooms
  });

  user.save().then((user)=>{
    res.send(user);
  },(e)=>{
    res.status(400).send(e);
  });
});


app.get('/camera',(req,res)=>{

  res.sendFile(`${publicPath}/camera.html`);
});

app.get('/',(req,res)=>{

  res.sendFile(`${publicPath}/client.html`);
});


io.on('connection',function(socket){
  socket.on('getUser',(user)=>{

    User.findOne({username:user}).then((gotuser)=>{
      if(!gotuser){
        console.log('error');
        // callback('error');
      }
      else {
        console.log('Rooms found and joined',gotuser.accessRooms);
        gotuser.accessRooms.forEach((room)=>{
          console.log('Joined room :',room);
          socket.join(room);
        });
        socket.emit('gotRooms',gotuser.accessRooms);
        // callback();

      }
    }).catch((e)=>{
      console.log('Error :',e);
    });

    // console.log('Joined room',socket.id);
  });

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

server.listen(port,()=>{
  console.log(`listening on port ${port}`);
});
