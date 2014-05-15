var async = (function () {
  /**
   * read contents of file as representing URL
   *
   * @param {File} file
   * @return {Promise} - then: sDataUrl
   */
  var readFileAsDataURL = function (file) {
    return $.Deferred(function (deferred) {
      $.extend(new FileReader(), {
        onload: function (e) {
          var sDataURL = e.target.result;
          deferred.resolve(sDataURL);
        },
        onerror: function () {
          deferred.reject(this);
        }
      }).readAsDataURL(file);
    }).promise();
  };

  /**
   * create `<image>` from url string
   *
   * @param {String} sUrl
   * @return {Promise} - then: $image
   */
  var createImage = function (sUrl) {
    return $.Deferred(function (deferred) {
      $('<img>').one('load', function () {
        deferred.resolve($(this));
      }).one('error abort', function () {
        deferred.reject($(this));
      }).css({
        display: 'none'
      }).appendTo(document.body).attr('src', sUrl);
    }).promise();
  };

  return {
    readFileAsDataURL: readFileAsDataURL,
    createImage: createImage
  };
})();

String.prototype.contains = function(it) { return this.indexOf(it) !== -1; };
String.prototype.capitalize = function() { return this.charAt(0).toUpperCase() + this.slice(1); };
String.prototype.trim = function() { return String(this).replace(/^\s+|\s+$/g, ''); };
Object.size = function(obj) {
  var size = 0;
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      size++;
    }
  }
  return size;
};

var $snteWorkspace;
var snteWorkspaceElements = {};
var $snteWorkspaceFocusedElement;
var snteWorkspaceErrorModalVisible = false;
var snteLastCellError = {};

var snteImage = {"maxWidth": 500};

var snteChromeSize = {"left": {"width": 0}, "top": {"height": 55}};
var snteWorkspaceSize = {"width": 9999999999, "height": 9999999999};
var snteDefaultElementSizes = {"comment": {"width": 275, "height": 150}};

// http://home.earthlink.net/~silvermaplesoft/standards/size_heading.html
var snteWYSIWYG = {
  "fontFamily": {"default": "Arial", "values": ["Arial", "Courier New", "Georgia", "Times New Roman", "Trebuchet MS", "Verdana"]},
  "fontSize": {"default": 2, "values": [1, 2, 3, 4, 5, 6, 7], "valueToPixelMap": {1: 10, 2:13, 3:16, 4:18, 5:24, 6:32, 7:48}, "pixelToValueMap": {10: 1, 13:2, 16:3, 18:4, 24:5, 32:6, 48:7}},
  "fontColor": {"default": "rgba(0,0,0,1)"},
  "fillColor": {"default": "rgba(0,0,0,0)"},
  "bold": {"default": false},
  "italic": {"default": false},
  "underline": {"default": false},
  "strikethrough": {"default": false},
  "align": {"default": "default"}
};

var snteCellTypes;

var snteFillColorNeedsBlackFont = [
  "rgba(0,0,0,0)",
  "rgba(239,239,239,1)",
  "rgba(243,243,243,1)",
  "rgba(255,255,255,1)"
];
var snteColorPalette = [
  "rgba(0,0,0,1)",
  "rgba(67,67,67,1)",
  "rgba(102,102,102,1)",
  "rgba(153,153,153,1)",
  "rgba(183,183,183,1)",
  "rgba(204,204,204,1)",
  "rgba(217,217,217,1)",
  "rgba(239,239,239,1)",
  "rgba(243,243,243,1)",
  "rgba(255,255,255,1)",
  "rgba(152,0,0,1)",
  "rgba(255,0,0,1)",
  "rgba(255,153,0,1)",
  "rgba(255,255,0,1)",
  "rgba(0,255,0,1)",
  "rgba(0,255,255,1)",
  "rgba(73,133,232,1)",
  "rgba(0,0,255,1)",
  "rgba(153,0,255,1)",
  "rgba(255,0,255,1)",
  "rgba(230,184,175,1)",
  "rgba(244,204,204,1)",
  "rgba(252,228,205,1)",
  "rgba(255,242,204,1)",
  "rgba(216,234,211,1)",
  "rgba(208,224,227,1)",
  "rgba(201,217,248,1)",
  "rgba(207,225,243,1)",
  "rgba(216,210,233,1)",
  "rgba(234,209,219,1)",
  "rgba(221,126,106,1)",
  "rgba(234,153,153,1)",
  "rgba(249,202,156,1)",
  "rgba(255,229,153,1)",
  "rgba(182,215,168,1)",
  "rgba(162,195,201,1)",
  "rgba(164,194,244,1)",
  "rgba(158,196,232,1)",
  "rgba(179,167,214,1)",
  "rgba(213,166,189,1)",
  "rgba(204,64,37,1)",
  "rgba(224,102,102,1)",
  "rgba(246,177,107,1)",
  "rgba(255,216,102,1)",
  "rgba(147,196,125,1)",
  "rgba(118,164,175,1)",
  "rgba(109,158,235,1)",
  "rgba(111,168,220,1)",
  "rgba(142,123,195,1)",
  "rgba(194,122,160,1)",
  "rgba(166,28,0,1)",
  "rgba(204,0,0,1)",
  "rgba(230,144,56,1)",
  "rgba(241,193,49,1)",
  "rgba(105,168,79,1)",
  "rgba(69,128,142,1)",
  "rgba(59,119,216,1)",
  "rgba(61,133,198,1)",
  "rgba(102,78,167,1)",
  "rgba(166,77,120,1)",
  "rgba(91,14,0,1)",
  "rgba(102,0,0,1)",
  "rgba(120,63,3,1)",
  "rgba(127,95,0,1)",
  "rgba(38,78,19,1)",
  "rgba(12,51,61,1)",
  "rgba(27,68,135,1)",
  "rgba(7,55,99,1)",
  "rgba(32,17,77,1)",
  "rgba(76,16,48,1)"
];

