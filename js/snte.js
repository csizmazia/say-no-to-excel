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

  var drawChart = function(chartObj, chartData, chartOptions) {
    return $.Deferred(function (deferred) {
      chartObj.draw(chartData, chartOptions);
      deferred.resolve();
    }).promise();
  };

  return {
    readFileAsDataURL: readFileAsDataURL,
    createImage: createImage,
    drawChart: drawChart
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
var snteTrash = [];
var $snteWorkspaceFocusedElement;
var snteWorkspaceErrorModalVisible = false;
var snteLastCellError = {};
var snteCellEditorOpened = false;
var snteTableCounter = 0;
var snteChartCounter = 0;
var snteCharts = {};
var snteWorkspaceDragHelper; // used to store drag starting position

var snteUndoManager = new UndoManager();
var snteUndoTypeTimeout = 0;

var snteImage = {"maxWidth": 500};

var snteChromeSize = {"left": {"width": 0}, "top": {"height": 115}};
var snteWorkspaceSize = {"width": 9999999999, "height": 9999999999};
var snteDefaultElementSizes = {"comment": {"width": 275, "height": 150}, "chart": {"width": 400, "height": 300}};

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
    $(td).addClass("snte-formula");
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

  snteUndoManager.setCallback(snte_chrome_set_undo_controls);

  i18n.init({ detectLngQS: 'lang', cookieName: 'lang', fallbackLng: 'en', debug: false }, function(t) {
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

    var os = navigator.userAgent.indexOf('Mac') === -1 ? "pc" : "mac";
    $("#snte-copypaste-modal-shortcut-command-copy").text(t("copy-paste.hint.cmd-copy-"+os));
    $("#snte-copypaste-modal-shortcut-command-cut").text(t("copy-paste.hint.cmd-cut-"+os));
    $("#snte-copypaste-modal-shortcut-command-paste").text(t("copy-paste.hint.cmd-paste-"+os));
  });

  //google.load('visualization', '1.0', {'packages':['corechart']});
}






















/*
##############################
SNTE CHROME
##############################
*/

function snte_chrome_toggle_button($btn) {
  if($btn.hasClass("active")) {
    $btn.removeClass("active");
  }
  else {
    $btn.addClass("active");
  }
}

function snte_chrome_set_undo_controls() {
  if(snteUndoManager.hasUndo()) {
    $("button#snte-menu-undo").removeClass("disabled").addClass("enabled");
  }
  else {
    $("button#snte-menu-undo").removeClass("enabled").addClass("disabled");
  }

  if(snteUndoManager.hasRedo()) {
    $("button#snte-menu-redo").removeClass("disabled").addClass("enabled");
  }
  else {
    $("button#snte-menu-redo").removeClass("enabled").addClass("disabled");
  }
}

function snte_chrome_show_comments() {
  //$("button#snte-menu-toggle-comments").addClass("active").attr("title", i18n.t("chrome.hide-comments"));
}
function snte_chrome_hide_comments() {
  //$("button#snte-menu-toggle-comments").removeClass("active").attr("title", i18n.t("chrome.show-comments"));
}

