$(document).ready(function() {
  $('#myTabs a').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  });

  $('#login-dropdown input').on('change', function() {
    var postAction = '/login/' + $('input[name=radiobtn]:checked', '#login-dropdown').val();
    $('#form-login').attr('action', postAction);
  });

});