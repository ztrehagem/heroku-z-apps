const Zelixir = require('z-elixir');
const Resource = Zelixir.Resource;
const Task = Zelixir.Task;
const config = Zelixir.config;
const $ = Zelixir.modules;

config.enabledNgAnnotate = true;
config.enabledBabel = true;

const JS_APP_NAMES = ['root', 'shift', 'geister'];

Resource('html', Resource.template('html')
  .option({replace: {
    angular: {
      local: '/js/lib/angular.min.js',
      cdn: '//ajax.googleapis.com/ajax/libs/angularjs/1.6.3/angular.min.js'
    },
    'angular-ui-router': {
      local: '/js/lib/angular-ui-router.min.js',
      cdn: '//npmcdn.com/angular-ui-router/release/angular-ui-router.min.js'
    }
  }})
);
Resource('sass', Resource.template('sass'));
JS_APP_NAMES.forEach((name)=> {
  Resource(`js-${name}`, Resource.create()
    .src(`js/${name}/*`)
    .src(`js/${name}/*/**/*.js`)
    .concat(`${name}.js`)
    .dest('js/')
  );
});

// Task('html', ['html'], Task.template('html'));
Task('html', ['html'], (res)=>
  $.gulp.src(res.src)
    .pipe($.errorHandler())
    .pipe($.changed(res.dest))
    .pipe($.replace(/{%(.+?)}/g, (match, name)=>
      res.replace[name][process.env.NODE_ENV ? 'cdn' : 'local']
    ))
    .pipe($.html({collapseWhitespace: true, minifyCSS: true, minifyJS: true}))
    .pipe($.gulp.dest(res.dest))
);
Task('sass', ['sass'], Task.template('sass'));
// Task('js', ['js'], Task.template('js'));
JS_APP_NAMES.forEach((name)=> {
  Task(`js-${name}`, [`js-${name}`], Task.template('js'));
});

Task.default();
Task.watch();
