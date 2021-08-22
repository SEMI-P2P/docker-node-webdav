
const webdav = require('webdav-server').v2;

function capitalizeFirstOne(str) {
    return str[0].toUpperCase() + str.slice(1);
}



module.exports.createManagers = privilege => {
    const userManager = new webdav.SimpleUserManager();
    const privilegeManager = new webdav.SimplePathPrivilegeManager();

    if(privilege.default) {
        userManager.getDefaultUser(user => {
            setUserRights(user, privilege.default.directories);
        });
    }

    for (const username in (privilege.admins ?? [])) {
        const { password } = privilege.admins[username];
        userManager.addUser(username, password, true);
    }

    for (const username in (privilege.users ?? [])) {
        const { password, directories } = privilege.users[username];
        const user = userManager.addUser(username, password, false);
        setUserRights(user, directories);
    }


    function setUserRights(user, directories) {
        for (const directoryPath in directories) {
            if (directories[directoryPath].includes('all')) {
                privilegeManager.setRights(user, directoryPath, ['all']);
            } else {
                const directoryPermissions = directories[directoryPath]
                    .map(str => 'can' + capitalizeFirstOne(str));
                privilegeManager.setRights(user, directoryPath, directoryPermissions);
            }
        }
    }

    return ({
        userManager,
        privilegeManager
    });
};

module.exports.createBeforeRequestHandler = cors => {
    if(cors.includes('*'))
        return createHandler(undefined, true)
    else
        return createHandler(origin => cors.includes(origin));
    
    function createHandler(isAllowed, isAny = false) {
        return (ctx, next) => {
            ctx.response.setHeader('DAV', '1,2');

            const origin = ctx.request.headers.origin;

            if(isAny) {
                ctx.response.setHeader('Access-Control-Allow-Origin', '*');
            } else if(isAllowed(origin)) {
                ctx.response.setHeader('Access-Control-Allow-Origin', origin);
            } else {
                ctx.response.removeHeader('Access-Control-Allow-Origin');
            }

            ctx.response.setHeader(
                'Access-Control-Allow-Headers',
                'Authorization, Depth, Content-Type',
            );
            ctx.response.setHeader(
                'Access-Control-Expose-Headers',
                'DAV, Content-Length, Allow, WWW-Authenticate',
            );

            ctx.response.setHeader(
                'Access-Control-Allow-Methods',
                'PROPPATCH,PROPFIND,OPTIONS,DELETE,UNLOCK,COPY,LOCK,MOVE,HEAD,POST,PUT,GET',
            );
            
            if (ctx.request.method === 'OPTIONS') {
                ctx.setCode(200);
                ctx.exit();
            } else {
                next();
            }
        };
    }
};