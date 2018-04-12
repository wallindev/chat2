'use strict';
/*
 * "Namespace" chatApp
 *
 */
const chatApp = (() => {
  // Includes
  const conf  = require('../include/config')
  , func      = require('../include/functions')
  , colors    = require('../include/colors')
  , routes    = require(conf.routesDir);

  // Dependency modules
  const express = require('express')
  , util      = require('util')
  , app       = express()
  , server    = app.listen(conf.httpPort, conf.ipAddress)
  , sockets   = require('socket.io').listen(server).sockets
  , mongo     = require('mongodb').MongoClient
  , sync      = require('synchronize') // To get rid of callbacks (still non-blocking for code outside fibers)
  , fiber     = sync.fiber
  , await     = sync.await
  , defer     = sync.defer;

  // Database and collection objects
  let db      = {}
  , coll        = {}
  , dbConnState = '';

  // Messages and users arrays
  let messages  = []
  , newMessages = []
  , users     = [];

  /*
   * App configuration
   *
   */
  // To avoid conflict with Angular.js
  app.locals.delimiters = '{{{ }}}';

  // Views directory / View engine (Hogan.js)
  app.set('views', conf.templateDir);
  app.set('view engine', 'hjs');

  // Routes
  app.use('/', routes.routeRender(conf.appTitle));

  // Static content
  app.use(express.static(conf.publicDir));

  func.prodLog('Web server started. Listening on port ' + conf.httpPort);

  /*
   * Core database functionality
   *
   */
  // With --noauth
  const connString = 'mongodb://' + conf.DBSERVER + '/' + conf.DBNAME;
  // With --auth
  // const connString = 'mongodb://' + conf.DBUSER + ':' + conf.DBPASS + '@' + conf.DBSERVER + '/' + conf.DBNAME;
  func.devLog("connString: %s", connString);

  // Log time
  console.time('start');

  // Connect to and open db
  mongo.connect(connString)
    .then(db => {
      func.prodLog("Connection to '" + conf.DBNAME + "' on '" + conf.DBSERVER + "' opened.");

      // Database collection
      coll = db.collection('messages');

      // Retrieve 100 last messages, omit _id field
      coll.find({}, {_id: 0}).limit(100).sort({created: -1}).toArray()
        .then(messages => func.devLog("Messages retrieved (on start): %s", JSON.stringify(messages)))
        .catch(err => func.handleError(err)); // func.handleError(err, __file, __line, __stack);

      // Run the "save loop" every minute:
      setInterval(() => {
        if (newMessages.length) {
          console.time('save loop');

          // Insert the new documents
          coll.insert(newMessages)
            .then(messagesInserted => {
              func.prodLog('Messages saved to database');
              func.devLog("Messages inserted: %s", JSON.stringify(messagesInserted));

              // Empty newMessages array
              newMessages = [];

              console.timeEnd('save loop');
            })
            .catch(err => func.handleError(err)); //func.handleError(err, __file, __line);
        }
      }, 60000);

      // Fires when there's a http connection to the server
      sockets.on('connection', socket => {
        func.prodLog('Client connected to chat');

        // Since db connections are done synchronously, there may be a connection to the web server before
        // the db object is propagated (i.e. when the server is restarted)
        // We then tell the user to please reload the browser
        /*dbConnState = db.s.topology.s.server.s.pool.state;
        if (dbConnState !== 'connected') {*/
        if (!db.serverConfig.isConnected()) {
          func.sendStatus({
            message:  'Database temporarily unavailable, please reload your browser',
            type:     'primary',
            which:    'status',
            clear:    false,
            restore:  false
          }, socket);
          return 1;
        }

        // Welcome user
        const welcomeMsg = 'Welcome to the chat! =)';
        func.sendStatus({
          message:  welcomeMsg,
          type:     'primary',
          which:    'status',
          clear:    false
        }, socket);

        // Start time logging
        console.time('client connection');

        // Retrieve 100 last messages, omit _id field
        coll.find({}, {_id: 0}).limit(100).sort({created: -1}).toArray()
          .then(messages => {
            func.prodLog('Messages retrieved from database');
            func.devLog("Messages retrieved (on client connection): %s", JSON.stringify(messages));

            // If there are new messages that are not yet saved to db, we have to include them here
            //func.devLog("new messages: %s", newMessages);
            //func.devLog("old messages: %s", messages);
            let allMessages = [];
            if (newMessages.length) {
              allMessages = newMessages.concat(messages);
            } else {
              allMessages = messages;
            }
            //func.devLog("all messages: %s", messages);

            // Send messages array to client
            socket.emit('listMessages', allMessages);

            // Get rid of temp allMessages array
            allMessages = null;
            //delete allMessages; // Can't delete defined variable (with 'var')

            // Send users array to client
            socket.emit('listUsers', users);

            // End time logging
            console.timeEnd('client connection');
          })
          .catch(err => func.handleError(err)); //func.handleError(err, __file, __line);

        // Check if nickname is taken
        socket.on('checkNick', nickName => {
          // If user array is empty, cleared is true
          // If not, iterate through and search for duplicates
          // If no duplicates found, cleared is true
          // Unshift puts user as first object in array instead of last
          let cleared = true;
          if (users.length === 0) {
            cleared = true;
          } else {
            for (let i = 0; i < users.length; i++) {
              if (users[i].name === nickName) {
                cleared = false;
                break;
              }
            }
          }

          socket.emit('checkNick', cleared);
        });

        // Listen for insert emission from client
        socket.on('insert', message => {
          // Add date on server instead of client
          // in the form of a timestamp
          message.created = (new Date()).getTime();

          // Checking for empty values and regex pattern matching
          const regex1  = /^\s*$/
          , regex2      = /^[a-öA-Ö0-9_-]{3,}$/; // Letters a-ö, A-Ö, numbers 0-9, special characters _ and -, and atleast 3 of them
          let msg       = '';
          if (regex1.test(message.name) || regex1.test(message.message)) {
            msg = 'Name or message can\'t be empty.';
            console.error(msg);
            func.sendStatus({
              message:  msg,
              type:   'danger',
              which:    'status',
              clear:    false
            }, socket);
            return 1;
          } else if (!regex2.test(message.name)) {
            msg = 'Name must be at least three characters long and contain valid characters.';
            console.error(msg);
            func.sendStatus({
              message:  msg,
              type:   'danger',
              which:    'status',
              clear:    false
            }, socket);
            return 1;
          } else {
            // Insert to messages array and send to client
            newMessages.unshift(message);
            func.devLog("Inserted message: %s", JSON.stringify(message));

            // Send message to all clients
            sockets.emit('listMessages', [message]);

            func.sendStatus({
              message:  'Message sent',
              type:   'success',
              which:    'status',
              clear:    true
            }, socket);

            const user = {
              id: socket.id,
              name: message.name,
              created: (new Date()).getTime() // Timestamp
            };

            // If user array is empty, insert user object
            // If not iterate through and search for duplicates
            // If no duplicates found, insert user object
            // Unshift puts user as first object in array instead of last
            let userExists = false;
            if (users.length === 0) {
              userExists = false;
            } else {
              for (let i = 0; i < users.length; i++) {
                if (users[i].name === user.name) {
                  userExists = true;
                  break;
                }
              }
            }

            if(!userExists) {
              users.unshift(user);

              // Send status message to everyone else
              func.sendStatusOthers({
                message:  '<em>' + user.name + '</em> has joined the chat',
                type:   'primary',
                which:    'status',
                clear:    false
              }, socket);
            }

            // Add user on all clients user lists
            sockets.emit('listUsers', [user]);
          }
        });

        socket.on('removeUser', nickName => {
          for (let i = 0; i < users.length; i++) {
            if (users[i].name === nickName) {
              users.splice(i, 1);
              // Remove user from clients user lists
              sockets.emit('removeUser', nickName);
              break;
            }
          }
        });

        // Listen for client disconnect
        socket.on('disconnect', () => {
          // Remove user from user array
          let nickName = '';
          if (users.length > 0) {
            nickName = '';

            for (let i = 0; i < users.length; i++) {
              if (users[i].id === socket.id) {
                nickName = users[i].name;
                users.splice(i, 1);
                break;
              }
            }

            // If user has sent messages and thus is registrered with name
            if (nickName !== '') {
              // Remove user from clients user lists
              sockets.emit('removeUser', nickName);

              // Send status message to everyone else
              func.sendStatusOthers({
                message:  '<em>' + nickName + '</em> has left the chat',
                type:   'info',
                which:    'status',
                clear:    false
              }, socket);
            }
          }
        });
      });

      db.on('close', () => func.devLog('Connection closed unexpectedly'));

      // TODO: Force close? db.close(true)
      /*db.close().then((err, res) => {
        if (err) throw new Error(err);
      });*/

      // End time logging
      console.timeEnd('start');
    })
    .catch(err => func.handleError(err)); // func.handleError(err, __file, __line, __stack);
})();
