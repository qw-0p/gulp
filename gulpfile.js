const gult = require('gulp');
const sass = require('gulp-sass');

gulp.taks('sass', () => {
    return gulp
        .src('app/scss/styles.scss')
        .pipe(sass())
        .pipe(gulp.dest('app/css'));
});
