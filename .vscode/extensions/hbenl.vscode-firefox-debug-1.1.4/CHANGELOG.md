### Version 1.1.4
* add support for evaluating getter functions
* fix path mapping of URLs that contain encoded characters

### Version 1.1.3
* path mapping bugfixes

### Version 1.1.2
* workaround for a timing issue with early beta versions of Firefox 60
* improve WebAssembly debugging support

### Version 1.1.1
* experimental support for WebAssembly debugging

### Version 1.1.0
* add support for creating `pathMappings` from the Loaded Scripts Explorer
* bugfix for breakpoints being shown unverified (gray) even when they were successfully set
* change default `pathMappings` for webpack to support Angular CLI projects

### Version 1.0.1
* fix debugging of WebExtensions that contain a `package.json` file
* set the default `addonType` to `webExtension` in configuration snippets and documentation

### Version 1.0.0
* add default `pathMappings` for webpack
* harmonize trailing slashes in user-specified `pathMappings`
* Linux: search the Firefox executable in all directories in the user's `PATH` (thanks @agathver)
* `addonType` now defaults to `webExtension`

### Version 0.17.0
* show object previews in the Variables and Watch sections of the Debug view
* fix the Loaded Scripts Explorer when navigating in Firefox

### Version 0.16.1
* fix opening remote scripts from the Loaded Scripts Explorer
* skip exceptions triggered from the debug console
* add the ability to configure URLs that should not be mapped to local paths
* remove deprecated VS Code APIs

### Version 0.16.0
* add Loaded Scripts Explorer
* add support for Symbol-keyed properties (Firefox 56+)

### Version 0.15.4
* bugfix: `pathMappings` were ignored in `attach` configurations

### Version 0.15.3
* performance improvements

### Version 0.15.2
* handle absolute urls in source-maps, including a workaround for webpack weirdness

### Version 0.15.1
* on Windows the debug adapter sometimes didn't attach to WebExtensions that were installed as temporary add-ons - fixed

### Version 0.15.0
* add support for toggling the skip flag for single files while debugging
* make `webRoot` optional if `pathMappings` are specified

### Version 0.14.1
* compatibility update for the upcoming VS Code 1.14 release
 
### Version 0.14.0
* fix WebExtension debugging in recent Firefox builds
* add experimental `sourceMaps` configuration property

### Version 0.13.1
* add support for setting variable values in the debug side bar
* add support for IntelliSense in the debug console

### Version 0.13.0
* add `reloadOnChange` configuration property

### Version 0.12.1
* fix temporary add-on installation on Windows

### Version 0.12.0
* add support for reloading add-ons
* add `installAddonInProfile` configuration property

### Version 0.11.1
* bugfix: some function names were not shown in the call stack
* bugfix: the tooltips of tabs for external source files didn't show the full url
* bugfix: some accessor properties (e.g. window.window) were shown as undefined
* bugfix for sporadical failures to attach to Firefox after launching it

### Version 0.11.0
* add `keepProfileChanges` configuration property
* bugfix: the temporary profiles are now deleted reliably

### Version 0.10.0
* add `preferences` configuration property
* add `showConsoleCallLocation` configuration property
* support sending objects to the console (e.g. `console.log(document)`)
* change the display of call stack, return values and exceptions to be more in line with other VS Code javascript debuggers

### Version 0.9.3
* fix slow initial startup of add-on debugging with the `reAttach` option

### Version 0.9.2
* support `reAttach` for add-on debugging

### Version 0.9.1
* fix `reAttach` on Windows

### Version 0.9.0
* Add `reAttach` and `reloadOnAttach` configuration properties

### Version 0.8.8
* bugfix: source files were not mapped to local files in VS Code 1.9

### Version 0.8.7
* workaround for Firefox sending inaccurate source information in certain situations, which can break the `skipFiles` feature

### Version 0.8.6
* bugfix: some URLs were not handled correctly when processing sourcemapped sources

### Version 0.8.5
* send log messages from add-ons to the debug console

### Version 0.8.4
* bugfix: exceptions were not shown

### Version 0.8.3
* strip query strings from urls when converting them to local file paths

### Version 0.8.2
* fix skipFiles on Windows

### Version 0.8.1
* bugfix: sources could not be skipped during their first execution

### Version 0.8.0
* Add `skipFiles` configuration property
* Add `pathMappings` configuration property
* Add configuration snippets
* Fix several bugs when evaluating watches and expressions entered in the debug console

### Version 0.7.7
* fix debugging of WebExtension content scripts in recent Firefox builds

### Version 0.7.6
* bugfix: breakpoints were sometimes not hit after a page reload

### Version 0.7.5
* bugfix: support javascript values of type Symbol
* bugfix: evaluating expressions in the VS Code debug console sometimes stopped working

### Version 0.7.2
* Terminate the debug session when Firefox is closed

### Version 0.7.1
* Show the full url of sources that do not correspond to local files
* bugfix for setting breakpoints in content scripts of `addonSdk` browser extensions

### Version 0.7.0
* Debugging Firefox add-ons
* Launch mode now always creates a temporary profile: if a profile is specified in the launch
  configuration, it will be copied and modified to allow remote debugging
* Launch mode now uses the developer edition of Firefox if it is found

### Version 0.6.5
* bugfix for sourcemaps with embedded source files

### Version 0.6.4
* Fix breakpoint handling when a Firefox tab is reloaded
* Only send javascript-related warnings and errors from Firefox to the debug console

### Version 0.6.3
* Add configuration option for diagnostic logging
* Make conversion between paths and urls more robust

### Version 0.6.2
* bugfix: stepping and resuming stopped working if a breakpoint was hit immediately after loading the page

### Version 0.6.1
* Fix debugging WebWorkers and multiple browser tabs in VSCode 1.2.0

### Version 0.6.0
* Add support for evaluating javascript expressions in the debug console even if Firefox isn't paused
* Add support for debugger statements

### Version 0.5.0
* Add support for call stack paging

### Version 0.4.0
* Add support for debugging WebWorkers
* Add support for debugging multiple browser tabs
* Fix exception breakpoints in VSCode 1.1.0
* Re-create the Firefox profile on every launch, unless a profile name or directory is configured

### Version 0.3.0
* Print messages from the Firefox console in the VS Code debug console
* bugfix: resume the VS Code debugger when Firefox resumes, e.g. if the user reloads the page in 
  Firefox while the debugger is paused

### Version 0.2.0
* Automatically create a Firefox profile for debugging

### Version 0.1.0
* Initial release
