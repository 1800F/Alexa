$(function() {

  // Mobile breakpoint
  var isMobile = $(window).width() <= 767;

  var isMobileDevice = {
    Android: function() {
      return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
      return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
      return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
      return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
      return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
      return (isMobileDevice.Android() || isMobileDevice.BlackBerry() || isMobileDevice.iOS() || isMobileDevice.Opera() || isMobileDevice.Windows());
    }
  };

  if(isMobileDevice.any()) {
    $('.close').hide();
  }

  $('.screen-head p').each(function(){
      var string = $(this).html();
      string = string.replace(/ ([^ ]*)$/,'&nbsp;$1');
      $(this).html(string);
  });

  $('li').each(function(){
      var string = $(this).html();
      string = string.replace(/ ([^ ]*)$/,'&nbsp;$1');
      $(this).html(string);
  });

  $('form').validate({

    invalidHandler: function(event, validator) {
      // 'this' refers to the form
      var errors = validator.numberOfInvalids();
      if (errors) {
        $('.error-message').addClass('has-error');
      } else {
        $('.error-message').removeClass('has-error');
      }
    },

    success: function(label) {
      $('.error-message').removeClass('has-error');
    }
  });

  $('a[data-to-screen]').click(function(e){
    e.preventDefault();
    var toScreen = $(e.target).data('to-screen')
      , oldPage = $('.screen:not(.inactive)').data('page')
      , $newScreen = $('#' + toScreen)
      , newPage = $newScreen.data('page')
    ;
    $('.screen').addClass('inactive');
    $newScreen.removeClass('inactive');
    $('body').removeClass(oldPage).addClass(newPage);
  });

  $('.payment-methods > li:not(.inactive)').click(function(e){
    var $self = $(this);
    $('.payment-methods > li').removeClass('.active');
    $self.addClass('active');
    $('#paymentMethodSelect').val($self.data('method-id'));
  });

  $('#payment-methods form').submit(function(e){
    var $active = $('.payment-methods > li.active');
    if(!$active.length || $active.hasClass('invalid')) e.preventDefault();

  });

});
