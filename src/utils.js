
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