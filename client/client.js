(function () {
  jQuery(function ($) {
    $("#searchForm").submit(function (event) {
      event.preventDefault();
      var searchValue = document.getElementById("searchbar").value;
      window.location.href = "/search/" + encodeURIComponent(searchValue);
    });
    var timer;
    $(window).scroll(function () {
      if ($(window).scrollTop() >= $(document).height() - $(window).height() - 100) {
        if (!timer) {
          timer = setTimeout(function () {
            //Add something at the end of the page
            var moreButton = $("#loadMore");
            loadMore(moreButton, function () {
              timer = null;
            });
          }, 400);
        }
      }
    });
    $("#loadMore").click(function (event) {
      event.preventDefault();
      var moreButton = $(this);
      loadMore(moreButton);
    });

    function loadMore(anchor, callback) {
      var fromindex = anchor.attr("data-from");
      $.ajax({
        url: "/blog/more/" + fromindex,
        context: $("#content .posts"),
        success: function (data) {
          var appendix = $(data.html);
          appendix.hide();
          appendix.appendTo($(this));
          appendix.slideDown("normal");
          anchor.attr("data-from", data.fromindex);
          callback();
        }
      });
    }

  });
})();
