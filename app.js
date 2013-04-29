var express = require('express')
  , routes  = require('./routes')
  , admin   = require('./routes/admin')
  , http    = require('http')
  , path    = require('path')
  , pass    = require('passport')
  , LocalS  = require('passport-local').Strategy
  , mcache  = require('connect-memcached')(express)
  , app     = express()
  , assetMgr= require('connect-assetmanager');
  global.root = process.cwd() + '/'


//ASSET MANAGEMENT
var assetManagerGroups = {
  'js': { 'route': /\/javascripts\/app\.min\.js/
        , 'path': './static/js/'
        , 'dataType': 'javascript'
        , 'files': [ 'app.js', 'controllers.js'] }
}

var assetMiddleWare = assetMgr(assetManagerGroups);

//GENERAL CONFIGURATION
app.configure(function(){
  app.set('port', process.env.PORT || 8080)
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(express.compress())
  app.use(express.favicon(__dirname + '/public/favicon.ico'))
  app.use(express.cookieParser()); 
  app.use(express.session(  { secret: "U^Z;$,^j6DZj<GGd"
                            , store: new mcache
                            , cookies:  { secure: false
                                        , maxAge: 86400000 } }))
  app.use(express.bodyParser({ keepExtensions: true}))
  app.use(express.methodOverride())
  app.use(express.csrf())
  app.use(function(req, res, next){
    var token = req.session._csrf
    , cookie  = req.cookies['csrf.token']
    , port    = (app.get('port') == 80 || app.get('port') ==443) ? '' : ':'+app.get('port')
    if (token && cookie !== token)
      res.cookie('csrf.token', token)
    res.locals.requested_url = req.protocol + '://' + req.host + req.path
    next()
  })
  app.use(pass.initialize())
  app.use(pass.session())
  app.use(app.router)
});

app.configure('development', function(){
  app.use(express.logger('dev'))
  app.use(express.errorHandler())
  app.use(assetMiddleWare);
  app.use(require('less-middleware')( { src: __dirname + '/public'
                                      , compress: true
                                      , optimization: 2 }))
  app.use(express.static(path.join(__dirname, 'public')))
   console.log('development mode')
});

app.configure('production', function(){
  var live = 86400000
  app.use(express.static(path.join(__dirname, 'public'), {maxAge: live}))
  console.log('production mode')
});

//MIDDLEWARE
function ensureAuthenticated(req, res, next){
  if (req.isAuthenticated()) { return next() }
  res.redirect('/#/login')
}

