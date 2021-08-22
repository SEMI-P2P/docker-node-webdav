const webdav = require('webdav-server').v2;
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { createManagers, createBeforeRequestHandler } = require('./utils');

const CONFIG_PATH = path.resolve(__dirname, '../config.yml');

if(!fs.existsSync(CONFIG_PATH))
    throw new Error(`config.yml not found`);

const config = yaml.load(fs.readFileSync(CONFIG_PATH));


(async () => {
    // Setup permissions
    const options = config.privilege ?
        (({userManager, privilegeManager}) => ({
            httpAuthentication: new webdav.HTTPDigestAuthentication(userManager, 'Default realm'),
            privilegeManager
        }))(createManagers(config.privilege))
        : {};

    // Setup server
    const server = new webdav.WebDAVServer(options);
    
    // Setup file systems
    await Promise.all(config.mounts.map(async mount => {
        const [physicalPath, virtualPath] = mount.split(':');
        const physicalFs = new webdav.PhysicalFileSystem(path.resolve(__dirname, '../public', physicalPath));
        await server.setFileSystemAsync(virtualPath, physicalFs);
    }));

    // CORS
    if('cors' in config) {
        server.beforeRequest(createBeforeRequestHandler(config.cors));
    }

    // Start server
    await server.startAsync(80);
    console.log('Server started');
})();