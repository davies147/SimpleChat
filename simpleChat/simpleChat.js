var SimpleChat = (
	function(username, password, status, room) {
		var tmp = {};
		var rooms = {};
		var online = {};

		var lookup = {
			contact:	{},
			room:		{}
		};

		var active = {
			xmppid:		null,
			callback:	null
		};

		var CB = {
			room:		room,
			status:		status
		};

		function authCB(ok) {
			if ( ok )
				IPCortex.PBX.startPoll(go, error);
			else
				CB.status(false, -1, "Login failed");
		}

		function error(n, m) {
			CB.status(false, n, m);
			console.error('We got an error number: ' + n + ' Text: ' + m);
		}

		function go() {
			console.log('SimpleChat.go()');
			IPCortex.PBX.enableChat(roomCB);
			CB.status(true, 0, "API Initialised");
		}

		function roomUpdate(filter, hid, room) {
			var data = {
				id:		room.get('roomID'),
				name:		room.get('name'),
				state:		room.get('state'),
				members:	room.get('joined'),
				msg:		null
			};
			var tmp = [];
			var msgs = room.get('msgs') || [];
			for ( var i = 0; i < msgs.length; i++ ) {
				if ( msgs[i].cN != 'SYSTEM' )
					tmp.push({
						cid:	msgs[i].cID,
						time:	msgs[i].time,
						msg:	msgs[i].msg
					});
			}
			if ( tmp.length ) {
				for ( var i = 0; i < tmp.length; i++ ) {
					data.msg = tmp[i];
					CB.room(data);
				}
			} else
				CB.room(data);
		}
		
		function roomCB(room) {
			lookup.room[room.get('roomID')] = room;
			if ( room.get('xmppid') == active.xmppid ) {
				if ( typeof(active.callback) == 'function' )
					active.callback(room);
				active = {
					xmppid:		null,
					callback:	null
				};
			}
			roomUpdate(null, null, room);
			room.hook(roomUpdate);
		}

		function addressUpdate(filter, hid, address) {
			if ( address.get('online') && ! online[address.get('cid')] ) {
				online[address.get('cid')] = true;
				CB.address({
					cid:	address.get('cid'),
					name:	address.get('name'),
					online:	true
				});
			} else if ( ! address.get('online') && online[address.get('cid')] ) {
				delete online[address.get('cid')];
				CB.address({
					cid:	address.get('cid'),
					name:	address.get('name'),
					online:	false
				});
			}
		}

		function addressCB(address, deleted) {
			for ( var i = 0; i < address.length; i++ ) {
				lookup.contact[address[i].get('cid')] = address[i];
				address[i].hook(addressUpdate);
			}
		}

		onAPILoadReady = (
			function() {
				IPCortex.PBX.Auth.login(username, password, null, authCB);
			}
		);

		return {
			getOnline:
				function(cb) {
					if ( typeof(cb) != 'function' )
						return false;
					for ( var cid in online ) {
						if ( online.hasOwnProperty(cid) ) {
							cb(online);
							return;
						}
					}
					IPCortex.PBX.getAddressbook(addressCB);
					CB.address = cb;
				},
			openRoom: 
				function(cids) {
					cids = [].concat(cids);
					if ( ! lookup.contact[cids[0]] || active.xmppid )
						return false;
					function cb(a, b) {

					}
					function done(room) {
						for ( var i = 0; i < cids.length; i++ )
							room.link(cids[i]);
					}
					var contact = lookup.contact[cids[0]];
/* TODO: support multiple outstanding rooms! */ 
					active.xmppid = contact.get('xmppid');
					active.callback = done;
					contact.chat(cb);
					cids.shift();
				},
			renameRoom:
				function(roomID, name) {

				},
			postRoom:
				function(roomID, msg) {
					if ( ! lookup.room[roomID] )
						return false;
					lookup.room[roomID].post(msg);
				}
		};
	}
);
