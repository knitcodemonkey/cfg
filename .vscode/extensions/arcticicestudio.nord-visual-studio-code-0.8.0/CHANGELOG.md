<p align="center"><img src="https://cdn.rawgit.com/arcticicestudio/nord-visual-studio-code/develop/assets/nord-visual-studio-code-banner.png" srcset="https://cdn.rawgit.com/arcticicestudio/nord-visual-studio-code/develop/assets/nord-visual-studio-code-banner-2x.png 2x"/></p>

<p align="center"><img src="https://assets-cdn.github.com/favicon.ico" width=24 height=24/> <a href="https://github.com/arcticicestudio/nord-visual-studio-code/releases/latest"><img src="https://img.shields.io/github/release/arcticicestudio/nord-visual-studio-code.svg?style=flat-square"/></a> <a href="https://github.com/arcticicestudio/nord/releases/tag/v0.2.0"><img src="https://img.shields.io/badge/Nord-v0.2.0-88C0D0.svg?style=flat-square"/></a> <img src="https://marketplace.visualstudio.com/favicon.ico" width=24 height=24/> <a href="https://code.visualstudio.com/updates/v1_12"><img src="https://img.shields.io/badge/VS_Code-v1.12+-373277.svg?style=flat-square"/></a> <a href="https://marketplace.visualstudio.com/items/arcticicestudio.nord-visual-studio-code"><img src="https://vsmarketplacebadge.apphb.com/version/arcticicestudio.nord-visual-studio-code.svg?style=flat-square"/></a> <a href="https://marketplace.visualstudio.com/items/arcticicestudio.nord-visual-studio-code"><img src="https://vsmarketplacebadge.apphb.com/installs/arcticicestudio.nord-visual-studio-code.svg?style=flat-square"/></a> <a href="https://marketplace.visualstudio.com/items/arcticicestudio.nord-visual-studio-code"><img src="https://vsmarketplacebadge.apphb.com/rating-short/arcticicestudio.nord-visual-studio-code.svg?style=flat-square"/></a></p>

