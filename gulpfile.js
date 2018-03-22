// Dependencies
var gulp = require('gulp');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var buffer = require('vinyl-buffer'); // use for browserify
var source = require('vinyl-source-stream'); // use for browserify
var rmLines = require('gulp-rm-lines'); // remove lines source minify
var $ = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*'],
	replaceString: /\bgulp[\-.]/
});
var BROWSER_SYNC_RELOAD_DELAY = 500;

// Rutas
paths = {
	dev: './dev',
	dist: './dist',
	base: './'
};

files = {
	pug: {
		watch: 'dev/pug/*.pug',
		src: paths.dev + '/pug/*.pug',
		template: [paths.dev + '/pug/partials/*.pug',paths.dev + '/pug/layouts/*.pug'],
		dest: paths.dist
	},
	scss: {
		watch: 'dev/scss/**/*.scss',
		src : paths.dev + '/scss/*.scss',
		dest: paths.dist + '/css'
	},
	js: {
		watch: 'dev/js/**/*.js',
		src: paths.dev + '/js/*.js',
		dest: paths.dist + '/js'
	},
	modules: {
		libs: paths.dev + '/js/libs/*',
		// include: paths.dev + '/js/libs/include/*.{js,swf,json}',
		dest : paths.dist + '/js/libs'
	},
	img: {
		watch: 'dev/img/**/*',
		src: paths.dev + '/img/**/*',
		dest: paths.dist + '/img'
	},
	fonts: {
		watch: 'dev/fonts/**/*.{eot,svg,ttf,woff,woff2}',
		src: paths.dev + '/fonts/**/*.{eot,svg,ttf,woff,woff2}',
		dest: paths.dist +'/fonts'
	}
}


// Server
gulp.task('browser-sync', ['nodemon'], function() {
	browserSync.init(null, {
		files: ['dist/**/*.*'],
		proxy: 'http://localhost:3000',
		browser: ['google chrome'],
		port: 3000
	});
});

gulp.task('nodemon', function (cb) {
	var started = false;
	return $.nodemon({
		script: 'server.js',
		watch: ['server.js'],
		ignore: [
			'gulpfile.js',
			'node_modules/',
			'.DS_Store'
		]
	})
	.on('start', function () {
		if (!started) {
			started = true;
			cb();
		}
	})
	.on('restart', function onRestart() {
		setTimeout(function reload() {
			browserSync.reload({
				stream: false
			});
		}, BROWSER_SYNC_RELOAD_DELAY);
	});
});

// Task
gulp.task('default', ['browser-sync', 'watch']);
gulp.task('build', ['build:view', 'build:css', 'build:js','build:libs', 'copy:images', 'copy:fonts', 'copy:libs'])
gulp.task('production', []);
gulp.task('integration', ['build:libs', 'integration:css', 'integration:js', 'copy:fonts', 'copy:libs', 'prod:images', 'integration:view']);


// Build
gulp.task('build:view', function() {
	gulp.src(files.pug.src)
	.pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
	.pipe($.changed(files.pug.dest,{extension: '.html'}))
	.pipe($.pug({
		pretty: true
	}))
	.pipe($.notify('Compiled: <%= file.relative %> 🍺'))
	.pipe(gulp.dest(files.pug.dest + '/'))
});

gulp.task('build:template', function() {
	gulp.src(files.pug.src)
	.pipe($.pug({
		pretty: true
	}))
	.pipe($.notify('Compiled: <%= file.relative %>'))
	.pipe(gulp.dest(files.pug.dest + '/'))
});

gulp.task('build:css', function() {
	gulp.src(files.scss.src)
	.pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
	.pipe($.sourcemaps.init())
	.pipe($.sass({outputStyle: 'compressed'}))
	.pipe($.autoprefixer())
	.pipe($.csso())
	.pipe($.rename({suffix: '.min'}))
	.pipe($.sourcemaps.write())
	.pipe($.notify('Compiled: <%= file.relative %> 🍺'))
	.pipe(gulp.dest(files.scss.dest))
});

