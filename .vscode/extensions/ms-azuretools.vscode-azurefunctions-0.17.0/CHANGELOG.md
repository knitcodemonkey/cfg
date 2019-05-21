<!-- markdownlint-disable MD024 -->

# Change Log

All notable changes to the "azurefunctions" extension will be documented in this file.

## 0.17.0 - 2019-05-01

### Added

- New projects will no longer have a dependency on .NET Core for non-.NET developers
- Preview support to create, debug, and deploy PowerShell projects
- Right click in a "function.json" file to add a binding from a template
- New JavaScript projects will include a package.json, with automatic logic to install any dependencies before debug or deploy
- Right click on a timer function to execute now
- If in advanced create mode, you may use a premium plan when creating a Function App in Azure
- Added templates to the "verified" category, including Event Hub and Durable functions

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.17.0%22+is%3Aclosed)

## 0.16.0 - 2019-03-28

### Added

- Improved multi-prompt wizards (e.g. "Create function")
  - Added support for back button
  - All prompts will occur up front before any steps are executed
- Creating a project will automatically prompt for the first function
- Projects in sub-directory of a workspace will be recognized as function projects
- Prompt to upload local app settings after deploy
- View commit in GitHub for an applicable deployment

### Changed
- Creating a Function App in Azure will only prompt for Function App name. Set `azureFunctions.advancedCreation` to `true` to be prompted for all other values.

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.16.0%22+is%3Aclosed)

## 0.15.0 - 2019-02-22

### Added

- Create, debug, and deploy TypeScript projects
- Support for `.funcignore` file, which will exclude paths when deploying based on `.gitignore` syntax. This file is also used by the func cli.
- Added templates to the "verified" category, including Event Grid for most languages

### Changed

- If using "zipGlobPattern" and "zipIgnorePattern" settings when deploying, you will be prompted to use `.funcignore` file instead

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.15.0%22+is%3Aclosed)

## 0.14.0 - 2019-02-11

### Added

- Improved startup and installation performance
- Improved reliability of Python projects
  - Leverages ptvsd module shipped with Python extension for VS Code instead of installing ptvsd in your virtual environment
  - Removed terminal specific separators from debug config
  - Allow deployment to dedicated App Service plans
  - Added retry logic to handle momentary issues while deploying
- Added `azureFunctions.advancedCreation` setting. When set to true, this allows you to manually select several properties (i.e. OS and runtime) when creating a Function App
- App setting values are hidden by default

### Changed

- Java projects now leverage common settings for deploy. See [our wiki](https://aka.ms/AA41zno) for more info
  - Projects will no longer run `mvn clean package` unless `azureFunctions.preDeployTask` is set
  - Projects will no longer deploy a subpath of the workspace unless `azureFunctions.deploySubpath` is set

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.14.0%22+is%3Aclosed)

## 0.13.1 - 2018-12-17

### Fixed

- Provide option to "Deploy Anyway" if pre-deploy task fails
- If "azureFunctions.preDeployTask" is not set, do not run any task

## 0.13.0 - 2018-12-04

### Added

- Deployments node for Function Apps that are connected to a GitHub or LocalGit repository
  - View deployment logs
  - Redeploy previous deployments
- Preview support for deployment slots (feature flag `azureFunctions.enableSlots` must be set to `true`)
  - Deploy
  - Stream logs
  - Start/stop/restart
  - Create/delete/swap

### Changed

- Feature flag no longer required for creating Python projects

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.13.0%22+label%3Abug+is%3Aclosed)

## 0.12.1 - 2018-11-26

### Fixed
- Bumped minimum version of "ps-tree" due to [event-stream#116](https://github.com/dominictarr/event-stream/issues/116)

## 0.12.0 - 2018-10-22

### Added

- Improved debugging
  - Functions host will be stopped after you detach
  - Terminal (where Http Triggers are listed) will be the default view rather than Debug Console
- Improved Python projects
  - Deploying will automatically sync triggers
  - Users will be warned if deploying to Windows
  - pylint will be added to the local virtual environment by default
  - "pip install" will be run before debugging
- Added Cosmos DB trigger to "Verified" category for C#
- JavaScript and Python projects will hide 'obj' and 'bin' folder by default (used for Functions extensions). NOTE: extensions.csproj will not be hidden and should still be checked in to source control

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.12.0%22+label%3Abug+is%3Aclosed)

