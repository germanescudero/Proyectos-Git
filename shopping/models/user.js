const mongoose = require('mongoose');

//user schema
const UserSchema =mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    username:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    admin:{
        type:Number
    }
});

const user=module.exports=mongoose.model('User',UserSchema);