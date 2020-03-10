$("#loader").hide(0);

$(document).ready(function () {

  var content = "";
  var userSearch;

  $("#search-button").click(search);
  $("#search-box").keypress(function (event) {
    if (event.which == '13')
      search();
  });

  function search() {

    $("#display-container").html("");
    $("#loader").show(250);
    userSearch = $("#search-box").val();
    display(userSearch);
  };

  function display(userSearch) {
    
    $.post('/searchuser',{temp:userSearch},function(data,status){
        console.log(data);
        $("#loader").hide(0);
        $('#display-container').html("");
        $('#display-container').append("<form name='f1' action='/showprofile' method='POST' class='row' id='test'></form>");
        data.forEach(user=>{
          var txt=`<span class="card col-6 col-md-3" style="width: 18rem;">
          <img class="card-img-top" src=`+user.image+` alt="Card image cap">
          <span class="card-body">
            <center><button class="card-title makebuttonlink" style="cursor:pointer;" onclick="this.form.submit()" value=`+user._id+` name='hello'>`+user.fullName+`</button></center>
          </span>
  </span>`;
            //text="<button onclick='this.form.submit()' name='hello' value="+user._id+">"+user.fullName+"</button>";
            $('#test').append(txt);
        });
    });

  }
});