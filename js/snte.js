String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

var snteWorkspace;
var snteWorkspaceContainer;
var snteWorkspaceElements = {};
var snteWorkspaceFocusedElement;

var fontSizeMap = {1: 10, 2:13, 3:16, 4:18, 5:24, 6:32, 7:48};

$(document).ready(function() {
  snte_bootstrap();
});

function snte_bootstrap() {
  snteWorkspace = $("div#snte-workspace");
  snteWorkspaceContainer = $("div#snte-workspace-container");
  /*snteWorkspace.click(function(e) {
    console.log("click on workspace");
    snteWorkspaceFocusedElement = snteWorkspace;
    e.preventDefault();
  });*/

  $("button#snte-menu-font-color").colorpicker({
    format: "rgb",
    color: "#000"
    
  }).on('changeColor', function(e){
    var hexColor = e.color.toHex();
    $("span#snte-menu-font-color-picker-indicator").css("background-color", hexColor);
    $("button#snte-menu-font-color").data("value", hexColor);
    snte_wysiwyg_apply_font_color();
  });

  $("button#snte-menu-undo").click(function(e) {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("undo", false, null);
  });
  $("button#snte-menu-redo").click(function(e) {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("redo", false, null);
  });
  $("button#snte-menu-copy").click(function(e) {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("copy", false, null);
  });
  $("button#snte-menu-paste").click(function(e) {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("paste", false, null);
  });

  $("div#snte-menu-add-element ul.dropdown-menu li a").click(function(e) {
    snte_workspace_add_item($(this).data("item"));
    
    e.preventDefault();
  });

  $("button#snte-menu-toggle-comments").click(function(e) {
    snte_chrome_toggle_button($(this));
    if($(this).hasClass("active")) {
      snte_chrome_show_comments();
      snte_workspace_show_comments();
    }
    else {
      snte_chrome_hide_comments();
      snte_workspace_hide_comments();
    }

    e.preventDefault();
  });

  $("button#snte-menu-font-bold").click(function(e) {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_bold();

    e.preventDefault();

  });
  $("button#snte-menu-font-italic").click(function(e) {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_italic();

    e.preventDefault();
  });
  $("button#snte-menu-font-underline").click(function(e) {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_underline();

    e.preventDefault();
  });
  $("button#snte-menu-font-strikethrough").click(function(e) {
    snte_chrome_toggle_button($(this));
    snte_wysiwyg_apply_font_strikethrough();

    e.preventDefault();
    
  });
  $("div#snte-menu-font-family ul.dropdown-menu li a").click(function(e) {
    $("div#snte-menu-font-family button span.value").text($(this).text());
    $("div#snte-menu-font-family button").data("value", $(this).data("value"));

    snte_wysiwyg_apply_font_family();

    e.preventDefault();
  });
  $("div#snte-menu-font-size ul.dropdown-menu li a").click(function(e) {
    $("div#snte-menu-font-size button span.value").text($(this).text());
    $("div#snte-menu-font-size button").data("value", $(this).data("value"));

   snte_wysiwyg_apply_font_size();

   e.preventDefault();
  });
  $("button#snte-menu-font-color").click(function(e) {
    $("div#snte-menu-font-color-picker").colorpicker("show");

    e.preventDefault();
  });
}

function snte_wysiwyg_apply_font() {
  snte_wysiwyg_apply_font_family();
  snte_wysiwyg_apply_font_size();
  snte_wysiwyg_apply_font_color();
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
  if(snteWorkspaceFocusedElement != null) {
    snteWorkspaceFocusedElement.focus();

    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("bold", false, null);
  }
}
function snte_wysiwyg_apply_font_italic() {
  if(snteWorkspaceFocusedElement != null) {
    snteWorkspaceFocusedElement.focus();

    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("italic", false, null);
  }
}
function snte_wysiwyg_apply_font_underline() {
  if(snteWorkspaceFocusedElement != null) {
    snteWorkspaceFocusedElement.focus();

    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("underline", false, null);
  }
}
function snte_wysiwyg_apply_font_strikethrough() {
  if(snteWorkspaceFocusedElement != null) {
    snteWorkspaceFocusedElement.focus();

    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("strikeThrough", false, null);
  }
}

function snte_wysiwyg_apply_font_family() {
  if(snteWorkspaceFocusedElement != null) {
    console.log("apply font family");
    console.log(snteWorkspaceFocusedElement);
    console.log($("div#snte-menu-font-family button").data("value"));
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("fontName", false, $("div#snte-menu-font-family button").data("value"));
    snteWorkspaceFocusedElement.focus();
  }
}

