module.exports = {

    // Starts the cate-webapi executable (as new child process)
    // see https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
    wsStart: {
        command: "C:\\Users\\Norman\\Miniconda3\\envs\\ect\\Scripts\\cate-webapi.exe",
        args: ['--port', '9090', 'start'],
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
