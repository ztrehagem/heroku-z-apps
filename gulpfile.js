const GulpTask = require('./gulp-template/gulp-task');
const Resource = require('./gulp-template/resource');
const $ = require('./gulp-template/gulp-modules');

const JS_APP_NAMES = ['root', 'shift'];

Resource.add('html', Resource.templates.html());
Resource.add('sass', Resource.templates.sass());
Resource.add('js', JS_APP_NAMES.map((name)=> {
  return new Resource.Builder()
  .src(`js/${name}/*.js`)
  .src(`js/${name}/*/**/*.js`)
  .concat(true)
  .destfile(`${name}.js`)
  .dest(`js/`);
}));

GulpTask.add('html', GulpTask.templates.html());
GulpTask.add('sass', GulpTask.templates.sass());
GulpTask.add('js', GulpTask.templates.js());

GulpTask.define();
GulpTask.defineDefaultTasks();
