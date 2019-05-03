$(function(){
    if ($('textarea#ta').length){
        CKEDITOR.replace('ta');

    }

    $('a.confirmDelection').on('click',function(){
        if(!confirm('Confirm delection ?')) 
        return false;
    });

    if($("[data-fancybox]").length){
        $("[data-fancybox]").fancybox();
         
    }

});