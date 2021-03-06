/* ==============================================================================================
 * EVENTS
 * ============================================================================================== */

var Sushi;

(function (Sushi) {
	"use strict";

	var eventStack = new Map();

	var Events = function (target) {
		var EventHelper = function (target) {
			this.target = target;
		};

		var proto = EventHelper.prototype;

		proto.on = function (types, fn) {
			Events.on(types, this.target, fn);

			return this;
		};

		proto.one = function (types, fn) {
			Events.one(types, this.target, fn);

			return this;
		};

		proto.off = function (types, fn) {
			Events.off(types, this.target, fn);

			return this;
		};

		proto.trigger = function (types, data) {
			Events.trigger(types, this.target, data);

			return this;
		};

		return new EventHelper(target);
	};


	/**
	 * Parse targets and always return an array-like object
	 *
	 * @param target NodeList|HTMLCollection|Element
	 * @returns NodeList|HTMLCollection|Array
	 */
	var parseTargets = function (target) {
		target = target || null;

		if (Sushi.Dom.isIterable(target)) {
			return target;
		}
		else if ((target !== null) && (target.addEventListener !== void 0)) {
			return [target];
		}
		else {
			throw new TypeError(
				"The target parameter should be either an instance of Element, HTMLCollection,"
				+ " NodeList or any other element that can have listeners attached."
			);
		}
	};


	/**
	 * Adds multiple event listeners to a given element
	 *
	 * @private
	 * @param types String
	 * @param target Element
	 * @param fn Function
	 */
	var addListeners = function (types, target, fn) {
		if (target === void 0) {
			throw Error("Target is undefined.");
		}

		var typeList = (typeof types === "string") ? types.split(" ") : types;

		if (!Array.isArray(typeList)) {
			throw Error("Types must be a string or an array.");
		}

		var events = eventStack.get(target);

		if (events === void 0) {
			eventStack.set(target, {});
			events = eventStack.get(target);
		}

		for (var i = 0; i < typeList.length; i++) {
			var namespaceArray = typeList[i].split(".");

			events[typeList[i]] = (events[typeList[i]] || []);
			events[typeList[i]].push(fn);

			while (namespaceArray.length > 0) {
				var typeString = namespaceArray.join(".");

				target.addEventListener(typeString, fn);

				namespaceArray.shift();
			}
		}
	};


	/**
	 * Removes multiple event listeners from a given target
	 *
	 * @private
	 * @param types String
	 * @param target Element
	 * @param fn Function
	 */
	var removeListeners = function (types, target, fn) {
		if (target === void 0) {
			throw Error("Target is undefined.");
		}

		var typeList = (typeof types === "string") ? types.split(" ") : types;

		if (!Array.isArray(typeList)) {
			throw Error("Types must be a string or an array.");
		}

		var events = eventStack.get(target);

		if (events === void 0) {
			return;
		}

		for (var i = 0; i < typeList.length; i++) {
			var typeString = typeList[i];
			var type = typeString.split(".").pop();
			var namespaceRegex = new RegExp(
				"(^|\\.)" + Sushi.Util.escapeRegExp(typeString) + "$"
			);

			for (var namespace in events) {
				if (events.hasOwnProperty(namespace) && namespaceRegex.test(namespace)) {
					var j = events[namespace].length;

					while (j--) {
						var storedFunction = events[namespace][j];

						if ((fn !== void 0) && (fn !== storedFunction)) {
							continue;
						}

						target.removeEventListener(type, storedFunction);
						events[namespace].splice(j, 1);
					}

					if (events[namespace].length === 0) {
						delete events[namespace];

						if (Object.keys(events).length === 0) {
							eventStack.delete(target);
						}
					}
				}
			}
		}
	};


	/**
	 * Trigger multiple events in the given target
	 *
	 * @param types String
	 * @param target Element
	 * @param data Object
	 */
	var triggerEvents = function (types, target, data) {
		var typeList = types.split(" ");

		for (var i = 0; i < typeList.length; i++) {
			var event;
			var eventName = typeList[i];

			if (typeof window.CustomEvent === "function") {
				event = new window.CustomEvent(eventName, {
					detail: data,
					bubbles: true,
				});
			}
			else if (document.createEvent) {
				event = document.createEvent("CustomEvent");
				event.initCustomEvent(eventName, true, true, data);
			}

			event.eventName = eventName;

			target.dispatchEvent(event, data);
		}
	};


	/**
	 * Traverses the target list and invokes the selected private handler
	 *
	 * @param handler Function
	 * @param types String
	 * @param targets Element
	 * @param fn Function
	 */
	var traverse = function (handler, types, targets, fn) {
		var elementList = parseTargets(targets);

		for (var i = 0; i < elementList.length; i++) {
			var element = elementList[i];

			if (Sushi.Dom.isIterable(element)) {
				traverse(handler, types, element, fn);
			}
			else {
				handler(types, element, fn);
			}
		}
	};


	/**
	 * Adds an event listener to one or more elements
	 *
	 * @param types String
	 * @param targets Element
	 * @param fn Function
	 */
	Events.on = function (types, targets, fn) {
		traverse(addListeners, types, targets, fn);
	};


	/**
	 * Adds an event listener to be run only once on one or more elements
	 *
	 * @param types String
	 * @param targets Element
	 * @param fn Function
	 */
	Events.one = function (types, targets, fn) {
		var oneFunction = function (event) {
			fn.call(this, event);
			traverse(removeListeners, types, this, oneFunction);
		};

		traverse(addListeners, types, targets, oneFunction);
	};


	/**
	 * Removes an event listener from one or more elements
	 *
	 * @param types String
	 * @param targets Element
	 * @param fn Function
	 */
	Events.off = function (types, targets, fn) {
		traverse(removeListeners, types, targets, fn);
	};


	Events.trigger = function (types, target, data) {
		traverse(triggerEvents, types, target, data);
	};


	Events.clone = function (target, clonedTarget) {
		var events = eventStack.get(target);

		for (var eventType in events) {
			if (events.hasOwnProperty(eventType)) {
				var functionStack = events[eventType];

				for (var i = 0; i < functionStack.length; i++) {
					var fn = functionStack[i];

					Events.on(eventType, clonedTarget, fn);
				}
			}
		}
	};


	Events.getEventStack = function () {
		return eventStack;
	};

	Sushi.Events = Events;
})(Sushi || (Sushi = {}));
