# chat2

New version of the Node.js Real-time Chat app (formerly 'nodejs-chat') with optimized ES6 Javascript and updated dependencies

Real-time chat application built with Node.js and Express.js with Socket.io and MongoDB with Mongoose. Uses less resources due to that new chat messages are only saved to database in bulk once a minute from memory. Client-side built with Angular.js, jQuery and Bootstrap.

## Installation

Download node at [nodejs.org](http://nodejs.org) and install it, if you haven't already.

```sh
git clone https://github.com/wallindev/chat2.git
cd chat2
npm install
npm start
```

## Dependencies

- [express](https://github.com/strongloop/express): Fast, unopinionated, minimalist web framework
- [hjs](https://github.com/nullfirm/hjs): Hogan.js NPM package for express 3.x
- [mongodb](https://github.com/mongodb/node-mongodb-native): A node.js driver for MongoDB
- [socket.io](https://github.com/Automattic/socket.io): node.js realtime framework server

## Dev Dependencies

- [bower](https://github.com/bower/bower): A package manager for the web

## License

ISC
