var should = require('chai').should();
var jmd = require('../index')

var SIMPLE_TEST_OBJECT = {key1:'data', key2:10, key3:true, key4:undefined, key5:new Date(), key6:[1,2,3], key7:null};
var TEST_100_PERCENT_CONSISTENT_ARRAY = [{name:'alice',age:23}, {name:'bob',age:32}, {name:'charlie',age:16}];
var TEST_KEY_INCONSISTENT_ARRAY = [{name:'alice',age:23}, {firstname:'bob',age:32}, {name:'charlie',age:16}];
var TEST_TYPE_INCONSISTENT_ARRAY = [{name:'alice',age:23}, {name:'bob',age:32}, {name:'charlie',age:'sixteen'}];
var TEST_FILENAME = "test/testdata1.json";
var TEST_FILENAME_WITH_SCHEME = "file://test/testdata1.json";
var TEST_HTTP = {URL: "http://ckannet-storage.commondatastorage.googleapis.com/2015-01-02T17:56:56.968Z/atoz.json", pathToArray:"AtoZ.sites.site"}
var GREEDY_TEST_FILENAME = "test/greedytestdata.json";

describe("hashes", function() {
    it('should have valid metadata', function(){
        jmd.getMetadata(SIMPLE_TEST_OBJECT).then(function(metadata){
            should.exist(metadata);
            metadata.should.not.be.empty;
            metadata.should.have.property("schema");
            metadata.schema.should.have.property("key1");
            metadata.schema.key1.should.equal("string");
            metadata.schema.should.have.property("key2");
            metadata.schema.key2.should.equal("number");
            metadata.schema.should.have.property("key3");
            metadata.schema.key3.should.equal("boolean");
            metadata.schema.should.have.property("key4");
            metadata.schema.key4.should.equal("undefined");
            metadata.schema.should.have.property("key5");
            metadata.schema.key5.should.equal("date");
            metadata.schema.should.have.property("key6");
            metadata.schema.key6.should.equal("array");
            metadata.schema.should.have.property("key7");
            metadata.schema.key7.should.equal("null");
        }).done();            
    });
});
describe("arrays", function() {
    it('should have valid metadata if they are 100% consistent', function(){
        jmd.getMetadata(TEST_100_PERCENT_CONSISTENT_ARRAY).then(function(metadata){
            should.exist(metadata);
            metadata.should.not.be.empty;
            metadata.should.have.property("schema");
            metadata.schema.should.not.be.empty;
            metadata.schema.should.have.property("name");
            metadata.schema.name.should.equal("string");
            metadata.schema.should.have.property("age");
            metadata.schema.age.should.equal("number");
            metadata.should.have.property("meta");
            metadata.meta.should.not.be.empty;
            metadata.meta.should.have.property("consistency");
            metadata.meta.consistency.should.not.be.empty;
            metadata.meta.consistency.should.have.property("name");
            metadata.meta.consistency.name.should.not.be.empty;
            metadata.meta.consistency.name.should.have.property("keys");
            metadata.meta.consistency.name.keys.should.not.be.empty;
            metadata.meta.consistency.name.keys.should.have.property("count");
            metadata.meta.consistency.name.keys.count.should.equal(TEST_100_PERCENT_CONSISTENT_ARRAY.length+" out of "+TEST_100_PERCENT_CONSISTENT_ARRAY.length);
            metadata.meta.consistency.name.keys.should.have.property("consistency");
            metadata.meta.consistency.name.keys.consistency.should.equal(1);
            metadata.meta.consistency.name.should.have.property("types");
            metadata.meta.consistency.name.types.should.not.be.empty;
            metadata.meta.consistency.name.types.should.have.property("count");
            metadata.meta.consistency.name.types.count.should.equal(TEST_100_PERCENT_CONSISTENT_ARRAY.length+" out of "+TEST_100_PERCENT_CONSISTENT_ARRAY.length);
            metadata.meta.consistency.name.types.should.have.property("consistency");
            metadata.meta.consistency.name.types.consistency.should.equal(1);
            metadata.meta.consistency.should.have.property("age");
            metadata.meta.consistency.age.should.not.be.empty;
            metadata.meta.consistency.age.should.have.property("keys");
            metadata.meta.consistency.age.keys.should.not.be.empty;
            metadata.meta.consistency.age.keys.should.have.property("count");
            metadata.meta.consistency.age.keys.count.should.equal(TEST_100_PERCENT_CONSISTENT_ARRAY.length+" out of "+TEST_100_PERCENT_CONSISTENT_ARRAY.length);
            metadata.meta.consistency.age.keys.should.have.property("consistency");
            metadata.meta.consistency.age.keys.consistency.should.equal(1);
            metadata.meta.consistency.age.should.have.property("types");
            metadata.meta.consistency.age.types.should.not.be.empty;
            metadata.meta.consistency.age.types.should.have.property("count");
            metadata.meta.consistency.age.types.count.should.equal(TEST_100_PERCENT_CONSISTENT_ARRAY.length+" out of "+TEST_100_PERCENT_CONSISTENT_ARRAY.length);
            metadata.meta.consistency.age.types.should.have.property("consistency");
            metadata.meta.consistency.age.types.consistency.should.equal(1);
            metadata.should.have.property("comments");
            metadata.comments.should.contain("100% consistent");
        }).done();            
    });
    it('should have valid metadata if they are key-inconsistent', function(){
        jmd.getMetadata(TEST_KEY_INCONSISTENT_ARRAY).then(function(metadata){
            should.exist(metadata);
            metadata.should.not.be.empty;
            metadata.should.have.property("meta");
            metadata.meta.should.not.be.empty;
            metadata.meta.should.have.property("consistency");
            metadata.meta.consistency.should.not.be.empty;
            metadata.meta.consistency.should.have.property("name");
            metadata.meta.consistency.name.should.not.be.empty;
            metadata.meta.consistency.name.should.have.property("keys");
            metadata.meta.consistency.name.keys.should.not.be.empty;
            metadata.meta.consistency.name.keys.should.have.property("count");
            metadata.meta.consistency.name.keys.count.should.equal(TEST_KEY_INCONSISTENT_ARRAY.length-1+" out of "+TEST_KEY_INCONSISTENT_ARRAY.length);
            metadata.meta.consistency.name.keys.should.have.property("consistency");
            metadata.meta.consistency.name.keys.consistency.should.equal(0.6666666666666666);
            metadata.meta.consistency.name.should.not.have.property("types");
            metadata.meta.consistency.should.have.property("age");
            metadata.meta.consistency.age.should.not.be.empty;
            metadata.meta.consistency.age.should.have.property("keys");
            metadata.meta.consistency.age.keys.should.not.be.empty;
            metadata.meta.consistency.age.keys.should.have.property("count");
            metadata.meta.consistency.age.keys.count.should.equal(TEST_KEY_INCONSISTENT_ARRAY.length+" out of "+TEST_KEY_INCONSISTENT_ARRAY.length);
            metadata.meta.consistency.age.keys.should.have.property("consistency");
            metadata.meta.consistency.age.keys.consistency.should.equal(1);
            metadata.meta.consistency.age.should.have.property("types");
            metadata.meta.consistency.age.types.should.not.be.empty;
            metadata.meta.consistency.age.types.should.have.property("count");
            metadata.meta.consistency.age.types.count.should.equal(TEST_KEY_INCONSISTENT_ARRAY.length+" out of "+TEST_KEY_INCONSISTENT_ARRAY.length);
            metadata.meta.consistency.age.types.should.have.property("consistency");
            metadata.meta.consistency.age.types.consistency.should.equal(1);
            metadata.should.have.property("comments");
            metadata.comments.should.contain("inconsistent key names wise");
        }).done();
    });
    it('should have valid metadata if they are type-inconsistent', function(){
        jmd.getMetadata(TEST_TYPE_INCONSISTENT_ARRAY).then(function(metadata){
            should.exist(metadata);
            metadata.should.not.be.empty;
            metadata.should.have.property("meta");
            metadata.meta.should.not.be.empty;
            metadata.meta.should.have.property("consistency");
            metadata.meta.consistency.should.not.be.empty;
            metadata.meta.consistency.should.have.property("name");
            metadata.meta.consistency.name.should.not.be.empty;
            metadata.meta.consistency.name.should.have.property("keys");
            metadata.meta.consistency.name.keys.should.not.be.empty;
            metadata.meta.consistency.name.keys.should.have.property("count");
            metadata.meta.consistency.name.keys.count.should.equal(TEST_TYPE_INCONSISTENT_ARRAY.length+" out of "+TEST_TYPE_INCONSISTENT_ARRAY.length);
            metadata.meta.consistency.name.keys.should.have.property("consistency");
            metadata.meta.consistency.name.keys.consistency.should.equal(1);
            metadata.meta.consistency.name.should.have.property("types");
            metadata.meta.consistency.name.types.should.not.be.empty;
            metadata.meta.consistency.name.types.should.have.property("count");
            metadata.meta.consistency.name.types.count.should.equal(TEST_TYPE_INCONSISTENT_ARRAY.length+" out of "+TEST_TYPE_INCONSISTENT_ARRAY.length);
            metadata.meta.consistency.name.types.should.have.property("consistency");
            metadata.meta.consistency.name.types.consistency.should.equal(1);
            metadata.meta.consistency.should.have.property("age");
            metadata.meta.consistency.age.should.not.be.empty;
            metadata.meta.consistency.age.should.have.property("keys");
            metadata.meta.consistency.age.keys.should.not.be.empty;
            metadata.meta.consistency.age.keys.should.have.property("count");
            metadata.meta.consistency.age.keys.count.should.equal(TEST_TYPE_INCONSISTENT_ARRAY.length+" out of "+TEST_TYPE_INCONSISTENT_ARRAY.length);
            metadata.meta.consistency.age.keys.should.have.property("consistency");
            metadata.meta.consistency.age.keys.consistency.should.equal(1);
            metadata.meta.consistency.age.should.have.property("types");
            metadata.meta.consistency.age.types.should.not.be.empty;
            metadata.meta.consistency.age.types.should.have.property("count");
            metadata.meta.consistency.age.types.count.should.equal(TEST_TYPE_INCONSISTENT_ARRAY.length-1+" out of "+TEST_TYPE_INCONSISTENT_ARRAY.length);
            metadata.meta.consistency.age.types.should.have.property("consistency");
            metadata.meta.consistency.age.types.consistency.should.equal(0.6666666666666666);
            metadata.should.have.property("comments");
            metadata.comments.should.contain("inconsistent value types wise");
        }).done();
    });
});

