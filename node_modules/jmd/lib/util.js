const Q = require("q")
    , HTTP = require("http")
    , CONSTANTS = require("./constants")

module.exports = {

    //source: https://github.com/moll/js-kindof/blob/master/kindof.js
    kindof: function(obj) {
        if (obj === undefined) return "undefined";
        if (obj === null) return "null"
        switch (Object.prototype.toString.call(obj)) {
            case "[object Boolean]": return "boolean"
            case "[object Number]": return "number"
            case "[object String]": return "string"
            case "[object RegExp]": return "regexp"
            case "[object Date]": return "date"
            case "[object Array]": return "array"
            default: return typeof obj
        }
    },
    getScheme: function(datasource) {
        var ret;
        if(CONSTANTS.FILE_SCHEME_REGEX.test(datasource)) ret = CONSTANTS.FILE_SCHEME;
        if(CONSTANTS.HTTP_SCHEME_REGEX.test(datasource)) ret = CONSTANTS.HTTP_SCHEME;
        if(CONSTANTS.HTTPS_SCHEME_REGEX.test(datasource)) ret = CONSTANTS.HTTPS_SCHEME;
        if(CONSTANTS.FTP_SCHEME_REGEX.test(datasource)) ret = CONSTANTS.FTP_SCHEME;
        return ret;
    },
    httpGet: function(url) {
        var deferred = Q.defer();
        var req = HTTP.get(url, function(res){
            var body = "";
            res.on('data', function (chunk) {
                body = body + chunk;
            });            
            res.on('end', function () {
                deferred.resolve(body);
            });            
        });
        req.on('error', deferred.reject);
        req.end();
        return deferred.promise;
    }

}
