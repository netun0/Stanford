/*
 * Copyright (C) 2007, 2008 Apple Inc.  All rights reserved.
 * Copyright (C) 2008 Matt Lilek <webkit@mattlilek.com>
 * Copyright (C) 2009 Joseph Pecoraro
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @extends {WebInspector.SidebarPane}
 */
WebInspector.EventListenersSidebarPane = function()
{
    WebInspector.SidebarPane.call(this, WebInspector.UIString("Event Listeners"));
    this.bodyElement.addStyleClass("events-pane");

    this.sections = [];

    this.settingsSelectElement = document.createElement("select");
    this.settingsSelectElement.className = "select-filter";

    var option = document.createElement("option");
    option.value = "all";
    option.label = WebInspector.UIString("All Nodes");
    this.settingsSelectElement.appendChild(option);

    option = document.createElement("option");
    option.value = "selected";
    option.label = WebInspector.UIString("Selected Node Only");
    this.settingsSelectElement.appendChild(option);

    var filter = WebInspector.settings.eventListenersFilter.get();
    if (filter === "all")
        this.settingsSelectElement[0].selected = true;
    else if (filter === "selected")
        this.settingsSelectElement[1].selected = true;
    this.settingsSelectElement.addEventListener("click", function(event) { event.consume() }, false);
    this.settingsSelectElement.addEventListener("change", this._changeSetting.bind(this), false);

    this.titleElement.appendChild(this.settingsSelectElement);

    this._linkifier = new WebInspector.Linkifier();
}

WebInspector.EventListenersSidebarPane._objectGroupName = "event-listeners-sidebar-pane";

