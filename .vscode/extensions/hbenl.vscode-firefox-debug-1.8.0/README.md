# VS Code Debug Adapter for Firefox

A Visual Studio Code extension to debug your web application or WebExtension in Firefox.

## Starting
You can use this extension in launch or attach mode.

In launch mode it will start an instance of Firefox navigated to the start page of your application
and terminate it when you stop debugging.
You can also set the `reAttach` option in your launch configuration to `true`, in this case Firefox
won't be terminated at the end of your debugging session and the debugger will re-attach to it when
you start the next debugging session - this is a lot faster than restarting Firefox every time.
`reAttach` also works for WebExtension debugging: in this case, the WebExtension is (re-)installed as a
[temporary add-on](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).

In attach mode the extension attaches to a running instance of Firefox (which must be manually
configured to allow remote debugging - see [below](#attach)).

To configure these modes you must create a file `.vscode/launch.json` in the root directory of your
project. You can do so manually or let VS Code create an example configuration for you by clicking 
the gear icon at the top of the Debug pane.
Finally, if `.vscode/launch.json` already exists in your project, you can open it and add a 
configuration snippet to it using the "Add Configuration" button in the lower right corner of the
editor.

### Launch
Here's an example configuration for launching Firefox navigated to the local file `index.html` 
in the root directory of your project:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch index.html",
            "type": "firefox",
            "request": "launch",
            "reAttach": true,
            "file": "${workspaceFolder}/index.html"
        }
    ]
}
```

You may want (or need) to debug your application running on a Webserver (especially if it interacts
with server-side components like Webservices). In this case replace the `file` property in your
`launch` configuration with a `url` and a `webRoot` property. These properties are used to map
urls to local files:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch localhost",
            "type": "firefox",
            "request": "launch",
            "reAttach": true,
            "url": "http://localhost/index.html",
            "webRoot": "${workspaceFolder}"
        }
    ]
}
```
The `url` property may point to a file or a directory, if it points to a directory it must end with
a trailing `/` (e.g. `http://localhost/my-app/`).
You may omit the `webRoot` property if you specify the `pathMappings` manually. For example, the
above configuration would be equivalent to
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch localhost",
            "type": "firefox",
            "request": "launch",
            "reAttach": true,
            "url": "http://localhost/index.html",
            "pathMappings": [{
                "url": "http://localhost",
                "path": "${workspaceFolder}"
            }]
        }
    ]
}
```
Setting the `pathMappings` manually becomes necessary if the `url` points to a file or resource in a
subdirectory of your project, e.g. `http://localhost/login/index.html`.

### Attach
To use attach mode, you have to launch Firefox manually from a terminal with remote debugging enabled.
Note that you must first configure Firefox to allow remote debugging. To do this, open the Firefox 
configuration page by entering `about:debugging` in the address bar and click on **Enable debugging of
add-ons** to enable it. 

Then close Firefox and start it from a terminal like this:

__Windows__

`"C:\Program Files\Mozilla Firefox\firefox.exe" -start-debugger-server`

__OS X__

`/Applications/Firefox.app/Contents/MacOS/firefox -start-debugger-server`

__Linux__

`firefox -start-debugger-server`

