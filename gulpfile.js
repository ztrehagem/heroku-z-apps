const Zelixir = require('z-elixir');
const Resource = Zelixir.Resource;
const Task = Zelixir.Task;

const JS_APP_NAMES = ['root', 'shift'];

Resource('html', Resource.template('html'));
Resource('sass', Resource.template('sass'));
Resource('js', JS_APP_NAMES.map((name)=> {
  return Resource.create()
    .src(`js/${name}/*`)
    .src(`js/${name}/*/**/*.js`)
    .concat(`${name}.js`)
    .dest('js/');
}));

Task('html', ['html'], Task.template('html'));
Task('sass', ['sass'], Task.template('sass'));
Task('js', ['js'], Task.template('js'));

Task.default();
Task.watch();
