String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

var $snteWorkspace;
var $snteWorkspaceContainer;
var snteWorkspaceElements = {};
var $snteWorkspaceFocusedElement;

var snteChromeSize = {left:{width: 180}, top:{height: 100}};
var snteWorkspaceSize = {width: 9999999999, height: 9999999999};

var snteWYSIWYG = {
  "fontFamily": {"default": "Arial", "values": ["Arial", "Courier New", "Georgia", "Times New Roman", "Trebuchet MS", "Verdana"]},
  "fontSize": {"default": 2, "values": [1, 2, 3, 4, 5, 6, 7], "valueToPixelMap": {1: 10, 2:13, 3:16, 4:18, 5:24, 6:32, 7:48}, "pixelToValueMap": {10: 1, 13:2, 16:3, 18:4, 24:5, 32:6, 48:7}},
  "fontColor": {"default": "#000"},
  "fillColor": {"default": "#fff"},
  "bold": {"default": false},
  "italic": {"default": false},
  "underline": {"default": false},
  "strikethrough": {"default": false}
};

var snteCellRenderer = function (instance, td, renderer_row, renderer_col, prop, value, cellProperties) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);
  
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

  $(td).css({
    "font-family": cellProperties.snteWYSIWYG.fontFamily,
    "font-size": snteWYSIWYG.fontSize.valueToPixelMap[cellProperties.snteWYSIWYG.fontSize]+"px",
    "color": cellProperties.snteWYSIWYG.fontColor,
    "background": cellProperties.snteWYSIWYG.fillColor,
    "font-weight": cellProperties.snteWYSIWYG.bold?"bold":"normal",
    "font-style": cellProperties.snteWYSIWYG.italic?"italic":"normal",
    "text-decoration": textDecoration
  });
};

$(document).ready(function() {
  snte_bootstrap();
});

function snte_bootstrap() {
  $snteWorkspace = $("div#snte-workspace");
  $snteWorkspaceContainer = $("div#snte-workspace-container");

  $("button#snte-menu-font-color").colorpicker({
    format: "rgb",
    color: "#000"
    
  }).on('changeColor', function(evt){
    var hexColor = e.color.toHex();
    $("span#snte-menu-font-color-picker-indicator").css("background-color", hexColor);
    $("button#snte-menu-font-color").data("value", hexColor);
    snte_wysiwyg_apply_font_color();
  });

  $("button#snte-menu-fill-color").colorpicker({
    format: "rgb",
    color: "#fff"
    
  }).on('changeColor', function(evt){
    var hexColor = e.color.toHex();
    $("span#snte-menu-fill-color-picker-indicator").css("background-color", hexColor);
    $("button#snte-menu-fill-color").data("value", hexColor);
    snte_wysiwyg_apply_fill_color();
  });

  $("button#snte-menu-undo").click(function(evt) {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("undo", false, null);
  });
  $("button#snte-menu-redo").click(function(evt) {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("redo", false, null);
  });
  $("button#snte-menu-copy").click(function(evt) {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("copy", false, null);
  });
  $("button#snte-menu-paste").click(function(evt) {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("paste", false, null);
  });

  $("div#snte-menu-add-element ul.dropdown-menu li a").click(function(evt) {
    snte_workspace_add_item($(this).data("item"));
    
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
  $("div#snte-menu-font-family ul.dropdown-menu li a").click(function(evt) {
    $("div#snte-menu-font-family button span.value").text($(this).text());
    $("div#snte-menu-font-family button").data("value", $(this).data("value"));

    snte_wysiwyg_apply_font_family();

    evt.preventDefault();
  });
  $("div#snte-menu-font-size ul.dropdown-menu li a").click(function(evt) {
    $("div#snte-menu-font-size button span.value").text($(this).text());
    $("div#snte-menu-font-size button").data("value", $(this).data("value"));

   snte_wysiwyg_apply_font_size();

   evt.preventDefault();
  });
  $("button#snte-menu-font-color").click(function(evt) {
    $("div#snte-menu-font-color-picker").colorpicker("show");

    evt.preventDefault();
  });

  $("button#snte-menu-fill-color").click(function(evt) {
    $("div#snte-menu-fill-color-picker").colorpicker("show");

    evt.preventDefault();
  });
}

function snte_wysiwyg_apply_font() {
  snte_wysiwyg_apply_font_family();
  snte_wysiwyg_apply_font_size();
  snte_wysiwyg_apply_font_color();
  snte_wysiwyg_apply_fill_color();
  snte_wysiwyg_apply_font_styles();
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
      $snteWorkspaceFocusedElement.focus();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("bold", false, null);
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("bold", $("button#snte-menu-font-bold").hasClass("active"));
    }
  }
}
function snte_wysiwyg_apply_font_italic() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      $snteWorkspaceFocusedElement.focus();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("italic", false, null);
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("italic", $("button#snte-menu-font-italic").hasClass("active"));
    }
  }
}
function snte_wysiwyg_apply_font_underline() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      $snteWorkspaceFocusedElement.focus();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("underline", false, null);
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("underline", $("button#snte-menu-font-underline").hasClass("active"));
    }
  }
}
function snte_wysiwyg_apply_font_strikethrough() {
  if($snteWorkspaceFocusedElement !== void 0) {
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      $snteWorkspaceFocusedElement.focus();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("strikeThrough", false, null);
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("strikethrough", $("button#snte-menu-font-strikethrough").hasClass("active"));
    }
  }
}

