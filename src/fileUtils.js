const fs = require('fs');
const path = require('path');

function readConfig(configName) {
  // Fixed: use path.join instead of string concatenation
  // path.join produces the correct separator for each OS (/ on Linux/Mac, \ on Windows)
  const configPath = path.join(__dirname, 'configs', configName + '.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function getOutputPath(filename) {
  // Fixed: use path.join so this works on Windows and Unix-style systems
  return path.join(__dirname, 'output', filename);
}

function readTextFile(filepath) {
  return fs.readFileSync(filepath, 'utf8');
}

module.exports = { readConfig, getOutputPath, readTextFile };