### Known Issues
- Local debugging for Python projects may fail with "python.exe -m ptvsd: error: the following arguments are required: --host.". Can be resolved by changing the `"languageWorkers__python__arguments"` setting in the `.vscode/tasks.json` to `"-m ptvsd --host 127.0.0.1 --port 9091"`

## 0.11.0 - 2018-09-24

### Added
- Preview support for creating and debugging Python projects. To enable, set `azureFunctions.enablePython` to true. **IMPORTANT**: Python support in Azure is still in private preview.
- Added several more templates to the "verified" category, including Cosmos DB and Service Bus.

### Changed
- Newly created Function Apps will default to "Run From Package". See [here](https://docs.microsoft.com/azure/azure-functions/run-functions-from-deployment-package) for more info.
- Deprecated projectRuntime of "beta" in favor of "~2".
- "azureFunctions.deploySubpath" setting takes precedence

### [Fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.11.0%22+label%3Abug+is%3Aclosed)
- "Copy Function Url" for v2 non-anonymous functions will copy an invalid url [#567](https://github.com/Microsoft/vscode-azurefunctions/issues/567)

### Known Issues
- Functions cannot be listed for Linux Consumption apps [azure-functions-host#3502](https://github.com/Azure/azure-functions-host/issues/3502)

## 0.10.2 - 2018-09-10

### Fixed

- Debugging C# functions after fixing a build break fails with error "Failed to stop previous running Functions host..." [#534](https://github.com/Microsoft/vscode-azurefunctions/issues/534)

## 0.10.1 - 2018-09-06

### Added

- Improved Java templates
  - More templates are available
  - Templates will be automatically updated going forward

### Changed

- JavaScript projects run `func extensions install` before debug and deploy

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.10.1%22+label%3Abug+is%3Aclosed)

### Known Issues
- "Copy Function Url" for v2 non-anonymous functions will copy an invalid url (that returns a 401 Unauthorized error) due to recent breaking changes in the runtime [#567](https://github.com/Microsoft/vscode-azurefunctions/issues/567)

## 0.10.0 - 2018-07-24

### Added

- Improved C# templates
  - More templates are available
  - Templates will be automatically updated going forward
  - Templates are installed only with the scope of VS Code and no longer affect machine-wide .NET CLI templates
- Added support for deploying to App Service Environments

### Changed

- Debug config for JavaScript functions has changed. See https://aka.ms/AA1vrxa for more info
- New C# projects will deploy the result of a 'dotnet publish' rather than deploying the build output
- Azure Function Apps created through VS Code will automatically match the runtime from your local machine rather than always using v1

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.10.0%22+label%3Abug+is%3Aclosed)

## 0.9.1 - 2018-05-23

### [Fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.9.1%22+label%3Abug+is%3Aclosed)

- Users will not be prompted to install the latest version of the func cli if high priority issues are discovered
  - For example, the latest version of the func cli (2.0.1-beta.26) [breaks JavaScript debugging](https://github.com/Microsoft/vscode-azurefunctions/issues/387)

## 0.9.0 - 2018-05-09

### Added

- Improved warning when Azure Functions Core Tools is out of date
  - In some cases, an 'Update' option is provided that will automatically run the necessary commmands
  - Warning now displays for all users, regardless of how they installed the func cli
- Function templates are now versioned and can be controlled with the "azureFunctions.templateVersion" setting
- Select open behavior after creating a new project ("Add to workspace", "Open in current window", or "Open in new window")

### Changed

- Moved Azure Functions Explorer to new Azure view container instead of file explorer

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.9.0%22+label%3Abug+is%3Aclosed)

## 0.8.1 - 2018-04-13
### [Fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.8.1%22+label%3Abug+is%3Aclosed)
- Deployment fail when deploying to Function App with a custom domain

## 0.8.0 - 2018-04-05

### Added

- Upload and download application settings
- Prompt to automatically install the Azure Functions Core Tools when possible
- "Report an issue" button on error dialogs that links to the GitHub repo
- Subscription filter button next to Subscription nodes in the explorer
- Deploy to Function App context menu action for Function Apps

### Changed

- JavaScript projects will default to runtime "beta" instead of "~1" on Mac/Linux. See [here](https://aka.ms/azfuncruntime) for more information.

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.8.0%22+label%3Abug+is%3Aclosed)

## 0.7.0 - 2018-03-05

### Added

- Automatically detect projects created outside of VS Code and prompt to initialize
- View/Delete Proxies
- Remote Debug Java Function Apps (experimental)

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.7.0%22+label%3Abug+is%3Aclosed)

## 0.6.1 - 2018-02-22

### Fixed

- Add backup templates in case there is no internet or in case the functions portal api changes

## 0.6.0 - 2018-02-13

### Added

- Stream logs from your Azure Function Apps
- Support projects in multi-root workspaces
- Link to deployment tutorial

### [Fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.6.0%22+label%3Abug+is%3Aclosed)

- Show warning if your Azure Functions Core Tools version is out-of-date
- Update Microsoft.Net.Sdk.Functions version so that C# functions work on Mac/Linux

## 0.5.1 - 2018-02-01

### [Fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.5.1%22+label%3Abug+is%3Aclosed)

- C# local debugging
  - Fixed "Cannot access the file because it is being used by another process." error by automatically restarting the functions host
  - Fixed project being built twice for every F5
  - Improved performance of 'azureFunctions.pickProcess' on Windows

## 0.5.0 - 2018-01-25

### Added

- Create, Debug, and Deploy a C# class library project
- User settings for language/runtime/templateFilter now apply when creating a new project
  - Set these once and never select a language, runtime, or filter again
  - Set the language to something other than "JavaScript", "C#", or "Java" for preview support of other languages (for example, "C#Script")

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.5.0%22+label%3Abug+is%3Aclosed)

