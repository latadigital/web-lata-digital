/* particlesJS.load(@dom-id, @path-json, @callback (optional)); */
particlesJS.load('areaOne', 'js/particles.json', function () {
  console.log('callback - particles.js config loaded');
});

particlesJS.load('areaTwo', 'js/particles.json', function () {
  console.log('callback - particles.js config loaded');
});

particlesJS.load('areaThree', 'js/particles.json', function () {
  console.log('callback - particles.js config loaded');
});

$(document).ready(function() {
  $(window).scroll(function(){
    var scroll = $(window).scrollTop();
    if (scroll > 100) {
      $('.c-header').addClass('c-header--sticky');
    }else{
      $('.c-header').removeClass('c-header--sticky');
    }
  });
});