WebInspector.EventListenersSidebarPane.prototype = {
    update: function(node)
    {
        RuntimeAgent.releaseObjectGroup(WebInspector.EventListenersSidebarPane._objectGroupName);
        this._linkifier.reset();

        var body = this.bodyElement;
        body.removeChildren();
        this.sections = [];

        var self = this;
        function callback(error, eventListeners) {
            if (error)
                return;

            var selectedNodeOnly = "selected" === WebInspector.settings.eventListenersFilter.get();
            var sectionNames = [];
            var sectionMap = {};
            for (var i = 0; i < eventListeners.length; ++i) {
                var eventListener = eventListeners[i];
                if (selectedNodeOnly && (node.id !== eventListener.nodeId))
                    continue;
                eventListener.node = WebInspector.domAgent.nodeForId(eventListener.nodeId);
                delete eventListener.nodeId; // no longer needed
                if (/^function _inspectorCommandLineAPI_logEvent\(/.test(eventListener.handlerBody.toString()))
                    continue; // ignore event listeners generated by monitorEvent
                var type = eventListener.type;
                var section = sectionMap[type];
                if (!section) {
                    section = new WebInspector.EventListenersSection(type, node.id, self._linkifier);
                    sectionMap[type] = section;
                    sectionNames.push(type);
                    self.sections.push(section);
                }
                section.addListener(eventListener);
            }

            if (sectionNames.length === 0) {
                var div = document.createElement("div");
                div.className = "info";
                div.textContent = WebInspector.UIString("No Event Listeners");
                body.appendChild(div);
                return;
            }

            sectionNames.sort();
            for (var i = 0; i < sectionNames.length; ++i) {
                var section = sectionMap[sectionNames[i]];
                body.appendChild(section.element);
            }
        }

        if (node)
            node.eventListeners(callback);
        this._selectedNode = node;
    },

    willHide: function()
    {
        delete this._selectedNode;
    },

    _changeSetting: function()
    {
        var selectedOption = this.settingsSelectElement[this.settingsSelectElement.selectedIndex];
        WebInspector.settings.eventListenersFilter.set(selectedOption.value);
        this.update(this._selectedNode);
    }
}

WebInspector.EventListenersSidebarPane.prototype.__proto__ = WebInspector.SidebarPane.prototype;

/**
 * @constructor
 * @extends {WebInspector.PropertiesSection}
 */
WebInspector.EventListenersSection = function(title, nodeId, linkifier)
{
    this.eventListeners = [];
    this._nodeId = nodeId;
    this._linkifier = linkifier;
    WebInspector.PropertiesSection.call(this, title);

    // Changed from a Properties List
    this.propertiesElement.parentNode.removeChild(this.propertiesElement);
    delete this.propertiesElement;
    delete this.propertiesTreeOutline;

    this._eventBars = document.createElement("div");
    this._eventBars.className = "event-bars";
    this.element.appendChild(this._eventBars);
}

WebInspector.EventListenersSection.prototype = {
    addListener: function(eventListener)
    {
        var eventListenerBar = new WebInspector.EventListenerBar(eventListener, this._nodeId, this._linkifier);
        this._eventBars.appendChild(eventListenerBar.element);
    }
}

WebInspector.EventListenersSection.prototype.__proto__ = WebInspector.PropertiesSection.prototype;

/**
 * @constructor
 * @extends {WebInspector.ObjectPropertiesSection}
 */
WebInspector.EventListenerBar = function(eventListener, nodeId, linkifier)
{
    WebInspector.ObjectPropertiesSection.call(this);

    this.eventListener = eventListener;
    this._nodeId = nodeId;
    this._setNodeTitle();
    this._setFunctionSubtitle(linkifier);
    this.editable = false;
    this.element.className = "event-bar"; /* Changed from "section" */
    this.headerElement.addStyleClass("source-code");
    this.propertiesElement.className = "event-properties properties-tree source-code"; /* Changed from "properties" */
}

WebInspector.EventListenerBar.prototype = {
    update: function()
    {
        function updateWithNodeObject(nodeObject)
        {
            var properties = [];

            if (this.eventListener.type)
                properties.push(WebInspector.RemoteObjectProperty.fromPrimitiveValue("type", this.eventListener.type));
            if (typeof this.eventListener.useCapture !== "undefined")
                properties.push(WebInspector.RemoteObjectProperty.fromPrimitiveValue("useCapture", this.eventListener.useCapture));
            if (typeof this.eventListener.isAttribute !== "undefined")
                properties.push(WebInspector.RemoteObjectProperty.fromPrimitiveValue("isAttribute", this.eventListener.isAttribute));
            if (nodeObject)
                properties.push(new WebInspector.RemoteObjectProperty("node", nodeObject));
            if (typeof this.eventListener.handlerBody !== "undefined")
                properties.push(WebInspector.RemoteObjectProperty.fromPrimitiveValue("listenerBody", this.eventListener.handlerBody));
            if (this.eventListener.location) {
                properties.push(WebInspector.RemoteObjectProperty.fromPrimitiveValue("sourceName", this.eventListener.location.scriptId));
                properties.push(WebInspector.RemoteObjectProperty.fromPrimitiveValue("lineNumber", this.eventListener.location.lineNumber));
            }

            this.updateProperties(properties);
        }
        WebInspector.RemoteObject.resolveNode(this.eventListener.node, WebInspector.EventListenersSidebarPane._objectGroupName, updateWithNodeObject.bind(this));
    },

    _setNodeTitle: function()
    {
        var node = this.eventListener.node;
        if (!node)
            return;

        if (node.nodeType() === Node.DOCUMENT_NODE) {
            this.titleElement.textContent = "document";
            return;
        }

        if (node.id === this._nodeId) {
            this.titleElement.textContent = node.appropriateSelectorFor();
            return;
        }

        this.titleElement.removeChildren();
        this.titleElement.appendChild(WebInspector.DOMPresentationUtils.linkifyNodeReference(this.eventListener.node));
    },

    _setFunctionSubtitle: function(linkifier)
    {
        // Requires that Function.toString() return at least the function's signature.
        if (this.eventListener.location) {
            this.subtitleElement.removeChildren();
            // FIXME(62725): eventListener.location should be a debugger Location.
            var url = this.eventListener.location.scriptId;
            var lineNumber = this.eventListener.location.lineNumber - 1;
            var columnNumber = 0;
            var urlElement = linkifier.linkifyLocation(url, lineNumber, columnNumber);
            this.subtitleElement.appendChild(urlElement);
        } else {
            var match = this.eventListener.handlerBody.match(/function ([^\(]+?)\(/);
            if (match)
                this.subtitleElement.textContent = match[1];
            else
                this.subtitleElement.textContent = WebInspector.UIString("(anonymous function)");
        }
    }
}

WebInspector.EventListenerBar.prototype.__proto__ = WebInspector.ObjectPropertiesSection.prototype;
;
/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @extends {WebInspector.SidebarPane}
 */
WebInspector.MetricsSidebarPane = function()
{
    WebInspector.SidebarPane.call(this, WebInspector.UIString("Metrics"));

    WebInspector.cssModel.addEventListener(WebInspector.CSSStyleModel.Events.StyleSheetChanged, this._styleSheetOrMediaQueryResultChanged, this);
    WebInspector.cssModel.addEventListener(WebInspector.CSSStyleModel.Events.MediaQueryResultChanged, this._styleSheetOrMediaQueryResultChanged, this);
    WebInspector.domAgent.addEventListener(WebInspector.DOMAgent.Events.AttrModified, this._attributesUpdated, this);
    WebInspector.domAgent.addEventListener(WebInspector.DOMAgent.Events.AttrRemoved, this._attributesUpdated, this);
}

WebInspector.MetricsSidebarPane.prototype = {
    /**
     * @param {WebInspector.DOMNode=} node
     */
    update: function(node)
    {
        if (node)
            this.node = node;
        this._innerUpdate();
    },

    _innerUpdate: function()
    {
        // "style" attribute might have changed. Update metrics unless they are being edited
        // (if a CSS property is added, a StyleSheetChanged event is dispatched).
        if (this._isEditingMetrics)
            return;

        // FIXME: avoid updates of a collapsed pane.
        var node = this.node;

        if (!node || node.nodeType() !== Node.ELEMENT_NODE) {
            this.bodyElement.removeChildren();
            return;
        }

        function callback(style)
        {
            if (!style || this.node !== node)
                return;
            this._updateMetrics(style);
        }
        WebInspector.cssModel.getComputedStyleAsync(node.id, callback.bind(this));

        function inlineStyleCallback(style)
        {
            if (!style || this.node !== node)
                return;
            this.inlineStyle = style;
        }
        WebInspector.cssModel.getInlineStylesAsync(node.id, inlineStyleCallback.bind(this));
    },

    _styleSheetOrMediaQueryResultChanged: function()
    {
        this._innerUpdate();
    },

    _attributesUpdated: function(event)
    {
        if (this.node !== event.data.node)
            return;

        this._innerUpdate();
    },

    _getPropertyValueAsPx: function(style, propertyName)
    {
        return Number(style.getPropertyValue(propertyName).replace(/px$/, "") || 0);
    },

    _getBox: function(computedStyle, componentName)
    {
        var suffix = componentName === "border" ? "-width" : "";
        var left = this._getPropertyValueAsPx(computedStyle, componentName + "-left" + suffix);
        var top = this._getPropertyValueAsPx(computedStyle, componentName + "-top" + suffix);
        var right = this._getPropertyValueAsPx(computedStyle, componentName + "-right" + suffix);
        var bottom = this._getPropertyValueAsPx(computedStyle, componentName + "-bottom" + suffix);
        return { left: left, top: top, right: right, bottom: bottom };
    },

    _highlightDOMNode: function(showHighlight, mode, event)
    {
        event.consume();
        var nodeId = showHighlight && this.node ? this.node.id : 0;
        if (nodeId) {
            if (this._highlightMode === mode)
                return;
            this._highlightMode = mode;
            WebInspector.domAgent.highlightDOMNode(nodeId, mode);
        } else {
            delete this._highlightMode;
            WebInspector.domAgent.hideDOMNodeHighlight();
        }

        for (var i = 0; this._boxElements && i < this._boxElements.length; ++i) {
            var element = this._boxElements[i];
            if (!nodeId || mode === "all" || element._name === mode)
                element.style.backgroundColor = element._backgroundColor;
            else
                element.style.backgroundColor = "";
        }
    },

    _updateMetrics: function(style)
    {
        // Updating with computed style.
        var metricsElement = document.createElement("div");
        metricsElement.className = "metrics";
        var self = this;

        function createBoxPartElement(style, name, side, suffix)
        {
            var propertyName = (name !== "position" ? name + "-" : "") + side + suffix;
            var value = style.getPropertyValue(propertyName);
            if (value === "" || (name !== "position" && value === "0px"))
                value = "\u2012";
            else if (name === "position" && value === "auto")
                value = "\u2012";
            value = value.replace(/px$/, "");

            var element = document.createElement("div");
            element.className = side;
            element.textContent = value;
            element.addEventListener("dblclick", this.startEditing.bind(this, element, name, propertyName, style), false);
            return element;
        }

        function getContentAreaWidthPx(style)
        {
            var width = style.getPropertyValue("width").replace(/px$/, "");
            if (style.getPropertyValue("box-sizing") === "border-box") {
                var borderBox = self._getBox(style, "border");
                var paddingBox = self._getBox(style, "padding");

                width = width - borderBox.left - borderBox.right - paddingBox.left - paddingBox.right;
            }

            return width;
        }

        function getContentAreaHeightPx(style)
        {
            var height = style.getPropertyValue("height").replace(/px$/, "");
            if (style.getPropertyValue("box-sizing") === "border-box") {
                var borderBox = self._getBox(style, "border");
                var paddingBox = self._getBox(style, "padding");

                height = height - borderBox.top - borderBox.bottom - paddingBox.top - paddingBox.bottom;
            }

            return height;
        }

        // Display types for which margin is ignored.
        var noMarginDisplayType = {
            "table-cell": true,
            "table-column": true,
            "table-column-group": true,
            "table-footer-group": true,
            "table-header-group": true,
            "table-row": true,
            "table-row-group": true
        };

        // Display types for which padding is ignored.
        var noPaddingDisplayType = {
            "table-column": true,
            "table-column-group": true,
            "table-footer-group": true,
            "table-header-group": true,
            "table-row": true,
            "table-row-group": true
        };

        // Position types for which top, left, bottom and right are ignored.
        var noPositionType = {
            "static": true
        };

        var boxes = ["content", "padding", "border", "margin", "position"];
        var boxColors = [
            WebInspector.Color.PageHighlight.Content,
            WebInspector.Color.PageHighlight.Padding,
            WebInspector.Color.PageHighlight.Border,
            WebInspector.Color.PageHighlight.Margin,
            WebInspector.Color.fromRGBA(0, 0, 0, 0)
        ];
        var boxLabels = [WebInspector.UIString("content"), WebInspector.UIString("padding"), WebInspector.UIString("border"), WebInspector.UIString("margin"), WebInspector.UIString("position")];
        var previousBox = null;
        this._boxElements = [];
        for (var i = 0; i < boxes.length; ++i) {
            var name = boxes[i];

            if (name === "margin" && noMarginDisplayType[style.getPropertyValue("display")])
                continue;
            if (name === "padding" && noPaddingDisplayType[style.getPropertyValue("display")])
                continue;
            if (name === "position" && noPositionType[style.getPropertyValue("position")])
                continue;

            var boxElement = document.createElement("div");
            boxElement.className = name;
            boxElement._backgroundColor = boxColors[i].toString("original");
            boxElement._name = name;
            boxElement.style.backgroundColor = boxElement._backgroundColor;
            boxElement.addEventListener("mouseover", this._highlightDOMNode.bind(this, true, name === "position" ? "all" : name), false);
            this._boxElements.push(boxElement);

            if (name === "content") {
                var widthElement = document.createElement("span");
                widthElement.textContent = getContentAreaWidthPx(style);
                widthElement.addEventListener("dblclick", this.startEditing.bind(this, widthElement, "width", "width", style), false);

                var heightElement = document.createElement("span");
                heightElement.textContent = getContentAreaHeightPx(style);
                heightElement.addEventListener("dblclick", this.startEditing.bind(this, heightElement, "height", "height", style), false);

                boxElement.appendChild(widthElement);
                boxElement.appendChild(document.createTextNode(" \u00D7 "));
                boxElement.appendChild(heightElement);
            } else {
                var suffix = (name === "border" ? "-width" : "");

                var labelElement = document.createElement("div");
                labelElement.className = "label";
                labelElement.textContent = boxLabels[i];
                boxElement.appendChild(labelElement);

                boxElement.appendChild(createBoxPartElement.call(this, style, name, "top", suffix));
                boxElement.appendChild(document.createElement("br"));
                boxElement.appendChild(createBoxPartElement.call(this, style, name, "left", suffix));

                if (previousBox)
                    boxElement.appendChild(previousBox);

                boxElement.appendChild(createBoxPartElement.call(this, style, name, "right", suffix));
                boxElement.appendChild(document.createElement("br"));
                boxElement.appendChild(createBoxPartElement.call(this, style, name, "bottom", suffix));
            }

            previousBox = boxElement;
        }

        metricsElement.appendChild(previousBox);
        metricsElement.addEventListener("mouseover", this._highlightDOMNode.bind(this, false, ""), false);
        this.bodyElement.removeChildren();
        this.bodyElement.appendChild(metricsElement);
    },

    startEditing: function(targetElement, box, styleProperty, computedStyle)
    {
        if (WebInspector.isBeingEdited(targetElement))
            return;

        var context = { box: box, styleProperty: styleProperty, computedStyle: computedStyle };
        var boundKeyDown = this._handleKeyDown.bind(this, context, styleProperty);
        context.keyDownHandler = boundKeyDown;
        targetElement.addEventListener("keydown", boundKeyDown, false);

        this._isEditingMetrics = true;

        var config = new WebInspector.EditingConfig(this.editingCommitted.bind(this), this.editingCancelled.bind(this), context);
        WebInspector.startEditing(targetElement, config);

        window.getSelection().setBaseAndExtent(targetElement, 0, targetElement, 1);
    },

    _handleKeyDown: function(context, styleProperty, event)
    {
        var element = event.currentTarget;

        function finishHandler(originalValue, replacementString)
        {
            this._applyUserInput(element, replacementString, originalValue, context, false);
        }

        function customNumberHandler(number)
        {
            if (styleProperty !== "margin" && number < 0)
                number = 0;
            return number;
        }

        WebInspector.handleElementValueModifications(event, element, finishHandler.bind(this), undefined, customNumberHandler);
    },

    editingEnded: function(element, context)
    {
        delete this.originalPropertyData;
        delete this.previousPropertyDataCandidate;
        element.removeEventListener("keydown", context.keyDownHandler, false);
        delete this._isEditingMetrics;
    },

    editingCancelled: function(element, context)
    {
        if ("originalPropertyData" in this && this.inlineStyle) {
            if (!this.originalPropertyData) {
                // An added property, remove the last property in the style.
                var pastLastSourcePropertyIndex = this.inlineStyle.pastLastSourcePropertyIndex();
                if (pastLastSourcePropertyIndex)
                    this.inlineStyle.allProperties[pastLastSourcePropertyIndex - 1].setText("", false);
            } else
                this.inlineStyle.allProperties[this.originalPropertyData.index].setText(this.originalPropertyData.propertyText, false);
        }
        this.editingEnded(element, context);
        this.update();
    },

    _applyUserInput: function(element, userInput, previousContent, context, commitEditor)
    {
        if (!this.inlineStyle) {
            // Element has no renderer.
            return this.editingCancelled(element, context); // nothing changed, so cancel
        }

        if (commitEditor && userInput === previousContent)
            return this.editingCancelled(element, context); // nothing changed, so cancel

        if (context.box !== "position" && (!userInput || userInput === "\u2012"))
            userInput = "0px";
        else if (context.box === "position" && (!userInput || userInput === "\u2012"))
            userInput = "auto";

        userInput = userInput.toLowerCase();
        // Append a "px" unit if the user input was just a number.
        if (/^\d+$/.test(userInput))
            userInput += "px";

        var styleProperty = context.styleProperty;
        var computedStyle = context.computedStyle;

        if (computedStyle.getPropertyValue("box-sizing") === "border-box" && (styleProperty === "width" || styleProperty === "height")) {
            if (!userInput.match(/px$/)) {
                WebInspector.log("For elements with box-sizing: border-box, only absolute content area dimensions can be applied", WebInspector.ConsoleMessage.MessageLevel.Error, true);
                return;
            }

            var borderBox = this._getBox(computedStyle, "border");
            var paddingBox = this._getBox(computedStyle, "padding");
            var userValuePx = Number(userInput.replace(/px$/, ""));
            if (isNaN(userValuePx))
                return;
            if (styleProperty === "width")
                userValuePx += borderBox.left + borderBox.right + paddingBox.left + paddingBox.right;
            else
                userValuePx += borderBox.top + borderBox.bottom + paddingBox.top + paddingBox.bottom;

            userInput = userValuePx + "px";
        }

        this.previousPropertyDataCandidate = null;
        var self = this;
        var callback = function(style) {
            if (!style)
                return;
            self.inlineStyle = style;
            if (!("originalPropertyData" in self))
                self.originalPropertyData = self.previousPropertyDataCandidate;

            if (typeof self._highlightMode !== "undefined") {
                WebInspector.domAgent.highlightDOMNode(self.node.id, self._highlightMode);
            }

            if (commitEditor) {
                self.dispatchEventToListeners("metrics edited");
                self.update();
            }
        };

        var allProperties = this.inlineStyle.allProperties;
        for (var i = 0; i < allProperties.length; ++i) {
            var property = allProperties[i];
            if (property.name !== context.styleProperty || property.inactive)
                continue;

            this.previousPropertyDataCandidate = property;
            property.setValue(userInput, commitEditor, true, callback);
            return;
        }

        this.inlineStyle.appendProperty(context.styleProperty, userInput, callback);
    },

    editingCommitted: function(element, userInput, previousContent, context)
    {
        this.editingEnded(element, context);
        this._applyUserInput(element, userInput, previousContent, context, true);
    }
}

WebInspector.MetricsSidebarPane.prototype.__proto__ = WebInspector.SidebarPane.prototype;
;
/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @extends {WebInspector.SidebarPane}
 */
WebInspector.PropertiesSidebarPane = function()
{
    WebInspector.SidebarPane.call(this, WebInspector.UIString("Properties"));
}

WebInspector.PropertiesSidebarPane._objectGroupName = "properties-sidebar-pane";

WebInspector.PropertiesSidebarPane.prototype = {
    update: function(node)
    {
        var body = this.bodyElement;

        if (!node) {
            body.removeChildren();
            this.sections = [];
            return;
        }

        WebInspector.RemoteObject.resolveNode(node, WebInspector.PropertiesSidebarPane._objectGroupName, nodeResolved.bind(this));

        function nodeResolved(object)
        {
            if (!object)
                return;
            function protoList()
            {
                var proto = this;
                var result = {};
                var counter = 1;
                while (proto) {
                    result[counter++] = proto;
                    proto = proto.__proto__;
                }
                return result;
            }
            object.callFunction(protoList, undefined, nodePrototypesReady.bind(this));
            object.release();
        }

        function nodePrototypesReady(object)
        {
            if (!object)
                return;
            object.getOwnProperties(fillSection.bind(this));
        }

        function fillSection(prototypes)
        {
            if (!prototypes)
                return;

            var body = this.bodyElement;
            body.removeChildren();
            this.sections = [];

            // Get array of prototype user-friendly names.
            for (var i = 0; i < prototypes.length; ++i) {
                if (!parseInt(prototypes[i].name, 10))
                    continue;

                var prototype = prototypes[i].value;
                var title = prototype.description;
                if (title.match(/Prototype$/))
                    title = title.replace(/Prototype$/, "");
                var section = new WebInspector.ObjectPropertiesSection(prototype, title);
                this.sections.push(section);
                body.appendChild(section.element);
            }
        }
    }
}

WebInspector.PropertiesSidebarPane.prototype.__proto__ = WebInspector.SidebarPane.prototype;
;
/*
 * Copyright (C) 2007 Apple Inc.  All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @extends {WebInspector.SidebarPane}
 * @param {WebInspector.ComputedStyleSidebarPane} computedStylePane
 * @param {function(DOMAgent.NodeId, string, boolean)} setPseudoClassCallback
 */
WebInspector.StylesSidebarPane = function(computedStylePane, setPseudoClassCallback)
{
    WebInspector.SidebarPane.call(this, WebInspector.UIString("Styles"));

    this.settingsSelectElement = document.createElement("select");
    this.settingsSelectElement.className = "select-settings";

    var option = document.createElement("option");
    option.value = WebInspector.Color.Format.Original;
    option.label = WebInspector.UIString(WebInspector.useLowerCaseMenuTitles() ? "As authored" : "As Authored");
    this.settingsSelectElement.appendChild(option);

    option = document.createElement("option");
    option.value = WebInspector.Color.Format.HEX;
    option.label = WebInspector.UIString("Hex Colors");
    this.settingsSelectElement.appendChild(option);

    option = document.createElement("option");
    option.value = WebInspector.Color.Format.RGB;
    option.label = WebInspector.UIString("RGB Colors");
    this.settingsSelectElement.appendChild(option);

    option = document.createElement("option");
    option.value = WebInspector.Color.Format.HSL;
    option.label = WebInspector.UIString("HSL Colors");
    this.settingsSelectElement.appendChild(option);

    // Prevent section from collapsing.
    var muteEventListener = function(event) { event.consume(true); };

    this.settingsSelectElement.addEventListener("click", muteEventListener, true);
    this.settingsSelectElement.addEventListener("change", this._changeSetting.bind(this), false);
    this._updateColorFormatFilter();

    this.titleElement.appendChild(this.settingsSelectElement);

    this._elementStateButton = document.createElement("button");
    this._elementStateButton.className = "pane-title-button element-state";
    this._elementStateButton.title = WebInspector.UIString("Toggle Element State");
    this._elementStateButton.addEventListener("click", this._toggleElementStatePane.bind(this), false);
    this.titleElement.appendChild(this._elementStateButton);

    var addButton = document.createElement("button");
    addButton.className = "pane-title-button add";
    addButton.id = "add-style-button-test-id";
    addButton.title = WebInspector.UIString("New Style Rule");
    addButton.addEventListener("click", this._createNewRule.bind(this), false);
    this.titleElement.appendChild(addButton);

    this._computedStylePane = computedStylePane;
    computedStylePane._stylesSidebarPane = this;
    this._setPseudoClassCallback = setPseudoClassCallback;
    this.element.addEventListener("contextmenu", this._contextMenuEventFired.bind(this), true);
    WebInspector.settings.colorFormat.addChangeListener(this._colorFormatSettingChanged.bind(this));

    this._createElementStatePane();
    this.bodyElement.appendChild(this._elementStatePane);
    this._sectionsContainer = document.createElement("div");
    this.bodyElement.appendChild(this._sectionsContainer);

    this._spectrum = new WebInspector.Spectrum();

    WebInspector.cssModel.addEventListener(WebInspector.CSSStyleModel.Events.StyleSheetChanged, this._styleSheetOrMediaQueryResultChanged, this);
    WebInspector.cssModel.addEventListener(WebInspector.CSSStyleModel.Events.MediaQueryResultChanged, this._styleSheetOrMediaQueryResultChanged, this);
    WebInspector.domAgent.addEventListener(WebInspector.DOMAgent.Events.AttrModified, this._attributesModified, this);
    WebInspector.domAgent.addEventListener(WebInspector.DOMAgent.Events.AttrRemoved, this._attributesRemoved, this);
    WebInspector.domAgent.addEventListener(WebInspector.DOMAgent.Events.StyleInvalidated, this._styleInvalidated, this);
    WebInspector.settings.showUserAgentStyles.addChangeListener(this._showUserAgentStylesSettingChanged.bind(this));
}

// Keep in sync with RenderStyleConstants.h PseudoId enum. Array below contains pseudo id names for corresponding enum indexes.
// First item is empty due to its artificial NOPSEUDO nature in the enum.
// FIXME: find a way of generating this mapping or getting it from combination of RenderStyleConstants and CSSSelector.cpp at
// runtime.
WebInspector.StylesSidebarPane.PseudoIdNames = [
    "", "first-line", "first-letter", "before", "after", "selection", "", "-webkit-scrollbar", "-webkit-file-upload-button",
    "-webkit-input-placeholder", "-webkit-slider-thumb", "-webkit-search-cancel-button", "-webkit-search-decoration",
    "-webkit-search-results-decoration", "-webkit-search-results-button", "-webkit-media-controls-panel",
    "-webkit-media-controls-play-button", "-webkit-media-controls-mute-button", "-webkit-media-controls-timeline",
    "-webkit-media-controls-timeline-container", "-webkit-media-controls-volume-slider",
    "-webkit-media-controls-volume-slider-container", "-webkit-media-controls-current-time-display",
    "-webkit-media-controls-time-remaining-display", "-webkit-media-controls-seek-back-button", "-webkit-media-controls-seek-forward-button",
    "-webkit-media-controls-fullscreen-button", "-webkit-media-controls-rewind-button", "-webkit-media-controls-return-to-realtime-button",
    "-webkit-media-controls-toggle-closed-captions-button", "-webkit-media-controls-status-display", "-webkit-scrollbar-thumb",
    "-webkit-scrollbar-button", "-webkit-scrollbar-track", "-webkit-scrollbar-track-piece", "-webkit-scrollbar-corner",
    "-webkit-resizer", "-webkit-inner-spin-button", "-webkit-outer-spin-button"
];

WebInspector.StylesSidebarPane.canonicalPropertyName = function(name)
{
    if (!name || name.length < 9 || name.charAt(0) !== "-")
        return name;
    var match = name.match(/(?:-webkit-|-khtml-|-apple-)(.+)/);
    if (!match)
        return name;
    return match[1];
}

WebInspector.StylesSidebarPane.prototype = {
    _contextMenuEventFired: function(event)
    {
        var contextMenu = new WebInspector.ContextMenu();
        if (WebInspector.populateHrefContextMenu(contextMenu, this.node, event))
            contextMenu.show(event);
    },

    get _forcedPseudoClasses()
    {
        return this.node ? (this.node.getUserProperty("pseudoState") || undefined) : undefined;
    },

    _updateForcedPseudoStateInputs: function()
    {
        if (!this.node)
            return;

        var nodePseudoState = this._forcedPseudoClasses;
        if (!nodePseudoState)
            nodePseudoState = [];

        var inputs = this._elementStatePane.inputs;
        for (var i = 0; i < inputs.length; ++i)
            inputs[i].checked = nodePseudoState.indexOf(inputs[i].state) >= 0;
    },

    update: function(node, forceUpdate)
    {
        if (this._spectrum.visible)
            this._spectrum.hide(false);

        var refresh = false;

        if (forceUpdate)
            delete this.node;

        if (!forceUpdate && (node === this.node))
            refresh = true;

        if (node && node.nodeType() === Node.TEXT_NODE && node.parentNode)
            node = node.parentNode;

        if (node && node.nodeType() !== Node.ELEMENT_NODE)
            node = null;

        if (node)
            this.node = node;
        else
            node = this.node;

        this._updateForcedPseudoStateInputs();

        if (refresh)
            this._refreshUpdate();
        else
            this._rebuildUpdate();
    },

    /**
     * @param {WebInspector.StylePropertiesSection=} editedSection
     * @param {boolean=} forceFetchComputedStyle
     * @param {function()=} userCallback
     */
    _refreshUpdate: function(editedSection, forceFetchComputedStyle, userCallback)
    {
        if (this._refreshUpdateInProgress) {
            this._lastNodeForInnerRefresh = this.node;
            return;
        }

        var node = this._validateNode(userCallback);
        if (!node)
            return;

        function computedStyleCallback(computedStyle)
        {
            delete this._refreshUpdateInProgress;

            if (this._lastNodeForInnerRefresh) {
                delete this._lastNodeForInnerRefresh;
                this._refreshUpdate(editedSection, forceFetchComputedStyle, userCallback);
                return;
            }

            if (this.node === node && computedStyle)
                this._innerRefreshUpdate(node, computedStyle, editedSection);

            if (userCallback)
                userCallback();
        }

        if (this._computedStylePane.expanded || forceFetchComputedStyle) {
            this._refreshUpdateInProgress = true;
            WebInspector.cssModel.getComputedStyleAsync(node.id, computedStyleCallback.bind(this));
        } else {
            this._innerRefreshUpdate(node, null, editedSection);
            if (userCallback)
                userCallback();
        }
    },

    /**
     * @param {function()=} userCallback
     */
    _rebuildUpdate: function(userCallback)
    {
        if (this._rebuildUpdateInProgress) {
            this._lastNodeForInnerRebuild = this.node;
            return;
        }

        var node = this._validateNode(userCallback);
        if (!node)
            return;

        this._rebuildUpdateInProgress = true;

        var resultStyles = {};

        function stylesCallback(matchedResult)
        {
            delete this._rebuildUpdateInProgress;

            if (this._lastNodeForInnerRebuild) {
                delete this._lastNodeForInnerRebuild;
                this._rebuildUpdate(userCallback);
                return;
            }

            if (matchedResult && this.node === node) {
                resultStyles.matchedCSSRules = matchedResult.matchedCSSRules;
                resultStyles.pseudoElements = matchedResult.pseudoElements;
                resultStyles.inherited = matchedResult.inherited;
                this._innerRebuildUpdate(node, resultStyles);
            }
            if (userCallback)
                userCallback();
        }

        function inlineCallback(inlineStyle, attributesStyle)
        {
            resultStyles.inlineStyle = inlineStyle;
            resultStyles.attributesStyle = attributesStyle;
        }

        function computedCallback(computedStyle)
        {
            resultStyles.computedStyle = computedStyle;
        }

        if (this._computedStylePane.expanded)
            WebInspector.cssModel.getComputedStyleAsync(node.id, computedCallback.bind(this));
        WebInspector.cssModel.getInlineStylesAsync(node.id, inlineCallback.bind(this));
        WebInspector.cssModel.getMatchedStylesAsync(node.id, true, true, stylesCallback.bind(this));
    },

    /**
     * @param {function()=} userCallback
     */
    _validateNode: function(userCallback)
    {
        if (!this.node) {
            this._sectionsContainer.removeChildren();
            this._computedStylePane.bodyElement.removeChildren();
            this.sections = {};
            if (userCallback)
                userCallback();
            return null;
        }
        return this.node;
    },

    _styleSheetOrMediaQueryResultChanged: function()
    {
        if (this._userOperation || this._isEditingStyle)
            return;

        this._rebuildUpdate();
    },

    _attributesModified: function(event)
    {
        if (this.node !== event.data.node)
            return;

        // Changing style attribute will anyways generate _styleInvalidated message.
        if (event.data.name === "style")
            return;

        // "class" (or any other) attribute might have changed. Update styles unless they are being edited.
        if (!this._isEditingStyle && !this._userOperation)
            this._rebuildUpdate();
    },

    _attributesRemoved: function(event)
    {
        if (this.node !== event.data.node)
            return;

        // "style" attribute might have been removed.
        if (!this._isEditingStyle && !this._userOperation)
            this._rebuildUpdate();
    },

    _styleInvalidated: function(event)
    {
        if (this.node !== event.data)
            return;

        if (!this._isEditingStyle && !this._userOperation)
            this._rebuildUpdate();
    },

    _innerRefreshUpdate: function(node, computedStyle, editedSection)
    {
        for (var pseudoId in this.sections) {
            var styleRules = this._refreshStyleRules(this.sections[pseudoId], computedStyle);
            var usedProperties = {};
            this._markUsedProperties(styleRules, usedProperties);
            this._refreshSectionsForStyleRules(styleRules, usedProperties, editedSection);
        }
        if (computedStyle)
            this.sections[0][0].rebuildComputedTrace(this.sections[0]);

        this._nodeStylesUpdatedForTest(node, false);
    },

    _innerRebuildUpdate: function(node, styles)
    {
        this._sectionsContainer.removeChildren();
        this._computedStylePane.bodyElement.removeChildren();

        var styleRules = this._rebuildStyleRules(node, styles);
        var usedProperties = {};
        this._markUsedProperties(styleRules, usedProperties);
        this.sections[0] = this._rebuildSectionsForStyleRules(styleRules, usedProperties, 0, null);
        var anchorElement = this.sections[0].inheritedPropertiesSeparatorElement;

        if (styles.computedStyle)        
            this.sections[0][0].rebuildComputedTrace(this.sections[0]);

        for (var i = 0; i < styles.pseudoElements.length; ++i) {
            var pseudoElementCSSRules = styles.pseudoElements[i];

            styleRules = [];
            var pseudoId = pseudoElementCSSRules.pseudoId;

            var entry = { isStyleSeparator: true, pseudoId: pseudoId };
            styleRules.push(entry);

            // Add rules in reverse order to match the cascade order.
            for (var j = pseudoElementCSSRules.rules.length - 1; j >= 0; --j) {
                var rule = pseudoElementCSSRules.rules[j];
                styleRules.push({ style: rule.style, selectorText: rule.selectorText, media: rule.media, sourceURL: rule.sourceURL, rule: rule, editable: !!(rule.style && rule.style.id) });
            }
            usedProperties = {};
            this._markUsedProperties(styleRules, usedProperties);
            this.sections[pseudoId] = this._rebuildSectionsForStyleRules(styleRules, usedProperties, pseudoId, anchorElement);
        }

        this._nodeStylesUpdatedForTest(node, true);
    },

    _nodeStylesUpdatedForTest: function(node, rebuild)
    {
        // Tests override this method.
    },

    _refreshStyleRules: function(sections, computedStyle)
    {
        var nodeComputedStyle = computedStyle;
        var styleRules = [];
        for (var i = 0; sections && i < sections.length; ++i) {
            var section = sections[i];
            if (section.isBlank)
                continue;
            if (section.computedStyle)
                section.styleRule.style = nodeComputedStyle;
            var styleRule = { section: section, style: section.styleRule.style, computedStyle: section.computedStyle, rule: section.rule, editable: !!(section.styleRule.style && section.styleRule.style.id) };
            styleRules.push(styleRule);
        }
        return styleRules;
    },

    _rebuildStyleRules: function(node, styles)
    {
        var nodeComputedStyle = styles.computedStyle;
        this.sections = {};

        var styleRules = [];

        function addAttributesStyle()
        {
            if (!styles.attributesStyle)
                return;
            var attrStyle = { style: styles.attributesStyle, editable: false };
            attrStyle.selectorText = node.nodeNameInCorrectCase() + "[" + WebInspector.UIString("Attributes Style") + "]";
            styleRules.push(attrStyle);
        }

        styleRules.push({ computedStyle: true, selectorText: "", style: nodeComputedStyle, editable: false });

        // Inline style has the greatest specificity.
        if (styles.inlineStyle && node.nodeType() === Node.ELEMENT_NODE) {
            var inlineStyle = { selectorText: "element.style", style: styles.inlineStyle, isAttribute: true };
            styleRules.push(inlineStyle);
        }

        // Add rules in reverse order to match the cascade order.
        if (styles.matchedCSSRules.length)
            styleRules.push({ isStyleSeparator: true, text: WebInspector.UIString("Matched CSS Rules") });
        var addedAttributesStyle;
        for (var i = styles.matchedCSSRules.length - 1; i >= 0; --i) {
            var rule = styles.matchedCSSRules[i];
            if (!WebInspector.settings.showUserAgentStyles.get() && (rule.isUser || rule.isUserAgent))
                continue;
            if ((rule.isUser || rule.isUserAgent) && !addedAttributesStyle) {
                // Show element's Style Attributes after all author rules.
                addedAttributesStyle = true;
                addAttributesStyle();
            }
            styleRules.push({ style: rule.style, selectorText: rule.selectorText, media: rule.media, sourceURL: rule.sourceURL, rule: rule, editable: !!(rule.style && rule.style.id) });
        }

        if (!addedAttributesStyle)
            addAttributesStyle();

        // Walk the node structure and identify styles with inherited properties.
        var parentNode = node.parentNode;
        function insertInheritedNodeSeparator(node)
        {
            var entry = {};
            entry.isStyleSeparator = true;
            entry.node = node;
            styleRules.push(entry);
        }

        for (var parentOrdinal = 0; parentOrdinal < styles.inherited.length; ++parentOrdinal) {
            var parentStyles = styles.inherited[parentOrdinal];
            var separatorInserted = false;
            if (parentStyles.inlineStyle) {
                if (this._containsInherited(parentStyles.inlineStyle)) {
                    var inlineStyle = { selectorText: WebInspector.UIString("Style Attribute"), style: parentStyles.inlineStyle, isAttribute: true, isInherited: true };
                    if (!separatorInserted) {
                        insertInheritedNodeSeparator(parentNode);
                        separatorInserted = true;
                    }
                    styleRules.push(inlineStyle);
                }
            }

            for (var i = parentStyles.matchedCSSRules.length - 1; i >= 0; --i) {
                var rulePayload = parentStyles.matchedCSSRules[i];
                if (!this._containsInherited(rulePayload.style))
                    continue;
                var rule = rulePayload;
                if (!WebInspector.settings.showUserAgentStyles.get() && (rule.isUser || rule.isUserAgent))
                    continue;

                if (!separatorInserted) {
                    insertInheritedNodeSeparator(parentNode);
                    separatorInserted = true;
                }
                styleRules.push({ style: rule.style, selectorText: rule.selectorText, media: rule.media, sourceURL: rule.sourceURL, rule: rule, isInherited: true, editable: !!(rule.style && rule.style.id) });
            }
            parentNode = parentNode.parentNode;
        }
        return styleRules;
    },

    _markUsedProperties: function(styleRules, usedProperties)
    {
        var priorityUsed = false;

        // Walk the style rules and make a list of all used and overloaded properties.
        for (var i = 0; i < styleRules.length; ++i) {
            var styleRule = styleRules[i];
            if (styleRule.computedStyle || styleRule.isStyleSeparator)
                continue;
            if (styleRule.section && styleRule.section.noAffect)
                continue;

            styleRule.usedProperties = {};

            var style = styleRule.style;
            var allProperties = style.allProperties;
            for (var j = 0; j < allProperties.length; ++j) {
                var property = allProperties[j];
                if (!property.isLive || !property.parsedOk)
                    continue;
                var canonicalName = WebInspector.StylesSidebarPane.canonicalPropertyName(property.name);

                if (!priorityUsed && property.priority.length)
                    priorityUsed = true;

                // If the property name is already used by another rule then this rule's
                // property is overloaded, so don't add it to the rule's usedProperties.
                if (!(canonicalName in usedProperties))
                    styleRule.usedProperties[canonicalName] = true;
            }

            // Add all the properties found in this style to the used properties list.
            // Do this here so only future rules are affect by properties used in this rule.
            for (var canonicalName in styleRules[i].usedProperties)
                usedProperties[canonicalName] = true;
        }

        if (priorityUsed) {
            // Walk the properties again and account for !important.
            var foundPriorityProperties = {};

            // Walk in direct order to detect the active/most specific rule providing a priority
            // (in this case all subsequent !important values get canceled.)
            for (var i = 0; i < styleRules.length; ++i) {
                if (styleRules[i].computedStyle || styleRules[i].isStyleSeparator)
                    continue;

                var style = styleRules[i].style;
                var allProperties = style.allProperties;
                for (var j = 0; j < allProperties.length; ++j) {
                    var property = allProperties[j];
                    if (!property.isLive)
                        continue;
                    var canonicalName = WebInspector.StylesSidebarPane.canonicalPropertyName(property.name);
                    if (property.priority.length) {
                        if (!(canonicalName in foundPriorityProperties))
                            styleRules[i].usedProperties[canonicalName] = true;
                        else
                            delete styleRules[i].usedProperties[canonicalName];
                        foundPriorityProperties[canonicalName] = true;
                    } else if (canonicalName in foundPriorityProperties)
                        delete styleRules[i].usedProperties[canonicalName];
                }
            }
        }
    },

    _refreshSectionsForStyleRules: function(styleRules, usedProperties, editedSection)
    {
        // Walk the style rules and update the sections with new overloaded and used properties.
        for (var i = 0; i < styleRules.length; ++i) {
            var styleRule = styleRules[i];
            var section = styleRule.section;
            if (styleRule.computedStyle) {
                section._usedProperties = usedProperties;
                section.update();
            } else {
                section._usedProperties = styleRule.usedProperties;
                section.update(section === editedSection);
            }
        }
    },

    _rebuildSectionsForStyleRules: function(styleRules, usedProperties, pseudoId, anchorElement)
    {
        // Make a property section for each style rule.
        var sections = [];
        var lastWasSeparator = true;
        for (var i = 0; i < styleRules.length; ++i) {
            var styleRule = styleRules[i];
            if (styleRule.isStyleSeparator) {
                var separatorElement = document.createElement("div");
                separatorElement.className = "sidebar-separator";
                if (styleRule.node) {
                    var link = WebInspector.DOMPresentationUtils.linkifyNodeReference(styleRule.node);
                    separatorElement.appendChild(document.createTextNode(WebInspector.UIString("Inherited from") + " "));
                    separatorElement.appendChild(link);
                    if (!sections.inheritedPropertiesSeparatorElement)
                        sections.inheritedPropertiesSeparatorElement = separatorElement;
                } else if ("pseudoId" in styleRule) {
                    var pseudoName = WebInspector.StylesSidebarPane.PseudoIdNames[styleRule.pseudoId];
                    if (pseudoName)
                        separatorElement.textContent = WebInspector.UIString("Pseudo ::%s element", pseudoName);
                    else
                        separatorElement.textContent = WebInspector.UIString("Pseudo element");
                } else
                    separatorElement.textContent = styleRule.text;
                this._sectionsContainer.insertBefore(separatorElement, anchorElement);
                lastWasSeparator = true;
                continue;
            }
            var computedStyle = styleRule.computedStyle;

            // Default editable to true if it was omitted.
            var editable = styleRule.editable;
            if (typeof editable === "undefined")
                editable = true;

            if (computedStyle)
                var section = new WebInspector.ComputedStylePropertiesSection(styleRule, usedProperties);
            else
                var section = new WebInspector.StylePropertiesSection(this, styleRule, editable, styleRule.isInherited, lastWasSeparator);
            section.pane = this;
            section.expanded = true;

            if (computedStyle) {
                this._computedStylePane.bodyElement.appendChild(section.element);
                lastWasSeparator = true;
            } else {
                this._sectionsContainer.insertBefore(section.element, anchorElement);
                lastWasSeparator = false;
            }
            sections.push(section);
        }
        return sections;
    },

    _containsInherited: function(style)
    {
        var properties = style.allProperties;
        for (var i = 0; i < properties.length; ++i) {
            var property = properties[i];
            // Does this style contain non-overridden inherited property?
            if (property.isLive && property.name in WebInspector.CSSKeywordCompletions.InheritedProperties)
                return true;
        }
        return false;
    },

    _colorFormatSettingChanged: function(event)
    {
        this._updateColorFormatFilter();
        for (var pseudoId in this.sections) {
            var sections = this.sections[pseudoId];
            for (var i = 0; i < sections.length; ++i)
                sections[i].update(true);
        }
    },

    _updateColorFormatFilter: function()
    {
        // Select the correct color format setting again, since it needs to be selected.
        var selectedIndex = 0;
        var value = WebInspector.settings.colorFormat.get();
        var options = this.settingsSelectElement.options;
        for (var i = 0; i < options.length; ++i) {
            if (options[i].value === value) {
                selectedIndex = i;
                break;
            }
        }
        this.settingsSelectElement.selectedIndex = selectedIndex;
    },

    _changeSetting: function(event)
    {
        var options = this.settingsSelectElement.options;
        var selectedOption = options[this.settingsSelectElement.selectedIndex];
        WebInspector.settings.colorFormat.set(selectedOption.value);
    },

    _createNewRule: function(event)
    {
        event.consume();
        this.expanded = true;
        this.addBlankSection().startEditingSelector();
    },

    addBlankSection: function()
    {
        var blankSection = new WebInspector.BlankStylePropertiesSection(this, this.node ? this.node.appropriateSelectorFor(true) : "");
        blankSection.pane = this;

        var elementStyleSection = this.sections[0][1];
        this._sectionsContainer.insertBefore(blankSection.element, elementStyleSection.element.nextSibling);

        this.sections[0].splice(2, 0, blankSection);

        return blankSection;
    },

    removeSection: function(section)
    {
        for (var pseudoId in this.sections) {
            var sections = this.sections[pseudoId];
            var index = sections.indexOf(section);
            if (index === -1)
                continue;
            sections.splice(index, 1);
            if (section.element.parentNode)
                section.element.parentNode.removeChild(section.element);
        }
    },

    registerShortcuts: function()
    {
        var section = WebInspector.shortcutsScreen.section(WebInspector.UIString("Styles Pane"));
        var shortcut = WebInspector.KeyboardShortcut;
        var keys = [
            shortcut.shortcutToString(shortcut.Keys.Tab),
            shortcut.shortcutToString(shortcut.Keys.Tab, shortcut.Modifiers.Shift)
        ];
        section.addRelatedKeys(keys, WebInspector.UIString("Next/previous property"));
        keys = [
            shortcut.shortcutToString(shortcut.Keys.Up),
            shortcut.shortcutToString(shortcut.Keys.Down)
        ];
        section.addRelatedKeys(keys, WebInspector.UIString("Increment/decrement value"));
        keys = [
            shortcut.shortcutToString(shortcut.Keys.Up, shortcut.Modifiers.Shift),
            shortcut.shortcutToString(shortcut.Keys.Down, shortcut.Modifiers.Shift)
        ];
        section.addRelatedKeys(keys, WebInspector.UIString("Increment/decrement by %f", 10));
        keys = [
            shortcut.shortcutToString(shortcut.Keys.PageUp),
            shortcut.shortcutToString(shortcut.Keys.PageDown)
        ];
        section.addRelatedKeys(keys, WebInspector.UIString("Increment/decrement by %f", 10));
        keys = [
            shortcut.shortcutToString(shortcut.Keys.PageUp, shortcut.Modifiers.Shift),
            shortcut.shortcutToString(shortcut.Keys.PageDown, shortcut.Modifiers.Shift)
        ];
        section.addRelatedKeys(keys, WebInspector.UIString("Increment/decrement by %f", 100));
        keys = [
            shortcut.shortcutToString(shortcut.Keys.PageUp, shortcut.Modifiers.Alt),
            shortcut.shortcutToString(shortcut.Keys.PageDown, shortcut.Modifiers.Alt)
        ];
        section.addRelatedKeys(keys, WebInspector.UIString("Increment/decrement by %f", 0.1));
    },

    _toggleElementStatePane: function(event)
    {
        event.consume();
        if (!this._elementStateButton.hasStyleClass("toggled")) {
            this.expand();
            this._elementStateButton.addStyleClass("toggled");
            this._elementStatePane.addStyleClass("expanded");
        } else {
            this._elementStateButton.removeStyleClass("toggled");
            this._elementStatePane.removeStyleClass("expanded");
        }
    },

    _createElementStatePane: function()
    {
        this._elementStatePane = document.createElement("div");
        this._elementStatePane.className = "styles-element-state-pane source-code";
        var table = document.createElement("table");

        var inputs = [];
        this._elementStatePane.inputs = inputs;

        function clickListener(event)
        {
            var node = this._validateNode();
            if (!node)
                return;
            this._setPseudoClassCallback(node.id, event.target.state, event.target.checked);
        }

        function createCheckbox(state)
        {
            var td = document.createElement("td");
            var label = document.createElement("label");
            var input = document.createElement("input");
            input.type = "checkbox";
            input.state = state;
            input.addEventListener("click", clickListener.bind(this), false);
            inputs.push(input);
            label.appendChild(input);
            label.appendChild(document.createTextNode(":" + state));
            td.appendChild(label);
            return td;
        }

        var tr = document.createElement("tr");
        tr.appendChild(createCheckbox.call(this, "active"));
        tr.appendChild(createCheckbox.call(this, "hover"));
        table.appendChild(tr);

        tr = document.createElement("tr");
        tr.appendChild(createCheckbox.call(this, "focus"));
        tr.appendChild(createCheckbox.call(this, "visited"));
        table.appendChild(tr);

        this._elementStatePane.appendChild(table);
    },

    _showUserAgentStylesSettingChanged: function()
    {
        this._rebuildUpdate();
    },

    willHide: function()
    {
        if (this._spectrum.visible)
            this._spectrum.hide(false);
    }
}

WebInspector.StylesSidebarPane.prototype.__proto__ = WebInspector.SidebarPane.prototype;

/**
 * @constructor
 * @extends {WebInspector.SidebarPane}
 */
WebInspector.ComputedStyleSidebarPane = function()
{
    WebInspector.SidebarPane.call(this, WebInspector.UIString("Computed Style"));
    var showInheritedCheckbox = new WebInspector.Checkbox(WebInspector.UIString("Show inherited"), "sidebar-pane-subtitle");
    this.titleElement.appendChild(showInheritedCheckbox.element);

    if (WebInspector.settings.showInheritedComputedStyleProperties.get()) {
        this.bodyElement.addStyleClass("show-inherited");
        showInheritedCheckbox.checked = true;
    }

    function showInheritedToggleFunction(event)
    {
        WebInspector.settings.showInheritedComputedStyleProperties.set(showInheritedCheckbox.checked);
        if (WebInspector.settings.showInheritedComputedStyleProperties.get())
            this.bodyElement.addStyleClass("show-inherited");
        else
            this.bodyElement.removeStyleClass("show-inherited");
    }

    showInheritedCheckbox.addEventListener(showInheritedToggleFunction.bind(this));
}

WebInspector.ComputedStyleSidebarPane.prototype = {

    // Overriding expand() rather than onexpand() to eliminate the visual slowness due to a possible backend trip.
    expand: function()
    {
        function callback()
        {
            WebInspector.SidebarPane.prototype.expand.call(this);
        }

        this._stylesSidebarPane._refreshUpdate(null, true, callback.bind(this));
    }
}

WebInspector.ComputedStyleSidebarPane.prototype.__proto__ = WebInspector.SidebarPane.prototype;

/**
 * @constructor
 * @extends {WebInspector.PropertiesSection}
 */
WebInspector.StylePropertiesSection = function(parentPane, styleRule, editable, isInherited, isFirstSection)
{
    WebInspector.PropertiesSection.call(this, "");
    this.element.className = "styles-section matched-styles monospace" + (isFirstSection ? " first-styles-section" : "");

    if (styleRule.media) {
        for (var i = styleRule.media.length - 1; i >= 0; --i) {
            var media = styleRule.media[i];
            var mediaDataElement = this.titleElement.createChild("div", "media");
            var mediaText;
            switch (media.source) {
            case WebInspector.CSSMedia.Source.LINKED_SHEET:
            case WebInspector.CSSMedia.Source.INLINE_SHEET:
                mediaText = "media=\"" + media.text + "\"";
                break;
            case WebInspector.CSSMedia.Source.MEDIA_RULE:
                mediaText = "@media " + media.text;
                break;
            case WebInspector.CSSMedia.Source.IMPORT_RULE:
                mediaText = "@import " + media.text;
                break;
            }

            if (media.sourceURL) {
                var refElement = mediaDataElement.createChild("div", "subtitle");
                var lineNumber = media.sourceLine < 0 ? undefined : media.sourceLine;
                var anchor = WebInspector.linkifyResourceAsNode(media.sourceURL, lineNumber, "subtitle", media.sourceURL + (isNaN(lineNumber) ? "" : (":" + (lineNumber + 1))));
                anchor.preferredPanel = "scripts";
                anchor.style.float = "right";
                refElement.appendChild(anchor);
            }

            var mediaTextElement = mediaDataElement.createChild("span");
            mediaTextElement.textContent = mediaText;
            mediaTextElement.title = media.text;
        }
    }

    var selectorContainer = document.createElement("div");
    this._selectorElement = document.createElement("span");
    this._selectorElement.textContent = styleRule.selectorText;
    selectorContainer.appendChild(this._selectorElement);

    var openBrace = document.createElement("span");
    openBrace.textContent = " {";
    selectorContainer.appendChild(openBrace);
    selectorContainer.addEventListener("mousedown", this._handleEmptySpaceMouseDown.bind(this), false);
    selectorContainer.addEventListener("click", this._handleSelectorContainerClick.bind(this), false);

    var closeBrace = document.createElement("div");
    closeBrace.textContent = "}";
    this.element.appendChild(closeBrace);

    this._selectorElement.addEventListener("click", this._handleSelectorClick.bind(this), false);
    this.element.addEventListener("mousedown", this._handleEmptySpaceMouseDown.bind(this), false);
    this.element.addEventListener("click", this._handleEmptySpaceClick.bind(this), false);

    this._parentPane = parentPane;
    this.styleRule = styleRule;
    this.rule = this.styleRule.rule;
    this.editable = editable;
    this.isInherited = isInherited;

    if (this.rule) {
        // Prevent editing the user agent and user rules.
        if (this.rule.isUserAgent || this.rule.isUser)
            this.editable = false;
        this.titleElement.addStyleClass("styles-selector");
    }

    this._usedProperties = styleRule.usedProperties;

    this._selectorRefElement = document.createElement("div");
    this._selectorRefElement.className = "subtitle";
    this._selectorRefElement.appendChild(this._createRuleOriginNode());
    selectorContainer.insertBefore(this._selectorRefElement, selectorContainer.firstChild);
    this.titleElement.appendChild(selectorContainer);
    this._selectorContainer = selectorContainer;

    if (isInherited)
        this.element.addStyleClass("show-inherited"); // This one is related to inherited rules, not compted style.

    if (!this.editable)
        this.element.addStyleClass("read-only");
}

WebInspector.StylePropertiesSection.prototype = {
    collapse: function(dontRememberState)
    {
        // Overriding with empty body.
    },

    isPropertyInherited: function(propertyName)
    {
        if (this.isInherited) {
            // While rendering inherited stylesheet, reverse meaning of this property.
            // Render truly inherited properties with black, i.e. return them as non-inherited.
            return !(propertyName in WebInspector.CSSKeywordCompletions.InheritedProperties);
        }
        return false;
    },

    /**
     * @param {string} propertyName
     * @param {boolean=} isShorthand
     */
    isPropertyOverloaded: function(propertyName, isShorthand)
    {
        if (!this._usedProperties || this.noAffect)
            return false;

        if (this.isInherited && !(propertyName in WebInspector.CSSKeywordCompletions.InheritedProperties)) {
            // In the inherited sections, only show overrides for the potentially inherited properties.
            return false;
        }

        var canonicalName = WebInspector.StylesSidebarPane.canonicalPropertyName(propertyName);
        var used = (canonicalName in this._usedProperties);
        if (used || !isShorthand)
            return !used;

        // Find out if any of the individual longhand properties of the shorthand
        // are used, if none are then the shorthand is overloaded too.
        var longhandProperties = this.styleRule.style.longhandProperties(propertyName);
        for (var j = 0; j < longhandProperties.length; ++j) {
            var individualProperty = longhandProperties[j];
            if (WebInspector.StylesSidebarPane.canonicalPropertyName(individualProperty.name) in this._usedProperties)
                return false;
        }

        return true;
    },

    nextEditableSibling: function()
    {
        var curSection = this;
        do {
            curSection = curSection.nextSibling;
        } while (curSection && !curSection.editable);

        if (!curSection) {
            curSection = this.firstSibling;
            while (curSection && !curSection.editable)
                curSection = curSection.nextSibling;
        }

        return (curSection && curSection.editable) ? curSection : null;
    },

    previousEditableSibling: function()
    {
        var curSection = this;
        do {
            curSection = curSection.previousSibling;
        } while (curSection && !curSection.editable);

        if (!curSection) {
            curSection = this.lastSibling;
            while (curSection && !curSection.editable)
                curSection = curSection.previousSibling;
        }

        return (curSection && curSection.editable) ? curSection : null;
    },

    update: function(full)
    {
        if (full) {
            this.propertiesTreeOutline.removeChildren();
            this.populated = false;
        } else {
            var child = this.propertiesTreeOutline.children[0];
            while (child) {
                child.overloaded = this.isPropertyOverloaded(child.name, child.isShorthand);
                child = child.traverseNextTreeElement(false, null, true);
            }
        }
        this.afterUpdate();
    },

    afterUpdate: function()
    {
        if (this._afterUpdate) {
            this._afterUpdate(this);
            delete this._afterUpdate;
        }
    },

    onpopulate: function()
    {
        var style = this.styleRule.style;
        var allProperties = style.allProperties;
        this.uniqueProperties = [];

        var styleHasEditableSource = this.editable && !!style.range;
        if (styleHasEditableSource) {
            for (var i = 0; i < allProperties.length; ++i) {
                var property = allProperties[i];
                this.uniqueProperties.push(property);
                if (property.styleBased)
                    continue;

                var isShorthand = !!WebInspector.CSSCompletions.cssPropertiesMetainfo.longhands(property.name);
                var inherited = this.isPropertyInherited(property.name);
                var overloaded = this.isPropertyOverloaded(property.name);
                var item = new WebInspector.StylePropertyTreeElement(this, this._parentPane, this.styleRule, style, property, isShorthand, inherited, overloaded);
                this.propertiesTreeOutline.appendChild(item);
            }
            return;
        }

        var generatedShorthands = {};
        // For style-based properties, generate shorthands with values when possible.
        for (var i = 0; i < allProperties.length; ++i) {
            var property = allProperties[i];
            this.uniqueProperties.push(property);
            var isShorthand = !!WebInspector.CSSCompletions.cssPropertiesMetainfo.longhands(property.name);

            // For style-based properties, try generating shorthands.
            var shorthands = isShorthand ? null : WebInspector.CSSCompletions.cssPropertiesMetainfo.shorthands(property.name);
            var shorthandPropertyAvailable = false;
            for (var j = 0; shorthands && !shorthandPropertyAvailable && j < shorthands.length; ++j) {
                var shorthand = shorthands[j];
                if (shorthand in generatedShorthands) {
                    shorthandPropertyAvailable = true;
                    continue;  // There already is a shorthand this longhands falls under.
                }
                if (style.getLiveProperty(shorthand)) {
                    shorthandPropertyAvailable = true;
                    continue;  // There is an explict shorthand property this longhands falls under.
                }
                if (!style.shorthandValue(shorthand)) {
                    shorthandPropertyAvailable = false;
                    continue;  // Never generate synthetic shorthands when no value is available.
                }

                // Generate synthetic shorthand we have a value for.
                var shorthandProperty = new WebInspector.CSSProperty(style, style.allProperties.length, shorthand, style.shorthandValue(shorthand), "", "style", true, true, undefined);
                var overloaded = this.isPropertyOverloaded(property.name, true);
                var item = new WebInspector.StylePropertyTreeElement(this, this._parentPane, this.styleRule, style, shorthandProperty,  /* isShorthand */ true, /* inherited */ false, overloaded);
                this.propertiesTreeOutline.appendChild(item);
                generatedShorthands[shorthand] = shorthandProperty;
                shorthandPropertyAvailable = true;
            }
            if (shorthandPropertyAvailable)
                continue;  // Shorthand for the property found.

            var inherited = this.isPropertyInherited(property.name);
            var overloaded = this.isPropertyOverloaded(property.name, isShorthand);
            var item = new WebInspector.StylePropertyTreeElement(this, this._parentPane, this.styleRule, style, property, isShorthand, inherited, overloaded);
            this.propertiesTreeOutline.appendChild(item);
        }
    },

    findTreeElementWithName: function(name)
    {
        var treeElement = this.propertiesTreeOutline.children[0];
        while (treeElement) {
            if (treeElement.name === name)
                return treeElement;
            treeElement = treeElement.traverseNextTreeElement(true, null, true);
        }
        return null;
    },

    _checkWillCancelEditing: function()
    {
        var willCauseCancelEditing = this._willCauseCancelEditing;
        delete this._willCauseCancelEditing;
        return willCauseCancelEditing;
    },

    _handleSelectorContainerClick: function(event)
    {
        if (this._checkWillCancelEditing() || !this.editable)
            return;
        if (event.target === this._selectorContainer)
            this.addNewBlankProperty(0).startEditing();
    },

    /**
     * @param {number=} index
     */
    addNewBlankProperty: function(index)
    {
        var style = this.styleRule.style;
        var property = style.newBlankProperty(index);
        var item = new WebInspector.StylePropertyTreeElement(this, this._parentPane, this.styleRule, style, property, false, false, false);
        index = property.index;
        this.propertiesTreeOutline.insertChild(item, index);
        item.listItemElement.textContent = "";
        item._newProperty = true;
        item.updateTitle();
        return item;
    },

    _createRuleOriginNode: function()
    {
        /**
         * @param {string} url
         * @param {number} line
         */
        function linkifyUncopyable(url, line)
        {
            var link = WebInspector.linkifyResourceAsNode(url, line, "", url + ":" + (line + 1));
            link.preferredPanel = "scripts";
            link.classList.add("webkit-html-resource-link");
            link.setAttribute("data-uncopyable", link.textContent);
            link.textContent = "";
            return link;
        }

        if (this.styleRule.sourceURL) {
            var uiLocation = this.rule.uiLocation();
            if (uiLocation)
                return linkifyUncopyable(uiLocation.url(), uiLocation.lineNumber);
            else
                return linkifyUncopyable(this.styleRule.sourceURL, this.rule.sourceLine);
        }

        if (!this.rule)
            return document.createTextNode("");

        var origin = "";
        if (this.rule.isUserAgent)
            return document.createTextNode(WebInspector.UIString("user agent stylesheet"));
        if (this.rule.isUser)
            return document.createTextNode(WebInspector.UIString("user stylesheet"));
        if (this.rule.isViaInspector) {
            var element = document.createElement("span");
            /**
             * @param {?WebInspector.Resource} resource
             */
            function callback(resource)
            {
                if (resource)
                    element.appendChild(linkifyUncopyable(resource.url, this.rule.sourceLine));
                else
                    element.textContent = WebInspector.UIString("via inspector");
            }
            WebInspector.cssModel.getViaInspectorResourceForRule(this.rule, callback.bind(this));
            return element;
        }
    },

    _handleEmptySpaceMouseDown: function(event)
    {
        this._willCauseCancelEditing = this._parentPane._isEditingStyle;
    },

    _handleEmptySpaceClick: function(event)
    {
        if (!this.editable)
            return;

        if (this._checkWillCancelEditing())
            return;

        if (event.target.hasStyleClass("header") || this.element.hasStyleClass("read-only") || event.target.enclosingNodeOrSelfWithClass("media")) {
            event.consume();
            return;
        }
        this.expand();
        this.addNewBlankProperty().startEditing();
    },

    _handleSelectorClick: function(event)
    {
        this._startEditingOnMouseEvent();
        event.consume(true);
    },

    _startEditingOnMouseEvent: function()
    {
        if (!this.editable)
            return;

        if (!this.rule && this.propertiesTreeOutline.children.length === 0) {
            this.expand();
            this.addNewBlankProperty().startEditing();
            return;
        }

        if (!this.rule)
            return;

        this.startEditingSelector();
    },

    startEditingSelector: function()
    {
        var element = this._selectorElement;
        if (WebInspector.isBeingEdited(element))
            return;

        this._selectorElement.scrollIntoViewIfNeeded(false);

        var config = new WebInspector.EditingConfig(this.editingSelectorCommitted.bind(this), this.editingSelectorCancelled.bind(this));
        WebInspector.startEditing(this._selectorElement, config);

        window.getSelection().setBaseAndExtent(element, 0, element, 1);
    },

    _moveEditorFromSelector: function(moveDirection)
    {
        if (!moveDirection)
            return;

        if (moveDirection === "forward") {
            this.expand();
            var firstChild = this.propertiesTreeOutline.children[0];
            while (firstChild && firstChild.inherited)
                firstChild = firstChild.nextSibling;
            if (!firstChild)
                this.addNewBlankProperty().startEditing();
            else
                firstChild.startEditing(firstChild.nameElement);
        } else {
            var previousSection = this.previousEditableSibling();
            if (!previousSection)
                return;

            previousSection.expand();
            previousSection.addNewBlankProperty().startEditing();
        }
    },

    editingSelectorCommitted: function(element, newContent, oldContent, context, moveDirection)
    {
        if (newContent)
            newContent = newContent.trim();
        if (newContent === oldContent) {
            // Revert to a trimmed version of the selector if need be.
            this._selectorElement.textContent = newContent;
            return this._moveEditorFromSelector(moveDirection);
        }

        function successCallback(newRule, doesAffectSelectedNode)
        {
            if (!doesAffectSelectedNode) {
                this.noAffect = true;
                this.element.addStyleClass("no-affect");
            } else {
                delete this.noAffect;
                this.element.removeStyleClass("no-affect");
            }

            this.rule = newRule;
            this.styleRule = { section: this, style: newRule.style, selectorText: newRule.selectorText, media: newRule.media, sourceURL: newRule.sourceURL, rule: newRule };

            this._parentPane.update();

            this._moveEditorFromSelector(moveDirection);
        }

        var selectedNode = this._parentPane.node;
        WebInspector.cssModel.setRuleSelector(this.rule.id, selectedNode ? selectedNode.id : 0, newContent, successCallback.bind(this), this._moveEditorFromSelector.bind(this, moveDirection));
    },

    editingSelectorCancelled: function()
    {
        // Do nothing, this is overridden by BlankStylePropertiesSection.
    }
}

WebInspector.StylePropertiesSection.prototype.__proto__ = WebInspector.PropertiesSection.prototype;

/**
 * @constructor
 * @extends {WebInspector.PropertiesSection}
 */
WebInspector.ComputedStylePropertiesSection = function(styleRule, usedProperties)
{
    WebInspector.PropertiesSection.call(this, "");
    this.headerElement.addStyleClass("hidden");
    this.element.className = "styles-section monospace first-styles-section read-only computed-style";
    this.styleRule = styleRule;
    this._usedProperties = usedProperties;
    this._alwaysShowComputedProperties = { "display": true, "height": true, "width": true };
    this.computedStyle = true;
    this._propertyTreeElements = {};
    this._expandedPropertyNames = {};
}

WebInspector.ComputedStylePropertiesSection.prototype = {
    collapse: function(dontRememberState)
    {
        // Overriding with empty body.
    },

    _isPropertyInherited: function(propertyName)
    {
        var canonicalName = WebInspector.StylesSidebarPane.canonicalPropertyName(propertyName);
        return !(canonicalName in this._usedProperties) && !(canonicalName in this._alwaysShowComputedProperties);
    },

    update: function()
    {
        this._expandedPropertyNames = {};
        for (var name in this._propertyTreeElements) {
            if (this._propertyTreeElements[name].expanded)
                this._expandedPropertyNames[name] = true;
        }
        this._propertyTreeElements = {};
        this.propertiesTreeOutline.removeChildren();
        this.populated = false;
    },

    onpopulate: function()
    {
        function sorter(a, b)
        {
            return a.name.localeCompare(b.name);
        }

        var style = this.styleRule.style;
        if (!style)
            return;

        var uniqueProperties = [];
        var allProperties = style.allProperties;
        for (var i = 0; i < allProperties.length; ++i)
            uniqueProperties.push(allProperties[i]);
        uniqueProperties.sort(sorter);

        this._propertyTreeElements = {};
        for (var i = 0; i < uniqueProperties.length; ++i) {
            var property = uniqueProperties[i];
            var inherited = this._isPropertyInherited(property.name);
            var item = new WebInspector.StylePropertyTreeElement(this, null, this.styleRule, style, property, false, inherited, false);
            this.propertiesTreeOutline.appendChild(item);
            this._propertyTreeElements[property.name] = item;
        }
    },

    rebuildComputedTrace: function(sections)
    {
        for (var i = 0; i < sections.length; ++i) {
            var section = sections[i];
            if (section.computedStyle || section.isBlank)
                continue;

            for (var j = 0; j < section.uniqueProperties.length; ++j) {
                var property = section.uniqueProperties[j];
                if (property.disabled)
                    continue;
                if (section.isInherited && !(property.name in WebInspector.CSSKeywordCompletions.InheritedProperties))
                    continue;

                var treeElement = this._propertyTreeElements[property.name];
                if (treeElement) {
                    var fragment = document.createDocumentFragment();
                    var selector = fragment.createChild("span");
                    selector.style.color = "gray";
                    selector.textContent = section.styleRule.selectorText;
                    fragment.appendChild(document.createTextNode(" - " + property.value + " "));
                    var subtitle = fragment.createChild("span");
                    subtitle.style.float = "right";
                    subtitle.appendChild(section._createRuleOriginNode());
                    var childElement = new TreeElement(fragment, null, false);
                    treeElement.appendChild(childElement);
                    if (section.isPropertyOverloaded(property.name))
                        childElement.listItemElement.addStyleClass("overloaded");
                    if (!property.parsedOk)
                        childElement.listItemElement.addStyleClass("not-parsed-ok");
                }
            }
        }

        // Restore expanded state after update.
        for (var name in this._expandedPropertyNames) {
            if (name in this._propertyTreeElements)
                this._propertyTreeElements[name].expand();
        }
    }
}

WebInspector.ComputedStylePropertiesSection.prototype.__proto__ = WebInspector.PropertiesSection.prototype;

/**
 * @constructor
 * @extends {WebInspector.StylePropertiesSection}
 */
WebInspector.BlankStylePropertiesSection = function(parentPane, defaultSelectorText)
{
    WebInspector.StylePropertiesSection.call(this, parentPane, {selectorText: defaultSelectorText, rule: {isViaInspector: true}}, true, false, false);
    this.element.addStyleClass("blank-section");
}

WebInspector.BlankStylePropertiesSection.prototype = {
    get isBlank()
    {
        return !this._normal;
    },

    expand: function()
    {
        if (!this.isBlank)
            WebInspector.StylePropertiesSection.prototype.expand.call(this);
    },

    editingSelectorCommitted: function(element, newContent, oldContent, context, moveDirection)
    {
        if (!this.isBlank) {
            WebInspector.StylePropertiesSection.prototype.editingSelectorCommitted.call(this, element, newContent, oldContent, context, moveDirection);
            return;
        }

        function successCallback(newRule, doesSelectorAffectSelectedNode)
        {
            var styleRule = { section: this, style: newRule.style, selectorText: newRule.selectorText, sourceURL: newRule.sourceURL, rule: newRule };
            this.makeNormal(styleRule);

            if (!doesSelectorAffectSelectedNode) {
                this.noAffect = true;
                this.element.addStyleClass("no-affect");
            }

            this._selectorRefElement.removeChildren();
            this._selectorRefElement.appendChild(this._createRuleOriginNode());
            this.expand();
            if (this.element.parentElement) // Might have been detached already.
                this._moveEditorFromSelector(moveDirection);

            delete this._parentPane._userOperation;
        }

        this._parentPane._userOperation = true;
        WebInspector.cssModel.addRule(this.pane.node.id, newContent, successCallback.bind(this), this.editingSelectorCancelled.bind(this));
    },

    editingSelectorCancelled: function()
    {
        if (!this.isBlank) {
            WebInspector.StylePropertiesSection.prototype.editingSelectorCancelled.call(this);
            return;
        }

        this.pane.removeSection(this);
    },

    makeNormal: function(styleRule)
    {
        this.element.removeStyleClass("blank-section");
        this.styleRule = styleRule;
        this.rule = styleRule.rule;

        // FIXME: replace this instance by a normal WebInspector.StylePropertiesSection.
        this._normal = true;
    }
}

WebInspector.BlankStylePropertiesSection.prototype.__proto__ = WebInspector.StylePropertiesSection.prototype;

/**
 * @constructor
 * @extends {TreeElement}
 * @param {WebInspector.StylePropertiesSection|WebInspector.ComputedStylePropertiesSection} section
 * @param {?WebInspector.StylesSidebarPane} parentPane
 * @param {Object} styleRule
 * @param {WebInspector.CSSStyleDeclaration} style
 * @param {WebInspector.CSSProperty} property
 * @param {boolean} isShorthand
 * @param {boolean} inherited
 * @param {boolean} overloaded
 */
WebInspector.StylePropertyTreeElement = function(section, parentPane, styleRule, style, property, isShorthand, inherited, overloaded)
{
    this.section = section;
    this._parentPane = parentPane;
    this._styleRule = styleRule;
    this.style = style;
    this.property = property;
    this.isShorthand = isShorthand;
    this._inherited = inherited;
    this._overloaded = overloaded;

    // Pass an empty title, the title gets made later in onattach.
    TreeElement.call(this, "", null, isShorthand);

    this.selectable = false;
}

WebInspector.StylePropertyTreeElement.prototype = {
    get inherited()
    {
        return this._inherited;
    },

    set inherited(x)
    {
        if (x === this._inherited)
            return;
        this._inherited = x;
        this.updateState();
    },

    get overloaded()
    {
        return this._overloaded;
    },

    set overloaded(x)
    {
        if (x === this._overloaded)
            return;
        this._overloaded = x;
        this.updateState();
    },

    get disabled()
    {
        return this.property.disabled;
    },

    get name()
    {
        if (!this.disabled || !this.property.text)
            return this.property.name;

        var text = this.property.text;
        var index = text.indexOf(":");
        if (index < 1)
            return this.property.name;

        return text.substring(0, index).trim();
    },

    get priority()
    {
        if (this.disabled)
            return ""; // rely upon raw text to render it in the value field
        return this.property.priority;
    },

    get value()
    {
        if (!this.disabled || !this.property.text)
            return this.property.value;

        var match = this.property.text.match(/(.*);\s*/);
        if (!match || !match[1])
            return this.property.value;

        var text = match[1];
        var index = text.indexOf(":");
        if (index < 1)
            return this.property.value;

        return text.substring(index + 1).trim();
    },

    get parsedOk()
    {
        return this.property.parsedOk;
    },

    onattach: function()
    {
        this.updateTitle();
        this.listItemElement.addEventListener("mousedown", this._mouseDown.bind(this));
        this.listItemElement.addEventListener("mouseup", this._resetMouseDownElement.bind(this));
        this.listItemElement.addEventListener("click", this._mouseClick.bind(this));
    },

    _mouseDown: function(event)
    {
        if (this._parentPane) {
            this._parentPane._mouseDownTreeElement = this;
            this._parentPane._mouseDownTreeElementIsName = this._isNameElement(event.target);
            this._parentPane._mouseDownTreeElementIsValue = this._isValueElement(event.target);
        }
    },

    _resetMouseDownElement: function()
    {
        if (this._parentPane) {
            delete this._parentPane._mouseDownTreeElement;
            delete this._parentPane._mouseDownTreeElementIsName;
            delete this._parentPane._mouseDownTreeElementIsValue;
        }
    },

    updateTitle: function()
    {
        var value = this.value;

        this.updateState();

        var enabledCheckboxElement;
        if (this.parsedOk) {
            enabledCheckboxElement = document.createElement("input");
            enabledCheckboxElement.className = "enabled-button";
            enabledCheckboxElement.type = "checkbox";
            enabledCheckboxElement.checked = !this.disabled;
            enabledCheckboxElement.addEventListener("click", this.toggleEnabled.bind(this), false);
        }

        var nameElement = document.createElement("span");
        nameElement.className = "webkit-css-property";
        nameElement.textContent = this.name;
        nameElement.title = this.property.propertyText;
        this.nameElement = nameElement;

        this._expandElement = document.createElement("span");
        this._expandElement.className = "expand-element";

        var valueElement = document.createElement("span");
        valueElement.className = "value";
        this.valueElement = valueElement;

        var cf = WebInspector.Color.Format;

        if (value) {
            var self = this;

            function processValue(regex, processor, nextProcessor, valueText)
            {
                var container = document.createDocumentFragment();

                var items = valueText.replace(regex, "\0$1\0").split("\0");
                for (var i = 0; i < items.length; ++i) {
                    if ((i % 2) === 0) {
                        if (nextProcessor)
                            container.appendChild(nextProcessor(items[i]));
                        else
                            container.appendChild(document.createTextNode(items[i]));
                    } else {
                        var processedNode = processor(items[i]);
                        if (processedNode)
                            container.appendChild(processedNode);
                    }
                }

                return container;
            }

            function linkifyURL(url)
            {
                var hrefUrl = url;
                var match = hrefUrl.match(/['"]?([^'"]+)/);
                if (match)
                    hrefUrl = match[1];
                var container = document.createDocumentFragment();
                container.appendChild(document.createTextNode("url("));
                if (self._styleRule.sourceURL)
                    hrefUrl = WebInspector.completeURL(self._styleRule.sourceURL, hrefUrl);
                else if (this._parentPane.node)
                    hrefUrl = WebInspector.resourceURLForRelatedNode(this._parentPane.node, hrefUrl);
                var hasResource = !!WebInspector.resourceForURL(hrefUrl);
                // FIXME: WebInspector.linkifyURLAsNode() should really use baseURI.
                container.appendChild(WebInspector.linkifyURLAsNode(hrefUrl, url, undefined, !hasResource));
                container.appendChild(document.createTextNode(")"));
                return container;
            }

            function processColor(text)
            {
                try {
                    var color = new WebInspector.Color(text);
                } catch (e) {
                    return document.createTextNode(text);
                }

                var format = getFormat();
                var hasSpectrum = self._parentPane;
                var spectrum = hasSpectrum ? self._parentPane._spectrum : null;

                var swatchElement = document.createElement("span");
                var swatchInnerElement = swatchElement.createChild("span", "swatch-inner");
                swatchElement.title = WebInspector.UIString("Click to open a colorpicker. Shift-click to change color format");

                swatchElement.className = "swatch";

                swatchElement.addEventListener("mousedown", consumeEvent, false);
                swatchElement.addEventListener("click", swatchClick, false);
                swatchElement.addEventListener("dblclick", consumeEvent, false);

                swatchInnerElement.style.backgroundColor = text;

                var scrollerElement = hasSpectrum ? self._parentPane._computedStylePane.element.parentElement : null;

                function spectrumChanged(e)
                {
                    color = e.data;

                    var colorString = color.toString();

                    colorValueElement.textContent = colorString;
                    spectrum.displayText = colorString;
                    swatchInnerElement.style.backgroundColor = colorString;

                    self.applyStyleText(nameElement.textContent + ": " + valueElement.textContent, false, false, false);
                }

                function spectrumHidden(event)
                {
                    scrollerElement.removeEventListener("scroll", repositionSpectrum, false);
                    var commitEdit = event.data;
                    var propertyText = !commitEdit && self.originalPropertyText ? self.originalPropertyText : (nameElement.textContent + ": " + valueElement.textContent);
                    self.applyStyleText(propertyText, true, true, false);
                    spectrum.removeEventListener(WebInspector.Spectrum.Events.ColorChanged, spectrumChanged);
                    spectrum.removeEventListener(WebInspector.Spectrum.Events.Hidden, spectrumHidden);

                    delete self._parentPane._isEditingStyle;
                    delete self.originalPropertyText;
                }

                function repositionSpectrum()
                {
                    spectrum.reposition(swatchElement);
                }

                function swatchClick(e)
                {
                    // Shift + click toggles color formats.
                    // Click opens colorpicker, only if the element is not in computed styles section.
                    if (!spectrum || e.shiftKey)
                        changeColorDisplay(e);
                    else {
                        var visible = spectrum.toggle(swatchElement, color, format);

                        if (visible) {
                            spectrum.displayText = color.toString(format);
                            self.originalPropertyText = self.property.propertyText;
                            self._parentPane._isEditingStyle = true;
                            spectrum.addEventListener(WebInspector.Spectrum.Events.ColorChanged, spectrumChanged);
                            spectrum.addEventListener(WebInspector.Spectrum.Events.Hidden, spectrumHidden);

                            scrollerElement.addEventListener("scroll", repositionSpectrum, false);
                        }
                    }
                    e.consume(true);
                }

                function getFormat()
                {
                    var format;
                    var formatSetting = WebInspector.settings.colorFormat.get();
                    if (formatSetting === cf.Original)
                        format = cf.Original;
                    else if (color.nickname)
                        format = cf.Nickname;
                    else if (formatSetting === cf.RGB)
                        format = (color.simple ? cf.RGB : cf.RGBA);
                    else if (formatSetting === cf.HSL)
                        format = (color.simple ? cf.HSL : cf.HSLA);
                    else if (color.simple)
                        format = (color.hasShortHex() ? cf.ShortHEX : cf.HEX);
                    else
                        format = cf.RGBA;

                    return format;
                }

                var colorValueElement = document.createElement("span");
                colorValueElement.textContent = color.toString(format);

                function nextFormat(curFormat)
                {
                    // The format loop is as follows:
                    // * original
                    // * rgb(a)
                    // * hsl(a)
                    // * nickname (if the color has a nickname)
                    // * if the color is simple:
                    //   - shorthex (if has short hex)
                    //   - hex
                    switch (curFormat) {
                        case cf.Original:
                            return color.simple ? cf.RGB : cf.RGBA;

                        case cf.RGB:
                        case cf.RGBA:
                            return color.simple ? cf.HSL : cf.HSLA;

                        case cf.HSL:
                        case cf.HSLA:
                            if (color.nickname)
                                return cf.Nickname;
                            if (color.simple)
                                return color.hasShortHex() ? cf.ShortHEX : cf.HEX;
                            else
                                return cf.Original;

                        case cf.ShortHEX:
                            return cf.HEX;

                        case cf.HEX:
                            return cf.Original;

                        case cf.Nickname:
                            if (color.simple)
                                return color.hasShortHex() ? cf.ShortHEX : cf.HEX;
                            else
                                return cf.Original;

                        default:
                            return null;
                    }
                }

                function changeColorDisplay(event)
                {
                    do {
                        format = nextFormat(format);
                        var currentValue = color.toString(format || "");
                    } while (format && currentValue === color.value && format !== cf.Original);

                    if (format)
                        colorValueElement.textContent = currentValue;
                }

                var container = document.createElement("nobr");
                container.appendChild(swatchElement);
                container.appendChild(colorValueElement);
                return container;
            }

            var colorRegex = /((?:rgb|hsl)a?\([^)]+\)|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|\b\w+\b(?!-))/g;
            var colorProcessor = processValue.bind(window, colorRegex, processColor, null);

            valueElement.appendChild(processValue(/url\(\s*([^)\s]+)\s*\)/g, linkifyURL.bind(this), WebInspector.CSSKeywordCompletions.isColorAwareProperty(self.name) ? colorProcessor : null, value));
        }

        this.listItemElement.removeChildren();
        nameElement.normalize();
        valueElement.normalize();

        if (!this.treeOutline)
            return;

        // Append the checkbox for root elements of an editable section.
        if (enabledCheckboxElement && this.treeOutline.section && this.parent.root && !this.section.computedStyle)
            this.listItemElement.appendChild(enabledCheckboxElement);
        this.listItemElement.appendChild(nameElement);
        this.listItemElement.appendChild(document.createTextNode(": "));
        this.listItemElement.appendChild(this._expandElement);
        this.listItemElement.appendChild(valueElement);
        this.listItemElement.appendChild(document.createTextNode(";"));

        if (!this.parsedOk) {
            // Avoid having longhands under an invalid shorthand.
            this.hasChildren = false;
            this.listItemElement.addStyleClass("not-parsed-ok");

            // Add a separate exclamation mark IMG element with a tooltip.
            var exclamationElement = document.createElement("img");
            exclamationElement.className = "exclamation-mark";
            exclamationElement.title = WebInspector.CSSCompletions.cssPropertiesMetainfo.keySet()[this.property.name.toLowerCase()] ? WebInspector.UIString("Invalid property value.") : WebInspector.UIString("Unknown property name.");
            this.listItemElement.insertBefore(exclamationElement, this.listItemElement.firstChild);
        }
        if (this.property.inactive)
            this.listItemElement.addStyleClass("inactive");
    },

    _updatePane: function(userCallback)
    {
        if (this.treeOutline && this.treeOutline.section && this.treeOutline.section.pane)
            this.treeOutline.section.pane._refreshUpdate(this.treeOutline.section, false, userCallback);
        else  {
            if (userCallback)
                userCallback();
        }
    },

    toggleEnabled: function(event)
    {
        var disabled = !event.target.checked;

        function callback(newStyle)
        {
            if (!newStyle)
                return;

            this.style = newStyle;
            this._styleRule.style = newStyle;

            if (this.treeOutline.section && this.treeOutline.section.pane)
                this.treeOutline.section.pane.dispatchEventToListeners("style property toggled");

            this._updatePane();

            delete this._parentPane._userOperation;
        }

        this._parentPane._userOperation = true;
        this.property.setDisabled(disabled, callback.bind(this));
        event.consume();
    },

    updateState: function()
    {
        if (!this.listItemElement)
            return;

        if (this.style.isPropertyImplicit(this.name) || this.value === "initial")
            this.listItemElement.addStyleClass("implicit");
        else
            this.listItemElement.removeStyleClass("implicit");

        if (this.inherited)
            this.listItemElement.addStyleClass("inherited");
        else
            this.listItemElement.removeStyleClass("inherited");

        if (this.overloaded)
            this.listItemElement.addStyleClass("overloaded");
        else
            this.listItemElement.removeStyleClass("overloaded");

        if (this.disabled)
            this.listItemElement.addStyleClass("disabled");
        else
            this.listItemElement.removeStyleClass("disabled");
    },

    onpopulate: function()
    {
        // Only populate once and if this property is a shorthand.
        if (this.children.length || !this.isShorthand)
            return;

        var longhandProperties = this.style.longhandProperties(this.name);
        for (var i = 0; i < longhandProperties.length; ++i) {
            var name = longhandProperties[i].name;

            if (this.treeOutline.section) {
                var inherited = this.treeOutline.section.isPropertyInherited(name);
                var overloaded = this.treeOutline.section.isPropertyOverloaded(name);
            }

            var liveProperty = this.style.getLiveProperty(name);
            if (!liveProperty)
                continue;

            var item = new WebInspector.StylePropertyTreeElement(this.section, this._parentPane, this._styleRule, this.style, liveProperty, false, inherited, overloaded);
            this.appendChild(item);
        }
    },

    restoreNameElement: function()
    {
        // Restore <span class="webkit-css-property"> if it doesn't yet exist or was accidentally deleted.
        if (this.nameElement === this.listItemElement.querySelector(".webkit-css-property"))
            return;

        this.nameElement = document.createElement("span");
        this.nameElement.className = "webkit-css-property";
        this.nameElement.textContent = "";
        this.listItemElement.insertBefore(this.nameElement, this.listItemElement.firstChild);
    },

    _mouseClick: function(event)
    {
        event.consume(true);

        if (event.target === this.listItemElement) {
            if (!this.section.editable) 
                return;

            if (this.section._checkWillCancelEditing())
                return;
            this.section.addNewBlankProperty(this.property.index + 1).startEditing();
            return;
        }

        this.startEditing(event.target);
    },

    _isNameElement: function(element)
    {
        return element.enclosingNodeOrSelfWithClass("webkit-css-property") === this.nameElement;
    },

    _isValueElement: function(element)
    {
        return !!element.enclosingNodeOrSelfWithClass("value");
    },

    startEditing: function(selectElement)
    {
        // FIXME: we don't allow editing of longhand properties under a shorthand right now.
        if (this.parent.isShorthand)
            return;

        if (selectElement === this._expandElement)
            return;

        if (this.treeOutline.section && !this.treeOutline.section.editable)
            return;

        if (!selectElement)
            selectElement = this.nameElement; // No arguments passed in - edit the name element by default.
        else
            selectElement = selectElement.enclosingNodeOrSelfWithClass("webkit-css-property") || selectElement.enclosingNodeOrSelfWithClass("value");

        var isEditingName = selectElement === this.nameElement;
        if (!isEditingName && selectElement !== this.valueElement) {
            // Double-click in the LI - start editing value.
            isEditingName = false;
            selectElement = this.valueElement;
        }

        if (WebInspector.isBeingEdited(selectElement))
            return;

        var context = {
            expanded: this.expanded,
            hasChildren: this.hasChildren,
            isEditingName: isEditingName,
            previousContent: selectElement.textContent
        };

        // Lie about our children to prevent expanding on double click and to collapse shorthands.
        this.hasChildren = false;

        if (selectElement.parentElement)
            selectElement.parentElement.addStyleClass("child-editing");
        selectElement.textContent = selectElement.textContent; // remove color swatch and the like

        function pasteHandler(context, event)
        {
            var data = event.clipboardData.getData("Text");
            if (!data)
                return;
            var colonIdx = data.indexOf(":");
            if (colonIdx < 0)
                return;
            var name = data.substring(0, colonIdx).trim();
            var value = data.substring(colonIdx + 1).trim();

            event.preventDefault();

            if (!("originalName" in context)) {
                context.originalName = this.nameElement.textContent;
                context.originalValue = this.valueElement.textContent;
            }
            this.nameElement.textContent = name;
            this.valueElement.textContent = value;
            this.nameElement.normalize();
            this.valueElement.normalize();

            this.editingCommitted(null, event.target.textContent, context.previousContent, context, "forward");
        }

        function blurListener(context, event)
        {
            var treeElement = this._parentPane._mouseDownTreeElement;
            var moveDirection = "";
            if (treeElement === this) {
                if (isEditingName && this._parentPane._mouseDownTreeElementIsValue)
                    moveDirection = "forward";
                if (!isEditingName && this._parentPane._mouseDownTreeElementIsName)
                    moveDirection = "backward";
            }
            this.editingCommitted(null, event.target.textContent, context.previousContent, context, moveDirection);
        }

        delete this.originalPropertyText;

        this._parentPane._isEditingStyle = true;
        if (selectElement.parentElement)
            selectElement.parentElement.scrollIntoViewIfNeeded(false);

        var applyItemCallback = !isEditingName ? this._applyFreeFlowStyleTextEdit.bind(this, true) : undefined;
        this._prompt = new WebInspector.StylesSidebarPane.CSSPropertyPrompt(isEditingName ? WebInspector.CSSCompletions.cssPropertiesMetainfo : WebInspector.CSSKeywordCompletions.forProperty(this.nameElement.textContent), this, isEditingName);
        if (applyItemCallback) {
            this._prompt.addEventListener(WebInspector.TextPrompt.Events.ItemApplied, applyItemCallback, this);
            this._prompt.addEventListener(WebInspector.TextPrompt.Events.ItemAccepted, applyItemCallback, this);
        }
        var proxyElement = this._prompt.attachAndStartEditing(selectElement, blurListener.bind(this, context));

        proxyElement.addEventListener("keydown", this.editingNameValueKeyDown.bind(this, context), false);
        if (isEditingName)
            proxyElement.addEventListener("paste", pasteHandler.bind(this, context));

        window.getSelection().setBaseAndExtent(selectElement, 0, selectElement, 1);
    },

    editingNameValueKeyDown: function(context, event)
    {
        if (event.handled)
            return;

        var isEditingName = context.isEditingName;
        var result;

        function shouldCommitValueSemicolon(text, cursorPosition)
        {
            // FIXME: should this account for semicolons inside comments?
            var openQuote = "";
            for (var i = 0; i < cursorPosition; ++i) {
                var ch = text[i];
                if (ch === "\\" && openQuote !== "")
                    ++i; // skip next character inside string
                else if (!openQuote && (ch === "\"" || ch === "'"))
                    openQuote = ch;
                else if (openQuote === ch)
                    openQuote = "";
            }
            return !openQuote;
        }

        // FIXME: the ":"/";" detection does not work for non-US layouts due to the event being keydown rather than keypress.
        var isFieldInputTerminated = (event.keyCode === WebInspector.KeyboardShortcut.Keys.Semicolon.code) &&
            (isEditingName ? event.shiftKey : (!event.shiftKey && shouldCommitValueSemicolon(event.target.textContent, event.target.selectionLeftOffset())));
        if (isEnterKey(event) || isFieldInputTerminated) {
            // Enter or colon (for name)/semicolon outside of string (for value).
            event.preventDefault();
            result = "forward";
        } else if (event.keyCode === WebInspector.KeyboardShortcut.Keys.Esc.code || event.keyIdentifier === "U+001B")
            result = "cancel";
        else if (!isEditingName && this._newProperty && event.keyCode === WebInspector.KeyboardShortcut.Keys.Backspace.code) {
            // For a new property, when Backspace is pressed at the beginning of new property value, move back to the property name.
            var selection = window.getSelection();
            if (selection.isCollapsed && !selection.focusOffset) {
                event.preventDefault();
                result = "backward";
            }
        } else if (event.keyIdentifier === "U+0009") { // Tab key.
            result = event.shiftKey ? "backward" : "forward";
            event.preventDefault();
        }

        if (result) {
            switch (result) {
            case "cancel":
                this.editingCancelled(null, context);
                break;
            case "forward":
            case "backward":
                this.editingCommitted(null, event.target.textContent, context.previousContent, context, result);
                break;
            }

            event.consume();
            return;
        }

        if (!isEditingName)
            this._applyFreeFlowStyleTextEdit(false);
    },

    _applyFreeFlowStyleTextEdit: function(now)
    {
        if (this._applyFreeFlowStyleTextEditTimer)
            clearTimeout(this._applyFreeFlowStyleTextEditTimer);

        function apply()
        {
            var valueText = this.valueElement.textContent;
            if (valueText.indexOf(";") === -1)
                this.applyStyleText(this.nameElement.textContent + ": " + valueText, false, false, false);
        }
        if (now)
            apply.call(this);
        else
            this._applyFreeFlowStyleTextEditTimer = setTimeout(apply.bind(this), 100);
    },

    kickFreeFlowStyleEditForTest: function()
    {
        this._applyFreeFlowStyleTextEdit(true);
    },

    editingEnded: function(context)
    {
        this._resetMouseDownElement();
        if (this._applyFreeFlowStyleTextEditTimer)
            clearTimeout(this._applyFreeFlowStyleTextEditTimer);

        this.hasChildren = context.hasChildren;
        if (context.expanded)
            this.expand();
        var editedElement = context.isEditingName ? this.nameElement : this.valueElement;
        // The proxyElement has been deleted, no need to remove listener.
        if (editedElement.parentElement)
            editedElement.parentElement.removeStyleClass("child-editing");

        delete this._parentPane._isEditingStyle;
    },

    editingCancelled: function(element, context)
    {
        this._removePrompt();
        this._revertStyleUponEditingCanceled(this.originalPropertyText);
        // This should happen last, as it clears the info necessary to restore the property value after [Page]Up/Down changes.
        this.editingEnded(context);
    },

    _revertStyleUponEditingCanceled: function(originalPropertyText)
    {
        if (typeof originalPropertyText === "string") {
            delete this.originalPropertyText;
            this.applyStyleText(originalPropertyText, true, false, true);
        } else {
            if (this._newProperty)
                this.treeOutline.removeChild(this);
            else
                this.updateTitle();
        }
    },

    _findSibling: function(moveDirection)
    {
        var target = this;
        do {
            target = (moveDirection === "forward" ? target.nextSibling : target.previousSibling);
        } while(target && target.inherited);

        return target;
    },

    editingCommitted: function(element, userInput, previousContent, context, moveDirection)
    {
        this._removePrompt();
        this.editingEnded(context);
        var isEditingName = context.isEditingName;

        // Determine where to move to before making changes
        var createNewProperty, moveToPropertyName, moveToSelector;
        var moveTo = this;
        var moveToOther = (isEditingName ^ (moveDirection === "forward"));
        var abandonNewProperty = this._newProperty && !userInput && (moveToOther || isEditingName);
        if (moveDirection === "forward" && !isEditingName || moveDirection === "backward" && isEditingName) {
            moveTo = moveTo._findSibling(moveDirection);
            if (moveTo)
                moveToPropertyName = moveTo.name;
            else if (moveDirection === "forward" && (!this._newProperty || userInput))
                createNewProperty = true;
            else if (moveDirection === "backward")
                moveToSelector = true;
        }

        // Make the Changes and trigger the moveToNextCallback after updating.
        var moveToIndex = moveTo && this.treeOutline ? this.treeOutline.children.indexOf(moveTo) : -1;
        var blankInput = /^\s*$/.test(userInput);
        var isDataPasted = "originalName" in context;
        var isDirtyViaPaste = isDataPasted && (this.nameElement.textContent !== context.originalName || this.valueElement.textContent !== context.originalValue);
        var shouldCommitNewProperty = this._newProperty && (moveToOther || (!moveDirection && !isEditingName) || (isEditingName && blankInput));
        if (((userInput !== previousContent || isDirtyViaPaste) && !this._newProperty) || shouldCommitNewProperty) {
            this.treeOutline.section._afterUpdate = moveToNextCallback.bind(this, this._newProperty, !blankInput, this.treeOutline.section);
            var propertyText;
            if (blankInput || (this._newProperty && /^\s*$/.test(this.valueElement.textContent)))
                propertyText = "";
            else {
                if (isEditingName)
                    propertyText = userInput + ": " + this.valueElement.textContent;
                else
                    propertyText = this.nameElement.textContent + ": " + userInput;
            }
            this.applyStyleText(propertyText, true, true, false);
        } else {
            if (!isDataPasted && !this._newProperty)
                this.updateTitle();
            moveToNextCallback.call(this, this._newProperty, false, this.treeOutline.section);
        }

        // The Callback to start editing the next/previous property/selector.
        function moveToNextCallback(alreadyNew, valueChanged, section)
        {
            if (!moveDirection)
                return;

            // User just tabbed through without changes.
            if (moveTo && moveTo.parent) {
                moveTo.startEditing(!isEditingName ? moveTo.nameElement : moveTo.valueElement);
                return;
            }

            // User has made a change then tabbed, wiping all the original treeElements.
            // Recalculate the new treeElement for the same property we were going to edit next.
            if (moveTo && !moveTo.parent) {
                var propertyElements = section.propertiesTreeOutline.children;
                if (moveDirection === "forward" && blankInput && !isEditingName)
                    --moveToIndex;
                if (moveToIndex >= propertyElements.length && !this._newProperty)
                    createNewProperty = true;
                else {
                    var treeElement = moveToIndex >= 0 ? propertyElements[moveToIndex] : null;
                    if (treeElement) {
                        var elementToEdit = !isEditingName ? treeElement.nameElement : treeElement.valueElement;
                        if (alreadyNew && blankInput)
                            elementToEdit = moveDirection === "forward" ? treeElement.nameElement : treeElement.valueElement;
                        treeElement.startEditing(elementToEdit);
                        return;
                    } else if (!alreadyNew)
                        moveToSelector = true;
                }
            }

            // Create a new attribute in this section (or move to next editable selector if possible).
            if (createNewProperty) {
                if (alreadyNew && !valueChanged && (isEditingName ^ (moveDirection === "backward")))
                    return;

                section.addNewBlankProperty().startEditing();
                return;
            }

            if (abandonNewProperty) {
                moveTo = this._findSibling(moveDirection);
                var sectionToEdit = (moveTo || moveDirection === "backward") ? section : section.nextEditableSibling();
                if (sectionToEdit) {
                    if (sectionToEdit.rule)
                        sectionToEdit.startEditingSelector();
                    else
                        sectionToEdit._moveEditorFromSelector(moveDirection);
                }
                return;
            }

            if (moveToSelector) {
                if (section.rule)
                    section.startEditingSelector();
                else
                    section._moveEditorFromSelector(moveDirection);
            }
        }
    },

    _removePrompt: function()
    {
        // BUG 53242. This cannot go into editingEnded(), as it should always happen first for any editing outcome.
        if (this._prompt) {
            this._prompt.detach();
            delete this._prompt;
        }
    },

    _hasBeenModifiedIncrementally: function()
    {
        // New properties applied via up/down or live editing have an originalPropertyText and will be deleted later
        // on, if cancelled, when the empty string gets applied as their style text.
        return typeof this.originalPropertyText === "string" || (!!this.property.propertyText && this._newProperty);
    },

    applyStyleText: function(styleText, updateInterface, majorChange, isRevert)
    {
        function userOperationFinishedCallback(parentPane, updateInterface)
        {
            if (updateInterface)
                delete parentPane._userOperation;
        }

        // Leave a way to cancel editing after incremental changes.
        if (!isRevert && !updateInterface && !this._hasBeenModifiedIncrementally()) {
            // Remember the rule's original CSS text on [Page](Up|Down), so it can be restored
            // if the editing is canceled.
            this.originalPropertyText = this.property.propertyText;
        }

        if (!this.treeOutline)
            return;

        var section = this.treeOutline.section;
        styleText = styleText.replace(/\s/g, " ").trim(); // Replace &nbsp; with whitespace.
        var styleTextLength = styleText.length;
        if (!styleTextLength && updateInterface && !isRevert && this._newProperty && !this._hasBeenModifiedIncrementally()) {
            // The user deleted everything and never applied a new property value via Up/Down scrolling/live editing, so remove the tree element and update.
            this.parent.removeChild(this);
            section.afterUpdate();
            return;
        }

        var currentNode = this._parentPane.node;
        if (updateInterface)
            this._parentPane._userOperation = true;

        function callback(userCallback, originalPropertyText, newStyle)
        {
            if (!newStyle) {
                if (updateInterface) {
                    // It did not apply, cancel editing.
                    this._revertStyleUponEditingCanceled(originalPropertyText);
                }
                userCallback();
                return;
            }

            if (this._newProperty)
                this._newPropertyInStyle = true;
            this.style = newStyle;
            this.property = newStyle.propertyAt(this.property.index);
            this._styleRule.style = this.style;

            if (section && section.pane)
                section.pane.dispatchEventToListeners("style edited");

            if (updateInterface && currentNode === section.pane.node) {
                this._updatePane(userCallback);
                return;
            }

            userCallback();
        }

        // Append a ";" if the new text does not end in ";".
        // FIXME: this does not handle trailing comments.
        if (styleText.length && !/;\s*$/.test(styleText))
            styleText += ";";
        var overwriteProperty = !!(!this._newProperty || this._newPropertyInStyle);
        this.property.setText(styleText, majorChange, overwriteProperty, callback.bind(this, userOperationFinishedCallback.bind(null, this._parentPane, updateInterface), this.originalPropertyText));
    },

    ondblclick: function()
    {
        return true; // handled
    },

    isEventWithinDisclosureTriangle: function(event)
    {
        if (!this.section.computedStyle)
            return event.target === this._expandElement;
        return TreeElement.prototype.isEventWithinDisclosureTriangle.call(this, event);
    }
}

WebInspector.StylePropertyTreeElement.prototype.__proto__ = TreeElement.prototype;

/**
 * @constructor
 * @extends {WebInspector.TextPrompt}
 * @param {function(*)=} acceptCallback
 */
WebInspector.StylesSidebarPane.CSSPropertyPrompt = function(cssCompletions, sidebarPane, isEditingName, acceptCallback)
{
    // Use the same callback both for applyItemCallback and acceptItemCallback.
    WebInspector.TextPrompt.call(this, this._buildPropertyCompletions.bind(this), WebInspector.StyleValueDelimiters);
    this.setSuggestBoxEnabled("generic-suggest");
    this._cssCompletions = cssCompletions;
    this._sidebarPane = sidebarPane;
    this._isEditingName = isEditingName;
}

WebInspector.StylesSidebarPane.CSSPropertyPrompt.prototype = {
    onKeyDown: function(event)
    {
        switch (event.keyIdentifier) {
        case "Up":
        case "Down":
        case "PageUp":
        case "PageDown":
            if (this._handleNameOrValueUpDown(event)) {
                event.preventDefault();
                return;
            }
            break;
        }

        WebInspector.TextPrompt.prototype.onKeyDown.call(this, event);
    },

    onMouseWheel: function(event)
    {
        if (this._handleNameOrValueUpDown(event)) {
            event.consume(true);
            return;
        }
        WebInspector.TextPrompt.prototype.onMouseWheel.call(this, event);
    },

    tabKeyPressed: function()
    {
        this.acceptAutoComplete();

        // Always tab to the next field.
        return false;
    },

    _handleNameOrValueUpDown: function(event)
    {
        function finishHandler(originalValue, replacementString)
        {
            // Synthesize property text disregarding any comments, custom whitespace etc.
            this._sidebarPane.applyStyleText(this._sidebarPane.nameElement.textContent + ": " + this._sidebarPane.valueElement.textContent, false, false, false);
        }
    
        // Handle numeric value increment/decrement only at this point.
        if (!this._isEditingName && WebInspector.handleElementValueModifications(event, this._sidebarPane.valueElement, finishHandler.bind(this), this._isValueSuggestion.bind(this)))
            return true;

        return false;
    },

    _isValueSuggestion: function(word)
    {
        if (!word)
            return false;
        word = word.toLowerCase();
        return this._cssCompletions.keySet().hasOwnProperty(word);
    },

    _buildPropertyCompletions: function(textPrompt, wordRange, force, completionsReadyCallback)
    {
        var prefix = wordRange.toString().toLowerCase();
        if (!prefix && !force)
            return;

        var results = this._cssCompletions.startsWith(prefix);
        completionsReadyCallback(results);
    }
}

WebInspector.StylesSidebarPane.CSSPropertyPrompt.prototype.__proto__ = WebInspector.TextPrompt.prototype;
;

/**
 * @constructor
 * @extends {WebInspector.Panel}
 */
WebInspector.ElementsPanel = function()
{
    WebInspector.Panel.call(this, "elements");
    this.registerRequiredCSS("breadcrumbList.css");
    this.registerRequiredCSS("elementsPanel.css");
    this.registerRequiredCSS("textPrompt.css");
    this.setHideOnDetach();

    const initialSidebarWidth = 325;
    const minimalContentWidthPercent = 34;
    this.createSplitView(this.element, WebInspector.SplitView.SidebarPosition.Right, initialSidebarWidth);
    this.splitView.minimalSidebarWidth = Preferences.minElementsSidebarWidth;
    this.splitView.minimalMainWidthPercent = minimalContentWidthPercent;

    this.contentElement = this.splitView.mainElement;
    this.contentElement.id = "elements-content";
    this.contentElement.addStyleClass("outline-disclosure");
    this.contentElement.addStyleClass("source-code");
    if (!WebInspector.settings.domWordWrap.get())
        this.contentElement.classList.add("nowrap");
    WebInspector.settings.domWordWrap.addChangeListener(this._domWordWrapSettingChanged.bind(this));

    this.contentElement.addEventListener("contextmenu", this._contextMenuEventFired.bind(this), true);

    this.treeOutline = new WebInspector.ElementsTreeOutline(true, true, false, this._populateContextMenu.bind(this), this._setPseudoClassForNodeId.bind(this));
    this.treeOutline.wireToDomAgent();

    this.treeOutline.addEventListener(WebInspector.ElementsTreeOutline.Events.SelectedNodeChanged, this._selectedNodeChanged, this);

    this.crumbsElement = document.createElement("div");
    this.crumbsElement.className = "crumbs";
    this.crumbsElement.addEventListener("mousemove", this._mouseMovedInCrumbs.bind(this), false);
    this.crumbsElement.addEventListener("mouseout", this._mouseMovedOutOfCrumbs.bind(this), false);

    this.sidebarPanes = {};
    this.sidebarPanes.computedStyle = new WebInspector.ComputedStyleSidebarPane();
    this.sidebarPanes.styles = new WebInspector.StylesSidebarPane(this.sidebarPanes.computedStyle, this._setPseudoClassForNodeId.bind(this));
    this.sidebarPanes.metrics = new WebInspector.MetricsSidebarPane();
    this.sidebarPanes.properties = new WebInspector.PropertiesSidebarPane();
    this.sidebarPanes.domBreakpoints = WebInspector.domBreakpointsSidebarPane;
    this.sidebarPanes.eventListeners = new WebInspector.EventListenersSidebarPane();

    this.sidebarPanes.styles.onexpand = this.updateStyles.bind(this);
    this.sidebarPanes.metrics.onexpand = this.updateMetrics.bind(this);
    this.sidebarPanes.properties.onexpand = this.updateProperties.bind(this);
    this.sidebarPanes.eventListeners.onexpand = this.updateEventListeners.bind(this);

    this.sidebarPanes.styles.expanded = true;

    this.sidebarPanes.styles.addEventListener("style edited", this._stylesPaneEdited, this);
    this.sidebarPanes.styles.addEventListener("style property toggled", this._stylesPaneEdited, this);
    this.sidebarPanes.metrics.addEventListener("metrics edited", this._metricsPaneEdited, this);

    for (var pane in this.sidebarPanes) {
        this.sidebarElement.appendChild(this.sidebarPanes[pane].element);
        if (this.sidebarPanes[pane].onattach)
            this.sidebarPanes[pane].onattach();
    }

    this._registerShortcuts();

    this._popoverHelper = new WebInspector.PopoverHelper(this.element, this._getPopoverAnchor.bind(this), this._showPopover.bind(this));
    this._popoverHelper.setTimeout(0);

    WebInspector.domAgent.addEventListener(WebInspector.DOMAgent.Events.NodeRemoved, this._nodeRemoved, this);
    WebInspector.domAgent.addEventListener(WebInspector.DOMAgent.Events.DocumentUpdated, this._documentUpdatedEvent, this);
    WebInspector.domAgent.addEventListener(WebInspector.DOMAgent.Events.InspectElementRequested, this._inspectElementRequested, this);

    if (WebInspector.domAgent.existingDocument())
        this._documentUpdated(WebInspector.domAgent.existingDocument());
}

WebInspector.ElementsPanel.prototype = {
    get statusBarItems()
    {
        return [this.crumbsElement];
    },

    defaultFocusedElement: function()
    {
        return this.treeOutline.element;
    },

    statusBarResized: function()
    {
        this.updateBreadcrumbSizes();
    },

    wasShown: function()
    {
        // Attach heavy component lazily
        if (this.treeOutline.element.parentElement !== this.contentElement)
            this.contentElement.appendChild(this.treeOutline.element);

        WebInspector.Panel.prototype.wasShown.call(this);

        this.updateBreadcrumb();
        this.treeOutline.updateSelection();
        this.treeOutline.setVisible(true);

        if (!this.treeOutline.rootDOMNode)
            WebInspector.domAgent.requestDocument();

        this.sidebarElement.insertBefore(this.sidebarPanes.domBreakpoints.element, this.sidebarPanes.eventListeners.element);
    },

    willHide: function()
    {
        WebInspector.domAgent.hideDOMNodeHighlight();
        this.treeOutline.setVisible(false);
        this._popoverHelper.hidePopover();

        // Detach heavy component on hide
        this.contentElement.removeChild(this.treeOutline.element);

        for (var pane in this.sidebarPanes) {
            if (this.sidebarPanes[pane].willHide)
                this.sidebarPanes[pane].willHide();
        }

        WebInspector.Panel.prototype.willHide.call(this);
    },

    onResize: function()
    {
        this.treeOutline.updateSelection();
        this.updateBreadcrumbSizes();
    },

    /**
     * @param {DOMAgent.NodeId} nodeId
     * @param {string} pseudoClass
     * @param {boolean} enable
     */
    _setPseudoClassForNodeId: function(nodeId, pseudoClass, enable)
    {
        var node = WebInspector.domAgent.nodeForId(nodeId);
        if (!node)
            return;

        var pseudoClasses = node.getUserProperty(WebInspector.ElementsTreeOutline.PseudoStateDecorator.PropertyName);
        if (enable) {
            pseudoClasses = pseudoClasses || [];
            if (pseudoClasses.indexOf(pseudoClass) >= 0)
                return;
            pseudoClasses.push(pseudoClass);
            node.setUserProperty(WebInspector.ElementsTreeOutline.PseudoStateDecorator.PropertyName, pseudoClasses);
        } else {
            if (!pseudoClasses || pseudoClasses.indexOf(pseudoClass) < 0)
                return;
            pseudoClasses.remove(pseudoClass);
            if (!pseudoClasses.length)
                node.removeUserProperty(WebInspector.ElementsTreeOutline.PseudoStateDecorator.PropertyName);
        }

        this.treeOutline.updateOpenCloseTags(node);
        WebInspector.cssModel.forcePseudoState(node.id, node.getUserProperty(WebInspector.ElementsTreeOutline.PseudoStateDecorator.PropertyName));
        this._metricsPaneEdited();
        this._stylesPaneEdited();
    },

    _selectedNodeChanged: function()
    {
        var selectedNode = this.selectedDOMNode();
        if (!selectedNode && this._lastValidSelectedNode)
            this._selectedPathOnReset = this._lastValidSelectedNode.path();

        this.updateBreadcrumb(false);

        this._updateSidebars();

        if (selectedNode) {
            ConsoleAgent.addInspectedNode(selectedNode.id);
            this._lastValidSelectedNode = selectedNode;
        }
        WebInspector.notifications.dispatchEventToListeners(WebInspector.ElementsTreeOutline.Events.SelectedNodeChanged);
    },

    _updateSidebars: function()
    {
        for (var pane in this.sidebarPanes)
           this.sidebarPanes[pane].needsUpdate = true;

        this.updateStyles(true);
        this.updateMetrics();
        this.updateProperties();
        this.updateEventListeners();
    },

    _reset: function()
    {
        delete this.currentQuery;
    },

    _documentUpdatedEvent: function(event)
    {
        this._documentUpdated(event.data);
    },

    _documentUpdated: function(inspectedRootDocument)
    {
        this._reset();
        this.searchCanceled();

        this.treeOutline.rootDOMNode = inspectedRootDocument;

        if (!inspectedRootDocument) {
            if (this.isShowing())
                WebInspector.domAgent.requestDocument();
            return;
        }

        this.sidebarPanes.domBreakpoints.restoreBreakpoints();

        /**
         * @this {WebInspector.ElementsPanel}
         * @param {WebInspector.DOMNode=} candidateFocusNode
         */
        function selectNode(candidateFocusNode)
        {
            if (!candidateFocusNode)
                candidateFocusNode = inspectedRootDocument.body || inspectedRootDocument.documentElement;

            if (!candidateFocusNode)
                return;

            this.selectDOMNode(candidateFocusNode);
            if (this.treeOutline.selectedTreeElement)
                this.treeOutline.selectedTreeElement.expand();
        }

        function selectLastSelectedNode(nodeId)
        {
            if (this.selectedDOMNode()) {
                // Focused node has been explicitly set while reaching out for the last selected node.
                return;
            }
            var node = nodeId ? WebInspector.domAgent.nodeForId(nodeId) : null;
            selectNode.call(this, node);
        }

        if (this._selectedPathOnReset)
            WebInspector.domAgent.pushNodeByPathToFrontend(this._selectedPathOnReset, selectLastSelectedNode.bind(this));
        else
            selectNode.call(this);
        delete this._selectedPathOnReset;
    },

    searchCanceled: function()
    {
        delete this._searchQuery;
        this._hideSearchHighlights();

        WebInspector.searchController.updateSearchMatchesCount(0, this);

        delete this._currentSearchResultIndex;
        delete this._searchResults;
        WebInspector.domAgent.cancelSearch();
    },

    /**
     * @param {string} query
     */
    performSearch: function(query)
    {
        // Call searchCanceled since it will reset everything we need before doing a new search.
        this.searchCanceled();

        const whitespaceTrimmedQuery = query.trim();
        if (!whitespaceTrimmedQuery.length)
            return;

        this._searchQuery = query;

        /**
         * @param {number} resultCount
         */
        function resultCountCallback(resultCount)
        {
            WebInspector.searchController.updateSearchMatchesCount(resultCount, this);
            if (!resultCount)
                return;

            this._searchResults = new Array(resultCount);
            this._currentSearchResultIndex = -1;
            this.jumpToNextSearchResult();
        }
        WebInspector.domAgent.performSearch(whitespaceTrimmedQuery, resultCountCallback.bind(this));
    },

    _contextMenuEventFired: function(event)
    {
        function toggleWordWrap()
        {
            WebInspector.settings.domWordWrap.set(!WebInspector.settings.domWordWrap.get());
        }

        var contextMenu = new WebInspector.ContextMenu();
        var populated = this.treeOutline.populateContextMenu(contextMenu, event);
        if (populated)
            contextMenu.appendSeparator();
        contextMenu.appendCheckboxItem(WebInspector.UIString(WebInspector.useLowerCaseMenuTitles() ? "Word wrap" : "Word Wrap"), toggleWordWrap.bind(this), WebInspector.settings.domWordWrap.get());

        contextMenu.show(event);
    },

    _domWordWrapSettingChanged: function(event)
    {
        if (event.data)
            this.contentElement.removeStyleClass("nowrap");
        else
            this.contentElement.addStyleClass("nowrap");

        var selectedNode = this.selectedDOMNode();
        if (!selectedNode)
            return;

        var treeElement = this.treeOutline.findTreeElement(selectedNode);
        if (treeElement)
            treeElement.updateSelection(); // Recalculate selection highlight dimensions.
    },

    switchToAndFocus: function(node)
    {
        // Reset search restore.
        WebInspector.searchController.cancelSearch();
        WebInspector.inspectorView.setCurrentPanel(this);
        this.selectDOMNode(node, true);
    },

    _populateContextMenu: function(contextMenu, node)
    {
        // Add debbuging-related actions
        contextMenu.appendSeparator();
        var pane = this.sidebarPanes.domBreakpoints;
        pane.populateNodeContextMenu(node, contextMenu);
    },

    _getPopoverAnchor: function(element)
    {
        var anchor = element.enclosingNodeOrSelfWithClass("webkit-html-resource-link");
        if (anchor) {
            if (!anchor.href)
                return null;

            var resource = WebInspector.resourceTreeModel.resourceForURL(anchor.href);
            if (!resource || resource.type !== WebInspector.resourceTypes.Image)
                return null;

            anchor.removeAttribute("title");
        }
        return anchor;
    },
    
    _loadDimensionsForNode: function(treeElement, callback)
    {
        // We get here for CSS properties, too, so bail out early for non-DOM treeElements.
        if (treeElement.treeOutline !== this.treeOutline) {
            callback();
            return;
        }
        
        var node = /** @type {WebInspector.DOMNode} */ treeElement.representedObject;

        if (!node.nodeName() || node.nodeName().toLowerCase() !== "img") {
            callback();
            return;
        }

        WebInspector.RemoteObject.resolveNode(node, "", resolvedNode);

        function resolvedNode(object)
        {
            if (!object) {
                callback();
                return;
            }

            object.callFunctionJSON(dimensions, undefined, callback);
            object.release();

            function dimensions()
            {
                return { offsetWidth: this.offsetWidth, offsetHeight: this.offsetHeight, naturalWidth: this.naturalWidth, naturalHeight: this.naturalHeight };
            }
        }
    },

    /**
     * @param {Element} anchor
     * @param {WebInspector.Popover} popover
     */
    _showPopover: function(anchor, popover)
    {
        var listItem = anchor.enclosingNodeOrSelfWithNodeName("li");
        if (listItem && listItem.treeElement)
            this._loadDimensionsForNode(listItem.treeElement, WebInspector.buildImagePreviewContents.bind(WebInspector, anchor.href, true, showPopover));
        else
            WebInspector.buildImagePreviewContents(anchor.href, true, showPopover);

        /**
         * @param {Element=} contents
         */
        function showPopover(contents)
        {
            if (!contents)
                return;
            popover.setCanShrink(false);
            popover.show(contents, anchor);
        }
    },

    jumpToNextSearchResult: function()
    {
        if (!this._searchResults)
            return;

        this._hideSearchHighlights();
        if (++this._currentSearchResultIndex >= this._searchResults.length)
            this._currentSearchResultIndex = 0;

        this._highlightCurrentSearchResult();
    },

    jumpToPreviousSearchResult: function()
    {
        if (!this._searchResults)
            return;

        this._hideSearchHighlights();
        if (--this._currentSearchResultIndex < 0)
            this._currentSearchResultIndex = (this._searchResults.length - 1);

        this._highlightCurrentSearchResult();
        return true;
    },

    _highlightCurrentSearchResult: function()
    {
        var index = this._currentSearchResultIndex;
        var searchResults = this._searchResults;
        var searchResult = searchResults[index];

        if (searchResult === null) {
            WebInspector.searchController.updateCurrentMatchIndex(index, this);
            return;
        }

        if (typeof searchResult === "undefined") {
            // No data for slot, request it.
            function callback(node)
            {
                searchResults[index] = node || null;
                this._highlightCurrentSearchResult();
            }
            WebInspector.domAgent.searchResult(index, callback.bind(this));
            return;
        }

        WebInspector.searchController.updateCurrentMatchIndex(index, this);

        var treeElement = this.treeOutline.findTreeElement(searchResult);
        if (treeElement) {
            treeElement.highlightSearchResults(this._searchQuery);
            treeElement.reveal();
        }
    },

    _hideSearchHighlights: function()
    {
        if (!this._searchResults)
            return;
        var searchResult = this._searchResults[this._currentSearchResultIndex];
        if (!searchResult)
            return;
        var treeElement = this.treeOutline.findTreeElement(searchResult);
        if (treeElement)
            treeElement.hideSearchHighlights();
    },

    selectedDOMNode: function()
    {
        return this.treeOutline.selectedDOMNode();
    },

    /**
     * @param {boolean=} focus
     */
    selectDOMNode: function(node, focus)
    {
        this.treeOutline.selectDOMNode(node, focus);
    },

    _nodeRemoved: function(event)
    {
        if (!this.isShowing())
            return;

        var crumbs = this.crumbsElement;
        for (var crumb = crumbs.firstChild; crumb; crumb = crumb.nextSibling) {
            if (crumb.representedObject === event.data.node) {
                this.updateBreadcrumb(true);
                return;
            }
        }
    },

    _stylesPaneEdited: function()
    {
        // Once styles are edited, the Metrics pane should be updated.
        this.sidebarPanes.metrics.needsUpdate = true;
        this.updateMetrics();
    },

    _metricsPaneEdited: function()
    {
        // Once metrics are edited, the Styles pane should be updated.
        this.sidebarPanes.styles.needsUpdate = true;
        this.updateStyles(true);
    },

    _mouseMovedInCrumbs: function(event)
    {
        var nodeUnderMouse = document.elementFromPoint(event.pageX, event.pageY);
        var crumbElement = nodeUnderMouse.enclosingNodeOrSelfWithClass("crumb");

        WebInspector.domAgent.highlightDOMNode(crumbElement ? crumbElement.representedObject.id : 0);

        if ("_mouseOutOfCrumbsTimeout" in this) {
            clearTimeout(this._mouseOutOfCrumbsTimeout);
            delete this._mouseOutOfCrumbsTimeout;
        }
    },

    _mouseMovedOutOfCrumbs: function(event)
    {
        var nodeUnderMouse = document.elementFromPoint(event.pageX, event.pageY);
        if (nodeUnderMouse && nodeUnderMouse.isDescendant(this.crumbsElement))
            return;

        WebInspector.domAgent.hideDOMNodeHighlight();

        this._mouseOutOfCrumbsTimeout = setTimeout(this.updateBreadcrumbSizes.bind(this), 1000);
    },

    /**
     * @param {boolean=} forceUpdate
     */
    updateBreadcrumb: function(forceUpdate)
    {
        if (!this.isShowing())
            return;

        var crumbs = this.crumbsElement;

        var handled = false;
        var foundRoot = false;
        var crumb = crumbs.firstChild;
        while (crumb) {
            if (crumb.representedObject === this.treeOutline.rootDOMNode)
                foundRoot = true;

            if (foundRoot)
                crumb.addStyleClass("dimmed");
            else
                crumb.removeStyleClass("dimmed");

            if (crumb.representedObject === this.selectedDOMNode()) {
                crumb.addStyleClass("selected");
                handled = true;
            } else {
                crumb.removeStyleClass("selected");
            }

            crumb = crumb.nextSibling;
        }

        if (handled && !forceUpdate) {
            // We don't need to rebuild the crumbs, but we need to adjust sizes
            // to reflect the new focused or root node.
            this.updateBreadcrumbSizes();
            return;
        }

        crumbs.removeChildren();

        var panel = this;

        function selectCrumbFunction(event)
        {
            var crumb = event.currentTarget;
            if (crumb.hasStyleClass("collapsed")) {
                // Clicking a collapsed crumb will expose the hidden crumbs.
                if (crumb === panel.crumbsElement.firstChild) {
                    // If the focused crumb is the first child, pick the farthest crumb
                    // that is still hidden. This allows the user to expose every crumb.
                    var currentCrumb = crumb;
                    while (currentCrumb) {
                        var hidden = currentCrumb.hasStyleClass("hidden");
                        var collapsed = currentCrumb.hasStyleClass("collapsed");
                        if (!hidden && !collapsed)
                            break;
                        crumb = currentCrumb;
                        currentCrumb = currentCrumb.nextSibling;
                    }
                }

                panel.updateBreadcrumbSizes(crumb);
            } else
                panel.selectDOMNode(crumb.representedObject, true);

            event.preventDefault();
        }

        foundRoot = false;
        for (var current = this.selectedDOMNode(); current; current = current.parentNode) {
            if (current.nodeType() === Node.DOCUMENT_NODE)
                continue;

            if (current === this.treeOutline.rootDOMNode)
                foundRoot = true;

            crumb = document.createElement("span");
            crumb.className = "crumb";
            crumb.representedObject = current;
            crumb.addEventListener("mousedown", selectCrumbFunction, false);

            var crumbTitle;
            switch (current.nodeType()) {
                case Node.ELEMENT_NODE:
                    WebInspector.DOMPresentationUtils.decorateNodeLabel(current, crumb);
                    break;

                case Node.TEXT_NODE:
                    crumbTitle = WebInspector.UIString("(text)");
                    break

                case Node.COMMENT_NODE:
                    crumbTitle = "<!-->";
                    break;

                case Node.DOCUMENT_TYPE_NODE:
                    crumbTitle = "<!DOCTYPE>";
                    break;

                default:
                    crumbTitle = current.nodeNameInCorrectCase();
            }

            if (!crumb.childNodes.length) {
                var nameElement = document.createElement("span");
                nameElement.textContent = crumbTitle;
                crumb.appendChild(nameElement);
                crumb.title = crumbTitle;
            }

            if (foundRoot)
                crumb.addStyleClass("dimmed");
            if (current === this.selectedDOMNode())
                crumb.addStyleClass("selected");
            if (!crumbs.childNodes.length)
                crumb.addStyleClass("end");

            crumbs.appendChild(crumb);
        }

        if (crumbs.hasChildNodes())
            crumbs.lastChild.addStyleClass("start");

        this.updateBreadcrumbSizes();
    },

    /**
     * @param {Element=} focusedCrumb
     */
    updateBreadcrumbSizes: function(focusedCrumb)
    {
        if (!this.isShowing())
            return;

        if (document.body.offsetWidth <= 0) {
            // The stylesheet hasn't loaded yet or the window is closed,
            // so we can't calculate what is need. Return early.
            return;
        }

        var crumbs = this.crumbsElement;
        if (!crumbs.childNodes.length || crumbs.offsetWidth <= 0)
            return; // No crumbs, do nothing.

        // A Zero index is the right most child crumb in the breadcrumb.
        var selectedIndex = 0;
        var focusedIndex = 0;
        var selectedCrumb;

        var i = 0;
        var crumb = crumbs.firstChild;
        while (crumb) {
            // Find the selected crumb and index.
            if (!selectedCrumb && crumb.hasStyleClass("selected")) {
                selectedCrumb = crumb;
                selectedIndex = i;
            }

            // Find the focused crumb index.
            if (crumb === focusedCrumb)
                focusedIndex = i;

            // Remove any styles that affect size before
            // deciding to shorten any crumbs.
            if (crumb !== crumbs.lastChild)
                crumb.removeStyleClass("start");
            if (crumb !== crumbs.firstChild)
                crumb.removeStyleClass("end");

            crumb.removeStyleClass("compact");
            crumb.removeStyleClass("collapsed");
            crumb.removeStyleClass("hidden");

            crumb = crumb.nextSibling;
            ++i;
        }

        // Restore the start and end crumb classes in case they got removed in coalesceCollapsedCrumbs().
        // The order of the crumbs in the document is opposite of the visual order.
        crumbs.firstChild.addStyleClass("end");
        crumbs.lastChild.addStyleClass("start");

        function crumbsAreSmallerThanContainer()
        {
            var rightPadding = 20;
            var errorWarningElement = document.getElementById("error-warning-count");
            if (!WebInspector.drawer.visible && errorWarningElement)
                rightPadding += errorWarningElement.offsetWidth;
            return ((crumbs.totalOffsetLeft() + crumbs.offsetWidth + rightPadding) < window.innerWidth);
        }

        if (crumbsAreSmallerThanContainer())
            return; // No need to compact the crumbs, they all fit at full size.

        var BothSides = 0;
        var AncestorSide = -1;
        var ChildSide = 1;

        /**
         * @param {boolean=} significantCrumb
         */
        function makeCrumbsSmaller(shrinkingFunction, direction, significantCrumb)
        {
            if (!significantCrumb)
                significantCrumb = (focusedCrumb || selectedCrumb);

            if (significantCrumb === selectedCrumb)
                var significantIndex = selectedIndex;
            else if (significantCrumb === focusedCrumb)
                var significantIndex = focusedIndex;
            else {
                var significantIndex = 0;
                for (var i = 0; i < crumbs.childNodes.length; ++i) {
                    if (crumbs.childNodes[i] === significantCrumb) {
                        significantIndex = i;
                        break;
                    }
                }
            }

            function shrinkCrumbAtIndex(index)
            {
                var shrinkCrumb = crumbs.childNodes[index];
                if (shrinkCrumb && shrinkCrumb !== significantCrumb)
                    shrinkingFunction(shrinkCrumb);
                if (crumbsAreSmallerThanContainer())
                    return true; // No need to compact the crumbs more.
                return false;
            }

            // Shrink crumbs one at a time by applying the shrinkingFunction until the crumbs
            // fit in the container or we run out of crumbs to shrink.
            if (direction) {
                // Crumbs are shrunk on only one side (based on direction) of the signifcant crumb.
                var index = (direction > 0 ? 0 : crumbs.childNodes.length - 1);
                while (index !== significantIndex) {
                    if (shrinkCrumbAtIndex(index))
                        return true;
                    index += (direction > 0 ? 1 : -1);
                }
            } else {
                // Crumbs are shrunk in order of descending distance from the signifcant crumb,
                // with a tie going to child crumbs.
                var startIndex = 0;
                var endIndex = crumbs.childNodes.length - 1;
                while (startIndex != significantIndex || endIndex != significantIndex) {
                    var startDistance = significantIndex - startIndex;
                    var endDistance = endIndex - significantIndex;
                    if (startDistance >= endDistance)
                        var index = startIndex++;
                    else
                        var index = endIndex--;
                    if (shrinkCrumbAtIndex(index))
                        return true;
                }
            }

            // We are not small enough yet, return false so the caller knows.
            return false;
        }

        function coalesceCollapsedCrumbs()
        {
            var crumb = crumbs.firstChild;
            var collapsedRun = false;
            var newStartNeeded = false;
            var newEndNeeded = false;
            while (crumb) {
                var hidden = crumb.hasStyleClass("hidden");
                if (!hidden) {
                    var collapsed = crumb.hasStyleClass("collapsed");
                    if (collapsedRun && collapsed) {
                        crumb.addStyleClass("hidden");
                        crumb.removeStyleClass("compact");
                        crumb.removeStyleClass("collapsed");

                        if (crumb.hasStyleClass("start")) {
                            crumb.removeStyleClass("start");
                            newStartNeeded = true;
                        }

                        if (crumb.hasStyleClass("end")) {
                            crumb.removeStyleClass("end");
                            newEndNeeded = true;
                        }

                        continue;
                    }

                    collapsedRun = collapsed;

                    if (newEndNeeded) {
                        newEndNeeded = false;
                        crumb.addStyleClass("end");
                    }
                } else
                    collapsedRun = true;
                crumb = crumb.nextSibling;
            }

            if (newStartNeeded) {
                crumb = crumbs.lastChild;
                while (crumb) {
                    if (!crumb.hasStyleClass("hidden")) {
                        crumb.addStyleClass("start");
                        break;
                    }
                    crumb = crumb.previousSibling;
                }
            }
        }

        function compact(crumb)
        {
            if (crumb.hasStyleClass("hidden"))
                return;
            crumb.addStyleClass("compact");
        }

        function collapse(crumb, dontCoalesce)
        {
            if (crumb.hasStyleClass("hidden"))
                return;
            crumb.addStyleClass("collapsed");
            crumb.removeStyleClass("compact");
            if (!dontCoalesce)
                coalesceCollapsedCrumbs();
        }

        function compactDimmed(crumb)
        {
            if (crumb.hasStyleClass("dimmed"))
                compact(crumb);
        }

        function collapseDimmed(crumb)
        {
            if (crumb.hasStyleClass("dimmed"))
                collapse(crumb, false);
        }

        if (!focusedCrumb) {
            // When not focused on a crumb we can be biased and collapse less important
            // crumbs that the user might not care much about.

            // Compact child crumbs.
            if (makeCrumbsSmaller(compact, ChildSide))
                return;

            // Collapse child crumbs.
            if (makeCrumbsSmaller(collapse, ChildSide))
                return;

            // Compact dimmed ancestor crumbs.
            if (makeCrumbsSmaller(compactDimmed, AncestorSide))
                return;

            // Collapse dimmed ancestor crumbs.
            if (makeCrumbsSmaller(collapseDimmed, AncestorSide))
                return;
        }

        // Compact ancestor crumbs, or from both sides if focused.
        if (makeCrumbsSmaller(compact, (focusedCrumb ? BothSides : AncestorSide)))
            return;

        // Collapse ancestor crumbs, or from both sides if focused.
        if (makeCrumbsSmaller(collapse, (focusedCrumb ? BothSides : AncestorSide)))
            return;

        if (!selectedCrumb)
            return;

        // Compact the selected crumb.
        compact(selectedCrumb);
        if (crumbsAreSmallerThanContainer())
            return;

        // Collapse the selected crumb as a last resort. Pass true to prevent coalescing.
        collapse(selectedCrumb, true);
    },

    updateStyles: function(forceUpdate)
    {
        var stylesSidebarPane = this.sidebarPanes.styles;
        var computedStylePane = this.sidebarPanes.computedStyle;
        if ((!stylesSidebarPane.expanded && !computedStylePane.expanded) || !stylesSidebarPane.needsUpdate)
            return;

        stylesSidebarPane.update(this.selectedDOMNode(), forceUpdate);
        stylesSidebarPane.needsUpdate = false;
    },

    updateMetrics: function()
    {
        var metricsSidebarPane = this.sidebarPanes.metrics;
        if (!metricsSidebarPane.expanded || !metricsSidebarPane.needsUpdate)
            return;

        metricsSidebarPane.update(this.selectedDOMNode());
        metricsSidebarPane.needsUpdate = false;
    },

    updateProperties: function()
    {
        var propertiesSidebarPane = this.sidebarPanes.properties;
        if (!propertiesSidebarPane.expanded || !propertiesSidebarPane.needsUpdate)
            return;

        propertiesSidebarPane.update(this.selectedDOMNode());
        propertiesSidebarPane.needsUpdate = false;
    },

    updateEventListeners: function()
    {
        var eventListenersSidebarPane = this.sidebarPanes.eventListeners;
        if (!eventListenersSidebarPane.expanded || !eventListenersSidebarPane.needsUpdate)
            return;

        eventListenersSidebarPane.update(this.selectedDOMNode());
        eventListenersSidebarPane.needsUpdate = false;
    },

    _registerShortcuts: function()
    {
        var shortcut = WebInspector.KeyboardShortcut;
        var section = WebInspector.shortcutsScreen.section(WebInspector.UIString("Elements Panel"));
        var keys = [
            shortcut.shortcutToString(shortcut.Keys.Up),
            shortcut.shortcutToString(shortcut.Keys.Down)
        ];
        section.addRelatedKeys(keys, WebInspector.UIString("Navigate elements"));

        keys = [
            shortcut.shortcutToString(shortcut.Keys.Right),
            shortcut.shortcutToString(shortcut.Keys.Left)
        ];
        section.addRelatedKeys(keys, WebInspector.UIString("Expand/collapse"));
        section.addKey(shortcut.shortcutToString(shortcut.Keys.Enter), WebInspector.UIString("Edit attribute"));
        section.addKey(shortcut.shortcutToString(shortcut.Keys.F2), WebInspector.UIString("Toggle edit as HTML"));

        this.sidebarPanes.styles.registerShortcuts();
    },

    handleShortcut: function(event)
    {
        if (WebInspector.KeyboardShortcut.eventHasCtrlOrMeta(event) && !event.shiftKey && event.keyIdentifier === "U+005A") { // Z key
            WebInspector.domAgent.undo(this._updateSidebars.bind(this));
            event.handled = true;
            return;
        }

        var isRedoKey = WebInspector.isMac() ? event.metaKey && event.shiftKey && event.keyIdentifier === "U+005A" : // Z key
                                               event.ctrlKey && event.keyIdentifier === "U+0059"; // Y key
        if (isRedoKey) {
            DOMAgent.redo(this._updateSidebars.bind(this));
            event.handled = true;
            return;
        }

        this.treeOutline.handleShortcut(event);
    },

    handleCopyEvent: function(event)
    {
        // Don't prevent the normal copy if the user has a selection.
        if (!window.getSelection().isCollapsed)
            return;
        event.clipboardData.clearData();
        event.preventDefault();
        this.selectedDOMNode().copyNode();
    },

    sidebarResized: function(event)
    {
        this.treeOutline.updateSelection();
    },

    _inspectElementRequested: function(event)
    {
        var node = event.data;
        this.revealAndSelectNode(node.id);
    },

    revealAndSelectNode: function(nodeId)
    {
        WebInspector.inspectorView.setCurrentPanel(this);

        var node = WebInspector.domAgent.nodeForId(nodeId);
        if (!node)
            return;

        WebInspector.domAgent.highlightDOMNodeForTwoSeconds(nodeId);
        this.selectDOMNode(node, true);
    }
}

WebInspector.ElementsPanel.prototype.__proto__ = WebInspector.Panel.prototype;
