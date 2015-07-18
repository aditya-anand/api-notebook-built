!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var n;"undefined"!=typeof window?n=window:"undefined"!=typeof global?n=global:"undefined"!=typeof self&&(n=self),n.gistPersistencePlugin=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/* global App */
var _             = App._;
var AUTH_URL      = 'https://github.com/login/oauth/authorize';
var TOKEN_URL     = 'https://github.com/login/oauth/access_token';
var plugin        = ({} || {}).github || {};
var CLIENT_ID     = plugin.clientId;
var CLIENT_SECRET = plugin.clientSecret;

// Detect if the plugin is not enabled.
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('GitHub plugin has not been configured. Please set the ' +
    '`clientId` and `clientSecret` in your config to use it.');
}

/**
 * OAuth2 authentication options object.
 *
 * @type {Object}
 */
var AUTH_OPTIONS = {
  scopes:              ['gist'],
  type:                'OAuth 2.0',
  clientId:            CLIENT_ID,
  clientSecret:        CLIENT_SECRET,
  accessTokenUri:      TOKEN_URL,
  authorizationUri:    AUTH_URL,
  authorizationGrants: 'code',
  modal: {
    title: 'Authenticate Notebook',
    content: [
      '<p>Notebooks are saved as gists to your GitHub account.</p>',
      '<p>',
      'Please authorize this application in order to ',
      'save, edit, and share your notebooks.',
      '</p>'
    ].join('\n'),
    btnText: 'Authorize With GitHub'
  }
};

/**
 * Check whether a gist contents are a valid notebook.
 *
 * @param  {Object}  content
 * @return {Boolean}
 */
var isNotebookContent = function (content) {
  return content && content.files && content.files['notebook.md'];
};

/**
 * Parse the link header for the specific links.
 *
 * @param  {String} header
 * @return {Object}
 */
var parseLinkHeader = function (header) {
  var obj = {};

  _.each(header.split(', '), function (part) {
    var matches = /^<([^>]+)>; *rel="([^"]+)"$/.exec(part);
    return matches && (obj[matches[2]] = matches[1]);
  });

  return obj;
};

/**
 * Generate a custom store for the Github OAuth2 response tokens.
 *
 * @type {Object}
 */
var oauth2Store = App.store.customStore('github');

/**
 * Make saves to the server less frequently. Handles multiple notebooks saving
 * concurrently.
 *
 * @type {Function}
 */
var debounceSave = (function (hash) {
  return function (data) {
    // Remove any previously queued save request for the same resource.
    if (hash[data.id]) {
      clearTimeout(hash[data.id]);
      delete hash[data.id];
    }

    hash[data.id] = setTimeout(function () {
      return data.shouldSave() && data.save();
    }, 600);
  };
})({});

/**
 * When a change occurs *and* we are already authenticated, we can automatically
 * save the update to a gist.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var changePlugin = function (data, next, done) {
  debounceSave(data);

  return done();
};

/**
 * Get the authenticated user id and title by making a request on the users
 * behalf.
 *
 * @param {Function} done
 */
var authenticatedUserId = function (done) {
  if (!oauth2Store.has('accessToken')) {
    return done(new Error('No access token'));
  }

  // Make a request to the check authorization url, which doesn't incur any
  // rate limiting penalties.
  App.middleware.trigger('ajax:basicAuth', {
    url: 'https://api.github.com/applications/' + CLIENT_ID + '/tokens/' +
      oauth2Store.get('accessToken'),
    proxy: false,
    basicAuth: {
      username: CLIENT_ID,
      password: CLIENT_SECRET
    }
  }, function (err, xhr) {
    var content;

    // Proxy any errors back to the user.
    if (err) { return done(err); }

    // Check if the connection was rejected because of invalid credentials.
    if (xhr.status === 404) {
      oauth2Store.clear();
      return done(new Error('Invalid credentials'));
    }

    try {
      content = JSON.parse(xhr.responseText);
    } catch (e) {
      return done(e);
    }

    return done(null, {
      userId:    content.user.id,
      userTitle: content.user.login
    });
  });
};

