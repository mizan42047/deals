jQuery(document).ready(function ($) {
  "use strict";

  if ($("body").hasClass("tm-header-transparent")) {
    var fixedPadding = $(".tm-header-wrapper").height();
    $("#tm-titlebar").css("padding-top", fixedPadding + 55);
  }

  //to top scroller
  $(window).scroll(function () {
    var scrollPos = 300;
    if ($(this).scrollTop() > scrollPos) {
      $(".tm-totop-scroller").addClass("totop-show");
    } else {
      $(".tm-totop-scroller").removeClass("totop-show");
    }
  });
});
