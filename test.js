describe('loads', function () {
  'use strict';

  var EventEmitter = require('events').EventEmitter
    , assume = require('assume')
    , loads = require('./')
    , ee;

  beforeEach(function () {
    ee = new EventEmitter();
  });

  afterEach(function () {
    ee.removeAllListeners();
  });
});
