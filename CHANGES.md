### 0.8.0-rc.7.dev.1

#### UX Improvements

1. Changed the inital position and visibility of tool panels to better reflect the envisaged cate workflow
   * DATA SOURCES - top left
   * OPERATION - bottom left
   * WORKSPACE - top right
   * VARIABLES - bottom right
2. All action buttons now have tooltips
3. PLACEMARK panel now has now three modes to copy position: 
   - `<lon>,<lat>` 
   - `lon=<lon>,lat=<lat>`
   - `POINT (<lon>,<lat>)`

#### Fixes

1. Fixed problem with numeric input fields which accepted only integer values rather than floats (ONGOING) 
2. Fixed bug where two clicks were required to create a new placemark
3. Removed the non-functional dummy menu from left/right tool panel headers.
4. Fixed validation of variable names when there is no resource with variables to to compare with
5. Fixed problem where numeric/text inputs in model dialogs where not accepted (root cause was continued 3D globe position display in status bar)
6. Fixed copy position to clipboard, which copied name instead

### 0.8.0-rc.6

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

### 0.8.0-rc.5

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

### 0.8.0-rc.4

1. fixed problem where Cate backend couldn't be started (cause: wrong stdio config for node's `child_process.spawn()`)
2. fixed problem where Cate backend couldn't be stopped (cause: the backend was invoked without activated Python env)
