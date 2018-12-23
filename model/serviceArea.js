var mongoose = require('mongoose')
var Schema = mongoose.Schema
  var serviceAreaSchema = new Schema({
    name:
    {
      type:String,
      unique:true},
    loc:{
      type: {
        type: String,
        enum: ['Polygon'],
        required: true
      },
      coordinates: {
        type: [],
        required: true
      }
    }
});
serviceAreaSchema.index( { loc : "2dsphere" } )
var serviceArea = mongoose.model('serviceArea', serviceAreaSchema);
module.exports = serviceArea;