var snteCellRenderer = function (instance, td, row, col, prop, value, cellProperties) {
  var newValue = Handsontable.renderers.ExcelRenderer.apply(this, arguments);

  if(cellProperties.snteExplicitType === "auto" && value !== null && value !== "" && !Handsontable.helper.isNumeric(value) && strtotime(value) !== false) {
    cellProperties.snteImplicitType = "date";
  }

  var snteType = cellProperties.snteExplicitType !== "auto" ? cellProperties.snteExplicitType : cellProperties.snteImplicitType;

  if(cellProperties.snteExplicitType === "text") {
    Handsontable.renderers.TextRenderer.apply(this, arguments);
  }

  if(snteType === "date") {
    var formattedDate;
    if(value !== null && value !== "") {
      formattedDate = date(snteCellTypes.date.format, strtotime(value));
    }
    else {
      formattedDate = "";
    }
    cellProperties.snteRendered = formattedDate;
    Handsontable.renderers.TextRenderer.apply(this, [ instance, td, row, col, prop, formattedDate, cellProperties ]);
  }


  var textDecoration = "";
  if(cellProperties.snteWYSIWYG.underline) {
    textDecoration += " underline";
  }
  if(cellProperties.snteWYSIWYG.strikethrough) {
    textDecoration += " line-through";
  }
  if(textDecoration.length === 0) {
    textDecoration = "none";
  }

  var textAlign;
  if(cellProperties.snteWYSIWYG.align === "default") {
    if(snteType === "numeric" || snteType === "currency" || snteType === "percent" || snteType === "date") {
      textAlign = "right";
    }
    else {
      textAlign = "left";
    }
  }
  else {
    textAlign = cellProperties.snteWYSIWYG.align;
  }

  $(td).css({
    "font-family": cellProperties.snteWYSIWYG.fontFamily,
    "font-size": snteWYSIWYG.fontSize.valueToPixelMap[cellProperties.snteWYSIWYG.fontSize]+"px",
    "color": cellProperties.snteWYSIWYG.fontColor,
    "background-color": cellProperties.snteWYSIWYG.fillColor,
    "font-weight": cellProperties.snteWYSIWYG.bold?"bold":"normal",
    "font-style": cellProperties.snteWYSIWYG.italic?"italic":"normal",
    "text-decoration": textDecoration,
    "text-align": textAlign
  });

  if(cellProperties.snteFormula !== void 0) {
    $(td).addClass("snte-formula")
  }
};

var snteSearchResultCounter = 0;
var snteSearchActiveResultIndex = 0;
var snteSearchTypeTimeout = 0;

$(document).ready(function() {
  snte_bootstrap();
});

function snte_bootstrap() {
  $snteWorkspace = $("div#snte-workspace");

  i18n.init({ detectLngQS: 'lang', cookieName: 'lang', fallbackLng: 'en', debug: true }, function(t) {
    $("body").i18n();

    snteCellTypes =  {
      "auto": {"title": t("chrome.cell-format-auto")},
      "text": {"title": t("chrome.cell-format-text")},
      "numeric": {"title": t("chrome.cell-format-number"), "format": "0,0.00"},
      "numericWithoutComma": {"title": t("chrome.cell-format-number"), "format": "0,0[.][0000000000]"},
      "percent": {"title": t("chrome.cell-format-percent"), "format": "0.00%"},
      "currency": {"title": t("chrome.cell-format-currency"), "format": "$ 0,0.00"},
      "date": {"title": t("chrome.cell-format-date"), "format": t("chrome.date-format")}
    };

    snte_chrome_setup();
  });
}

function snte_chrome_setup() {
  snte_chrome_setup_image_control();

  snte_chome_setup_color_control("font");
  snte_chome_setup_color_control("fill");
  $(".snte-color-btn").tooltip({
    container: "body",
    placement: "bottom",
    trigger: "hover",
    animation: false
  }).click(function() { $(this).tooltip("hide"); });

  $("button#snte-menu-undo").click(function(evt) {
    snte_wysiwyg_exec_command("undo", null);
  });
  $("button#snte-menu-redo").click(function(evt) {
    snte_wysiwyg_exec_command("redo", null);
  });
  $("button#snte-menu-copy").click(function(evt) {
    snte_wysiwyg_exec_command("copy", null);
  });
  $("button#snte-menu-paste").click(function(evt) {
    snte_wysiwyg_exec_command("paste", null);
  });

  $("div#snte-menu-add-element ul.dropdown-menu li a").click(function(evt) {
    snte_workspace_add_item($(this).data("item"));
    
    evt.preventDefault();
  });
  $("div#snte-menu-add-element button").popover({
    placement: "auto bottom",
    title: $.t("help.start-here-title"),
    content: $.t("help.start-here-message"),
    container: "body",
    html: true
  }).popover("show").click(function(evt) {
    $(this).popover("hide");

    evt.preventDefault();
  });

  $("button").tooltip({
    container: "body",
    placement: "bottom",
    trigger: "hover",
    animation: false
  }).click(function() { $(this).tooltip("hide"); });

  $("button#snte-menu-toggle-search").popover({
    placement: "auto bottom",
    html: true,
    title: function () {
     return $("div#snte-searchbox-title").html();
    },
    content: function() {
      return $("div#snte-searchbox-content");
    },
    container: "body"
  });

  $("button#snte-menu-toggle-search").click(function(evt) {
    snte_chrome_toggle_button($(this));
    if($(this).hasClass("active")) {
      snte_chrome_setup_search();
      snte_workspace_reset_focus();
      $("input.snte-menu-search-input").focus();
    }
    
    evt.preventDefault();
  });

  $("button#snte-menu-toggle-comments").click(function(evt) {
    snte_chrome_toggle_button($(this));
    if($(this).hasClass("active")) {
      snte_chrome_show_comments();
      snte_workspace_show_comments();
    }
    else {
      snte_chrome_hide_comments();
      snte_workspace_hide_comments();
    }

    evt.preventDefault();
  });

  $("button#snte-menu-font-bold").click(function(evt) {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_bold();

    evt.preventDefault();
  });
  $("button#snte-menu-font-italic").click(function(evt) {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_italic();

    evt.preventDefault();
  });
  $("button#snte-menu-font-underline").click(function(evt) {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_underline();

    evt.preventDefault();
  });
  $("button#snte-menu-font-strikethrough").click(function(evt) {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_strikethrough();

    evt.preventDefault();
  });
  $("button#snte-menu-font-align-left").click(function(evt) {
    $("button#snte-menu-font-align-center").removeClass("active");
    $("button#snte-menu-font-align-right").removeClass("active");
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_align("left");

    evt.preventDefault();
  });
  $("button#snte-menu-font-align-center").click(function(evt) {
    $("button#snte-menu-font-align-left").removeClass("active");
    $("button#snte-menu-font-align-right").removeClass("active");
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_align("center");

    evt.preventDefault();
  });
  $("button#snte-menu-font-align-right").click(function(evt) {
    $("button#snte-menu-font-align-left").removeClass("active");
    $("button#snte-menu-font-align-center").removeClass("active");
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_align("right");

    evt.preventDefault();
  });
  $("div#snte-menu-font-family ul.dropdown-menu li a").click(function(evt) {
    $("div#snte-menu-font-family ul.dropdown-menu li").removeClass("active");
    $(this).closest("li").addClass("active");
    $("div#snte-menu-font-family button span.value").text($(this).text());
    $("div#snte-menu-font-family button").data("value", $(this).data("value"));

    snte_wysiwyg_apply_font_family();

    evt.preventDefault();
  });
  $("div#snte-menu-font-size ul.dropdown-menu li a").click(function(evt) {
    $("div#snte-menu-font-size ul.dropdown-menu li").removeClass("active");
    $(this).closest("li").addClass("active");
    $("div#snte-menu-font-size button span.value").text($(this).text());
    $("div#snte-menu-font-size button").data("value", $(this).data("value"));

    snte_wysiwyg_apply_font_size();

    evt.preventDefault();
  });
  $("div#snte-menu-font-color-container ul.dropdown-menu li a").click(function(evt) {
    snte_chrome_set_color_control("font", $(this).data("value"));
    snte_wysiwyg_apply_font_color();

    evt.preventDefault();
  });
  $("div#snte-menu-fill-color-container ul.dropdown-menu li a").click(function(evt) {
    snte_chrome_set_color_control("fill", $(this).data("value"));
    snte_wysiwyg_apply_fill_color();

    evt.preventDefault();
  });

  $("button#snte-menu-ordered-list").click(function(evt) {
    if($snteWorkspaceFocusedElement !== void 0) {
      if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
        snte_chrome_toggle_button($(this));
        $("button#snte-menu-unordered-list").removeClass("active");
        snte_wysiwyg_exec_command("insertorderedlist", null);
        $snteWorkspaceFocusedElement.focus();
      }
    }

    evt.preventDefault();
  });
  $("button#snte-menu-unordered-list").click(function(evt) {
    if($snteWorkspaceFocusedElement !== void 0) {
      if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
        snte_chrome_toggle_button($(this));
        $("button#snte-menu-ordered-list").removeClass("active");
        snte_wysiwyg_exec_command("insertunorderedlist", null);
        $snteWorkspaceFocusedElement.focus();
      }
    }

    evt.preventDefault();
  });

  $("div#snte-menu-cell-type ul.dropdown-menu li a").click(function(evt) {
    $("div#snte-menu-cell-type ul.dropdown-menu li").removeClass("active");
    $(this).closest("li").addClass("active");
    $("div#snte-menu-cell-type button span.value").text(snteCellTypes[$(this).data("value")].title);
    $("div#snte-menu-cell-type button").data("value", $(this).data("value"));

    snte_table_apply_cell_type();

    evt.preventDefault();
  });
}

