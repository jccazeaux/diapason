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
