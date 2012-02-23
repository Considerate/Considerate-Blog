(function () {
  jQuery(function ($) {
    $("#searchForm").submit(function (event) {
      event.preventDefault();
      var searchValue = document.getElementById("searchbar").value;
      window.location.href = "/blog/search/" + encodeURIComponent(searchValue);
    });

    function ("#languages a").click(function (event) {
      event.preventDefault();
      var link = $(this).attr("href");
      $.post(link, function (result) {
        console.log(result);
      }, "json");
    })

    var timer;
    var moreButton = $("#loadMore");
    if (moreButton.get(0)) {
      $(window).scroll(function () {
        if ($(window).scrollTop() >= $(document).height() - $(window).height() - 100) {
          if (!timer) {
            timer = setTimeout(function () {
              //Add something at the end of the page
              loadMore(moreButton, function () {
                timer = null;
              });
            }, 400);
          }
        }
      });
      moreButton.click(function (event) {
        event.preventDefault();
        loadMore(moreButton);
      });
    }

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