function snte_chrome_setup_image_control() {
  if(!window.FileReader) {
    $("div#snte-image-upload-dropzone").addClass("snte-hidden");
  }
  else {
    $('div#snte-image-upload-dropzone').bind('dragover', function(evt) {
      $(evt.target).addClass("dragover");

      evt.stopPropagation();
      evt.preventDefault();
    }).bind('dragleave', function(evt) {
      $(evt.target).removeClass("dragover");
    }).bind('drop', function(evt) {
      $(evt.target).removeClass("dragover");
      $("#snte-image-modal").modal("hide");
      var dataTransfer = evt.originalEvent.dataTransfer;
      if (dataTransfer && dataTransfer.files) {
        $.each(dataTransfer.files, function (idx, file) {
          async.readFileAsDataURL(file).then(function (url) {
            snte_workspace_add_image(url);
          }).fail(function () {
            alert(t("image-upload.upload-error"));
          });
        });
      }
     
      evt.stopPropagation();
      evt.preventDefault();
    });

    $("body").bind('dragover', function(evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }).bind('drop', function(evt) {
      var dataTransfer = evt.originalEvent.dataTransfer;
      if (dataTransfer && dataTransfer.files) {
        $.each(dataTransfer.files, function (idx, file) {
          async.readFileAsDataURL(file).then(function (url) {
            snte_workspace_add_image(url);
          }).fail(function () {
            alert(t("image-upload.upload-error"));
          });
        });
      }
     
      evt.stopPropagation();
      evt.preventDefault();
    });
  }

  $("button#snte-image-upload-ok").click(function (evt) {
    if($("#snte-image-add-tab-link-header").hasClass("active") && $("input#snte-image-link").val().trim() !== "") {
      snte_workspace_add_image($("input#snte-image-link").val());
    }
  });
}

function snte_table_apply_cell_type() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
      var selectedCells = tableInstance.getSelected(); //[startRow, startCol, endRow, endCol]
      for(var row = selectedCells[0]; row <= selectedCells[2]; row++) {
        for(var col = selectedCells[1]; col <= selectedCells[3]; col++) {
          var cellMeta = tableInstance.getCellMeta(row, col);
          cellMeta.snteExplicitType = $("div#snte-menu-cell-type button").data("value");
        }
      }
      tableInstance.render();
    }
  }
}

function snte_chrome_setup_search() {
  $("div.popover-content button.snte-menu-search-next").off("click").click(function(evt) {
    $(this).tooltip("hide");
    snte_search_mark("next");
    
    evt.preventDefault();
  });
  $("div.popover-content button.snte-menu-search-prev").off("click").click(function(evt) {
    $(this).tooltip("hide");
    snte_search_mark("prev");
    
    evt.preventDefault();
  });
  $("div.popover-content button.snte-menu-search-clear").off("click").click(function(evt) {
    $(this).tooltip("hide");
    $("button#snte-menu-toggle-search").click();
    snte_reset_search();

    evt.preventDefault();
  });
  $("div.popover-content input.snte-menu-search-input").off("keyup").keyup(function(evt) {
    if(evt.which === 13) {
      if(snteSearchTypeTimeout > 0) {
        $(this).closest("div").removeClass("has-success has-error");
        $("div.popover div.snte-searchbox-resultcount").text("");

        clearTimeout(snteSearchTypeTimeout);
        snte_search($(this).val());
      }
      else {
        $("div.popover-content button.snte-menu-search-next").click();
      }
    }
    else if(evt.which === 27) {
      $("div.popover-content button.snte-menu-search-clear").click();
    }
    else {
      $(this).closest("div").removeClass("has-success has-error");
      $("div.popover div.snte-searchbox-resultcount").html("<img src=\"img/loading-icon-16x16.gif\" alt=\""+$.t("search.wait")+"\" title=\""+$.t("search.wait")+"\" />");

      clearTimeout(snteSearchTypeTimeout);
      snteSearchTypeTimeout = setTimeout(function() { snte_search($("div.popover-content input.snte-menu-search-input").val()); }, 200);
    }
  })
}

