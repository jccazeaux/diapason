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
	var automaticDependencies = {};
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
		return function(name, injectionObj) {
			if (injectionObj === undefined) {
				return containers[injectType][name];
			}
			LOG.log("adding " + name + " to " + injectType);
			if (!overwrites && containers[injectType][name] != null) {
				throw "Object " + name + " already exists in container " + injectType + ".";
			}
			containers[injectType][name] = {name:name, obj: injectionObj, scope:"singleton"};
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
	 * @return carburator.config - fluent style
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
	 * @return carburator.config - fluent style
	 */
	exports.config.executor = function(containerType, executorFn) {
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
	 * @return carburator.config - fluent style
	 */
	exports.config.automaticDependencies = function(containerType, fn) {
		automaticDependencies[containerType] = fn;
		return this;
	};

	/**
	 * Toggles debug mode
	 * @param {boolean} active
	 * @return carburator.config - fluent style
	 */
	exports.config.debug = function(active) {
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
	 * @return carburator.config - fluent style
	 */
	exports.config.overwrites = function(active) {
		overwrites = active;
		return this;
	};

	/**
	 * Select containers for injection
	 * @param {Array} selectedContainers - Array of containers names
	 * @return {Object} Object containing inject function restricted to the selected containers
	 */
	exports.selectContainers = function(selectedContainers) {
		return {
			inject: function(obj, contextualDependencies, executionContext) {
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
	exports.inject = function(obj, contextualDependencies, executionContext) {
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
			var params = [];
			for (var i = 0 ; i < obj.length - 1 ; i++) {
				if (contextualDependencies != null && contextualDependencies[obj[i]] !== undefined) {
					params[i] = contextualDependencies[obj[i]];
				} else {
					params[i] = searchDependency(obj[i], selectedContainers);
				}
			}
			return obj[obj.length -1].apply(executionContext, params);
		} else if (typeof obj === "function") {
			LOG.log("injecting function:", obj);
			return obj.call(executionContext);
		} else {
			LOG.log("injecting obj:", obj);
			return obj;			
		}
	}

	/**
	 * Reset : will remove a complete container, including its injection function
	 * @param {String} containerToClear - Container name to reset
	 * @return Carburator - fluent style
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
	 * clear : will clear a container
	 * @param {String} containerToClear - Container name to reset
	 * @return Carburator - fluent style
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
					injectionFound.instance = injectDependency(injectionFound.name, injectionFound.obj, containerFound, selectedContainers);
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
	 * @param {Object} contextualDependencies - contextual dependencies
	 */
	function injectDependency(name, obj, containerType, selectedContainers) {
		if (isDependencySyntax(obj)) {
			LOG.log("injecting array:", obj);
			var params = [];
			var autoDependencies = automaticDependencies[containerType];
			for (var i = 0 ; i < obj.length - 1 ; i++) {
				if (autoDependencies && autoDependencies[obj[i]]) {
					params[i] = autoDependencies[obj[i]](name);
				} else {
					params[i] = searchDependency(obj[i], selectedContainers);
				}
			}
			return obj[obj.length -1].apply(null, params);
		} else {
			var executor = executors[containerType] || defaultExecutor;
			return executor(obj);
		}
	}

	return exports;
});