function snte_chome_setup_color_control(type) {
  var $list = $("div#snte-menu-"+type+"-color-container ul.snte-menu-colorselector");

  var $a = $("<a>").attr("href", "#").attr("title", i18n.t("chrome."+type+"-color-default")).attr("data-value", snteWYSIWYG[type+"Color"].default).addClass("snte-color-btn default selected").css({"border": "1px solid black", "background-color": snteWYSIWYG[type+"Color"].default});
  if($.inArray(snteWYSIWYG[type+"Color"].default, snteFillColorNeedsBlackFont) >= 0) {
    $a.addClass("needs-black-font");
  }
  var $li = $("<li>").addClass("default").append($a);
  $list.append($li);

  for(var ii = 0; ii < snteColorPalette.length; ii++) {
    var color = new Color(snteColorPalette[ii]);
    $a = $("<a>").attr("href", "#").attr("title", color.toHex()).attr("data-value", snteColorPalette[ii]).addClass("snte-color-btn").css("background-color", snteColorPalette[ii]);
    if($.inArray(snteColorPalette[ii], snteFillColorNeedsBlackFont) >= 0) {
      $a.addClass("needs-black-font");
    }
    $li = $("<li>").append($a);

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

function snte_chrome_setup_key_shortcuts() {
  $(document).on("keydown", function(event) {
    if(event.metaKey || event.ctrlKey) {
      if(event.keyCode === 65) { // A
        event.stopImmediatePropagation(); // prevent native handling by handsontable
      }
      if(event.keyCode === 70) { // F
        // search
        event.preventDefault();
        $("button#snte-menu-toggle-search").click();
      }
      else if(event.keyCode === 90) { // Z
        event.preventDefault();
        event.stopImmediatePropagation(); // prevent native handling by handsontable
        if(event.shiftKey) {
          // redo
          $("button#snte-menu-redo").click();
        }
        else {
          // undo
          $("button#snte-menu-undo").click();
        }
      }
      else if(event.keyCode === 89) { // Y
        // redo
        event.preventDefault();
        event.stopImmediatePropagation(); // prevent native handling by handsontable
        $("button#snte-menu-redo").click();
      }
      else if(event.keyCode === 66) { // B
        // bold
        event.preventDefault();
        $("button#snte-menu-font-bold").click();
      }
      else if(event.keyCode === 73) { // I
        // italic
        event.preventDefault();
        $("button#snte-menu-font-italic").click();
      }
      else if(event.keyCode === 85) { // U
        // underline
        event.preventDefault();
        $("button#snte-menu-font-underline").click();
      }
      else if(event.keyCode === 83 && event.shiftKey) { // S
        // strikethrough
        event.preventDefault();
        $("button#snte-menu-font-strikethrough").click();
      }
      else if(event.keyCode === 76 && event.shiftKey) { // L
        // justify left
        event.preventDefault();
        $("button#snte-menu-font-align-left").click();
      }
      else if(event.keyCode === 67 && event.shiftKey) { // C
        // justify center
        event.preventDefault();
        $("button#snte-menu-font-align-center").click();
      }
      else if(event.keyCode === 82 && event.shiftKey) { // R
        // justify right
        event.preventDefault();
        $("button#snte-menu-font-align-right").click();
      }
    }
  });
}

function snte_chrome_setup() {
  snte_chrome_setup_key_shortcuts();

  snte_chrome_setup_image_control();
  snte_chrome_setup_chart_control();

  snte_chome_setup_color_control("font");
  snte_chome_setup_color_control("fill");
  $(".snte-color-btn").tooltip({
    container: "body",
    placement: "bottom",
    trigger: "hover",
    animation: false
  }).click(function() { $(this).tooltip("hide"); });

  snte_chrome_setup_formula_controls();

  $("button#snte-menu-undo").click(function(event) {
    if(snteUndoManager.hasUndo()) {
      snteUndoManager.undo();
    }
  });
  $("button#snte-menu-redo").click(function(event) {
    if(snteUndoManager.hasRedo()) {
      snteUndoManager.redo();
    }
  });

  $("button#snte-menu-copy").click(function(event) {
    $("div#snte-copypaste-modal").modal("show");
  });
  $("button#snte-menu-cut").click(function(event) {
    $("div#snte-copypaste-modal").modal("show");
  });
  $("button#snte-menu-paste").click(function(event) {
    $("div#snte-copypaste-modal").modal("show");
  });
  $("div#snte-copypaste-modal").on("shown.bs.modal", function() {
    // so that the modal can be closed with enter-key
    $(this).find("button.btn-primary").focus();
  });

  $("div#snte-menu-add-element ul.dropdown-menu li a").click(function(event) {
    snte_workspace_add_element($(this).data("item"));
    
    event.preventDefault();
  });
  $("div#snte-menu-add-element button").popover({
    placement: "auto bottom",
    title: i18n.t("help.start-here-title"),
    content: i18n.t("help.start-here-message"),
    container: "body",
    html: true
  }).popover("show").click(function(event) {
    $(this).popover("hide");
  });

  $("button").tooltip({
    container: "body",
    placement: "bottom",
    trigger: "hover",
    html: true,
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

  $("button#snte-menu-toggle-search").click(function(event) {
    snte_chrome_toggle_button($(this));
    if($(this).hasClass("active")) {
      snte_chrome_setup_search();
      snte_workspace_reset_focus(void 0);
      $("input.snte-menu-search-input").focus();
    }
  });

  $("button#snte-menu-toggle-comments").click(function(event) {
    snte_chrome_toggle_button($(this));
    if($(this).hasClass("active")) {
      snte_chrome_show_comments();
      snte_workspace_show_comments();
    }
    else {
      snte_chrome_hide_comments();
      snte_workspace_hide_comments();
    }
  });

  $("button#snte-menu-font-bold").click(function() {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_bold(true);
  });
  $("button#snte-menu-font-italic").click(function() {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_italic(true);
  });
  $("button#snte-menu-font-underline").click(function() {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_underline(true);
  });
  $("button#snte-menu-font-strikethrough").click(function() {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_strikethrough(true);
  });
  $("button#snte-menu-font-align-left").click(function() {
    $("button#snte-menu-font-align-center").removeClass("active");
    $("button#snte-menu-font-align-right").removeClass("active");
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_align("left", true);
  });
  $("button#snte-menu-font-align-center").click(function() {
    $("button#snte-menu-font-align-left").removeClass("active");
    $("button#snte-menu-font-align-right").removeClass("active");
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_align("center", true);
  });
  $("button#snte-menu-font-align-right").click(function() {
    $("button#snte-menu-font-align-left").removeClass("active");
    $("button#snte-menu-font-align-center").removeClass("active");
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_align("right", true);
  });
  $("div#snte-menu-font-family ul.dropdown-menu li a").click(function(event) {
    $("div#snte-menu-font-family ul.dropdown-menu li").removeClass("active");
    $(this).closest("li").addClass("active");
    $("div#snte-menu-font-family button span.value").text($(this).text());
    $("div#snte-menu-font-family button").data("value", $(this).data("value"));

    snte_wysiwyg_apply_font_family(true);

    event.preventDefault();
  });
  $("div#snte-menu-font-size ul.dropdown-menu li a").click(function(event) {
    $("div#snte-menu-font-size ul.dropdown-menu li").removeClass("active");
    $(this).closest("li").addClass("active");
    $("div#snte-menu-font-size button span.value").text($(this).text());
    $("div#snte-menu-font-size button").data("value", $(this).data("value"));

    snte_wysiwyg_apply_font_size(true);

    event.preventDefault();
  });
  $("div#snte-menu-font-color-container ul.dropdown-menu li a").click(function(event) {
    snte_chrome_set_color_control("font", $(this).data("value"));
    snte_wysiwyg_apply_font_color(true);

    event.preventDefault();
  });
  $("div#snte-menu-fill-color-container ul.dropdown-menu li a").click(function(event) {
    snte_chrome_set_color_control("fill", $(this).data("value"));
    snte_wysiwyg_apply_fill_color(true);

    event.preventDefault();
  });

  $("button#snte-menu-ordered-list").click(function() {
    if($snteWorkspaceFocusedElement !== void 0) {
      if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
        snte_chrome_toggle_button($(this));
        $("button#snte-menu-unordered-list").removeClass("active");
        snte_wysiwyg_exec_command("insertorderedlist", null);
        $snteWorkspaceFocusedElement.focus();
        
        snte_wysiwyg_undoable_action($snteWorkspaceFocusedElement);
      }
    }
  });
  $("button#snte-menu-unordered-list").click(function() {
    if($snteWorkspaceFocusedElement !== void 0) {
      if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
        snte_chrome_toggle_button($(this));
        $("button#snte-menu-ordered-list").removeClass("active");
        snte_wysiwyg_exec_command("insertunorderedlist", null);
        $snteWorkspaceFocusedElement.focus();

        snte_wysiwyg_undoable_action($snteWorkspaceFocusedElement);
      }
    }
  });

  $("div#snte-menu-cell-type ul.dropdown-menu li a").click(function(event) {
    $("div#snte-menu-cell-type ul.dropdown-menu li").removeClass("active");
    $(this).closest("li").addClass("active");
    $("div#snte-menu-cell-type button span.value").text(snteCellTypes[$(this).data("value")].title);
    $("div#snte-menu-cell-type button").data("value", $(this).data("value"));

    snte_table_apply_cell_type();

    event.preventDefault();
  });
}

function snte_chrome_setup_formula_controls() {
  $("div#snte-menubar-formula button").click(function(event) {
    snte_table_put_formula($(this).data("value"));
    event.stopImmediatePropagation();
  }).on("mousedown", function(event) {
    event.stopImmediatePropagation();
  }).on("mouseover", function(event) {
    $("div#snte-menubar-formula-help").html(i18n.t($(this).attr("id").replace("snte-menu-","").replace(/-/g,".")+".help"));
    event.stopImmediatePropagation();
  }).on("mouseout", function(event) {
    $("div#snte-menubar-formula-help").html("<span class=\"syntax\">&nbsp;</span>");
    event.stopImmediatePropagation();
  });
}

function snte_chrome_setup_image_control() {
  if(!window.FileReader) {
    $("div#snte-image-upload-dropzone").addClass("snte-hidden");
  }
  else {
    $('div#snte-image-upload-dropzone').bind('dragover', function(event) {
      $(event.target).addClass("dragover");

      event.stopPropagation();
      event.preventDefault();
    }).bind('dragleave', function(event) {
      $(event.target).removeClass("dragover");
    }).bind('drop', function(event) {
      $(event.target).removeClass("dragover");
      $("#snte-image-modal").modal("hide");
      var dataTransfer = event.originalEvent.dataTransfer;
      if (dataTransfer && dataTransfer.files) {
        $.each(dataTransfer.files, function(idx, file) {
          async.readFileAsDataURL(file).then(function(url) {
            snte_workspace_add_image(url);
          }).fail(function () {
            alert(t("image-upload.upload-error"));
          });
        });
      }
     
      event.stopPropagation();
      event.preventDefault();
    });

    $("body").bind('dragover', function(event) {
      event.stopPropagation();
      event.preventDefault();
    }).bind('drop', function(event) {
      var dataTransfer = event.originalEvent.dataTransfer;
      if (dataTransfer && dataTransfer.files) {
        $.each(dataTransfer.files, function(idx, file) {
          async.readFileAsDataURL(file).then(function(url) {
            snte_workspace_add_image(url);
          }).fail(function () {
            alert(t("image-upload.upload-error"));
          });
        });
      }
     
      event.stopPropagation();
      event.preventDefault();
    });
  }

  $("#snte-image-modal").on("shown.bs.modal", function(event) {
    $("input#snte-image-link").val("").focus();
  });
  $("#snte-image-add-tab-link-header a").on("shown.bs.tab", function(event) {
    $("input#snte-image-link").focus();
  });
  $("input#snte-image-link").on("keyup", function(event) {
    if(event.keyCode === Handsontable.helper.keyCode.ENTER) {
      if($(this).val().trim() !== "") {
        snte_workspace_add_image($(this).val());
      }
    }
  });
  $("button#snte-image-upload-ok").click(function(event) {
    if($("#snte-image-add-tab-link-header").hasClass("active") && $("input#snte-image-link").val().trim() !== "") {
      snte_workspace_add_image($("input#snte-image-link").val());
    }
  });
}

function snte_chrome_setup_chart_control() {
  $("#snte-chart-modal").on("shown.bs.modal", function(event) {
    $("input#snte-chart-wizard-title").val("").focus();
    $("input#snte-chart-wizard-xaxis").val("");
    $("input#snte-chart-wizard-yaxis").val("");
    $("input#snte-chart-wizard-first-data-row").attr("checked", "checked");
    var selectedCells = snte_table_normalize_cell_selection($snteWorkspaceFocusedElement.handsontable("getInstance").getSelected());
    $("div#snte-chart-wizard-cellrange").html(i18n.t("chart.wizard.data-table")+": "+snte_table_get_title($snteWorkspaceFocusedElement)+"<br />"+i18n.t("chart.wizard.data-cellrange")+": <span class=\"syntax\"><span class=\"cellrange\">"+Handsontable.helper.spreadsheetColumnLabel(selectedCells[1])+(selectedCells[0]+1)+"</span>:<span class=\"cellrange\">"+Handsontable.helper.spreadsheetColumnLabel(selectedCells[3])+(selectedCells[2]+1)+"</span></span>");
  });
  $("#snte-chart-modal button.snte-chart-wizard-type").click(function(event) {
    $("#snte-chart-modal button.snte-chart-wizard-type").removeClass("active");
    $(this).addClass("active");
  }).tooltip();
  $("button#snte-chart-wizard-ok").click(function(event) {
    snte_workspace_add_chart($("#snte-chart-modal button.snte-chart-wizard-type.active").data("value"));
  });
  $("input#snte-chart-wizard-title, input#snte-chart-wizard-xaxis, input#snte-chart-wizard-yaxis").on("keyup", function(event) {
    if(event.keyCode === Handsontable.helper.keyCode.ENTER) {
      snte_workspace_add_chart($("#snte-chart-modal button.snte-chart-wizard-type.active").data("value"));
      $("#snte-chart-modal").modal("hide");
    }
  });
}

function snte_chrome_setup_search() {
  $("div.popover-content button.snte-menu-search-next").off("click").click(function() {
    $(this).tooltip("hide");
    snte_search_mark("next");
  });
  $("div.popover-content button.snte-menu-search-prev").off("click").click(function() {
    $(this).tooltip("hide");
    snte_search_mark("prev");
  });
  $("div.popover-content button.snte-menu-search-clear").off("click").click(function() {
    $(this).tooltip("hide");
    $("button#snte-menu-toggle-search").click();
    snte_reset_search();
  });
  $("div.popover-content input.snte-menu-search-input").off("keyup").keyup(function(event) {
    if(event.which === Handsontable.helper.keyCode.ENTER) {
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
    else if(event.which === Handsontable.helper.keyCode.ESCAPE) {
      $("div.popover-content button.snte-menu-search-clear").click();
    }
    else {
      $(this).closest("div").removeClass("has-success has-error");
      $("div.popover div.snte-searchbox-resultcount").html("<img src=\"img/loading-icon-16x16.gif\" alt=\""+i18n.t("search.wait")+"\" title=\""+i18n.t("search.wait")+"\" />");

      clearTimeout(snteSearchTypeTimeout);
      snteSearchTypeTimeout = setTimeout(function() { snte_search($("div.popover-content input.snte-menu-search-input").val()); }, 200);
    }
  });
}




















/*
##############################
SNTE SEARCH
##############################
*/

function snte_reset_search_on_element($elem) {
  if($elem.hasClass("snte-element-text")) {
    $elem.unhighlight({"className": "snte-search-match"});
  }
  else if($elem.hasClass("snte-element-comment")) {
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

    $("div.popover div.snte-searchbox-resultcount").text(i18n.t("search.resultcount", { count: snteSearchResultCounter }));
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




















/*
##############################
SNTE WYSIWYG
##############################
*/

function snte_wysiwyg_undoable_action($elem, contentBefore, contentAfter) {
  var elementId = $elem.attr("id").replace("snte-element-", "");

  snteUndoManager.add({
    undo: function() {
      if(snteWorkspaceElements[elementId]) {
        $elem.html(contentBefore);
        $elem.focus();
        snte_chrome_set_font_controls("text", $elem);
      }
    },
    redo: function() {
      if(snteWorkspaceElements[elementId]) {
        $elem.html(contentAfter);
        $elem.focus();
        snte_chrome_set_font_controls("text", $elem);
      }
    }
  });
}

function snte_wysiwyg_apply_font(recordUndo) {
  snte_wysiwyg_apply_font_family(recordUndo);
  snte_wysiwyg_apply_font_size(recordUndo);
  snte_wysiwyg_apply_font_color(recordUndo);
  snte_wysiwyg_apply_fill_color(recordUndo);
  snte_wysiwyg_apply_font_styles(recordUndo);
  snte_wysiwyg_apply_font_aligns(recordUndo);
}

function snte_wysiwyg_apply_font_aligns(recordUndo) {
  if($("button#snte-menu-font-align-left").hasClass("active")) {
    snte_wysiwyg_apply_font_align("left", recordUndo);
  }
  else if($("button#snte-menu-font-align-center").hasClass("active")) {
    snte_wysiwyg_apply_font_align("center");
  }
  else if($("button#snte-menu-font-align-right").hasClass("active")) {
    snte_wysiwyg_apply_font_align("right");
  }
}

function snte_wysiwyg_apply_font_align(value, recordUndo) {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      var contentBefore;
      var contentAfter;
      if(recordUndo) {
        contentBefore = $snteWorkspaceFocusedElement.html();
      }

      snte_wysiwyg_exec_command("justify"+value.capitalize(), null);

      if(recordUndo) {
        contentAfter = $snteWorkspaceFocusedElement.html();
      }

      $snteWorkspaceFocusedElement.focus();

      if(recordUndo) {
        snte_wysiwyg_undoable_action($snteWorkspaceFocusedElement, contentBefore, contentAfter);
      }
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("align", value);
    }
  }
}

function snte_wysiwyg_apply_font_styles(recordUndo) {
  if($("button#snte-menu-font-bold").hasClass("active")) {
    snte_wysiwyg_apply_font_bold(recordUndo);
  }
  if($("button#snte-menu-font-italic").hasClass("active")) {
    snte_wysiwyg_apply_font_italic(recordUndo);
  }
  if($("button#snte-menu-font-underline").hasClass("active")) {
    snte_wysiwyg_apply_font_underline(recordUndo);
  }
  if($("button#snte-menu-font-strikethrough").hasClass("active")) {
    snte_wysiwyg_apply_font_strikethrough(recordUndo);
  }
}

function snte_wysiwyg_apply_font_bold(recordUndo) {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      var contentBefore;
      var contentAfter;
      if(recordUndo) {
        contentBefore = $snteWorkspaceFocusedElement.html();
      }

      snte_wysiwyg_exec_command("bold", null);
      
      if(recordUndo) {
        contentAfter = $snteWorkspaceFocusedElement.html();
      }

      $snteWorkspaceFocusedElement.focus();

      if(recordUndo) {
        snte_wysiwyg_undoable_action($snteWorkspaceFocusedElement, contentBefore, contentAfter);
      }
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("bold", $("button#snte-menu-font-bold").hasClass("active"));
    }
  }
}
function snte_wysiwyg_apply_font_italic(recordUndo) {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      var contentBefore;
      var contentAfter;
      if(recordUndo) {
        contentBefore = $snteWorkspaceFocusedElement.html();
      }

      snte_wysiwyg_exec_command("italic", null);
      
      if(recordUndo) {
        contentAfter = $snteWorkspaceFocusedElement.html();
      }

      $snteWorkspaceFocusedElement.focus();

      if(recordUndo) {
        snte_wysiwyg_undoable_action($snteWorkspaceFocusedElement, contentBefore, contentAfter);
      }
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("italic", $("button#snte-menu-font-italic").hasClass("active"));
    }
  }
}
function snte_wysiwyg_apply_font_underline(recordUndo) {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      var contentBefore;
      var contentAfter;
      if(recordUndo) {
        contentBefore = $snteWorkspaceFocusedElement.html();
      }

      snte_wysiwyg_exec_command("underline", null);
      
      if(recordUndo) {
        contentAfter = $snteWorkspaceFocusedElement.html();
      }

      $snteWorkspaceFocusedElement.focus();

      if(recordUndo) {
        snte_wysiwyg_undoable_action($snteWorkspaceFocusedElement, contentBefore, contentAfter);
      }
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("underline", $("button#snte-menu-font-underline").hasClass("active"));
    }
  }
}
function snte_wysiwyg_apply_font_strikethrough(recordUndo) {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      var contentBefore;
      var contentAfter;
      if(recordUndo) {
        contentBefore = $snteWorkspaceFocusedElement.html();
      }

      snte_wysiwyg_exec_command("strikeThrough", null);
      
      if(recordUndo) {
        contentAfter = $snteWorkspaceFocusedElement.html();
      }

      $snteWorkspaceFocusedElement.focus();

      if(recordUndo) {
        snte_wysiwyg_undoable_action($snteWorkspaceFocusedElement, contentBefore, contentAfter);
      }
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("strikethrough", $("button#snte-menu-font-strikethrough").hasClass("active"));
    }
  }
}