Navigate to your web application and use this `launch.json` configuration to attach to Firefox:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch index.html",
            "type": "firefox",
            "request": "attach"
        }
    ]
}
```

If your application is running on a Webserver, you need to add the `url` and `webRoot` properties
to the configuration (as in the second `launch` configuration example above).

### Skipping ("blackboxing") files
You can tell the debugger to ignore certain files while debugging: When a file is ignored, the
debugger won't break in that file and will skip it when you're stepping through your code. This is
the same as "black boxing" scripts in the Firefox Developer Tools.

There are two ways to enable this feature:
* You can enable/disable this for single files while debugging by choosing "Toggle skipping this file"
  from the context menu of a frame in the call stack.
* You can use the `skipFiles` configuration property, which takes an array of glob patterns
  specifying the files to be ignored.
  If the URL of a file can't be mapped to a local file path, the URL will be matched against these
  glob patterns, otherwise the local file path will be matched.
  Examples for glob patterns:
  * `"${workspaceFolder}/skipThis.js"` - will skip the file `skipThis.js` in the root folder of your project
  * `"**/skipThis.js"` - will skip files called `skipThis.js` in any folder
  * `"**/node_modules/**"` - will skip all files in `node_modules` folders anywhere in the project
  * `"http?(s):/**"` - will skip files that could not be mapped to local files
  * `"**/google.com/**"` - will skip files containing `/google.com/` in their url, in particular
    all files from the domain `google.com` (that could not be mapped to local files)

### Path mapping
The debug adapter needs to map the URLs of javascript files (as seen by Firefox) to local file paths
(as seen by VS Code). It creates a set of default path mappings from the configuration that work
for most projects. However, depending on the setup of your project, they may not work for you,
resulting in breakpoints being shown in gray (and Firefox not breaking on them) even after Firefox
has loaded the corresponding file.
In this case, you will have to define them manually using the `pathMappings` configuration property.
The easiest way to do this is through the Loaded Scripts Explorer shown in the side bar of VS Code
while debugging. By choosing "Map to local directory" from the context menu of a folder, you can
pick the corresponding local directory and a path mapping will automatically be added to your 
configuration. After this, you have to restart the debugging session in order for the path mapping
to come into effect. If you specify more than one mapping, the first mappings in the list will take
precedence over subsequent ones and all of them will take precedence over the default mappings.

The most common source of path mapping problems is webpack because the URLs that it generates
depend on its configuration and different URL styles are in use. If your configuration contains a
`webroot` property, the following mappings will be added by default in order to support most webpack
setups:
```
{ "url": "webpack:///~/", "path": "${webRoot}/node_modules/" }
{ "url": "webpack:///./~/", "path": "${webRoot}/node_modules/" }
{ "url": "webpack:///./", "path": "${webRoot}/" }
{ "url": "webpack:///src/", "path": "${webRoot}/src/" }
{ "url": "webpack:///", "path": "" }
```

In order to track down path mapping problems, you can use the `PathConversion` logger
(see the [Diagnostic logging](#diagnostic-logging) section below) to see all mappings that are
in effect, how URLs are mapped to paths and which URLs couldn't be mapped.

You can also set the `path` argument of a mapping to `null` to prevent some URLs from being mapped
to local files. This can be useful for URLs that generate their content on the server
(e.g. PHP scripts) or if the content on the server is different from the local file content.
For these URLs the debugger will show the content fetched from the server instead of the local
file content.

### Debugging WebExtensions
Here's an example configuration for WebExtension debugging:
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch WebExtension",
            "type": "firefox",
            "request": "launch",
            "reAttach": true,
            "addonPath": "${workspaceFolder}"
        }
    ]
}
```
The `addonPath` property must be the absolute path to the directory containing `manifest.json`.

You can reload your WebExtension using the command "Firefox: Reload add-on" (`extension.firefox.reloadAddon`)
from the VS Code command palette.
The WebExtension will also be reloaded when you restart the debugging session, unless you have set
`reloadOnAttach` to `false`.
You can also use the `reloadOnChange` property to let VS Code reload your WebExtension automatically
whenever you change a file.

You can enable/disable/toggle popup auto-hide using the commands "Firefox: Enable/Disable/Toggle
popup auto-hide" (`extension.firefox.enablePopupAutohide` / `disablePopupAutohide` / `togglePopupAutohide`).

### Further optional configuration properties
* `reAttach`: If you set this option to `true` in a `launch` configuration, Firefox won't be 
  terminated at the end of your debugging session and the debugger will re-attach to it at the
  start of your next debugging session.
* `reloadOnAttach`: This flag controls whether the web page(s) should be automatically reloaded
  after attaching to Firefox. The default is to reload in a `launch` configuration with the
  `reAttach` flag set to `true` and to not reload in an `attach` configuration.
* `reloadOnChange`: Automatically reload the Firefox tabs or your WebExtension whenever files change.
  You can specify single files, directories or glob patterns to watch for file changes and
  additionally specify files to be ignored. Since watching files consumes system resources,
  make sure that you are not watching more files than necessary.
  The following example will watch all javascript files in your workspace except those under
  `node_modules`:
  ```json
    "reloadOnChange": {
        "watch": [ "${workspaceFolder}/**/*.js" ],
        "ignore": [ "${workspaceFolder}/node_modules/**" ]
    }
  ```
  By default, the reloading will be "debounced": the debug adapter will wait until the last file
  change was 100 milliseconds ago before reloading. This is useful if your project uses a build
  system that generates multiple files - without debouncing, each file would trigger a separate
  reload. You can use `reloadOnChange.debounce` to change the debounce time span or to disable
  debouncing (by setting it to `0` or `false`).

  Instead of string arrays, you can also use a single string for `watch` and `ignore` and if you
  don't need to specify `ignore` or `debounce`, you can specify the `watch` value directly, e.g.
  ```json
  "reloadOnChange": "${workspaceFolder}/lib/*.js"
  ```
