var demo = angular.module("yi.demo", ['ng-yi']);

demo.run(function (yiConfig) {

  yiConfig.supportedLanguages.cn = '中文';

});