function snte_wysiwyg_apply_font_family(recordUndo) {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      var contentBefore;
      var contentAfter;
      if(recordUndo) {
        contentBefore = $snteWorkspaceFocusedElement.html();
      }

      snte_wysiwyg_exec_command("fontName", $("div#snte-menu-font-family button").data("value"));
      
      if(recordUndo) {
        contentAfter = $snteWorkspaceFocusedElement.html();
      }

      $snteWorkspaceFocusedElement.focus();

      if(recordUndo) {
        snte_wysiwyg_undoable_action($snteWorkspaceFocusedElement, contentBefore, contentAfter);
      }
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("fontFamily", $("div#snte-menu-font-family button").data("value"));
    }
  }
}

function snte_wysiwyg_apply_font_size(recordUndo) {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      var contentBefore;
      var contentAfter;
      if(recordUndo) {
        contentBefore = $snteWorkspaceFocusedElement.html();
      }

      snte_wysiwyg_exec_command("fontSize", $("div#snte-menu-font-size button").data("value"));
      
      if(recordUndo) {
        contentAfter = $snteWorkspaceFocusedElement.html();
      }

      $snteWorkspaceFocusedElement.focus();

      if(recordUndo) {
        snte_wysiwyg_undoable_action($snteWorkspaceFocusedElement, contentBefore, contentAfter);
      }
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("fontSize", $("div#snte-menu-font-size button").data("value"));
    }
  }
}

function snte_wysiwyg_apply_font_color(recordUndo) {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      var contentBefore;
      var contentAfter;
      if(recordUndo) {
        contentBefore = $snteWorkspaceFocusedElement.html();
      }

      snte_wysiwyg_exec_command("foreColor", $("button#snte-menu-font-color").data("value"));
      
      if(recordUndo) {
        contentAfter = $snteWorkspaceFocusedElement.html();
      }

      $snteWorkspaceFocusedElement.focus();

      if(recordUndo) {
        snte_wysiwyg_undoable_action($snteWorkspaceFocusedElement, contentBefore, contentAfter);
      }
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("fontColor", $("button#snte-menu-font-color").data("value"));
    }
  }
}

function snte_wysiwyg_apply_fill_color(recordUndo) {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      var contentBefore;
      var contentAfter;
      if(recordUndo) {
        contentBefore = $snteWorkspaceFocusedElement.html();
      }

      snte_wysiwyg_exec_command("hiliteColor", $("button#snte-menu-fill-color").data("value"));
      
      if(recordUndo) {
        contentAfter = $snteWorkspaceFocusedElement.html();
      }

      $snteWorkspaceFocusedElement.focus();

      if(recordUndo) {
        snte_wysiwyg_undoable_action($snteWorkspaceFocusedElement, contentBefore, contentAfter);
      }
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("fillColor", $("button#snte-menu-fill-color").data("value"));
    }
  }
}

