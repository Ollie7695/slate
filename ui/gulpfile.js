var gulp = require('gulp'),
	runSequence = require('run-sequence'),
	bowerFiles = require('main-bower-files'),
	del = require('del'),
	autoprefixer = require('gulp-autoprefixer'),
	pkg = require('./package.json')
	plugins = require('gulp-load-plugins')();

var config = {
	src: './assets',
	dist: './../assets/',
	bowerDir: './bower_components'
}

var banner = [
	'/*!\n' +
	' * <%= package.title %> - <%= package.description %>\n' +
	' * @author <%= package.author %>\n' +
	' * @version <%= package.version %>\n' +
	' * Copyright ' + new Date().getFullYear() + ' <%= package.description %>, Ltd.\n' +
	' */',
	'\n'
].join('');


/*
 * Build tasks
 */
gulp.task('build:clean', function (cb) {
	del([config.dist], {force: true}, cb);
});

gulp.task('build:vendorjs', function(){
	var fileArray = bowerFiles();
	return gulp.src(fileArray)
		.pipe(plugins.filter(['*.js']))
		.pipe(plugins.concat('vendor.js'))
		.pipe(gulp.dest(config.dist + '/js'));
});

gulp.task('build:vendorcss', function(){
	var fileArray = bowerFiles();
	return gulp.src(fileArray)
		.pipe(plugins.filter(['*.css']))
		.pipe(plugins.concat('vendor.css'))
		.pipe(plugins.stripCssComments({
			preserve : false
		}))
		.pipe(gulp.dest(config.dist + '/css'));
});

gulp.task('build:modernizr', function() {
	return gulp.src(config.src + '/js/**/*.js')
		.pipe(plugins.modernizr('modernizr.js', {
			"options" : [
				"html5printshiv"
			]
		}))
		.pipe(gulp.dest(config.dist + '/js/'));
});

gulp.task('build:js', function(){
	return gulp.src(config.src + '/js/main.js')
		.pipe(plugins.sourcemaps.init())
			.pipe(plugins.browserify({
				insertGlobals : false,
				debug : false
			}))
		.pipe(plugins.sourcemaps.write())
		.pipe(gulp.dest(config.dist + '/js'));
});

gulp.task('build:sass', function () {
	return gulp.src(config.src + '/css/**/main.scss')
		.pipe(autoprefixer())
		.pipe(plugins.sourcemaps.init())
			.pipe(plugins.sassGlob())
			.pipe(plugins.sass({
				includePaths: [
					'./bower_components/bootstrap/scss/',
					'./bower_components/animate.css/'
				]
			}))
		.pipe(plugins.stripCssComments({
			preserve : false
		}))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(gulp.dest(config.dist + '/css'));
});

gulp.task('build:assets', function(){
	return gulp.src([config.src + '/**/*',
			'!' + config.src + '/js/**/*',
			'!' + config.src + '/css/**/*',
			'!' + config.src + '/{icons,icons/**}'
			])
		.pipe(plugins.changed(config.dist))
		.pipe(gulp.dest(config.dist));
});

gulp.task('build:iconfont', function(){
	return gulp.src(config.src + '/icons/*.svg')
		.pipe(plugins.debug({title: 'icon:'}))
		.pipe(plugins.svgmin())
		.pipe(plugins.iconfont({
			normalize: true,
			fontName: 'iconfont'
		}))
		.on('glyphs', function(glyphs, options) {
			gulp.src(config.src + '/icons/template.css')
				.pipe(plugins.consolidate('lodash', {
					glyphs: glyphs,
					fontName: 'iconfont',
					fontPath: '../fonts/',
					className: 'icon'
				}))
				.pipe(plugins.rename('iconfont.scss'))
				.pipe(gulp.dest(config.src + '/css/components'));
		})
		.pipe(gulp.dest(config.dist + '/fonts'));
});


gulp.task('build', function(callback){
	runSequence(
		'build:clean',
		[
			'build:modernizr',
			'build:vendorjs',
			'build:vendorcss'
		],
		'build:iconfont',
		'build:js',
		'build:sass',
		'build:assets',
		callback)
});

gulp.task('default', ['build'], function(){
	gulp.watch(config.src + '/js/**/*.js', ['build:js']);
	gulp.watch(config.src + '/icons/**/*', ['build:iconfont']);
	gulp.watch(config.src + '/css/**/*.scss', ['build:sass']);
});


/*
 *  Production tasks
 */
gulp.task('optimize:css', function(){
	return gulp.src(config.dist + '/css/**/*.css')
		.pipe(plugins.minifyCss({
			advanced: false
		}))
		.pipe(plugins.header(banner, {package: pkg}))
		.pipe(gulp.dest(config.dist + '/css/'));
});

gulp.task('optimize:js', function() {
	return gulp.src(config.dist + '/js/**/*.js')
		.pipe(plugins.uglify())
		.pipe(plugins.header(banner, {package: pkg}))
		.pipe(gulp.dest(config.dist + '/js'));
});

gulp.task('optimize:images', function() {
	return gulp.src(config.dist + '/img/**/*')
		.pipe(plugins.imagemin())
		.pipe(gulp.dest(config.dist + '/img'));
});

gulp.task('optimize:svg', function() {
	return gulp.src(config.dist + '/img/**/*.svg')
		.pipe(plugins.svgmin())
		.pipe(gulp.dest(config.dist + '/img'));
});

gulp.task('optimize:assets', function() {
	return gulp.src(config.dist + '/**/*')
		.pipe(gulp.dest(config.dist));
});

gulp.task('publish:clean', function (cb) {
	del([config.dist], {force: true}, cb);
});

gulp.task('publish', function(callback){
	runSequence(
		'build',
		'optimize:assets',
		[
			'optimize:css',
			'optimize:js'
		],
		'optimize:images',
		'optimize:svg',
		callback);
});