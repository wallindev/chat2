var express = require('express');
var router = express.Router();

/* GET home page. */
exports.routeRender = function(title) {
	return router.get('/', function(req, res) {
		res.render('index',
		{
			title: title,
			partials:
			{
				header: 'header',
				footer: 'footer'
			}
	    });
	});
}
//module.exports = router;
