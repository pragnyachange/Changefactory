const { src, dest } = require('gulp');
const replace = require('gulp-replace');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

function defaultTask(cb) {
    src("dist/*.js")
        .pipe(replace('export', '/* export */')) // export statements neither necessary nor supported, we concatinate everything into a single file. Typescripts ensures visibility of module components is adhered to
        .pipe(replace('import', '// import')) // export statements neither necessary nor supported, we concatinate everything into a single file
        .pipe(concat('script.js'))
        .pipe(uglify()) // disable for debug purposes
        .pipe(dest('./'));
    cb();
}

exports.default = defaultTask
