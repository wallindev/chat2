'use strict';
// Dependency modules
var conf	= require('./config');

/*
 * Functions
 *
 */

// Send status messages to all sockets (connected clients)
var sendStatusAll = function(data) {
	sockets.emit('status', data);
}

// Send status messages to specific socket (connected client)
var sendStatus = function(data, s) {
	s.emit('status', data);
}

// Send status messages to all (connected clients) except for the one sending
var sendStatusOthers = function(data, s) {
	s.broadcast.emit('status', data);
}

var getTimestamp = function () {
	var dt = new Date();
	dt.setHours(dt.getHours()-24);
	var stamp = dt.getTime();
	return stamp;
}

var handleError = function(error, file, line, stack) {
	if (!stack)
		stack = error.stack;

	console.error(new Date() + ":\nError of type '" + error.name + "' in file '" + file + "' on line " + line + ":\n", error.message + "\n", "Stack:\n" + stack);
	//process.exit(1);
}

// Console.log in development mode
var devLog = function() {
	if (conf.DEVMODE) {
		if (arguments.length === 2)
			console.log(arguments[0], arguments[1]);
		else
			console.log(arguments[0]);
	}
}

// Console.log in production mode
var prodLog = function() {
	if (conf.PRODMODE) {
		if (arguments.length === 2)
			console.log(arguments[0], arguments[1]);
		else
			console.log(arguments[0]);
	}
}

module.exports = {
	sendStatusAll:		sendStatusAll,
	sendStatus:			sendStatus,
	sendStatusOthers:	sendStatusOthers,
	getTimestamp:		getTimestamp,
	handleError:		handleError,
	devLog:				devLog,
	prodLog:			prodLog
}