function snte_wysiwyg_update_table_cell_meta(field, value) {
  var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
  var selectedCells = snte_table_normalize_cell_selection(tableInstance.getSelected()); //[startRow, startCol, endRow, endCol]
  var oldCellMetaValues = []; // used for undo
  for(var row = selectedCells[0]; row <= selectedCells[2]; row++) {
    oldCellMetaValues[row] = [];
    for(var col = selectedCells[1]; col <= selectedCells[3]; col++) {
      var cellMeta = tableInstance.getCellMeta(row, col);
      oldCellMetaValues[row][col] = cellMeta.snteWYSIWYG[field];
      cellMeta.snteWYSIWYG[field] = value;
    }
  }
  tableInstance.render();

  snteUndoManager.add({
    undo: function() {
      for(var row = selectedCells[0]; row <= selectedCells[2]; row++) {
        for(var col = selectedCells[1]; col <= selectedCells[3]; col++) {
          var cellMeta = tableInstance.getCellMeta(row, col);
          cellMeta.snteWYSIWYG[field] = oldCellMetaValues[row][col];
        }
      }
      tableInstance.render();
    },
    redo: function() {
      for(var row = selectedCells[0]; row <= selectedCells[2]; row++) {
        for(var col = selectedCells[1]; col <= selectedCells[3]; col++) {
          var cellMeta = tableInstance.getCellMeta(row, col);
          cellMeta.snteWYSIWYG[field] = value;
        }
      }
      tableInstance.render();
    }
  });
}

function snte_wysiwyg_exec_command(name, value) {
  document.execCommand("styleWithCSS", false, "true");
  document.execCommand(name, false, value);
}




















/*
##############################
SNTE WORKSPACE
##############################
*/

function snte_workspace_restore_element() {
  snte_chrome_reset_font_controls();

  var $elementContainer = snteTrash.pop();
  if($elementContainer) { // because empty textfields are deleted automatically (without being moved to trash) it is possible that an undo action is available but trash is empty. therefore this if.
    var $elem = $elementContainer.find("div.snte-element");
    var elementId = $elem.attr("id").replace("snte-element-", "");

    snteWorkspaceElements[elementId] = $elem;
    if($elem.hasClass("snte-element-chart")) {
      snteCharts[elementId] = $elem;
    }
    $snteWorkspace.append($elementContainer);
    $("div#snte-menu-add-element button").popover("hide");

    if($elem.hasClass("snte-element-text") || $elem.hasClass("snte-element-comment")) {
      $elem.focus();
    }
    else {
      snte_workspace_set_focus($elem);
    }
    $.scrollTo($elem, 800);
  }
}

function snte_workspace_remove_element($elem, moveToTrash) {
  if(moveToTrash) {
    snte_workspace_reset_focus(void 0);
  }

  var elementId = $elem.attr("id").replace("snte-element-", "");

  if(snteWorkspaceElements[elementId]) {
    // delete is slow: http://stackoverflow.com/questions/208105/how-to-remove-a-property-from-a-javascript-object
    delete snteWorkspaceElements[elementId];

    if($elem.hasClass("snte-element-chart")) {
      delete snteCharts[elementId];
    }

    if(moveToTrash) {
      snteTrash.push($elem.closest("div.snte-element-container"));
      $elem.closest("div.snte-element-container").detach();
    }
    else {
      $elem.closest("div.snte-element-container").remove();
    }
  }

  if(Object.size(snteWorkspaceElements) === 0) {
    $("div#snte-menu-add-element button").popover("show");
  }
}

function snte_workspace_remove_element_confirm(event) {
  //if(confirm(i18n.t("chrome.delete-element-confirm"))) {
    snte_workspace_remove_element_useraction($(event.target).closest("div.snte-element-container").find("div.snte-element"));
  //}
}

function snte_workspace_remove_element_useraction($elem) {
  snteUndoManager.add({
    undo: function() {
      snte_workspace_restore_element();
    },
    redo: function() {
      snte_workspace_remove_element($elem, true);
    }
  });

  snte_workspace_remove_element($elem, true);
}

function snte_workspace_reset_focus($becauseOfElem) {
  if($snteWorkspaceFocusedElement !== void 0 && jQuery.contains(document, $snteWorkspaceFocusedElement[0])) {
    snte_chrome_reset_font_controls();

    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      $snteWorkspaceFocusedElement.blur();
      $("button#snte-menu-unordered-list").addClass("disabled");
      $("button#snte-menu-ordered-list").addClass("disabled");
      if($snteWorkspaceFocusedElement.hasClass("snte-element-text")) {
        if($snteWorkspaceFocusedElement.text().trim() === "") {
          snte_workspace_remove_element($snteWorkspaceFocusedElement, false);
        }
      }
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      $snteWorkspaceFocusedElement.handsontable("getInstance").deselectCell();
      $("div#snte-menu-cell-type button").addClass("disabled");
      $("li#snte-menu-add-element-chart").addClass("disabled");
      if($becauseOfElem === void 0 || ($becauseOfElem !== void 0 && !$becauseOfElem.hasClass("snte-element-table"))) {
        $("div#snte-menubar-formula").hide("slow");
      }
    }
  }
  $snteWorkspaceFocusedElement = void 0;
}

function snte_workspace_set_focus($elem) {
  if($snteWorkspaceFocusedElement !== void 0 && $elem.attr("id") !== $snteWorkspaceFocusedElement.attr("id")) {
    snte_workspace_reset_focus($elem);
  }
  
  $snteWorkspaceFocusedElement = $elem;

  if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
    $("div#snte-menu-cell-type button").removeClass("disabled");
    $("li#snte-menu-add-element-chart").removeClass("disabled");
    $("button#snte-menu-ordered-list").addClass("disabled");
    $("button#snte-menu-unordered-list").addClass("disabled");
    $("div#snte-menubar-formula").show("slow");
  }
  else {
    $("div#snte-menu-cell-type button").addClass("disabled");
    $("button#snte-menu-ordered-list").removeClass("disabled");
    $("button#snte-menu-unordered-list").removeClass("disabled");
  }
}

function snte_workspace_make_draggable($elementContainer) {
  $elementContainer.draggable({
    handle: $("div.snte-element-draghandle", $elementContainer),
    containment: [snteChromeSize.left.width, snteChromeSize.top.height, snteWorkspaceSize.width, snteWorkspaceSize.height],
    cursor: "move",
    opacity: "0.5",
    snap: true,
    stack: ".snte-element-container",
    start: function(event, ui) {
      snteWorkspaceDragHelper = ui.position;
    },
    stop: function(event, ui) {
      snteUndoManager.add({
        undo: function() {
          $elementContainer.css({
            "top": snteWorkspaceDragHelper.top+"px",
            "left": snteWorkspaceDragHelper.left+"px"
          });
        },
        redo: function() {
          $elementContainer.css({
            "top": ui.position.top+"px",
            "left": ui.position.left+"px"
          });
        }
      });
    }
  });
}

function snte_workspace_resize_element($elem, width, height) {
  if($elem.hasClass("snte-element-image")) {
    $elem.find("img").css({
      "width": width,
      "height": height
    });
  }
  else if($elem.hasClass("snte-element-chart")) {
    $elem.css({
      "width": width,
      "height": height
    });
    var elemId = $elem.attr("id").replace("snte-element-","");
    snteCharts[elemId].options.width = width;
    snteCharts[elemId].options.height = height;
    snteCharts[elemId].obj.draw(snteCharts[elemId].data, snteCharts[elemId].options);
  }
  else if($elem.hasClass("snte-element-comment")) {
    var $elementContainer = $elem.parent("div.snte-element-container");
    $elementContainer.css({
      "width": width,
      "height": height
    });
  }
}

