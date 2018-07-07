var socket=io();
var room=window.prompt("Enter the room name of camera");
socket.on('connect',function(){
  console.log('connected');

  // socket.emit('camID',room);
});
socket.emit('join',room);
var localStream,pc=[];
// socket.emit('join',room);
var localVideo = document.querySelector('#localVideo');
//var remoteVideo = document.querySelector('#remoteVideo');
navigator.mediaDevices.getUserMedia({
    audio: false,
   video: true
})
.then(gotStream)
.catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
}
socket.on('channelReady',(id)=>{
  console.log('got channel');
  socket.emit('myId',{id:socket.id,room:room,toid:id});
  createPeerConnection(id);
  pc[id].addStream(localStream);
  doCall(id);
});

socket.on('cmessage', function(dobj) {
  console.log('Client received message:', dobj.message);
 if (dobj.message.type === 'offer') {
   console.log('getting offer');
    pc[dobj.myid].setRemoteDescription(new RTCSessionDescription(dobj.message));
    console.log(dobj.message);
    // doAnswer();
  } else if(dobj.message.type === 'answer') {
    console.log('got answer');
    pc[dobj.myid].setRemoteDescription(new RTCSessionDescription(dobj.message));
  } else if (dobj.message.type === 'candidate') {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: dobj.message.label,
      candidate: dobj.message.candidate
    });
    pc[dobj.myid].addIceCandidate(candidate);
  } //else if (message === 'bye' && isStarted) {
  //   handleRemoteHangup();
  // }
});

function doCall(id) {
  console.log('Sending offer to peer');
  pc[id].createOffer(setLocalAndSendMessage, handleCreateOfferError);

  function setLocalAndSendMessage(sessionDescription) {
    console.log('Inside local description');
    pc[id].setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription,{id:socket.id,room:room,toid:id});
  }
}

function createPeerConnection(id) {
  try {
    pc[id] = new RTCPeerConnection(null);
    pc[id].onicecandidate = handleIceCandidate;
    // pc.onaddstream = handleRemoteStreamAdded;
    // pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
  function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      },{id:socket.id,room:room,toid:id});
    } else {
      console.log('End of candidates.');
    }
  }
}



function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function sendMessage(message,obj) {
  console.log('Client sending message: ', message);
  socket.emit('message',{message,obj});
}
