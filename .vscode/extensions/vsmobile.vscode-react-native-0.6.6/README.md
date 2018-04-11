# React Native Tools
[![Build Status](https://travis-ci.org/Microsoft/vscode-react-native.svg?branch=master)](https://travis-ci.org/Microsoft/vscode-react-native)

This extension provides a development environment for React Native projects.
Using this extension, you can debug your code, quickly run `react-native` commands from the command palette, and use IntelliSense to browse objects, functions and parameters for React Native APIs.

![React Native features](https://github.com/Microsoft/vscode-react-native/raw/master/images/react-features.gif)

## Getting started

* [Install VS Code](https://code.visualstudio.com).
* [Install the extension](https://code.visualstudio.com/docs/editor/extension-gallery) in VS Code:
  1. Press `Ctrl + Shift + X` (`Cmd + Shift + X` on macOS), wait a moment while the list of available extensions is populated
  2. Type `react-native` and install **React Native Tools**
  3. For more guidance view [VS Code Extension Gallery](https://code.visualstudio.com/docs/editor/extension-gallery)
* If you haven't already, install React Native:
  1. Run `npm install -g react-native-cli` to install React Native CLI
  2. Set up React Native using the steps detailed on the React Native [getting started documentation ](https://facebook.github.io/react-native/docs/getting-started.html)
* Open your React Native project root folder in VS Code.

Please notice that the extension uses `.vscode/.react` directory at the project root to store intermediate files required for debugging. Although these files usually get removed after debug session ends, you may want to add this directory to your project's `.gitignore` file.

## Debugging React Native applications

Click the debug icon ![Choose React Native debugger](https://github.com/Microsoft/vscode-react-native/raw/master/images/debug-view-icon.png) in the View bar, and then click the configuration (gear) icon ![Configure-gear](https://github.com/Microsoft/vscode-react-native/raw/master/images/configure-gear-icon.png), then choose the React Native debug environment.

![Choose React Native debugger](https://github.com/Microsoft/vscode-react-native/raw/master/images/choose-debugger.png)

VS Code will generate a `launch.json` in your project with some default configuration settings as shown below. You can safely close this file, choose the appropriate configuration in the Configuration dropdown, and then press F5 (or click _Green Arrow_ ![Configure-gear](https://github.com/Microsoft/vscode-react-native/raw/master/images/debug-icon.png) button) to start debugging your app in VS Code.

![React Native launch targets](https://github.com/Microsoft/vscode-react-native/raw/master/images/debug-targets.png)

You can debug your app on an Android emulator, Android device or iOS simulator. This extension provides [experimental support](https://github.com/Microsoft/vscode-react-native/blob/master/doc/debugging.md#debugging-on-ios-device) for iOS devices.

More information about debugging using VS Code can be found in this [guide](https://code.visualstudio.com/docs/editor/debugging).

See [Setting up debug environment](https://github.com/Microsoft/vscode-react-native/blob/master/doc/debugging.md) for more details.

## Using React Native commands in the Command Palette

In the Command Palette, type `React Native` and choose a command.

![React Native commands](https://github.com/Microsoft/vscode-react-native/raw/master/images/command-palette.png)

The **Run Android** command triggers `react-native run-android` and starts your app for Android.

The **Run iOS** command similarly triggers `react-native run-ios` and starts your app in the iOS simulator (iPhone 6).

The **Packager** commands allow you to start/stop the [**Metro Bundler**](https://github.com/facebook/metro-bundler) (formerly React Packager).

## Using IntelliSense

IntelliSense helps you discover objects, functions, and parameters in React Native.

![IntelliSense](https://github.com/Microsoft/vscode-react-native/raw/master/images/intellisense.png)

IntelliSense is enabled automatically once you open the project in VS Code, so no additional action is required. Notice that in order to set it up, the extension might create a `jsconfig.json` file (if no such file exists) in the project root with `allowJs: true` to allow TypeScript to process JavaScript files.

See also [Setting up Flowtype for IntelliSense](https://github.com/Microsoft/vscode-react-native/blob/master/doc/intellisense.md) for more advanced setup.

## Using Expo

We support using exponentjs to run, debug and publish applications. For more information on exponent, see [here](https://docs.getexponent.com/).

For more details about configuring and debugging Expo applications see [Expo docs](https://github.com/Microsoft/vscode-react-native/blob/master/doc/expo.md)

## Build APK and Generate Bundle

You can add VSCode tasks to build an .apk file and generate iOS/Android bundles. See [here](https://github.com/Microsoft/vscode-react-native/blob/master/doc/tasks.md) for more info.

## Using with React Native CodePush

We have added basic support for [react-native-code-push](https://github.com/Microsoft/react-native-code-push) npm package.

This is our first release of this feature and we would love to hear any feedback from you to make things better.
Please [feel free to reach us](https://github.com/Microsoft/vscode-react-native/issues) in case of any issues or questions.

CodePush is a cloud service that enables Cordova and React Native developers to deploy mobile app updates directly to their users' devices. It works by acting as a central repository that developers can publish updates to (JS, HTML, CSS and images). [How does it work?](https://github.com/Microsoft/react-native-code-push#how-does-it-work)

To use it with your current project you should have the following things to be done:
1) Your currently opened project should be `react-native` one
2) You should have added `react-native-code-push` package into your project
3) You should have an app already created in [Microsoft AppCenter](https://appcenter.ms/) and configured react-native-code-push for your project:
* [How to configure React Native CodePush](https://github.com/Microsoft/react-native-code-push#getting-started)
* [How to create an App in the AppCenter portal](https://docs.microsoft.com/en-us/appcenter/sdk/getting-started/react-native#2-create-your-app-in-the-app-center-portal-to-obtain-the-app-secret)

To start using CodePush with current extension please do the following:
1) Login to AppCenter from CodePush status bar
2) Set current app that will be used for further code-push releases
3) Configure AppVersion/IsMandatory for release (optional)
4) Click on CodePush status bar and select `Releae React` command to make new CodePush release

For more details about configuring and using React Native CodePush applications see [this link](https://github.com/Microsoft/vscode-react-native/blob/master/doc/rncp.md).

## Contributing

Please see our [contributing guide](https://github.com/Microsoft/vscode-react-native/blob/master/CONTRIBUTING.md) for more information

## Known Issues

Here is the list of common known issues you may experience while using the extension:

Issue                                | Description
------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------
Debugger doesn't stop at breakpoints | Breakpoints require sourcemaps to be correctly configured. If you are using TypeScript, then make sure to follow the `Getting started` section for how to ensure sourcemaps are correctly set up.
'adb: command not found'             | If you receive an error `adb: command not found`, you need to update your system Path to include the location of your *ADB* executable.The *ADB* executable file is located in a subdirectory along with your other Android SDK files.
Targeting iPhone 6 doesn't work      | There was a known issue with React Native ([#5850](https://github.com/facebook/react-native/issues/5850)) but it was fixed. Please upgrade your version of React Native.
Can't comunicate with socket pipe    | (Linux only) If you have two workspaces open that only differ in casing, the extension will fail to comunicate effectively.

[Known-Issues](https://github.com/Microsoft/vscode-react-native/issues?q=is%3Aissue+label%3Aknown-issues) provides a complete list of active and resolved issues.

## Telemetry reporting
VS Code React Native extension collects usage data and sends it to Microsoft to help improve our products and services. Read our [privacy statement](https://www.visualstudio.com/en-us/dn948229) to learn more.

If you don’t wish to send usage data to Microsoft, edit `VSCodeTelemetrySettings.json` file at `~/.vscode-react-native` and add `optIn:false`.

## Code of conduct
This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](https://github.com/Microsoft/vscode-react-native/blob/master/mailto:opencode@microsoft.com) with any additional questions or comments.