function snte_wysiwyg_apply_font_family() {
  if($snteWorkspaceFocusedElement !== void 0) {
    console.log("apply font family");
    console.log($snteWorkspaceFocusedElement);
    console.log($("div#snte-menu-font-family button").data("value"));
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("fontName", false, $("div#snte-menu-font-family button").data("value"));
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("fontFamily", $("div#snte-menu-font-family button").data("value"));
    }
  }
}

function snte_wysiwyg_apply_font_size() {
  if($snteWorkspaceFocusedElement !== void 0) {
    console.log("apply font size");
    console.log($snteWorkspaceFocusedElement);
    console.log($("div#snte-menu-font-size button").data("value"));
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      // http://home.earthlink.net/~silvermaplesoft/standards/size_heading.html
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("fontSize", false, $("div#snte-menu-font-size button").data("value"));
      /*
      // fontSize only accepts values from 1-7, see https://developer.mozilla.org/en-US/docs/Rich-Text_Editing_in_Mozilla#Executing_Commands
      // workaround found here http://stackoverflow.com/questions/5868295/document-execcommand-fontsize-in-pixels
      document.execCommand("fontSize", false, 1);
      $("font[size=1]", snteWorkspace).removeAttr("size").css("font-size", $("div#snte-menu-font-size button").data("value"));
      */
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("fontSize", $("div#snte-menu-font-size button").data("value"));
    }
  }
}

function snte_wysiwyg_apply_font_color() {
  if($snteWorkspaceFocusedElement !== void 0) {
    console.log("apply font color");
    console.log($snteWorkspaceFocusedElement);
    console.log($("button#snte-menu-font-color").data("value"));
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("foreColor", false, $("button#snte-menu-font-color").data("value"));
      $snteWorkspaceFocusedElement.focus();
    }
    else if($snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      snte_wysiwyg_update_table_cell_meta("fontColor", $("button#snte-menu-font-color").data("value"));
    }
  }
}