function snte_workspace_make_resizable($elementContainer, keepAspectRatio, restoreOriginal) {
  $elementContainer.resizable({
    autoHide: true,
    ghost: true,
    grid: [20, 20],
    handles: "se",
    minHeight: 50,
    minWidth: 70,
    aspectRatio: keepAspectRatio,
    stop: function(event, ui) {
      var $elem = ui.element.find(".snte-element");
      if($elem.hasClass("snte-element-image")) {
        snte_workspace_resize_element($elem, (ui.size.width-20)+"px", (ui.size.height)+"px");
      }
      else if($elem.hasClass("snte-element-chart")) {
        snte_workspace_resize_element($elem, (ui.size.width-20)+"px", (ui.size.height-20)+"px");
      }

      snteUndoManager.add({
        undo: function() {
          if($elem.hasClass("snte-element-image")) {
            snte_workspace_resize_element($elem, (ui.originalSize.width-20)+"px", (ui.originalSize.height)+"px");
            $elementContainer.css({
              "width": "auto",
              "height": "auto"
            });
          }
          else if($elem.hasClass("snte-element-chart")) {
            snte_workspace_resize_element($elem, (ui.originalSize.width-20)+"px", (ui.originalSize.height-20)+"px");
            $elementContainer.css({
              "width": "auto",
              "height": "auto"
            });
          }
          else if($elem.hasClass("snte-element-comment")) {
            snte_workspace_resize_element($elem, (ui.originalSize.width)+"px", (ui.originalSize.height)+"px");
          }
        },
        redo: function() {
          if($elem.hasClass("snte-element-image")) {
            snte_workspace_resize_element($elem, (ui.size.width-20)+"px", (ui.size.height)+"px");
            $elementContainer.css({
              "width": "auto",
              "height": "auto"
            });
          }
          else if($elem.hasClass("snte-element-chart")) {
            snte_workspace_resize_element($elem, (ui.size.width-20)+"px", (ui.size.height-20)+"px");
            $elementContainer.css({
              "width": "auto",
              "height": "auto"
            });
          }
          else if($elem.hasClass("snte-element-comment")) {
            snte_workspace_resize_element($elem, (ui.size.width)+"px", (ui.size.height)+"px");
          }
        }
      });
    }
  });
  if(restoreOriginal) {
    var $resizeHandle = $elementContainer.find("div.ui-resizable-handle");
    $resizeHandle.attr("title", i18n.t("resize.drag-handle-help"));
    $resizeHandle.tooltip({
      container: "body",
      placement: "bottom",
      trigger: "hover",
      animation: false
    });
    $resizeHandle.on("dblclick", function(event) {
      var $elem = $elementContainer.find("div.snte-element");
      if($elem.hasClass("snte-element-image")) {
        var $img = $elem.find("img");
        var origWidth = $img.data("original-width");
        snte_workspace_resize_element($elem, origWidth+"px", "auto");
      }
      else if($elem.hasClass("snte-element-chart")) {
        snte_workspace_resize_element($elem, snteDefaultElementSizes.chart.width+"px", snteDefaultElementSizes.chart.height+"px");
      }
      $elementContainer.css({
        "width": "auto",
        "height": "auto"
      });
    });
  }

  if($elementContainer.find("div.snte-element").hasClass("snte-element-comment")) {
    // need this to move resizehandle away from scrollbar
    $elementContainer.find("div.ui-resizable-handle").addClass("snte-comment-resizehandle");
  }
}

function snte_workspace_create_element_container(withTitle, titlePlaceholder) {
  var $newElementContainer = $("<div>").addClass("snte-element-container");

  if(withTitle) {
    $titleField = $("<input>").attr("type", "text").attr("placeholder", titlePlaceholder).addClass("snte-element-title-input");
    $titleField.focus(function(event) {
      $(this).data("content-before", $(this).val());
    });
    $titleField.blur(function(event) {
      // reset cursor (set to 0) so the title text is only cut off on the right side in case content is longer than input field
      if (this.setSelectionRange) {
        this.focus();
        this.setSelectionRange(0, 0);
      }
      else if (this.createTextRange) { //IE8
        var range = this.createTextRange();
        range.collapse(true);
        range.moveEnd('character', 0);
        range.moveStart('character', 0);
        range.select();
      }

      $that = $(this);
      var contentAfter = $that.val();
      if(contentAfter !== $that.data("content-before")) {
        snteUndoManager.add({
          undo: function() {
            $that.val($that.data("content-before"));
          },
          redo: function() {
            $that.val(contentAfter);
          }
        });
      }
    });
    $titleControl = $("<div>").addClass("snte-element-title snte-element-draghandle");
    $titleControl.append($titleField);
    $newElementContainer.append($titleControl);
  }

  $deleteControl = $("<div>").addClass("snte-element-delete").append($("<span>").addClass("glyphicon glyphicon-remove").attr("title", i18n.t("chrome.delete-element")));
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

function snte_workspace_center_element($elementContainer) {
  $elementContainer.css({
    "top": Math.max(snteChromeSize.top.height, (((window.innerHeight-$elementContainer[0].offsetHeight)/2)+$(document).scrollTop()))+"px",
    "left": (((window.innerWidth-$elementContainer[0].offsetWidth)/2)+$(document).scrollLeft())+"px"
  });
}

function snte_workspace_generate_element_id() {
  var date = new Date();
  return "e"+date.getTime();
}

function snte_workspace_show_comments() {
  $("div.snte-element-comment").parent("div.snte-element-container").removeClass("snte-hidden");
}
function snte_workspace_hide_comments() {
  $("div.snte-element-comment").parent("div.snte-element-container").addClass("snte-hidden");
}

function snte_workspace_add_element(type) {
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
        $("#snte-chart-modal").modal();
        break;
      case "image":
        snte_workspace_reset_focus(void 0);
        $("#snte-image-modal").modal();
        break;
    }
}

function snte_workspace_add_chart(chartType) {
  if($snteWorkspaceFocusedElement && $snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
    var nextId = snte_workspace_generate_element_id();

    var $newElement = $("<div>").addClass("snte-element snte-element-chart").attr("id", "snte-element-"+nextId).css({"width": "400px", "height": "300px"});
    
    $newElementContainer = snte_workspace_create_element_container(true, i18n.t("chart.unnamed")+" "+(++snteChartCounter));
    $newElementContainer.find("input.snte-element-title-input").val($("input#snte-chart-wizard-title").val());
    $newElement.click(function(event) {
      var elemId = $(this).attr("id").replace("snte-element-","");
      if(snteWorkspaceElements[snteCharts[elemId].table.id]) {
        $table = $("#snte-element-"+snteCharts[elemId].table.id);
        snte_workspace_set_focus($table);
        $table.handsontable("getInstance").selectCell(snteCharts[elemId].table.cellrange[0], snteCharts[elemId].table.cellrange[1], snteCharts[elemId].table.cellrange[2], snteCharts[elemId].table.cellrange[3]);
      }
    });

    
    snte_workspace_make_resizable($newElementContainer, true, true);
    snte_workspace_bring_to_front($newElementContainer);

    snteWorkspaceElements[nextId] = $newElement;
    $newElement.appendTo($newElementContainer);
    $newElementContainer.appendTo($snteWorkspace);

    snte_workspace_make_draggable($newElementContainer); // needs to be after append-to-DOM because of chrome/opera "bug"
    snte_workspace_center_element($newElementContainer);

    var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
    var selectedCells = snte_table_normalize_cell_selection(tableInstance.getSelected()); // [startRow, startCol, endRow, endCol]
    
    var headerOffset = $("input#snte-chart-wizard-first-data-row").is(":checked")?1:0;

    var chartData = snte_chart_generate_data(tableInstance, selectedCells, headerOffset);

    // Set chart options
    var chartOptions = {"width": snteDefaultElementSizes.chart.width, "height": snteDefaultElementSizes.chart.height};
    var xAxisLabel = $("input#snte-chart-wizard-xaxis").val().trim();
    var yAxisLabel = $("input#snte-chart-wizard-yaxis").val().trim();
    if(xAxisLabel !== "") {
      chartOptions.hAxis = {"title": xAxisLabel};
    }
    if(yAxisLabel !== "") {
      chartOptions.vAxis = {"title": yAxisLabel};
    }

    var chart;
    switch(chartType) {
      case "line":
        chart = new google.visualization.LineChart($newElement[0]);
        break;
      case "smoothline":
        chart = new google.visualization.LineChart($newElement[0]);
        chartOptions.curveType = "function";
        break;
      case "area":
        chart = new google.visualization.AreaChart($newElement[0]);
        break;
      case "vbar":
        chart = new google.visualization.ColumnChart($newElement[0]);
        break;
        case "hbar":
        chart = new google.visualization.BarChart($newElement[0]);
        break;
      case "pie":
        chart = new google.visualization.PieChart($newElement[0]);
        break;
      case "donut":
        chart = new google.visualization.PieChart($newElement[0]);
        chartOptions.pieHole = 0.4;
        break;
      default:
        chart = new google.visualization.PieChart($newElement[0]);
    }

    async.drawChart(chart, chartData, chartOptions);
    //chart.draw(chartData, chartOptions);

    snteCharts[nextId] = {
      "table": {
        "id": $snteWorkspaceFocusedElement.attr("id").replace("snte-element-",""),
        "cellrange": selectedCells
      },
      "type": chartType,
      "data": chartData,
      "headerOffset": headerOffset,
      "options": chartOptions,
      "obj": chart
    };

    snteUndoManager.add({
      undo: function() {
        snte_workspace_remove_element($newElement, true);
      },
      redo: function() {
        snte_workspace_restore_element();
      }
    });
  }
  else {
    alert(i18n.t("chart.error-no-cells-selected"));
  }
}

