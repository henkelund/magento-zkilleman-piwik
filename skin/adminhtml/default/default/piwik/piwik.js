/**
 * Zkilleman_Piwik
 *
 * Copyright (C) 2012 Henrik Hedelund (henke.hedelund@gmail.com)
 *
 * This file is part of Zkilleman_Piwik.
 *
 * Zkilleman_Piwik is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Zkilleman_Piwik is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Zkilleman_Piwik. If not, see <http://www.gnu.org/licenses/>.
 *
 * @category Zkilleman
 * @package Zkilleman_Piwik
 * @author Henrik Hedelund <henke.hedelund@gmail.com>
 * @copyright 2012 Henrik Hedelund (henke.hedelund@gmail.com)
 * @license http://www.gnu.org/licenses/lgpl.html GNU LGPL
 * @link https://github.com/henkelund/magento-zkilleman-piwik
 */

var PiwikApiBase = Class.create();
PiwikApiBase._requestCounter = 0;
PiwikApiBase.prototype = {
    _rootElem : null,
    _endpoint : null,
    _params   : null,
    initialize: function(endpoint, siteId, apiKey)
    {
        var rootElem = $('piwik-root');
        if (!rootElem) {
            rootElem = new Element('div', {id: 'piwik-root'});
            $(document.getElementsByTagName('body')[0]).insert({top: rootElem});
        }
        this._rootElem = rootElem;
        this._endpoint = endpoint;
        this._params   = {
            format     : 'json',
            idSite     : siteId,
            token_auth : apiKey
        };
    },
    request: function(method, callback, options)
    {
        var url = this._endpoint + '?module=API';
        var params = this._params;
        if (typeof options == 'object') {
            for (var oKey in options) {
                params[oKey] = options[oKey];
            }
        }
        if (typeof method != 'undefined') {
            params.method = method;
        }
        if (typeof callback == 'function') {
            var callbackName = '_piwikApiCallback_' +
                                    (++PiwikApiBase._requestCounter);
            window[callbackName] = callback;
            params.jsoncallback  = callbackName;
        }
        for (var pKey in params) {
            url += '&' + escape(pKey) + '=' + escape(params[pKey]);
        }
        
        this._rootElem.insert(
                new Element('script', {type: 'text/javascript', src: url}));
    }
}

var PiwikApiLive = Class.create();
PiwikApiLive.prototype = {
    _proxy: null,
    initialize: function(proxy)
    {
        if (typeof proxy == 'object' && proxy instanceof PiwikApiBase) {
            this._proxy = proxy;
        } else {
            // alert('Proxy is not an instance of PiwikApiBase');
        }
    },
    getLastVisitsDetails: function(callback, options)
    {
        if (this._proxy != null && typeof callback == 'function') {
            this._proxy.request('Live.getLastVisitsDetails', function(visits) {
                if (typeof visits == 'object' && visits instanceof Array) {
                    callback(visits, false);
                } else {
                    var error = 'Unexpected api response';
                    if (typeof visits == 'object' && visits.message) {
                        error = visits.message;
                    }
                    callback([], error);
                }
            }, options);
        }
    }
}

var PiwikVisitTimeline = Class.create();
PiwikVisitTimeline.prototype = {
    _api                : null,
    _timespan           : null,
    _elem               : null,
    _template           : null,
    _visits             : null,
    _visitElemTmpParent : null,
    _isStopped          : null,
    _interval           : null,
    _segment            : null,
    initialize: function(api, timespan, elem, template, segment)
    {
        if (typeof api == 'object' && api instanceof PiwikApiLive) {
            this._api = api;
        }
        this._timespan = Math.max(60, timespan);
        this._elem = $(elem);
        if (typeof template == 'object' && template instanceof Template) {
            this._template = template;
        } else {
            this._template = new Template(template);
        }
        this._visits = {};
        this._visitElemTmpParent = new Element('div');
        this._isStopped = false;
        this._segment = segment || '';
        
        var d        = new Date();
        var now      = Math.ceil(d.getTime()/1000);
        timespan = this._timespan;
        var self = this;
        this._api.getLastVisitsDetails(this.addVisits.bind(this), {
                           minTimestamp : now - timespan,
                           segment      : self._segment
                       });
        if (timespan <= 1800) {
            // If timespan is short, we re-render every second (looks smoother)
            this._interval = window.setInterval(
                                        this.render.bind(this), 1000, [], []);
        }
    },
    stop: function ()
    {
        if (this._interval != null) {
            window.clearInterval(this._interval);
        }
        this._isStopped = true;
    },
    addVisits: function(visits, error)
    {
        if (error) {
            this._elem.update(error);
            this.stop();
            return;
        }
        if (this._isStopped) {
            return;
        }
        var self       = this,
            newIds     = [],
            updatedIds = [],
            tmpElem,
            apiArgs    = {segment: self._segment};
            
        for (var i = 0; i < visits.length; ++i) {
            if (!this._visits[visits[i].idVisit]) {
                tmpElem = null;
                newIds.push(visits[i].idVisit);
            } else {
                tmpElem = this._visits[visits[i].idVisit]._elem;
                updatedIds.push(visits[i].idVisit);
            }
            this._visits[visits[i].idVisit] = visits[i];
            this._visits[visits[i].idVisit]._elem = tmpElem;
        }
        this.render(newIds, updatedIds);
        if (visits.length > 0) {
            apiArgs.minTimestamp = visits[0].lastActionTimestamp;
        }
        window.setTimeout(function() {
            self._api.getLastVisitsDetails(self.addVisits.bind(self), apiArgs);
        }, 5000);
    },
    _renderVisitElem: function(visit)
    {
        var classes = [visit.visitorType, 'e-' + visit.visitEcommerceStatus];
        if (visit.visitorType == 'new' && parseInt(visit.actions) == 1) {
            classes.push('bounce');
        }
        var templateData = {
            classes: classes.join(' ')
        }
        this._visitElemTmpParent.innerHTML = this._template.evaluate(templateData);
        return $(this._visitElemTmpParent.firstChild);
    },
    render: function(newIds, updatedIds)
    {
        if (this._isStopped) {
            return;
        }
        
        newIds     = newIds     || [];
        updatedIds = updatedIds || [];
        
        var i,
            j,
            id,
            newOrUpdatedIds = newIds.concat(updatedIds),
            canvasWidth     = this._elem.getDimensions().width,
            pixSec          = canvasWidth/this._timespan,
            elDim,
            elPos,
            fat,
            lat,
            d               = new Date(),
            now             = Math.ceil(d.getTime()/1000),
            lines           = [],
            lowest          = 0,
            visits          = [];
        
        // Remove elements having updated properties
        for (i = 0; i < updatedIds.length; ++i) {
            id = updatedIds[i];
            this._visits[id]._elem.remove();
        }
        
        // Create elements for new and updated visits
        for (i = 0; i < newOrUpdatedIds.length; ++i) {
            id  = newOrUpdatedIds[i];
            lat = this._visits[id].lastActionTimestamp;
            fat = this._visits[id].firstActionTimestamp;
            this._visits[id]._elem = this._renderVisitElem(this._visits[id]);
            this._visits[id]._elem.style.width = 
                    parseInt(Math.max((lat - fat)*pixSec)) + 'px';
            this._elem.insert(this._visits[id]._elem);
        }
        
        // Position visits (x-axis) & remove old ones
        for (id in this._visits) {
            visits.push(this._visits[id]);
            lat = this._visits[id].lastActionTimestamp;
            if (lat < (now - this._timespan)) {
                this._visits[id]._elem.remove();
                delete this._visits[id];
                continue;
            }
            this._visits[id]._elem.style.right = 
                    parseInt((now - lat)*pixSec) + 'px';
        }
        
        visits.sort(function(a, b) {
            return a.lastActionTimestamp - b.lastActionTimestamp;
        });
        
        // Position visits (y-axis)
        for (i = 0; i < visits.length; ++i) {
            elPos = visits[i]._elem.positionedOffset();
            elDim = visits[i]._elem.getDimensions();
            for (j = 0; j < lines.length; ++j) {
                if (elPos.left > lines[j][1] &&
                        elPos.left + elDim.width > lines[j][1]) {
                    lines[j][0] = elPos.left;
                    lines[j][1] = elPos.left + elDim.width;
                    break;
                }
            }
            if (j == lines.length) {
                lines[j] = [elPos.left, elPos.left + elDim.width];
            }
            visits[i]._elem.style.top = 
                    parseInt(elDim.height*j) + 'px';
            lowest = Math.max(lowest, elDim.height*(j + 1));
        }
        
        // +2 is for margin: 1px 0; in .piwik-visit
        this._elem.style.height = parseInt(lowest + 2) + 'px';
    }
}

var PiwikSegmentFilter = Class.create();
PiwikSegmentFilter.prototype = {
    _elem       : null,
    _segments   : null,
    _options    : null,
    _controls   : null,
    _lastString : null,
    initialize: function(elem, segments, options)
    {
        this._elem       = $(elem);
        this._segments   = segments;
        this._options    = options || {};
        this._lastString = '';
        this._initControls();
    },
    _initControls: function()
    {
        var addButton;
        
        this._controls = new Element('div');
        this._controls.addClassName('segment-row');
        this._controls.addClassName('controls');
        this._elem.insert(this._controls);
        
        addButton = new Element('a', {href: 'javascript:void(0);'});
        addButton.update(this._options.addText || 'Add filter');
        this._controls.insert(addButton);
        
        addButton.observe('click', this.addSegmentRow.bind(this));
    },
    _createAttributeSelect: function()
    {
        var select = new Element('select');
        var dummy = new Element('option', {value: ''});
        select.insert(dummy);
        select.observe('click', function() {
            dummy.setAttribute('disabled', 'disabled');
        });
            
        var groups = {};
        for (var code in this._segments) {
            var segment = this._segments[code];
            if (typeof groups[segment.group] == 'undefined') {
                groups[segment.group] = new Array();
            }
            var optionElem = new Element('option', {value: code});
            optionElem.update(segment.label);
            groups[segment.group].push(optionElem);
        }
        for (var label in groups) {
            var optgroupElem = new Element('optgroup', {label: label});
            for (var i = 0; i < groups[label].length; ++i) {
                optgroupElem.insert(groups[label][i]);
            }
            select.insert(optgroupElem);
        }
        
        select.observe('keyup', function(evt) {
            if (evt.keyCode == Event.KEY_RETURN) {
                select.blur();
            }
        });
        
        return select;
    },
    _createSelect: function(options, addDummy) {
        var select = new Element('select');
        if (addDummy) {
            var dummy = new Element('option', {value: ''});
            select.insert(dummy);
            select.observe('click', function() {
                dummy.setAttribute('disabled', 'disabled');
            });
        }
        
        var optElem;
        if (options instanceof Array) {
            for (var i = 0; i < options.length; ++i) {
                optElem = new Element('option', {value: i});
                optElem.update(options[i]);
                select.insert(optElem);
            }
        } else {
            for (var value in options) {
                optElem = new Element('option', {value: value});
                optElem.update(options[value]);
                select.insert(optElem);
            }
        }
        return select;
    },
    _updateOperator: function(row)
    {
        var segment = this._segments[row.down('.attribute select').getValue()];
        
        var opElem = row.down('.operator');
        opElem.update('');
        
        var operatorLabel = new Element('a', {href: 'javascript:void(0);'});
        operatorLabel.addClassName('label');
        operatorLabel.update('...');
        opElem.insert(operatorLabel);
        
        var operatorSelect = this._createSelect(segment.operators, true);
        operatorSelect.hide();
        opElem.insert(operatorSelect);
        
        var self = this;
        var hideFnc = function() {
            var text = operatorSelect
                            .options[operatorSelect.selectedIndex].text;
            operatorLabel.update(text.length > 0 ? text : '...');
            operatorSelect.hide();
            operatorLabel.show();
        
            self._changed();
        };
        
        operatorSelect.observe('blur', hideFnc);
        operatorSelect.observe('change', hideFnc);
            
        operatorLabel.observe('click', function() {
            operatorLabel.hide();
            operatorSelect.show();
            operatorSelect.focus();
        });
    },
    _updateValue: function(row)
    {
        var segment = this._segments[row.down('.attribute select').getValue()];
        
        var valElem = row.down('.value');
        valElem.update('');
            
        var valueLabel = new Element('a', {href: 'javascript:void(0);'});
        valueLabel.addClassName('label');
        valueLabel.update('...');
        valElem.insert(valueLabel);

        var formElem = (segment.type == 'select') ?
                            this._createSelect(segment.values, true) :
                            new Element('input', {type: 'text'});
        formElem.addClassName((segment.type == 'select') ?
                                        'select' : 'input-text');
        formElem.hide();
        valElem.insert(formElem);

        var self = this;
        var hideFnc = function() {
            var text;
            if (segment.type == 'select') {
                text = formElem.options[formElem.selectedIndex].text;
            } else {
                text = formElem.getValue();
            }
            text = text.replace(/^\s+/, '').replace(/\s+$/, '');
            valueLabel.update(text.length > 0 ? text : '...');
            formElem.hide();
            valueLabel.show();
        
            self._changed();
        };
        
        formElem.observe('blur', hideFnc);
        if (segment.type == 'select') {
            formElem.observe('change', hideFnc);
        } else {
            formElem.observe('keydown', function(evt) {
                if (evt.keyCode == Event.KEY_RETURN) {
                    formElem.blur();
                }
            });
        }

        valueLabel.observe('click', function() {
            valueLabel.hide();
            formElem.show();
            formElem.focus();
        });
    },
    _updateAggregator: function(row)
    {   
        row.update('');
        var orText = this._options.orText || 'or';
        var andText = this._options.andText || 'and';
        var aggregator = this._createSelect(
                                    {',': orText, ';': andText}, false);
        aggregator.hide();
        
        var label = new Element('a', {href: 'javascript:void(0);'});
        label.addClassName('label');
        label.update(aggregator.options[aggregator.selectedIndex].text);
        row.insert(label);
        row.insert(aggregator);
        
        var self = this;
        var hideFnc = function() {
            label.update(aggregator.options[aggregator.selectedIndex].text);
            aggregator.hide();
            label.show();
        
            self._changed();
        };
        
        aggregator.observe('blur', hideFnc);
        aggregator.observe('change', hideFnc);
            
        label.observe('click', function() {
            label.hide();
            aggregator.show();
            aggregator.focus();
        });
    },
    addSegmentRow: function()
    {
        var self = this;
        
        if (this._elem.select('.segment-row').length > 1) {
            var aggRow = new Element('div');
            aggRow.addClassName('segment-row aggregator');
            this._updateAggregator(aggRow);
            this._controls.insert({before: aggRow});
        }
        
        var row = new Element('div');
        row.addClassName('segment-row');
        row.observe('mouseover', function() {row.addClassName('hover');});
        row.observe('mouseout', function() {row.removeClassName('hover');});
        this._controls.insert({before: row});
        
        var removeButton = new Element('a', {href: 'javascript:void(0);'});
        removeButton.addClassName('remove');
        removeButton.update(this._options.removeText || 'Remove');
        removeButton.observe('click', function() {
            var agg = row.previous('.aggregator') || row.next('.aggregator');
            if (agg) {
                agg.remove();
            }
            row.remove();
            self._changed();
        });
        row.insert(removeButton);
        
        var attributeWrapper = new Element('span');
        attributeWrapper.addClassName('attribute param');
        row.insert(attributeWrapper);
        
        var operatorWrapper = new Element('span');
        operatorWrapper.addClassName('operator param');
        row.insert(operatorWrapper);
        
        var valueWrapper = new Element('span');
        valueWrapper.addClassName('value param');
        row.insert(valueWrapper);
        
        var attributeLabel = new Element('a', {href: 'javascript:void(0);'});
        attributeLabel.addClassName('label');
        attributeLabel.update('...');
        attributeWrapper.insert(attributeLabel);
        
        var attributeSelect = this._createAttributeSelect();
        attributeSelect.hide();
        attributeWrapper.insert(attributeSelect);
        
        var hideFnc = function() {
            attributeSelect.hide();
            attributeLabel.show();
        };
        attributeSelect.observe('blur', hideFnc);
        attributeSelect.observe('change', function() {
            var segment = self._segments[attributeSelect.getValue()];
            attributeLabel.update(segment.label);
            self._updateOperator(row);
            self._updateValue(row);
            hideFnc();
        });
        
        attributeLabel.observe('click', function() {
            attributeLabel.hide();
            attributeSelect.show();
            attributeSelect.focus();
        });
    },
    getSegmentString: function()
    {
        var segments = '';
        this._elem.select('.segment-row').each(function(row) {
            if (row.hasClassName('aggregator')) {
                segments += row.down('select').getValue();
            } else if (!row.hasClassName('controls')) {
                var atr = row.down('.attribute select');
                var opr = row.down('.operator select');
                var val = row.down('.value .select, .value .input-text');
                if (!atr || !atr.getValue() ||
                    !opr || !opr.getValue() ||
                    !val || !val.getValue()) {
                    return;
                }
                segments += (atr.getValue() +
                             opr.getValue() +
                             escape(val.getValue()));
            }
        });
        segments = segments
                        .replace(/^[\,\;]+/, '')
                        .replace(/[\,\;]+$/, '')
                        .replace(/[\,\;]{2,}/i, ',');
        return segments;
    },
    _changed: function()
    {
        var newString = this.getSegmentString();
        if (newString != this._lastString) {
            if (typeof this._options.onchange == 'function') {
                this._options.onchange(newString);
            }
        }
        this._lastString = newString;
    },
    setOption: function(key, value)
    {
        this._options[key] = value;
    }
}
