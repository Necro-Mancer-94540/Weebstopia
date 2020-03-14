$("#loader").hide(0);
$("#next-button").hide(0);
$("#previous-button").hide(0);
function add(id,image,title){
  $("#opt").html("");
  console.log(id,image);
  $.post('/searchlist',function(data,result){
    $("#exampleModalCenter").modal("show");
    console.log(data.a[0].listname);
    var k=0;
    $("#opt").append("<option value='0'>Select</option>");
    for(i in data.a){
      console.log(i);
      $("#opt").append("<option>"+data.a[i].listname+"</option>");
    }
});
$("#save").click(function(){
  console.log($("#opt").val());
  $.post('/add',{id:id,img:image,title:title,listvalue:$("#opt").val()},function(data,res){
    if(data)
    $('#exampleModalCenter').modal('hide')
  });
});
}
$(document).ready(function () {

  var content = "";
  var pg;
  var userSearch;
  const object = {
    hd: "<div class='list-group col-2'>",
    hi: "<img style='height:20rem' src='",
    ti: "' />",
    ht: "<p>",
    tt: "</p>",
    hb: "<button class='btn btn-outline-primary' onclick='add(",
    tb: ")'>Add</button>",
    td: "</div>"
  };

  $("#search-button").click(search);
  $("#search-box").keypress(function (event) {
    if (event.which == '13')
      search();
  });

  function search() {

    $("#display-container").html("");
    $("#loader").show(250);
    pg = 1;
    userSearch = $("#search-box").val();
    pageCheck();
    display();

  };

  $("#next-button").click(function () {

    $("#display-container").html("");
    $("#loader").show(250);
    pg++;
    pageCheck();
    display();

  });

  $("#previous-button").click(function () {

    $("#display-container").html("");
    $("#loader").show(250);
    pg--;
    pageCheck();
    display();

  });

  function display() {

    $.get('https://api.jikan.moe/v3/search/anime', {
      q: userSearch,
      page: pg
    }, function (data) {
      $("#display-container").html("");
      $("#display-container").addClass("row");
      data.results.forEach(function (item) {
        //content += object.hd + object.hi + item.image_url + object.ti + object.ht + item.title + object.tt + object.hb + item.mal_id +','+item.image_url+object.tb + object.td;
        //console.log(content);
        content+=`<div class='list-group col-2'><img style='height:20rem' src='${item.image_url}'><p>${item.title}</p>
        <button class='btn btn-outline-primary' onclick='add(${item.mal_id},"${item.image_url}","${item.title}")'>Add</button></div>`
      });      
      $("#loader").hide(250);
      $("#next-button").show(0);
      $("#previous-button").show(0);
      $("#display-container").append(content);
      content = "";
    });

  }

  function pageCheck() {

    $("#next-button").prop("disabled", true);
    $("#previous-button").prop("disabled", true);

    $.get('https://api.jikan.moe/v3/search/anime', {
        q: userSearch,
        page: pg - 1
      })
      .done(function () {
        $("#previous-button").prop("disabled", false);
      });

    $.get('https://api.jikan.moe/v3/search/anime', {
        q: userSearch,
        page: pg + 1
      })
      .done(function () {
        $("#next-button").prop("disabled", false);
      });

  }

});