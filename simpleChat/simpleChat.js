/**
 * Really simple example of a chat class that allows client side Javascript to interact
 * with a keevio chat system
 */

/**
 * Creates a new SimpleChat singleton and initialises it with the user info
 * that it will use to authenticate against the PBX. Plants callbacks
 * that will be used to signal API startup completion and called when
 * a call status changes on a line.
 *
 * @constructor
 *
 * @param {String} username A valid PBX username for a user who owns a phone
 * @param {String} password Password
 * @param {SimpleChat~statusCallback} statusCB to call on error or successful API initialisation
 * @param {SimpleChat~Callback} [message] to call when a chat message appears in an open room
 */
/**
 * Status (initialisation) event callback
 * @callback SimpleChat~statusCallback
 * @param ok {Boolean} true or false:
 *      true: API successfully started
 *      false: error condition
 * @param code {number} numeric API error code (status == false only)
 * @param text {String} textual explanation suitable for user display
 *
 */
/**
 * Call event callback
 * 
 * @callback SimpleCTI~eventCallback
 * @param opaque
 *            {String} something
 *            
 */

var SimpleChat = (function(username, password, messageCB) {
	var username = username, 
	password = password, 
	CB = {
			message : messageCB
	};

	
	/**
	 * This private method is called by the API when login is initialised Just
	 * checks login status and starts API polling
	 * 
	 * @param ok
	 */
	function authCB(ok) {
		console.log('SimpleCTI.authCB(' + ok + ')');

		if (ok) {
			/*
			 * Request the poller starts and initial PABX config information is
			 * fetched and cached. 'go' and 'error' are success/fail callbacks.
			 * 'error' will be called on any error event.
			 */
			IPCortex.PBX.startPoll(go, error);
		} else
			CB.status(false, -1, "Login failed");
	}

	/**
	 * Handler for any error events
	 * 
	 * @param n
	 * @param m
	 */
	function error(n, m) {
		CB.status(false, n, m);
		console.error('We got an error number: ' + n + ' Text: ' + m);
	}

	/**
	 * Handler for API initialised event
	 */
	function go() {
		console.log('SimpleCTI.go()');

		// Once initialised, request all our owned lines are returned
//		IPCortex.PBX.getLines(linesCB, true);
		CB.status(true, 0, "API Initialised");
	}

		// Global onAPILoadReady is a special function called by ipcortex API
	// wrapper
	// to initialiase the API. Feed it something relevant.
	onAPILoadReady = (function() {
		IPCortex.PBX.Auth.login(username, password, null, authCB);
	});
	console.log('setup onAPILoadReady');

	return {
		/**
		 * Answer a call
		 * 
		 * @param id
		 *            {String} ID of call to answer
		 */
		answer : function(id) {
			console.log('Answer ID: ' + id);

			if (id != null || calls[id] == null)
				calls[id].talk();
		}
	};
});