function snte_reset_search_on_element($elem) {
  if($elem.hasClass("snte-element-text")) {
    $elem.unhighlight({"className": "snte-search-match"});
  }
  else if($elem.hasClass("snte-element-comment") && $("button#snte-menu-toggle-comments").hasClass("active")) {
    $elem.unhighlight({"className": "snte-search-match"});
  }
  else if($elem.hasClass("snte-element-table")) {
    $elem.find("td").removeClass("snte-search-match");
  }
}

function snte_reset_search() {
  for(var ii in snteWorkspaceElements) {
    snte_reset_search_on_element(snteWorkspaceElements[ii]);
  }
  $("div.popover div.snte-searchbox-resultcount").text("");
  $("div.popover-content input.snte-menu-search-input").val("").closest("div").removeClass("has-success has-error");
}

function snte_search(needle) {
  snteSearchResultCounter = 0;
  snteSearchActiveResultIndex = -1;
  snteSearchTypeTimeout = 0; // really clear timeout

  if(needle !== "") {
    for(var ii in snteWorkspaceElements) {
      $elem = snteWorkspaceElements[ii];
      snte_reset_search_on_element($elem);

      if($elem.hasClass("snte-element-text")) {
        $elem.highlight(needle, {"className": "snte-search-match"});
      }
      else if($elem.hasClass("snte-element-comment") && $("button#snte-menu-toggle-comments").hasClass("active")) {
        $elem.highlight(needle, {"className": "snte-search-match"});
      }
      else if($elem.hasClass("snte-element-table")) {
        var tableInstance = $elem.handsontable("getInstance");
        var queryResult = tableInstance.search.query(needle);
        tableInstance.render();
      }
    }

    snteSearchResultCounter = $(".snte-search-match").length;
    snte_search_mark("next"); // highlight first result

    if(snteSearchResultCounter > 0) {
      $("div.popover-content input.snte-menu-search-input").closest("div").addClass("has-success");
    }
    else {
      $("div.popover-content input.snte-menu-search-input").closest("div").addClass("has-error");
    }

    $("div.popover div.snte-searchbox-resultcount").text($.t("search.resultcount", { count: snteSearchResultCounter }));
  }
  else {
    snte_reset_search();
  }
}

function snte_search_mark(direction) {
  if(snteSearchResultCounter > 0) {
    if(direction === "next") {
      snteSearchActiveResultIndex++;
      if(snteSearchActiveResultIndex === snteSearchResultCounter) {
        snteSearchActiveResultIndex = 0;
      }
    }
    else if(direction === "prev") {
      snteSearchActiveResultIndex--;
      if(snteSearchActiveResultIndex < 0) {
        snteSearchActiveResultIndex = snteSearchResultCounter-1;
      }
    }

    $(".snte-search-match").eq(snteSearchActiveResultIndex).pulsate({
      color: "#ffa123",
      speed: 300,
      reach: 10,
      repeat: 1
    });
  }
}

function snte_wysiwyg_apply_font() {
  snte_wysiwyg_apply_font_family();
  snte_wysiwyg_apply_font_size();
  snte_wysiwyg_apply_font_color();
  snte_wysiwyg_apply_fill_color();
  snte_wysiwyg_apply_font_styles();
  snte_wysiwyg_apply_font_aligns();
}

function snte_wysiwyg_apply_font_aligns() {
  if($("button#snte-menu-font-align-left").hasClass("active")) {
    snte_wysiwyg_apply_font_align("left");
  }
  else if($("button#snte-menu-font-align-center").hasClass("active")) {
    snte_wysiwyg_apply_font_align("center");
  }
  else if($("button#snte-menu-font-align-right").hasClass("active")) {
    snte_wysiwyg_apply_font_align("right");
  }
  else {
    alert("da stimmt was nicht");
  }
}

function snte_wysiwyg_apply_font_align(value) {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      snte_wysiwyg_exec_command("justify"+value.capitalize(), null);
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("align", value);
    }
  }
}

function snte_wysiwyg_apply_font_styles() {
  if($("button#snte-menu-font-bold").hasClass("active")) {
    snte_wysiwyg_apply_font_bold();
  }
  if($("button#snte-menu-font-italic").hasClass("active")) {
    snte_wysiwyg_apply_font_italic();
  }
  if($("button#snte-menu-font-underline").hasClass("active")) {
    snte_wysiwyg_apply_font_underline();
  }
  if($("button#snte-menu-font-strikethrough").hasClass("active")) {
    snte_wysiwyg_apply_font_strikethrough();
  }
}

function snte_wysiwyg_apply_font_bold() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      snte_wysiwyg_exec_command("bold", null);
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("bold", $("button#snte-menu-font-bold").hasClass("active"));
    }
  }
}
function snte_wysiwyg_apply_font_italic() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      snte_wysiwyg_exec_command("italic", null);
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("italic", $("button#snte-menu-font-italic").hasClass("active"));
    }
  }
}
function snte_wysiwyg_apply_font_underline() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      snte_wysiwyg_exec_command("underline", null);
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("underline", $("button#snte-menu-font-underline").hasClass("active"));
    }
  }
}
function snte_wysiwyg_apply_font_strikethrough() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      snte_wysiwyg_exec_command("strikeThrough", null);
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("strikethrough", $("button#snte-menu-font-strikethrough").hasClass("active"));
    }
  }
}

function snte_wysiwyg_apply_font_family() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      snte_wysiwyg_exec_command("fontName", $("div#snte-menu-font-family button").data("value"));
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("fontFamily", $("div#snte-menu-font-family button").data("value"));
    }
  }
}

function snte_wysiwyg_apply_font_size() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      snte_wysiwyg_exec_command("fontSize", $("div#snte-menu-font-size button").data("value"));
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("fontSize", $("div#snte-menu-font-size button").data("value"));
    }
  }
}

function snte_wysiwyg_apply_font_color() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      snte_wysiwyg_exec_command("foreColor", $("button#snte-menu-font-color").data("value"));
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("fontColor", $("button#snte-menu-font-color").data("value"));
    }
  }
}

function snte_wysiwyg_apply_fill_color() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      snte_wysiwyg_exec_command("hiliteColor", $("button#snte-menu-fill-color").data("value"));
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("fillColor", $("button#snte-menu-fill-color").data("value"));
    }
  }
}

