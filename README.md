# Carburator
Tiny, simple, configurable dependency injection framework

# How it works
Injecteur acts as an object container. You can add objets to containers. Then execute function with dependency injection.

## Create a container
Injecteur comes with no container, you must create one or more

```Javascript
injecteur.config
	.container("myContainer")
	.container("myOtherContainer");
```

This will create the containers and the functions to add content.

## Declare objects to a container
When creating a container, a function will be created to specifically add objets to that container. The name of the function will be the name of the container

```Javascript
injecteur.myContainer("myObject", "Hello")
injecteur.myOtherContainer("myOtherObject", "World !")
```

## Dependency injection

```Javascript
injecteur.inject(["myObject", "myOtherObject", function(myObject, myOtherObject) {
	console.log(myObject + ", " + myOtherObject);
}]);
// > Hello, World !
```

# Other capabilities
## Declaring an object as singleton or prototype
By default, objects will be treated as singleton. You can declare them as protorypes using this method. This concerns only function() to determine if they will be reexecuted.

```Javascript
// Declare as singleton (by default)
injecteur.myContainer("myObject", function() {
	return {
		message: "Hello, World !";
	};
}).asSingleton();
// Declare as prototype
injecteur.myContainer("myObject", function() {
	return {
		message: "Hello, World !";
	};
}).asPrototype();
```

## Injecting from specific container
You can choose the container wich will contain your object in the name of the injection

```javascript
// injecteur will search only in myContainer for myObject.
injecteur.inject(["myContainer:myObject"], function(myObject) {
	console.log(myObject);
});
```

## Declaring executor
This is usefull if you want to specify specific handling for objects in the containers when injecting them. Again this is for functions.

The default executor executes the functions.

Exemple: get the functions without executing them
```Javascript
injecteur.config
	.container("functions")
	.executor("functions", function(obj) {
		return obj;
	});

injecteur.function("myFunction", function() {
	console.log("Hello, World !");
});
injecteur.inject(["myFunction", function(myFunction) {
	myFunction();
}]);
```

## Resetting
You can reset a container, wich means the container will no longer be available.

```Javascript
// Reset a container
injecteur.reset("myContainer");
// Reset all
injecteur.reset();
```

## Clear
You can clear a container, wich means all objects in it will be deleted. The container will still be available.

```Javascript
// Clear a container
injecteur.clear("myContainer");
// Clear all containers
injecteur.clear();
```
<<<<<<< HEAD

## Define execution context (this)
The injection function will be executed by default on null. You can specify a specific context with the second argument of the inject function

```javascript
injecteur.inject(["myObject"], function(myObject) {
	console.log(myObject);
}, window);
```

## Contextual dependencies
For some injections, you may want to add contextual dependencies. This dependencies cannot be added to a container because they must be available only for this execution. These contextual dependencies can be passed as third argument of inject function

```javascript
injecteur.inject(["myObject", "$scope"], function(myObject, $scope) {
	console.log(myObject);
}, window, {$scope: {id: 0}});
```

## Ignore containers
You can tell carburator to ignore containers on an injection with fourth parameter. This parameter is an array of ignored container names.

```javascript
injecteur.inject(["myObject"], function(myObject) {
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


=======
>>>>>>> 0a4b7aef91b23c0341c4e0c31cc29a84672929b2
