module.exports = {

    // Starts the cate-webapi executable (as new child process).
    // see https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
    wsStart: {
        command: "C:\\Users\\norma\\Miniconda3\\envs\\ect\\Scripts\\cate-webapi.exe",
        args: ['--port', '9090', '--caller', 'cate-desktop', '--file', 'cate-webapi.json', 'start'],
        options: {}
    },

    // Stops the cate-webapi executable.
    // see https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
    wsStop: {
        command: "C:\\Users\\norma\\Miniconda3\\envs\\ect\\Scripts\\cate-webapi.exe",
        args: ['--port', '9090', '--caller', 'cate-desktop', '--file', 'cate-webapi.json', 'stop'],
        options: {}
    },

    // Preferences file, default is ~/.cate/cate-prefs.js
    prefsFile: null,

    // Whether or not DevTools are initially opened
    devToolsOpened: true,

    // DevTools extensions
    devToolsExtensions: [
        // Put your DevTools extensions paths here.
        // Refer to http://electron.atom.io/docs/tutorial/devtools-extension/ for help.
    ],
};
