var gulp = require('gulp')
  , $    = require('gulp-load-plugins')()

gulp.task('jade', function () {
  gulp.src('src/jade/**/*.jade')
    .pipe($.plumber())
    .pipe($.jade({ pretty: true }))
    .pipe(gulp.dest('public'))
})

gulp.task('stylus', function () {
  gulp.src('src/styles/main.styl')
    .pipe($.plumber())
    .pipe($.stylus())
    .pipe(gulp.dest('public'))
})

gulp.task('css', function () {
  gulp.src('src/styles/*.css')
    .pipe(gulp.dest('public'))
})

gulp.task('styles', ['stylus', 'css'])

gulp.task('js', function () {
  gulp.src([ 'src/scripts/qwest.min.js', 'src/scripts/*.js' ])
    .pipe($.sourcemaps.init())
    .pipe($.concat('main.js'))
    .pipe($.uglify())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('public'))
})

gulp.task('build', [ 'jade', 'styles', 'js' ])

gulp.task('watch', [ 'build' ], function () {
  gulp.watch('src/jade/**/*.jade', [ 'jade' ])
  gulp.watch('src/styles/main.styl', [ 'stylus' ])
  gulp.watch('src/scripts/**/*.js', [ 'js' ])
})

gulp.task('serve', [ 'watch' ], function () {
  $.supervisor('src/server.js', {
    watch: [ 'src', 'public' ],
    extensions: [ 'js,html,css' ]
  })
})
