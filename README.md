SNTE - say no to Excel!
===============
A functional prototype implementation of a fresh approach to spreadsheets. The software incorporates findings from a user study as well as a comprehensive literature review conducted as part of a master thesis at Vienna University of Technology.

See the demos at [http://snte.steviec.at/](http://snte.steviec.at/).

## Key features
 - unlimited workspace (as opposed to the well-known grid)
 - different workspace elements: tables, textfields, comments, images, charts
 - simplified formula editing
 - reduced featureset focusing on common tasks in the private domain
 - compact, usable interface

## Usage
All logic is contained in [snte.js](https://github.com/csizmazia/say-no-to-excel/blob/master/js/snte.js).
Setup of the application happens in snte_boostrap() function.
```js
snte_boostrap()
```

## Configuration
All configuration of the SNTE application is done with global variables.
```js
var snteSupportedLanguages = [];
var snteDefaultLanguage = "en";

var snteImage = {};

var snteChromeSize = {};
var snteWorkspaceSize = {};
var snteDefaultElementSizes = {};

var snteWYSIWYG = {};

var snteCellTypes = {};

var snteSupportedFormulas = [];

var snteFillColorNeedsBlackFont = []
var snteColorPalette = [];
```

## Workspace
### Adding new elements
Adding new elements to the workspace can be done manually by the user or programmatically.
All elements available to user creation have a corresponding entry in the #snte-menu-add-element dropdown-menu. 
A single JavaScript function handles interaction events:
```js
function snte_workspace_add_element(type) {...}
```

Adding and configuring workspace elements programmatically allows for building small dedicated spreadsheet apps.
The histogram-element is an example for that: it consists of a pre-configured table, a special chart and two comments.
```js
function snte_workspace_add_histogram() {
  var $tableCommentElement = snte_workspace_add_comment();
  $tableCommentElement.html(i18n.t("histogram.table-hint"));
  snte_workspace_resize_element($tableCommentElement, "400px", "150px");
  snte_workspace_position_element($tableCommentElement, snteChromeSize.top.height, 50);

  var $chartCommentElement = snte_workspace_add_comment();
  $chartCommentElement.html(i18n.t("histogram.chart-hint"));
  snte_workspace_resize_element($chartCommentElement, "300px", "130px");
  snte_workspace_position_element($chartCommentElement, snteChromeSize.top.height+50, 650);

  var $tableElement = snte_workspace_add_table(snteDefaultElementSizes.histogram.rows, snteDefaultElementSizes.histogram.columns, true, false, true, false, true, false);
  $tableElement.addClass("snte-element-histogram");
  var tableInstance = $tableElement.handsontable("getInstance");
  var tableSettings = $tableElement.handsontable("getSettings");
  tableSettings.colHeaders = false;
  tableSettings.minSpareRows = 1;
  tableInstance.setDataAtCell(0,0,i18n.t("histogram.columns.name.header"));
  tableInstance.setDataAtCell(0,1,i18n.t("histogram.columns.value.header"));
  tableInstance.setDataAtCell(1,0,i18n.t("histogram.columns.name.example"));
  tableInstance.setDataAtCell(1,1,i18n.t("histogram.columns.value.example"));

  tableInstance.selectCell(0,0,0,1);
  snte_wysiwyg_update_table_cell_meta("fillColor", "rgba(239,239,239,1)");
  snte_wysiwyg_update_table_cell_meta("bold", true);

  snte_workspace_set_element_title($tableElement, i18n.t("histogram.table-title"));
  snte_workspace_position_element($tableElement, snteChromeSize.top.height+160, 50);

  tableInstance.selectCell(0,0,tableInstance.countRows()-1, tableInstance.countCols()-1);
  $("input#snte-chart-wizard-first-data-row").attr("checked", "checked");
  var $chartElement = snte_workspace_add_chart("histogram");
  $chartElement.addClass("snte-element-histogram");
  snte_workspace_resize_element($chartElement, "600px", "450px");
  snte_workspace_position_element($chartElement, snteChromeSize.top.height+160, 250);
  snte_workspace_set_element_title($chartElement, i18n.t("histogram.chart-title"));

  snte_workspace_bring_to_front($tableCommentElement.parent("div.snte-element-container"));
  snte_workspace_bring_to_front($chartCommentElement.parent("div.snte-element-container"));

  tableInstance.selectCell(1,0);
}
```

### Manipulating elements
Manipulation of workspace elements happens in function prefixed "snte_workspace_".
Supported functionality:
#### get_element_title
Returns the element title. Currently used for tables and charts.
#### set_element_title
Sets the element title. Currently used for tables and charts.
#### remove_element
Move element to trash or delete itpermanently.
#### restore_element
Restore element from trash.
#### reset_focus
Removes focus from the currently focused element.
#### set_focus
Sets focus to an element.
#### position_element
Moves element to the specified place on the workspace.
#### make_draggable
Adds and configures drag'n'drop UI handles to an element.
#### resize_element
Resizes an element to the specified size.
#### make_resizable
Adds and configures resize UI handles to an element.
#### bring_to_front
Brings an element to the front of the workspace stack.
#### send_to_back
Sends an element to the back of the workspace stack.
#### center_element
Moves an element to the middle of the screen.

#### add_histogram
Adds a new histogram element to the workspace.
#### add_chart
Adds a new chart element to the workspace.
#### add_table
Adds a new table element to the workspace.
#### add_text
Adds a new textfield element to the workspace.
#### add_comment
Adds a new comment element to the workspace.
#### add_image
Adds a new image element to the workspace.

## i18n
For new translations, simply place corresponding language-files in a sub-directory within [locales](https://github.com/csizmazia/say-no-to-excel/blob/master/locales) folder. Names of the sub-directories are language-codes (e.g. "de", "en"). Language-files must be named "translation.json" and contain JSON encoded object.
To register a new translation, add it to the global configuration variable snteSupportedLanguages.
```js
var snteSupportedLanguages = ["en", "de"];
var snteDefaultLanguage = "en";
```

## Builds on
 - jQuery
 - jQuery UI
 - Bootstrap
 - jquery-handsontable
 - jquery-handsontable-excel
 - i18next
 - Numeral
 - phpJS

## License
The MIT License (see the [LICENSE](https://github.com/csizmazia/say-no-to-excel/blob/master/LICENSE) file for the full text).