function snte_wysiwyg_update_table_cell_meta(field, value) {
  var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
  var selectedCells = tableInstance.getSelected(); //[startRow, startCol, endRow, endCol]
  for(var row = selectedCells[0]; row <= selectedCells[2]; row++) {
    for(var col = selectedCells[1]; col <= selectedCells[3]; col++) {
      var cellMeta = tableInstance.getCellMeta(row, col);
      cellMeta.snteWYSIWYG[field] = value;
    }
  }
  tableInstance.render();
}

function snte_wysiwyg_exec_command(name, value) {
  document.execCommand("styleWithCSS", false, "true");
  document.execCommand(name, false, value);
}

function snte_workspace_add_item(type) {
  snte_chrome_reset_font_controls();

  switch(type) {
      case "table":
        snte_workspace_add_table();
        break;
      case "text":
        snte_workspace_add_text();
        break;
      case "comment":
        snte_workspace_add_comment();
        break;
      case "chart":
        alert("TODO");
        break;
      case "image":
        $("#snte-image-modal").modal();
        break;
    }
}

function snte_workspace_remove_element($elem) {
  // delete is slow: http://stackoverflow.com/questions/208105/how-to-remove-a-property-from-a-javascript-object
  delete snteWorkspaceElements[$elem.attr("id").replace("snte-element-", "")];
  $elem.closest("div.snte-element-container").remove();

  if(Object.size(snteWorkspaceElements) === 0) {
    $("div#snte-menu-add-element button").popover("show");
  }
}

function snte_workspace_remove_element_confirm(evt) {
  if(confirm($.t("chrome.delete-element-confirm"))) {
    snte_workspace_remove_element_useraction($(evt.target).closest("div.snte-element-container").find("div.snte-element"));
  }
}

function snte_workspace_remove_element_useraction($elem) {
  snte_workspace_reset_focus();
  snte_workspace_remove_element($elem);
}

function snte_workspace_reset_focus() {
  if($snteWorkspaceFocusedElement !== void 0 && jQuery.contains(document, $snteWorkspaceFocusedElement[0])) {
    $snteWorkspaceFocusedElement.removeClass("snte-highlighted");
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      $("button#snte-menu-unordered-list").removeClass("active");
      $("button#snte-menu-ordered-list").removeClass("active");
      if($snteWorkspaceFocusedElement.hasClass("snte-element-text")) {
        if($snteWorkspaceFocusedElement.text().trim() === "") {
          snte_workspace_remove_element($snteWorkspaceFocusedElement);
        }
      }
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      $snteWorkspaceFocusedElement.handsontable("getInstance").deselectCell();
      $("div#snte-menu-cell-type button").addClass("disabled");
    }
  }
  $snteWorkspaceFocusedElement = void 0;
}

function snte_workspace_set_focus($elem) {
  if($snteWorkspaceFocusedElement !== void 0 && $elem.attr("id") !== $snteWorkspaceFocusedElement.attr("id")) {
    snte_workspace_reset_focus();
  }
  
  $snteWorkspaceFocusedElement = $elem;

  $snteWorkspaceFocusedElement.addClass("snte-highlighted");

  if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
    $("div#snte-menu-cell-type button").removeClass("disabled");
    $("button#snte-menu-ordered-list").addClass("disabled");
    $("button#snte-menu-unordered-list").addClass("disabled");
  }
  else {
    $("div#snte-menu-cell-type button").addClass("disabled");
    $("button#snte-menu-ordered-list").removeClass("disabled");
    $("button#snte-menu-unordered-list").removeClass("disabled");
  }
}

function snte_workspace_make_draggable($elem) {
  $elem.draggable({
    handle: $("div.snte-element-draghandle", $elem),
    containment: [snteChromeSize.left.width, snteChromeSize.top.height, snteWorkspaceSize.width, snteWorkspaceSize.height],
    cursor: "move",
    opacity: "0.5",
    snap: true,
    stack: ".snte-element-container"
  });
}

function snte_workspace_make_resizable($elem) {
  $elem.resizable({
    autoHide: true,
    ghost: true,
    grid: [20, 20],
    handles: "se",
    minHeight: 50,
    minWidth: 70,
  });
}

function snte_workspace_create_element_container(withTitle) {
  var $newElementContainer = $("<div>").addClass("snte-element-container");

  if(withTitle) {
    $titleField = $("<input>").attr("type", "text").attr("placeholder", $.t("table.unnamed")).addClass("snte-element-title-input");
    $titleControl = $("<div>").addClass("snte-element-title snte-element-draghandle");
    $titleControl.append($titleField);
    $newElementContainer.append($titleControl);
  }

  $deleteControl = $("<div>").addClass("snte-element-delete").append($("<span>").addClass("glyphicon glyphicon-remove").attr("title", $.t("chrome.delete-element")));
  $deleteControl.click(snte_workspace_remove_element_confirm);
  $elementControls = $("<div>").addClass("snte-element-controls snte-element-draghandle").append($deleteControl);
  $newElementContainer.append($elementControls);

  return $newElementContainer;
}

function snte_workspace_bring_to_front($elementContainer) {
  var snteWorkspaceElementsArray = [];
  for(var elementId in snteWorkspaceElements) {
    snteWorkspaceElementsArray.push(snteWorkspaceElements[elementId]);
  }
  
  if (snteWorkspaceElementsArray.length > 0) {
    var snteWorkspaceElementsArraySorted = snteWorkspaceElementsArray.sort(function(a, b) {
      return (parseInt($(a).closest("div.snte-element-container").css("zIndex"), 10) || 0) - (parseInt($(b).closest("div.snte-element-container").css("zIndex"), 10) || 0);
    });

    $(snteWorkspaceElementsArraySorted).each(function(ii) {
      $(this).closest("div.snte-element-container").css("zIndex", ii);
    });
  }

  $elementContainer.css("zIndex", snteWorkspaceElementsArray.length);
}

function snte_workspace_send_to_back($elementContainer) {
  var snteWorkspaceElementsArray = [];
  for(var elementId in snteWorkspaceElements) {
    snteWorkspaceElementsArray.push(snteWorkspaceElements[elementId]);
  }
  
  if (snteWorkspaceElementsArray.length > 0) {
    var snteWorkspaceElementsArraySorted = snteWorkspaceElementsArray.sort(function(a, b) {
      return (parseInt($(a).closest("div.snte-element-container").css("zIndex"), 10) || 0) - (parseInt($(b).closest("div.snte-element-container").css("zIndex"), 10) || 0);
    });

    $(snteWorkspaceElementsArraySorted).each(function(ii) {
      $(this).closest("div.snte-element-container").css("zIndex", ii+1);
    });
  }
  
  $elementContainer.css("zIndex", 0);
}

