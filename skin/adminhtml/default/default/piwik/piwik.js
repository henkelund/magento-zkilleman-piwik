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
    initialize: function(api, timespan, elem, template)
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
        
        var d        = new Date();
        var now      = Math.ceil(d.getTime()/1000);
        timespan = this._timespan;
        this._api.getLastVisitsDetails(
                       this.addVisits.bind(this), {minTimestamp: now - timespan});
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
        var newIds = [], updatedIds = [], tmpElem, apiArgs = {}, self = this;
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
