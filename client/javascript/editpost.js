(function ($, window, undefined) {

  // -------------------------------------------------------------------
  // markItUp!
  // -------------------------------------------------------------------
  // Copyright (C) 2008 Jay Salvat
  // http://markitup.jaysalvat.com/
  // -------------------------------------------------------------------
  // MarkDown tags example
  // http://en.wikipedia.org/wiki/Markdown
  // http://daringfireball.net/projects/markdown/
  // -------------------------------------------------------------------
  // Feel free to add more tags
  // -------------------------------------------------------------------
  // mIu nameSpace to avoid conflict.
  miu = {
    markdownTitle: function (markItUp, char) {
      heading = '';
      n = $.trim(markItUp.selection || markItUp.placeHolder).length;
      for (i = 0; i < n; i++) {
        heading += char;
      }
      return '\n' + heading;
    },
    mySettings: {
      previewParserPath: '',
      onShiftEnter: {
        keepDefault: false,
        openWith: '\n\n'
      },
      markupSet: [{
        name: 'First Level Heading',
        key: '1',
        openWith: '# ',
        placeHolder: 'Your title here...',
      },
      {
        name: 'Second Level Heading',
        key: '2',
        openWith: '## ',
        placeHolder: 'Your title here...'
/*,
        closeWith: function (markItUp) {
          return miu.markdownTitle(markItUp, '-')
        }*/
      },
      {
        name: 'Heading 3',
        key: '3',
        openWith: '### ',
        placeHolder: 'Your title here...'
      },
      {
        name: 'Heading 4',
        key: '4',
        openWith: '#### ',
        placeHolder: 'Your title here...'
      },
      {
        name: 'Heading 5',
        key: '5',
        openWith: '##### ',
        placeHolder: 'Your title here...'
      },
      {
        name: 'Heading 6',
        key: '6',
        openWith: '###### ',
        placeHolder: 'Your title here...'
      },
      {
        separator: '---------------'
      },
      {
        name: 'Bold',
        key: 'B',
        openWith: '**',
        closeWith: '**'
      },
      {
        name: 'Italic',
        key: 'I',
        openWith: '_',
        closeWith: '_'
      },
      {
        separator: '---------------'
      },
      {
        name: 'Bulleted List',
        openWith: '- '
      },
      {
        name: 'Numeric List',
        openWith: function (markItUp) {
          return markItUp.line + '. ';
        }
      },
      {
        separator: '---------------'
      },
      {
        name: 'Picture',
        key: 'P',
        replaceWith: addPicture
      },
      {
        name: 'Link',
        key: 'L',
        openWith: '[',
        closeWith: ']([![Url:!:http://]!] "[![Title]!]")',
        placeHolder: 'Your text to link here...'
      },
      {
        separator: '---------------'
      },
      {
        name: 'Quotes',
        openWith: '> '
      },
      {
        name: 'Code Block / Code',
        openWith: '(!(\t|!|`)!)',
        closeWith: '(!(`)!)'
      },
      {
        separator: '---------------'
      },
      {
        name: 'Preview',
        call: 'preview',
        className: "preview"
      }]
    }
  }

  function addPicture(markItUp) {
    var popup = $("<div class='popup'></div>");
    var form = "<form action='/blog/image' target='upload_frame' method='post' enctype='multipart/form-data' encoding='multipart/form-data'>";
    var formObject = $(form);
    var fileInput = $("<input type='file' name='image'/>");
    formObject.append(fileInput);
    formObject.append("<input type='submit'/>")
    var iframe = $('<iframe name="upload_frame" style="position: absolute; top: -9999px; height: 0px; width: 0px;"/>');
    iframe.load(function () {
      var contents = $(this).contents().get(0);
      var data = $(contents).find('body').html();
      //Strip HTML
      data = data.replace(/<(?:[^>])*?>/gm, '');
      if (data === "") {
        return;
      }
      var json = JSON.parse(String(data));
      var filename = json.filename;

      $.markItUp({
        target: markItUp.textarea,
        replaceWith: '![Alternative text](/images/blog/' + filename + ')'
      });
      overlay.remove();

    });
    popup.append(iframe);
    popup.append(formObject);

    var imageList = $("<div class='imageList'/>");
    $.getJSON("/images/list/blog", function (files) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        (function (file) {
          var link = "/images/blog/680x1000!" + file;
          var previewLink = "/images/blog/500x100!" + file;
          var imageHolder = $("<div/>");
          var image = $("<img src='" + previewLink + "'/>");
          imageHolder.append(image);
          imageHolder.click(function () {
            $.markItUp({
              target: markItUp.textarea,
              replaceWith: '![Alternative text](' + link + ')'
            });
            updatePreview($(".posttitle").val(), $(markItUp.textarea));
            overlay.remove();
          });
          imageList.append(imageHolder);
        })(file);
      }
    });
    popup.append(imageList);
    var overlay = $("<div class='overlay'></div>");
    overlay.click(function (event) {
      if (event.target === this) {
        $(this).remove();
      }
    })
    overlay.append(popup);
    $("body").append(overlay);
  }

  function updatePreview(title, textarea) {
    var title = (title || 'Title');
    $.post('/blog/preview', {
      data: "#" + title + "\n" + textarea.val()
    }, function (data) {
      $("#previewarea").html(String(data));
      console.log(data);
    });
  }

  $(document).ready(function () {
    // Add markItUp! to your textarea in one line
    // $('textarea').markItUp( { Settings }, { OptionalExtraSettings } );
    var textarea = $('textarea.markdown');

    var settings = miu.mySettings;
    textarea.markItUp(settings);
    
    var titlefield = $(".posttitle");

    textarea.keyup(function () {
      clearTimeout($.data(this, 'timer'));
      var input = this;

      $.data(this, 'timer', setTimeout(function () {
        updatePreview(titlefield.val(), textarea);
      }, 300));
    });

    textarea.change(function () {
      clearTimeout($.data(this, 'timer'));
      var input = this;

      $.data(this, 'timer', setTimeout(function () {
        updatePreview(titlefield.val(), textarea);
      }, 300));
    });
    
    titlefield.keyup(function () {
      clearTimeout($.data(this, 'timer'));
      var input = this;

      $.data(this, 'timer', setTimeout(function () {
        updatePreview(titlefield.val(), textarea);
      }, 300));
    });
    updatePreview(titlefield.val(), textarea);
    $("#savePostButton").click(function (event) {
      event.preventDefault();
      
      $.post(window.location.href,{
        posttitle: titlefield.val(),
        postbody: textarea.val()
      }, function (response) {
        var data = JSON.stringify(response);
        if(data.error) {
          console.log(data.error);
          return;
        }
        
        console.log("Saved post");
      }, "text");
    });
  });



})(jQuery, window);
