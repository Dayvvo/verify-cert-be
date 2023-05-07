const mongoose = require('mongoose');

const user = new mongoose.Schema({
    first_name: { type: String, default: null },
    last_name: { type: String, default: null },
    department:{type:String},
    staffId:{type:String,},
    email: { type: String, unique: true },
    password: { type: String },
    token: { type: String },
});
 
module.exports = mongoose.model('user',user);