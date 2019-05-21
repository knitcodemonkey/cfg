# Code completions for JS Doc tags
[![Build Status](https://api.travis-ci.org/HookyQR/VSCodeJSDocTagComplete.svg?branch=master)](https://travis-ci.org/HookyQR/VSCodeJSDocTagComplete)

Provides code completion for JS Doc tags, only within JS Doc comment blocks so it doesn't get in the way of your coding. Type `@` inside a JSDoc (`/** */`) style tag and code completion suggestions will begin (assuming you have it enabled). Doesn't provide completion for inline tags (correctly).

The InteliSense detail element indicates the format of any follow-on requirements:

- `< >` indicated a field. If the content is a single word, then the field is also a single word.
- `[ ]` indicates an optional section.
- Any type information fields have the `{ }` inserted automatically.

Descriptions and completion suggestions from documentation at [@Use JSDoc](http://usejsdoc.org/index.html).

See [@Use JSDoc](http://usejsdoc.org/index.html) for details on how to use JSDoc.