* `profileDir`, `profile`: You can specify a Firefox profile directory or the name of a profile
  created with the Firefox profile manager. The extension will create a copy of this profile in the
  system's temporary directory and modify the settings in this copy to allow remote debugging.
  You can also override these properties in your settings (see below).
* `keepProfileChanges`: Use the specified profile directly instead of creating a temporary copy.
  Since this profile will be permanently modified for debugging, you should only use this option
  with a dedicated debugging profile. You can also override this property in your settings (see below).
* `port`: Firefox uses port 6000 for the debugger protocol by default. If you want to use a different
  port, you can set it with this property.
* `firefoxExecutable`: The absolute path to the Firefox executable (`launch` configuration only).
  If not specified, this extension will use the default Firefox installation path. It will look for
  both regular and developer editions of Firefox; if both are available, it will use the developer
  edition. You can also override this property in your settings (see below).
* `firefoxArgs`: An array of additional arguments used when launching Firefox (`launch` configuration only).
  You can also override this property in your settings (see below).
* `host`: If you want to debug with Firefox running on a different machine, you can specify the 
  device's address using this property (`attach` configuration only).
* `log`: Configures diagnostic logging for this extension. This may be useful for troubleshooting
  (see below for examples).
* `showConsoleCallLocation`: Set this option to `true` to append the source location of `console`
  calls to their output
* `preferences`: Set additional Firefox preferences in the debugging profile
* `popupAutohideButton`: Show a button in the status bar for toggling popup auto-hide
  (enabled by default when debugging a WebExtension)
* `sourceMaps`: The Firefox developers have moved the handling of source-maps to the client side of
  the debugging protocol and this extension was adapted to this change. You can get back the old
  source-mapping implementation by setting this property to `server`, but this is only supported
  in Firefox before version 66.
* `liftAccessorsFromPrototypes`: If there are accessor properties (getters and setters) defined
  on an object's prototype chain, you can "lift" them so they are displayed on the object itself.
  This is usually necessary in order to execute the getters, because otherwise they would be
  executed with `this` set to the object's prototype instead of the object itself. This property
  lets you set the number of prototype levels that should be scanned for accessor properties to lift.
  Note that this will slow the debugger down, so it's set to `0` by default.

### Overriding configuration properties in your settings
You can override some of the `launch.json` configuration properties in your user, workspace or
folder settings. This can be useful to make machine-specific changes to your launch configuration
without sharing them with other users.

This setting                 | overrides this `launch.json` property
-----------------------------|-------------------------------------
`firefox.executable`         | `firefoxExecutable`
`firefox.args`               | `firefoxArgs`
`firefox.profileDir`         | `profileDir`
`firefox.profile`            | `profile`
`firefox.keepProfileChanges` | `keepProfileChanges`

### Diagnostic logging
The following example for the `log` property will write all log messages to the file `log.txt` in
your workspace:
```json
...
    "log": {
        "fileName": "${workspaceFolder}/log.txt",
        "fileLevel": {
            "default": "Debug"
        }
    }
...
```

This example will write all messages about conversions from URLs to paths and all error messages
to the VS Code console:
```json
...
    "log": {
        "consoleLevel": {
            "PathConversion": "Debug",
            "default": "Error"
        }
    }
...
```
 
## Troubleshooting
* Breakpoints that should get hit immediately after the javascript file is loaded may not work the
  first time: You will have to click "Reload" in Firefox for the debugger to stop at such a
  breakpoint. This is a weakness of the Firefox debug protocol: VS Code can't tell Firefox about
  breakpoints in a file before the execution of that file starts.
* If your breakpoints remain unverified after launching the debugger (i.e. they appear gray instead
  of red), the conversion between file paths and urls may not work. The messages from the 
  `PathConversion` logger may contain clues how to fix your configuration. Have a look at the 
  "Diagnostic Logging" section for an example how to enable this logger.
* If you think you've found a bug in this adapter please [file a bug report](https://github.com/hbenl/vscode-firefox-debug/issues).
  It may be helpful if you create a log file (as described in the "Diagnostic Logging" section) and
  attach it to the bug report.