function snte_wysiwyg_apply_fill_color() {
  if($snteWorkspaceFocusedElement !== void 0) {
    console.log("apply fill color");
    console.log($snteWorkspaceFocusedElement);
    console.log($("button#snte-menu-fill-color").data("value"));
    if($snteWorkspaceFocusedElement.hasClass("snte-element-text") || $snteWorkspaceFocusedElement.hasClass("snte-element-comment")) {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("hiliteColor", false, $("button#snte-menu-fill-color").data("value"));
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

function snte_workspace_add_item(type) {
  console.log("Add item of type "+type);

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
        alert("TODO");
        break;
    }
}

function snte_workspace_remove_element(evt) {
  if(confirm("MSG-Sure?")) {
    $(evt.target).closest("div.snte-element-container").remove();
  }
}

function snte_workspace_make_draggable($elem) {
  $elem.draggable({
    handle: $("div.snte-element-drag-handle", $elem),
    //containment: snteWorkspaceContainer,
    containment: [snteChromeSize.left.width, snteChromeSize.top.height, snteWorkspaceSize.width, snteWorkspaceSize.height],
    cursor: "move",
    opacity: "0.5",
    snap: true
  });
}

function snte_workspace_add_table() {
  var nextId = snte_generate_element_id();
  var $newElement = $("<div class=\"snte-element snte-element-table\" id=\"snte-element-"+nextId+"\"></div>");
  $newElement.handsontable({
    //width: snteWorkspaceSize.width,
    startRows: 10,
    startCols: 10,
    colHeaders: true,
    rowHeaders: true,
    manualColumnResize: true,
    contextMenu: true,
    scrollV: "none",
    scrollH: "none",
    outsideClickDeselects: false,
    cells: function (row, col, prop) {
      this.renderer = snteCellRenderer;
      if(!this.hasOwnProperty("snteWYSIWYG")) {
        this.snteWYSIWYG = {
          "fontFamily": snteWYSIWYG.fontFamily.default,
          "fontSize": snteWYSIWYG.fontSize.default,
          "fontColor": snteWYSIWYG.fontColor.default,
          "fillColor": snteWYSIWYG.fillColor.default,
          "bold": snteWYSIWYG.bold.default,
          "italic": snteWYSIWYG.italic.default,
          "underline": snteWYSIWYG.underline.default,
          "strikethrough": snteWYSIWYG.strikethrough.default
        };
      }
    },
    afterInit: function () {
      this.selectCell(0, 0);
    },
    afterSelectionEnd: function (row_start, column_start, row_end, column_end) {
      $snteWorkspaceFocusedElement = this.rootElement;
      snte_chrome_set_font_controls("table_cell", $(this.getCell(row_start, column_start)));
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

          console.log("copy cell meta from "+realR+" "+realC+" to "+current.row+" "+current.col);
          var cellMetaSource = tableInstance.getCellMeta(realR, realC);
          var cellMetaTarget = tableInstance.getCellMeta(current.row, current.col);
          cellMetaTarget.snteWYSIWYG = $.extend(true, {}, cellMetaSource.snteWYSIWYG);

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
    }
  });
  
  var $newElementContainer = $("<div class=\"snte-element-container\"><div class=\"snte-element-title\" title=\"MSG-Click-to-edit\">MSG-Unnamed-Table</div><div class=\"snte-element-control-handles snte-hidden\"><div class=\"snte-element-drag-handle\"></div><div class=\"snte-element-delete\"></div></div></div>");
  $newElementContainer.mouseover(function() {
    $(this).addClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).removeClass("snte-hidden");
  });
  $newElementContainer.mouseout(function() {
    $(this).removeClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).addClass("snte-hidden");
  });
  $("div.snte-element-delete", $newElementContainer).click(snte_workspace_remove_element);
  $("div.snte-element-title", $newElementContainer).editable(function(value, settings) {
      if(value == "") {
        value = "MSG-Unnamed-Table";
      }
      return value;
    }, {
    onblur: "submit"
  });

  snte_workspace_make_draggable($newElementContainer);

  snteWorkspaceElements[nextId] = $newElement;
  $newElement.appendTo($newElementContainer);
  $newElementContainer.appendTo($snteWorkspace); 
}

