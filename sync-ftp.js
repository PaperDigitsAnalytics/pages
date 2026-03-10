const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');

// Configuration
const configPath = path.join(__dirname, 'ftp-config.json');
const manifestPath = path.join(__dirname, '.ftp-sync-manifest.json');

if (!fs.existsSync(configPath)) {
    console.error('❌ FTP config file not found!');
    console.error(`   Please create ${configPath} based on ftp-config.example.json`);
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const requiredFields = ['host', 'user', 'password', 'remotePath', 'localPath'];
for (const field of requiredFields) {
    if (!config[field]) {
        console.error(`❌ Missing required field in config: ${field}`);
        process.exit(1);
    }
}

const localPath = path.resolve(config.localPath);
if (!fs.existsSync(localPath)) {
    console.error(`❌ Local path does not exist: ${localPath}`);
    console.error('   Please run "npm run export" first to generate the static files.');
    process.exit(1);
}

const forceAll = process.argv.includes('--force');

// Load manifest (tracks what was last successfully uploaded)
function loadManifest() {
    if (forceAll) return {};
    try {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
        return {};
    }
}

function saveManifest(manifest) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

// Check if a local file has changed compared to the manifest
function hasChanged(manifest, relativePath, stats) {
    const entry = manifest[relativePath];
    if (!entry) return true;
    return entry.size !== stats.size || entry.mtime !== stats.mtimeMs;
}

// Collect all local files recursively
function collectLocalFiles(dir, baseDir = dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...collectLocalFiles(fullPath, baseDir));
        } else {
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
            results.push({ fullPath, relativePath, stats: fs.statSync(fullPath) });
        }
    }
    return results;
}

const client = new ftp.Client();

if (process.argv.includes('--verbose')) {
    client.ftp.verbose = true;
}

async function syncToFTP() {
    const manifest = loadManifest();
    const allFiles = collectLocalFiles(localPath);

    const toUpload = allFiles.filter(f => hasChanged(manifest, f.relativePath, f.stats));
    const skipped = allFiles.length - toUpload.length;

    console.log(`\n📋 ${allFiles.length} total files | ${toUpload.length} changed | ${skipped} unchanged (skipping)\n`);

    if (toUpload.length === 0) {
        console.log('✅ Nothing to upload — everything is up to date.');
        return;
    }

    console.log('🔌 Connecting to FTP server...');
    console.log(`   Host: ${config.host} | User: ${config.user} | Secure: ${config.secure ? 'FTPS' : 'FTP'}\n`);

    try {
        await client.access({
            host: config.host,
            user: config.user,
            password: config.password,
            secure: config.secure || false,
            port: config.port || 21
        });

        console.log('✅ Connected\n');

        let uploaded = 0;
        let errors = 0;
        const newManifest = { ...manifest };

        for (const file of toUpload) {
            const remotePath = path.posix.join(config.remotePath, file.relativePath);
            const remoteDir = path.posix.dirname(remotePath);

            try {
                await client.ensureDir(remoteDir);
                await client.uploadFrom(file.fullPath, remotePath);
                newManifest[file.relativePath] = {
                    size: file.stats.size,
                    mtime: file.stats.mtimeMs
                };
                uploaded++;
                const kb = (file.stats.size / 1024).toFixed(1);
                console.log(`   ✅ [${uploaded}/${toUpload.length}] ${file.relativePath} (${kb} KB)`);
            } catch (err) {
                errors++;
                console.error(`   ❌ Failed: ${file.relativePath} — ${err.message}`);
            }
        }

        saveManifest(newManifest);

        console.log('\n📊 Upload Summary:');
        console.log(`   ✅ Uploaded : ${uploaded} files`);
        console.log(`   ⏭️  Skipped  : ${skipped} files (unchanged)`);
        if (errors > 0) console.log(`   ❌ Errors   : ${errors} files`);
        console.log('\n✅ Sync completed!');

    } catch (error) {
        console.error('\n❌ FTP sync failed:', error.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

syncToFTP();
