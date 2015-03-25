'use strict';

var response = require('xhr-response')
  , one = require('one-time');

/**
 * Simple nope function that assigned to XHR requests as part of a clean-up
 * operation.
 *
 * @api private
 */
function nope() {}

/**
 * Status codes that might need to be mapped to something more sane.
 *
 * @type {Object}
 * @private
 */
var codes = {
  //
  // If you make a request with a file:// protocol it returns status code 0 by
  // default so we're going to assume 200 instead.
  //
  0: 200,

  //
  // Older version IE incorrectly return status code 1233 for requests that
  // respond with a 204 header.
  //
  // @see http://stackoverflow.com/q/10046972
  //
  1233: 204
};

/**
 *
 * @param {XHR} xhr A XHR request that requires listening.
 * @param {EventEmitter} ee EventEmitter that receives events.
 * @param {Boolean} streaming Are we streaming data.
 * @api public
 */
function loads(xhr, ee, streaming) {
  var onreadystatechange
    , onprogress
    , ontimeout
    , onabort
    , onerror
    , onload;

  /**
   * Error listener.
   *
   * @param {Event} evt Triggered readyState change event.
   * @api private
   */
  onerror = xhr.onerror = one(function onerror(evt) {
    ee.emit('error', new Error('Network request failed'));
    ee.emit('end');
  });

  /**
   * Fix for FireFox's odd abort handling behaviour. When you press ESC on an
   * active request it triggers `error` instead of abort. The same is called
   * when an HTTP request is canceled onunload.
   *
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=768596
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=880200
   * @see https://code.google.com/p/chromium/issues/detail?id=153570
   */
  onabort = xhr.onabort = function onabort(evt) {
    onerror(evt);
  };

  /**
   * ReadyStateChange listener.
   *
   * @param {Event} evt Triggered readyState change event.
   * @api private
   */
  onreadystatechange = xhr.onreadystatechange = function change(evt) {
    var target = evt.target;

    if (4 === target.readyState) return onload(evt);
  };

  /**
   * The connection has timed out.
   *
   * @api private
   */
  ontimeout = xhr.ontimeout = function timeout(evt) {
    ee.emit('timeout', evt);
  };

  /**
   * IE needs have it's `onprogress` function assigned to a unique function. So,
   * no touchy touchy here!
   *
   * @param {Event} evt Triggered progress event.
   * @api private
   */
  onprogress = xhr.onprogress = function progress(evt) {
    var status = codes[xhr.status] || xhr.status
      , data;

    ee.emit('progress', evt, status);

    if (xhr.readyState >= 3 && status === 200 && (data = response(xhr))) {
      ee.emit('stream', data);
    }
  };

  /**
   *
   * @param {Event} evt Triggered progress event.
   * @api private
   */
  onload = xhr.onload = one(function load(evt) {
    var status = codes[xhr.status] || xhr.status
      , data = response(xhr);

    if (status < 100 || status > 599) return onerror(evt);
    if (data) ee.emit('stream', data);

    ee.emit('end');
  });
}

//
// Expose all the things.
//
module.exports = loads;