function snte_chart_generate_data(tableInstance, selectedCells, headerOffset) {
  var chartData = new google.visualization.DataTable();
  var columnTypes = [];
  
  for(var col = selectedCells[1]; col <= selectedCells[3]; col++) {
    var cellPropertiesFirstDataCell = tableInstance.getCellMeta(selectedCells[0]+headerOffset, col);
    var cellPropertiesHeaderCell = tableInstance.getCellMeta(selectedCells[0], col);
    var snteType = cellPropertiesFirstDataCell.snteExplicitType !== "auto" ? cellPropertiesFirstDataCell.snteExplicitType : cellPropertiesFirstDataCell.snteImplicitType;
    columnTypes.push(snteType);
    switch(snteType) {
      case "text":
        chartData.addColumn("string", cellPropertiesHeaderCell.snteRendered);
        break;
      case "numeric":
      case "numericWithoutComma":
      case "percent":
      case "currency":
        chartData.addColumn("number", cellPropertiesHeaderCell.snteRendered);
        break;
      case "date":
        chartData.addColumn("date", cellPropertiesHeaderCell.snteRendered);
        break;
    }
  }
  for(var row = selectedCells[0]+headerOffset; row <= selectedCells[2]; row++) {
    var chartDataRow = [];
    for(var col = selectedCells[1]; col <= selectedCells[3]; col++) {
      var cellProperties = tableInstance.getCellMeta(row, col);
      if(cellProperties.snteRendered === void 0) {
        cellProperties.snteRendered = "";
      }
      var cellValue;
      switch(columnTypes[col-selectedCells[1]]) {
        case "text":
          cellValue = cellProperties.snteRendered;
          break;
        case "numeric":
        case "numericWithoutComma":
          if(cellProperties.language === "en") {
            cellValue = parseFloat(cellProperties.snteRendered.replace(/\,/g, "").trim());
          }
          else if(cellProperties.language === "de") {
            cellValue = parseFloat(cellProperties.snteRendered.replace(/\./g, "").replace(/\,/g, ".").trim());
          }
          break;
        case "percent":
          if(cellProperties.language === "en") {
            cellValue = parseFloat(cellProperties.snteRendered.replace(/\,/g, "").replace(/\%/g).trim());
          }
          else if(cellProperties.language === "de") {
            cellValue = parseFloat(cellProperties.snteRendered.replace(/\./g, "").replace(/\,/g, ".").replace(/\%/g).trim());
          }
          break;
        case "currency":
          if(cellProperties.language === "en") {
            cellValue = parseFloat(cellProperties.snteRendered.replace(/\,/g, "").replace(/[$€]/g).trim());
          }
          else if(cellProperties.language === "de") {
            cellValue = parseFloat(cellProperties.snteRendered.replace(/\./g, "").replace(/\,/g, ".").replace(/[$€]/g).trim());
          }
          break;
        case "date":
          cellValue = new DateTime(strtotime(cellProperties.snteRendered)*1000);
          break;
      }
      
      chartDataRow.push(cellValue);
    }
    chartData.addRow(chartDataRow);
  }

  return chartData;
}

