var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var runSequence = require('run-sequence');
var buffer = require('vinyl-buffer');
var minifyjs = require('gulp-js-minify');
var mergeStream = require('merge-stream');
var del = require('del');
var plugins = require('gulp-load-plugins')({ lazy: false });
var _ = require('lodash');

var args = process.argv.slice(3);

gulp.task('clean', function() {
  del(['build'])
});

gulp.task('copy', function() {
  return mergeStream(
    gulp.src('public/css/**/*').pipe(gulp.dest('build/public/css/')),
    gulp.src('public/imgs/**/*').pipe(gulp.dest('build/public/imgs/')),
    gulp.src('public/js/utils/*').pipe(gulp.dest('build/public/js/utils/'))
  );
});

function createBundle(src) {
  if (!src.push) {
    src = [src]
  };

  var optionParams = {
    entries: src,
    debug: true
  };

  var options = _.assign({}, watchify.args, optionParams);
  var b = watchify(browserify(options));

  b.transform(babelify.configure({
    presets: ['es2015']
  }));

  b.on('log', plugins.util.log);
  return b;
}

function bundle(b, outputPath) {
  var splitPath = outputPath.split('/');
  var outputFile = splitPath[splitPath.length - 1];
  var outputDir = splitPath.slice(0, -1).join('/');

  return b.bundle()
    .on('error', plugins.util.log.bind(plugins.util, 'Browserify Error'))
    .pipe(source(outputFile))
    .pipe(buffer())
    .pipe(minifyjs())
    .pipe(plugins.sourcemaps.init({ loadMaps: true }))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest(outputDir));
}

var jsBundles = {
  'build/public/js/main.js': createBundle('./public/js/main.js'),
  'build/public/js/vendor.js': createBundle('./public/js/vendor.js'),
  'build/public/js/store.js': createBundle('./public/js/store.js'),
  'sw.js': createBundle('serviceWorker.js')
}


gulp.task('js:browser', function() {
  return mergeStream.apply(null,
    Object.keys(jsBundles).map(function(key) {
      return bundle(jsBundles[key], key);
    })
  );
});

gulp.task('watch', function() {
  gulp.watch(['*.js'], ['js:browser']);
  gulp.watch(['public/imgs/**/*', 'public/css/**/*', 'public/js/utils/*'], ['copy']);

  Object.keys(jsBundles).forEach(function(key) {
    var b = jsBundles[key];
    b.on('update', function() {
      return bundle(b, key);
    });
  });
});

gulp.task('build', function(callback) {
  runSequence('clean', ['js:browser', 'copy'], 'watch', callback);
});