const Q = require("q")
    , FS = require("fs")
    , UTIL = require("./util")
    , CONSTANTS = require("./constants")

module.exports = {

    getMetadata: function(datasource, opts){
        var deferred = Q.defer(); 
        if(datasource) {
            if(datasource instanceof Object) {
                deferred.resolve(extractMetadata(datasource, opts));
            } else {
                var scheme = UTIL.getScheme(datasource);
                if(CONSTANTS.FILE_SCHEME === scheme) {
                    var filename = datasource.substring(CONSTANTS.FILE_SCHEME.length);
                    loadFromFile(filename, opts, deferred);
                } else if(CONSTANTS.HTTP_SCHEME === scheme) {
                    loadOverHttp(datasource, opts, deferred);
                } else if(CONSTANTS.HTTPS_SCHEME === scheme) {
                    throw(new Error(CONSTANTS.HTTPS_SCHEME, "not supported"))
                } else if(CONSTANTS.FTP_SCHEME === scheme) {
                    throw(new Error(CONSTANTS.FTP_SCHEME, "not supported"))
                } else {
                    var filename = datasource;
                    loadFromFile(filename, opts, deferred);
                }
            }
        } else {
            deferred.reject('no datasource');
        }
        return deferred.promise;
    }

}

function loadOverHttp(datasource, opts, deferred) {
    UTIL.httpGet(datasource).then(function(body){
        var data = JSON.parse(body);
        if(opts && opts.path) data = followPath(data, opts.path);
        deferred.resolve(extractMetadata(data, opts)); 
    })
}

function loadFromFile(datasource, opts, deferred) {
    FS.readFile(datasource, {encoding:(opts&&opts.encoding)||"utf8"}, function (err, text) {
        if(err) deferred.reject(new Error(err));
        else {
            var data = JSON.parse(text);
            if(opts && opts.path) data = followPath(data, opts.path);
            deferred.resolve(extractMetadata(data, opts));
        }
    });
}

function extractMetadata(obj, opts) {
    var ret = {schema:{}};
    var keyMap = {};
    if(UTIL.kindof(obj) === "array") {
        ret.meta = {consistency:{}};
        var keyConsistentencyMap = {};
        var typeConsistentencyMap = {};
        var typeBestGuessMap = {};
        // build key map
        obj.forEach(function(it){
            Object.keys(it).forEach(function(key){
                typeBestGuessMap[key] = typeBestGuessMap[key] || {};
                typeBestGuessMap[key][UTIL.kindof(it[key])] = typeBestGuessMap[key][UTIL.kindof(it[key])] ? typeBestGuessMap[key][UTIL.kindof(it[key])] + 1 : 1;
                // keyMap[key] = "unknown";
                keyConsistentencyMap[key] = 0;
                typeConsistentencyMap[key] = 0;
            })
        });
        // build key name consistency
        var isKeyInconsistent = false;
        obj.forEach(function(it){
            Object.keys(keyConsistentencyMap).forEach(function(key){
                if(it[key] !== undefined) keyConsistentencyMap[key] = keyConsistentencyMap[key] + 1;
                else isKeyInconsistent = true;
            })
        });
        // normalize key name consistency values 
        Object.keys(keyConsistentencyMap).forEach(function(key){
            keyConsistentencyMap[key] = {count:keyConsistentencyMap[key]+' out of '+obj.length, consistency:keyConsistentencyMap[key]/obj.length};
        });
        // build greedy schema
        Object.keys(typeBestGuessMap).forEach(function(key){
            var bestGuessScore = -1;
            Object.keys(typeBestGuessMap[key]).forEach(function(type){
                var score = typeBestGuessMap[key][type];
                if(score > bestGuessScore) {
                    bestGuessScore = score;
                    ret.schema[key] = type;
                }
            });
        })
        var isGreedy = opts && opts.greedy;
        if(!isGreedy) {
            Object.keys(keyConsistentencyMap).forEach(function(key){
                var keyConsistency = keyConsistentencyMap[key].consistency;
                if(keyConsistency !== 1) delete ret.schema[key];
            });
        }
        // build value type consistency
        var isTypeInconsistent = false;
        obj.forEach(function(it){
            Object.keys(typeConsistentencyMap).forEach(function(key){
                if(UTIL.kindof(it[key]) === ret.schema[key]) typeConsistentencyMap[key] = typeConsistentencyMap[key] + 1;
                else isTypeInconsistent = true;
            })
        });
        // normalize value type consistency values 
        Object.keys(typeConsistentencyMap).forEach(function(key){
            typeConsistentencyMap[key] = {count:typeConsistentencyMap[key]+' out of '+obj.length, consistency:typeConsistentencyMap[key]/obj.length};
        });
        // add metadata
        Object.keys(keyConsistentencyMap).forEach(function(key){
            if(keyConsistentencyMap[key].consistency === 1) ret.meta.consistency[key] = {keys:keyConsistentencyMap[key], types:typeConsistentencyMap[key]};
            else ret.meta.consistency[key] = {keys:keyConsistentencyMap[key]};
        });        
        // add comments
        var comments;
        if(Object.keys(obj[0]).length === Object.keys(ret).length) comments = "The data set is 100% consistent both key names and value types wise";
        if(isKeyInconsistent) comments = "The data set is inconsistent key names wise";
        else if(isTypeInconsistent) comments = "The data set is inconsistent value types wise";
        if(comments) ret.comments = comments;
    } else {
        Object.keys(obj).forEach(function(key){
            ret.schema[key] = UTIL.kindof(obj[key]);
        })
    }
    return ret;
}

function followPath(data, path) {
    path.split(".").forEach(function(it){
        data = data[it];
    });
    return data;
}
