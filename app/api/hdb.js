// Patterns for matching date types
var REGEX = {
  DATE: /(\d{4})-(\d{2})-(\d{2})/,
  TIME: /(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/,
  TIMESTAMP: /(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/
};

module.exports = function(req, res) {
  var hdb = require("hdb");
  var oOptions = {
    host: req.get("X-HDB-host"), //'hana.forefrontanalytics.com.au',
    port: req.get("X-HDB-port"), //30015,
    user: req.get("X-HDB-user"), //
    password: req.get("X-HDB-password") //
  };

  var client = hdb.createClient(oOptions);
  client.on('error', function(err) {
    console.error('Network connection error', err);
  });
  client.connect(function(err) {
    if (err) {
      res.json({
        error: true,
        message: err
      });
      return console.error('Connect error', err);
    }

    var query = req.get("X-HDB-query") || 'select count(*) from "SYS"."TABLES"';
    client.exec(query, function(err, rows) {
      client.end();
      if (err) {
        res.json({
          error: true,
          message: err
        });
        console.error('Query error:', err)
        return;
      }

      console.log("Table rows read: ", rows.length);
      // Now we'll take the row schema.
      var jmd = require("jmd");
      jmd.getMetadata(rows).get("schema").then(function(meta) {
        var length = require("stringbitlength");
        var bytes = length(JSON.stringify(rows));

        // the meta data returned is innaccurate, because dates, times, and datetimes
        // are returned as strings, not as dates. So we'll take the first row
        // of our results, and attempt to find any dates/times/datetimes, then Update
        // the schema accordingly.
        res.json({
          schema: verifyDates(rows[0], meta),
          bytes: bytes,
          rows: rows
        });

        // Log return
        console.log("Returned " + bytes + " bytes to caller");
        console.log("First record: ", JSON.stringify(rows[0]), "Last record: ", JSON.stringify(rows[rows.length - 1]));
      });
    });
  });
};

/**
 * Small function to verify the types of the supplied row. If there are any
 * dates/times in there, we're going to parse them and return the CORRECT schema
 * @param  {Object}   row  [description]
 * @param  {Object}   meta [description]
 */
function verifyDates(row, meta) {

  var schema = {};

  // The row is a named array, so we need to use keys.
  for (var key in row) {
    if (row.hasOwnProperty(key)) {

      // try to parse a time stamp, but only if it's a string
      if (typeof row[key] === 'string') {
        if (row[key].match(REGEX.TIMESTAMP)) {
          schema[key] = "date";
        } else if (row[key].match(REGEX.DATE)) {
          schema[key] = "date";
        } else if (row[key].match(REGEX.TIME)) {
          schema[key] = "date";
        } else {
          schema[key] = meta[key];
        }
      } else {
        schema[key] = meta[key];
      }
    }
  }

  // all done, call the callback
  return schema;
}
