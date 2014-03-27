var snteWorkspace;
var snteWorkspaceElements = {};


$(document).ready(function() {
  snte_bootstrap();

  console.log($("table th", snteWorkspace));
});

function snte_bootstrap() {
  snteWorkspace = $("div#snte-workspace");

  $("div#snte-menu-add-element ul.dropdown-menu li a").click(function(e) {
    console.log("Menu Item");
    console.log(this);

    snte_workspace_add_item($(this).data("item"));
    
    e.preventDefault();
  });
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
  var newElement = $("<div class=\"snte-element-table\" id=\"snte-element-"+nextId+"\"></div>");
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

  var newElement = $("<div class=\"snte-element-text\" id=\"snte-element-"+nextId+"\"></div>");
  newElement.editable(function(value, settings) {
      if(value == "") {
        value = " ";
      }
      return value;
    }, {
    onblur: "submit",
    type: "textarea"
  });
  
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

  snteWorkspaceElements[nextId] = newElement;
  newElement.appendTo(newElementContainer);
  newElementContainer.appendTo(snteWorkspace);
}

function snte_workspace_add_header() {

}

function snte_generate_element_id() {
  var date = new Date();
  return "e"+date.getTime();
}