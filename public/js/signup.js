var no=1;
function newRoom(){
  no=no+1;
  var template=jQuery('#room-template').html();
  var html=Mustache.render(template,{
    no:no
  });

  jQuery('#roomFields').append(html);
}
