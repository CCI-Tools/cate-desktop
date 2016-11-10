# cate-desktop

## Overview

`cate-desktop` provides a desktop GUI for *Cate*, the ESA CCI Toolbox.


### Install dependencies

```
npm install
```

### Compile

```
npm run build
```

### Start App
```
npm start
```

### Build installers
```
npm run release
```

## Project Tools

The following tools are used

* [mocha](https://mochajs.org/) unit-testing framework for Node.js.
* [chai](http://chaijs.com/api/bdd/) adds Behaviour Driven Development (BDD) API to `mocha`. 
* [spectron](https://github.com/electron/spectron#application-api) for end-to-end testing of the GUI applications. See script `test:e2e` in `package.json`. 

## Project Structure

The setup of this project was inspired by 
* [electron-boilerplate](https://github.com/szwacz/electron-boilerplate) for the Electron part and by
* [Microsoft/TypeScriptSamples/jsx](https://github.com/Microsoft/TypeScriptSamples/tree/master/jsx) for the TypeScript + React part.

This project currently doesn't use any build tools apart from `npm` and `tsc`, the TypeScript compiler. 
We'll one day want to have hot loading into Electron and then use a tool such as `webpack`. The article 
[React & Webpack](http://www.typescriptlang.org/docs/handbook/react-&-webpack.html) describes how to use webpack + TypeScript + React.

Single configuration files explained:

* [.editorconfig](http://editorconfig.org/)
* [tsconfig.json](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html) 