![Release Date: 2019-04-11](https://img.shields.io/badge/Release_Date-2019--04--11-88C0D0.svg?style=flat-square) [![Project Board](https://img.shields.io/badge/Project_Board-0.8.0-88C0D0.svg?style=flat-square)](https://github.com/arcticicestudio/nord-visual-studio-code/projects/15) [![Milestone](https://img.shields.io/badge/Milestone-0.8.0-88C0D0.svg?style=flat-square)](https://github.com/arcticicestudio/nord-visual-studio-code/milestone/12)

## Features

### UI

**Background color of inactive keyboard focused list items** — #107 ⇄ #116 (⊶ 3e35efb9) by [@octref][gh-user-octref]
↠ Added support for `list.inactiveFocusBackground` theme key used for the background color of the selected item when navigating the file explorer list with the keyboard and moving the focus to another UI component (like the editor).
It has been set to `nord2` with a opacity of 80% to match the style of inactive list items that were focused without the keyboard (`list.inactiveSelectionBackground`).

<p align="center"><strong>Before</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54876811-74f57080-4e16-11e9-9a21-119837740a33.png" /></p>

<p align="center"><strong>After</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54876810-74f57080-4e16-11e9-94f2-32b641288b54.png" /></p>

## Improvements

### Syntax

**Perl sigils same color as variables** — #67 (⊶ 698d9bae) by [@marcusramberg][gh-user-marcusramberg]
↠ To ensure a consistent highlighting Perl _Sigils_ are now also colorized like variables since they are actually part of the variable. They are now less distracting by using the same color like the variable itself instead of handling them as prefixed characters or a keyword.

<p align="center"><strong>Before</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54866393-82a5ea00-4d73-11e9-98d6-b90db34b3fd2.png" /></p>

<p align="center"><strong>After</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54866400-905b6f80-4d73-11e9-97fa-c5433ba1a98c.png" /></p>

**Correct colors for JavaScript objects** — #115 / #97 (⊶ b0c399cd) by [@samchamberland][gh-user-samchamberland]
↠ Previously JavaScript objects colorized with `nord7` caused by a superfluous definition of the `meta.var.expr` scope selector. This has been changed. This has been changed to correctly use `nord4` for variables.

<p align="center"><strong>Before</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54870063-f7901880-4da1-11e9-9860-6d8116b6c8c5.png" /></p>

<p align="center"><strong>After</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54870062-f7901880-4da1-11e9-9ff4-43737783c1df.png" /></p>

**Better function parameter highlighting in Python** — #108 ⇄ #113 (⊶ 840b36c3) by [@Al2Me6][gh-user-al2me6]
↠ Previously the highlighting for function parameters in Python were colorized with the same color like the function itself (`nord8`) instead of `nord4`. This has been improved by removing the too generic scope `meta.function-call` from the `source.python` scope.

<p align="center"><strong>Before</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54865125-17ebb300-4d61-11e9-8f59-1f5c37795195.png" /></p>

<p align="center"><strong>After</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54865128-23d77500-4d61-11e9-8c67-3acff0ed487f.png" /></p>

**Improved interpolated string literals** — #106 ⇄ #114 (⊶ e13ded12) by [@varog-norman][gh-user-varog-norman]
↠ Improved the color for function braces in string templates to use `nord6` instead of `nord14`. Begin and end characters of an interpolated string literal `${}` are now also colorized as keyword (`nord9`) for better visual distinction.

<p align="center"><strong>Before</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54867234-298f8380-4d7e-11e9-820f-244cfaf65b92.png" /></p>

<p align="center"><strong>After</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54867233-28f6ed00-4d7e-11e9-9a65-ef12a61203f9.png" /></p>

**Comment Color Brightness** — #117/#14/#72 ⇄ #118 (⊶ 7e3881b6)
↠ Implemented the frequently requested and long-time outstanding increase of the comment color (`nord3`) brightness by 10% from a lightness level of ~35% to ~45%.

➜ **Please see [arcticicestudio/nord#94][gh-nord#94] for all details about this design change decision**!

For users who would like to use the previously used coloring VS Code allows to [customize and override styles of a specific theme][vscode-docs-color-theme-customize] through the user settings. To override the highlighting color of comments **only for Nord** the following snippet can be added to the settings (JSON) file:

<p align="center"><strong>Before</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54902736-76886c80-4eda-11e9-86cd-dfc935aff5e3.png" /></p>

<p align="center"><img src="https://user-images.githubusercontent.com/7836623/54902735-76886c80-4eda-11e9-9aa0-41ded647bdb2.png" /></p>

<p align="center"><strong>After</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54902766-856f1f00-4eda-11e9-897a-9b0971586a0b.png" /></p>

<p align="center"><img src="https://user-images.githubusercontent.com/7836623/54902765-856f1f00-4eda-11e9-9d09-50c89faece43.png" /></p>

```json
"editor.tokenColorCustomizations": {
  "[Nord]": {
    "comments": "#4C566A"
  }
}
```

Please see the official documentation about [user and workspace settings][vscode-docs-settings] for more details how to customize and configure VS Code.

### UI

**Decreased opacity for peek view match highlighting** — #99 ⇄ #112 (⊶ 7d9547ea) by [@octref][gh-user-octref]
↠ Previously the opacity for peek view match highlighting was too bright that made it almost impossible to read the underlying text. This has been improved by decreasing the opacity of the used color (`nord8`) to 30%.

<p align="center"><strong>Before</strong><br /><img src="https://user-images.githubusercontent.com/4033249/44305931-3e63ee80-a339-11e8-91e3-ad40ccbbe98e.png" /></p>

<p align="center"><strong>After</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54864866-76af2d80-4d5d-11e9-9800-37fb5c7e10dc.png" /></p>

**Cleaner Git diff view highlighting** — #105 (⊶ 63fa7d9e) by [@danfo][gh-user-danfo]
↠
Previously the Git diff view used `nord14` with a opacity of 30% to highlight added/modified elements causing some syntax elements like comments to be bad readable. This has now been changed to use `nord9` with a opacity of 20% instead to ensure a better readability and general clearer visual appearance. Also the previously used theme keys `diffEditor.insertedTextBorder` and `diffEditor.removedTextBorder` have been removed for a more clutter-free style.

<p align="center"><strong>Before</strong><br /><img src="https://raw.githubusercontent.com/arcticicestudio/nord-visual-studio-code/develop/assets/scrot-feature-ui-diffeditor-inserted.png" /></p>

<p align="center"><img src="https://raw.githubusercontent.com/arcticicestudio/nord-visual-studio-code/develop/assets/scrot-feature-ui-diffeditor-removed.png" /></p>

<p align="center"><strong>After</strong><br /><img src="https://user-images.githubusercontent.com/7836623/54881878-f53ac680-4e54-11e9-8b84-e27e13b5dd34.png" /></p>

There is still a lot of potential to improve the highlighting for Git diff views. The feature request [Microsoft/vscode#71663][gh-microsoft/vscode#71663] has been requested from the VS Code team to allow theme authors to improve the styles of syntax elements within Git diff scopes which would solve the problem of unreadable elements.

## Bug Fixes

### UI

**Tabs in split views can not be dragged and moved** — #98 ⇄ #104 (⊶ 924c1901) by [@mdogadailo][gh-user-mdogadailo] and [@sdr0x07b6][gh-user-sdr0x07b6]
↠ Previously the `editorGroup.border` theme key used a transparent color that caused tabs in split views to not being moveable anymore since the underlying logic removes some requires CSS classes. This has been fixed by to a opacity of 1% to fix the tab usage while still keeping the theme ambience (almost invisible for the human eye).

<!-- Base Links -->

[gh-user-octref]: https://github.com/octref
[vscode-docs-color-theme-customize]: https://code.visualstudio.com/docs/getstarted/themes#_customizing-a-color-theme
[vscode-docs-settings]: https://code.visualstudio.com/docs/getstarted/settings

<!--v 0.8.0 -->

[gh-microsoft/vscode#71663]: https://github.com/Microsoft/vscode/issues/71663
[gh-nord#94]: https://github.com/arcticicestudio/nord/issues/94
[gh-user-al2me6]: https://github.com/al2Me6
[gh-user-danfo]: https://github.com/danfo
[gh-user-marcusramberg]: https://github.com/marcusramberg
[gh-user-mdogadailo]: https://github.com/mdogadailo
[gh-user-samchamberland]: https://github.com/samchamberland
[gh-user-sdr0x07b6]: https://github.com/sdr0x07b6
[gh-user-varog-norman]: https://github.com/varog-norman