//load db async
require('./models')(function(resp){
  var Settings    = require('./controllers/settings')(resp)
      , Stats       = require('./controllers/statistics')(resp)
      , PowerUsers  = require('./controllers/powerUsers')(resp)
      , Api         = require('./controllers/api')(resp)
      , Test         = require('./controllers/test')(resp)
      , Videos         = require('./controllers/videos')(resp)
      , Images         = require('./controllers/images')(resp)
      , Records         = require('./controllers/records')(resp)

  pass.use(new LocalS(
    function(username, password, done){
      resp.powerUsers.find({username:username}, function(err,doc){
        if(err)
          return done(err)
        if (doc.length < 1)
          return done(null,false)
        doc[0].comparePassword(password, function(err,resp){
          if (err)
            return done(err)
          if (resp)
            return done(null, doc[0])
        })
      })
    }
  ))

  pass.serializeUser(function(user,done){
    return done(null,user._id)
  })

  pass.deserializeUser(function(id,done){
    if (!id)
      return done(null,false)
    resp.powerUsers.find({_id: id}, function(err, resp){
      console.log('error:');
      console.log(err);
      console.log('****************************************************************************');
      console.log('resp:');
      console.log(resp);
      console.log('****************************************************************************');
      return done(null,resp)
    })
  })

  //VIEWS
  app.get ('/', routes.index)
  app.get ('/views/:view.html', routes.views)
  app.get ('/views/admin/:view.html', ensureAuthenticated, admin.views)
  app.get ('/admin*', ensureAuthenticated, admin.index)
  app.get ('/logout', function(req,res){
    req.logout()
    res.redirect('/')
  })
  
  app.get('/test', Test.index);
  app.post('/test', Test.create);
  app.put('/test', Test.update);
  app.delete('/test', Test.delete);

  // Videos
  app.get('/videos', Videos.index);
  app.post('/videos', Videos.create);

   // Images
  app.post('/images', Images.create);

   // Records
  app.post('/records', Records.create);

  app.get('/handshake', function(req, res) { 
    res.send({ csrf:req.session._csrf});
  });

  //API
  app.post('/api/login', pass.authenticate('local'), function(req,res) {
    if (req.user) res.json({error:0})
    else res.send(401)
  })


  //START APPLICATION PROCESS WORKERS FOR EACH LOGICAL CPU
  var server = http.createServer(app)
    , cluster = require('cluster')
    , numCPUs = require('os').cpus().length
    , i       = 0;
  var sio = require('socket.io').listen(server);

  sio.configure(function () {
    //sio.set('heartbeat timeout', 60);
    sio.set('log level', 1);
    sio.set('transports', [   
      'websocket'
    , 'flashsocket'  
    , 'xhr-polling'
    , 'htmlfile' 
    , 'jsonp-polling'
    ]);
  });

  var socketController = require('socket-controller').io(sio);
  var online = {};
  var devices = {};

  sio.sockets.on('connection', function (socket) {   

    online[socket.id] = socket;
    console.log('connection')

    socketController.onConnect(socket);

    socketController.on(function(socket, event, data, ack, respond) {    
      switch(event) { 
        case 'NOTIFICATION':
          sio.sockets.emit('NOTIFICATION', data);
          data = {};
          respond(data);
        break;
        case 'CANCEL_NOTIFICATION':
          sio.sockets.emit('CANCEL_NOTIFICATION', data);
          data = {};
          respond(data);
        break;
        case 'CANCEL_NOTIFICATIONS':
          sio.sockets.emit('CANCEL_NOTIFICATIONS', data);
          data = {};
          respond(data);
        break;
        case 'START_MARQUEE':
          sio.sockets.emit('START_MARQUEE', data);
        break;
        case 'STOP_MARQUEE':
          sio.sockets.emit('STOP_MARQUEE', data);
        break;
        case 'RESET_MARQUEE':
          sio.sockets.emit('RESET_MARQUEE', data);
        break;
        case 'UPDATE_MARQUEE':
          sio.sockets.emit('UPDATE_MARQUEE', data);
        break;
        case 'SET_MARQUEE_DIRECTION':
          sio.sockets.emit('SET_MARQUEE_DIRECTION', data);
        break;
        case 'TOOLTIP_SHOW':
          sio.sockets.emit('TOOLTIP_SHOW', data);
        break;
        case 'TOOLTIP_HIDE':
          sio.sockets.emit('TOOLTIP_HIDE', data);
        break;
        case 'TOOLTIP_SET_TEXT':
          sio.sockets.emit('TOOLTIP_SET_TEXT', data);
        break;
        case 'TOOLTIP_SET_POINTER':
          sio.sockets.emit('TOOLTIP_SET_POINTER', data);
        break;
        case 'TOOLTIP_SET_SIZE':
          sio.sockets.emit('TOOLTIP_SET_SIZE', data);
        break;
        case 'TOOLTIP_SET_POSITION':
          sio.sockets.emit('TOOLTIP_SET_POSITION', data);
        break;
        case 'TOOLTIP_SET_BACKGROUND_COLOR':
          sio.sockets.emit('TOOLTIP_SET_BACKGROUND_COLOR', data);
        break;
        case 'TOOLTIP_SET_SHADOW':
          sio.sockets.emit('TOOLTIP_SET_SHADOW', data);
        break;
        default:
          data = {};
          respond(data);
        break;
      }
    });

    socket.on('SEND', function (data) {
      socket.broadcast.emit('RECIEVE', data);
      //socket.emit('RECIEVE', data);
     // sio.sockets.emit('RECIEVE', data);
    });

    socket.on('SEND_SOUND', function (data) {
      socket.broadcast.emit('RECIEVE_SOUND', data);
      //socket.emit('RECIEVE_SOUND', data);
    });

    socket.on('DEVICE_CONNECTION', function (data) {
      if(!devices[data.deviceId]) {
        socket.device = {
          uuid:data.deviceId,
          name:data.deviceName
        }
        devices[data.deviceId] = socket;        
      } else {
        if(!devices[data.deviceId].disconnected)
          socket.disconnect();
      }
    });

    socket.on('disconnect', function () {
      console.log('disconnected');
      if(socket.device && devices[socket.device.uuid] && devices[socket.device.uuid].device.uuid && devices[socket.device.uuid].device.uuid == socket.device.uuid)
        delete devices[socket.device.uuid];
      delete online[socket.id];
      //socket.leave(socket.id);
    });

  });

  // if (cluster.isMaster) {
  //   for (; i < numCPUs; i++)
  //     cluster.fork()
  //   cluster.on('death', function(worker) {
  //     cluster.fork()
  //   })
  // } else {
    server.listen(app.get('port'), function(){
      console.log("Express server listening on port " + app.get('port'))
    });
  //}
})