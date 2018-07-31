/* =========================================================================
 * Styled Select
 * ========================================================================= */

var Sushi;

(function (Sushi, Plugins) {
	"use strict";

	var BasePlugin = Plugins.BasePlugin;
	var Dom = Sushi.Dom;
	var Events = Sushi.Events;
	var Dropdown = Plugins.Dropdown;
	var Util = Sushi.Util;

	function getOptionLabel(optionElement) {
		return optionElement.title || optionElement.label;
	}

	var StyledSelect = function (triggerElement, options) {
		BasePlugin.call(this, triggerElement, options);

		this.isMultiple = (this.triggerElement.getAttribute("multiple") !== null);

		this.createContainer();
		this.registerListeners();
	};

	StyledSelect.displayName = "StyledSelect";

	StyledSelect.DEFAULTS = {
		bare: false,
		hideSelected: false,
		hideNull: false,
		extraClasses: "",
		multipleSeparator: ", ",
	};

	StyledSelect.prototype = Object.create(BasePlugin.prototype);

	var proto = StyledSelect.prototype;

	proto.constructor = StyledSelect;

	proto.createContainer = function () {
		this.containerElement = Dom.parseOne("<div class='c-styledSelect'>");

		this.buttonElement = Dom.parseOne(
			"<button class='c-styledSelect__button' type='button'>"
		);

		this.triggerElement.classList.add("c-styledSelect__select");
		this.triggerElement.setAttribute("tabindex", "-99");

		if (this.options.bare) {
			this.containerElement.classList.add("c-styledSelect--bare");
		}

		// Add the container after the select
		this.triggerElement.parentNode.insertBefore(
			this.containerElement,
			this.triggerElement.nextSibling
		);

		// Move the select to the container
		this.containerElement.appendChild(this.triggerElement);



		// Dropdown
		// ---------------------------

		this.dropdownElement = Dom.parseOne("<ul class='c-styledSelect__dropdown o-dropdown'>");

		this.updateOptions();

		// Append new elements
		this.containerElement.appendChild(this.buttonElement);
		this.containerElement.appendChild(this.dropdownElement);

		this.dropdown = new Dropdown(this.containerElement, {
			triggerEvent: "click",
			closeOnSelect: !this.isMultiple,
			closeIntentionTimeout: 0,
		});

		if (this.options.extraClasses) {
			Dom.addClass(this.dropdownElement, this.options.extraClasses);
			Dom.addClass(this.buttonElement, this.options.extraClasses);
		}
	};

	proto.registerListeners = function () {
		Events(this.triggerElement)
			.on("StyledSelect.change", this.updateSelectedOptions.bind(this));

		Events(this.buttonElement)
			.on("StyledSelect.focus", this.enableKeyDownListener.bind(this))
			.on("StyledSelect.blur", this.disableKeyDownListener.bind(this));

		Events(this.dropdown.triggerElement)
			.on("StyledSelect.open", this.handleDropdownOpen.bind(this))
			.on("StyledSelect.close", this.disableKeyDownListener.bind(this));
	};

	proto.enableKeyDownListener = function () {
		Events(document)
			.off("StyledSelect.keydown")
			.on("StyledSelect.keydown", this.handleKeyDown.bind(this));
	};

	proto.disableKeyDownListener = function () {
		if (!this.dropdown.isOpen) {
			Events(document).off("StyledSelect.keydown");
		}
	};

	proto.handleDropdownOpen = function () {
		var currentItem = (
			Dom.queryOne(".c-styledSelect__item.is-current", this.dropdownElement)
			|| Dom.queryOne(".c-styledSelect__item", this.dropdownElement)
		);

		setTimeout(function () {
			currentItem.focus();
		}, Util.Css.getMaxTransitionDuration(this.dropdownElement));
	};

	/**
	 *
	 * Tab: 9
	 * Enter: 13
	 * ESC: 27
	 * Space: 32
	 * Arrow Up: 38
	 * Arrow Down: 40
	 *
	 * @param event
	 */
	proto.handleKeyDown = function (event) {
		if (([9, 13, 27, 32, 38, 40].indexOf(event.keyCode) === -1)) {
			return;
		}

		if (this.dropdown.isOpen) {
			var activeElement = document.activeElement;

			event.preventDefault();

			switch (event.keyCode) {
				// esc
				case 27:
					this.dropdown.close();
					this.buttonElement.focus();

					break;

				// arrow up
				case 38:
					(activeElement.previousSibling || activeElement.parentNode.lastChild).focus();

					break;

				// arrow down
				case 40:
					(activeElement.nextSibling || activeElement.parentNode.firstChild).focus();

					break;

				// tab, enter or space
				case 9:
				case 13:
				case 32:
					if (this.isMultiple) {
						var itemElement = activeElement.closest(".c-styledSelect__item");
						var checkboxElement = Dom.queryOne(
							".c-styledSelect__checkbox",
							itemElement
						);

						checkboxElement.checked = !checkboxElement.checked;

						Events(checkboxElement).trigger("change");
					}
					else {
						Events(activeElement.closest(".c-styledSelect__item")).trigger("click");
						this.buttonElement.focus();
					}

					break;
			}
		}
		// space, arrow up and arrow down open the select
		else if ([38, 40, 32].indexOf(event.keyCode) !== -1) {
			event.preventDefault();

			this.dropdown.open();
		}
	};

	/**
	 * Handles clicks in dropdown items
	 *
	 * Expects the current styled select to be single.
	 *
	 * @param event
	 */
	proto.handleItemClick = function (event) {
		var itemElement = event.target.closest(".c-styledSelect__item");
		var itemValue = itemElement.dataset.value;
		var selectedOption = this.triggerElement.selectedOptions[0] || {};

		if ((itemValue !== void 0) && (itemValue !== selectedOption.value)) {
			this.triggerElement.value = itemValue;

			Events(this.triggerElement).trigger("change");
		}
	};

	proto.handleCheckboxChange = function (event) {
		var itemElement = event.target.closest(".c-styledSelect__item");
		var itemValue = itemElement.dataset.value;
		var optionElement = Dom.queryOne("option[value='" + itemValue + "']", this.triggerElement);
		var checkboxElement = Dom.queryOne(
			".c-styledSelect__checkbox",
			itemElement
		);

		optionElement.selected = checkboxElement.checked;

		itemElement.focus();

		this.updateSelectedOptions();
	};

	proto.registerItemListeners = function () {
		if (this.isMultiple) {
			Events(Dom.query(".c-styledSelect__checkbox", this.dropdownElement))
				.on("StyledSelect.change", this.handleCheckboxChange.bind(this));
		}
		else {
			Events(Dom.query(".c-styledSelect__item", this.dropdownElement))
				.on("StyledSelect.click", this.handleItemClick.bind(this));
		}
	};

	proto.updateOptions = function () {
		var options = this.triggerElement.getElementsByTagName("option");

		Events(this.dropdownElement.getElementsByClassName("c-styledSelect__item"))
			.off("StyledSelect.click");

		this.dropdownOptions = [];

		for (var i = 0; i < options.length; i++) {
			var option = options[i];
			var title;
			var itemElement = document.createElement("li");
			var titleElement;

			if (option.dataset.title !== void 0) {
				title = option.dataset.title;
			}
			else {
				title = option.innerHTML;
			}

			itemElement.classList.add("c-styledSelect__item");
			itemElement.setAttribute("tabindex", "0");
			itemElement.dataset.value = option.value;

			if (this.isMultiple) {
				var checkboxId = Util.uniqueId("__sushiStyledSelectCheckbox");
				var checkboxHtml = "<input type='checkbox' id='" + checkboxId + "' tabindex='-99'>";
				var checkboxElement = Dom.parseOne(checkboxHtml);

				Dom.addClass(checkboxElement, [
					"c-styledSelect__checkbox",
					"o-choiceInput__input",
					"o-choiceInput__input--checkbox",
				]);

				titleElement = Dom.parseOne("<label for='" + checkboxId + "'>");

				titleElement.classList.add("o-choiceInput__label");

				itemElement.classList.add("o-choiceInput");
				itemElement.appendChild(checkboxElement);
			}
			else {
				titleElement = document.createElement("div");
			}

			titleElement.classList.add("c-styledSelect__itemTitle");
			titleElement.innerHTML = title;

			itemElement.appendChild(titleElement);

			this.dropdownOptions.push(itemElement);
		}

		this.dropdownElement.innerHTML = "";

		for (var j = 0; j < this.dropdownOptions.length; j++) {
			var optionElement = this.dropdownOptions[j];

			this.dropdownElement.appendChild(optionElement);
		}

		this.updateSelectedOptions();
		this.registerItemListeners();
	};

	proto.updateSelectedOptions = function () {
		var selectedOptions = this.triggerElement.selectedOptions;

		this.availableOptions = this.triggerElement.getElementsByTagName("option");

		for (var i = 0; i < this.dropdownOptions.length; i++) {
			var dropdownElement = this.dropdownOptions[i];
			var optionElement = this.availableOptions[i];

			if (this.options.hideNull && (dropdownElement.dataset.value === "")) {
				dropdownElement.classList.add("_hidden");
			}
			else if (Array.prototype.slice.call(selectedOptions).includes(optionElement)) {
				dropdownElement.classList.add("is-current");

				if (this.options.hideSelected) {
					dropdownElement.classList.add("_hidden");
				}
			}
			else {
				dropdownElement.classList.remove("is-current");
			}
		}

		Events(this.triggerElement).trigger("update");

		this.updateButtonLabel();
	};

	proto.updateButtonLabel = function () {
		var label;

		if (this.isMultiple) {
			var selectedOptionLabels = [];

			for (var i = 0; i < this.triggerElement.selectedOptions.length; i++) {
				selectedOptionLabels.push(
					this.triggerElement.selectedOptions[i].title
					|| this.triggerElement.selectedOptions[i].label
				);
			}

			label = selectedOptionLabels.join(this.options.multipleSeparator);
		}
		else if (this.triggerElement.selectedOptions[0] !== void 0) {
			label = getOptionLabel(this.triggerElement.selectedOptions[0]);
		}

		if (!label) {
			label = getOptionLabel(this.availableOptions[0]);
		}

		this.buttonElement.innerHTML = label;
	};

	Plugins.StyledSelect = StyledSelect;
})(Sushi || (Sushi = {}), Sushi.Plugins || (Sushi.Plugins = {}));
