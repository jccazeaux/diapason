/*!
 * diapason - 0.2.0 https://github.com/jccazeaux/diapason
 *  Copyright (c) 2015 Jean-Christophe Cazeaux.
 *  Licensed under the MIT license.
 * 
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["diapason"] = factory();
	else
		root["diapason"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	"use strict";

	//Default promise is ES6

	var $promise = window.Promise;

	var promiseAdapters = {
		"ES": function () {
			return {
				resolve: function (value) {
					return Promise.resolve(value);
				},
				reject: function (value) {
					return Promise.reject(value);
				},
				all: function (value) {
					return Promise.all(value);
				},
				thenAlias: "then"
			};
		},
		"Q": function () {
			return {
				resolve: Q,
				reject: function (value) {
					return Q().then(function () {
						throw value;
					});
				},
				all: function (value) {
					return Q.all(value);
				},
				thenAlias: "then"
			};
		},
		"bluebird": function () {
			return {
				resolve: function (value) {
					return Promise.resolve(value);
				},
				reject: function (value) {
					return Promise.reject(value);
				},
				all: function (value) {
					return Promise.all(value);
				},
				thenAlias: "then"
			};
		}
	};

	var containerNameRegExp = new RegExp("^[$A-Za-z_][0-9A-Za-z_$]*$");
	var publicAPI = {};
	var containers = {};
	var automaticDependencies = {};
	var executors = {};
	var overwrites = true;
	var voidConsole = {
		debug: function () {},
		error: function () {},
		info: function () {},
		warn: function () {},
		log: function () {}
	};
	var LOG = voidConsole;

	function defaultExecutor(obj) {
		if (typeof obj === "function") {
			return obj();
		} else {
			return obj;
		}
	}

	/**
	 * Creates a dynamique injection function for a type
	 * @param {String} injectType - injection type
	 */
	function createFnInjection(injectType) {
		if (!containerNameRegExp.test(injectType)) {
			throw "Container name must contains only letters or numbers, and start by a letter or $ or _";
		}
		if (containers[injectType] !== undefined && containers[injectType] !== null) {
			throw "Container " + injectType + " already exists";
		}
		return function (name, injectionObj) {
			if (injectionObj === undefined) {
				return containers[injectType][name];
			}
			LOG.log("adding " + name + " to " + injectType);
			if (!overwrites && containers[injectType][name] != null) {
				throw "Object " + name + " already exists in container " + injectType + ".";
			}
			containers[injectType][name] = { name: name, obj: injectionObj, scope: "singleton" };
			return {
				asPrototype: function () {
					containers[injectType][name].scope = "prototype";
				}, asSingleton: function () {
					containers[injectType][name].scope = "singleton";
				}
			};
		};
	}

	publicAPI.config = {};

	/**
	 * Use a promise framework
	 * @param {String} name Name of promise framework used 
	 */
	publicAPI.config.usePromise = function (name) {
		if (promiseAdapters[name]) {
			$promise = promiseAdapters[name]();
		} else {
			throw "Unknown promise adapter : " + name;
		}
	};

	/**
	 * Configures a new promise adapter
	 * @param {String} name Name of promise framework to adapt
	 * @param {Object} Object containing the resolve, reject and all functions. 
	 */
	publicAPI.config.promiseAdapter = function (name, obj) {
		promiseAdapters[name] = function () {
			return obj;
		};
	};

	/**
	 * Adds a new container. Will create a function with containerType name. This function will add new dependencies in the container
	 * @param {String} containerType - type of the new container
	 * @return diapason.config - fluent style
	 */
	publicAPI.config.container = function (containerType) {
		publicAPI[containerType] = createFnInjection(containerType);
		containers[containerType] = {};
		return this;
	};

	/**
	 * Adds an executor for a container type
	 * @param {String} containerType - type of the container
	 * @param {Function} executorFn - Executor function. Will take 2 parameters: the object to execute and the execution context (this)
	 * @return diapason.config - fluent style
	 */
	publicAPI.config.executor = function (containerType, executorFn) {
		executors[containerType] = executorFn;
		return this;
	};

	/**
	 * Adds automatic dependencies for a container type. An automatic dependency is configured on a container
	 * It's a named dependency that will be defined here. All objects in the container will have this dependency available.
	 * It's different from contextual dependencies. Imagine you want all your services to have a $configuration wich will be 
	 * searched in a specific container. You will use automatic dependencies for that
	 * @param {String} containerType - type of the container
	 * @param {Array} automaticDependencies - automatic dependency function 
	 * @return diapason.config - fluent style
	 */
	publicAPI.config.automaticDependencies = function (containerType, fn) {
		automaticDependencies[containerType] = fn;
		return this;
	};

	/**
	 * Toggles debug mode
	 * @param {boolean} active
	 * @return diapason.config - fluent style
	 */
	publicAPI.config.debug = function (active) {
		if (active) {
			LOG = console;
		} else {
			LOG = voidConsole;
		}
		return this;
	};

	/**
	 * Toggles debug mode
	 * @param {boolean} active
	 * @return diapason.config - fluent style
	 */
	publicAPI.config.overwrites = function (active) {
		overwrites = active;
		return this;
	};

	/**
	 * Select containers for injection
	 * @param {Array} selectedContainers - Array of containers names
	 * @return {Object} Object containing inject function restricted to the selected containers
	 */
	publicAPI.selectContainers = function (selectedContainers) {
		return {
			inject: function (obj, contextualDependencies, executionContext) {
				return inject(obj, contextualDependencies, executionContext, selectedContainers);
			}
		};
	};

	/**
	 * Executes injection
	 * @param {Array} obj - Injection object
	 * @param {Object} contextualDependencies - Dependencies used only for this injection
	 * @param {Object} executionContext - Execution context (value of this)
	 * @return {Object} Result of the injection function
	 */
	publicAPI.inject = function (obj, contextualDependencies, executionContext) {
		return inject(obj, contextualDependencies, executionContext);
	};

	/**
	 * Executes injection
	 * @param {Array} obj - Injection object
	 * @param {Object} contextualDependencies - Dependencies used only for this injection
	 * @param {Object} executionContext - Execution context (value of this)
	 * @param {Array} selectedContainers - Array of the containers names to search
	 * @return {Object} Result of the injection function
	 */
	function inject(obj, contextualDependencies, executionContext, selectedContainers) {
		if (isDependencySyntax(obj)) {
			LOG.log("injecting array:", obj);
			var deferedParams = [];

			for (var i = 0; i < obj.length - 1; i++) {
				if (contextualDependencies != null && contextualDependencies[obj[i]] !== undefined) {
					deferedParams[i] = $promise.resolve(contextualDependencies[obj[i]]);
				} else {
					deferedParams[i] = searchDependency(obj[i], selectedContainers);
				}
			}
			return $promise.all(deferedParams)[$promise.thenAlias](function (params) {
				return obj[obj.length - 1].apply(executionContext, params);
			});
		} else if (typeof obj === "function") {
			LOG.log("injecting function:", obj);
			return $promise.resovle(obj.call(executionContext));
		} else {
			LOG.log("injecting obj:", obj);
			return $promise.resolve(obj);
		}
	}

	/**
	 * Reset : will remove a complete container, including its injection function
	 * @param {String} containerToClear - Container name to reset
	 * @return diapason - fluent style
	 */
	publicAPI.reset = function (containerToClear) {
		if (containerToClear === undefined) {
			LOG.log("Resetting all...");
			for (var container in containers) {
				delete publicAPI[container];
				delete executors[container];
			}
			containers = {};
		} else if (containers[containerToClear]) {
			LOG.log("Resetting container " + containerToClear);
			delete publicAPI[containerToClear];
			delete containers[containerToClear];
			delete executors[containerToClear];
		} else {
			throw "Cannot reset " + containerToClear + " : it doesn't exist.";
		}
		return this;
	};

	/**
	 * clear : will clear a container
	 * @param {String} containerToClear - Container name to reset
	 * @return diapason - fluent style
	 */
	publicAPI.clear = function (containerToClear) {
		if (containerToClear === undefined) {
			LOG.log("Clearing all containers...");
			for (var container in containers) {
				containers[container] = {};
			}
		} else if (containers[containerToClear]) {
			LOG.log("Clearing container " + containerToClear);
			containers[containerToClear] = {};
		} else {
			throw "Cannot clear container " + containerToClear + " : it doesn't exist.";
		}
		return this;
	};

	/**
	 * Searches a dependency
	 * @param {String} name - Injection name to search
	 * @param {Array} selectedContainers - Excecution context (this)
	 */
	function searchDependency(name, selectedContainers) {
		var container, injectionFound, containerFound, injectionName;
		LOG.log("searchDependency for " + name);
		var regexp = new RegExp("(.+):(.+)");
		var res = regexp.exec(name);
		if (res !== null && containers[res[1]] !== undefined && (!selectedContainers || selectedContainers.indexOf(res[1]) !== -1)) {
			injectionFound = containers[res[1]][res[2]];
			containerFound = res[1];
			injectionName = res[2];
		} else {
			for (var containerType in containers) {
				if (selectedContainers && selectedContainers.indexOf(containerType) === -1) {
					continue;
				}
				LOG.log("container:" + containerType);
				container = containers[containerType];
				for (var injection in container) {
					LOG.log("injectionName:" + injectionName);
					if (injection === name) {
						injectionName = name;
						injectionFound = container[injection];
						containerFound = containerType;
					}
				}
			}
		}

		// Exec injection found
		if (injectionFound != null) {
			if (injectionFound.scope === "prototype") {
				LOG.log("as prototype");
				return injectDependency(injectionFound.name, injectionFound.obj, containerFound, selectedContainers);
			} else {
				if (!injectionFound.instance) {
					return injectDependency(injectionFound.name, injectionFound.obj, containerFound, selectedContainers)[$promise.thenAlias](function (res) {
						injectionFound.instance = res;
						return res;
					});
				}
				return $promise.resolve(injectionFound.instance);
			}
		} else {
			return $promise.reject("Injection " + name + " doesn't exist");
		}
	}

	/**
	 * Checks if obj is a dependency. Syntax if [string, string, ..., string, function]
	 * @param {Object} obj - object to check
	 * @returns boolean
	 */
	function isDependencySyntax(obj) {
		if (!Array.isArray(obj)) {
			return false;
		}
		for (var i = 0; i < obj.length - 1; i++) {
			if (typeof obj[i] !== "string") {
				return false;
			}
		}
		if (typeof obj[obj.length - 1] !== "function") {
			return false;
		}
		return true;
	}

	/**
	 * Injects a dependency. The execution is different from the main injection because it can use the custom executors
	 * @param {Object} obj - object to run as inection
	 * @param {String} containerType - container type of the injection
	 * @param {Object} contextualDependencies - contextual dependencies
	 */
	function injectDependency(name, obj, containerType, selectedContainers) {
		if (isDependencySyntax(obj)) {
			LOG.log("injecting array:", obj);
			var deferedParams = [];
			var autoDependencies = automaticDependencies[containerType];
			for (var i = 0; i < obj.length - 1; i++) {
				if (autoDependencies && autoDependencies[obj[i]]) {
					deferedParams[i] = $promise.resolve(autoDependencies[obj[i]](name));
				} else {
					deferedParams[i] = searchDependency(obj[i], selectedContainers);
				}
			}
			return $promise.all(deferedParams)[$promise.thenAlias](function (params) {
				return obj[obj.length - 1].apply(null, params);
			});
		} else {
			var executor = executors[containerType] || defaultExecutor;
			return $promise.resolve(executor(obj));
		}
	}

	module.exports = publicAPI;

/***/ }
/******/ ])
});
;