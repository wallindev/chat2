'use strict';
/*
 * "Namespace" chatApp
 *
 */
var chatApp = angular.module('chatApp', [/*'ngSanitize'*/])
// Variables factory
.factory('global', function() {
	return {
		// Constants
		VIEW_HTML		: true,
		STATUS			: 'Avvaktar',
		// DOM objects
		$messages		: $('#chat-messages'),
		$textarea		: $('#chat-textarea'),
		$chatName		: $('#chat-name'),
		$chatNameMsg	: $('#chat-name-msg'),
		$chatStatus		: $('#chat-status'),
		$chatStatusText	: $('#chat-status-text'),
		$chatUsers		: $('#chat-users')
	};
// Functions factory
}).factory('func', function(global) {
	return {
		// App initialization
		init: function () {
			// Restore all elements
			global.$chatStatusText.removeClass().addClass('text-warning');
			global.$textarea.val('');
			global.$textarea.attr('disabled', true);
			global.$chatName.val('');
			global.$chatName.focus();
		},
		// To prevent users from emitting "dangerous" code to the server
		htmlspecialchars: function(str) {
			/*
			 * - Replace '&' with '&amp;'
			 * - Replace '"' with '&quot;'
			 * - Replace ''' with '&#039;'
			 * - Replace '<' with '&lt;'
			 * - Replace '>' with '&gt;'
			 */
			return str.replace(/&/gim, '&amp;').replace(/"/gim, '&quot;').replace(/'/gim, '&#039;').replace(/</gim, '&lt;').replace(/>/gim, '&gt;');
		},
		// Sets status text at bottom or beside nick
		setStatus: function(msg, type, which, clear, restore) {
			var self = this;
			if (msg === undefined) {
				console.error("msg can't be empty");
				return 1;
			}
			if (type === undefined) type = 'info';
			if (which === undefined) which = 'status';
			if (clear === undefined) clear = false;
			if (restore === undefined) restore = true;

			if (which === 'nick') {
				global.$chatNameMsg.removeClass().addClass('text-' + type);
				global.$chatNameMsg.html(msg);
			} else {
				global.$chatStatusText.removeClass().addClass('text-' + type);
				global.$chatStatusText.html(msg);

				// Reset status message after 5 seconds
				if (restore) {
					if (msg !== global.STATUS) {
						setTimeout(function() {
							self.setStatus(global.STATUS, 'warning');
						}, 5000);
					}
				}
			}
			if (clear)
				global.$textarea.val('');
		}
	};
// Socket factory
}).factory('socket', function() {
	var fullUrl = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
	console.log(fullUrl);
	var socketProtocol = 'ws:'
	, socketHost = location.hostname
	, socketPort = 8000
	, socketUrl = socketProtocol + '//' + socketHost + ':' + socketPort;
	console.log(socketUrl);
	var socket;
	try {
		socket = io.connect(fullUrl);
	} catch (e) {
		console.error('Error: ', e.message);
	}

	if (socket === undefined) {
		console.error('Error: ', e.message);
		return 1;
	}	
	return socket;
// Custom exception handling
}).factory('$exceptionHandler', function() {
	return function(exception) {
		throw exception;
	};
// Custom filter (to allow HTML generation in bindings)
}).filter('html', function($sce) {
	return function(val) {
		return $sce.trustAsHtml(val);
	};
// Main controller
}).controller('ChatCtrl', function(global, func, socket, $scope, $exceptionHandler, $sce) {
	// Messages and users arrays, nick placeholder
	$scope.messages		= []
	, $scope.users		= []
	, $scope.nick		= '';

	// Restore all elements
	func.init();

	// Listen for listMessages emission from server
	socket.on('listMessages', function(messages) {
		// Display messages
		if (messages.length) {
			if (messages.length === 1) {
				// Add message first in messages array
				$scope.messages.unshift(messages[0]);
			} else {
				$scope.messages = messages;
			}

			// Must use this to allow for HTML in chat message
			// Or use custom filter!
			/*for (var i = 0; i < $scope.messages.length; i++) {
				$scope.messages[i].message = $sce.trustAsHtml($scope.messages[i].message);
			}*/

			try {
				$scope.$digest();
			} catch(e) {
				func.setStatus(e, 'danger');
				return 1;
			}
		}
	});

	// Listen for listUsers emission from server
	socket.on('listUsers', function(users) {
		// Display users
		if (users.length) {
			if (users.length === 1) {
				// Add user first in users array (if not already there)
				var userExists = false;
				if ($scope.users.length === 0) {
					userExists = false;
				} else {
					for (var i = 0; i < $scope.users.length; i++) {
						if ($scope.users[i].name === users[0].name) {
							userExists = true;
							break;
						}
					}
				}
				if (!userExists)
					$scope.users.unshift(users[0]);
			} else {
				$scope.users = users;
			}

			try {
				$scope.$digest();
			} catch(e) {
				func.setStatus(e, 'danger');
				return 1;
			}
		}
	});

	// Listen for removeUser emission from server
	socket.on('removeUser', function(nickName) {
		// Remove user from user array
		for (var i = 0; i < $scope.users.length; i++) {
			if ($scope.users[i].name === nickName) {
				$scope.users.splice(i, 1);
				$scope.$digest();
				break;
			}
		}
	});

	// Listen for status emission from server
	socket.on('status', function(data) {
		func.setStatus(data.message, data.type, data.which, data.clear, data.restore);
	});

	// Check nickname
	global.$chatName.on("keyup", function(e) {
		var nick	= $(this).val()
		, regex		= /^[a-öA-Ö0-9_-]{3,}$/;
		// Only do the check if value is different from saved nickname
		if (nick === $scope.nick) {
			func.setStatus('', 'warning', 'nick');
		} else {
			if (nick.length === 0) {
				func.setStatus('', 'warning', 'nick');
			} else {
				if (!regex.test(nick)) {
					func.setStatus('Ogiltigt namn', 'danger', 'nick');
				} else {
					socket.emit('checkNick', nick);
					// Reset info text
					func.setStatus('', 'warning', 'nick');
				}
			}
		}
		// Prevent default events
		e.preventDefault();
	});

	socket.on('checkNick', function(cleared) {
		if (!cleared) {
			func.setStatus('Namn upptaget', 'danger', 'nick');
			global.$textarea.attr('disabled', true);
		} else {
			func.setStatus('Namn OK', 'success', 'nick');
			global.$textarea.attr('disabled', false);
		}
	});

	// Listen for keydowns on textarea
	global.$textarea.on("keydown", function(e) {
		var nick	= global.$chatName.val()
		, msg		= $(this).val()
		, regex		= /^\s*$/;
		if (e.which === 13 && e.shiftKey === false) {
			if (regex.test(msg)) {
				func.setStatus('Meddelande kan inte vara tomt', 'danger', 'status');
			} else {
				// Store user nickname if not already stored
				if ($scope.nick === '') {
					$scope.nick = nick;
				} else {
					// If nick is stored, and it's been changed during same session
					// we have to remove old nick and replace with new
					if ($scope.nick !== nick) {
						socket.emit('removeUser', $scope.nick);
						$scope.nick = nick;
					}
				}

				// TODO: HTML or no HTML?
				socket.emit('insert', {
					name: $scope.nick,
					//message: msg
					message: (!global.VIEW_HTML) ? func.htmlspecialchars(msg) : msg
				});

				// Prevent default events
				e.preventDefault();
			}
		}
	});

	// Clear name status when name field loses focus
	global.$chatName.on("blur", function() {
		func.setStatus('', 'warning', 'nick');
	});
});
