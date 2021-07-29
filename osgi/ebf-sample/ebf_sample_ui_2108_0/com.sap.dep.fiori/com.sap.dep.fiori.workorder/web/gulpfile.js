const gulp = require('gulp');
const ui5preload = require('gulp-ui5-preload');
const uglify = require('gulp-uglify');
const prettydata = require('gulp-pretty-data');
const gulpif = require('gulp-if');

var namespace = 'dep.fiori.workorder';

gulp.task(
    'ui5preload',
    function() {
        return gulp.src(
                [
                    '**/**.+(js|xml)',
                    '!Component-preload.js',
                    '!gulpfile.js',
                    '!WEB-INF/web.xml',
                    '!model/metadata.xml',
                    '!node_modules/**',
                    '!resources/**'
                ]
            )
            .pipe(gulpif('**/*.js', uglify())) //only pass .js files to uglify
            .pipe(gulpif('**/*.xml', prettydata({type: 'minify'}))) // only pass .xml to prettydata
            .pipe(ui5preload({
                base: './',
                namespace: namespace,
                fileName: 'Component-preload.js'
            }))
            .pipe(gulp.dest('.'));
    }
);