!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.functionPropertyFilterPlugin=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var RETURN_PROP      = '!return';
var DESCRIPTION_PROP = '!description';

/**
 * Filters `@return` from showing up in the inspector view.
 *
 * @param {Object}   data
 * @param {Function} next
 */
exports['inspector:filter'] = function (data, next, done) {
  if (data.property === DESCRIPTION_PROP) {
    return done(null, false);
  }

  if (typeof data.parent === 'function' && data.property === RETURN_PROP) {
    return done(null, false);
  }

  return next();
};

/**
 * Augments the completion context to take into account the return property.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
exports['completion:function'] = function (data, next, done) {
  // Completes the using return property on functions, when available.
  if (RETURN_PROP in data.context) {
    return done(null, data.context[RETURN_PROP]);
  }

  return next();
};

/**
 * Provide a hook for completing descriptions from the description property.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
exports['completion:describe'] = function (data, next, done) {
  if (DESCRIPTION_PROP in data.context) {
    return done(null, data.context[DESCRIPTION_PROP]);
  }

  return next();
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hYW5hbmQvSWRlYVByb2plY3RzL2FwaS1ub3RlYm9vay9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2FhbmFuZC9JZGVhUHJvamVjdHMvYXBpLW5vdGVib29rL3NyYy9zY3JpcHRzL3BsdWdpbnMvZnVuY3Rpb24tcHJvcGVydHktZmlsdGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFJFVFVSTl9QUk9QICAgICAgPSAnIXJldHVybic7XG52YXIgREVTQ1JJUFRJT05fUFJPUCA9ICchZGVzY3JpcHRpb24nO1xuXG4vKipcbiAqIEZpbHRlcnMgYEByZXR1cm5gIGZyb20gc2hvd2luZyB1cCBpbiB0aGUgaW5zcGVjdG9yIHZpZXcuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICovXG5leHBvcnRzWydpbnNwZWN0b3I6ZmlsdGVyJ10gPSBmdW5jdGlvbiAoZGF0YSwgbmV4dCwgZG9uZSkge1xuICBpZiAoZGF0YS5wcm9wZXJ0eSA9PT0gREVTQ1JJUFRJT05fUFJPUCkge1xuICAgIHJldHVybiBkb25lKG51bGwsIGZhbHNlKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZGF0YS5wYXJlbnQgPT09ICdmdW5jdGlvbicgJiYgZGF0YS5wcm9wZXJ0eSA9PT0gUkVUVVJOX1BST1ApIHtcbiAgICByZXR1cm4gZG9uZShudWxsLCBmYWxzZSk7XG4gIH1cblxuICByZXR1cm4gbmV4dCgpO1xufTtcblxuLyoqXG4gKiBBdWdtZW50cyB0aGUgY29tcGxldGlvbiBjb250ZXh0IHRvIHRha2UgaW50byBhY2NvdW50IHRoZSByZXR1cm4gcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG5leHBvcnRzWydjb21wbGV0aW9uOmZ1bmN0aW9uJ10gPSBmdW5jdGlvbiAoZGF0YSwgbmV4dCwgZG9uZSkge1xuICAvLyBDb21wbGV0ZXMgdGhlIHVzaW5nIHJldHVybiBwcm9wZXJ0eSBvbiBmdW5jdGlvbnMsIHdoZW4gYXZhaWxhYmxlLlxuICBpZiAoUkVUVVJOX1BST1AgaW4gZGF0YS5jb250ZXh0KSB7XG4gICAgcmV0dXJuIGRvbmUobnVsbCwgZGF0YS5jb250ZXh0W1JFVFVSTl9QUk9QXSk7XG4gIH1cblxuICByZXR1cm4gbmV4dCgpO1xufTtcblxuLyoqXG4gKiBQcm92aWRlIGEgaG9vayBmb3IgY29tcGxldGluZyBkZXNjcmlwdGlvbnMgZnJvbSB0aGUgZGVzY3JpcHRpb24gcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG5leHBvcnRzWydjb21wbGV0aW9uOmRlc2NyaWJlJ10gPSBmdW5jdGlvbiAoZGF0YSwgbmV4dCwgZG9uZSkge1xuICBpZiAoREVTQ1JJUFRJT05fUFJPUCBpbiBkYXRhLmNvbnRleHQpIHtcbiAgICByZXR1cm4gZG9uZShudWxsLCBkYXRhLmNvbnRleHRbREVTQ1JJUFRJT05fUFJPUF0pO1xuICB9XG5cbiAgcmV0dXJuIG5leHQoKTtcbn07XG4iXX0=
(1)
});
