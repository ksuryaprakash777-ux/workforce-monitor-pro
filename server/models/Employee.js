const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({

    name: String,

    email: String,

    department: String,

    designation: String,

    status:String,

    hoursToday:Number,
    
    productivity:Number,
    
    idleTime:String,

    status: {
        type: String,
        default: 'active'
    },

    score: {
        type: Number,
        default: 0
    },

    hrs: {
        type: String,
        default: '0h'
    },

    idle: {
        type: String,
        default: '-'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('Employee', EmployeeSchema);