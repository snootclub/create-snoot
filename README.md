# Create snoot
## the snoot maintenance module

This is the module used on the [snoot.club](https://snoot.club) server for creating and working with snoots. 

It's specific to the setup of that server and would need changes in order to be useful to anyone else, but the code is here should anyone ever want to look at it or reuse any of the code.

It would be nice to make the non-specific parts of it work without running in that environment, so one could have a local snoot setup, but that's not the focus right now.

## commands

### snoot create

create a new snoot.

this starts an interactive prompt that asks you some questions.

first it will celebrate that there is a new snoot:

```
oh, a new snoot? 💕
```

then it will ask for a `name`, and a `githubUsername`.

```
? what's their name?
? what's their github username?
```

it'll grab their authorized_keys file from `https://github.com/${githubUsername}.keys`

then it will let you edit their authorized_keys in your `$EDITOR` so you can add any
others you've been provided.

once it's gathered all that snoot data, it will create them a unix user with that `name`,
putting them in the groups `common` and `undercommon`. the `common` group owns some files
that every snoot needs to touch, and members of the `undercommon` group can only connect
_*directly*_ to `snoot.club` via `sftp`. these snoot can still log in to their own container
with `ssh`. the user's home directory will be `/snoots/${name}`, which is only used during
`sftp` connections. it's used by `sftp` as a `chroot` root for that snoot.

the tool will then create them a base application at `/www/snoot.club/snoots/${name}`. at
the moment this base application is defined in the [skeletons](https://github.com/snootclub/create-snoot/blob/40d842fa2d9c957014d85f815a3e8e601a6cd903/library/skeletons.js)
file. in brief, it has:

* `snoot.json` — some meta data about a snoot
* `nginx.conf` — an nginx configuration that defers mostly to blocks defined at [snootclub/nginx.conf](https://github.com/snootclub/nginx.conf)
* `docker-compose.yml` — a docker-compose file with a server-bound `/application` directory, forwarding for ssh and http, autorestarting & a start script. it uses the latest [snootclub/snoot docker image](https://hub.docker.com/r/snootclub/snoot) as defined at [snootclub/docker-image on github](https://github.com/snootclub/docker-image)
* `application/ecosystem.config.js` — a [pm2](https://pm2.io/doc/en/runtime/overview/) start script.
* `application/package.json` — an [npm package manifest](https://docs.npmjs.com/files/package.json) that uses [boop](https://github.com/snootclub/boop) for `build`, `watch` and `install` and [zeit's micro](https://github.com/zeit/micro) for `start`
* `application/index.js` — entry point that defers to [boop](https://github.com/snootclub/boop)
* `application/.start.sh` — a start script for the docker container
* `application/website/index.html` — a template html page that tells you how to access your new snoot

then it binds👀 the `website` directory into the snoot's sftp chroot root

and it boots👢👢 the snoot container

and then it restarts nginx, and updates the next snoot port file.

a few seconds later, the snoot has boot and is ready to toot

### snoot ls

list the names of all the snoot, separated by newlines.

### snoot enter <snoot>

enter a running snoot's container

### snoot start <snoot>

start a stopped snoot's container

### snoot stop <snoot>

stop a running snoot's container

### snoot each <command>

run a shell command in each snoot. the environment variable `SNOOT_NAME` will be available.
