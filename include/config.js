'use strict';
/*
 * Globals
 *
 */
var DEVMODE		= false;
var PRODMODE	= !DEVMODE;
/*var VIEW_HTML		= true;*/

// App title
var appTitle	= "Wallindev's awesome Node.js Chat App!";

// Directories
var publicDir	= __dirname + '/../public'
, templateDir	= __dirname + '/../views'
, routesDir		= __dirname + '/../routes';

// OpenShift node.js port and IP address
var httpPort	= process.env.OPENSHIFT_NODEJS_PORT  || 8080
, ipAddress		= process.env.OPENSHIFT_NODEJS_IP  || "127.0.0.1";

// Database constants
var SERVER		= 'localhost'
, DBNAME		= 'chat'
, DBUSER		= 'chatUser'
, DBPASS		= 'chatUser';

// Stack property
Object.defineProperty(global, '__stack', {
	get: function(){
		var orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function(_, stack){ return stack; };
		var err = new Error;
		Error.captureStackTrace(err, arguments.callee);
		var stack = err.stack;
		Error.prepareStackTrace = orig;
		return stack;
	}
});

// Line property
Object.defineProperty(global, '__line', {
	get: function(){
		return __stack[1].getLineNumber();
	}
});

// File property
Object.defineProperty(global, '__file', {
	get: function(){
		return __stack[1].getFileName().split('/').slice(-1)[0];
	}
});

module.exports = {
	DEVMODE:		DEVMODE,
	PRODMODE:		PRODMODE,
	/*VIEW_HTML:		VIEW_HTML,*/
	appTitle:		appTitle,
	publicDir:		publicDir,
	templateDir:	templateDir,
	routesDir:		routesDir,
	httpPort:		httpPort,
	SERVER:			SERVER,
	DBNAME:			DBNAME,
	DBUSER:			DBUSER,
	DBPASS:			DBPASS
}
