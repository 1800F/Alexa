"use strict";

var gulp = require('gulp')
    , less = require('gulp-less')
    , watch = require('gulp-watch')
    , runSequence = require('run-sequence')
    , concat = require('gulp-concat')
    , minifyCss = require('gulp-minify-css')
    , uglify = require('gulp-uglify')
    , autoprefixer = require('gulp-autoprefixer')
    , rename = require('gulp-rename')
    , nodemon = require('gulp-nodemon')
    , debug = require('gulp-debug')
    , rimraf = require('gulp-rimraf')

    , src = 'www/public-src/'
    , dest = 'www/public/'

    , styleDest = dest + 'css/'
    , styleSource = src + 'less/'
    , cssBuild = styleDest +'main.css'
    , watchLessFiles = styleSource + '**.less'
    , lessFiles = styleSource + 'main.less'

    , jsSource = src + 'js/'
    , jsDest = dest + 'js/'
    , watchJsFiles = src + 'js/**.js'

    , robotsFile = src + 'robots.txt'
    ;

gulp.task('font', function() {
  return gulp.src(src + 'fonts/**')
  .pipe(gulp.dest(dest + '/fonts'))
});

gulp.task('img', function() {
  return gulp.src(src + 'img/**')
  .pipe(gulp.dest(dest + 'img'))
});

gulp.task('less', function() {
  return gulp.src(lessFiles)
  .pipe(less())
  .on('error', function(err) {
    console.log(err.stack || err);
    this.emit('end');
  })
  .pipe(concat('main.css'))
  .pipe(autoprefixer({
    browsers: ['last 4 versions'],
    cascade: false
  }))
  .pipe(gulp.dest(styleDest))
});

gulp.task('js', function() {
  return gulp.src(watchJsFiles)
  .pipe(concat('main.js'))
  // .pipe(uglify())
  // .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest(jsDest))
});

gulp.task('robots', function() {
  return gulp.src(robotsFile)
  .pipe(gulp.dest(dest))
});

gulp.task('minCss', function(){
  return gulp.src(cssBuild)
  .pipe(minifyCss())
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest(styleBase))
});

gulp.task('watch', function (cb) {
  gulp.watch(watchLessFiles, ['less']);
  gulp.watch(watchJsFiles, ['js']);
  nodemon({
    script: 'www/server.js',
    watch: ['www/*','config/*','services/*','skill/*'],
    ext: 'json js',
    ignore: ['node_modules/**/*']
  });
});

gulp.task('clean',function(){
  return gulp.src(dest).pipe(rimraf());
})

gulp.task('compile',function(cb){
  runSequence('clean',['less','img','font','js','robots'], cb);
})

gulp.task('run', function(cb){
  require('./www/server.js');
});

gulp.task('default', function (cb) {
  runSequence('clean',['less','img','font','js','robots'],'run', cb);
});
