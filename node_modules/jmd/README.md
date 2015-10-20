# jmd - JSON metadata

jmd extracts metadata information from JSON datasets.

### Installation

npm install jmd 

### Usage


jmd takes a datasource as argument and returns a promise. The datasource can be a simple hash, an array, a local or a remote file. 

```
var jmd = require('jmd')
jmd.getMetadata({key1:"value1}).then(function(metadata){
	// schema info available here 
});
```


### Simple Hashes

Given a simple hash: 

```
{
	key1: 'text',
	key2: 10,
	key3: true,
	key4: undefined,
	key5: new Date(),
	key6: [1,2,3],
	key7: null
}
```

jmd returns this metadata object:

```
{
  schema: {
	key1: 'string',
    key2: 'number',
    key3: 'boolean',
    key4: 'undefined',
    key5: 'date',
    key6: 'array',
    key7: 'null'
  }
}
```

### Arrays
Since there is no guarantee that all the elements in an array are of the same type, jmd analyses the data in the array and returns the best schema as well as data consistency information.

#### Consistent Arrays
A 100% consistent array in terms of key names and value types might look like this:

`[{name:'alice',age:23}, {name:'bob',age:32}, {name:'charlie',age:16}];`

where the key names and value types are the same for all the elements. In this case jmd extracts the following schema:

```
schema: { name: 'string', age: 'number' }
```

and meta information about key names and value types consistency at data field level:

```
{ consistency: {
	name: { 
		keys: { count: '3 out of 3', consistency: 1 },
     	types: { count: '3 out of 3', consistency: 1 }
	},
	age: {
		keys: { count: '3 out of 3', consistency: 1 },
		types: { count: '3 out of 3', consistency: 1 }
	}
}
``` 

The consistency information shows that both data fields found in the common object definition are 100% consistent across all entries, keys and types wise.

#### Inconsistent Arrays

Inconsistent arrays can be key- or type-inconsistent.
For example, the following array is key-inconsistent:

`[{name:'alice',age:23}, {firstname:'bob',age:32}, {name:'charlie',age:16}]`

since not all the keys are the same across the elements of the array - the second element has a `firstname` key while the other two elements have a `name` key. The other key `age` is present in all the elements.

In this case jmd output will be:

```
{
	schema: { age: 'number' },
	meta: {
		consistency: {
			name: {
				keys: { count: '2 out of 3', consistency: 0.6666666666666666 }
			},
  			age: {
  				keys: { count: '3 out of 3', consistency: 1 },
  				types: { count: '3 out of 3', consistency: 1 }
  			}
  		}
	}
}
```

Only the common keys are extracted in the schema and the per-field consistency information is adjusted accordingly. Note the missing `types` entry in the case of the `name` field as type consistency becomes irrelevant in the context of a key-inconsistent field.

Here's a type-inconsistent array example:

`[{name:'alice',age:23}, {name:'bob',age:32}, {name:'charlie',age:'sixteen'}]`

In this case the value type of the `age` key of the last element is inconsistent with the previous two values: string respectively number. The output becomes now: 

```
{
    schema: { name: 'string' },
    meta: {
        name: {
            keys: { count: '3 out of 3', consistency: 1 },
            types: { count: '3 out of 3', consistency: 1 }
        },
    age: {
        keys: { count: '3 out of 3', consistency: 1 },
        types: { count: '2 out of 3', consistency: 0.6666666666666666 }
     }
}
```

### Local Files
jmd can load datasets directly from a local file as well. Just provide the filename as an argument to getMetadata. Here's how you can print the schema extracted from a local file:

```
require('jmd').getMetadata("mydata.json").get("schema").then(console.log);
```

### HTTP
Loading remote datasets over HTTP is as simple as providing the URL of the remote JSON resource:

```
var jmd = require('jmd');

jmd.getMetadata("http://example.com/test.json").then(function(metadata){
	//... 
}
```

### FTP

TODO

### OPTIONS
You can pass a second `options` parameter to `getMetadata`. There are two options available at this time: `greedy` and `path`.

##### GREEDY
If you set the greedy flag to true and the datasource is an array, jmd builds an extended schema that includes all available keys from all the elements in the array instead of picking only the common ones. Let's say you want to extract the metadata from the following array:

```
var friends=[
	{"firstname":"alice", "lastname":"adams", "age":23}, 
	{"firstname":"bob", "lastname":"brown", "age":32}, 
	{"firstname":"charlie", "age":"sixteen"},
	{"name":"diane", "status":"online"}
]
```
If you simply call 

```
jmd.getMetadata(friends).get('schema').then(console.log)
```
the output will be an empty object `{}` because not all the elements in the array share a common combination of key names and value types. If you set the greedy option:

```
jmd.getMetadata(friends,{greedy:true}).get('schema').then(console.log)
```
jmd will output:

```
{ firstname: 'string',
  lastname: 'string',
  age: 'number',
  name: 'string',
  status: 'string'
}
```
An interesting thing to note is how jmd determines the type of the field `age`. Because jmd finds 2 records where age is a number and only one record where age is a string, jmd decides that age is a number. That's just a guess and the consistency data should help you to estimate how good that guess was: (TODO output type consistency for greedy parsing)

```
{
    firstname: {
        keys: { count: '3 out of 4', consistency: 0.75 }
    },
    lastname: {
        keys: { count: '2 out of 4', consistency: 0.5 }
    },
    age: {
        keys: { count: '3 out of 4', consistency: 0.75 }
    },
    name: {
        keys: { count: '1 out of 4', consistency: 0.25 }
    },
    status: {
        keys: { count: '1 out of 4', consistency: 0.25 }
    }
}
```
##### PATH
The `path` option is useful when the data collection for which we want the schema to be extracted is not at the root of the JSON document. For example:

```
{
  "AtoZ": {
    "sites": {
      "site": [
        {
          "url": "http://www.sfsu.edu/~academic",
          "name": "Academic Affairs"
        },
        {
          "url": "http://air.sfsu.edu/ir",
          "name": "Academic Institutional Research"
        },
        ...
      ]
    }
  }
}         
```
In this case, passing `path:AtoZ.sites.site` as an option to getMetadata tells jmd to extract the target collection from the `site` key. This will return the proper `{url:'string', name:'string'}` schema.

