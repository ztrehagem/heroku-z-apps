app.factory('moment', function($window, $locale) {
  'ngInject';

  const moment = $window.moment;
  moment.locale('ja');
  moment.parseFromApi = datestr => moment(datestr, null, 'en').locale(moment.locale());
  return moment;
});