function snte_workspace_add_text() {
  var nextId = snte_generate_element_id();

  var $newElement = $("<div class=\"snte-element snte-element-text\" id=\"snte-element-"+nextId+"\" contenteditable=\"true\"></div>");
  
  var $newElementContainer = $("<div class=\"snte-element-container\"><div class=\"snte-element-control-handles snte-hidden\"><div class=\"snte-element-drag-handle\"></div><div class=\"snte-element-delete\"></div></div></div>");
  $newElementContainer.mouseover(function() {
    $(this).addClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).removeClass("snte-hidden");
  });
  $newElementContainer.mouseout(function() {
    $(this).removeClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).addClass("snte-hidden");
  });
  $("div.snte-element-delete", $newElementContainer).click(snte_workspace_remove_element);

  snte_workspace_make_draggable($newElementContainer);

  $newElement.focus(function(evt) {
    if($snteWorkspaceFocusedElement !== void 0 && $snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      $snteWorkspaceFocusedElement.handsontable("getInstance").deselectCell();
    }
    $snteWorkspaceFocusedElement = $(this);
    $(this).addClass("snte-highlighted");
  });
  $newElement.blur(function(evt) {
    $(this).removeClass("snte-highlighted");
  });
  $newElement.click(function(evt) {
    snte_chrome_set_font_controls("text", $(e.target));
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

  var $newElement = $("<div class=\"snte-element snte-element-comment\" id=\"snte-element-"+nextId+"\" contenteditable=\"true\"></div>");
  
  var $newElementContainer = $("<div class=\"snte-element-container\"><div class=\"snte-element-control-handles snte-hidden\"><div class=\"snte-element-drag-handle\"></div><div class=\"snte-element-delete glyphicon glyphicon-remove\"></div></div></div>");
  $newElementContainer.mouseover(function() {
    $(this).addClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).removeClass("snte-hidden");
  });
  $newElementContainer.mouseout(function() {
    $(this).removeClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).addClass("snte-hidden");
  });
  $("div.snte-element-delete", $newElementContainer).click(snte_workspace_remove_element);
  
  snte_workspace_make_draggable($newElementContainer);

  $newElement.focus(function(evt) {
    if($snteWorkspaceFocusedElement !== void 0 && $snteWorkspaceFocusedElement.hasClass("snte-element-table")) {
      $snteWorkspaceFocusedElement.handsontable("getInstance").deselectCell();
    }
    $snteWorkspaceFocusedElement = $(this);
    $(this).addClass("snte-highlighted");
  });
  $newElement.blur(function(evt) {
    $(this).removeClass("snte-highlighted");
  });
  $newElement.click(function(evt) {
    snte_chrome_set_font_controls("text", $(e.target));
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
  $("button#snte-menu-toggle-comments").addClass("active").attr("title", "MSG-Show-Comments-On");
  $("button#snte-menu-toggle-comments span.value").text("MSG-Show-Comments-On");
}
function snte_chrome_hide_comments() {
  $("button#snte-menu-toggle-comments").removeClass("active").attr("title", "MSG-Show-Comments-Off");
  $("button#snte-menu-toggle-comments span.value").text("MSG-Show-Comments-Off");
}

function snte_chrome_reset_font_controls() {
  $("button#snte-menu-font-bold").removeClass("active");
  $("button#snte-menu-font-italic").removeClass("active");
  $("button#snte-menu-font-underline").removeClass("active");
  $("button#snte-menu-font-strikethrough").removeClass("active");

  $("div#snte-menu-font-family button span.value").text(snteWYSIWYG.fontFamily.default);
  $("div#snte-menu-font-family button").data("value", snteWYSIWYG.fontFamily.default);

  $("div#snte-menu-font-size button span.value").text(snteWYSIWYG.fontSize.valueToPixelMap[snteWYSIWYG.fontSize.default]);
  $("div#snte-menu-font-size button").data("value", snteWYSIWYG.fontSize.default);

  $("span#snte-menu-font-color-picker-indicator").css("background-color", snteWYSIWYG.fontColor.default);
  $("button#snte-menu-font-color").data("value", snteWYSIWYG.fontColor.default);

  $("span#snte-menu-fill-color-picker-indicator").css("background-color", snteWYSIWYG.fillColor.default);
  $("button#snte-menu-fill-color").data("value", snteWYSIWYG.fillColor.default);
}

function snte_chrome_set_font_controls(element_type, $source) {
  if(element_type === "text") {
    var valuesToSet = {"family": true, "size": true, "color": true, "fill": true, "bold": true, "italic": true, "underline": true, "strikethrough": true};

    $("button#snte-menu-font-bold").removeClass("active");
    $("button#snte-menu-font-italic").removeClass("active");
    $("button#snte-menu-font-underline").removeClass("active");
    $("button#snte-menu-font-strikethrough").removeClass("active");

    var $currentElement = $source;
    while(!$currentElement.hasClass("snte-element")) {
      console.log($currentElement);
      if($currentElement.is("span") && $currentElement.attr("style")) {
        console.log($currentElement.attr("style"));
        if($currentElement.attr("style").contains("font-family") && valuesToSet.family) {
          $("div#snte-menu-font-family button span.value").text($currentElement.css("font-family"));
          $("div#snte-menu-font-family button").data("value", $currentElement.css("font-family"));
          valuesToSet.family = false;
        }
        if($currentElement.attr("style").contains("color") && valuesToSet.color) {
          $("span#snte-menu-font-color-picker-indicator").css("background-color", $currentElement.css("color"));
          $("button#snte-menu-font-color").data("value", $currentElement.css("color"));
          valuesToSet.color = false;
        }
        if($currentElement.attr("style").contains("background-color") && valuesToSet.fill) {
          $("span#snte-menu-fill-color-picker-indicator").css("background-color", $currentElement.css("background-color"));
          $("button#snte-menu-fill-color").data("value", $currentElement.css("background-color"));
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
      if($currentElement.is("font") && $currentElement.attr("size")) {
        if(valuesToSet.size) {
          $("div#snte-menu-font-size button span.value").text(snteWYSIWYG.fontSize.valueToPixelMap[$currentElement.attr("size")]);
          $("div#snte-menu-font-size button").data("value", $currentElement.attr("size"));
          valuesToSet.size = false;
        }
      }
      $currentElement = $currentElement.parent();
    }
  }
  else if(element_type === "table_cell") {
    $("button#snte-menu-font-bold").removeClass("active");
    $("button#snte-menu-font-italic").removeClass("active");
    $("button#snte-menu-font-underline").removeClass("active");
    $("button#snte-menu-font-strikethrough").removeClass("active");

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
      $("span#snte-menu-font-color-picker-indicator").css("background-color", $source.css("color"));
      $("button#snte-menu-font-color").data("value", $source.css("color"));
    }
    else {
      $("span#snte-menu-font-color-picker-indicator").css("background-color", snteWYSIWYG.fontColor.default);
      $("button#snte-menu-font-color").data("value", snteWYSIWYG.fontColor.default);
    }

    if($source.attr("style") && $source.attr("style").contains("background")) {
      $("span#snte-menu-fill-color-picker-indicator").css("background-color", $source.css("background-color"));
      $("button#snte-menu-fill-color").data("value", $source.css("background-color"));
    }
    else {
      $("span#snte-menu-fill-color-picker-indicator").css("background-color", snteWYSIWYG.fillColor.default);
      $("button#snte-menu-fill-color").data("value", snteWYSIWYG.fillColor.default);
    }

    if($source.attr("style") && $source.attr("style").contains("font-weight") && ($source.css("font-weight") === "bold" || parseInt($source.css("font-weight")) === 700)) {
      $("button#snte-menu-font-bold").addClass("active");
    }
    else {
      $("button#snte-menu-font-bold").removeClass("active");
    }

    if($source.attr("style") && $source.attr("style").contains("font-style") && $source.css("font-style") === "italic") {
      $("button#snte-menu-font-italic").addClass("active");
    }
    else {
      $("button#snte-menu-font-italic").removeClass("active");
    }

    if($source.attr("style") && $source.attr("style").contains("text-decoration")) {
      if($source.attr("style").contains("underline")) {
        $("button#snte-menu-font-underline").addClass("active");
      }
      else {
        $("button#snte-menu-font-underline").removeClass("active");
      }
      if($source.attr("style").contains("line-through")) {
        $("button#snte-menu-font-strikethrough").addClass("active");
      }
      else {
        $("button#snte-menu-font-strikethrough").removeClass("active");
      }
    }
  }
}