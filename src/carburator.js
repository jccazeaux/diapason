(function (root, factory) {
  if (typeof exports === 'object') {
    // CommonJS
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['carburator'], function () {
      return (root.returnExportsGlobal = factory(b));
    });
  } else {
    // Global Variables
    root.carburator = factory();
  }
})(this, function () {
	"use strict";
	var containerNameRegExp = new RegExp("^[$A-Za-z_][0-9A-Za-z_$]*$");
	var exports = {};
	var containers = {};
	var executors = {};
	var overwrites = true;
	var voidConsole = {
		debug: function() {},
		error: function() {},
		info: function() {},
		warn: function() {},
		log: function() {}
	};
	var LOG = voidConsole;

	function defaultExecutor(obj, executionContext) {
		if (typeof obj === "function") {
			return obj.call(executionContext);
		} else {
			return obj;			
		}
	}

	/**
	 * Creates a dynamique injection function for a type
	 */
	function createFnInjection(injectType) {
		if (!containerNameRegExp.test(injectType)) {
			throw "Container name must contains only letters or numbers, and start by a letter or $ or _";
		}
		if (containers[injectType] !== undefined && containers[injectType] !== null) {
			throw "Container " + injectType + " already exists";
		}
		return function(name, injectionObj) {
			if (injectionObj === undefined) {
				return containers[injectType][name];
			}
			LOG.log("adding " + name + " to " + injectType);
			if (!overwrites && containers[injectType][name] != null) {
				throw "Object " + name + " already exists in container " + injectType + ".";
			}
			containers[injectType][name] = {obj: injectionObj, scope:"singleton"};
			return {
				asPrototype: function() {
					containers[injectType][name].scope = "prototype";
				}, asSingleton: function() {
					containers[injectType][name].scope = "singleton";
				}
			};
		};
	}

	exports.config = {};

	/**
	 * Adds a new container. Will create a function with containerType name. This function will add new dependencies in the container
	 * @param {String} containerType - type of the new container
	 */
	exports.config.container = function(containerType) {
		exports[containerType] = createFnInjection(containerType);
		containers[containerType] = {};
		return this;
	};

	/**
	 * Adds an executor for a container type
	 * @param {String} containerType - type of the container
	 * @param {Function} executorFn - Executor function. Will take 2 parameters: the object to execute and the execution context (this)
	 */
	exports.config.executor = function(containerType, executorFn) {
		executors[containerType] = executorFn;
		return this;
	};

	/**
	 * Toggles debug mode
	 * @param {boolean} active
	 */
	exports.config.debug = function(active) {
		if (active) {
			LOG = console;
		} else {
			LOG = voidConsole;
		}
	};

	/**
	 * Toggles debug mode
	 * @param {boolean} active
	 */
	exports.config.overwrites = function(active) {
		overwrites = active;
		return this;
	};

	/**
	 * Executes injection
	 */
	exports.inject = function inject(obj, contextualDependencies, executionContext) {
		if (isDependencySyntax(obj)) {
			LOG.log("injecting array:", obj);
			var params = [];
			for (var i = 0 ; i < obj.length - 1 ; i++) {
				params[i] = searchDependency(obj[i], contextualDependencies, executionContext);
			}
			return obj[obj.length -1].apply(executionContext, params);
		} else if (typeof obj === "function") {
			LOG.log("injecting function:", obj);
			return obj.call(executionContext);
		} else {
			LOG.log("injecting obj:", obj);
			return obj;			
		}
	};

	/**
	 * Reset prysk : will remove a complete type
	 */
	exports.reset = function(containerToClear) {
		if (containerToClear === undefined) {
			LOG.log("Resetting all...");
			for (var container in containers) {
				delete exports[container];
				delete executors[container];
			}
			containers = {};
		} else if (containers[containerToClear]){
			LOG.log("Resetting container " + containerToClear);
			delete exports[containerToClear];
			delete containers[containerToClear];
			delete executors[containerToClear];
		} else {
			throw "Cannot reset " + containerToClear + " : it doesn't exist.";
		}
		return this;
	};

	/**
	 * Clear a prysk context
	 */
	exports.clear = function(containerToClear) {
		if (containerToClear === undefined) {
			LOG.log("Clearing all containers...");
			for (var container in containers) {
				containers[container] = {};
			}
		} else if (containers[containerToClear]){
			LOG.log("Clearing container " + containerToClear);
			containers[containerToClear] = {};
		} else {
			throw "Cannot clear container " + containerToClear + " : it doesn't exist.";
		}
		return this;
	};

	/**
	 * Searches a dependency
	 */
	function searchDependency(name, contextualDependencies, executionContext) {
		var container, injectionFound, containerFound;
		LOG.log("searchDependency for " + name);
		if (contextualDependencies != null && contextualDependencies[name] !== undefined) {
			return injectDependency(contextualDependencies[name], "contextual", contextualDependencies, executionContext);
		}
		var regexp = new RegExp("(.+):(.+)");
		var res = regexp.exec(name);
		if (res !== null && containers[res[1]] !== undefined) {
			injectionFound = containers[res[1]][res[2]];
			containerFound = res[1];
		} else {
			for (var containerType in containers) {
				LOG.log("container:" + containerType);
				container = containers[containerType];
				for (var injectionName in container) {
					LOG.log("injectionName:" + injectionName);
					if (injectionName === name) {
						injectionFound = container[injectionName];
						containerFound = containerType;
					}
				}
			}
		}

		// Exec injection found
		if (injectionFound != null) {
			if (injectionFound.scope === "prototype") {
				LOG.log("as prototype");
				return injectDependency(injectionFound.obj, containerFound, contextualDependencies, executionContext);
			} else {
				if (!injectionFound.instance) {
					injectionFound.instance = injectDependency(injectionFound.obj, containerFound, contextualDependencies, executionContext);
				}
				return injectionFound.instance;
			}

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
		for (var i = 0 ; i < obj.length - 1 ; i++) {
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
	 * @param {Object} executionContext - execution context of the injection
	 * @param {Object} contextualDependencies - contextual dependencies
	 */
	function injectDependency(obj, containerType, contextualDependencies, executionContext) {
		if (isDependencySyntax(obj)) {
			LOG.log("injecting array:", obj);
			var params = [];
			for (var i = 0 ; i < obj.length - 1 ; i++) {
				params[i] = searchDependency(obj[i], contextualDependencies, executionContext);
			}
			return obj[obj.length -1].apply(executionContext, params);
		} else {
			var executor = executors[containerType] || defaultExecutor;
			return executor(obj, executionContext);
		}
	}

	return exports;
});