function snte_wysiwyg_apply_font_size() {
  if(snteWorkspaceFocusedElement != null) {
    console.log("apply font size");
    console.log(snteWorkspaceFocusedElement);
    console.log($("div#snte-menu-font-size button").data("value"));
    // http://home.earthlink.net/~silvermaplesoft/standards/size_heading.html
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("fontSize", false, $("div#snte-menu-font-size button").data("value"));
    /*
    // fontSize only accepts values from 1-7, see https://developer.mozilla.org/en-US/docs/Rich-Text_Editing_in_Mozilla#Executing_Commands
    // workaround found here http://stackoverflow.com/questions/5868295/document-execcommand-fontsize-in-pixels
    document.execCommand("fontSize", false, 1);
    $("font[size=1]", snteWorkspace).removeAttr("size").css("font-size", $("div#snte-menu-font-size button").data("value"));
    */
    
    snteWorkspaceFocusedElement.focus();
  }
}

function snte_wysiwyg_apply_font_color() {
  if(snteWorkspaceFocusedElement != null) {
    console.log("apply font color");
    console.log(snteWorkspaceFocusedElement);
    console.log($("button#snte-menu-font-color").data("value"));
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("foreColor", false, $("button#snte-menu-font-color").data("value"));
    snteWorkspaceFocusedElement.focus();
  }
}

function snte_workspace_add_item(type) {
  console.log("Add item of type "+type);
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
        break;
      case "image":
        break;
    }
}

function snte_workspace_add_table() {
  var nextId = snte_generate_element_id();
  var newElement = $("<div class=\"snte-element snte-element-table\" id=\"snte-element-"+nextId+"\"></div>");
  newElement.handsontable({
    startRows: 10,
    startCols: 10,
    colHeaders: true,
    rowHeaders: true,
    manualColumnResize: true,
    contextMenu: true,
    scrollV: "none",
    scrollH: "none"
  });
  
  var newElementContainer = $("<div class=\"snte-element-container\" id=\"snte-element-"+nextId+"\"><div class=\"snte-element-title\" title=\"MSG-Click-to-edit\">MSG-Unnamed-Table</div><div class=\"snte-element-control-handles snte-hidden\"><div class=\"snte-element-drag-handle\"></div><div class=\"snte-element-delete\"></div></div></div>");
  newElementContainer.mouseover(function() {
    $(this).addClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).removeClass("snte-hidden");
  });
  newElementContainer.mouseout(function() {
    $(this).removeClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).addClass("snte-hidden");
  });
  $("div.snte-element-delete", newElementContainer).click(function() {
    if(confirm("MSG-Sure?")) {
      $(this).closest("div.snte-element-container").remove();
    }
  });
  $("div.snte-element-title", newElementContainer).editable(function(value, settings) {
      if(value == "") {
        value = "MSG-Unnamed-Table";
      }
      return value;
    }, {
    onblur: "submit"
  });
  newElementContainer.draggable({
    handle: $("div.snte-element-drag-handle", newElementContainer),
    containment: snteWorkspaceContainer,
    cursor: "move",
    opacity: "0.5",
    snap: true
  });

  snteWorkspaceElements[nextId] = newElement;
  newElement.appendTo(newElementContainer);
  newElementContainer.appendTo(snteWorkspace);
  
}

function snte_workspace_add_text() {
  var nextId = snte_generate_element_id();

  var newElement = $("<div class=\"snte-element snte-element-text\" id=\"snte-element-"+nextId+"\" contenteditable=\"true\"></div>");
  
  var newElementContainer = $("<div class=\"snte-element-container\" id=\"snte-element-"+nextId+"\"><div class=\"snte-element-control-handles snte-hidden\"><div class=\"snte-element-drag-handle\"></div><div class=\"snte-element-delete\"></div></div></div>");
  newElementContainer.mouseover(function() {
    $(this).addClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).removeClass("snte-hidden");
    $(this).addClass("snte-highlighted");
  });
  newElementContainer.mouseout(function() {
    $(this).removeClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).addClass("snte-hidden");
    $(this).removeClass("snte-highlighted");
  });
  $("div.snte-element-delete", newElementContainer).click(function() {
    if(confirm("MSG-Sure?")) {
      $(this).closest("div.snte-element-container").remove();
    }
  });
  newElementContainer.draggable({
    handle: $("div.snte-element-drag-handle", newElementContainer),
    containment: snteWorkspaceContainer,
    cursor: "move",
    opacity: "0.5",
    snap: true
  });
  newElement.focus(function(e) {
    snteWorkspaceFocusedElement = $(this);
    $(this).addClass("snte-highlighted");
  });
  newElement.blur(function(e) {
    $(this).removeClass("snte-highlighted");
  });
  newElement.click(function(e) {
    snte_chrome_set_font_controls("text", $(e.target));
    e.preventDefault();
  });

  snteWorkspaceElements[nextId] = newElement;
  newElement.appendTo(newElementContainer);
  newElementContainer.appendTo(snteWorkspace);
  newElement.focus();
  snte_wysiwyg_apply_font();
}

