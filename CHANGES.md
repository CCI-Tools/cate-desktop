## Version 2.0.0.dev25 (in development)

* Fixed installation problem with latest Miniconda 4.5.12
  [#831](https://github.com/CCI-Tools/cate/issues/831)

## Version 2.0.0.dev24

* Cate now distinguishes network connection problems from errors of other origin. 
  Improved the error dialog so that network problems are clearly indicated. 
  [#789](https://github.com/CCI-Tools/cate/issues/789)

## Changes in 2.0.0-dev.23

Backend cate-cli 2.0.0.dev22 changes only. 

## Changes in 2.0.0-dev.22

Invalid release.

## Changes in 2.0.0-dev.21

* Fix: Cate does not freeze when computing min max on data that is all NaN [#797](https://github.com/CCI-Tools/cate/issues/797)

## Changes in 2.0.0-dev.20

* Fixed: Simplified GeoDataFrame subsets cannot provide detailed geometry [#768](https://github.com/CCI-Tools/cate/issues/768).
* Fixed: GUI doesn't reopen after closing it [#765](https://github.com/CCI-Tools/cate/issues/765).
* On exit, warn user for unsaved changes.

## Changes in 2.0.0-dev.19

* Fixed performance regression introduced by solution for [#592](https://github.com/CCI-Tools/cate/issues/592).
  If **VARIABLES** panel was opened, the 3D Globe rendering performance was poor.
* Fixed regression introduced by solution for [#702](https://github.com/CCI-Tools/cate/issues/702).
  Value of selected features and value of grid cells at mouse pointer didn't show anymore.

## Changes in 2.0.0-dev.18

* Subset spatial 'mask' parameter shouldn't have resource selection enabled [#699](https://github.com/CCI-Tools/cate/issues/699)
* Values of scalar variables are now always shown in **VARIABLES** panel in Cate Desktop [#702](https://github.com/CCI-Tools/cate/issues/702)

## Changes in 2.0.0-dev.17

* User-defined Setup fails with existing Miniconda/Anaconda installation [#728](https://github.com/CCI-Tools/cate/issues/728)
* Fixed issue that caused longitude value to change unexpectedly when latitude value is set on a placemark [#682](https://github.com/CCI-Tools/cate/issues/682)
* Now creating a new workspace automatically saves it in the file system [#690](https://github.com/CCI-Tools/cate/issues/690)
* Filled details section for resources of type `GeoDataFrame` in the **WORKSPACE** panel.

## Changes in 2.0.0-dev.16

* Fixed issue in **STYLES** panel that caused UI to hang if min and max were equal 
* Fixed issue with unresponsive or slow **WORKSPACE** panel / **Workflow Steps** tab renderings,
  caused by operation parameter values that are very large strings, such as Glacier CCI polygon WKT values.

## Changes in 2.0.0-dev.15

* Now using environment variables `HTTP_PROXY`, `NO_PROXY`, etc to configure Electron's proxy command-line switches
  to maybe target [#627](https://github.com/CCI-Tools/cate/issues/627) 
* No longer disable table view in **VARIABLES** panel if #rows is > 10000. 

## Changes in 2.0.0-dev.13

* Error when executing exported Python scripts: module 'cate' has no attribute 'ops' [#668](https://github.com/CCI-Tools/cate/issues/668)
* Some fixes to installation issues
* Requires cate-webapi 2.0.0-dev.12

## Changes in 2.0.0-dev.12

Version 2.0.0-dev.12 has been recalled.

## Changes in 2.0.0-dev.11

* Setup error: directory has access restrictions [#642](https://github.com/CCI-Tools/cate/issues/642)
* Cate Desktop's log file `~/.cate/cate-desktop.log` now contains more details about process invocations to allow
  for more effective debugging of setup problems 
* Using `localhost` instead of explicit IP to maybe target [#627](https://github.com/CCI-Tools/cate/issues/627) 

## Changes in 2.0.0-dev.10

### New Features and UX Improvements

* New / save / close workspace toasts sometimes not displayed [#619](https://github.com/CCI-Tools/cate/issues/619)
* Missing notification on auto-update [#615](https://github.com/CCI-Tools/cate/issues/615)
* Show a data source's terms and conditions [#518](https://github.com/CCI-Tools/cate/issues/518)
* Implement a dimensions' selector dialog [#503](https://github.com/CCI-Tools/cate/issues/503)

### Fixes

* Too many "Loading Pixel Values" [#581](https://github.com/CCI-Tools/cate/issues/581)
* A failed workflow causes a failed pixel values extraction [#616](https://github.com/CCI-Tools/cate/issues/616)


## Changes in 2.0.0-dev.9

### New Features and UX Improvements

* Representative default variables [#590](https://github.com/CCI-Tools/cate/issues/590)
* Drag and drop files on Cate's main window [#597](https://github.com/CCI-Tools/cate/issues/597)
* Some (text) areas in the UI should be user-selectable [#608](https://github.com/CCI-Tools/cate/issues/608)
* Allow proxy configuration in Cate Desktop [#544](https://github.com/CCI-Tools/cate/issues/544)
* Improve error messages and handling [#393](https://github.com/CCI-Tools/cate/issues/393)
* Provided help text with links for the Python code editor opened from the `compute` operation dialog.

### Fixes

* Cate Desktop reuses service started by another user [#577](https://github.com/CCI-Tools/cate/issues/577)
* User Informed of "Raised Exception"s Rather Than Gracefully Informing User [#593](https://github.com/CCI-Tools/cate/issues/593)
* Error - Removal of Resource Causes Failure Instead of Gracefully Informing User [#589](https://github.com/CCI-Tools/cate/issues/589)
* Re-starting Cate Hangs [#582](https://github.com/CCI-Tools/cate/issues/582)
* Closing Cate on Mac [#551](https://github.com/CCI-Tools/cate/issues/551)


## Changes in 2.0.0-dev.8 

### Fixes

* Cate Desktop hangs when restarted after quit while running a task
  [#578](https://github.com/CCI-Tools/cate/issues/578)
* Closing Cate on Mac
  [#551](https://github.com/CCI-Tools/cate/issues/551), revisited.

## Changes in 2.0.0-dev.7

### New Features and UX Improvements 

* Display long names of variables
  [#574](https://github.com/CCI-Tools/cate/issues/574)

### Fixes

* Cate Desktop hangs after upgrading WebAPI to 2.0.0.dev6
  [#569](https://github.com/CCI-Tools/cate/issues/569)

## Changes in 2.0.0-dev.6

* No actual changes in Cate Desktop, but requiring Cate 2.0.0.dev6 now, because Cate 2.0.0.dev5 WebAPI is broken.

## Changes in 2.0.0-dev.5

### New Features and UX Improvements 

* Improve split layer UI 
  [#567](https://github.com/CCI-Tools/cate/issues/567)

## Changes in 2.0.0-dev.4

### Fixes

* Closing Cate on Mac
  [#551](https://github.com/CCI-Tools/cate/issues/551)
* Opening Cate on Mac
  [#550](https://github.com/CCI-Tools/cate/issues/550), 
  setting Cate service timeout to 30 seconds.
* Operations hanging and can't cancel 
  [#549](https://github.com/CCI-Tools/cate/issues/549), 
  now preventing hanging operation progress reports by fixing server-side threading problem.
* Temporary fix for dealing with NaN values in JSON responses from Cate WebAPI.
  (JSON has no representation of the numerical `NaN` value, but Cate WebAPI returns 
  `NaN` it in many cases.)


## Changes in 2.0.0-dev.3

### New Features and UX Improvements 

* Operation to perform arbitrary dataset math
  [#556](https://github.com/CCI-Tools/cate/issues/556)
* Animated map  
  [#86](https://github.com/CCI-Tools/cate/issues/86)


## Changes in 2.0.0-dev.2

### New Features and UX Improvements 

* Context menu on 3D globe
  [#542](https://github.com/CCI-Tools/cate/issues/542)
* Place layer/entity style settings in separate STYLES panel
  [#533](https://github.com/CCI-Tools/cate/issues/533)
* User defined geometries
  [#401](https://github.com/CCI-Tools/cate/issues/401)
* animated map  
  [#86](https://github.com/CCI-Tools/cate/issues/86)

### Fixes 

* World view info overlay overlays dialogues
  [#552](https://github.com/CCI-Tools/cate/issues/552)
* High GPU loads even when inactive
  [#532](https://github.com/CCI-Tools/cate/issues/532)


## Changes in 2.0.0-dev.1

### New Features and UX Improvements 

* Don't force users to install Cate Core
  [#523](https://github.com/CCI-Tools/cate/issues/523)
* Sign Cate installers and apps
  [#522](https://github.com/CCI-Tools/cate/issues/#522)
* Placemarks should be on a separate layer
  [#516](https://github.com/CCI-Tools/cate/issues/#516)
* Changing layer visibility also changes layer selection 
  [#515](https://github.com/CCI-Tools/cate/issues/#515)
* Make VARIABLES panel display variable values
  [#505](https://github.com/CCI-Tools/cate/issues/#505)
* Allow using selected geometry as operation parameter
  [#502](https://github.com/CCI-Tools/cate/issues/#502)
* Allow displaying large vector data sources
  [#491](https://github.com/CCI-Tools/cate/issues/491)
* Allow selecting geometries on 3D globe 
  [#489](https://github.com/CCI-Tools/cate/issues/489)
* Add style editor for vector data layers
  [#488](https://github.com/CCI-Tools/cate/issues/#488)
* Use nearest-neighbor resampling for image layer display
  [#482](https://github.com/CCI-Tools/cate/issues/482)
* Remember selection states in UI
  [#481](https://github.com/CCI-Tools/cate/issues/481)
* Auto Update 
  [#404](https://github.com/CCI-Tools/cate/issues/404)
* Allow for Cate software updates without reinstallation
  [#367](https://github.com/CCI-Tools/cate/issues/367)

### Fixes 

* AppImage lacks needed dependency
  [#517](https://github.com/CCI-Tools/cate/issues/517)
* Changing layer visibility also changes layer selection
  [#515](https://github.com/CCI-Tools/cate/issues/#515)
* Outdated links in Cate Desktop's help menu
  [#511](https://github.com/CCI-Tools/cate/issues/#511)
* Be tolerant of "invalid" geometries
  [#506](https://github.com/CCI-Tools/cate/issues/#506)
* Internal error when computing variable statistics for Shapefile variables
  [#485](https://github.com/CCI-Tools/cate/issues/485)
* Fixed problem with 3D globe overlay
  [#480](https://github.com/CCI-Tools/cate/issues/480)
* Detect a free port number for Cate WebAPI
  [#479](https://github.com/CCI-Tools/cate/issues/479)
* support-help windows cate1.0 gui exiting with error
  [#469](https://github.com/CCI-Tools/cate/issues/469)
* Cate wont work if installed on drive other than home drive
  [#466](https://github.com/CCI-Tools/cate/issues/466)
* `read_csv` operation has a parameter `more_args` which isn't used
  [#464](https://github.com/CCI-Tools/cate/issues/464)
* No longer able to select dataset for operations 
  [#463](https://github.com/CCI-Tools/cate/issues/463)
* Cate doesn't work when two instances are open at once 
  [#459](https://github.com/CCI-Tools/cate/issues/459)
* Issue with updating cate version on Windows
  [#428](https://github.com/CCI-Tools/cate/issues/428)
* "Save Workspace As" does not work
  [#419](https://github.com/CCI-Tools/cate/issues/419)

## Changes 1.0.0

### UX Improvements and new Features

* Cate doesn't work when two instances are open at once
  [#459](https://github.com/CCI-Tools/cate/issues/459)
* Run in offline mode
  [#405](https://github.com/CCI-Tools/cate/issues/405)
* Graceful degradation when WebGL fails
  [#400](https://github.com/CCI-Tools/cate/issues/400)

### Fixes

* 3D globe error on OS X
  [#408](https://github.com/CCI-Tools/cate/issues/408)
* Background map invisible on globe
  [#448](https://github.com/CCI-Tools/cate/issues/448)
* Missing static background map
  [#453](https://github.com/CCI-Tools/cate/issues/453)
* Ask before exit
  [#424](https://github.com/CCI-Tools/cate/issues/424)
* Generated resource names not always unique
  [#391](https://github.com/CCI-Tools/cate/issues/391)
* Two Datasets opened in parallel via OPeNDAP are loaded into same resource
  [#306](https://github.com/CCI-Tools/cate/issues/306)
* Prevent multiple concurrent attempts to load data sources
  [#386](https://github.com/CCI-Tools/cate/issues/386)
* Time constraint is being ignored for data download if entered in wrong format
  [#345](https://github.com/CCI-Tools/cate/issues/345)
* Illegal time range accepted and used in wrong way
  [#374](https://github.com/CCI-Tools/cate/issues/374)
* Values persisted in "Download Data Source" window
  [#307](https://github.com/CCI-Tools/cate/issues/207)
* Only allow valid python identifiers as resource names
  [#436](https://github.com/CCI-Tools/cate/issues/436)
* Open Dataset dialogue keeps values from previous selection
  [#417](https://github.com/CCI-Tools/cate/issues/417)

### Other Changes

* We decided to remove the 2D map view (OpenLayers), because we had too many issues
  keeping it in sync with the 3D globe view (Cesium).
  [#390](https://github.com/CCI-Tools/cate/issues/390)

## Changes in 0.9.0

### UX Improvements and new Features

* The **Download Data Source** dialog opened from the **DATA SOURCES** panel has been simplified and now produces
  a new workflow step which calls operation `open_dataset(..., force_local=True)`
  [#366](https://github.com/CCI-Tools/cate/issues/366). Like for any other operation step,
  users can be inspect and edit input values and re-invoke the operation any time later
  from the **WORKSPACE** panel [#314](https://github.com/CCI-Tools/cate/issues/314).
* On the **Abstract** tab of the **DATA SOURCES** panel show information about spatial and temporal coverage.
* Enable the **Show data in table** action only for resources of type type `DataFrame`.
* To speed up loading of workspaces, workflow steps can now be *persistent*:
  When a workspace is saved, all persistent steps that produce resources of type `Dataset`
  write their current resources to a `<workspace-dir>/.cate-workspace/<resource_name>.nc` file.
  When the workspace is reopened, such resource for persistent steps are read from file rather
  than being computed by the step's operation.
  To set the new persistence property of a step, click the *Workflow Step Properties* button
  in the **WORKSPACE** panel.
* Improved display of workflow step inputs in **WORKSPACE** panel:
  - display the units of an operation input value, if any
  - display the default value, if any, if an operation input is not given
* Improved styling for the **TASKS** panel and the task section of the **Status Bar**:
  - improve overall layout of task entries
  - more padding to separate the individual entries
  - prevent *Close* button from growing vertically
  - add space between the progress bar and the cancel button
  - replace too big spinner icon in **Status Bar** with a small progressbar
  - add details action to failed tasks
* The **VIEW** panel now has a checkbox *Split selected image layer*. If selected, the selected
  image layer can be vertically split, where only the left side of the split remains visible.
* Improvements for the **DATA SOURCES** panel:
  * To simplify data access for new users, there is now only one primary action for both the
    `local` and the `esa_cci_odp` data stores: *Open Local Dataset* and *Download Data Source*.
    The latter can now also open the dataset after download or open from remote (using OPeNDAP).
  * Edit fields for the constraints such as time range, region, variable names are now collapsible.
* Plots can now have a title
* Currently visible variable layers and their indexers are now shown as overlay in 3D Globe view.
  The overlay can be turned off in the **VIEWS** panel.
* Added an *Copy to Clipboard* action in **WORKSPACE** panel which is used to copy the workflow steps
  to JSON, Python script, and shell script.
* Figure views now have scrollbars.
* Various improvements for the **DATA SOURCES** panel:
   * Displaying human-readable data source titles
     retrieved from the data catalogue of the CCI ODP.
   * New details view which shows the abstract and a button to open the related CCI ODP catalogue page
   * Open Dataset Dialogs titles are now either "Open Local Dataset" or "Open Remote Dataset (via OPeNDAP)"
   * Download button now always disabled for the "local" data store
   * Open and download dialogs now use "Lon. from/to" and "Lat. from/to" rather than "W", "E", "S", "N"
* Improved the default placeholder text for geometry fields
* Operation dialog shows operation name in title
* Double-click on list elements now invokes the primary action (the blue button).
   Note, there is still an issue with double-clicks on already selected items.
   Double-clicks should now work for **DATA SOURCE** panel, **OPERATIONS** panel,
   and variable selection dialogs.
* The details tables of the **DATA SOURCES** panel and **WORKSPACE** panel
   now have a `...` button to show long values in a pop-up window.
* In **VARIABLES** panel, we now display all (meta-info) attributes of the selected variable.


### Fixes

* "Window" sub-menu is empty [#362](https://github.com/CCI-Tools/cate/issues/362)
* Splash screen must not stay on top [#363](https://github.com/CCI-Tools/cate/issues/363)
* Make alpha blending work for all color maps [#360](https://github.com/CCI-Tools/cate/issues/360)
* GUI-Preferences for data store files do not overwrite conf.py
  [#350](https://github.com/CCI-Tools/cate/issues/350)
* Fixed date input components (for a single date and for date ranges) used in diverse places.
  Now a simple text input field is used.
  [#303](https://github.com/CCI-Tools/cate/issues/303) and [#335](https://github.com/CCI-Tools/cate/issues/335)
* Only persist the parameter values for the Time and Region constraints in the
  **Open Local Dataset** and **Download Data Source** dialogs of the **DATA SOURCES** panel.
  [#307](https://github.com/CCI-Tools/cate/issues/307) and [#308](https://github.com/CCI-Tools/cate/issues/308)
* Fix handling and formatting of date ranges [#313](https://github.com/CCI-Tools/cate/issues/313).
* The resource switch in the **OPERATION STEP** dialog is only enabled
  when the drop-down box would contain any **compatible resource**
  [#310](https://github.com/CCI-Tools/cate/issues/310).
* Only show lat/lon values when mouse is over globe [#312](https://github.com/CCI-Tools/cate/issues/312).
* Prevent a 2nd (and 3rd) invocation of the variable statistics computation
* Fixed in the **WORKSPACE** panel the details table for dataset attributes, table was always empty.
* Fixed a problem with the *Download Data Source* dialog opened from **DATA SOURCES** panel.
  It always used the last local data source name, although a different remote data source has been selected.
* 2D map / 3D globe layer containing country borders now works.
* Fixed a severe bug where Cate Desktop was unable to find the matching `~/.cate/<version>` directory.
  (Problem was a bug in conversion from PEP440 to SemVer version strings.)
* Fixed a problem with non-editable *variable names* field in *Download Dataset* and *Open Dataset* dialogs
  opened from the **DATA SOURCES** panel.


## Changes in 0.8.0

### UX Improvements

1. Changed the inital position and visibility of tool panels to better reflect the envisaged cate workflow
   * DATA SOURCES - top left
   * OPERATIONS - bottom left
   * WORKSPACE - top right
   * VARIABLES - bottom right
2. All action buttons now have tooltips
3. PLACEMARK panel now has now three modes to copy position: 
   - `<lon>,<lat>` 
   - `lon=<lon>,lat=<lat>`
   - `POINT (<lon>,<lat>)`
4. On backend errors, users can now copy error message with Cate version info to clipboard
5. The *Workflow* tab showing workflow steps in the **WORKSPACE** panel is now the primary tab.
   Selecting a workflow steps also selects its output resource.
6. Use letters as initial placemark names.
1. Added **PLACEMARKS** panel, which provides a simple placemark management
   * add placemark (by clicking on globe)
   * add placemark (by globe center coordinate)
   * remove selected placemark
   * copy name + coordinate to clipboard
2. **WORKSPACE** panel improvements:
   * For easier access to plots, `matplotlib` figure views can now be opened using a dedicated button.
   * Two new buttons added: *Delete* resource and *Clean* workspace.
   * All action buttons are now available for both resources and workflow steps.
3. If an operation produces a resource of type `Figure`, it will be initially **shown in a plot view**.
   This default behaviour can be disabled from main menu under *File/Preferences*.
4. Cate now displays messages in **toasts** - lightweight, ephemeral notices in direct response
   to a user's action.
5. The **details part of an error message** (e.g. Python stack traceback) can now be **copied to clipboard**.
7. Added simple **About Box**.
8. Fixed layout problem in **LAYERS** panel, where sliders where outside visible panel area.
9. Fixed problem where **last window size** was not restored from user preferences.
10. `devToolsOpened` is now a user preference rather than a configuration property.
11. Fixed a problem where rows were missing in the *Meta-Info* table of the **DATA SOURCES** panel.
12. Fixed problem where no open dialog was displayed after pressing the *Open* or *Download* buttons
    in the **DATA SOURCES** panel (in the logs: `DateRangeInput value cannot be null`).
13. Fixed bug where the selected placemark is misplaced after CesiumView is remounted
1. Operation step inputs can now be edited an re-executed:
   In **WORKSPACE** panel, select **Steps**, select a step, and click the **Edit** button.
2. `matplotlib` figures returned from various `plot` operations can now be displayed with some limited interactions
   like zooming and panning:
   1. In **OPERATIONS** panel, select a `plot()` operation step, and press **Apply**
   2. In **VIEW** panel, click new view **Figure** button
3. Views can now be positioned. Click a view's **More Menu (...)** and select *Move Before* or *Move After*.
   Later on, this will be possible via drag and drop.
4. Fixed problem where existence of `~/.cate` was not checked before it was accessed.
5. Fixed problem where a variable's **image layer settings were gone** after selecting another variable.
   Such layer settings are now stored in user preferences store, so that they are available in the next Cate session.

### Fixes

1. Fixed problem with numeric input fields which accepted only integer values rather than floats (ONGOING) 
2. Fixed bug where two clicks were required to create a new placemark
3. Removed the non-functional dummy menu from left/right tool panel headers.
4. Fixed validation of variable names when there is no resource with variables to to compare with
5. Fixed problem where numeric/text inputs in modal dialogs where not accepted (root cause was continued 3D globe position display in status bar)
6. Fixed copy position to clipboard, which copied name instead
1. fixed problem where Cate backend couldn't be started (cause: wrong stdio config for node's `child_process.spawn()`)
2. fixed problem where Cate backend couldn't be stopped (cause: the backend was invoked without activated Python env)

