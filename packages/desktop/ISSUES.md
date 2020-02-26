### Blueprint

- Styling issues
  * Fix data store selector being to slim in width in **DATA SOURCES** panel.
  * Fix vertical non-alignment of green "Add tag" button and subsequently added tags in **OPERATIONS** panel.
  * Fix "Display range" input field not aligned with right-side "<->" button in **STYLES** panel. 
  * Fix vertical non-alignment of icon and label in "Active view" control of **VIEW** panel.
  * Fix too large cell heights in **LAYERS** panel items.
  * Fix non-alignment of checkboxes and label text in **LAYERS** panel items.
  * Fix tooltip flickering in **OPERATIONS** panel (Add Step button).
  * Fix tooltip flickering in **WORKSPACE** panel (Resource/step properties, clean workspace buttons).
  * Fix tooltip flickering in **VARIABLES** panel (Create a time series button).
 
- Coding issues
  * Replace `src/renderer/components/Card.tsx` usages by `@blueprintjs.core.Card`

### Cesium

- Cannot add any new placemarks to Cesium globe
  * Fix adding a point - crash, see console
  * Fix adding a line - no error on console, only marker points shown, but connecting line shown, no line placemark added
  * Fix adding a polygon - error on console, only marker points shown, but connecting line shown, no line placemark added
  * Fix adding a rectangle - no error on console, nothing shown, no placemark added
  * Fix "countries" layer almost invisible in map

### React

- "componentWillReceiveProps has been renamed, and is not recommended for use." console warning.
  * Fix AddDatasetDialog
  * Fix ChooseWorkspaceDialog
  * Fix DownloadDataSourceDialog
  * Fix OperationStepDialog
  * Fix OpenDatasetDialog
  * Fix PanelContainer
  * Fix PreferencesDialog
  * Fix RemoveDatasetDialog
  * Fix SelectWorkspaceDialog
  * Fix ViewManager  
  
- "componentDidUpdate has been renamed, and is not recommended for use." console warning.
  * Fix NumericRangeField

- "componentWillUpdate has been renamed, and is not recommended for use." console warning.
  * Fix CesiumGlobe


### Other

- Other console warnings
  * Fix "electron/js2c/renderer_init.js:2702 Electron Security Warning (Insecure Content-Security-Policy) ..."
    Have a look at JS package [safe-eval]()https://www.npmjs.com/package/safe-eval) to fix all JS `eval()` calls.
  * Fix "DevTools failed to parse SourceMap: file:///..."
  
- Preferences are not effective anymore
  * Fix preferences not loaded or not stored by main OR not passed from main to renderer or the other way round
    Reproduce: enable "open last workspace on restart" --> no effect
  * Remove preferences that do not apply in remote mode
    - local data path
    - offline mode (?)   

- CateHub login
  * Fix error 502  

- Coding issues
  * Replace `updateObject(a, b, ...)` calls by `{...a, ...b, ...}`.
  * Replace `Object.assign({}, a, b, ...)` calls by `{...a, ...b, ...}`.

- App logic:
  * Electron main, remote mode: Only quit after we have successfully logged out OR after timeout