describe("local JSON file", function() {
    it('should have valid metadata if no URI scheme is specified', function(done){
        jmd.getMetadata(TEST_FILENAME).then(function(metadata){
            should.exist(metadata);
            metadata.should.not.be.empty;
            metadata.should.have.property("meta");
            metadata.meta.should.not.be.empty;
            metadata.meta.should.have.property("consistency");
            metadata.meta.consistency.should.not.be.empty;
            metadata.meta.consistency.should.not.be.empty;
            metadata.meta.consistency.should.have.property("name");
            metadata.meta.consistency.name.should.not.be.empty;
            metadata.meta.consistency.name.should.have.property("keys");
            metadata.meta.consistency.name.keys.should.not.be.empty;
            metadata.meta.consistency.name.keys.should.have.property("count");
            metadata.meta.consistency.name.keys.should.have.property("consistency");
            metadata.meta.consistency.name.keys.consistency.should.equal(1);
            metadata.meta.consistency.name.should.have.property("types");
            metadata.meta.consistency.name.types.should.not.be.empty;
            metadata.meta.consistency.name.types.should.have.property("count");
            metadata.meta.consistency.name.types.should.have.property("consistency");
            metadata.meta.consistency.name.types.consistency.should.equal(1);
            metadata.meta.consistency.should.have.property("age");
            metadata.meta.consistency.age.should.not.be.empty;
            metadata.meta.consistency.age.should.have.property("keys");
            metadata.meta.consistency.age.keys.should.not.be.empty;
            metadata.meta.consistency.age.keys.should.have.property("count");
            metadata.meta.consistency.age.keys.should.have.property("consistency");
            metadata.meta.consistency.age.keys.consistency.should.equal(1);
            metadata.meta.consistency.age.should.have.property("types");
            metadata.meta.consistency.age.types.should.not.be.empty;
            metadata.meta.consistency.age.types.should.have.property("count");
            metadata.meta.consistency.age.types.should.have.property("consistency");
            metadata.meta.consistency.age.types.consistency.should.equal(1);
            metadata.should.have.property("comments");
            metadata.comments.should.contain("100% consistent");
            done();
        }).done();
    });
    it('should have valid metadata if file:// URI scheme is specified', function(done){
        jmd.getMetadata(TEST_FILENAME_WITH_SCHEME).then(function(metadata){
            should.exist(metadata);
            metadata.should.not.be.empty;
            metadata.should.have.property("meta");
            metadata.meta.should.not.be.empty;
            metadata.meta.should.have.property("consistency");
            metadata.meta.consistency.should.not.be.empty;
            metadata.meta.consistency.should.not.be.empty;
            metadata.meta.consistency.should.have.property("name");
            metadata.meta.consistency.name.should.not.be.empty;
            metadata.meta.consistency.name.should.have.property("keys");
            metadata.meta.consistency.name.keys.should.not.be.empty;
            metadata.meta.consistency.name.keys.should.have.property("count");
            metadata.meta.consistency.name.keys.should.have.property("consistency");
            metadata.meta.consistency.name.keys.consistency.should.equal(1);
            metadata.meta.consistency.name.should.have.property("types");
            metadata.meta.consistency.name.types.should.not.be.empty;
            metadata.meta.consistency.name.types.should.have.property("count");
            metadata.meta.consistency.name.types.should.have.property("consistency");
            metadata.meta.consistency.name.types.consistency.should.equal(1);
            metadata.meta.consistency.should.have.property("age");
            metadata.meta.consistency.age.should.not.be.empty;
            metadata.meta.consistency.age.should.have.property("keys");
            metadata.meta.consistency.age.keys.should.not.be.empty;
            metadata.meta.consistency.age.keys.should.have.property("count");
            metadata.meta.consistency.age.keys.should.have.property("consistency");
            metadata.meta.consistency.age.keys.consistency.should.equal(1);
            metadata.meta.consistency.age.should.have.property("types");
            metadata.meta.consistency.age.types.should.not.be.empty;
            metadata.meta.consistency.age.types.should.have.property("count");
            metadata.meta.consistency.age.types.should.have.property("consistency");
            metadata.meta.consistency.age.types.consistency.should.equal(1);
            metadata.should.have.property("comments");
            metadata.comments.should.contain("100% consistent");
            done();
        }).done();
    });
});

