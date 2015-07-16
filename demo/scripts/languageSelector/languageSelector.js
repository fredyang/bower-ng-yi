'use strict';

demo.directive('languageSelector', function (yiConfig, userLanguage) {

  return {

    restrict: 'E',

    scope: {},

    templateUrl: 'scripts/languageSelector/languageSelector.html',

    controller: function ($scope) {

      angular.extend($scope, {

        languages: yiConfig.supportedLanguages,

        selectedLang: userLanguage(),

        changeLanguage: function () {
          userLanguage(this.selectedLang);
        }

      });

    }
  };
});
