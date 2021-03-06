/* ==============================================================================================
 * CHASER
 * ============================================================================================== */

var Sushi;

(function (Sushi, Plugins) {
	"use strict";

	var BasePlugin = Plugins.BasePlugin;

	var Css = Sushi.Util.Css;
	var Dom = Sushi.Dom;
	var Events = Sushi.Events;
	var Util = Sushi.Util;

	var Chaser = function (triggerElement, options) {
		BasePlugin.call(this, triggerElement, options);

		this.isEnabled = false;

		this.placeholder = Dom.get(this.options.placeholder); // cache placeholder object

		this.triggerElement.insertAdjacentElement("afterend", this.placeholder);
		this.triggerElement.classList.add("o-chaser");

		this.proxyEvents();

		this.scrollTrigger = this.getScrollTriggerInstance();

		this.parseLimit();
		this.enable();
		this.update();
	};

	Chaser.displayName = "Chaser";

	Chaser.DEFAULTS = Object.assign({}, Plugins.ScrollTrigger.DEFAULTS, {
		placeholder: "<i class=\"o-chaserPlaceholder\">",
		updatePlaceholderHeight: true,
		updateThreshold: 30,
		offset: 0,
		limit: null,
		usePlaceholderWidth: false,
	});

	Chaser.prototype = Object.create(BasePlugin.prototype);

	var proto = Chaser.prototype;

	proto.constructor = Chaser;

	proto.enable = function () {
		if (this.isEnabled) {
			return;
		}

		this.isEnabled = true;

		this.scrollTrigger.enable();

		Events(window).on(
			this.id + ".Chaser.resize " + this.id + ".Chaser.scroll",
			Sushi.Util.throttle(this.update.bind(this), this.options.updateThreshold)
		);
	};

	proto.disable = function () {
		if (!this.isEnabled) {
			return;
		}

		this.isEnabled = false;

		this.scrollTrigger.disable();

		Events(window).off(this.id + ".Chaser.resize " + this.id + ".Chaser.scroll");
	};

	proto.proxyEvents = function () {
		var eventBefore = this.options.eventBefore;
		var eventAfter = this.options.eventAfter;

		this.options.eventBefore = function () {
			this.triggerElement.style.top = "auto";

			this.triggerElement.classList.remove("is-chasing");

			this.runEvent(eventBefore);
		}.bind(this);

		this.options.eventAfter = function (scrollTrigger) {
			this.triggerElement.style.top = (- scrollTrigger.getOffset()) + "px";

			this.triggerElement.classList.add("is-chasing");

			this.runEvent(eventAfter);
		}.bind(this);
	};

	proto.runEvent = function (fn) {
		if (typeof fn === "string") {
			fn = Sushi.Actions.parseController(fn);
		}

		if (typeof fn === "function") {
			fn(this);
		}
	};

	proto.parseLimit = function () {
		// Early return if it's null or undefined
		if (this.options.limit == null) {
			return;
		}

		var number = Number(this.options.limit);

		// Return if it's a number (incl. strings of numbers)
		if (!isNaN(number)) {
			this.options.limit = number;

			return;
		}

		var limitElement = Dom.get(this.options.limit);

		if (limitElement === null) {
			return;
		}

		this.options.limit = function () {
			return Util.Css.getOffset(limitElement).top - this.placeholder.clientHeight;
		}.bind(this);
	};

	proto.update = function () {
		if (this.options.updatePlaceholderHeight) {
			this.updatePlaceholderHeight();
		}

		this.updateLimit();

		if (this.options.usePlaceholderWidth) {
			this.updateMaxWidth();
		}
	};

	proto.updateLimit = function () {
		if (this.options.limit == null) {
			return;
		}

		var limitPosition = this.options.limit;

		if (typeof this.options.limit === "function") {
			limitPosition = this.options.limit();
		}

		if (limitPosition + this.scrollTrigger.getOffset() - window.scrollY < 0) {
			this.triggerElement.classList.add("is-limited");
			this.triggerElement.style.transform = "translateY(" + (
				limitPosition
				+ this.scrollTrigger.getOffset()
				- Util.Css.getOffset(this.placeholder).top
			) + "px)";
		}
		else {
			this.triggerElement.classList.remove("is-limited");
			this.triggerElement.style.transform = "";
		}
	};

	proto.updatePlaceholderHeight = function () {
		this.placeholder.style.height = Css.getHeight(this.triggerElement, true) + "px";
	};

	proto.updateMaxWidth = function () {
		this.triggerElement.style.maxWidth = window.getComputedStyle(this.placeholder).width;
	};

	proto.getScrollTriggerInstance = function () {
		var options = {};

		for (var optionKey in Plugins.ScrollTrigger.DEFAULTS) {
			if (Plugins.ScrollTrigger.DEFAULTS.hasOwnProperty(optionKey)) {
				options[optionKey] = this.options[optionKey];
			}
		}

		return new Plugins.ScrollTrigger(this.placeholder, options);
	};

	Plugins.Chaser = Chaser;
})(Sushi || (Sushi = {}), Sushi.Plugins || (Sushi.Plugins = {}));
