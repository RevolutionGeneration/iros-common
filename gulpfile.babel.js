import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import path from 'path';
import del from 'del';
import runSequence from 'run-sequence';

const plugins = gulpLoadPlugins();

const paths = {
  js: ['*.js', 'src/**/*.js', '!coverage/**', '!node_modules/**', '!src/tests/**'],
};

// Clean up dist and coverage directory
gulp.task('clean', () => del.sync(['dist/**', 'dist/.*', '!dist']));

// Compile ES6 to ES5 and copy to dist
gulp.task('babel', () =>
    gulp.src([...paths.js, '!gulpfile.babel.js'], {base: './src'})
        .pipe(plugins.newer('dist'))
        .pipe(plugins.babel())
        .pipe(gulp.dest('dist')),
);

// Start server with restart on file changes
gulp.task('nodemon', ['babel'], () =>
    plugins.nodemon({
      script: path.join('dist', 'index.js'),
      ext: 'js',
      ignore: ['node_modules/**/*.js', 'dist/**/*.js', 'test/**/*.js'],
      tasks: ['babel'],
    }),
);

// gulp serve for development
gulp.task('serve', ['clean'], () => runSequence('nodemon'));

// default task: clean dist, compile js
gulp.task('default', ['clean'], () => runSequence('babel'));
