var express = require('express');
var router = express.Router();
var serviceAreaController = require('.././controller/serviceAreaCtrl.js');
router.get('/getServiceAreas', function (req, res) {
    serviceAreaController.getServiceAreas(req.body,res.callback);
});
router.post('/saveServiceArea', function (req, res) {
    if (req.body) {
        serviceAreaController.saveServiceArea(req.body,res.callback);
    } else {
        res.callback("Something went wrong", null);
    }
});
module.exports = router;