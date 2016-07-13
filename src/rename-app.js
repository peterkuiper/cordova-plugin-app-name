#!/usr/bin/env node

var fs = require('fs');
var path = require("path");
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var builder = new xml2js.Builder({
  xmldec: {
    version: '1.0',
    encoding: 'UTF-8'
  }
});

module.exports = function (context) {

  console.log('DEBUG', 'Attempting to set app name');

  var projectRoot = context.opts.projectRoot;
  var configPath = path.join(projectRoot, 'platforms', 'android', 'res', 'xml', 'config.xml');
  var stringsPath = path.join(projectRoot, 'platforms', 'android', 'res', 'values', 'strings.xml');
  var filePaths = [ configPath, stringsPath ];

  // Make sure the all files exist
  try {
    filePaths.forEach(function(filePath) {
      // Fallback for node 0.10 (Meteor still uses 0.10)
      if (typeof fs.accessSync === 'undefined') {
        if (!fs.existsSync(filePath)) {
          throw new Error('File ' +  filePath + ' does not exist');
        }
      } else {
        fs.accessSync(filePath, fs.F_OK);
      }
    });
  } catch(e) {
    console.log('DEBUG', e);
    return;
  }

  var name = getConfigParser(context, configPath).getPreference('AppName');

  if (name) {
    var stringsXml = fs.readFileSync(stringsPath, 'UTF-8');

    parser.parseString(stringsXml, function (err, data) {
      data.resources.string.forEach(function (string) {
        if (string.$.name === 'app_name') {
          console.log('DEBUG', 'Setting App Name: ', name);
          string._ = name;
        }
      });

      fs.writeFile(stringsPath, builder.buildObject(data));
    });
  }

};

function getConfigParser(context, config) {
  var semver = context.requireCordovaModule('semver');

  if (semver.lt(context.opts.cordova.version, '5.4.0')) {
    ConfigParser = context.requireCordovaModule('cordova-lib/src/ConfigParser/ConfigParser');
  } else {
    ConfigParser = context.requireCordovaModule('cordova-common/src/ConfigParser/ConfigParser');
  }

  return new ConfigParser(config);
}
