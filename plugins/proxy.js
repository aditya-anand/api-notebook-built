!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.proxyPlugin=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/* global App */
var _         = App.Library._;
var url       = App.Library.url;
var PROXY_URL = {}.proxy && {}.proxy.url;

/**
 * Augment the ajax middleware with proxy urls when we make requests to a
 * recognised API endpoint.
 *
 * @param  {Object}   data
 * @param  {Function} next
 */
var ajaxPlugin = function (data, next) {
  // Allow the proxy to be bypassed completely.
  if (data.proxy === false) {
    return next();
  }

  var uri   = url.parse(data.url);
  var proxy = _.isString(data.proxy) ? data.proxy : PROXY_URL;

  // Attach the proxy if the url is not a relative url.
  if (proxy && uri.protocol && uri.host) {
    data.url = url.resolve(window.location.href, proxy) + '/' + data.url;
  }

  return next();
};

/**
 * A { key: function } map of all middleware used in the plugin.
 *
 * @type {Object}
 */
module.exports = {
  'ajax': ajaxPlugin
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hYW5hbmQvSWRlYVByb2plY3RzL2FwaS1ub3RlYm9vay9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2FhbmFuZC9JZGVhUHJvamVjdHMvYXBpLW5vdGVib29rL3NyYy9zY3JpcHRzL3BsdWdpbnMvcHJveHkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIGdsb2JhbCBBcHAgKi9cbnZhciBfICAgICAgICAgPSBBcHAuTGlicmFyeS5fO1xudmFyIHVybCAgICAgICA9IEFwcC5MaWJyYXJ5LnVybDtcbnZhciBQUk9YWV9VUkwgPSB7fS5wcm94eSAmJiB7fS5wcm94eS51cmw7XG5cbi8qKlxuICogQXVnbWVudCB0aGUgYWpheCBtaWRkbGV3YXJlIHdpdGggcHJveHkgdXJscyB3aGVuIHdlIG1ha2UgcmVxdWVzdHMgdG8gYVxuICogcmVjb2duaXNlZCBBUEkgZW5kcG9pbnQuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBuZXh0XG4gKi9cbnZhciBhamF4UGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQpIHtcbiAgLy8gQWxsb3cgdGhlIHByb3h5IHRvIGJlIGJ5cGFzc2VkIGNvbXBsZXRlbHkuXG4gIGlmIChkYXRhLnByb3h5ID09PSBmYWxzZSkge1xuICAgIHJldHVybiBuZXh0KCk7XG4gIH1cblxuICB2YXIgdXJpICAgPSB1cmwucGFyc2UoZGF0YS51cmwpO1xuICB2YXIgcHJveHkgPSBfLmlzU3RyaW5nKGRhdGEucHJveHkpID8gZGF0YS5wcm94eSA6IFBST1hZX1VSTDtcblxuICAvLyBBdHRhY2ggdGhlIHByb3h5IGlmIHRoZSB1cmwgaXMgbm90IGEgcmVsYXRpdmUgdXJsLlxuICBpZiAocHJveHkgJiYgdXJpLnByb3RvY29sICYmIHVyaS5ob3N0KSB7XG4gICAgZGF0YS51cmwgPSB1cmwucmVzb2x2ZSh3aW5kb3cubG9jYXRpb24uaHJlZiwgcHJveHkpICsgJy8nICsgZGF0YS51cmw7XG4gIH1cblxuICByZXR1cm4gbmV4dCgpO1xufTtcblxuLyoqXG4gKiBBIHsga2V5OiBmdW5jdGlvbiB9IG1hcCBvZiBhbGwgbWlkZGxld2FyZSB1c2VkIGluIHRoZSBwbHVnaW4uXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICdhamF4JzogYWpheFBsdWdpblxufTtcbiJdfQ==
(1)
});
