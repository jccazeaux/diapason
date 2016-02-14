# Carburator
Tiny, configurable dependency injection framework. Carburator uses `promises` to handle asynchronous dependency injections.

# Installation

* Download the [latest release](https://github.com/jccazeaux/carburator/releases/download/v0.2.1/carburator.min.js).
* Clone the repo: `git clone https://github.com/jccazeaux/carburator.git`.
* Install with npm: `npm install carburator`.

# How it works
Carburator acts as an object container. You can add objets to containers. Then execute function with dependency injection.

## Create a container
Carburator comes with no container, you must create one or more

```Javascript
carburator.config
	.container("myContainer")
	.container("myOtherContainer");
```

This will create the containers and the functions to add content.

## Declare objects to a container
When creating a container, a function will be created to specifically add objets to that container. The name of the function will be the name of the container

```Javascript
carburator.myContainer("myObject", "Hello")
carburator.myOtherContainer("myOtherObject", "World !")
```

## Dependency injection

```Javascript
carburator.inject(["myObject", "myOtherObject", function(myObject, myOtherObject) {
	console.log(myObject + ", " + myOtherObject);
}]);
// > Hello, World !
```

# Asynchronous mecanism
## What does that mean
It means any injection may be a promise. Carburator will wait recursively all dependencies to be be resolved before calling the injection functions.

```Javascript
// Create an async dependency
carburator.myContainer("a", Promise.resolve("Hello World"));
// Create an other async dependency that needs a
carburator.myContainer("b", ["a", function(a) {
	// When injected, will wait for a to be ready
	return Promise.resolve(a + " !");
}]);
// Inject dependency
carburator.inject(["a", function(a) {
	// Enters here only when injections are ready
	console.log(asyncDep); // Hello World !
}]);
```

## Promises API
Carburator supports 3 Promises frameworks
* Ecmascript 2016 (default)
* [Q](http://documentup.com/kriskowal/q/)
* [Bluebird](http://bluebirdjs.com/)

**Carburator does not include any Promise framework, you must add the one you want (or use ES2016 if your browser supports it)**

## Switch promise framework
To switch `Promise` framework in carburator 
```Javascript
carburator.config.usePromise("ES");
carburator.config.usePromise("Q");
carburator.config.usePromise("bluebird");
```

## Configure an other promise framework
Carburator can be adapted to work on any other `Promise` framework. To add a new one use `config.promiseAdapter` function. This function must return an object to define 4 elements
* `resolve(value)`: function to create a `Promise` that is resolved with given value
* `reject(value)`: function to create a `Promise` that is rejected with given value
* `all(iterable)`: function that will wait for more than one promise
* `thenAlias`: Alias for `then` function

As examples, `Q` and `bluebird` adapters are defined like this in carburator
```Javascript
carburator.config.promiseAdapter("Q", function() {
	return {
		resolve: Q,
		reject: function(value) {
			return Q().then(function() {
				throw value;
			});
		},
		all: function(value) {
			return Q.all(value)
		},
		thenAlias: "then"
	};
});
carburator.config.promiseAdapter("bluebird", function() {
	return {
		resolve: function(value) {
			return Promise.resolve(value)
		},
		reject: function(value) {
			return Promise.reject(value)
		},
		all: function(value) {
			return Promise.all(value)
		},
		thenAlias: "then"
	};
});
```


# Other capabilities
## Declaring an object as singleton or prototype
By default, objects will be treated as singleton. You can declare them as protorypes using this method. This concerns only function() to determine if they will be reexecuted.

```Javascript
// Declare as singleton (by default)
carburator.myContainer("myObject", function() {
	return {
		message: "Hello, World !";
	};
}).asSingleton();
// Declare as prototype
carburator.myContainer("myObject", function() {
	return {
		message: "Hello, World !";
	};
}).asPrototype();
```

## Injecting from specific container
You can choose the container wich will contain your object in the name of the injection

```javascript
// carburator will search only in myContainer for myObject.
carburator.inject(["myContainer:myObject"], function(myObject) {
	console.log(myObject);
});
```

## Declaring executor
This is usefull if you want to specify specific handling for objects in the containers when injecting them. Again this is for functions.

The default executor executes the functions.

Exemple: get the functions without executing them
```Javascript
carburator.config
	.container("functions")
	.executor("functions", function(obj) {
		return obj;
	});

carburator.function("myFunction", function() {
	console.log("Hello, World !");
});
carburator.inject(["myFunction", function(myFunction) {
	myFunction();
}]);
```

## Resetting
You can reset a container, wich means the container will no longer be available.

```Javascript
// Reset a container
carburator.reset("myContainer");
// Reset all
carburator.reset();
```

## Clear
You can clear a container, wich means all objects in it will be deleted. The container will still be available.

```Javascript
// Clear a container
carburator.clear("myContainer");
// Clear all containers
carburator.clear();
```

## Define execution context (this)
The injection function will be executed by default on null. You can specify a specific context with the second argument of the inject function

```javascript
carburator.inject(["myObject"], function(myObject) {
	console.log(myObject);
}, window);
```

## Contextual dependencies
For some injections, you may want to add contextual dependencies. This dependencies cannot be added to a container because they must be available only for this execution. These contextual dependencies can be passed as third argument of inject function

```javascript
carburator.inject(["myObject", "$scope"], function(myObject, $scope) {
	console.log(myObject);
}, window, {$scope: {id: 0}});
```

## Ignore containers
You can tell carburator to ignore containers on an injection with fourth parameter. This parameter is an array of ignored container names.

```javascript
carburator.inject(["myObject"], function(myObject) {
	console.log(myObject);
}, window, null, ["myContainer"]);
```

## Automatic dependencies
You can add automatic dependencies. An automatic dependency is a dependency defined in no container. It's defined
 * on a container
 * with a name
 * as a function

When a dependency of the container is injected, it will have all automatic dependencies configured for this container. The function will be executed with the dependency name in paramater.

Here is an exemple of usage. We want to have configurable services. The configuration of the service must be stored in a specific container and injected as $configuration for the service.

```javascript
	carburator.config
		.container("configuration")
		.container("service");
	// For the service container, we add a $configuration automatic dependency
	// This $configuration dependency will be the &lt;serviceName&gt; dependency in the configuration container
	carburator.config.automaticDependencies("service", {"$configuration": function(name) {
		// We get the service configuration in the configuration container (ignore service container)
		return carburator.inject([name, function(config) {
			return config;
		}], null, null, ["service"]);
	}});
	// We define the configuration
	carburator.configuration("myService", "myService configuration is here");
	// Then the service will receive the configuration as $configuration
	carburator.service("myService", ["$configuration", function($configuration) {
		console.log($configuration); // "myService configuration is here"
	}]);

```