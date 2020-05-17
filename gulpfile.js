'use strict';

/*
  Imports
*/
const gulp = require('gulp');
const browserSync = require('browser-sync');
const pkg = require('./package.json');
const beeper = require('beeper');
const log = require('fancy-log');
const ftp = require('vinyl-ftp');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');
const webpackConfig = require('./webpack.config.js');
const plumber = require('gulp-plumber');
const concat = require('gulp-concat');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const header = require('gulp-header');
const rename = require('gulp-rename');
const pug = require('gulp-pug');
const iconfont = require('gulp-iconfont');
const iconfontCss = require('gulp-iconfont-css');
const nodemon = require('gulp-nodemon');
const zip = require('gulp-zip');
const svgmin = require('gulp-svgmin');
const moment = require('moment');
const pugLinter = require('gulp-pug-linter');
const del = require('del');

/*
  Paths
*/
const PATHS = {
    SRC: {
        pug: ['app/pug/pages/*.pug'],
        sass: ['app/sass/app.scss'],
        sassAssets: ['node_modules/foundation-sites/scss', 'node_modules/motion-ui/src'],
        js: ['app/js/app.js'],
        icon: ['app/icons/*.svg'],
        zip: ['build/scripts/*.min.js', 'build/styles/*.min.css', 'build/fonts/']
    },
    DEST: {
        build: ['build/'],
        html: ['build/html/'],
        css: ['build/styles/'],
        js: ['build/scripts/'],
        font: ['build/fonts/'],
        icon: ['app/icons/']
    }
};

/*
  Create header via package.json to add in JS and CSS media files
*/
const now = moment().format('DD-MM-YYYY H:m:s');
const banner = [
    '/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @date: <%= now %>',
    ' * @link <%= pkg.homepage %>',
    ' */',
    ''
].join('\n');

/*
  Error catcher
*/
const onError = (err) => {
    beeper(2);
    console.log(err);
    this.emit('end');
};

/*
  Clear CSS
*/
const clearCSS = () => {
    return del(PATHS.DEST.css);
};

/*
  Clear JS
*/
const clearJS = () => {
    return del(PATHS.DEST.js);
};

/*
  Clear HTML
*/
const clearHTML = () => {
    return del(PATHS.DEST.html);
};

/*
  PUG Lint
*/
const nbErros = (errors) => {
    if (errors.length) {
        console.error(errors.length);
    }
};
const pugLint = () => gulp.src(['app/pug/**/*.pug']).pipe(pugLinter()).pipe(pugLinter.reporter());

/*
  convert SASS files to CSS
*/
const devSASS = () =>
    gulp
        .src(PATHS.SRC.sass)
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(concat('app.css'))
        .pipe(
            sass({
                includePaths: PATHS.SRC.sassAssets
            })
        )
        .pipe(autoprefixer())
        .pipe(gulp.dest(PATHS.DEST.css))
        .pipe(browserSync.reload({ stream: true }));

