module.exports = function(req, res) {

  var pg = require('pg');

  // Restore decimal parsing in PG
  require('pg-parse-float')(pg);

  var oOptions = {
    user: req.get("X-Redshift-user"),
    password: req.get("X-Redshift-password"),
    database: req.get("X-Redshift-database"),
    host: req.get("X-Redshift-endpoint"),
    port: req.get("X-Redshift-port")
  };

  // Connect
  pg.connect(oOptions, function(err, client, done) {
    if (err) {
      res.json({
        error: true,
        message: 'Connection error'
      });
      return console.error('Connect error', err);
    }

    var query = req.get("X-Redshift-query") || "select count(*) from pg_table_def;";
    client.query(query, function(err, rows) {
      client.end();
      if (err) {
        res.json({
          error: true,
          message: err
        });
        return console.error('Query error:', err);
      }

      console.log("Table rows read: ", rows.rows.length);
      debugger;
      // Now we'll take the row schema.
      var jmd = require("jmd");
      jmd.getMetadata(rows.rows).get("schema").then(function(schema) {
        var length = require("stringbitlength");
        var bytes = length(JSON.stringify(rows.rows));
        res.json({
          schema: schema,
          bytes: bytes,
          rows: rows.rows
        });

        // Log return
        console.log("Returned " + bytes + " bytes to caller");
        console.log("First record: ", JSON.stringify(rows.rows[0]), "Last record: ", JSON.stringify(rows.rows[rows.rows.length - 1]));
      });
    });

    // All done, thanks
    done();
  });

  pg.end();
};
