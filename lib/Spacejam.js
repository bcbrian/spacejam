// Generated by CoffeeScript 1.8.0
(function() {
  var EventEmitter, Meteor, Phantomjs, Spacejam, XunitFilePipe, expect, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  require('./log');

  expect = require("chai").expect;

  _ = require("underscore");

  EventEmitter = require('events').EventEmitter;

  Meteor = require("./Meteor");

  Phantomjs = require("./Phantomjs");

  XunitFilePipe = require('./XunitFilePipe');

  Spacejam = (function(_super) {
    var instance;

    __extends(Spacejam, _super);

    instance = null;

    Spacejam.get = function() {
      return instance != null ? instance : instance = new Spacejam();
    };

    Spacejam.prototype.defaultOptions = function() {
      return {
        'phantomjs-script': 'phantomjs-test-in-console',
        'phantomjs-options': '--load-images=no --ssl-protocol=TLSv1'
      };
    };

    Spacejam.prototype.meteor = null;

    Spacejam.prototype.waitForMeteorMongodbKillDone = false;

    Spacejam.prototype.phantomjs = null;

    Spacejam.prototype.doneCode = null;

    Spacejam.prototype.childrenKilled = false;

    Spacejam.DONE = {
      TEST_SUCCESS: 0,
      TEST_FAILED: 2,
      METEOR_ERROR: 3,
      TEST_TIMEOUT: 4,
      ALREADY_RUNNING: 5,
      CLIENT_ERROR: 6
    };

    Spacejam.DONE_MESSAGE = ["All tests have passed", "Usage error", "Some tests have failed", "meteor is crashing server side", "Total timeout for tests has been reached", "spacejam is already running", "Unhandled error in meteor client side code"];

    function Spacejam() {
      this.onMeteorMongodbKillDone = __bind(this.onMeteorMongodbKillDone, this);
      log.debug("Spacejam.constructor()");
    }

    Spacejam.prototype.doTests = function(command, options) {
      var err;
      if (options == null) {
        options = {};
      }
      log.debug("Spacejam.testPackages()", options);
      expect(options).to.be.an("object");
      expect(command).to.be.a("string");
      if (options.timeout != null) {
        expect(options.timeout).to.be.a('number');
      }
      if (options['crash-spacejam-after'] != null) {
        expect(options['crash-spacejam-after']).to.be.a('number');
      }
      expect(this.meteor, "Meteor is already running").to.be["null"];
      this.options = _.extend(this.defaultOptions(), options);
      log.debug(this.options);
      try {
        this.meteor = new Meteor();
        this.phantomjs = new Phantomjs();
      } catch (_error) {
        err = _error;
        console.trace(err);
        this.emit("done", 1);
        return;
      }
      this.meteor.on("exit", (function(_this) {
        return function(code) {
          log.debug("Spacejam.meteor.on 'exit':", arguments);
          _this.meteor = null;
          if (code) {
            return _this.killChildren(Spacejam.DONE.METEOR_ERROR);
          }
        };
      })(this));
      this.meteor.on("mongodb ready", (function(_this) {
        return function() {
          log.info("spacejam: meteor mongodb is ready");
          _this.waitForMeteorMongodbKillDone = true;
          return _this.meteor.mongodb.on("kill-done", _this.onMeteorMongodbKillDone);
        };
      })(this));
      this.meteor.on("ready", (function(_this) {
        return function() {
          var pipeClass, scriptArgs, spawnOptions;
          log.info("spacejam: meteor is ready");
          scriptArgs = '';
          pipeClass = null;
          spawnOptions = {};
          return _this.runPhantom();
        };
      })(this));
      this.meteor.on("error", (function(_this) {
        return function() {
          log.error("spacejam: meteor has errors");
          if (!_this.options.watch) {
            return _this.killChildren(Spacejam.DONE.METEOR_ERROR);
          }
        };
      })(this));
      try {
        this.meteor.doTestCommand(command, this.options);
      } catch (_error) {
        err = _error;
        console.trace(err);
        this.emit("done", 1);
        return;
      }
      if ((this.options.timeout != null) && +this.options.timeout > 0) {
        setTimeout((function(_this) {
          return function() {
            log.error("spacejam: Error: tests timed out after " + options.timeout + " milliseconds.");
            return _this.killChildren(Spacejam.DONE.TEST_TIMEOUT);
          };
        })(this), +options.timeout);
      }
      if ((this.options['crash-spacejam-after'] != null) && +this.options['crash-spacejam-after'] > 0) {
        return setTimeout((function(_this) {
          return function() {
            throw new Error("Testing spacejam crashing.");
          };
        })(this), +options['crash-spacejam-after']);
      }
    };

    Spacejam.prototype.runPhantom = function() {
      var pipeClass, pipeClassOptions, url;
      log.debug("Spacejam.runPhantom()");
      expect(this.phantomjs).to.be.ok;
      expect(this.meteor.options["root-url"]).to.be.ok;
      expect(this.options["phantomjs-options"]).to.be.ok;
      expect(this.options["phantomjs-script"]).to.be.ok;
      url = this.meteor.options["root-url"];
      if (this.options['xunit-out'] != null) {
        url += 'xunit';
        pipeClass = XunitFilePipe;
        pipeClassOptions = {
          pipeToFile: this.options['xunit-out']
        };
      } else {
        url += 'local';
      }
      this.phantomjs.on("exit", (function(_this) {
        return function(code, signal) {
          var _ref;
          _this.phantomjs = null;
          if ((_ref = _this.meteor) != null) {
            _ref.kill();
          }
          if (code != null) {
            return _this.done(code);
          }
        };
      })(this));
      return this.phantomjs.run(url, this.options['phantomjs-options'], this.options['phantomjs-script'], pipeClass, pipeClassOptions, this.options['use-system-phantomjs'] != null);
    };

    Spacejam.prototype.onMeteorMongodbKillDone = function() {
      log.debug("Spacejam.onMeteorMongodbKillDone()", this.doneCode);
      return this.emit("done", this.doneCode);
    };

    Spacejam.prototype.killChildren = function(code) {
      var _ref, _ref1;
      if (code == null) {
        code = 1;
      }
      log.debug("Spacejam.killChildren()", arguments);
      expect(code, "Invalid exit code").to.be.a("number");
      if (!this.childrenKilled) {
        if ((_ref = this.meteor) != null) {
          _ref.kill();
        }
        if ((_ref1 = this.phantomjs) != null) {
          _ref1.kill();
        }
      }
      this.childrenKilled = true;
      return this.done(code);
    };

    Spacejam.prototype.done = function(code) {
      var _ref;
      log.debug("Spacejam.done()", arguments);
      expect(code, "Invalid done code").to.be.a("number");
      log.debug('Spacejam.done() @meteor?=' + (this.meteor != null));
      this.waitForMeteorMongodbKillDone = (_ref = this.meteor) != null ? _ref.hasMongodb() : void 0;
      log.debug('Spacejam.done() @waitForMeteorMongodbKillDone=' + this.waitForMeteorMongodbKillDone);
      if (!this.waitForMeteorMongodbKillDone) {
        this.emit("done", code);
      }
      log.debug('Spacejam.done() waiting for mongodb to exit before calling done');
      return this.doneCode = code;
    };

    return Spacejam;

  })(EventEmitter);

  module.exports = Spacejam;

}).call(this);
