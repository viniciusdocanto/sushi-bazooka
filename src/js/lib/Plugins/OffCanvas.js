/* =========================================================================
 * Off-canvas
 *
 * Depends on jQuery and hammerjs.
 *
 * @TODO Option to open from right or from left
 * @TODO Support for two Off-canvases?
 * ========================================================================= */

var Sushi;

(function (Sushi, Plugins) {
	"use strict";

	var BasePlugin = Plugins.BasePlugin;

	var OffCanvas = function (triggerElement, options) {
		BasePlugin.call(this, triggerElement, options);

		this.isOpen = false;

		this.options.container.hammer();
		this.options.container.addClass("o-offCanvas");

		this.createOverlay();
		this.registerListeners();
	};

	OffCanvas.DEFAULTS = {
		lockScrollWhileOpen: false,
		overlayContainer: document.body,
	};

	OffCanvas.prototype = Object.create(BasePlugin.prototype);

	var proto = OffCanvas.prototype;

	proto.constructor = OffCanvas;

	proto.createOverlay = function () {
		this.overlay = $("<div class=\"o-offCanvasOverlay\"/>");

		if (this.options.overlayExtraClasses) {
			this.overlay.addClass(this.options.overlayExtraClasses);
		}

		this.overlay.hammer();
		this.overlay.appendTo(this.options.overlayContainer);
	};

	proto.toggleContainer = function () {
		if (this.options.container.hasClass("is-open")) {
			this.closeContainer();
		}
		else {
			this.openContainer();
		}
	};

	proto.openContainer = function () {
		var event = $.Event("open.OffCanvas");

		event.OffCanvas = this;

		this.options.container.trigger(event);

		if (this.options.lockScrollWhileOpen) {
			Sushi.BodyScroll.lock(this.id);
		}

		$("html").addClass("has-offCanvasOpen");

		this.triggerElement.classList.add("is-active");
		this.options.container.classList.add("is-open");

		this.isOpen = true;
	};

	proto.closeContainer = function () {
		this.options.container.removeClass("is-open");

		var event = $.Event("close.OffCanvas");

		event.OffCanvas = this;

		setTimeout(function () {
			if (this.options.lockScrollWhileOpen) {
				Sushi.BodyScroll.unlock(this.id);
			}

			$("html").removeClass("has-offCanvasOpen");

			this.toggle.removeClass("is-active");

			this.options.container.trigger(event);
		}.bind(this));

		this.isOpen = true;
	};

	proto.registerListeners = function () {
		var that = this;

		this.toggle.on("click.OffCanvas", function (event) {
			event.preventDefault();

			that.toggleContainer();
		});

		this.overlay.on("tap.OffCanvas", $.proxy(this.closeContainer, this));
	};

	proto.panStart = function () {
		this.isPanning = true;
		this.options.container.addClass("is-panning");
	};

	proto.pan = function (event) {
		if (this.isPanning) {
			var translate;
			var containerWidth = this.options.container.width();

			if (event.gesture.deltaX > 0) {
				translate = 0;
			}
			else {
				translate = ((100 / containerWidth) * event.gesture.deltaX);
			}

			this.translate = translate;

			this.options.container.css({
				"-webkit-transform": "translateX(" + translate + "%)",
				"-moz-transform": "translateX(" + translate + "%)",
				"transform": "translateX(" + translate + "%)",
			});
		}
	};

	proto.panEnd = function () {
		this.isPanning = false;
		this.options.container.removeClass("is-panning");

		this.options.container.removeAttr("style");

		if (this.translate < -75) {
			this.closeContainer();
		}
	};

	Plugins.OffCanvas = OffCanvas;
})(Sushi || (Sushi = {}), Sushi.Plugins || (Sushi.Plugins = {}));
