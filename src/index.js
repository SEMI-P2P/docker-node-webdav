const webdav = require('webdav-server').v2;
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { createManagers } = require('./utils');
const express = require('express');
const cors = require('cors');

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

    const app = express();
    app.use(webdav.extensions.express('/', server));

    // CORS
    if('cors' in config) {
        const origins = config['cors'];
        if(origins.includes('*')) {
            app.use(cors({ origin: '*' }));
        } else {
            app.use(cors({
                origin(origin, callback) {
                    callback(null, origins.includes(origin));
                }
            }));
        }
    }

    // Start server
    app.listen(80);
    console.log('Server started');
})();