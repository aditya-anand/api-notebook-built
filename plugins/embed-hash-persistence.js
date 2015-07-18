!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.embedHashPersistencePlugin=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var NOTEBOOK_URL = {"url":"http://localhost:3000","title":"API Notebook","oauthCallback":"/authenticate/oauth.html"}.url;

/**
 * Export the attaching functionality.
 *
 * @param {Function} Notebook
 */
module.exports = function (Notebook) {
  /**
   * Subscribe to a single notebook for hash changes.
   *
   * @param {Object} notebook
   */
  Notebook.subscribe(function (notebook) {
    // Update the id and url when the hash of the window changes.
    var updateId = function () {
      var id  = window.location.hash.substr(1);
      var url = window.location.href;

      notebook.config('id',  id);
      notebook.config('url', url);
    };

    var updateUrl = function () {
      var id = notebook.options.config.id;

      id = (id == null ? '' : String(id));

      // Update the hash url if it changed.
      if (window.location.hash.substr(1) !== id) {
        window.location.hash = id;
        notebook.config('fullUrl', NOTEBOOK_URL + (id ? '#' + id : ''));
      }
    };

    updateId();
    window.addEventListener('hashchange', updateId);

    // Update the window hash when the id changes.
    notebook.on('config', function (name) {
      if (name !== 'id') { return; }

      return updateUrl();
    });

    /**
     * Unsubscribe to a single notebook from hash changes.
     *
     * @param {Object} notebook
     */
    Notebook.unsubscribe(function () {
      window.removeEventListener('hashchange', updateId);
    });
  });
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hYW5hbmQvSWRlYVByb2plY3RzL2FwaS1ub3RlYm9vay9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2FhbmFuZC9JZGVhUHJvamVjdHMvYXBpLW5vdGVib29rL3NyYy9zY3JpcHRzL3BsdWdpbnMvZW1iZWQtaGFzaC1wZXJzaXN0ZW5jZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIE5PVEVCT09LX1VSTCA9IHtcInVybFwiOlwiaHR0cDovL2xvY2FsaG9zdDozMDAwXCIsXCJ0aXRsZVwiOlwiQVBJIE5vdGVib29rXCIsXCJvYXV0aENhbGxiYWNrXCI6XCIvYXV0aGVudGljYXRlL29hdXRoLmh0bWxcIn0udXJsO1xuXG4vKipcbiAqIEV4cG9ydCB0aGUgYXR0YWNoaW5nIGZ1bmN0aW9uYWxpdHkuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gTm90ZWJvb2tcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoTm90ZWJvb2spIHtcbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byBhIHNpbmdsZSBub3RlYm9vayBmb3IgaGFzaCBjaGFuZ2VzLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gbm90ZWJvb2tcbiAgICovXG4gIE5vdGVib29rLnN1YnNjcmliZShmdW5jdGlvbiAobm90ZWJvb2spIHtcbiAgICAvLyBVcGRhdGUgdGhlIGlkIGFuZCB1cmwgd2hlbiB0aGUgaGFzaCBvZiB0aGUgd2luZG93IGNoYW5nZXMuXG4gICAgdmFyIHVwZGF0ZUlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGlkICA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKTtcbiAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcblxuICAgICAgbm90ZWJvb2suY29uZmlnKCdpZCcsICBpZCk7XG4gICAgICBub3RlYm9vay5jb25maWcoJ3VybCcsIHVybCk7XG4gICAgfTtcblxuICAgIHZhciB1cGRhdGVVcmwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgaWQgPSBub3RlYm9vay5vcHRpb25zLmNvbmZpZy5pZDtcblxuICAgICAgaWQgPSAoaWQgPT0gbnVsbCA/ICcnIDogU3RyaW5nKGlkKSk7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgaGFzaCB1cmwgaWYgaXQgY2hhbmdlZC5cbiAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHIoMSkgIT09IGlkKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gaWQ7XG4gICAgICAgIG5vdGVib29rLmNvbmZpZygnZnVsbFVybCcsIE5PVEVCT09LX1VSTCArIChpZCA/ICcjJyArIGlkIDogJycpKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdXBkYXRlSWQoKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIHVwZGF0ZUlkKTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgd2luZG93IGhhc2ggd2hlbiB0aGUgaWQgY2hhbmdlcy5cbiAgICBub3RlYm9vay5vbignY29uZmlnJywgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIGlmIChuYW1lICE9PSAnaWQnKSB7IHJldHVybjsgfVxuXG4gICAgICByZXR1cm4gdXBkYXRlVXJsKCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBVbnN1YnNjcmliZSB0byBhIHNpbmdsZSBub3RlYm9vayBmcm9tIGhhc2ggY2hhbmdlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBub3RlYm9va1xuICAgICAqL1xuICAgIE5vdGVib29rLnVuc3Vic2NyaWJlKGZ1bmN0aW9uICgpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgdXBkYXRlSWQpO1xuICAgIH0pO1xuICB9KTtcbn07XG4iXX0=
(1)
});