function snte_workspace_add_table() {
  var nextId = snte_generate_element_id();

  var $newElement = $("<div>").addClass("snte-element snte-element-table").attr("id", "snte-element-"+nextId);

  $newElement.handsontable({
    startRows: 10,
    startCols: 10,
    colHeaders: true,
    rowHeaders: true,
    manualColumnResize: true,
    manualColumnMove: true,
    contextMenu: true,
    scrollV: "none",
    scrollH: "none",
    outsideClickDeselects: false,
    useFormula: true,
    search: {
      searchResultClass: "snte-search-match"
    },
    cells: function (row, col, prop) {
      this.language = i18n.lng();
      this.renderer = snteCellRenderer;
      this.type = "excel";
      this.snteFormats = {
        "numericExplicit": snteCellTypes.numeric.format,
        "numericImplicit": snteCellTypes.numericWithoutComma.format,
        "currency": snteCellTypes.currency.format,
        "percent": snteCellTypes.percent.format
      };
      if(!this.hasOwnProperty("snteExplicitType")) {
        this.snteExplicitType = "auto";
      }
      if(!this.hasOwnProperty("snteWYSIWYG")) {
        this.snteWYSIWYG = {
          "fontFamily": snteWYSIWYG.fontFamily.default,
          "fontSize": snteWYSIWYG.fontSize.default,
          "fontColor": snteWYSIWYG.fontColor.default,
          "fillColor": snteWYSIWYG.fillColor.default,
          "bold": snteWYSIWYG.bold.default,
          "italic": snteWYSIWYG.italic.default,
          "underline": snteWYSIWYG.underline.default,
          "strikethrough": snteWYSIWYG.strikethrough.default,
          "align": snteWYSIWYG.align.default
        };
      }
    },
    afterInit: function () {
      this.selectCell(0, 0);
    },
    afterSelectionEnd: function (row_start, column_start, row_end, column_end) {
      snte_workspace_set_focus(this.rootElement);
      snte_chrome_set_font_controls("table_cell", $(this.getCell(row_start, column_start)));
      snte_chrome_set_type_control({"row": row_start, "col": column_start});
    },
    beforeAutofill: function(start, end, data) {
      var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
      var selectedCells = tableInstance.getSelected(); //[startRow, startCol, endRow, endCol]

      var r, rlen, c, clen, current = {};
      rlen = data.length;
      current.row = start.row;
      current.col = start.col;
      for (r = 0, realR = selectedCells[0]; r < rlen; r++, realR++) {
        if ((end && current.row > end.row)) {
          break;
        }
        current.col = start.col;
        clen = data[r] ? data[r].length : 0;
        for (c = 0, realC = selectedCells[1]; c < clen; c++, realC++) {
          if ((end && current.col > end.col)) {
            break;
          }

          var cellMetaSource = tableInstance.getCellMeta(realR, realC);
          var cellMetaTarget = tableInstance.getCellMeta(current.row, current.col);
          cellMetaTarget.snteWYSIWYG = $.extend(true, {}, cellMetaSource.snteWYSIWYG);
          cellMetaTarget.snteExplicitType = cellMetaSource.snteExplicitType;
          cellMetaTarget.snteImplicitType = cellMetaSource.snteImplicitType;

          current.col++;
          if (end && c === clen - 1) {
            c = -1;
          }
        }
        current.row++;
        if (end && r === rlen - 1) {
          r = -1;
        }
      }
    },
    afterRender: function(isForced) {
      $("span.snte-formula-error").tooltip();
    }
  });
  
  $newElementContainer = snte_workspace_create_element_container(true);

  $addRowControl = $("<div>").addClass("snte-table-control snte-table-control-add-row").append($("<span>").addClass("glyphicon glyphicon-plus").attr("title", $.t("table.add-row")));
  $addRowControl.click(function() {
    var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
    tableInstance.alter("insert_row");
  });
  $newElementContainer.append($addRowControl);
  $addColumnControl = $("<div>").addClass("snte-table-control snte-table-control-add-column").append($("<span>").addClass("glyphicon glyphicon-plus").attr("title", $.t("table.add-column")));
  $addColumnControl.click(function() {
    var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
    tableInstance.alter("insert_col");
  });
  $newElementContainer.append($addColumnControl);

  snte_workspace_make_draggable($newElementContainer);
  snte_workspace_bring_to_front($newElementContainer);

  snteWorkspaceElements[nextId] = $newElement;
  $newElement.appendTo($newElementContainer);
  $newElementContainer.appendTo($snteWorkspace); 
}

function snte_workspace_add_text() {
  var nextId = snte_generate_element_id();

  var $newElement = $("<div>").addClass("snte-element snte-element-text").attr("id", "snte-element-"+nextId).attr("contenteditable", "true").css("width", "200px").css("height", "200px");
  
  $newElementContainer = snte_workspace_create_element_container(false);

  snte_workspace_make_draggable($newElementContainer);
  snte_workspace_bring_to_front($newElementContainer);

  $newElement.focus(function(evt) {
    snte_workspace_set_focus($(this));
    evt.preventDefault();
  });
  $newElement.blur(function(evt) {
    $(this).css("width", "auto");
    $(this).css("height", "auto");
    /*if($(this).text().trim() === "") {
      snte_workspace_remove_element($(this));
    }*/
    evt.preventDefault;
  });
  $newElement.click(function(evt) {
    snte_chrome_set_font_controls("text", $(evt.target));
    evt.preventDefault();
  });

  snteWorkspaceElements[nextId] = $newElement;
  $newElement.appendTo($newElementContainer);
  $newElementContainer.appendTo($snteWorkspace);
  $newElement.focus();
  snte_wysiwyg_apply_font();
}

function snte_workspace_add_comment() {
  var nextId = snte_generate_element_id();

  var $newElement = $("<div>").addClass("snte-element snte-element-comment").attr("id", "snte-element-"+nextId).attr("contenteditable", "true");
  
  $newElementContainer = snte_workspace_create_element_container(false);
  $newElementContainer.width(snteDefaultElementSizes.comment.width).height(snteDefaultElementSizes.comment.height);
  
  snte_workspace_make_draggable($newElementContainer);
  snte_workspace_make_resizable($newElementContainer);
  snte_workspace_bring_to_front($newElementContainer);

  $newElement.focus(function(evt) {
    snte_workspace_set_focus($(this));
    evt.preventDefault();
  });
  $newElement.click(function(evt) {
    snte_chrome_set_font_controls("text", $(evt.target));
    evt.preventDefault();
  });

  snteWorkspaceElements[nextId] = $newElement;
  $newElement.appendTo($newElementContainer);
  $newElementContainer.appendTo($snteWorkspace);
  $newElement.focus();
  snte_wysiwyg_apply_font();

  snte_chrome_show_comments();
  snte_workspace_show_comments();
}

