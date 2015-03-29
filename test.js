describe('loads', function () {
  'use strict';

  var EventEmitter = require('events').EventEmitter
    , eventstub = require('eventstub')
    , assume = require('assume')
    , loads = require('./')
    , xhr
    , ee;

  beforeEach(function () {
    xhr = eventstub('error, readystatechange, timeout, progress, load, abort');
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
    next = assume.plan(2, next);

    ee
    .on('end', function (err) {
      assume(err).instanceOf(Error);
      next();
    })
    .on('error', function (e) {
      assume(e).instanceOf(Error);
    });

    loads(xhr, ee).emit('error');
  });

  it('emits an `error` before `end` when `load` has an incorrect status', function (next) {
    next = assume.plan(3, next);

    ee
    .on('end', function (err) {
      assume(err).instanceOf(Error);
      next();
    })
    .on('error', function (e) {
      assume(e).instanceOf(Error);
      assume(e.message).contains('request failed');
    });

    xhr.status = 6000;
    loads(xhr, ee).emit('load');
  });

  it('emits an error when the connection is abort', function (next) {
    ee
    .on('error', function (e) {
      assume(e).instanceOf(Error);
      assume(e.message).contains('request failed');
      next();
    });

    loads(xhr, ee).emit('abort');
  });
});
