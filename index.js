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
 * Attach various of event listeners to a given XHR request.
 *
 * @param {XHR} xhr A XHR request that requires listening.
 * @param {EventEmitter} ee EventEmitter that receives events.
 * @api public
 */
function loads(xhr, ee) {
  var onreadystatechange
    , onprogress
    , ontimeout
    , onabort
    , onerror
    , onload
    , timer;

  /**
   * Error listener.
   *
   * @param {Event} evt Triggered error event.
   * @api private
   */
  onerror = xhr.onerror = one(function onerror(evt) {
    var err = new Error('Network request failed');

    ee.emit('error', err);
    ee.emit('end', err);
  });

  /**
   * Fix for FireFox's odd abort handling behaviour. When you press ESC on an
   * active request it triggers `error` instead of abort. The same is called
   * when an HTTP request is canceled onunload.
   *
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=768596
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=880200
   * @see https://code.google.com/p/chromium/issues/detail?id=153570
   * @param {Event} evt Triggerd abort event
   * @api private
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
  ontimeout = xhr.ontimeout = one(function timeout(evt) {
    ee.emit('timeout', evt);

    //
    // Make sure that the request is aborted when there is a timeout. If this
    // doesn't trigger an error, the next call will.
    //
    if (xhr.abort) xhr.abort();
    onerror(evt);
  });

  //
  // Fallback for implementations that did not ship with timer support yet.
  // Microsoft's XDomainRequest was one of the first to ship with `.timeout`
  // support so we all XHR implementations before that require a polyfill.
  //
  // @see https://bugzilla.mozilla.org/show_bug.cgi?id=525816
  //
  if (xhr.timeout) timer = setTimeout(ontimeout, +xhr.timeout);

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
   * Handle load events an potential data events for when there was no streaming
   * data.
   *
   * @param {Event} evt Triggered load event.
   * @api private
   */
  onload = xhr.onload = one(function load(evt) {
    var status = codes[xhr.status] || xhr.status
      , data = response(xhr);

    if (status < 100 || status > 599) return onerror(evt);
    if (data) ee.emit('stream', data);

    ee.emit('end');
  });

  //
  // Properly clean up the previously assigned event listeners and timers to
  // prevent potential data leaks and unwanted `stream` events.
  //
  ee.once('end', function cleanup() {
    xhr.onreadystatechange = onreadystatechange =
    xhr.onprogress = onprogress =
    xhr.ontimeout = ontimeout =
    xhr.onerror = onerror =
    xhr.onabort = onabort =
    xhr.onload = onload = nope;

    if (timer) clearTimeout(timer);
  });

  return xhr;
}

//
// Expose all the things.
//
module.exports = loads;