function snte_workspace_add_image(url) {
  var nextId = snte_generate_element_id();

  var $newElement = $("<div>").addClass("snte-element snte-element-image").attr("id", "snte-element-"+nextId);

  $newElementContainer = snte_workspace_create_element_container(false);

  snte_workspace_make_draggable($newElementContainer);
  //snte_workspace_make_resizable($newElementContainer);
  snte_workspace_bring_to_front($newElementContainer);

  async.createImage(url).then(function ($image) {
    $image.css({
      display: '',
      width: Math.min(snteImage.maxWidth, $image.width())+"px"
    });
    $newElement.append($image);
    snteWorkspaceElements[nextId] = $newElement;
    $newElement.appendTo($newElementContainer);
    $newElementContainer.appendTo($snteWorkspace);
    $newElement.focus();
  }).fail(function () {
    alert($.t("image-upload.filetype-error"));
  });
}

function snte_generate_element_id() {
  var date = new Date();
  return "e"+date.getTime();
}

function snte_chrome_toggle_button($btn) {
  if($btn.hasClass("active")) {
    $btn.removeClass("active");
  }
  else {
    $btn.addClass("active");
  }
}

function snte_workspace_show_comments() {
  $("div.snte-element-comment").parent("div.snte-element-container").removeClass("snte-hidden");
}
function snte_workspace_hide_comments() {
  $("div.snte-element-comment").parent("div.snte-element-container").addClass("snte-hidden");
}

function snte_chrome_show_comments() {
  //$("button#snte-menu-toggle-comments").addClass("active").attr("title", $.t("chrome.hide-comments"));
}
function snte_chrome_hide_comments() {
  //$("button#snte-menu-toggle-comments").removeClass("active").attr("title", $.t("chrome.show-comments"));
}

function snte_chome_setup_color_control(type) {
  var $list = $("div#snte-menu-"+type+"-color-container ul.snte-menu-colorselector");

  var $a = $("<a>").attr("href", "#").attr("title", $.t("chrome."+type+"-color-default")).attr("data-value", snteWYSIWYG[type+"Color"].default).addClass("snte-color-btn default selected").css({"border": "1px solid black", "background-color": snteWYSIWYG[type+"Color"].default});
  if($.inArray(snteWYSIWYG[type+"Color"].default, snteFillColorNeedsBlackFont) >= 0) {
    $a.addClass("needs-black-font");
  }
  var $li = $("<li>").addClass("default").append($a);
  $list.append($li);

  for(var ii = 0; ii < snteColorPalette.length; ii++) {
    var color = new Color(snteColorPalette[ii]);
    var $a = $("<a>").attr("href", "#").attr("title", color.toHex()).attr("data-value", snteColorPalette[ii]).addClass("snte-color-btn").css("background-color", snteColorPalette[ii]);
    if($.inArray(snteColorPalette[ii], snteFillColorNeedsBlackFont) >= 0) {
      $a.addClass("needs-black-font");
    }
    var $li = $("<li>").append($a);

    $list.append($li);
  }

  snte_chrome_reset_color_control(type);
}

function snte_chrome_set_color_control(type, colorString) {
  var colorToSet;
  if(colorString === "transparent") {
    colorToSet = "rgba(0,0,0,0)";
  }
  else {
    colorToSet = new Color(colorString).toString("rgba");
  }

  $("span#snte-menu-"+type+"-color-indicator").css("background-color", colorToSet);
  $("button#snte-menu-"+type+"-color").data("value", colorToSet);

  $("div#snte-menu-"+type+"-color-container ul.snte-menu-colorselector li a").removeClass("selected");
  if(colorToSet === snteWYSIWYG[type+"Color"].default) {
    $("div#snte-menu-"+type+"-color-container ul.snte-menu-colorselector li.default a").addClass("selected");  
  }
  else {
    $("div#snte-menu-"+type+"-color-container ul.snte-menu-colorselector li a[data-value='"+colorToSet+"']").not(".default").addClass("selected");  
  }
}

function snte_chrome_reset_color_control(type) {
  $("span#snte-menu-"+type+"-color-indicator").css("background-color", snteWYSIWYG[type+"Color"].default);
  $("button#snte-menu-"+type+"-color").data("value", snteWYSIWYG[type+"Color"].default);

  $("div#snte-menu-"+type+"-color-container ul.snte-menu-colorselector li a").removeClass("selected");
  $("div#snte-menu-"+type+"-color-container ul.snte-menu-colorselector li.default a").addClass("selected");
}

function snte_chrome_reset_font_controls() {
  $("button#snte-menu-font-bold").removeClass("active");
  $("button#snte-menu-font-italic").removeClass("active");
  $("button#snte-menu-font-underline").removeClass("active");
  $("button#snte-menu-font-strikethrough").removeClass("active");
  $("button#snte-menu-font-align-left").addClass("active");
  $("button#snte-menu-font-align-center").removeClass("active");
  $("button#snte-menu-font-align-right").removeClass("active");

  $("div#snte-menu-font-family button span.value").text(snteWYSIWYG.fontFamily.default);
  $("div#snte-menu-font-family button").data("value", snteWYSIWYG.fontFamily.default);

  $("div#snte-menu-font-size button span.value").text(snteWYSIWYG.fontSize.valueToPixelMap[snteWYSIWYG.fontSize.default]);
  $("div#snte-menu-font-size button").data("value", snteWYSIWYG.fontSize.default);

  snte_chrome_reset_color_control("font");
  snte_chrome_reset_color_control("fill");
}

