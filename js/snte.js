var snteWorkspace;
var snteWorkspaceElements = {};
var snteWorkspaceFocusedElement;


$(document).ready(function() {
  snte_bootstrap();

  console.log($("table th", snteWorkspace));
});

function snte_bootstrap() {
  snteWorkspace = $("div#snte-workspace");
  /*snteWorkspace.click(function(e) {
    console.log("click on workspace");
    snteWorkspaceFocusedElement = snteWorkspace;
    e.preventDefault();
  });*/

  $("div#snte-menu-add-element ul.dropdown-menu li a").click(function(e) {
    console.log("Menu Item");
    console.log(this);

    snte_workspace_add_item($(this).data("item"));
    
    e.preventDefault();
  });

  $("button#snte-menu-font-bold").click(function(e) {
    if(snteWorkspaceFocusedElement != null) {
      snteWorkspaceFocusedElement.focus();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("bold", false, null);
    }
  });
  $("button#snte-menu-font-italic").click(function(e) {
    if(snteWorkspaceFocusedElement != null) {
      snteWorkspaceFocusedElement.focus();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("italic", false, null);
    }
  });
  $("button#snte-menu-font-underline").click(function(e) {
    if(snteWorkspaceFocusedElement != null) {
      snteWorkspaceFocusedElement.focus();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("underline", false, null);
    }
  });
  $("button#snte-menu-font-strikethrough").click(function(e) {
    if(snteWorkspaceFocusedElement != null) {
      snteWorkspaceFocusedElement.focus();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("strikeThrough", false, null);
    }
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
  });
  $("div#snte-menu-font-color ul.dropdown-menu li a").click(function(e) {
    document.execCommand("fontColor", false, $(this).data("value"));
    snteWorkspaceFocusedElement.focus();
    e.preventDefault();
  });
}

function snte_wysiwyg_apply_font() {
  snte_wysiwyg_apply_font_family();
  snte_wysiwyg_apply_font_size();
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
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("fontSize", false, $("div#snte-menu-font-size button").data("value"));
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
      case "header":
        snte_workspace_add_header();
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
    handle: $("div.snte-element-drag-handle", newElementContainer)
  });

  snteWorkspaceElements[nextId] = newElement;
  newElement.appendTo(newElementContainer);
  newElementContainer.appendTo(snteWorkspace);
  
}

function snte_workspace_add_text() {
  var nextId = snte_generate_element_id();

  var newElement = $("<div class=\"snte-element snte-element-text\" id=\"snte-element-"+nextId+"\" contenteditable=\"true\"></div>");
  /*newElement.editable(function(value, settings) {
      if(value == "") {
        value = " ";
      }
      return value;
    }, {
    onblur: "submit",
    type: "textarea"
  });*/
  
  var newElementContainer = $("<div class=\"snte-element-container\" id=\"snte-element-"+nextId+"\"><div class=\"snte-element-control-handles snte-hidden\"><div class=\"snte-element-drag-handle\"></div><div class=\"snte-element-delete\"></div></div></div>");
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
    handle: $("div.snte-element-drag-handle", newElementContainer)
  });
  newElement.focus(function(e) {
    snteWorkspaceFocusedElement = $(this);
    $(this).addClass("snte-highlighted");
  });
  newElement.blur(function(e) {
    $(this).removeClass("snte-highlighted");
  });

  snteWorkspaceElements[nextId] = newElement;
  newElement.appendTo(newElementContainer);
  newElementContainer.appendTo(snteWorkspace);
  newElement.focus();
  snte_wysiwyg_apply_font();
}

function snte_workspace_add_header() {

}

function snte_generate_element_id() {
  var date = new Date();
  return "e"+date.getTime();
}