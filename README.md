# cate-desktop

[![Build Status](https://travis-ci.org/CCI-Tools/cate-desktop.svg?branch=master)](https://travis-ci.org/CCI-Tools/cate-desktop)
[![Build status](https://ci.appveyor.com/api/projects/status/5fxybbffvfjkdtbk?svg=true)](https://ci.appveyor.com/project/ccitools/cate-desktop)

## Overview

`cate-desktop` provides a desktop GUI for *Cate*, the ESA CCI Toolbox.

## Building from Sources

Note that `cate-desktop` requires [cate-core](https://github.com/CCI-Tools/cate-core) to be installed on your system.
Follow the instruction in `cate-core`'s [README](https://github.com/CCI-Tools/cate-core/blob/master/README.md) first.

Once `cate-core` is ready to be used, get the source code for `cate-desktop`:

    $ git clone https://github.com/CCI-Tools/cate-desktop.git
    $ cd cate-desktop

Now copy file `cate-config.template.js` to a file named `cate-config.js`. Then adjust the `command` parameter 
in `cate-config.js` to match the `cate-webapi` executable located in the Python environment in which you've installed 
`cate-core`.

On Linux and Darwin the value for `command` may look like

    module.exports = {
        webAPIConfig: {
            command: "/home/bibo/apps/miniconda3/envs/cate/bin/cate-webapi",
            ...

while on Windows the value may be similar to (note the double backslashes!)

    module.exports = {
        webAPIConfig: {
            command: "C:\\Users\\Bibo\\Miniconda3\\envs\\cate\\Scripts\\cate-webapi.exe",
            ...

The only development tool initially required to build cate-desktop is the latest version of [Node.js](https://nodejs.org/).
After installing Node.js, we use its package manager `npm` to install all other package dependencies.

    $ npm install

The project `cate-desktop` is programmed in [TypeScript](https://www.typescriptlang.org/). Therefore all TypeScript 
sources must be compiled to JavaScript first:

    $ npm run compile

To finally run the application:
    
    $ npm start

The following commands are of interest for developers.

This is how you can execute all unit-level tests (optional):

    $ npm test

and this is how to perform end-to-end tests (optional):

    $ npm run test:e2e

To build the installer executables for the current platform:

    $ npm run dist

And to build binary packages:

    $ npm run pack

To clean compilation results:

    $ npm run clean

To get rid of all outputs since cloning the repo:

    $ npm run clean:all

## Frameworks and Libraries in use

The following frameworks and libraries are currently used in Cate's production code: 

* [Electron](http://electron.atom.io/), to build cross platform desktop apps with JavaScript, HTML, and CSS.
* [React](https://facebook.github.io/react/), a javascript library for building user interfaces.
* [Redux](http://redux.js.org/), a predictable state container for JavaScript apps. We use the following
  [middleware](http://redux.js.org/docs/advanced/Middleware.html):
  * [redux-thunk](https://github.com/gaearon/redux-thunk), allows to write action creators that return a function 
    instead of an action
  * [redux-logger](https://github.com/evgenyrodionov/redux-logger), a logger middleware for Redux
* [Blueprint](http://blueprintjs.com/), a React UI toolkit.
* [Cesium](https://cesiumjs.org/), an open-source JavaScript library for world-class 3D globes and maps.
* [OpenLayers](https://openlayers.org/), the high-performance, feature-packed library for all your mapping needs.

Utilities:

* [reselect](https://github.com/reactjs/reselect), Selector library for Redux.
* [deep-equal](https://www.npmjs.com/package/deep-equal), Node's `assert.deepEqual()` algorithm as a standalone module.
* [electron-devtools-installer](https://github.com/MarshallOfSound/electron-devtools-installer) is and 
  easy way to install Chrome's DevTool extensions into Electron. 
* [Oboe.js](http://oboejs.com/) for loading JSON using streaming.
* [proj4js](http://proj4js.org/) to transform coordinates from one coordinate system to another.

## Development Tools and Libraries in use

For building:

* [typescript](https://www.typescriptlang.org/index.html) provides Microsoft's TypeScript compiler `tsc`.
* [electron-builder](https://github.com/electron-userland/electron-builder) is used to create distribution packages 
  and installers.

For testing:

* [ts-node](https://github.com/TypeStrong/ts-node) a TypeScript execution environment for Node.js and Electron.  
* [mocha](https://mochajs.org/) JavaScript unit-testing framework for Node.js and Electron.
* [chai](http://chaijs.com/api/bdd/) JavaScript assertion library that adds Behaviour Driven Development 
  (BDD) API to `mocha`. 
* [spectron](https://github.com/electron/spectron#application-api) for end-to-end testing of the GUI applications.
  See script `test:e2e` in `package.json`.
* [enzyme](http://airbnb.io/enzyme/) is a JavaScript Testing utility for React that makes it easier to assert, 
  manipulate, and traverse React Components' output.
* [react-addons-test-utils](https://facebook.github.io/react/docs/test-utils.html) makes it easy to test React 
  components in any testing framework.  

Other tools:

* [rimraf](https://github.com/isaacs/rimraf) is Node's version of Unix `rm -rf`.


## Project Structure

This is how the directory structure will look like after cloning the repo:

    cate-desktop/
    ├── app/                     # Electrion application directory 
    │   ├── resources/           # Application resources: icons, images
    │   ├── main.js              # Called from Electron's main process, see ./package.json
    │   ├── renderer.js          # Called by Electron's renderer process, see ./index.html
    │   ├── index.html           # Loaded by Electron's main process
    │   └── package.json         # Electron application definition 
    ├── src/                     # TypeScript application module sources
    │   ├── main/                # Code running in Electron's main process (with Node API access)
    │   │   └── **/*.ts          #   TypeScript files
    │   └── renderer/            # Code running in Electron's renderer process (w/o Node API access)
    │       ├── **/*.ts          #   TypeScript files
    │       └── **/*.tsx         #   TypeScript JSX files
    ├── e2e/                     # End-to-end tests
    │   └── **/*.js              #   JavaScript files
    ├── .gitignore
    ├── .editorconfig            # see http://editorconfig.org/
    ├── tsconfig.json            # TS compiler configuration
    └── package.json             # Node package definition
  
`cate-desktop` uses a [two-package.json project structure](https://github.com/electron-userland/electron-builder/wiki/Two-package.json-Structure).

* Development dependencies are in `cate-desktop/package.json`
* Application dependencies are in `cate-desktop/app/package.json`

The command `npm install` performs a post-installation step in which the tool `install-app-deps` (comes with `electron-builder`) installs
application dependencies of `cate-desktop/app/package.json`. After this, Node's `node_modules` directories are created

    cate-desktop/
    ├── node_modules/ 
    └── app/                     
        └── node_modules/

After compilation, i.e. `npm run compile`, the `app` directory is populated with compiled JavaScript files:

    cate-desktop/
    └── app/                     
        ├── main/                # Code running in Electron's main process (with Node API access)
        │   └── **/*.js          #   JS files compiled from *.ts files in src/main 
        └── renderer/            # Code running in Electron's renderer process (w/o Node API access)
            └── **/*.js          #   JS files compiled from *.ts and *.tsx files in src/renderer

After distribution (installer) building, i.e. `npm run dist`:

    cate-desktop/
    └──  dist/                   # Distributable application binaries
         └── *.* 

The setup of this project was inspired by 

* [electron-boilerplate](https://github.com/szwacz/electron-boilerplate) for the Electron part and by
* [Microsoft/TypeScriptSamples/jsx](https://github.com/Microsoft/TypeScriptSamples/tree/master/jsx)
  for the TypeScript + React part.
  
The project [onshape-desktop-shell](https://github.com/develar/onshape-desktop-shell) uses a similar setup.  

This project currently doesn't use any other build tools apart from `npm` and `tsc`, the TypeScript compiler. 
We'll one day want to have hot loading into Electron and then use a tool such as `webpack`. The TypeScript article 
[React & Webpack](http://www.typescriptlang.org/docs/handbook/react-&-webpack.html) describes how to use 
TypeScript with webpack and React.

## TODO

* Add [`.travis.yml`](https://docs.travis-ci.com/user/customizing-the-build) with example in
  [onshape-desktop-shell](https://github.com/develar/onshape-desktop-shell).
* Add [`appveyor.yml`](https://www.appveyor.com/docs/appveyor-yml/) also with example in
  [onshape-desktop-shell](https://github.com/develar/onshape-desktop-shell).
* Add [`yarn.lock`](https://yarnpkg.com/en/docs/yarn-lock) as well (what does it?) with example in
  [onshape-desktop-shell](https://github.com/develar/onshape-desktop-shell).
* Provide [auto-updater](https://github.com/electron/electron/blob/master/docs/api/auto-updater.md) support
* Have a look at other Electron development tools:
  * [electron-compile](https://github.com/electron/electron-compile)
  * [electron-debug](https://github.com/sindresorhus/electron-debug)
