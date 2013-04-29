var _this = { 
	sendToSocketId:null,
	broadcasting:false,
	acks:[],
	log:[],
	users:[],
	dispacher: {}
};

var blackListEvents = ['DATA_FROM_SERVER', 'REQUEST_FOR_CLIENT', 'REQUEST_FOR_CLIENTS', 'RESPONSE_TO_CLIENT']

function SocketController(_io) {
	
	_this.io = _io;
	// var globalEvent = '*';
	//   _this.io.$emit = function (name) {
	//     if(!this.$events) return false;
	//     for(var i=0;i<2;++i){
	//         if(i==0 && name==globalEvent) continue;
	//         var args = Array.prototype.slice.call(arguments, 1-i);
	//         var handler = this.$events[i==0?name:globalEvent];
	//         if(!handler) handler = [];
	//         if ('function' == typeof handler) handler.apply(this, args);
	//         else if (io.util.isArray(handler)) {
	//             var listeners = handler.slice();
	//             for (var i=0, l=listeners.length; i<l; i++)
	//                 listeners[i].apply(this, args);
	//         } else return false;
	//     }
	//     return true;
	//   };

	//   _this.io.on(globalEvent, function(event){
	//     if(blackListEvents.indexOf(event) == -1) {
	//     	var args = Array.prototype.slice.call(arguments, 1);
	//     	_this.dispacher.on(event, args, function() {});
	//     	//console.log("Global Event = "+event+"; Arguments = "+JSON.stringify(args));
	//     }    	
	//   });

	(function() {
	   // var emit = this.io.emit;
	   //  this.io.emit = function() {
	   //  	var event = arguments[0];
	   //    //console.log('***','emit', Array.prototype.slice.call(arguments));
	   //    	//if(blackListEvents.indexOf(event) == -1) 
	   //    		emit.apply(this.io, arguments);
	   //  };
	    var $emit = _this.io.$emit;
	    _this.io.$emit = function() { 
	    	var event = arguments[0];
	    	if(blackListEvents.indexOf(event) == -1) {
				var args = Array.prototype.slice.call(arguments, 1);
				if(_this.dispacher.on) {
					if(args.length <= 1) {
						_this.dispacher.on(event, args[0], function() {});
					} else {
						_this.dispacher.on(event, args, function() {});
					}
				}
			}
			$emit.apply(_this.io, arguments);
			//console.log('***','on',Array.prototype.slice.call(args));			
    	};
  })();

	_this.io.on('DATA_FROM_SERVER', function (res, ackId) {			
		if(ackId != null) {
			_this.acks[ackId](res.data);
			_this.acks[ackId] = null;			
		}
	});

	_this.io.on('REQUEST_FOR_CLIENT', function (res, ackId) {	
		_this.dispacher.on(res.event, res.data, function(data) {
				_this.io.emit('RESPONSE_FROM_CLIENT', { to:res.to, ackId:ackId, data:data });
			}
		);
	});

	_this.io.on('REQUEST_FOR_CLIENTS', function (res) {
		_this.dispacher.on(res.event, res.data, function() {});
	});

	_this.io.on('RESPONSE_TO_CLIENT', function (res, ackId) {					
		if(ackId != null && ackId != undefined) {			
			_this.acks[ackId](res.data);
			_this.acks[ackId] = null;			
		}
	});

	return _this;
};

_this.on = function(fn) {
	_this.dispacher.on = fn;
};

_this.emit = function(event, data, cb) {	
	var socketId = _this.sendToSocketId;	
	_this.sendToSocketId = null;

	var broadcast = _this.broadcasting;	
	_this.broadcasting = false;

	var ackId = null;
	if(cb && socketId != null)
		ackId = _this.acks.push(cb) - 1;

	if(socketId) {	
		if(socketId.toUpperCase() == 'SERVER') {
			_this.io.emit('DATA_TO_SERVER', { event:event, data:data, ackId:ackId  }, cb);
		} else {						
			_this.io.emit('DATA_TO_CLIENT', { to:socketId, event:event, data:data, ackId:ackId });
		}		
	} else { // send to all			
		_this.io.emit('DATA_TO_CLIENTS', { broadcast:broadcast, event:event, data:data});
	}
}

_this.send = function(msg) {	
	var socketId = _this.sendToSocketId;	
	_this.sendToSocketId = null;

	var broadcast = _this.broadcasting;	
	_this.broadcasting = false;

	if(socketId) {	
		_this.io.emit('MESSAGE_TO_CLIENT', { to:socketId, message:msg });
	} else { // send to all					
		_this.io.emit('MESSAGE_TO_CLIENTS', { broadcast:broadcast, message:msg});
	}
}

_this.broadcast = {   	
	get emit() {	
		_this.broadcasting = true;	    	
        return _this.emit;
    },
    get send() {
    	_this.broadcasting = true;
    	return _this.send;
    }
}

_this.to = function(_socketId) {	
	_this.sendToSocketId = _socketId;
	return _this;
}