function snte_workspace_add_table() {
  var nextId = snte_workspace_generate_element_id();

  var $newElement = $("<div>").addClass("snte-element snte-element-table").attr("id", "snte-element-"+nextId);

  $newElement.handsontable({
    startRows: 10,
    startCols: 10,
    colHeaders: true,
    rowHeaders: true,
    manualColumnResize: true,
    manualColumnMove: true,
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
      /*console.log("afterSelectionEnd");
      console.log("start: "+row_start+" "+column_start);
      console.log("end: "+row_end+" "+column_end);*/
      snte_workspace_set_focus(this.rootElement);
      snte_chrome_set_font_controls("table_cell", $(this.getCell(row_start, column_start)));
      snte_chrome_set_type_control({"row": row_start, "col": column_start});

      // TODO: wenn eine Zelle gerade editiert wird, die selection (zellbereich/range) in die Formel einfügen
    },
    onBeginEditing: function() {
      //console.log("onBeginEditing");
      snteCellEditorOpened = true;
    },
    onFinishEditing: function() {
      //console.log("onFinishEditing");
      snteCellEditorOpened = false;
    },
    afterOnCellMouseDown: function(event, coords, td) {
      //console.log("afterOnCellMouseDown");
      if(snteCellEditorOpened) {
        var $targetTable = $(td).closest(".snte-element");
        if($targetTable.attr("id") === $snteWorkspaceFocusedElement.attr("id")) { // this should be removed in the future - need good idea for referencing tables though
          var editor = $snteWorkspaceFocusedElement.handsontable("getInstance").getActiveEditor();
          if(editor.TEXTAREA.value[0] === "=") {
            var prefix = "";
            if(event.shiftKey) {
              prefix = ":"; // range
            }
            else if(event.metaKey || event.ctrlKey) {
              prefix = ";"; // argument separator
            }
            editor.putString(prefix+Handsontable.helper.spreadsheetColumnLabel(coords[1])+(coords[0]+1));

            event.stopImmediatePropagation();
            event.preventDefault();
          }
        }
      }
    },
    beforeKeyDown: function(event) {
      var chartModal = $("div#snte-chart-modal").data('bs.modal');
      if(chartModal && chartModal.isShown) {
        event.stopImmediatePropagation();
      }
    },
    beforeAutofill: function(start, end, data) {
      var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
      var selectedCells = snte_table_normalize_cell_selection(tableInstance.getSelected()); //[startRow, startCol, endRow, endCol]

      var snteAutofill = function(source, target) {
        var cellMetaSource = tableInstance.getCellMeta(source.row, source.col);
        var cellMetaTarget = tableInstance.getCellMeta(target.row, target.col);
        cellMetaTarget.snteWYSIWYG = $.extend(true, {}, cellMetaSource.snteWYSIWYG);
        cellMetaTarget.snteExplicitType = cellMetaSource.snteExplicitType;
        cellMetaTarget.snteImplicitType = cellMetaSource.snteImplicitType;

        /*
        * FORMULA AUTOFILL
        */
        if(cellMetaSource.snteFormula !== void 0) {
          var formula = new Formula(cellMetaSource.snteFormula);
          var tokens = formula.tokenize();

          var formulaTarget = "";
          for(var ii=0; ii<tokens.length; ii++) {
            if(tokens[ii].type === "cell") {
              var cellCoordinates = formula.cellReferenceToCoordinates(tokens[ii].token);
              var newCellCoordinates = {"rowAbsolute": cellCoordinates.rowAbsolute, "colAbsolute": cellCoordinates.colAbsolute};
              if(cellCoordinates.rowAbsolute) {
                newCellCoordinates.row = cellCoordinates.row;
              }
              else {
                newCellCoordinates.row = Math.max(0, Math.min(tableInstance.countRows()-1, cellCoordinates.row+(target.row-source.row)));
              }
              if(cellCoordinates.colAbsolute) {
                newCellCoordinates.col = cellCoordinates.col;
              }
              else {
                newCellCoordinates.col = Math.max(0, Math.min(tableInstance.countCols()-1, cellCoordinates.col+(target.col-source.col)));
              }
              
              formulaTarget += formula.coordinatesToCellReference(newCellCoordinates).token;
            }
            else if(tokens[ii].type === "text") {
              formulaTarget += "\""+tokens[ii].token+"\"";
            }
            else {
              formulaTarget += tokens[ii].token;
            }
          }
          
          cellMetaTarget.snteFormula = cellMetaTarget.snteOverrideFormula = formulaTarget;
          cellMetaTarget.snteOverrideFromFormula = true;
        }
        /*
        * FORMULA AUTOFILL END
        */
      };

      var r, rlen, c, clen;
      var current = {};

      //var direction;
      if(selectedCells[0] < start.row) {
        //direction = "down";
        rlen = data.length;
        current.row = start.row;
        current.col = start.col;
        realC = selectedCells[1];
        for (r = 0, realR = selectedCells[0]; r < rlen; r++, realR++) {
          if ((end && current.row > end.row)) {
            break;
          }

          snteAutofill({"row": realR, "col": realC}, {"row": current.row, "col": current.col});

          current.row++;
          if (end && r === rlen - 1) {
            r = -1;
          }
        }
      }
      if(selectedCells[0] > end.row) {
        //direction = "up";
        rlen = data.length;
        current.row = end.row;
        current.col = end.col;
        realC = selectedCells[3];
        for (r = rlen-1, realR = selectedCells[2]; r >= 0; r--, realR--) {
          if ((start && current.row < start.row)) {
            break;
          }

          snteAutofill({"row": realR, "col": realC}, {"row": current.row, "col": current.col});

          current.row--;
          if (start && r === 0) {
            r = rlen;
          }
        }
      }
      if(selectedCells[1] < start.col) {
        //direction = "right";
        rlen = data.length;
        current.row = start.row;
        current.col = start.col;
        realR = selectedCells[0];
        clen = data[0] ? data[0].length : 0;
        for (c = 0, realC = selectedCells[1]; c < clen; c++, realC++) {
          if ((end && current.col > end.col)) {
            break;
          }

          snteAutofill({"row": realR, "col": realC}, {"row": current.row, "col": current.col});

          current.col++;
          if (end && c === clen - 1) {
            c = -1;
          }
        }
      }
      if(selectedCells[1] > end.col) {
        //direction = "left";
        rlen = data.length;
        current.row = end.row;
        current.col = end.col;
        realR = selectedCells[2];
        clen = data[0] ? data[0].length : 0;
        for (c = clen-1, realC = selectedCells[3]; c >= 0; c--, realC--) {
          if ((start && current.col < start.col)) {
            break;
          }

          snteAutofill({"row": realR, "col": realC}, {"row": current.row, "col": current.col});

          current.col--;
          if (start && c === 0) {
            c = clen;
          }
        }
      }
    },
    afterRender: function(isForced) {
      console.log("afterRender");
      $("span.snte-formula-error").tooltip();
    },
    beforeChange: function(changes, source) {
      if(source === "autofill") {
        var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
        for(var ii = 0; ii < changes.length; ii++) {
          var cellMeta = tableInstance.getCellMeta(changes[ii][0], changes[ii][1]);
          if(cellMeta.snteOverrideFromFormula) {
            changes[ii][3] = "="+cellMeta.snteOverrideFormula;
            cellMeta.snteOverrideFromFormula = false;
            cellMeta.snteOverrideFormula = void 0;
          }
        }
      }
    },
    afterChange: function(changes, source) {
      if(changes !== null) {
        snte_table_handsontable_undoable_action();

        if($snteWorkspaceFocusedElement !== void 0 && $snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
          var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");

          var chartsToUpdate = {};

          for(var ii = 0; ii < changes.length; ii++) {
            for(var chartId in snteCharts) {
              if($snteWorkspaceFocusedElement.attr("id").replace("snte-element-","") === snteCharts[chartId].table.id &&
                 changes[ii][0] >= snteCharts[chartId].table.cellrange[0] &&
                 changes[ii][1] >= snteCharts[chartId].table.cellrange[1] &&
                 changes[ii][0] <= snteCharts[chartId].table.cellrange[2] &&
                 changes[ii][1] <= snteCharts[chartId].table.cellrange[3]) {
                chartsToUpdate[chartId] = snteCharts[chartId];
              }
            }
          }

          for(var chartId in chartsToUpdate) {
            var chartData = snte_chart_generate_data(tableInstance, chartsToUpdate[chartId].table.cellrange, chartsToUpdate[chartId].headerOffset);
            snteCharts[chartId].data = chartData;
            async.drawChart(chartsToUpdate[chartId].obj, chartData, chartsToUpdate[chartId].options);
            //chartsToUpdate[chartId].obj.draw(chartData, chartsToUpdate[chartId].options);
          }
        }
      }
    },
    afterCreateRow: function (index, amount, createdAutomatically) {
      if (createdAutomatically) {
        return;
      }
      snte_table_handsontable_undoable_action();
    },
    beforeRemoveRow: function (index, amount) {
      snte_table_handsontable_undoable_action();
    },
    afterCreateCol: function (index, amount, createdAutomatically) {
      if (createdAutomatically) {
        return;
      }
      snte_table_handsontable_undoable_action();
    },
    beforeRemoveCol: function (index, amount) {
      snte_table_handsontable_undoable_action();
    },
    contextMenu: {
      items: {
        "copy": {
          name: i18n.t("table.context-menu.copy"),
          icon: "icon-copy",
          callback: function (key, options) {
            $("div#snte-copypaste-modal").modal("show");
          }
        },
        "cut": {
          name: i18n.t("table.context-menu.cut"),
          icon: "icon-scissors",
          callback: function (key, options) {
            $("div#snte-copypaste-modal").modal("show");
          }
        },
        "paste": {
          name: i18n.t("table.context-menu.paste"),
          icon: "icon-paste",
          callback: function (key, options) {
            $("div#snte-copypaste-modal").modal("show");
          }
        },
        "hsep0": "---------",
        "vacuum": {
          name: i18n.t("table.context-menu.vacuum"),
          icon: "icon-crop",
          callback: function (key, options) {
            var doIt = true;
            var someCellsNotEmpty = false;
            var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
            var selectedCells = snte_table_normalize_cell_selection(tableInstance.getSelected()); //[startRow, startCol, endRow, endCol]

            for(var col = 0; col < tableInstance.countCols(); col++) {
              if(col < selectedCells[1] || col > selectedCells[3]) {
                someCellsNotEmpty = someCellsNotEmpty || !tableInstance.isEmptyCol(col);
                if(someCellsNotEmpty) {
                  break;
                }
              }
            }
            if(!someCellsNotEmpty) {
              for(var row = 0; row < tableInstance.countRows(); row++) {
                if(row < selectedCells[0] || row > selectedCells[2]) {
                  someCellsNotEmpty = someCellsNotEmpty || !tableInstance.isEmptyRow(row);
                  if(someCellsNotEmpty) {
                    break;
                  }
                }
              }
            }
            if(someCellsNotEmpty) {
              doIt = confirm(i18n.t("table.vacuum-confirm"));
            }
            if(doIt) {
              for(var col = tableInstance.countCols()-1; col >= 0; col--) {
                if(col < selectedCells[1] || col > selectedCells[3]) {
                  tableInstance.alter("remove_col", col, 1, "vacuum");
                }
              }
              for(var row = tableInstance.countRows()-1; row >= 0; row--) {
                if(row < selectedCells[0] || row > selectedCells[2]) {
                  tableInstance.alter("remove_row", row, 1, "vacuum");
                }
              }
              tableInstance.selectCell(0, 0, tableInstance.countRows()-1, tableInstance.countCols()-1);
            }
          }
        },
        "hsep1": "---------",
        "row_above": {
          name: i18n.t("table.context-menu.insert-row-above"),
          icon: "icon-row-above",
        },
        "row_below": {
          name: i18n.t("table.context-menu.insert-row-below"),
          icon: "icon-row-below",
        },
        "hsep2": "---------",
        "col_left": {
          name: i18n.t("table.context-menu.insert-column-left"),
          icon: "icon-col-left",
        },
        "col_right": {
          name: i18n.t("table.context-menu.insert-column-right"),
          icon: "icon-col-right",
        },
        "hsep3": "---------",
        "remove_row": {
          name: i18n.t("table.context-menu.remove-row"),
          icon: "icon-close",
          disabled: function () {
            return this.countRows() === 1;
          }
        },
        "remove_col": {
          name: i18n.t("table.context-menu.remove-column"),
          icon: "icon-close",
          disabled: function () {
            return this.countCols() === 1;
          }
        },
        "hsep4": "---------",
        "toggle_row_headers": {
          name: i18n.t("table.context-menu.hide-row-headers"),
          icon: "icon-eye-blocked",
          callback: function (key, options) {
            var tableSettings = $snteWorkspaceFocusedElement.handsontable("getSettings");
            tableSettings.rowHeaders = !tableSettings.rowHeaders;
            $snteWorkspaceFocusedElement.handsontable("getInstance").render();
            this.contextMenu.options.items.toggle_row_headers.name = tableSettings.rowHeaders ? i18n.t("table.context-menu.hide-row-headers") : i18n.t("table.context-menu.show-row-headers");
            this.contextMenu.options.items.toggle_row_headers.icon = tableSettings.rowHeaders ? "icon-eye-blocked" : "icon-eye";
          }
        },
        "toggle_column_headers": {
          name: i18n.t("table.context-menu.hide-column-headers"),
          icon: "icon-eye-blocked",
          callback: function (key, options) {
            var tableSettings = $snteWorkspaceFocusedElement.handsontable("getSettings");
            tableSettings.colHeaders = !tableSettings.colHeaders;
            $snteWorkspaceFocusedElement.handsontable("getInstance").render();
            this.contextMenu.options.items.toggle_column_headers.name = tableSettings.colHeaders ? i18n.t("table.context-menu.hide-column-headers") : i18n.t("table.context-menu.show-column-headers");
            this.contextMenu.options.items.toggle_column_headers.icon = tableSettings.colHeaders ? "icon-eye-blocked" : "icon-eye";
          }
        }
      }
    }
  });
  
  $newElementContainer = snte_workspace_create_element_container(true, i18n.t("table.unnamed")+" "+(++snteTableCounter));

  $addRowControl = $("<div>").addClass("snte-table-control snte-table-control-add-row").append($("<span>").addClass("glyphicon glyphicon-plus").attr("title", i18n.t("table.add-row")));
  $addRowControl.click(function(event) {
    $(this).find("span").tooltip("hide");

    var $workspaceElement = $(event.target).closest("div.snte-element-container").find("div.snte-element");
    snte_workspace_set_focus($workspaceElement);
    var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
    tableInstance.alter("insert_row");
  });
  $addRowControl.find("span").tooltip({
    container: "body",
    placement: "bottom",
    trigger: "hover",
    animation: false
  });
  $newElementContainer.append($addRowControl);

  $addColumnControl = $("<div>").addClass("snte-table-control snte-table-control-add-column").append($("<span>").addClass("glyphicon glyphicon-plus").attr("title", i18n.t("table.add-column")));
  $addColumnControl.click(function(event) {
    $(this).find("span").tooltip("hide");

    var $workspaceElement = $(event.target).closest("div.snte-element-container").find("div.snte-element");
    snte_workspace_set_focus($workspaceElement);
    var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
    tableInstance.alter("insert_col");
  });
  $addColumnControl.find("span").tooltip({
    container: "body",
    placement: "right",
    trigger: "hover",
    animation: false
  });
  $newElementContainer.append($addColumnControl);

  //snte_workspace_make_resizable($newElementContainer, false, false);
  snte_workspace_bring_to_front($newElementContainer);

  snteWorkspaceElements[nextId] = $newElement;
  $newElement.appendTo($newElementContainer);
  $newElementContainer.appendTo($snteWorkspace);

  snte_workspace_make_draggable($newElementContainer); // needs to be after append-to-DOM because of chrome/opera "bug"
  snte_workspace_center_element($newElementContainer);

  snteUndoManager.add({
    undo: function() {
      snte_workspace_remove_element($newElement, true);
    },
    redo: function() {
      snte_workspace_restore_element();
    }
  });
}

