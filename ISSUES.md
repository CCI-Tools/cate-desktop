
- Other console warnings
  * Fix "electron/js2c/renderer_init.js:2702 Electron Security Warning (Insecure Content-Security-Policy) ..."
    Have a look at JS package [safe-eval]()https://www.npmjs.com/package/safe-eval) to fix all JS `eval()` calls.
  * Fix "DevTools failed to parse SourceMap: file:///..."

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
  
- "componentWillUpdate has been renamed, and is not recommended for use." console warning.
  * Fix CesiumGlobe

- Cannot add any new placemarks to Cesium globe
  * Fix adding a point - crash, see console
  * Fix adding a line - no error on console, only marker points shown, but connecting line shown, no line placemark added
  * Fix adding a polygon - error on console, only marker points shown, but connecting line shown, no line placemark added
  * Fix adding a rectangle - no error on console, nothing shown, no placemark added
  

- Styling issues
  * Fix too small data store selector in *DATA SOURCES* panel.
  * Fix vertical non-alignment of green "Add tag" button and subsequently added tags
  * Fix "Display range" input field not aligned with right-side "<->" button 


- Coding issues
  * Replace `src/renderer/components/Card.tsx` usages by `@blueprintjs.core.Card`
