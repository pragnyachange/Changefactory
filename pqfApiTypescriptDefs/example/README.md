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
in `example/dist/widget.js`

## Caveats

The Rhino engine used inside the PQForce Server is handling javascript files in a very old fashioned way, which makes the use of modern tools like typescript a bit tricky. For instance ECMAScript is not implemented completely to spec, see [here](https://mozilla.github.io/rhino/compat/engines.html) which features are available.  Also common syntax to handle multi-file projects like `import` or `require` or even  `export` are not available and will result in errors. 

Common bundlers don't work well either because it is not easily possible to configure them to output in the necessary simple form.

The minimal project is set up in a way, where these problems are bypassed by the way the declarations are written and imported (using `import type { ... } ...` and global declarations).

If this is not possible it is possible to "package" the scripts manually:


```bash
cat dist/*js | sed 's/import/\/\/import/g'
```
