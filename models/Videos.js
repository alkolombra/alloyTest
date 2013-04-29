var mongoose = require('mongoose');
var db = mongoose.connection
/*
 * Users Schema
 */
var videosSchema = new mongoose.Schema({
	title: String,
	fileName: String,
	duration: Number,
	userName: String,
	uuId: String,
	enabled: {type:Boolean, default:true}
});

/*
 * Users manipulation
 */

module.exports = function(extendStaticMethods, cb){

	videosSchema.statics = extendStaticMethods('Videos', ['list','add', 'get', 'delete']);
	/*
	 * Users Model
	 */
	return cb(db.model('Videos', videosSchema));
};