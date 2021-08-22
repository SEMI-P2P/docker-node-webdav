# lunuy/node-webdav
WebDAV server made with [webdav-server](https://www.npmjs.com/package/webdav-server).

# Usage
docker-compose.yml
```yml
version: '3'
services:
  webdav:
    image: lunuy/node-webdav
    ports:
      - 80:80
    volumes:
      - ./config.yml:/app/config.yml
      - ./public:/app/public
```
## Configuration(config.yml)
### No auth
```yml
mounts:
  - ./:/

cors:
  - '*'
```

### One user(only admin)
```yml
mounts:
  - ./:/

privilege:
  admins:
    admin:
      password: password1

cors:
  - '*'
```

### Multi user
```yml
mounts:
  - music:/music
  - video:/video
  - files:/myfiles

privilege:
  default:
    directories:
      /music:
        - read
  admins:
    admin:
      password: password1
  users:
    musicwriter:
      password: password2
      directories:
        /music:
          - read
          - write
          - writeLocks
          - readLocks
    videowriter:
      password: password3
      directories:
        /video:
          - all
    filewriter:
      password: password4
      directories:
        /myfiles:
          - all
    mediareader:
      password: password5
      directories:
        /music:
          - read
        /video:
          - read

cors:
  - '*'
```

### CORS
If you don't want to use CORS, you may not set it. But you don't set CORS, you can't get profit of WEBDAV: accessible in browser. So I recommend you to use CORS except when you use WebDAV for only one purpose.