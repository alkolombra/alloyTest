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
			res.send({ type:'GET'});
		},
		update: function(req,res,next){
			res.send({ type:'PUT'});	
		},		
		create: function(req,res,next){			
			res.send({ type:'POST'});
		},
		delete: function(req,res,next){
			res.send({ type:'DELETE'});
		}
	}
}