function snte_chrome_set_font_controls(element_type, $source) {
  if(element_type === "text") {
    var valuesToSet = {"family": true, "size": true, "color": true, "fill": true, "bold": true, "italic": true, "underline": true, "strikethrough": true, "list": true};

    $("button#snte-menu-font-bold").removeClass("active");
    $("button#snte-menu-font-italic").removeClass("active");
    $("button#snte-menu-font-underline").removeClass("active");
    $("button#snte-menu-font-strikethrough").removeClass("active");
    $("button#snte-menu-font-align-left").removeClass("active");
    $("button#snte-menu-font-align-center").removeClass("active");
    $("button#snte-menu-font-align-right").removeClass("active");

    $("button#snte-menu-ordered-list").removeClass("active");
    $("button#snte-menu-unordered-list").removeClass("active");

    var $currentElement = $source;
    while(!$currentElement.hasClass("snte-element")) {
      if($currentElement.is("span") && $currentElement.attr("style")) {
        if($currentElement.attr("style").contains("font-family") && valuesToSet.family) {
          $("div#snte-menu-font-family button span.value").text($currentElement.css("font-family"));
          $("div#snte-menu-font-family button").data("value", $currentElement.css("font-family"));
          valuesToSet.family = false;
        }
        if($currentElement.attr("style").contains("color") && valuesToSet.color) {
          snte_chrome_set_color_control("font", $currentElement.css("color"));
          valuesToSet.color = false;
        }
        if($currentElement.attr("style").contains("background-color") && valuesToSet.fill) {
          snte_chrome_set_color_control("fill", $currentElement.css("background-color"));
          valuesToSet.fill = false;
        }
        if($currentElement.attr("style").contains("font-weight") && valuesToSet.bold) {
          $("button#snte-menu-font-bold").addClass("active");
          valuesToSet.bold = false;
        }
        if($currentElement.attr("style").contains("font-style") && valuesToSet.italic) {
          $("button#snte-menu-font-italic").addClass("active");
          valuesToSet.italic = false;
        }
        if($currentElement.attr("style").contains("text-decoration")) {
          if($currentElement.attr("style").contains("underline") && valuesToSet.underline) {
            $("button#snte-menu-font-underline").addClass("active");
            valuesToSet.underline = false;
          }
          if($currentElement.attr("style").contains("line-through") && valuesToSet.strikethrough) {
            $("button#snte-menu-font-strikethrough").addClass("active");
            valuesToSet.strikethrough = false;
          }
        }
      }
      if($currentElement.is("div") && $currentElement.attr("style")) {
        if($currentElement.attr("style").contains("text-align")) {
          $("button#snte-menu-font-align-"+$currentElement.css("text-align")).addClass("active");
        }
      }
      if($currentElement.is("font") && $currentElement.attr("size")) {
        if(valuesToSet.size) {
          $("div#snte-menu-font-size button span.value").text(snteWYSIWYG.fontSize.valueToPixelMap[$currentElement.attr("size")]);
          $("div#snte-menu-font-size button").data("value", $currentElement.attr("size"));
          valuesToSet.size = false;
        }
      }
      if($currentElement.is("ul")) {
        if(valuesToSet.list) {
          $("button#snte-menu-unordered-list").addClass("active");
          valuesToSet.list = false;
        }
      }
      if($currentElement.is("ol")) {
        if(valuesToSet.list) {
          $("button#snte-menu-ordered-list").addClass("active");
          valuesToSet.list = false;
        }
      }
      $currentElement = $currentElement.parent();
    }
  }
  else if(element_type === "table_cell") {
    var cellIsSearchMatch = $source.hasClass("snte-search-match");
    if(cellIsSearchMatch) {
      $source.removeClass("snte-search-match");
    }
    $("button#snte-menu-font-bold").removeClass("active");
    $("button#snte-menu-font-italic").removeClass("active");
    $("button#snte-menu-font-underline").removeClass("active");
    $("button#snte-menu-font-strikethrough").removeClass("active");
    $("button#snte-menu-font-align-left").removeClass("active");
    $("button#snte-menu-font-align-center").removeClass("active");
    $("button#snte-menu-font-align-right").removeClass("active");

    if($source.attr("style") && $source.attr("style").contains("font-family")) {
      $("div#snte-menu-font-family button span.value").text($source.css("font-family"));
      $("div#snte-menu-font-family button").data("value", $source.css("font-family"));
    }
    else {
      $("div#snte-menu-font-family button span.value").text(snteWYSIWYG.fontFamily.default);
      $("div#snte-menu-font-family button").data("value", snteWYSIWYG.fontFamily.default);
    }

    if($source.attr("style") && $source.attr("style").contains("font-size")) {
      $("div#snte-menu-font-size button span.value").text($source.css("font-size").replace("px",""));
      $("div#snte-menu-font-size button").data("value", snteWYSIWYG.fontSize.pixelToValueMap[$source.css("font-size")]);
    }
    else {
      $("div#snte-menu-font-size button span.value").text(snteWYSIWYG.fontSize.valueToPixelMap[snteWYSIWYG.fontSize.default]);
      $("div#snte-menu-font-size button").data("value", snteWYSIWYG.fontSize.default);
    }

    if($source.attr("style") && $source.attr("style").contains("color")) {
      snte_chrome_set_color_control("font", $source.css("color"));
    }
    else {
      snte_chrome_reset_color_control("font");
    }

    if($source.attr("style") && $source.attr("style").contains("background")) {
      snte_chrome_set_color_control("fill", $source.css("background-color"));
    }
    else {
      snte_chrome_reset_color_control("fill");
    }

    if($source.attr("style") && $source.attr("style").contains("font-weight") && ($source.css("font-weight") === "bold" || parseInt($source.css("font-weight")) === 700)) {
      $("button#snte-menu-font-bold").addClass("active");
    }

    if($source.attr("style") && $source.attr("style").contains("font-style") && $source.css("font-style") === "italic") {
      $("button#snte-menu-font-italic").addClass("active");
    }

    if($source.attr("style") && $source.attr("style").contains("text-decoration")) {
      if($source.attr("style").contains("underline")) {
        $("button#snte-menu-font-underline").addClass("active");
      }
      if($source.attr("style").contains("line-through")) {
        $("button#snte-menu-font-strikethrough").addClass("active");
      }
    }

    if($source.attr("style") && $source.attr("style").contains("text-align")) {
      $("button#snte-menu-font-align-"+$source.css("text-align")).addClass("active");
    }

    if(cellIsSearchMatch) {
      $source.addClass("snte-search-match");
    }
  }
}

function snte_chrome_set_type_control(cell) {
  var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
  var cellMeta = tableInstance.getCellMeta(cell.row, cell.col);
  var snteType = cellMeta.snteExplicitType ? cellMeta.snteExplicitType : cellMeta.snteImplicitType;

  $("div#snte-menu-cell-type button span.value").text(snteCellTypes[snteType].title);
  $("div#snte-menu-cell-type button").data("value", snteType);
  $("div#snte-menu-cell-type ul.dropdown-menu li").removeClass("active");
  $("div#snte-menu-cell-type ul.dropdown-menu li a[data-value='"+snteType+"']").closest("li").addClass("active");

}