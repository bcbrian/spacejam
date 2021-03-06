// Generated by CoffeeScript 1.8.0
(function() {
  var CLI, ChildProcess, DEFAULT_PATH, Spacejam, chai, expect, fs, isCoffee, path, phantomjs, sinon, sinonChai;

  DEFAULT_PATH = process.env.PATH;

  fs = require('fs');

  path = require('path');

  phantomjs = require("phantomjs");

  chai = require("chai");

  expect = chai.expect;

  sinon = require("sinon");

  sinonChai = require("sinon-chai");

  chai.use(sinonChai);

  isCoffee = require('./isCoffee');

  if (isCoffee) {
    require('../../src/log');
    CLI = require('../../src/CLI');
    Spacejam = require('../../src/Spacejam');
    ChildProcess = require('../../src/ChildProcess');
  } else {
    require('../../lib/log');
    CLI = require('../../lib/CLI');
    Spacejam = require('../../lib/Spacejam');
    ChildProcess = require('../../lib/ChildProcess');
  }

  describe("CLI", function() {
    var cli, exitStub, phantomjsScript, processArgv, spacejam, spawnSpy, testPackagesStub;
    this.timeout(30000);
    processArgv = null;
    cli = null;
    spacejam = null;
    exitStub = null;
    testPackagesStub = null;
    spawnSpy = null;
    phantomjsScript = null;
    before(function() {
      return processArgv = process.argv;
    });
    after(function() {
      return process.argv = processArgv;
    });
    beforeEach(function() {
      process.chdir(__dirname + "/../apps/leaderboard");
      delete process.env.PORT;
      delete process.env.ROOT_URL;
      delete process.env.MONGO_URL;
      delete process.env.PACKAGE_DIRS;
      process.env.PATH = DEFAULT_PATH;
      process.argv = ['coffee', path.normalize(__dirname + "/../bin/spacejam")];
      cli = new CLI();
      spacejam = cli.spacejam;
      exitStub = sinon.stub(process, 'exit');
      testPackagesStub = sinon.stub(spacejam, 'doTests');
      return phantomjsScript = 'phantomjs-test-in-console.' + (isCoffee ? 'coffee' : 'js');
    });
    afterEach(function() {
      if (exitStub != null) {
        if (typeof exitStub.restore === "function") {
          exitStub.restore();
        }
      }
      exitStub = null;
      if (testPackagesStub != null) {
        if (typeof testPackagesStub.restore === "function") {
          testPackagesStub.restore();
        }
      }
      testPackagesStub = null;
      if (spawnSpy != null) {
        if (typeof spawnSpy.restore === "function") {
          spawnSpy.restore();
        }
      }
      spawnSpy = null;
      return spacejam = null;
    });
    it("should call Spacejam.doTests() test command and full-app mode with a empty array of packages", function() {
      process.argv.push("test", "--full-app");
      cli.exec();
      return expect(testPackagesStub).to.have.been.calledWith("test", {
        command: "test",
        "full-app": true,
        packages: []
      });
    });
    it("should call Spacejam.doTests() with an empty options.packages array, if no packages where provided on the command line", function() {
      process.argv.push("test-packages");
      cli.exec();
      return expect(testPackagesStub).to.have.been.calledWith("test-packages", {
        command: "test-packages",
        packages: []
      });
    });
    it("should call Spacejam.doTests() with options.packages set to the packages provided on the command line", function() {
      process.argv.push('test-packages', '--settings', 'settings.json', 'package1', 'package2');
      cli.exec();
      return expect(testPackagesStub).to.have.been.calledWith("test-packages", {
        command: "test-packages",
        settings: 'settings.json',
        packages: ['package1', 'package2']
      });
    });
    it("should spawn phantomjs with the value of --phantomjs-options", function(done) {
      log.setLevel('debug');
      testPackagesStub.restore();
      spawnSpy = sinon.spy(ChildProcess, '_spawn');
      process.chdir(__dirname + "/../apps/leaderboard/packages/success");
      process.argv.push('test-packages', '--port', '11096', '--mongo-url', 'mongodb://', '--phantomjs-options=--ignore-ssl-errors=true --load-images=false', './');
      cli.exec();
      return spacejam.on('done', (function(_this) {
        return function(code) {
          var err;
          try {
            if (code === 0) {
              done();
            } else {
              done("spacejam.done=" + code);
            }
            expect(spawnSpy).to.have.been.calledTwice;
            return expect(spawnSpy.secondCall.args[1]).to.deep.equal(['--ignore-ssl-errors=true', '--load-images=false', phantomjsScript]);
          } catch (_error) {
            err = _error;
            return done(err);
          }
        };
      })(this));
    });
    it("should modify PATH to include the path to the bundled phantomjs", function(done) {
      testPackagesStub.restore();
      process.chdir(__dirname + "/../apps/leaderboard/packages/success");
      process.argv.push('test-packages', '--port', '12096', '--mongo-url', 'mongodb://', '--phantomjs-options=--ignore-ssl-errors=true --load-images=false', './');
      cli.exec();
      return spacejam.on('done', (function(_this) {
        return function(code) {
          var err, firstPathEntry;
          try {
            if (code === 0) {
              done();
            } else {
              done("spacejam.done=" + code);
            }
            firstPathEntry = process.env.PATH.split(":")[0];
            return expect(firstPathEntry).to.equal(path.dirname(phantomjs.path));
          } catch (_error) {
            err = _error;
            return done(err);
          }
        };
      })(this));
    });
    return it("should not modify PATH if --use-system-phantomjs is given", function(done) {
      testPackagesStub.restore();
      process.chdir(__dirname + "/../apps/leaderboard/packages/success");
      process.argv.push('test-packages', '--port', '13096', '--mongo-url', 'mongodb://', '--use-system-phantomjs', '--phantomjs-options=--ignore-ssl-errors=true --load-images=false', './');
      console.log(process.argv.join(" "));
      cli.exec();
      return spacejam.on('done', (function(_this) {
        return function(code) {
          var err;
          try {
            if (code === 0) {
              done();
            } else {
              done("spacejam.done=" + code);
            }
            return expect(process.env.PATH).to.equal(DEFAULT_PATH);
          } catch (_error) {
            err = _error;
            return done(err);
          }
        };
      })(this));
    });
  });

}).call(this);
