!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.hashPersistencePlugin=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/* global App */

/**
 * The notebook triggers a load id middleware event to get the starting id.
 *
 * @param {String}   id
 * @param {Function} next
 * @param {Function} done
 */
var configurePlugin = function (config, next) {
  if (!config.id) {
    config.id = window.location.hash.substr(1);
  }

  return next();
};

/**
 * The notebook will trigger an id sync middleware event when the id changes.
 *
 * @param {String}   id
 * @param {Function} next
 * @param {Function} done
 */
App.config.on('change:id', function (_, id) {
  id = (id == null ? '' : String(id));

  window.location.hash = id;
});

/**
 * A user can use the forward and back buttons to navigate between notebooks.
 */
window.addEventListener('hashchange', function () {
  var id  = window.location.hash.substr(1);
  var url = window.location.href;

  App.config.set('id',      id);
  App.config.set('url',     url);
  App.config.set('fullUrl', url);
});

/**
 * Export the plugin architecture for direct use.
 *
 * @type {Object}
 */
module.exports = {
  'application:config': configurePlugin
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hYW5hbmQvSWRlYVByb2plY3RzL2FwaS1ub3RlYm9vay9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2FhbmFuZC9JZGVhUHJvamVjdHMvYXBpLW5vdGVib29rL3NyYy9zY3JpcHRzL3BsdWdpbnMvaGFzaC1wZXJzaXN0ZW5jZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWwgQXBwICovXG5cbi8qKlxuICogVGhlIG5vdGVib29rIHRyaWdnZXJzIGEgbG9hZCBpZCBtaWRkbGV3YXJlIGV2ZW50IHRvIGdldCB0aGUgc3RhcnRpbmcgaWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9ICAgaWRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIGNvbmZpZ3VyZVBsdWdpbiA9IGZ1bmN0aW9uIChjb25maWcsIG5leHQpIHtcbiAgaWYgKCFjb25maWcuaWQpIHtcbiAgICBjb25maWcuaWQgPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHIoMSk7XG4gIH1cblxuICByZXR1cm4gbmV4dCgpO1xufTtcblxuLyoqXG4gKiBUaGUgbm90ZWJvb2sgd2lsbCB0cmlnZ2VyIGFuIGlkIHN5bmMgbWlkZGxld2FyZSBldmVudCB3aGVuIHRoZSBpZCBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSAgIGlkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbkFwcC5jb25maWcub24oJ2NoYW5nZTppZCcsIGZ1bmN0aW9uIChfLCBpZCkge1xuICBpZCA9IChpZCA9PSBudWxsID8gJycgOiBTdHJpbmcoaWQpKTtcblxuICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IGlkO1xufSk7XG5cbi8qKlxuICogQSB1c2VyIGNhbiB1c2UgdGhlIGZvcndhcmQgYW5kIGJhY2sgYnV0dG9ucyB0byBuYXZpZ2F0ZSBiZXR3ZWVuIG5vdGVib29rcy5cbiAqL1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gIHZhciBpZCAgPSB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHIoMSk7XG4gIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcblxuICBBcHAuY29uZmlnLnNldCgnaWQnLCAgICAgIGlkKTtcbiAgQXBwLmNvbmZpZy5zZXQoJ3VybCcsICAgICB1cmwpO1xuICBBcHAuY29uZmlnLnNldCgnZnVsbFVybCcsIHVybCk7XG59KTtcblxuLyoqXG4gKiBFeHBvcnQgdGhlIHBsdWdpbiBhcmNoaXRlY3R1cmUgZm9yIGRpcmVjdCB1c2UuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICdhcHBsaWNhdGlvbjpjb25maWcnOiBjb25maWd1cmVQbHVnaW5cbn07XG4iXX0=
(1)
});
