# ACRL-ACC Broadcasting tools


[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://badges.mit-license.org)

Some broadcasting tools for ACC. Still heavily work in progress and you probably shouldn't even use them :D

---

## TODO

* Improve logic behind fastest laps to acknowledge multiclass races
* Configurable URL for grid order (now comes from ACRLonline)
* Use qualification results for grid order
* Fix the conditions panel
* Create "track intro" page, real track maps from somewhere and data from UDP API
* 
## Basic installation

- Create a config.js to app folder. Should look like this:

```js
const config = {
    'HTTP_PORT': 3000,
    'SOCKETIO_PORT': 3001,
    'ACC_IP_HOST': '127.0.0.1',
    'LISTENER_UDP': 9000,
    'ACC_UDP_PORT': 6667,
    'DISPLAY_NAME': '',
    'CONNECTION_PASSWORD': '',
    'COMMAND_PASSWORD': '',
}

```

### Dependencies

- Node.js v12+
- npm
- Assetto Corsa Competizione

### Setup

> update and install this package first

```shell
$ npm install

```

### Run

```shell
$ node index.js

```
## Collaborating

Shoot a pull request and I'll most likely merge it.

## License

[![License](http://img.shields.io/:license-mit-blue.svg?style=flat-square)](http://badges.mit-license.org)

- **[MIT license](http://opensource.org/licenses/mit-license.php)**
- Copyright 2020 © <a href="temeasd.github.io" target="_blank">TemeASD</a>.
