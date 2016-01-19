var gulp = require('gulp')
  , $    = require('gulp-load-plugins')()

gulp.task('jade', function () {
  gulp.src('src/jade')
    .pipe($.plumber())
    .pipe($.jade({ pretty: true }))
    .pipe(gulp.dest('public'))
})

gulp.task('stylus', function () {
  gulp.src('src/styles')
    .pipe($.plumber())
    .pipe($.stylus())
    .pipe(gulp.dest('public'))
})

gulp.task('watch', [ 'jade', 'stylus' ], function () {
  gulp.watch('src/jade/**/*.jade', [ 'jade' ])
  gulp.watch('src/styles/main.styl', [ 'stylus' ])
})

gulp.task('serve', [ 'watch' ], function () {
  $.supervisor('src/server.js', {
    watch: [ 'src', 'dist' ]
    extensions: [ 'js,jade,styl' ]
  })
})
