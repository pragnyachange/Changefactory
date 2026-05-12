const { src, dest } = require('gulp');
const replace = require('gulp-replace');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

/**
 * Gulp default task - Post-processes compiled JavaScript for PQForce sandbox
 * 
 * Process:
 * 1. Read all .js files from dist/ (compiled TypeScript)
 * 2. Replace ES6 'export' statements with comments (not supported in sandbox)
 * 3. Replace ES6 'import' statements with comments (not supported in sandbox)
 * 4. Replace 'default' keyword with comments (remove export defaults)
 * 5. Concatenate all files into single script.js
 * 6. Output to root directory (ready for sandbox deployment)
 * 
 * IMPORTANT: Return the stream so Gulp waits for all operations to complete
 * If callback is used instead, task completes before operations finish
 */
function defaultTask() {
    return src("dist/*.js")
        // Replace ES6 export statements with comments
        // export statements are neither necessary nor supported in sandbox
        // TypeScript ensures visibility of module components is adhered to
        .pipe(replace('export', '/* export */'))
        
        // Replace ES6 import statements with comments
        // Imports are not supported because everything is concatenated into one file
        .pipe(replace('import', '// import'))
        
        // Replace default keyword with comments
        // Removes export default statements that aren't supported in sandbox
        .pipe(replace('default', '/* default */'))
        
        // Concatenate all .js files into single script.js
        // All functions/code from all modules merged into one file
        .pipe(concat('script.js'))
        
        // Output result to current directory
        .pipe(dest('./'));
    // ✅ Returning stream allows Gulp to track completion
}

exports.default = defaultTask