/**
 * Authenticate with the github oauth endpoint. Since we are unlikely to include
 * our client secret with the client code, you'll probably want to include the
 * proxy plugin (`./proxy.js`).
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var authenticatePlugin = function (data, next, done) {
  App.middleware.trigger('authenticate', AUTH_OPTIONS, function (err, auth) {
    if (err) { return next(err); }

    oauth2Store.set(auth);

    return authenticatedUserId(done);
  });
};

/**
 * Unauthenticate the user.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var unauthenticatePlugin = function (data, next, done) {
  oauth2Store.clear();

  return done();
};

/**
 * Check whether we are authenticated to Github.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var authenticatedPlugin = function (data, next, done) {
  return authenticatedUserId(done);
};

/**
 * Loads a single gist id from Github and checks whether it holds our notebook.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var loadPlugin = function (data, next, done) {
  if (!data.id) {
    return next();
  }

  App.middleware.trigger('ajax:oauth2', {
    // Add the application client id and secret to load requests to avoid rate
    // limiting in the case that the user is unauthenticated.
    url:    'https://api.github.com/gists/' + data.id + '?_=' + Date.now(),
    proxy:  false,
    method: 'GET',
    oauth2: oauth2Store.toJSON()
  }, function (err, xhr) {
    var content;

    try {
      content = JSON.parse(xhr.responseText);
    } catch (e) {
      return next(e);
    }

    if (!isNotebookContent(content)) {
      return next(new Error('Unexpected notebook response'));
    }

    data.id         = content.id;
    data.ownerId    = content.owner.id;
    data.ownerTitle = content.owner.login;
    data.content    = content.files['notebook.md'].content;
    data.updatedAt  = new Date(content.updated_at);
    return done();
  });
};

/**
 * Save the notebook into a single Github gist for persistence. If the user is
 * not yet authenticated, we'll attempt to do a smoother on boarding by showing
 * a help dialog.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var savePlugin = function (data, next, done) {
  if (!data.isAuthenticated()) {
    return data.authenticate(function (err) {
      if (err) { return next(err); }

      return done(), data.save();
    });
  }

  App.middleware.trigger('ajax:oauth2', {
    url:    'https://api.github.com/gists' + (data.id ? '/' + data.id : ''),
    proxy:  false,
    method: data.id ? 'PATCH' : 'POST',
    data: JSON.stringify({
      description: data.meta.title,
      files: {
        'notebook.md': {
          content: data.content
        }
      }
    }),
    oauth2: oauth2Store.toJSON()
  }, function (err, xhr) {
    if (err) { return next(err); }

    // The status does not equal a sucessful patch or creation.
    if (xhr.status !== 200 && xhr.status !== 201) {
      return next(new Error('Request failed'));
    }

    try {
      var content = JSON.parse(xhr.responseText);
      data.id         = content.id;
      data.ownerId    = content.owner.id;
      data.ownerTitle = content.owner.login;
    } catch (e) {
      return next(e);
    }

    return done();
  });
};

/**
 * Push all suitable gists into the list of notebooks.
 *
 * @param {Array}    list
 * @param {Function} next
 * @param {Function} done
 */
