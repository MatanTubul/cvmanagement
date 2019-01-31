const mongoose = require("mongoose").set('debug',true)
const Schema = mongoose.Schema;

/**
 * User model
 */
const UserSchema = new Schema({
   firstName: {
        type: String
   },
    lastName: {
        type: String
    },
    userName: {
        type: String,
        required: true,
        unique: true, 
        lowercase: true
    },
    password: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false
    }, 
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type : Date,
        default : null
    }
});

module.exports = User = mongoose.model('users', UserSchema);