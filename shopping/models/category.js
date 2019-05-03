const mongoose = require('mongoose');

//Category schema
const CategorySchema =mongoose.Schema({
    title:{
        type:String,
        require:true
    },
    slug:{
        type:String
    }
});

const category=module.exports=mongoose.model('Category',CategorySchema);