var listPlugin = function (list, next, done) {
  if (!oauth2Store.has('accessToken')) {
    return done(new Error('Listing notebooks requires authentication'));
  }

  (function recurse (link) {
    App.middleware.trigger('ajax:oauth2', {
      url:    link + (link.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now(),
      proxy:  false,
      method: 'GET',
      oauth2: oauth2Store.toJSON()
    }, function (err, xhr) {
      if (err) { return done(err); }

      var nextLink = parseLinkHeader(xhr.getResponseHeader('link') || '').next;
      var response;

      try {
        response = JSON.parse(xhr.responseText);
      } catch (e) {
        return next(e);
      }

      if (typeof response !== 'object') {
        return next(new Error('Unexpected response'));
      }

      _.each(response, function (content) {
        if (!isNotebookContent(content)) { return; }

        list.push({
          id: content.id,
          updatedAt: new Date(content.updated_at),
          meta: {
            title: content.description
          }
        });
      });

      // Proceed to the next link or return done.
      return nextLink ? recurse(nextLink) : done();
    });
  })('https://api.github.com/gists');
};

/**
 * Delete a single notebook from Github gists.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var removePlugin = function (data, next, done) {
  return App.middleware.trigger('ajax:oauth2', {
    url:    'https://api.github.com/gists/' + data.id,
    proxy:  false,
    method: 'DELETE',
    oauth2: oauth2Store.toJSON()
  }, done);
};

/**
 * Set the config option for the authentication text.
 */
App.config.set('authenticateText', 'Connect using Github');

/**
 * A { key: function } map of all middleware used in the plugin.
 *
 * @type {Object}
 */
module.exports = {
  'persistence:change':         changePlugin,
  'persistence:authenticate':   authenticatePlugin,
  'persistence:unauthenticate': unauthenticatePlugin,
  'persistence:authenticated':  authenticatedPlugin,
  'persistence:load':           loadPlugin,
  'persistence:save':           savePlugin,
  'persistence:list':           listPlugin,
  'persistence:remove':         removePlugin
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hYW5hbmQvSWRlYVByb2plY3RzL2FwaS1ub3RlYm9vay9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2FhbmFuZC9JZGVhUHJvamVjdHMvYXBpLW5vdGVib29rL3NyYy9zY3JpcHRzL3BsdWdpbnMvZ2lzdC1wZXJzaXN0ZW5jZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIGdsb2JhbCBBcHAgKi9cbnZhciBfICAgICAgICAgICAgID0gQXBwLl87XG52YXIgQVVUSF9VUkwgICAgICA9ICdodHRwczovL2dpdGh1Yi5jb20vbG9naW4vb2F1dGgvYXV0aG9yaXplJztcbnZhciBUT0tFTl9VUkwgICAgID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS9sb2dpbi9vYXV0aC9hY2Nlc3NfdG9rZW4nO1xudmFyIHBsdWdpbiAgICAgICAgPSAoe30gfHwge30pLmdpdGh1YiB8fCB7fTtcbnZhciBDTElFTlRfSUQgICAgID0gcGx1Z2luLmNsaWVudElkO1xudmFyIENMSUVOVF9TRUNSRVQgPSBwbHVnaW4uY2xpZW50U2VjcmV0O1xuXG4vLyBEZXRlY3QgaWYgdGhlIHBsdWdpbiBpcyBub3QgZW5hYmxlZC5cbmlmICghQ0xJRU5UX0lEIHx8ICFDTElFTlRfU0VDUkVUKSB7XG4gIGNvbnNvbGUud2FybignR2l0SHViIHBsdWdpbiBoYXMgbm90IGJlZW4gY29uZmlndXJlZC4gUGxlYXNlIHNldCB0aGUgJyArXG4gICAgJ2BjbGllbnRJZGAgYW5kIGBjbGllbnRTZWNyZXRgIGluIHlvdXIgY29uZmlnIHRvIHVzZSBpdC4nKTtcbn1cblxuLyoqXG4gKiBPQXV0aDIgYXV0aGVudGljYXRpb24gb3B0aW9ucyBvYmplY3QuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xudmFyIEFVVEhfT1BUSU9OUyA9IHtcbiAgc2NvcGVzOiAgICAgICAgICAgICAgWydnaXN0J10sXG4gIHR5cGU6ICAgICAgICAgICAgICAgICdPQXV0aCAyLjAnLFxuICBjbGllbnRJZDogICAgICAgICAgICBDTElFTlRfSUQsXG4gIGNsaWVudFNlY3JldDogICAgICAgIENMSUVOVF9TRUNSRVQsXG4gIGFjY2Vzc1Rva2VuVXJpOiAgICAgIFRPS0VOX1VSTCxcbiAgYXV0aG9yaXphdGlvblVyaTogICAgQVVUSF9VUkwsXG4gIGF1dGhvcml6YXRpb25HcmFudHM6ICdjb2RlJyxcbiAgbW9kYWw6IHtcbiAgICB0aXRsZTogJ0F1dGhlbnRpY2F0ZSBOb3RlYm9vaycsXG4gICAgY29udGVudDogW1xuICAgICAgJzxwPk5vdGVib29rcyBhcmUgc2F2ZWQgYXMgZ2lzdHMgdG8geW91ciBHaXRIdWIgYWNjb3VudC48L3A+JyxcbiAgICAgICc8cD4nLFxuICAgICAgJ1BsZWFzZSBhdXRob3JpemUgdGhpcyBhcHBsaWNhdGlvbiBpbiBvcmRlciB0byAnLFxuICAgICAgJ3NhdmUsIGVkaXQsIGFuZCBzaGFyZSB5b3VyIG5vdGVib29rcy4nLFxuICAgICAgJzwvcD4nXG4gICAgXS5qb2luKCdcXG4nKSxcbiAgICBidG5UZXh0OiAnQXV0aG9yaXplIFdpdGggR2l0SHViJ1xuICB9XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYSBnaXN0IGNvbnRlbnRzIGFyZSBhIHZhbGlkIG5vdGVib29rLlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gIGNvbnRlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbnZhciBpc05vdGVib29rQ29udGVudCA9IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gIHJldHVybiBjb250ZW50ICYmIGNvbnRlbnQuZmlsZXMgJiYgY29udGVudC5maWxlc1snbm90ZWJvb2subWQnXTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGxpbmsgaGVhZGVyIGZvciB0aGUgc3BlY2lmaWMgbGlua3MuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBoZWFkZXJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xudmFyIHBhcnNlTGlua0hlYWRlciA9IGZ1bmN0aW9uIChoZWFkZXIpIHtcbiAgdmFyIG9iaiA9IHt9O1xuXG4gIF8uZWFjaChoZWFkZXIuc3BsaXQoJywgJyksIGZ1bmN0aW9uIChwYXJ0KSB7XG4gICAgdmFyIG1hdGNoZXMgPSAvXjwoW14+XSspPjsgKnJlbD1cIihbXlwiXSspXCIkLy5leGVjKHBhcnQpO1xuICAgIHJldHVybiBtYXRjaGVzICYmIChvYmpbbWF0Y2hlc1syXV0gPSBtYXRjaGVzWzFdKTtcbiAgfSk7XG5cbiAgcmV0dXJuIG9iajtcbn07XG5cbi8qKlxuICogR2VuZXJhdGUgYSBjdXN0b20gc3RvcmUgZm9yIHRoZSBHaXRodWIgT0F1dGgyIHJlc3BvbnNlIHRva2Vucy5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG52YXIgb2F1dGgyU3RvcmUgPSBBcHAuc3RvcmUuY3VzdG9tU3RvcmUoJ2dpdGh1YicpO1xuXG4vKipcbiAqIE1ha2Ugc2F2ZXMgdG8gdGhlIHNlcnZlciBsZXNzIGZyZXF1ZW50bHkuIEhhbmRsZXMgbXVsdGlwbGUgbm90ZWJvb2tzIHNhdmluZ1xuICogY29uY3VycmVudGx5LlxuICpcbiAqIEB0eXBlIHtGdW5jdGlvbn1cbiAqL1xudmFyIGRlYm91bmNlU2F2ZSA9IChmdW5jdGlvbiAoaGFzaCkge1xuICByZXR1cm4gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAvLyBSZW1vdmUgYW55IHByZXZpb3VzbHkgcXVldWVkIHNhdmUgcmVxdWVzdCBmb3IgdGhlIHNhbWUgcmVzb3VyY2UuXG4gICAgaWYgKGhhc2hbZGF0YS5pZF0pIHtcbiAgICAgIGNsZWFyVGltZW91dChoYXNoW2RhdGEuaWRdKTtcbiAgICAgIGRlbGV0ZSBoYXNoW2RhdGEuaWRdO1xuICAgIH1cblxuICAgIGhhc2hbZGF0YS5pZF0gPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBkYXRhLnNob3VsZFNhdmUoKSAmJiBkYXRhLnNhdmUoKTtcbiAgICB9LCA2MDApO1xuICB9O1xufSkoe30pO1xuXG4vKipcbiAqIFdoZW4gYSBjaGFuZ2Ugb2NjdXJzICphbmQqIHdlIGFyZSBhbHJlYWR5IGF1dGhlbnRpY2F0ZWQsIHdlIGNhbiBhdXRvbWF0aWNhbGx5XG4gKiBzYXZlIHRoZSB1cGRhdGUgdG8gYSBnaXN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIGNoYW5nZVBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gIGRlYm91bmNlU2F2ZShkYXRhKTtcblxuICByZXR1cm4gZG9uZSgpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGF1dGhlbnRpY2F0ZWQgdXNlciBpZCBhbmQgdGl0bGUgYnkgbWFraW5nIGEgcmVxdWVzdCBvbiB0aGUgdXNlcnNcbiAqIGJlaGFsZi5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBhdXRoZW50aWNhdGVkVXNlcklkID0gZnVuY3Rpb24gKGRvbmUpIHtcbiAgaWYgKCFvYXV0aDJTdG9yZS5oYXMoJ2FjY2Vzc1Rva2VuJykpIHtcbiAgICByZXR1cm4gZG9uZShuZXcgRXJyb3IoJ05vIGFjY2VzcyB0b2tlbicpKTtcbiAgfVxuXG4gIC8vIE1ha2UgYSByZXF1ZXN0IHRvIHRoZSBjaGVjayBhdXRob3JpemF0aW9uIHVybCwgd2hpY2ggZG9lc24ndCBpbmN1ciBhbnlcbiAgLy8gcmF0ZSBsaW1pdGluZyBwZW5hbHRpZXMuXG4gIEFwcC5taWRkbGV3YXJlLnRyaWdnZXIoJ2FqYXg6YmFzaWNBdXRoJywge1xuICAgIHVybDogJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vYXBwbGljYXRpb25zLycgKyBDTElFTlRfSUQgKyAnL3Rva2Vucy8nICtcbiAgICAgIG9hdXRoMlN0b3JlLmdldCgnYWNjZXNzVG9rZW4nKSxcbiAgICBwcm94eTogZmFsc2UsXG4gICAgYmFzaWNBdXRoOiB7XG4gICAgICB1c2VybmFtZTogQ0xJRU5UX0lELFxuICAgICAgcGFzc3dvcmQ6IENMSUVOVF9TRUNSRVRcbiAgICB9XG4gIH0sIGZ1bmN0aW9uIChlcnIsIHhocikge1xuICAgIHZhciBjb250ZW50O1xuXG4gICAgLy8gUHJveHkgYW55IGVycm9ycyBiYWNrIHRvIHRoZSB1c2VyLlxuICAgIGlmIChlcnIpIHsgcmV0dXJuIGRvbmUoZXJyKTsgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIGNvbm5lY3Rpb24gd2FzIHJlamVjdGVkIGJlY2F1c2Ugb2YgaW52YWxpZCBjcmVkZW50aWFscy5cbiAgICBpZiAoeGhyLnN0YXR1cyA9PT0gNDA0KSB7XG4gICAgICBvYXV0aDJTdG9yZS5jbGVhcigpO1xuICAgICAgcmV0dXJuIGRvbmUobmV3IEVycm9yKCdJbnZhbGlkIGNyZWRlbnRpYWxzJykpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb250ZW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZG9uZShlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZG9uZShudWxsLCB7XG4gICAgICB1c2VySWQ6ICAgIGNvbnRlbnQudXNlci5pZCxcbiAgICAgIHVzZXJUaXRsZTogY29udGVudC51c2VyLmxvZ2luXG4gICAgfSk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBBdXRoZW50aWNhdGUgd2l0aCB0aGUgZ2l0aHViIG9hdXRoIGVuZHBvaW50LiBTaW5jZSB3ZSBhcmUgdW5saWtlbHkgdG8gaW5jbHVkZVxuICogb3VyIGNsaWVudCBzZWNyZXQgd2l0aCB0aGUgY2xpZW50IGNvZGUsIHlvdSdsbCBwcm9iYWJseSB3YW50IHRvIGluY2x1ZGUgdGhlXG4gKiBwcm94eSBwbHVnaW4gKGAuL3Byb3h5LmpzYCkuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgYXV0aGVudGljYXRlUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgQXBwLm1pZGRsZXdhcmUudHJpZ2dlcignYXV0aGVudGljYXRlJywgQVVUSF9PUFRJT05TLCBmdW5jdGlvbiAoZXJyLCBhdXRoKSB7XG4gICAgaWYgKGVycikgeyByZXR1cm4gbmV4dChlcnIpOyB9XG5cbiAgICBvYXV0aDJTdG9yZS5zZXQoYXV0aCk7XG5cbiAgICByZXR1cm4gYXV0aGVudGljYXRlZFVzZXJJZChkb25lKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFVuYXV0aGVudGljYXRlIHRoZSB1c2VyLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIHVuYXV0aGVudGljYXRlUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgb2F1dGgyU3RvcmUuY2xlYXIoKTtcblxuICByZXR1cm4gZG9uZSgpO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHdlIGFyZSBhdXRoZW50aWNhdGVkIHRvIEdpdGh1Yi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBhdXRoZW50aWNhdGVkUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgcmV0dXJuIGF1dGhlbnRpY2F0ZWRVc2VySWQoZG9uZSk7XG59O1xuXG4vKipcbiAqIExvYWRzIGEgc2luZ2xlIGdpc3QgaWQgZnJvbSBHaXRodWIgYW5kIGNoZWNrcyB3aGV0aGVyIGl0IGhvbGRzIG91ciBub3RlYm9vay5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBsb2FkUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgaWYgKCFkYXRhLmlkKSB7XG4gICAgcmV0dXJuIG5leHQoKTtcbiAgfVxuXG4gIEFwcC5taWRkbGV3YXJlLnRyaWdnZXIoJ2FqYXg6b2F1dGgyJywge1xuICAgIC8vIEFkZCB0aGUgYXBwbGljYXRpb24gY2xpZW50IGlkIGFuZCBzZWNyZXQgdG8gbG9hZCByZXF1ZXN0cyB0byBhdm9pZCByYXRlXG4gICAgLy8gbGltaXRpbmcgaW4gdGhlIGNhc2UgdGhhdCB0aGUgdXNlciBpcyB1bmF1dGhlbnRpY2F0ZWQuXG4gICAgdXJsOiAgICAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9naXN0cy8nICsgZGF0YS5pZCArICc/Xz0nICsgRGF0ZS5ub3coKSxcbiAgICBwcm94eTogIGZhbHNlLFxuICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgb2F1dGgyOiBvYXV0aDJTdG9yZS50b0pTT04oKVxuICB9LCBmdW5jdGlvbiAoZXJyLCB4aHIpIHtcbiAgICB2YXIgY29udGVudDtcblxuICAgIHRyeSB7XG4gICAgICBjb250ZW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gbmV4dChlKTtcbiAgICB9XG5cbiAgICBpZiAoIWlzTm90ZWJvb2tDb250ZW50KGNvbnRlbnQpKSB7XG4gICAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgbm90ZWJvb2sgcmVzcG9uc2UnKSk7XG4gICAgfVxuXG4gICAgZGF0YS5pZCAgICAgICAgID0gY29udGVudC5pZDtcbiAgICBkYXRhLm93bmVySWQgICAgPSBjb250ZW50Lm93bmVyLmlkO1xuICAgIGRhdGEub3duZXJUaXRsZSA9IGNvbnRlbnQub3duZXIubG9naW47XG4gICAgZGF0YS5jb250ZW50ICAgID0gY29udGVudC5maWxlc1snbm90ZWJvb2subWQnXS5jb250ZW50O1xuICAgIGRhdGEudXBkYXRlZEF0ICA9IG5ldyBEYXRlKGNvbnRlbnQudXBkYXRlZF9hdCk7XG4gICAgcmV0dXJuIGRvbmUoKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFNhdmUgdGhlIG5vdGVib29rIGludG8gYSBzaW5nbGUgR2l0aHViIGdpc3QgZm9yIHBlcnNpc3RlbmNlLiBJZiB0aGUgdXNlciBpc1xuICogbm90IHlldCBhdXRoZW50aWNhdGVkLCB3ZSdsbCBhdHRlbXB0IHRvIGRvIGEgc21vb3RoZXIgb24gYm9hcmRpbmcgYnkgc2hvd2luZ1xuICogYSBoZWxwIGRpYWxvZy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBzYXZlUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgaWYgKCFkYXRhLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgcmV0dXJuIGRhdGEuYXV0aGVudGljYXRlKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGlmIChlcnIpIHsgcmV0dXJuIG5leHQoZXJyKTsgfVxuXG4gICAgICByZXR1cm4gZG9uZSgpLCBkYXRhLnNhdmUoKTtcbiAgICB9KTtcbiAgfVxuXG4gIEFwcC5taWRkbGV3YXJlLnRyaWdnZXIoJ2FqYXg6b2F1dGgyJywge1xuICAgIHVybDogICAgJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMnICsgKGRhdGEuaWQgPyAnLycgKyBkYXRhLmlkIDogJycpLFxuICAgIHByb3h5OiAgZmFsc2UsXG4gICAgbWV0aG9kOiBkYXRhLmlkID8gJ1BBVENIJyA6ICdQT1NUJyxcbiAgICBkYXRhOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBkZXNjcmlwdGlvbjogZGF0YS5tZXRhLnRpdGxlLFxuICAgICAgZmlsZXM6IHtcbiAgICAgICAgJ25vdGVib29rLm1kJzoge1xuICAgICAgICAgIGNvbnRlbnQ6IGRhdGEuY29udGVudFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSksXG4gICAgb2F1dGgyOiBvYXV0aDJTdG9yZS50b0pTT04oKVxuICB9LCBmdW5jdGlvbiAoZXJyLCB4aHIpIHtcbiAgICBpZiAoZXJyKSB7IHJldHVybiBuZXh0KGVycik7IH1cblxuICAgIC8vIFRoZSBzdGF0dXMgZG9lcyBub3QgZXF1YWwgYSBzdWNlc3NmdWwgcGF0Y2ggb3IgY3JlYXRpb24uXG4gICAgaWYgKHhoci5zdGF0dXMgIT09IDIwMCAmJiB4aHIuc3RhdHVzICE9PSAyMDEpIHtcbiAgICAgIHJldHVybiBuZXh0KG5ldyBFcnJvcignUmVxdWVzdCBmYWlsZWQnKSk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHZhciBjb250ZW50ID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgIGRhdGEuaWQgICAgICAgICA9IGNvbnRlbnQuaWQ7XG4gICAgICBkYXRhLm93bmVySWQgICAgPSBjb250ZW50Lm93bmVyLmlkO1xuICAgICAgZGF0YS5vd25lclRpdGxlID0gY29udGVudC5vd25lci5sb2dpbjtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gbmV4dChlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZG9uZSgpO1xuICB9KTtcbn07XG5cbi8qKlxuICogUHVzaCBhbGwgc3VpdGFibGUgZ2lzdHMgaW50byB0aGUgbGlzdCBvZiBub3RlYm9va3MuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gICAgbGlzdFxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgbGlzdFBsdWdpbiA9IGZ1bmN0aW9uIChsaXN0LCBuZXh0LCBkb25lKSB7XG4gIGlmICghb2F1dGgyU3RvcmUuaGFzKCdhY2Nlc3NUb2tlbicpKSB7XG4gICAgcmV0dXJuIGRvbmUobmV3IEVycm9yKCdMaXN0aW5nIG5vdGVib29rcyByZXF1aXJlcyBhdXRoZW50aWNhdGlvbicpKTtcbiAgfVxuXG4gIChmdW5jdGlvbiByZWN1cnNlIChsaW5rKSB7XG4gICAgQXBwLm1pZGRsZXdhcmUudHJpZ2dlcignYWpheDpvYXV0aDInLCB7XG4gICAgICB1cmw6ICAgIGxpbmsgKyAobGluay5pbmRleE9mKCc/JykgPiAtMSA/ICcmJyA6ICc/JykgKyAnXz0nICsgRGF0ZS5ub3coKSxcbiAgICAgIHByb3h5OiAgZmFsc2UsXG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgb2F1dGgyOiBvYXV0aDJTdG9yZS50b0pTT04oKVxuICAgIH0sIGZ1bmN0aW9uIChlcnIsIHhocikge1xuICAgICAgaWYgKGVycikgeyByZXR1cm4gZG9uZShlcnIpOyB9XG5cbiAgICAgIHZhciBuZXh0TGluayA9IHBhcnNlTGlua0hlYWRlcih4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ2xpbmsnKSB8fCAnJykubmV4dDtcbiAgICAgIHZhciByZXNwb25zZTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gbmV4dChlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiByZXNwb25zZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIG5leHQobmV3IEVycm9yKCdVbmV4cGVjdGVkIHJlc3BvbnNlJykpO1xuICAgICAgfVxuXG4gICAgICBfLmVhY2gocmVzcG9uc2UsIGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgICAgIGlmICghaXNOb3RlYm9va0NvbnRlbnQoY29udGVudCkpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgbGlzdC5wdXNoKHtcbiAgICAgICAgICBpZDogY29udGVudC5pZCxcbiAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKGNvbnRlbnQudXBkYXRlZF9hdCksXG4gICAgICAgICAgbWV0YToge1xuICAgICAgICAgICAgdGl0bGU6IGNvbnRlbnQuZGVzY3JpcHRpb25cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFByb2NlZWQgdG8gdGhlIG5leHQgbGluayBvciByZXR1cm4gZG9uZS5cbiAgICAgIHJldHVybiBuZXh0TGluayA/IHJlY3Vyc2UobmV4dExpbmspIDogZG9uZSgpO1xuICAgIH0pO1xuICB9KSgnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9naXN0cycpO1xufTtcblxuLyoqXG4gKiBEZWxldGUgYSBzaW5nbGUgbm90ZWJvb2sgZnJvbSBHaXRodWIgZ2lzdHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgcmVtb3ZlUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgcmV0dXJuIEFwcC5taWRkbGV3YXJlLnRyaWdnZXIoJ2FqYXg6b2F1dGgyJywge1xuICAgIHVybDogICAgJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMvJyArIGRhdGEuaWQsXG4gICAgcHJveHk6ICBmYWxzZSxcbiAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgIG9hdXRoMjogb2F1dGgyU3RvcmUudG9KU09OKClcbiAgfSwgZG9uZSk7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29uZmlnIG9wdGlvbiBmb3IgdGhlIGF1dGhlbnRpY2F0aW9uIHRleHQuXG4gKi9cbkFwcC5jb25maWcuc2V0KCdhdXRoZW50aWNhdGVUZXh0JywgJ0Nvbm5lY3QgdXNpbmcgR2l0aHViJyk7XG5cbi8qKlxuICogQSB7IGtleTogZnVuY3Rpb24gfSBtYXAgb2YgYWxsIG1pZGRsZXdhcmUgdXNlZCBpbiB0aGUgcGx1Z2luLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAncGVyc2lzdGVuY2U6Y2hhbmdlJzogICAgICAgICBjaGFuZ2VQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTphdXRoZW50aWNhdGUnOiAgIGF1dGhlbnRpY2F0ZVBsdWdpbixcbiAgJ3BlcnNpc3RlbmNlOnVuYXV0aGVudGljYXRlJzogdW5hdXRoZW50aWNhdGVQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTphdXRoZW50aWNhdGVkJzogIGF1dGhlbnRpY2F0ZWRQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpsb2FkJzogICAgICAgICAgIGxvYWRQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpzYXZlJzogICAgICAgICAgIHNhdmVQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpsaXN0JzogICAgICAgICAgIGxpc3RQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpyZW1vdmUnOiAgICAgICAgIHJlbW92ZVBsdWdpblxufTtcbiJdfQ==
(1)
});