describe("HTTP JSON", function() {
    it('should have valid metadata', function(done){
        jmd.getMetadata(TEST_HTTP.URL, {path:TEST_HTTP.pathToArray}).then(function(metadata){
            should.exist(metadata);
            metadata.should.not.be.empty;
            metadata.should.have.property("schema");
            metadata.schema.should.not.be.empty;
            metadata.schema.should.have.property("name");
            metadata.schema.name.should.equal("string");
            done();
        }).done();
    });
    it('should have valid metadata', function(done){
        jmd.getMetadata(TEST_HTTP.URL, {path:TEST_HTTP.pathToArray, greedy:true}).get("schema").then(function(schema){
            should.exist(schema);
            schema.should.not.be.empty;
            schema.should.have.property("url");
            schema.name.should.equal("string");
            schema.should.have.property("name");
            schema.name.should.equal("string");
            schema.should.have.property("email");
            schema.name.should.equal("string");
            schema.should.have.property("phone");
            schema.name.should.equal("string");
            done();
        }).done();
    });
});

describe("shortcuts", function() {
    it('get schema', function(done){
        jmd.getMetadata(TEST_FILENAME).get("schema").then(function(schema){ 
            should.exist(schema);
            schema.should.not.be.empty;
            schema.should.have.property("name");
            schema.name.should.equal("string");
            schema.should.have.property("age");
            schema.age.should.equal("number");
            done(); 
        }).done();
    });
    it('get consistency', function(done){
        jmd.getMetadata(TEST_FILENAME).get("meta").get("consistency").then(function(consistency){ 
            should.exist(consistency);
            consistency.should.not.be.empty;
            consistency.should.have.property("name");
            consistency.should.have.property("age");
            done(); 
        }).done();
    });
})

describe("options", function() {
    it('should return valid metadata for greedy:true', function(done){
        jmd.getMetadata(GREEDY_TEST_FILENAME, {greedy:true}).then(function(metadata){
            should.exist(metadata);
            metadata.should.not.be.empty;
            metadata.should.have.property("schema");
            metadata.schema.should.not.be.empty;
            metadata.schema.should.have.property("firstname");
            metadata.schema.firstname.should.equal("string");
            metadata.schema.should.have.property("lastname");
            metadata.schema.lastname.should.equal("string");
            metadata.schema.should.have.property("name");
            metadata.schema.name.should.equal("string");
            metadata.schema.should.have.property("age");
            metadata.schema.age.should.equal("number");
            metadata.schema.should.have.property("status");
            metadata.schema.status.should.equal("string");
            done();
        }).done();
    });
    it('should return valid metadata for greedy:false', function(done){
        jmd.getMetadata(GREEDY_TEST_FILENAME, {greedy:false}).then(function(metadata){
            should.exist(metadata);
            metadata.should.not.be.empty;
            metadata.should.have.property("schema");
            metadata.schema.should.be.empty;
            done();
        }).done();
    });
});
