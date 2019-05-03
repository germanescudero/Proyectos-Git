const express=require('express');
const path=require('path');
const mongoose=require('mongoose');
const config=require('./config/database');
const bodyParser=require('body-parser');
const session =require('express-session');
const expressValidator=require('express-validator');
const fileUpload=require('express-fileupload');
const passport=require('passport');



//conect database
mongoose.connect(config.mongoURI);
const db=mongoose.connection;
db.on('error',console.error.bind(console,'connection error: '));
db.once('open',function(){
    console.log('connected on MongoDB');
});

//iniciar app
const app=express();

//view engine setup (ver configuracion de motor)
app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

//set public folder (establecer carpeta publica)
app.use(express.static(path.join(__dirname,'public')));

//set global errors variable
app.locals.errors=null;

//get page models
var Page=require('./models/page');

//get all page to pass to header.ejs
Page.find({}).sort({sorting:1}).exec(function(err,pages){
  
  if(err) {
    console.log(err);
  }else{
    app.locals.pages=pages;
  }
  
});

//get category models
var Category=require('./models/category');

//get all categories to pass to header.ejs
Category.find(function(err,categories){
  
  if(err) {
    console.log(err);
  }else{
    app.locals.categories=categories;
  }
  
});


//express fileUpload middleware
app.use(fileUpload());

//body-parser middleware

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json());

//express session middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
    //cookie: { secure: true }
  }));

  //express validator middleware
  app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
        , root    = namespace.shift()
        , formParam = root;
  
      while(namespace.length) {
        formParam += '[' + namespace.shift() + ']';
      }
      return {
        param : formParam,
        msg   : msg,
        value : value
      };
    },
    customValidators:{
      isImage:function(value,filename){
        var extension=(path.extname(filename)).toLowerCase();

        switch (extension) {
          case '.jpg':
            return '.jpg';
          case '.jpeg':
            return '.jpeg';
          case '.png':
            return '.png';
          case '':
            return '.jpg';
          default:
            return false;
        }
      }
    }
  }));

  //express messages middleware
  app.use(require('connect-flash')());
  app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//passport config
require('./config/passport')(passport);

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*',function(req,res,next){
  res.locals.cart=req.session.cart;
  res.locals.user=req.user || null;
  next();
});

//set Routes
const pages=require('./routes/pages.js');
const products=require('./routes/products.js');
const cart=require('./routes/cart.js');
const users=require('./routes/users.js');
const adminPages=require('./routes/admin_pages.js');
const adminCategories=require('./routes/admin_categories.js');
const adminProducts=require('./routes/admin_products.js');


app.use('/admin/pages',adminPages);
app.use('/admin/categories',adminCategories);
app.use('/admin/products',adminProducts);
app.use('/products',products); 
app.use('/cart',cart);
app.use('/users',users);
app.use('/',pages);


//start the server (iniciar el servidor)
const PUERTO=8000;

app.listen(PUERTO,function(){
    console.log('server started on port: '+PUERTO); 
});
