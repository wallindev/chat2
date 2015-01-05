'use strict';
/*
 * Globals
 *
 */
var DEVMODE		= true
, PRODMODE		= true; //!DEVMODE;

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
var DBSERVER	= process.env.OPENSHIFT_MONGODB_DB_HOST || "127.0.0.1"
, DBPORT		= process.env.OPENSHIFT_MONGODB_DB_PORT || 27017
, DBNAME		= 'nodejs'
, DBUSER		= 'chatUser'
, DBPASS		= 'chatPassword';
//, DBNAME		= 'nodejs'
//, DBUSER		= 'admin'
//, DBPASS		= 'dl5z_3yHUrgS';
//, DBNAME		= process.env.OPENSHIFT_MONGODB_DB_NAME || 'chat'
//, DBUSER		= process.env.OPENSHIFT_MONGODB_DB_USERNAME || 'chatUser'
//, DBPASS		= process.env.OPENSHIFT_MONGODB_DB_PASSWORD || "chatPassword";

/*
 * OpenShift Admin
 *
 */
/*
Username
--------
admin

Password
--------
dl5z_3yHUrgS

Version 2.4
db.addUser( { user: "admin", pwd: "dl5z_3yHUrgS", roles: [ "readWrite" ] } )
db.addUser( { user: "chatUser", pwd: "chatPassword", roles: [ "readWrite" ] } )
db.addUser( { user: "UserAdmin", pwd: "UserAdmin", roles: [ "userAdminAnyDatabase" ] } )

Version 2.6
db.createUser({ user: "UserAdmin", pwd: "UserAdmin", roles: [ { role: "userAdminAnyDatabase", db: "admin" } ] })

*/

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
	appTitle:		appTitle,
	publicDir:		publicDir,
	templateDir:	templateDir,
	routesDir:		routesDir,
	httpPort:		httpPort,
	ipAddress:		ipAddress,
	DBSERVER:		DBSERVER,
	DBPORT:			DBPORT,
	DBNAME:			DBNAME,
	DBUSER:			DBUSER,
	DBPASS:			DBPASS
}
