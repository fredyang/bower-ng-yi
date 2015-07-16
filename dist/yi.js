/**
 * @license ng-yi v0.9
 * (c) 2015 Fred Yang http://semanticsworks.com
 * License: MIT
 */
(function (angular) {

'use strict';

var yiModule = angular.module('ng-yi', ['ngCookies']);



'use strict';

//yi-attr="{ placeholder : 'username'}"
yiModule.directive('yiAttr', function (resource) {

  var yiDataAttribute = /^yi-data-(.*)/;

  return function (scope, element, attrs) {

    var data;

    var localizedAttributes = scope.$eval(attrs.yiAttr);


    angular.forEach(attrs.$attr, function (attr, normalizedAttr) {

      var match = yiDataAttribute.exec(attr);
      if (match) {
        data = data || {};
        var key = match[1];
        attrs.$observe(normalizedAttr, function (newVal, oldVal) {
          if ((newVal && newVal !== oldVal) || !(data && data[key])) {
            data[key] = attrs[normalizedAttr];
            updateAttribute();
          }
        });
      }
    });

    function updateAttribute() {
      for (var attrName in localizedAttributes) {
        var resourceKey = localizedAttributes[attrName];
        var resourceValue = resource.get(resourceKey, data);
        element.attr(attrName, resourceValue);
      }
    }


    resource.onChanged(!data, updateAttribute, scope);
  };
});

'use strict';

yiModule.directive('yi', function (resource) {

  var resDataAttribute = /^yi-data-(.*)/;

  return function (scope, element, attrs) {

    var data;

    //search for attributes yi-data-fullname, in
    //<span res="greeting" yi-data-fullname="{{fullname}}"></span>
    //to create a data object like { fullname: value_of_fullname }
    //
    //if greeting is "My name is {fullname}" and fullname is "Fred"
    //then output will name "My name is Fred
    angular.forEach(attrs.$attr, function (attr, normalizedAttr) {

      var match = resDataAttribute.exec(attr);
      if (match) {
        data = data || {};
        var key = match[1];
        attrs.$observe(normalizedAttr, function (newVal, oldVal) {
          if ((newVal && newVal !== oldVal) || !(data && data[key])) {
            data[key] = attrs[normalizedAttr];
            updatHtml();
          }
        });
      }
    });

    function updatHtml() {

      element.html(resource.get(attrs.yi, data));
    }

    //if data is not empty, delay a little
    //so that let attrs.$observe to do the update
    resource.onChanged(!data, updatHtml, scope);
  };
});

'use strict';

yiModule.filter('yi', function (resource) {
  //support
  // 'key' | yi;
  function resFilter(resourceKey) {
    return resource.get(resourceKey);
  };

  resFilter.$stateful = true;

  return resFilter;

});

'use strict';


yiModule.factory('resource', function ($http, $rootScope, userLanguage) {

  var resourceCache;

  var regDot = /\./;

  function evalObjectPath(object, path) {

    path = path + '';

    if (!regDot.test(path)) {
      return object[path];
    }

    var parts = path.split('.');
    var node = object;
    //
    for (var i = 0; i < parts.length; i++) {
      var value = node[parts[i]];
      if (value === undefined) {
        return undefined;
      } else {
        node = value;
      }
    }
    return node;
  };


  var rSupplant = /\{([^\{\}]*)\}/g;

  function supplant(string, obj) {
    return string.replace(rSupplant,
      function (a, b) {
        var r = obj[b];
        return typeof r ? r : a;
      });
  }


  $rootScope.$watch(function () {
    return userLanguage();
  }, function (lang) {
    resourceCache = $http.get('resource/' + lang + '.json').then(function (response) {
      resourceCache = response.data;
      $rootScope.$broadcast(rtn.changedEvent);
      return resourceCache;
    });
  });

  var rtn = {

    changedEvent: 'resourceChanged',

    //resource.get('greeting', {fullName: "John Doe" });
    //data is optional
    //if 'greeting' resource is "hello, {fullName}", then it will
    //return "hello, John Doe"
    get: function (resourceId, data) {

      if (!resourceCache || (!!resourceCache && angular.isFunction(resourceCache.then))) {
        return '';
      } else {
        var text = evalObjectPath(resourceCache, resourceId);
        if (data) {
          text = supplant(text, data);
        }
        if (angular.isUndefined(text)) {
          throw new Error('resource for ' + resourceId + ' does not exists');
        }
        return text;
      }
    },

    //support
    //onChanged(fn, scope) //evaluateImmediately is true by default
    //onChanged(evaluateImmediately, fn, scope)
    onChanged: function (evaluateImmediately, fn, scope) {

      if (angular.isFunction(evaluateImmediately)) {
        scope = fn;
        fn = evaluateImmediately;
        evaluateImmediately = true;
      }

      if (evaluateImmediately) {
        fn();
      }

      scope.$on(rtn.changedEvent, fn);
    }
  };

  return rtn;

});

'use strict';

yiModule.factory('userLanguage', function ($window, yiConfig, $cookieStore) {


  var cookieName = yiConfig.cookieName;
  var cachedLanguage = $cookieStore.get(cookieName);

  if (!cachedLanguage) {
    userLanguage(getDefaultLanguage());
  }

  return userLanguage;

  function userLanguage(lang) {

    if (arguments.length === 0) {
      return cachedLanguage;
    } else {

      if (!(lang in yiConfig.supportedLanguages)) {
        lang = getDefaultLanguage();
      }
      cachedLanguage = lang;
      $cookieStore.put(cookieName, lang);
    }
  }

  function getDefaultLanguage() {
    //$window.navigator.language is supported by Chrome and Firefox like 'en-US'
    //$window.navigator.browserLanguage is supported by IE
    var browserLanguage = ($window.navigator.language || $window.navigator.browserLanguage).substr(0, 2);
    var defaultLanguage;


    //if browser language is not supported, then use the
    //default supported language as default language
    //
    if (!(browserLanguage in yiConfig.supportedLanguages)) {
      defaultLanguage = yiConfig.defaultLanguage;
    } else {
      defaultLanguage = browserLanguage;
    }
    return defaultLanguage
  }

});

yiModule.value('yiConfig', {
    supportedLanguages: {
        en: 'English'
    },
    defaultLanguage: 'en',
    cookieName: 'language'
});

})(angular);
