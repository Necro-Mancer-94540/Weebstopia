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
    
    $.post('/search-user',{temp:userSearch},function(data,status){
        console.log(data);
        $("#loader").hide(0);
        $('#display-container').html("");
        $('#display-container').append("<form name='f1' action='/showprofile' method='POST' class='row' id='test' style='margin-left:10px;margin-right:10px;'></form>");
        data.forEach(user=>{
          var txt=`<span class="card col-6 col-md-2 polaroid" style="width: 18rem;margin-right:5px;padding:0">
          <img class="card-img-top" src=`+user.profilePic+` alt="Card image cap" height="225">
          <span class="card-body">
            <center><button class="card-title makebuttonlink" style="cursor:pointer;" onclick="this.form.submit()" value=`+user._id+` name='hello'>`+user.userName+`</button></center>
          </span>
  </span>`;
            //text="<button onclick='this.form.submit()' name='hello' value="+user._id+">"+user.fullName+"</button>";
            $('#test').append(txt);
        });
    });

  }
});