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
var fs = require('fs');
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
    gulp.src('public/js/utils/*').pipe(gulp.dest('build/public/js/utils/')),
    gulp.src('index.html').pipe(gulp.dest('build/'))
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
  'build/public/js/plot.js': createBundle('./public/js/plot.js'),
  'build/sw.js': createBundle('serviceWorker.js')
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
  gulp.watch(['public/imgs/**/*', 'public/css/**/*', 'public/js/utils/*', 'index.html'], ['copy']);

  Object.keys(jsBundles).forEach(function(key) {
    var b = jsBundles[key];
    b.on('update', function() {
      return bundle(b, key);
    });
  });
});

gulp.task('build', function(callback) {
  runSequence(['js:browser', 'copy'], 'watch', callback);
});

/**Copy built file to root directory */
gulp.task('post-clean', function() {
  del(['public', './sw.js'])
});

gulp.task('rename', function(done) {
  fs.rename('public', 'public-es6', function(err) {
    if (err) {
      throw err;
    }
    fs.rename('serviceWorker.js', 'serviceWorkerES6.js', function(err) {
      if (err) {
        throw err;
      }
      done();
    });
  });
});

gulp.task('rename-reverse', function(done) {
  fs.rename('public-es6', 'public', function(err) {
    if (err) {
      throw err;
    }
    fs.rename('serviceWorkerES6.js', 'serviceWorker.js', function(err) {
      if (err) {
        throw err;
      }
      done();
    });
  });
});

gulp.task('dist', function() {
  return mergeStream(
    gulp.src('build/public/css/**/*').pipe(gulp.dest('public/css/')),
    gulp.src('build/public/imgs/**/*').pipe(gulp.dest('public/imgs/')),
    gulp.src('build/public/js/*').pipe(gulp.dest('public/js/')),
    gulp.src('build/public/js/utils/*').pipe(gulp.dest('public/js/utils/')),
    gulp.src('build/sw.js').pipe(gulp.dest('./'))
  );
});

gulp.task('deploy-ghpage', function(callback) {
  runSequence('rename', 'dist', 'clean', callback);
});

gulp.task('reverse', function(callback) {
  runSequence('rename-reverse', ['js:browser', 'copy'], callback);
});