function snte_workspace_add_comment() {
  var nextId = snte_generate_element_id();

  var newElement = $("<div class=\"snte-element snte-element-comment\" id=\"snte-element-"+nextId+"\" contenteditable=\"true\"></div>");
  
  var newElementContainer = $("<div class=\"snte-element-container\" id=\"snte-element-"+nextId+"\"><div class=\"snte-element-control-handles snte-hidden\"><div class=\"snte-element-drag-handle\"></div><div class=\"snte-element-delete glyphicon glyphicon-remove\"></div></div></div>");
  newElementContainer.mouseover(function() {
    $(this).addClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).removeClass("snte-hidden");
  });
  newElementContainer.mouseout(function() {
    $(this).removeClass("snte-highlighted");
    $("div.snte-element-control-handles", $(this)).addClass("snte-hidden");
  });
  $("div.snte-element-delete", newElementContainer).click(function() {
    if(confirm("MSG-Sure?")) {
      $(this).closest("div.snte-element-container").remove();
    }
  });
  newElementContainer.draggable({
    handle: $("div.snte-element-drag-handle", newElementContainer),
    containment: snteWorkspaceContainer,
    cursor: "move",
    opacity: "0.5",
    snap: true
  });
  newElement.focus(function(e) {
    snteWorkspaceFocusedElement = $(this);
    $(this).addClass("snte-highlighted");
  });
  newElement.blur(function(e) {
    $(this).removeClass("snte-highlighted");
  });
  newElement.click(function(e) {
    snte_chrome_set_font_controls("text", $(e.target));
    e.preventDefault();
  });

  snteWorkspaceElements[nextId] = newElement;
  newElement.appendTo(newElementContainer);
  newElementContainer.appendTo(snteWorkspace);
  newElement.focus();
  snte_wysiwyg_apply_font();

  snte_chrome_show_comments();
  snte_workspace_show_comments();
}

function snte_generate_element_id() {
  var date = new Date();
  return "e"+date.getTime();
}

function snte_chrome_toggle_button(btn) {
  if(btn.hasClass("active")) {
    btn.removeClass("active");
  }
  else {
    btn.addClass("active");
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

function snte_chrome_set_font_controls(element_type, source) {
  var valuesToSet = {"family": true, "size": true, "color": true, "bold": true, "italic": true, "underline": true, "strikethrough": true};
  if(element_type == "text") {
    $("button#snte-menu-font-bold").removeClass("active");
    $("button#snte-menu-font-italic").removeClass("active");
    $("button#snte-menu-font-underline").removeClass("active");
    $("button#snte-menu-font-strikethrough").removeClass("active");

    var currentElement = source;
    while(!currentElement.hasClass("snte-element")) {
      console.log(currentElement);
      if(currentElement.is("span") && currentElement.attr("style")) {
        console.log(currentElement.attr("style"));
        if(currentElement.attr("style").contains("font-family") && valuesToSet.family) {
          $("div#snte-menu-font-family button span.value").text(currentElement.css("font-family"));
          $("div#snte-menu-font-family button").data("value", currentElement.css("font-family"));
          valuesToSet.family = false;
        }
        if(currentElement.attr("style").contains("color") && valuesToSet.color) {
          $("span#snte-menu-font-color-picker-indicator").css("background-color", currentElement.css("color"));
          $("button#snte-menu-font-color").data("value", currentElement.css("color"));
          valuesToSet.color = false;
        }
        if(currentElement.attr("style").contains("font-weight") && valuesToSet.bold) {
          $("button#snte-menu-font-bold").addClass("active");
          valuesToSet.bold = false;
        }
        if(currentElement.attr("style").contains("font-style") && valuesToSet.italic) {
          $("button#snte-menu-font-italic").addClass("active");
          valuesToSet.italic = false;
        }
        if(currentElement.attr("style").contains("text-decoration")) {
          if(currentElement.attr("style").contains("underline") && valuesToSet.underline) {
            $("button#snte-menu-font-underline").addClass("active");
            valuesToSet.underline = false;
          }
          if(currentElement.attr("style").contains("line-through") && valuesToSet.strikethrough) {
            $("button#snte-menu-font-strikethrough").addClass("active");
            valuesToSet.strikethrough = false;
          }
        }
      }
      if(currentElement.is("font") && currentElement.attr("size")) {
        if(valuesToSet.size) {
          $("div#snte-menu-font-size button span.value").text(fontSizeMap[currentElement.attr("size")]);
          $("div#snte-menu-font-size button").data("value", currentElement.attr("size"));
          valuesToSet.size = false;
        }
      }
      currentElement = currentElement.parent();
    }
  }
}