function snte_workspace_add_text() {
  var nextId = snte_workspace_generate_element_id();

  var $newElement = $("<div>").addClass("snte-element snte-element-text").attr("id", "snte-element-"+nextId).attr("contenteditable", "true").css({"width": "200px", "height": "200px"});
  
  $newElementContainer = snte_workspace_create_element_container(false, void 0);

  snte_workspace_bring_to_front($newElementContainer);

  $newElement.focus(function(event) {
    snte_workspace_set_focus($(this));
    $(this).data("content-before", $(this).html());
    event.preventDefault();
  });
  $newElement.blur(function(event) {
    $(this).css("width", "auto");
    $(this).css("height", "auto");

    event.preventDefault();
  });
  $newElement.click(function(event) {
    snte_chrome_set_font_controls("text", $(event.target));
    event.preventDefault();
  });
  $newElement.on("blur keyup paste input", function(event) {
    var $that = $(this);
    clearTimeout(snteUndoTypeTimeout);
    snteUndoTypeTimeout = setTimeout(function() {
      var contentAfter = $that.html();
      if(contentAfter !== $that.data("content-before")) {
        snte_wysiwyg_undoable_action($that, $that.data("content-before"), contentAfter);
        $that.data("content-before", contentAfter);
      }
    }, 250);
  });

  snteWorkspaceElements[nextId] = $newElement;
  $newElement.appendTo($newElementContainer);
  $newElementContainer.appendTo($snteWorkspace);

  snte_workspace_make_draggable($newElementContainer); // needs to be after append-to-DOM because of chrome/opera "bug"
  snte_workspace_center_element($newElementContainer);

  $newElement.focus();
  snte_wysiwyg_apply_font(false);

  snteUndoManager.add({
    undo: function() {
      snte_workspace_remove_element($newElement, true);
    },
    redo: function() {
      snte_workspace_restore_element();
    }
  });
}

function snte_workspace_add_comment() {
  var nextId = snte_workspace_generate_element_id();

  var $newElement = $("<div>").addClass("snte-element snte-element-comment").attr("id", "snte-element-"+nextId).attr("contenteditable", "true");
  
  $newElementContainer = snte_workspace_create_element_container(false, void 0);
  $newElementContainer.width(snteDefaultElementSizes.comment.width).height(snteDefaultElementSizes.comment.height);

  $newElement.focus(function(event) {
    snte_workspace_set_focus($(this));
    $(this).data("content-before", $(this).html());
  });
  $newElement.click(function(event) {
    snte_chrome_set_font_controls("text", $(event.target));
  });
  $newElement.on("keyup paste", function(event) {
    var $that = $(this);
    clearTimeout(snteUndoTypeTimeout);
    snteUndoTypeTimeout = setTimeout(function() {
      var contentAfter = $that.html();
      if(contentAfter !== $that.data("content-before")) {
        snte_wysiwyg_undoable_action($that, $that.data("content-before"), contentAfter);
        $that.data("content-before", contentAfter);
      }
    }, 250);
  });

  snteWorkspaceElements[nextId] = $newElement;
  $newElement.appendTo($newElementContainer);

  snte_workspace_make_resizable($newElementContainer, false, false);
  snte_workspace_bring_to_front($newElementContainer);

  $newElementContainer.appendTo($snteWorkspace);

  snte_workspace_make_draggable($newElementContainer); // needs to be after append-to-DOM because of chrome/opera "bug"
  snte_workspace_center_element($newElementContainer);

  $newElement.focus();

  snte_wysiwyg_apply_font(false);

  snte_chrome_show_comments();
  snte_workspace_show_comments();

  snteUndoManager.add({
    undo: function() {
      snte_workspace_remove_element($newElement, true);
    },
    redo: function() {
      snte_workspace_restore_element();
    }
  });
}

function snte_workspace_add_image(url) {
  var nextId = snte_workspace_generate_element_id();

  var $newElement = $("<div>").addClass("snte-element snte-element-image snte-element-draghandle").attr("id", "snte-element-"+nextId);

  $newElementContainer = snte_workspace_create_element_container(false, void 0);

  async.createImage(url).then(function ($image) {
    var imageWidth = Math.min(snteImage.maxWidth, $image.width());
    $image.data("original-width", imageWidth).css({
      display: '',
      width: imageWidth+"px"
    });
    $newElement.append($image);
    snteWorkspaceElements[nextId] = $newElement;
    $newElement.appendTo($newElementContainer);

    snte_workspace_make_resizable($newElementContainer, true, true);
    snte_workspace_bring_to_front($newElementContainer);
    snte_workspace_set_focus($newElement);

    $newElementContainer.appendTo($snteWorkspace);

    snte_workspace_make_draggable($newElementContainer); // needs to be after append-to-DOM because of chrome/opera "bug"
    snte_workspace_center_element($newElementContainer);

    $("#snte-image-modal").modal("hide");

    snteUndoManager.add({
      undo: function() {
        snte_workspace_remove_element($newElement, true);
      },
      redo: function() {
        snte_workspace_restore_element();
      }
    });
  }).fail(function () {
    alert(i18n.t("image-upload.filetype-error"));
  });
}














/*
##############################
SNTE TABLE
##############################
*/

function snte_table_handsontable_undoable_action() {
  if($snteWorkspaceFocusedElement !== void 0 && $snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
    var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");

    snteUndoManager.add({
      undo: function() {
        tableInstance.undo();
      },
      redo: function() {
        tableInstance.redo();
      }
    });
  }
}

function snte_table_apply_cell_type() {
  if($snteWorkspaceFocusedElement !== void 0 && $snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
    var cellType = $("div#snte-menu-cell-type button").data("value");

    var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
    var selectedCells = snte_table_normalize_cell_selection(tableInstance.getSelected()); //[startRow, startCol, endRow, endCol]
    var oldCellMetaValues = []; // used for undo
    for(var row = selectedCells[0]; row <= selectedCells[2]; row++) {
      oldCellMetaValues[row] = [];
      for(var col = selectedCells[1]; col <= selectedCells[3]; col++) {
        var cellMeta = tableInstance.getCellMeta(row, col);
        oldCellMetaValues[row][col] = ""+cellMeta.snteExplicitType;
        cellMeta.snteExplicitType = cellType;
      }
    }
    tableInstance.render();
    snte_chrome_set_font_controls("table_cell", $(tableInstance.getCell(selectedCells[0], selectedCells[1])));

    snteUndoManager.add({
      undo: function() {
        for(var row = selectedCells[0]; row <= selectedCells[2]; row++) {
          for(var col = selectedCells[1]; col <= selectedCells[3]; col++) {
            var cellMeta = tableInstance.getCellMeta(row, col);
            cellMeta.snteExplicitType = ""+oldCellMetaValues[row][col];
          }
        }
        tableInstance.render();
      },
      redo: function() {
        for(var row = selectedCells[0]; row <= selectedCells[2]; row++) {
          for(var col = selectedCells[1]; col <= selectedCells[3]; col++) {
            var cellMeta = tableInstance.getCellMeta(row, col);
            cellMeta.snteExplicitType = cellType;
          }
        }
        tableInstance.render();
      }
    });
  }
}

function snte_table_put_formula(formula) {
  var tableInstance = $snteWorkspaceFocusedElement.handsontable("getInstance");
  var editor = tableInstance.getActiveEditor();
  if(!snteCellEditorOpened) {
    editor.beginEditing();
  }
  
  var functionString = "";
  if(editor.TEXTAREA.value.trim() === "") {
    functionString = "="+formula;
  }
  else  {
    functionString = formula;
  }
  editor.putString(functionString);
}

function snte_table_normalize_cell_selection(selectedCells) {
  var normalized = [];
  normalized[0] = Math.min(selectedCells[0], selectedCells[2]);
  normalized[1] = Math.min(selectedCells[1], selectedCells[3]);
  normalized[2] = Math.max(selectedCells[0], selectedCells[2]);
  normalized[3] = Math.max(selectedCells[1], selectedCells[3]);

  return normalized;
}

function snte_table_get_title($elem) {
  var title;
  var $input = $snteWorkspaceFocusedElement.parent("div.snte-element-container").find("input.snte-element-title-input");
  if($input.val().trim() === "") {
    title = $input.attr("placeholder");
  }
  else {
    title = $input.val().trim();
  }

  return title;
}