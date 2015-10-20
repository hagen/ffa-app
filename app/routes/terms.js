
module.exports = function(app) {
  // middleware specific to this router
  app.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
  });

  app.get('/terms', function(req, res) {
      res.render("terms.ejs");
    });
}
