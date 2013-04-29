var fs 	= require('fs');

module.exports = function(db){
	function handle(err,doc){
		if (err)
			return err;
		return doc;
	}
	return {
		/*
		 * Settings Operations
		 */
		index: function(req,res,next){
			db.Videos.find({ enabled:true },{},{ sort:{ _id:-1}},function(err,doc){				
				return res.send(handle(err,doc));
			});
		},
		update: function(req,res,next){
			res.send({ type:'PUT'});	
		},		
		create: function(req,res,next){	
			var obj = req.body; 	
			db.Videos.add({ fileName:obj.fileName, userName: obj.userName, uuId: obj.uuId, title:obj.title, duration:obj.duration}, function(err,doc){
				fs.readFile(req.files.file.path, function(err, data){					
					fs.writeFile(global.root + 'public/videos/' + obj.fileName, data, 'binary', function(err) {
						run_cmd(global.root + 'public/ffmpeg/ffmpeg.exe', [                     
							'-ss', '1',
							'-i', global.root + 'public/videos/' + obj.fileName,                    
							'-vcodec', 'mjpeg',
							'-frames', '1',
							'-an', '',
							'-f', 'rawvideo',
							'-s', '60x45',
							'-y', global.root + 'public/videos/' + obj.fileName + '.jpg'],
							function () {                       
								res.send({ id:doc._id });
							}
						);  						
					});					
				});				
			});	
		},
		delete: function(req,res,next){
			res.send({ type:'DELETE'});
		}
	}
}

function run_cmd(cmd, args, done) {
    var spawn = require("child_process").spawn;
    var child = spawn(cmd, args, null);

    child.stderr.setEncoding('utf8');

    child.stderr.on("data", function (data) {		
          
    });

    child.stdout.on("end", function (data) {    	
      done();
    });

    return child;
}