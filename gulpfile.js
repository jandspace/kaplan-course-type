
var gulp = require ('gulp'),
    watch = require('gulp-watch'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    cssvars = require('postcss-simple-vars'),
    nested = require('postcss-nested'),
    cssImport = require('postcss-import'),
    lostgrid = require('lost'),
    pixelstorem = require('postcss-pixels-to-rem'),
    mixins = require('postcss-mixins'),
    imagemin = require('gulp-imagemin'),
    usemin = require('gulp-usemin'),
    rev = require('gulp-rev'),
    cssnano = require('gulp-cssnano'),
    uglify = require('gulp-uglify'),

    browserSync = require('browser-sync').create(),
    devip = require('dev-ip'),
    rename = require('gulp-rename'),
    del = require('del'),
    svgSprite = require('gulp-svg-sprite');



var config = {
    mode: {
        css: {
            sprite: 'sprite.svg',
            render: {
                css: {
                    template: './app/templates/sprite.css'
                }
            }
        }
    }
};



gulp.task('beginClean', function() {
    return del(['./app/temp/sprite', './app/assets/images/sprites']);
});

gulp.task('createSprite', ['beginClean'], function() {
    return gulp.src('./app/images/icons/**/*.svg')
        .pipe(svgSprite(config))
        .pipe(gulp.dest('./app/temp/sprite/'));
});

gulp.task('copySpriteGraphic', ['createSprite'], function() {
    return gulp.src('./app/temp/sprite/css/**/*.svg')
        .pipe(gulp.dest('./app/images/sprites'));
});

gulp.task('copySpriteCSS', ['createSprite'], function() {
    return gulp.src('./app/temp/sprite/css/*.css')
        .pipe(rename('_sprite.css'))
        .pipe(gulp.dest('./app/styles/modules'));
});

gulp.task('endClean', ['copySpriteGraphic', 'copySpriteCSS'], function() {
    return del('./app/temp/sprite');
});

gulp.task('icons', ['beginClean', 'createSprite', 'copySpriteGraphic', 'copySpriteCSS', 'endClean']);



gulp.task('styles', function () {
    console.log('CSS task is running');
    return gulp.src('./app/styles/styles.css')
        .pipe(postcss([cssImport, mixins,  cssvars, nested, autoprefixer, lostgrid()]))
        .on('error', function(errorInfo) {
            console.log(errorInfo.toString());
            this.emit('end');
        })
        .pipe(gulp.dest('./app/temp/styles'))
});

gulp.task('watch', function() {

    browserSync.init({
        notify: false,
        server: {
            baseDir: "app"
        }
    });

    watch('./app/index.html', function() {
        browserSync.reload();
    });

    watch('./app/styles/**/*.css', function() {
        gulp.start('cssInject');
    });

});

gulp.task('cssInject', ['styles'], function() {
    return gulp.src('./app/temp/styles/styles.css')
        .pipe(browserSync.stream());
});




gulp.task('previewDist', function() {
    browserSync.init({
        notify: false,
        server: {
            baseDir: "dist"
        }
    });
});

gulp.task('deleteDistFolder', function() {
    return del("./dist");
});

gulp.task('copyGeneralFiles', ['deleteDistFolder'], function() {
    var pathsToCopy = [
        './app/**/*',
        '!./app/index.html',
        '!./app/images/**',
        '!./app/templates/**',
        '!./app/styles/**',
        '!./app/scripts/**',
        '!./app/temp',
        '!./app/temp/**'
    ]

    return gulp.src(pathsToCopy)
        .pipe(gulp.dest("./dist"));
});

gulp.task('optimizeImages', ['deleteDistFolder', 'icons'], function() {
    return gulp.src(['./app/images/**/*', '!./app/images/icons', '!./app/images/icons/**/*'])
        .pipe(imagemin({
            progressive: true,
            interlaced: true,
            multipass: true
        }))
        .pipe(gulp.dest("./dist/images"));
});

gulp.task('usemin', ['deleteDistFolder', 'styles'], function() {
    return gulp.src("./app/index.html")
        .pipe(usemin({
            css: [function() {return rev()}]
            // js: [function() {return rev()}, function() {return uglify()}]
        }))
        .pipe(gulp.dest("./dist"));
});

gulp.task('build', ['deleteDistFolder', 'copyGeneralFiles', 'optimizeImages', 'usemin']);