/*
  CSS production
*/
const prodCSS = () =>
    gulp
        .src(PATHS.DEST.css + '/app.css')
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(
            cleanCSS(
                {
                    debug: true,
                    level: {
                        2: {
                            mergeSemantically: false, // controls semantic merging; defaults to true
                            restructureRules: false // controls rule restructuring; defaults to false
                            //removeUnusedAtRules: true // controls unused at rule removing; defaults to false (available since 4.1.0)
                        }
                    }
                },
                (details) => {
                    console.log(
                        `${details.name} was initialy ${Math.ceil(
                            details.stats.originalSize / 1000
                        )}Kb`
                    );
                    console.log(
                        `${details.name} is now ${Math.ceil(details.stats.minifiedSize / 1000)}Kb`
                    );
                    console.log(
                        `${
                            Math.ceil(details.stats.originalSize / 1000) -
                            Math.ceil(details.stats.minifiedSize / 1000)
                        }Kb has been compressed`
                    );
                }
            )
        )
        .pipe(header(banner, { pkg: pkg, now: now }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(PATHS.DEST.css));

/*
  JS webpack Bundle
*/
const devJS = () =>
    gulp
        .src(PATHS.SRC.js)
        .pipe(webpackStream(webpackConfig), webpack)
        .pipe(gulp.dest(PATHS.DEST.js))
        .pipe(browserSync.reload({ stream: true }));

/*
  JS production
*/
const updateWebpackConfig = () => {
    return new Promise(function (resolve, reject) {
        webpackConfig.mode = 'production';
        resolve();
    });
};

const prodJS = () =>
    gulp
        .src(PATHS.SRC.js)
        .pipe(webpackStream(webpackConfig), webpack)
        .pipe(header(banner, { pkg: pkg, now: now }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(PATHS.DEST.js));

/*
  PUG to HTML
*/
const buildHTML = () =>
    gulp
        .src(PATHS.SRC.pug)
        .pipe(
            plumber({
                errorHandler: onError
            })
        )
        .pipe(pug())
        .pipe(gulp.dest(PATHS.DEST.html))
        .pipe(browserSync.reload({ stream: true }));

/*
  Minify SVG icon files
*/
const minifyICON = () => gulp.src(PATHS.SRC.icon).pipe(svgmin()).pipe(gulp.dest(PATHS.DEST.icon));

/*
  Generate Icons font file and css
*/
let fontName = pkg.name + '-icon-font';
const buildICON = () =>
    gulp
        .src(PATHS.SRC.icon, { base: 'app/' })
        .pipe(
            iconfontCss({
                fontName: fontName,
                path: 'app/sass/template/icon-template.scss',
                targetPath: '../../../app/sass/base/icons.scss',
                fontPath: '../fonts/icons/'
            })
        )
        .pipe(
            iconfont({
                fontName: fontName,
                fontHeight: 1000,
                formats: ['woff2', 'woff', 'ttf'],
                normalize: true
            })
        )
        .pipe(gulp.dest(PATHS.DEST.font + '/icons/'))
        .pipe(browserSync.reload({ stream: true }));

/*
  ZIP the Medias
*/
const zipMEDIA = () =>
    gulp
        .src(PATHS.SRC.zip)
        .pipe(zip(pkg.name + '-media.zip'))
        .pipe(gulp.dest(PATHS.DEST.build));

/*
  FTP Deployment
*/
const conn = ftp.create({
        host: '',
        user: '',
        password: '',
        parallel: 3,
        log: log
    }),
    globs = ['build/**'];

const deployFTP = () =>
    gulp
        .src(globs, { base: '.', buffer: false })
        .pipe(conn.newer('/build_html')) // only upload newer files
        .pipe(conn.dest('/build_html'));

/*
  GULP server
*/
const develop = () =>
    nodemon({
        script: './server.js',
        ext: 'js',
        watch: ['gulpfile.js', 'server.js'],
        ignore: ['./node_modules/'],
        env: {
            NODE_ENV: 'development'
        }
    });

/*
  GULP BROWSERSYNC
*/
const launchBrowserSync = () =>
    browserSync.init(null, {
        proxy: 'http://localhost:3000',
        browser: 'chrome',
        port: 3001,
        open: true,
        browser: 'chrome',
        logFileChanges: true,
        logConnections: false,
        injectChanges: true,
        timestamps: false,
        ghostMode: {
            clicks: true,
            forms: true,
            scroll: false
        }
    });

/*
  GULP Watch
*/
const watch = () => {
    gulp.watch(PATHS.SRC.pug, buildHTML);
    gulp.watch('./app/sass/**/*.scss', { interval: 1000 }, devSASS);
    gulp.watch('./app/js/**/*.js', { interval: 1000 }, devJS);
    gulp.watch(PATHS.SRC.icon, { interval: 1000 }, buildICON);
};

/*
  TASK: JS Full Process
*/
const js = gulp.series(clearJS, updateWebpackConfig, prodJS);
gulp.task('JS', js);

/*
  TASK: CSS Full Process
*/
const css = gulp.series(clearCSS, minifyICON, buildICON, devSASS, prodCSS);
gulp.task('CSS', css);

/*
  TASK: HTML Full Process
*/
const html = gulp.series(clearHTML, buildHTML);
gulp.task('HTML', html);

/*
  TASK: Generate All Medias and ZIP them
*/
const media = gulp.series(gulp.parallel('CSS', 'JS'), zipMEDIA);
gulp.task('MEDIA', media);

/*
  TASK: Send all build Folder to FTP
*/
const ftpProcess = gulp.series(gulp.parallel('CSS', 'JS', 'HTML'), deployFTP);
gulp.task('FTP', ftpProcess);

/*
  TASK: Default
*/
const build = gulp.series(
    gulp.parallel(gulp.series(buildICON, devSASS), devJS),
    gulp.parallel(launchBrowserSync, develop, watch)
);

exports.default = build;
