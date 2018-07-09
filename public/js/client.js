
// console.log('request header :',req.query);
var pc=[],done;
// var username=window.prompt("Enter the username");
var url = window.location.href;
var username = url.split('=')[1];
console.log('User name from URL :');
var socket=io();
socket.on('connect',()=>{
  console.log('connected');
  // socket.emit('clientID');
  // console.log('SECRET_KEY:',SECRET_KEY);
  socket.emit('getUser',username);
  // socket.emit('join',room1);
  console.log(socket.id);

  // socket.emit('channelReady',{room:room1,id:socket.id});
});

remoteVideo= document.querySelector('#remoteVideo');
remoteVideo1=document.querySelector('#test1');
remoteVideo2=document.querySelector('#test2');

socket.on('gotRooms',function (rooms) {
  rooms.forEach((room)=>{
    socket.emit('channelReady',{room:room,id:socket.id});
  });
});

socket.on('message', function(dobj) {
  // console.log('Client received message:', message);
 if (dobj.message.type === 'offer') {
   console.log('getting offer');
    pc[dobj.obj.id].setRemoteDescription(new RTCSessionDescription(dobj.message));
    doAnswer(dobj.obj.id);
  } else if (dobj.message.type === 'answer') {
    console.log('got answer');
    pc[dobj.obj.id].setRemoteDescription(new RTCSessionDescription(dobj.message));
  } else if (dobj.message.type === 'candidate') {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: dobj.message.label,
      candidate: dobj.message.candidate
    });
    pc[dobj.obj.id].addIceCandidate(candidate);
  } //else if (message === 'bye' && isStarted) {
  //   handleRemoteHangup();
  // }
});

socket.on('myId',(id)=>{
  console.log('id',id);
  createPeerConnection(id);
  var pc_config= {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};
  function createPeerConnection(id) {
    try {
        pc[id] = new RTCPeerConnection(pc_config);
        pc[id].onicecandidate = handleIceCandidate;
        pc[id].onaddstream = handleRemoteStreamAdded;
        pc[id].onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');

    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
    }
  }
  function handleIceCandidate() {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      csendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      },id);
    } else {
      console.log('End of candidates.');
    }
  }
  function handleRemoteStreamAdded() {
    console.log('Remote stream added.',event);
    var remoteStream=event.stream;
    var video = document.createElement('video');
    video.srcObject = remoteStream;
    video.autoplay=true;
    // var vid=jQuery('<video></video>');
    // vid.srcObject=event.stream;
    //
    jQuery('#videos').append(video);
  //   var remoteStream= event.stream;
  //   try{
  //   if(remoteVideo.srcObject.active===true && remoteVideo1.srcObject.active===true){
  //     remoteVideo2.srcObject = remoteStream;
  //   }
  // }catch(e) {
  //   try {
  //     if(remoteVideo.srcObject.active===true){
  //       remoteVideo1.srcObject=remoteStream;
  //     }
  //   } catch (e) {
  //     console.log(e);
  //     remoteVideo.srcObject=remoteStream;
  //   }
  //
  //   }
  //    console.log(remoteVideo.srcObject.active);
  }
});


function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function csendMessage(message,id){
  // console.log('Client sending message: ', message);
  socket.emit('cmessage',{message,id,myid:socket.id});
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doAnswer(id) {
  console.log('Sending answer to peer.');
  console.log(id);
  pc[id].createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
  function setLocalAndSendMessage(sessionDescription) {
    console.log('Inside local description');
    console.log(id);
    pc[id].setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    csendMessage(sessionDescription,id);
  }

}



function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }
