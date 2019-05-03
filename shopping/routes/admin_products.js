const express=require('express');
const router=express.Router();
const mkdirp=require('mkdirp');
const fs=require('fs-extra');
const resizeImg= require('resize-img');
const auth = require('../config/auth');
const isAdmin = auth.isAdmin;

//get product models
var Product=require('../models/product');

//get category models
var Category=require('../models/category');


/*
*   GET products index
*/

router.get('/',isAdmin,function(req,res){
   var count;

    Product.count(function(err,c){
        count=c;
    });

    Product.find(function(err,products){
        res.render('admin/products',{
        products:products,
        count:count
        });
    });
});

/*
*   GET add product
*/

router.get('/add-product',isAdmin,function (req, res) {
    var title = "";
    var desc = "";
    var price = "";

    Category.find(function (err, categories) {
        res.render('admin/add_product', {
            title: title,
            desc: desc,
            categories:categories,
            price: price

        });
    });

});

/*
*   POST add products
*/

router.post('/add-product',function(req,res){

    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
    
    req.checkBody('title','Title must have a value.').notEmpty();
    req.checkBody('desc','Descripción must have a value.').notEmpty();
    req.checkBody('price','Price must have a value.').isDecimal();
    req.checkBody('image','You must upload an image.').isImage(imageFile);
    
    var title=req.body.title;
    var slug=title.replace(/\s+/g,'-').toLowerCase();
    var desc=req.body.desc;
    var price=req.body.price;
    var category=req.body.category;

    var errors=req.validationErrors();

     if(errors){
        Category.find(function (err, categories) {
            res.render('admin/add_product', {
                errors:errors,
                title: title,
                desc: desc,
                categories:categories,
                price: price
    
            });
        });
     }else{

         Product.findOne({slug:slug},function(err,product){
            if(product){
                req.flash('danger','product title exists, choose another.');
                Category.find(function (err, categories) {
                    res.render('admin/add_product', {
                        title: title,
                        desc: desc,
                        categories:categories,
                        price: price
            
                    });
                });
            }else{
                var price2=parseFloat(price).toFixed(2);

                var product=new Product({
                    title:title,
                    slug:slug,
                    desc:desc,
                    price:price2,
                    category:category,
                    image:imageFile
                });

                product.save(function(err){
                    if(err) return console.log(err);

                    mkdirp('public/product_images/'+product._id,function(err){
                        return console.log(err);
                    });

                    mkdirp('public/product_images/'+product._id+'/gallery',function(err){
                        return console.log(err);
                    });

                    mkdirp('public/product_images/'+product._id+'/gallery/thumbs',function(err){
                        return console.log(err);
                    });

                    if(imageFile != ""){
                        var imageProduct=req.files.image;
                        var path='public/product_images/'+product._id+'/'+imageFile;

                        imageProduct.mv(path,function(err){
                            return console.log(err);
                        });
                    }

                    req.flash('success','product added!');
                    res.redirect('/admin/products');
                });
            }
         });
         
     }

    
 });


/*
*   GET edit product
*/

router.get('/edit-product/:id',isAdmin, function (req, res) {

    var errors;

    if (req.session.errors) errors = req.session.errors;
    req.session.errors = null;



    Category.find(function (err, categories) {
          
        Product.findById(req.params.id, function (err, product) {

            if (err) {
                console.log(err);
                res.redirect('/admin/products');
            } else {
                var galleryDir ='public/product_images/'+product._id+'/gallery';
                var galleryImages=null;

                fs.readdir(galleryDir,function(err,files){
                    if(err){
                        console.log(err);
                    }else{
                        galleryImages=files;

                        res.render('admin/edit_product', {
                            errors:errors,
                            title: product.title,
                            desc: product.desc,
                            categories:categories,
                            category:product.category.replace(/\s/g,'-').toLowerCase(),
                            price:parseFloat(product.price).toFixed(2),
                            image:product.image,
                            galleryImages:galleryImages,
                            id:product._id
                        });
                    }
                });
            }
        });
           
    });

});

 /*
*   POST edit product
*/

router.post('/edit-product/:id',function(req,res){
    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";
    
    req.checkBody('title','Title must have a value.').notEmpty();
    req.checkBody('desc','Descripción must have a value.').notEmpty();
    req.checkBody('price','Price must have a value.').isDecimal();
    req.checkBody('image','You must upload an image.').isImage(imageFile);
    
    var title=req.body.title;
    var slug=title.replace(/\s+/g,'-').toLowerCase();
    var desc=req.body.desc;
    var price=req.body.price;
    var category=req.body.category;
    var productImage=req.body.productImage; 
    var id=req.params.id;

    var errors=req.validationErrors();
    
    if(errors){
        req.session.errors=errors;
        res.redirect('/admin/products/edit-product/'+id);
    }else{
        Product.findOne({slug:slug,_id:{'$ne':id}},function(err,product){
            if(err) console.log(err);

            if(product){
                req.flash('danger','Product title exits, choose another.');
                res.redirect('/admin/products/edit-product/'+id);
            }else{
                Product.findById(id,function(err,product){
                    if(err) console.log(err);
                    product.title=title;
                    product.slug=slug;
                    product.desc=desc;
                    product.price=parseFloat(price).toFixed(2);
                    product.category=category;
                    if(imageFile != ""){
                        product.image=imageFile;
                    }

                    product.save(function(err){
                        if(err) console.log(err);
                        if(imageFile != ""){
                            if(productImage != ""){
                                fs.remove('public/product_images/' + id + '/' + productImage,function(err){
                                    if(err) console.log(err);
                                });
                            }

                            var imageProduct=req.files.image;
                            var path='public/product_images/'+id+'/'+imageFile;
    
                            imageProduct.mv(path,function(err){
                                return console.log(err);
                            });

                        }

                        req.flash('success','product edited!');
                        res.redirect('/admin/products/edit-product/'+id);

                    });

                });
            }
        });
    }
    
 });


  /*
*   POST product gallery
*/

router.post('/product-gallery/:id',function(req,res){
   
    var productImage=req.files.file;
    var id=req.params.id;
    var path='public/product_images/' + id + '/gallery/' + req.files.file.name; 
    var thumbsPath='public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;

    productImage.mv(path,function(err){
        if(err) console.log(err);

        resizeImg(fs.readFileSync(path),{width:100,height:100}).then(function(buf){
            fs.writeFileSync(thumbsPath,buf);
        });
    });

    res.sendStatus(200);

});

 /*
*   GET delete products
*/

router.get('/delete-product/:id',isAdmin,function(req,res){

    var id=req.params.id;
    var path='public/product_images/' + id;
   
    fs.remove(path,function(err){
        if(err){ 
            console.log(err);
        }else{
            Product.findByIdAndRemove(id,function(){
                console.log(err);
            });

            req.flash('success','Product deleted!');
            res.redirect('/admin/products');
        }
    })
});


/*
*   GET delete image
*/

router.get('/delete-image/:image', isAdmin,function (req, res) {

    var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
    var thumbsImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

    fs.remove(originalImage, function (err) {
        if (err){ 
            return console.log(err);
        }else{
            fs.remove(thumbsImage,function(err){
                if (err){ 
                    return console.log(err);
                }else{
                    req.flash('success','Image deleted!');
                    res.redirect('/admin/products/edit-product/'+req.query.id);

                }
            });
        }
    });

});


//exports
module.exports=router;
