## 0.9.0-dev.2

### UX Improvements and new Features

1. Improvements for the **DATA SOURCES** panel:
   * To simplify data access for new users, there is now only one primary action for both the
    `local` and the `esa_cci_odp` data stores: *Open Local Dataset* and *Download Data Source*.
    The latter can now also open the dataset after download or open from remote (using OPeNDAP).
   * Edit fields for the constraints such as time range, region, variable names are now collapsible.
2. Plots can now have a title
3. Currently visible variable layers and their indexers are now shown as overlay in 3D Globe view. 
   The overlay can be turned off in the **VIEWS** panel.
4. Added an *Copy to Clipboard* action in **WORKSPACE** panel which is used to copy the workflow steps 
   to JSON, Python script, and shell script.
   
### Fixes

* Fixed a severe bug where Cate Desktop was unable to find the matching `~/.cate/<version>` directory.
  (Problem was a bug in conversion from PEP440 to SemVer version strings.)
* Fixed a problem with non-editable *variable names* field in *Download Dataset* and *Open Dataset* dialogs
  opened from the **DATA SOURCES** panel.
  

## 0.9.0-dev.1

### UX Improvements and new Features

1. Various improvements for the **DATA SOURCES** panel:
   * Displaying human-readable data source titles
     retrieved from the data catalogue of the CCI ODP.
   * New details view which shows the abstract and a button to open the related CCI ODP catalogue page
   * Open Dataset Dialogs titles are now either "Open Local Dataset" or "Open Remote Dataset (via OPeNDAP)"
   * Download button now always disabled for the "local" data store
   * Open and download dialogs now use "Lon. from/to" and "Lat. from/to" rather than "W", "E", "S", "N"
2. Improved the default placeholder text for geometry fields  
3. Operation dialog shows operation name in title
4. Double-click on list elements now invokes the primary action (the blue button).
   Note, there is still an issue with double-clicks on already selected items.
   Double-clicks should now work for **DATA SOURCE** panel, **OPERATIONS** panel, 
   and variable selection dialogs.   
5. The details tables of the **DATA SOURCES** panel and **WORKSPACE** panel
   now have a `...` button to show long values in a pop-up window. 
6. In **VARIABLES** panel, we now display all (meta-info) attributes of the selected variable.

## 0.8.0-rc.7.dev.1

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

### Fixes

1. Fixed problem with numeric input fields which accepted only integer values rather than floats (ONGOING) 
2. Fixed bug where two clicks were required to create a new placemark
3. Removed the non-functional dummy menu from left/right tool panel headers.
4. Fixed validation of variable names when there is no resource with variables to to compare with
5. Fixed problem where numeric/text inputs in modal dialogs where not accepted (root cause was continued 3D globe position display in status bar)
6. Fixed copy position to clipboard, which copied name instead

## 0.8.0-rc.6

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

## 0.8.0-rc.5

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

## 0.8.0-rc.4

1. fixed problem where Cate backend couldn't be started (cause: wrong stdio config for node's `child_process.spawn()`)
2. fixed problem where Cate backend couldn't be stopped (cause: the backend was invoked without activated Python env)
