const mongoose = require('mongoose');

const DocSchema = mongoose.Schema({
  
  hash:{
    type:String
  },


},{timestamps:true});

module.exports = mongoose.model('verify_cert', DocSchema);


 