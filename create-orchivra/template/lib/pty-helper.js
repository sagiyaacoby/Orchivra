'use strict';

const fs = require('fs');
const path = require('path');

// node-pty 1.1.0's macOS prebuilds can ship spawn-helper as 0644.
// Repair only known helper files in the installed package, never shell binaries.
function repairSpawnHelper(packageRoot, platform, arch) {
  if (platform !== 'darwin') return;
  const candidates = [
    'build/Release/spawn-helper',
    'build/Debug/spawn-helper',
    'prebuilds/darwin-' + arch + '/spawn-helper',
  ];
  for (const relative of candidates) {
    const helper = path.join(packageRoot, relative);
    let stat;
    try { stat = fs.lstatSync(helper); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (stat.isFile() && (stat.mode & 0o111) !== 0o111) {
      fs.chmodSync(helper, (stat.mode & 0o777) | 0o111);
    }
  }
}

module.exports = { repairSpawnHelper };
