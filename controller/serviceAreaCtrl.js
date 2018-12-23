//var async = require('async');
var serviceAreaModel = require('.././model/serviceArea.js');
var controller = {
    saveServiceArea: function (data, callback) {
        data.coordinates = data.coordinates.map(Object.values);
        console.log("__________",data);
        data.coordinates.push(data.coordinates[0]);
        console.log("__________",data);
        var arr=[];
        arr.push(data.coordinates);
        var serviceAreaData = new serviceAreaModel({
            name: data.name,
            "loc": {
                "type": "Polygon",
                "coordinates":arr
            }
        });
        serviceAreaData.save(callback);
    },
    getServiceAreas:function(data,callback){
        serviceAreaModel.find({}).exec(callback);
    }

}
module.exports = controller;