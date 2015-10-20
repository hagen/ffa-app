module.exports = function(req, res) {
  var GoogleSpreadsheet = require("google-spreadsheet");

  var sKey = req.get("X-Sheet-Key");
  console.log("Doc key:", sKey);
  var oSheet = new GoogleSpreadsheet(sKey);

  if (oSheet) {
    console.log("Got the Google Sheet!");
  } else {
    console.error("Error retrieving sheet");
    res.json({
      message: "Error reading sheet"
    });
    return;
  }

  // Read in the first sheet only.
  oSheet.getInfo(function(err, info) {
    debugger;
    var moment = require("moment");
    var worksheet = info.worksheets[0];
    worksheet.getRows(function(err, rows) {
      // we'll return our rows after they've been parsed
      var aRows = [];

      // let's figure out the actual types of each of these too?!
      for (var i = 0; i < rows.length; i++) {
        var oRow = {};

        // Our index counter for the column definition
        var j = 0;
        var k = 1;

        // Spin through the entries of this object
        for (var attr in rows[i]) {
          if (rows[i].hasOwnProperty(attr) && ["_xml", "title", "content", "_links", "save", "del", "id"].indexOf(attr) === -1) {

            // grab the value - we'll need it.
            var vValue = rows[i][attr];
            oRow[attr] = vValue;

            // if (vValue) {
            //   // Try and get a date out of it...
            //   if (moment(vValue, "YYYY-MM-DD").isValid()) {
            //
            //     // Take the date value (creates a block)
            //     (function() {
            //       var mDate = moment(vValue);
            //       oRow[attr] = new Date(Date.UTC(mDate.year(), mDate.month(), mDate.date()));
            //     })();
            //
            //   } else if (!Number.isNaN(vValue)) {
            //     // Check if it is a number
            //     // try for a decimal
            //     if (vValue.indexOf(".") > -1) {
            //       oRow[attr] = parseFloat(vValue);
            //     } else {
            //       oRow[attr] = parseInt(vValue, 10);
            //     }
            //   } else {
            //     oRow[attr] = vValue;
            //   }
            // }
          }
        }
        // add the row to our row array...
        aRows.push(oRow);
      }

      console.log("Table rows read: ", aRows.length);

      // Now we'll take the row schema.
      var jmd = require("jmd");
      jmd.getMetadata(aRows).get("schema").then(function(schema) {
        // We'll also need the size (bytes) of the data set.
        var length = require("stringbitlength");
        var bytes = length(JSON.stringify(aRows));
        res.json({
          title: worksheet.title,
          schema: schema, // note this is actually an object (named array)
          bytes: bytes,
          rows: aRows
        });

        // Log return
        console.log("Returned " + bytes + " bytes to caller");
        console.log("First record: ", JSON.stringify(aRows[0]), "Last record: ", JSON.stringify(aRows[aRows.length - 1]));
      });
    });
  });
};
