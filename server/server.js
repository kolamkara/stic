'use strict';

const _=require('lodash');
const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const fs = require('fs');
const replace = require('stream-replace');

var {mongoose}=require('./db/mongoose');
var {User}=require('./models/user');
var {authenticate}=require('./middleware/authenticate')

const publicPath = path.join(__dirname,'../public');
const port = process.env.PORT||3000;


var app = express();
var server=http.createServer(app);
var io=socketIO(server);

var client=0,camid=[],clientid=[],camno=0;

app.use(express.static(publicPath));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/signup',(req,res)=>{
  res.redirect('/signup.html');
});

app.post('/signup',(req,res)=>{

  var body = _.pick(req.body,['username','password','accessRooms']);
  console.log("body :",body);
  var user = new User(body);

  console.log(req.body);
  user.save().then(()=>{
    return user.generateAuthToken();
  }).then((token)=>{
    var toClientUser=encodeURIComponent(user.username);
    res.header('x-auth', token).redirect('/client?user='+toClientUser);
  }).catch((e)=>{
    res.status(400).send(e);
  });
});

app.get('/login',(req,res)=>{

  res.redirect('/login.html');
});

app.post('/login',(req,res)=>{
  console.log('Request body :',req.body);
  var body=_.pick(req.body,['username','password']);
  User.findByCredentials(body.username,body.password).then((user)=>{
    return user.generateAuthToken().then((token)=>{
      // console.log("User : ",user);
      // fs.createReadStream(`${publicPath}/client.html`)
      //       .pipe(replace('{{{SECRET_KEY}}}',user))
      //       .pipe(res);

      // var jsonUser=JSON.stringify(user);

      var toClientUser=encodeURIComponent(user.username);
      res.header('x-auth', token).redirect('/client?user='+toClientUser);
    });
  }).catch((e)=>{
    res.status(400).send();
  });

});

app.get('/camera',(req,res)=>{

  res.sendFile(`${publicPath}/camera.html`);
});

app.get('/client',(req,res)=>{

  var passedUser=req.query.user;
  res.sendFile(`${publicPath}/client.html`);
});


io.on('connection',function(socket){

  socket.on('getUser',(user)=>{

    // console.log('accessRooms :',user.accessRooms);
    // user.accessRooms.forEach((room)=>{
    //   console.log('Joined room :',room);
    //   socket.join(room);
    // });
    // socket.emit('gotRooms',user.accessRooms);

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

    console.log('Joined room',socket.id);
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
