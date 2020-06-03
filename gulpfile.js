let pf = "dist"; //project folder
let sf = "src"; //source folder
let fs = require("fs");

let path = {
    build: {
        html: pf + "/",
        css: pf + "/css/",
        js: pf + "/js/",
        img: pf + "/img/",
        fonts: pf + "/fonts/",
    },
    src: {
        html: [sf + "/*.html", "!" + sf + "/_*.html"],
        css: sf + "/scss/style.scss",
        js: sf + "/js/script.js",
        img: sf + "/img/**/*.{jpg,jpeg,png,svg,gif,ico,webp}",
        fonts: sf + "/fonts/*.ttf",
    },
    watch: {
        html: sf + "/**/*.html",
        css: sf + "/scss/**/*.scss",
        js: sf + "/js/**/*.js",
        img: sf + "/img/**/*.{jpg,jpeg,png,svg,gif,ico,webp}",
    },
    clean: "./" + pf + "/",
};
let {src, dest} = require("gulp"),
    gulp = require("gulp"),
    browsersync = require("browser-sync").create(),
    fileinclude = require("gulp-file-include"),
    del = require("del"),
    scss = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer"),
    group_media = require("gulp-group-css-media-queries"),
    clean_css = require("gulp-clean-css"),
    rename = require("gulp-rename"),
    uglify = require("gulp-uglify-es").default,
    babel = require("gulp-babel"),
    imagemin = require("gulp-imagemin"),
    webp = require("gulp-webp"),
    webphtml = require("gulp-webp-html"),
    webpcss = require("gulp-webpcss"),
    svg_sprite = require("gulp-svg-sprite"),
    ttf2woff = require("gulp-ttf2woff"),
    ttf2woff2 = require("gulp-ttf2woff2"),
    fonter = require("gulp-fonter");

function browserSync(params) {
    browsersync.init({
        server: {
            baseDir: "./" + pf + "/",
        },
        port: 5000,
        notify: false,
    });
}
//!HTML
function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream());
}
//?CSS
function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded",
            })
        )
        .pipe(group_media())
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 10 versions"],
                cascade: true,
            })
        )
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(
            rename({
                extname: ".min.css",
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream());
}
//TODO: JS
function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(
            babel({
                presets: ["@babel/env"],
            })
        )
        .pipe(uglify())
        .pipe(
            rename({
                extname: ".min.js",
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream());
}
//*IMG
function images() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70,
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                interlaced: true,
                optimizationLevel: 4,
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream());
}

function fonts() {
    src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts));
    return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts));
}

gulp.task("otf2ttf", function () {
    return src([sf + "/fonts/*.otf"])
        .pipe(
            fonter({
                formats: ["ttf"],
            })
        )
        .pipe(dest(sf + "/fonts/"));
});

gulp.task("svg_sprite", function () {
    return gulp
        .src([sf + "/icnosprite/*.svg"])
        .pipe(
            svg_sprite({
                mode: {
                    stack: {
                        sprite: "../icons/icons.svg",
                    },
                },
            })
        )
        .pipe(dest(path.build.img));
});

function fontsStyle(params) {
    let file_content = fs.readFileSync(sf + "/scss/_fonts.scss");
    if (file_content == "") {
        fs.writeFile(sf + "/scss/fonts.scss", "", cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split(".");
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(
                            sf + "/scss/fonts.scss",
                            '@include font("' +
                                fontname +
                                '", "' +
                                fontname +
                                '", "400", "normal");\r\n',
                            callback
                        );
                    }
                    c_fontname = fontname;
                }
            }
        });
    }
}
function callback() {}

function watchFiles(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}
function clean(params) {
    return del(path.clean);
}
let build = gulp.series(
    clean,
    gulp.parallel(js, css, html, images, fonts),
    fontsStyle
);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.watch = watch;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.default = watch;
exports.build = build;
exports.html = html;
