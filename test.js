describe('loads', function () {
  'use strict';

  var EventEmitter = require('events').EventEmitter
    , eventstub = require('eventstub')
    , assume = require('assume')
    , loads = require('./')
    , xhr
    , ee;

  beforeEach(function () {
    xhr = eventstub('error, readystatechange, timeout, progress, load');
    ee = new EventEmitter();
  });

  afterEach(function () {
    xhr.removeAllListeners();
    ee.removeAllListeners();
  });

  it('is exported as a function', function () {
    assume(loads).is.a('function');
  });

  it('returns the supplied xhr', function () {
    assume(loads(xhr, ee)).equals(xhr);
  });

  it('emits `end` _after_ when an error occures', function (next) {
    next = assume.plan(1, next);

    ee
    .on('end', next)
    .on('error', function (e) {
      assume(e).instanceOf(Error);
    });

    loads(xhr, ee).emit('error');
  });
});
