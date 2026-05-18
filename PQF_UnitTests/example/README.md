
# This folder is for unit tests to test Widgets 

# Example Typescript Project

This project shows how a simple widget running in the PQForce Server Javascript sandbox might be implemented in typescript.

How to build:

First install dependencies:

```bash
npm install
```

Then run build:

```bash
npm run build
```


The compiled output file can be found at `dist/widget.js`


## Caveats

The Rhino engine used inside the PQForce Server is handling javascript files in a very old fashioned way, which makes the use of modern tools like typescript a bit tricky. For instance ECMAScript is not implemented completely to spec, see [here](https://mozilla.github.io/rhino/compat/engines.html) which features are available.  Also common syntax to handle multi-file projects like `import` or `require` or even  `export` are not available and will result in errors. 

For this reason a very simple bundler is utilized to combine all compiled files into a singe file and strip any unsupported (and no longer necessary) keywords. Configuration is done with the file `gulpfile.js`.

Files are included via wildcard (`dist/*.js`) and are therefore ordered alphabetically. If a strict order is necessary, it is possible to specify the files individually in an array: 

```
src([
    "ylib.js" // if you want this file to be included at the beginning 
    "jtf.js",
    "widget.js"
]).
...
```
