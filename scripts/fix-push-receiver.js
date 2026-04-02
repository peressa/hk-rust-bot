const fs = require('fs');
const path = require('path');

const gcmIndexPath = path.join(process.cwd(), 'node_modules', '@liamcottle', 'push-receiver', 'src', 'gcm', 'index.js');
const parserPath = path.join(process.cwd(), 'node_modules', '@liamcottle', 'push-receiver', 'src', 'parser.js');

const localProtosPath = path.join(process.cwd(), 'src', 'lib', 'fcm', 'proto');

function patchFile(filePath, search, replacement) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(search)) {
      content = content.replace(search, replacement);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Patched: ${filePath}`);
    } else {
      console.log(`ℹ️ Already patched or search string not found: ${filePath}`);
    }
  } else {
    console.error(`❌ File not found: ${filePath}`);
  }
}

// Patch GCM Index for checkin.proto
patchFile(
  gcmIndexPath,
  "path.join(__dirname, 'checkin.proto')",
  `path.join(process.cwd(), 'src/lib/fcm/proto/checkin.proto')`
);

// Patch Parser for mcs.proto
patchFile(
  parserPath,
  "path.resolve(__dirname, 'mcs.proto')",
  `path.join(process.cwd(), 'src/lib/fcm/proto/mcs.proto')`
);

// Patch RustPlus for rustplus.proto
const rustplusPath = path.join(process.cwd(), 'node_modules', '@liamcottle', 'rustplus.js', 'rustplus.js');
patchFile(
  rustplusPath,
  'path.resolve(__dirname, "rustplus.proto")',
  `path.join(process.cwd(), 'src/lib/rustplus/proto/rustplus.proto')`
);