### Known Issues

- The Functions host must be stopped after making changes and before rebuilding to C# functions [#185](https://github.com/Microsoft/vscode-azurefunctions/issues/185)
- C# class library functions fail to run on Mac [#164](https://github.com/Microsoft/vscode-azurefunctions/issues/164)
- C# script functions fail to attach on Windows [#180](https://github.com/Microsoft/vscode-azurefunctions/issues/180)

## 0.4.0 - 2017-12-15

### Added

- Copy HTTP Trigger Url
- Change Deployment Source (Zip Deploy vs. Local Git Deploy)
- Settings to control project language and runtime

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.4.0%22+label%3Abug+is%3Aclosed)

## 0.3.1 - 2017-12-06

### Fixed

- JavaScript 'Verified' templates not displayed
- Java templates not displayed

## 0.3.0 - 2017-12-01

### Added

- Java support
  - Create new project
  - Create new function
  - Deploy project
- Azure Functions Explorer
  - View and delete functions
  - View, add, edit, and delete Application Settings
  - 'Load more' for large number of resources

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.3.0%22+label%3Abug+is%3Aclosed)

## 0.2.0 - 2017-11-10

### Added

- Improved 'Create new function'
  - All JavaScript templates listed in the Azure portal are now supported
  - The user will be prompted for function settings on creation
  - Added `azureFunctions.templateFilter` setting to control which templates are displayed (Verified, Core, or All)
- Added 'Create' and 'Delete' commmands for Function Apps in Azure
- Updated icons to match the Azure portal

### Removed

- Moved 'Deploy here as Zip' option from Function App nodes to the explorer menu bar

### Fixed

- [Bugs fixed](https://github.com/Microsoft/vscode-azurefunctions/issues?q=is%3Aissue+milestone%3A%220.2.0%22+label%3Abug+is%3Aclosed)

## 0.1.1 - 2017-11-01

### Fixed

- Show warning message that zip deploy is a destructive action
- Leverage [new app service zipdeploy](https://github.com/projectkudu/kudu/wiki/Deploying-from-a-zip-file)

### Removed

- Zip Deploy no longer runs 'npm install'. It expects a ready-to-run app

## 0.1.0 - 2017-10-19

### Added

- Create new project
- Create new function from template
- Debug function projects locally
- View Azure Functions
- Deploy to Azure Functions
- Start, stop, and restart Azure Functions
- JSON Intellisense for `function.json`, `host.json`, and `proxies.json`
