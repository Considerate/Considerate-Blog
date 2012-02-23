(function () {
  jQuery(function ($) {
    $("#searchForm").submit(function (event) {
      event.preventDefault();
      var searchValue = document.getElementById("searchbar").value;
      window.location.href = "/search/" + encodeURIComponent(searchValue);
    });
    var timer;
    var i = 0;
    $(window).scroll(function () {
      if (!timer) {
        timer = setTimeout(function () {
          if ($(window).scrollTop() >= $(document).height() - $(window).height() - 100) {
            //Add something at the end of the page
            var moreButton = $("#loadMore");
            loadMore(moreButton, function () {
              clearTimeout(timer);
            });
          }
        }, 400);
        console.log(i++);
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
          this.append(data.html);
          anchor.attr("data-from", data.fromindex);
          callback();
        }
      });
    }

  });
})();
