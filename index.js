'use strict';

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
module.exports = function loads(xhr, ee, streaming) {
  var offset = 0;

  function onreadystate(evt) {
    var target = evt.target
      , body = '';

    try { body = target.responseText; }
    catch (e) {}

    if (4 === target.readyState) {
      if (xhr.multipart) ee.emit('streaming', body);
      else if (!streaming) ee.emit('data', body);
    } else if (streaming && target.re)
  }

  function onprogress(evt) {

  }

  function onload(evt) {

  }

  xhr.onreadystatechange = onreadystate;
  xhr.onprogress = onprogress;
  xhr.onload = onload;
};
