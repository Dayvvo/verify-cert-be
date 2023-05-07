



const mongoose = require('mongoose');

const UserStampSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  clientBrowsers:{
    type:[String],
  },
  clientDevices:{
    type:[String]
  },

},{timestamps:true});

module.exports = mongoose.model('userStamp', AuditSchema);
