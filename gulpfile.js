const Zelixir = require('z-elixir');
const Resource = Zelixir.Resource;
const Task = Zelixir.Task;
const config = Zelixir.config;

config.enabledNgAnnotate = true;
config.enabledBabel = true;

const JS_APP_NAMES = ['root', 'shift', 'geister'];

Resource('html', Resource.template('html'));
Resource('sass', Resource.template('sass'));
JS_APP_NAMES.forEach((name)=> {
  Resource(`js-${name}`, Resource.create()
    .src(`js/${name}/*`)
    .src(`js/${name}/*/**/*.js`)
    .concat(`${name}.js`)
    .dest('js/')
  );
});

Task('html', ['html'], Task.template('html'));
Task('sass', ['sass'], Task.template('sass'));
// Task('js', ['js'], Task.template('js'));
JS_APP_NAMES.forEach((name)=> {
  Task(`js-${name}`, [`js-${name}`], Task.template('js'));
});

Task.default();
Task.watch();
