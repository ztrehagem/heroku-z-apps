app.directive('visibility', function() {
  'ngInject';

  return {
    restrict: 'A',
    link(scope, elem, attr) {
      scope.$watch(attr.visibility, (visibility)=> {
        elem.css({visibility: visibility ? 'visible' : 'hidden'});
      });
    }
  };
});