gulp.task('build:libs', function() {
	gulp.start('browserify');
});

gulp.task('build:js', function() {
	gulp.src(files.js.src)
	.pipe($.concat('main.js'))
	.pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
	.pipe($.sourcemaps.init())
	.pipe($.uglify())
	.pipe($.rename({suffix: '.min'}))
	.pipe($.sourcemaps.write())
	.pipe($.notify('Compiled: <%= file.relative %> 🍺'))
	.pipe(gulp.dest(files.js.dest));
});

gulp.task('copy:fonts', function() {
	gulp.src(files.fonts.src)
		.pipe(gulp.dest(files.fonts.dest));
});

gulp.task('copy:images', function() {
	gulp.src(files.img.src)
		.pipe(gulp.dest(files.img.dest));
});

gulp.task('copy:libs', function() {
	gulp.src(files.modules.libs)
		.pipe(gulp.dest(files.modules.dest));
});

//Production

// For TI
gulp.task('integration:css', function(){
	gulp.src(files.scss.src)
	.pipe($.sass({outputStyle: 'expanded'}))
	.pipe($.autoprefixer())
	.pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
	.pipe(gulp.dest(files.scss.dest))
});

gulp.task('integration:js', function() {
	gulp.src(files.js.src)
	.pipe($.concat('main.js'))
	.pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
	.pipe(gulp.dest(files.js.dest));
});

gulp.task('integration:view', function() {
	gulp.src(files.pug.src)
	.pipe($.pug({
		pretty: true
	}))
	.pipe($.plumber({errorHandler: $.notify.onError('<%= error.message %>')}))
	.pipe(gulp.dest(files.pug.dest + '/'))
	.on('end', function() {
		gulp.start('remove:sources');
		setTimeout(function(){
			gulp.start('integration:inject');
		},1500);
	})
});

gulp.task('integration:inject', function() {
	target = gulp.src(files.pug.dest+'/**/*.html');
	target.pipe( $.inject(
	  gulp.src( [paths.dist+'/css/main.css'], { read : false } ), {
	      addRootSlash : false,
	      transform : function ( filePath) {
	          var newPath = filePath.replace( 'dist/', '' );
	          return '<link rel="stylesheet" href="' + newPath + '"/>';
	      }
	  } ))
		.pipe( $.inject(
			gulp.src( [paths.dist+'/js/main.js',paths.dist+'/js/libs/bundle.js'], { read : false } ), {
				addRootSlash : false,
				transform : function ( filePath) {
				var newPath = filePath.replace( 'dist/', '' );
				return '<script src="' + newPath  + '"></script>';
			}
		}))
	.pipe(gulp.dest(files.pug.dest + '/'));
});

gulp.task('remove:sources', function(){
	gulp.src('./dist/*.html')
		.pipe(rmLines({
			'filters': [
        /<script\s+src=['"]/i,
        /<link\s+rel=['"]stylesheet['"]/i,
			]
		}))
		.pipe(gulp.dest(paths.dist));
});


// For Client


// first install =  brew install libjpeg libpng
gulp.task('prod:images' , function () {
	return gulp.src(files.img.src)
		.pipe($.image({
			pngquant: true,
			optipng: true,
			zopflipng: true,
			jpegRecompress: true,
			jpegoptim: true,
			mozjpeg: true,
			gifsicle: true,
			svgo: false,
			concurrent: 10
		}))
		.pipe(gulp.dest(files.img.dest));
});

// Listen
gulp.task('watch', function () {
	gulp.watch(files.pug.template, ['build:template']);
	gulp.watch(files.pug.watch, ['build:view']);
	gulp.watch(files.img.watch, ['copy:images']);
	gulp.watch(files.scss.watch, ['build:css']);
	gulp.watch(files.js.watch, ['build:js']);
});

// vendors
gulp.task('browserify', function() {
	return browserify('./modules.js')
	.bundle()
	.pipe(source('bundle.js'))
	.pipe(buffer())
	.pipe($.uglify())
	.pipe(gulp.dest(files.modules.dest));
});
