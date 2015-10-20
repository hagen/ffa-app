var request = require("request");

module.exports = function(req, res) {

  var sUrl = req.get("X-ImportIO-Url");
  if (!sUrl) {
    console.log("ImportIO URL was not supplied, so I can't read anything");
  }

  // Require http to make a GET request on the ImportIO url
  var oOptions = {
    hostname : "api.import.io",
    port : 443,
    path : sUrl.replace("https://api.import.io", ""),
    method : "GET"
  };

  // Now request!
  request(sUrl, function(error, response, body) {

    var oData = JSON.parse(body);

    // Now that we have our response, we'll be taking the data component, AND
    // creating a schema to use.
    var oSchema = {};
    oData.outputProperties.forEach(function (prop, index) {
      oSchema[prop.name] = prop.type.toLowerCase();
    }, this);

    // Retain results
    var aRows = oData.results;

    // Get length/size and return
    var length = require("stringbitlength");
    var bytes = length(JSON.stringify(aRows));

    // Return
    res.json({
      schema: oSchema, // note this is actually an object (named array)
      bytes: bytes,
      rows: aRows
    });

    console.log("Returned " + bytes + " bytes to caller");
    console.log("First record: ", JSON.stringify(aRows[0]), "Last record: ", JSON.stringify(aRows[aRows.length - 1]));
  });
};
