var mongoose = require('mongoose');

var User = mongoose.model('User',{
  username:{
    type:String,
    required:true,
    trim:true,
    minlength:1,
    unique:true
  },

  accessRooms:{
    type:Array,
    required:true
  }

});

module.exports = {User};
