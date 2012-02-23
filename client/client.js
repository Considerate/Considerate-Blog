(function() {
  jQuery(function($) {
    $("#searchForm").submit(function(event) {
      event.preventDefault();
      var searchValue = document.getElementById("searchbar").value;
      window.location.href = "/search/" + encodeURIComponent(searchValue);
    });
		$("#loadMore").click(function(event) {
      event.preventDefault();
      
      var fromindex = $(this).attr("data-from");
			$.ajax({
			  url: "/blog/more/"+fromindex,
			  context: $("#content .posts"),
			  success: function(data){
			    this.append(data);
			  }
			});
    });
    
  });
})();
