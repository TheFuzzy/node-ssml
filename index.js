/********************************************************************
 * @module node-ssml
 * @version 0.0.3
 * This is a rudimentary implementation of an SSML library.
 *
 * This library is able to produce an SSML document readable by a
 * SSML-compliant processor.
 * This version only implements a very small subset of the SSML 1.0
 * specification, described at http://www.w3.org/TR/speech-synthesis/
 *
 *******************************************************************/
/**
 * Module dependencies
 */
var xmlBuilder = require('xmlbuilder');
var _ = require('underscore');

/**
 * @constructor
 * @this {SSML}
 * @param {Object} Constructor options, as follows:
 *                  * language: The main language of the SSML document. Default is 'en-US'.
 */
function SSML(options) {
    if (!(this instanceof SSML))
        return new SSML(options);
    this._elements = [];
    this._replace = {};
    this._options = {
        language: 'en-US'
    };
    if (options) {
        // TODO: Absorb more constructor options.
        _.extend(this._options, _.pick(options, 'language'));
    }
}

function isInvalidNumber(property) {
    return _.isNumber(property) && !_.isFinite(property);
}

function isInvalid(property) {
    return property && !_.isString(property);
}

function Say(options) {
    if (!(this instanceof Say))
        return new Say(options);
    if (options) {
        _.extend(this, _.pick(options, 'text', 'interpretAs', 'format', 'detail'));
    }
}

Say.prototype.isValid = function isSayValid() {
    if (!_.isString(this.text)) return false;
    if (isInvalid(this.interpretAs)) return false;
    return true;
}

Say.prototype.renderInto = function renderSayInto(xml, replacer) {
    var outputText = this.text;
    var outputQueue = [];
    for (var replacedText in replacer) {
        if (!_.has(replacer, replacedText)) continue;
        var subElement = xmlBuilder.create('sub', null, null, { headless: true });
        subElement.att('alias', replacer[replacedText]).txt(replacedText);
        outputText = outputText.replace(new RegExp(replacedText, 'g'), subElement.end());
    }
    if (this.interpretAs) {
        var sayAsElement = xml.ele('say-as');
        sayAsElement.raw(outputText);
        sayAsElement.att('interpret-as', this.interpretAs);
        if (_.isString(this.format))
            sayAsElement.att('format', this.format);
        if (_.isString(this.detail))
            sayAsElement.att('detail', this.detail);
    } else {
        xml.raw(outputText);
    }
    return xml;
}

function Break(options) {
    if (!(this instanceof Break))
        return new Break(options);
    if (options) {
        _.extend(this, _.pick(options, 'time', 'strength'));
    }
}

Break.prototype.isValid = function isBreakValid() {
    if (isInvalidNumber(this.time) && isInvalid(this.time)) return false;
    if (isInvalid(this.strength)) return false;
    return true;
}

Break.prototype.renderInto = function renderBreakInto(xml) {
    var breakElement = xml.ele('break');
    // Time takes priority over strength.
    if (this.time) {
        var timeValue = this.time;
        if (_.isNumber(this.time)) timeValue = this.time + "ms";
        breakElement.att('time', timeValue);
    }
    else if (this.strength) breakElement.att('strength', this.strength);
    return xml;
}

function Prosody(options) {
    if (!(this instanceof Prosody))
        return new Prosody(options);
    if (options) {
        _.extend(this, _.pick(options, 'pitch', 'contour', 'range', 'rate', 'duration', 'volume'));
    }
}

Prosody.prototype.isValid = function isProsodyValid() {
    if (isInvalidNumber(this.pitch) && isInvalid(this.pitch)) return false;
    if (isInvalid(this.contour)) return false;
    if (isInvalidNumber(this.range) && isInvalid(this.range)) return false;
    if (isInvalidNumber(this.rate) && isInvalid(this.rate)) return false;
    if (isInvalidNumber(this.duration) && isInvalid(this.duration)) return false;
    if (isInvalidNumber(this.volume) && isInvalid(this.volume)) return false;
    return true;
}

Prosody.prototype.renderInto = function renderProsodyInto(xml) {
    var prosodyElement = xml.ele('prosody');
    if (this.pitch) {
        var pitchValue = this.pitch;
        if (_.isNumber(this.pitch)) pitchValue = this.pitch + "Hz";
        prosodyElement.att('pitch', pitchValue);
    }
    if (this.contour) prosodyElement.att('contour', this.contour);
    if (this.range) {
        var rangeValue = this.range;
        if (_.isNumber(this.range)) rangeValue = this.range + "Hz";
        prosodyElement.att('range', rangeValue);
    }
    if (this.rate) prosodyElement.att('rate', this.rate);
    if (this.duration) {
        var durationValue = this.duration;
        if (_.isNumber(this.duration)) durationValue = this.duration + "ms";
        prosodyElement.att('duration', durationValue);
    }
    if (this.volume) prosodyElement.att('volume', this.volume);
    return prosodyElement;
}

function Audio(options) {
    if (!(this instanceof Audio))
        return new Audio(options);
    if (options) {
        options.src = options.src || options.source;
        _.extend(this, _.pick(options, 'src', 'alt'));
    }
}

Audio.prototype.isValid = function isAudioValid() {
    if (isInvalid(this.src)) return false;
    if (isInvalid(this.alt)) return false;
    return true;
}

Audio.prototype.renderInto = function renderAudioInto(xml) {
    var audioElement = xml.ele('audio');
    if (this.src) audioElement.att('src', this.src);
    if (this.alt) audioElement.txt(this.alt);
    return xml;
}

function EndElement() {
    if (!(this instanceof EndElement))
        return new EndElement();
}

EndElement.prototype.isValid = function isEndElementValid() {
    return true;
}

EndElement.prototype.renderInto = function renderEndElementInto(xml) {
    if (xml.isRoot) return xml.up();
    return xml;
}

// Template
// SSML.prototype.action = function action (stuff) {
//     ...
//     return this;
// }

/**
 * @method say
 * @param {String} The text to be output. Optional.
 * @param {Object} An object containing options.
 * @throws {Error} The options provided are invalid.
 */
SSML.prototype.say = function say(text, options) {
    if (_.isObject(text) && !_.isObject(options)) {
        options = text;
    } else if (!options) {
        options = {};
    }
    if (_.isString(text)) {
        options.text = text;
    }
    var newSay = new Say(options);
    if (!newSay.isValid()) throw new Error("Say has invalid options!");
    this._elements.push(newSay);

    return this;
}

/**
 * @method break
 * @param {String/Number} A string (or number) representing the amount of time. Optional.
 * @param {Object} An object containing options.
 * @throws {Error} The options provided are invalid.
 */
SSML.prototype.break = function ssmlBreak(time, options) {
    if (_.isObject(time) && !_.isObject(options)) {
        options = time;
    } else if (!options) {
        options = {};
    }
    if (_.isFinite(time) || _.isString(time)) {
        options.time = time;
    }
    var newBreak = new Break(options);
    if (!newBreak.isValid()) throw new Error("Break has invalid options!");
    this._elements.push(newBreak);
    return this;
}

/**
 * @method prosody
 * @param {Object} An object containing options.
 * @throws {Error} The options provided are invalid.
 */
SSML.prototype.prosody = function prosody(options) {
    var newProsody = new Prosody(options);
    if (!newProsody.isValid()) throw new Error("Prosody has invalid options!");
    this._elements.push(newProsody);
    return this;
}

/**
 * @method audio
 * @source {String} A URI to a valid audio resource. Optional.
 * @param {Object} An object containing options.
 * @throws {Error} The options provided are invalid.
 */
SSML.prototype.audio = function audio(source, options) {
    if (_.isObject(source) && !_.isObject(options)) {
        options = source;
    } else if (!options) {
        options = {};
    }
    if (_.isString(source)) {
        options.src = source;
    }
    var newAudio = new Audio(options);
    if (!newAudio.isValid()) throw new Error("Audio has invalid options!");
    this._elements.push(newAudio);
    return this;
}

/**
 * @method up
 */
SSML.prototype.up = function up() {
    this._elements.push(new EndElement());
    return this;
}

/**
 * @method clear
 */
SSML.prototype.clear = function clear() {
    this._elements = [];
    return this;
}

function replace(keyValuePairs, replaceWith) {
    if (_.isObject(keyValuePairs)) {
        _.extend(this._replace, keyValuePairs);
    } else if (_.isString(keyValuePairs) && _.isString(replaceWith)) {
        var replacedWord = keyValuePairs;
        var addendum = {};
        addendum[replacedWord] = replaceWith;
        _.extend(this._replace, addendum);
    } else {
        throw new Error('Invalid arguments for replace.');
    }
    return this;
}

/**
 * @method replace
 * @param {Object/String} A set of key-value pairs, or the word to be replaced. If the latter, the second parameter MUST be filled.
 * @param {String} The word to replace the first one with. Only applicable if the first parameter is a string.
 */
SSML.prototype.replace = replace;

/**
 * @method addReplace
 * @param {Object/String} A set of key-value pairs, or the word to be replaced. If the latter, the second parameter MUST be filled.
 * @param {String} The word to replace the first one with. Only applicable if the first parameter is a string.
 */
SSML.prototype.addReplace = replace;

/**
 * @method removeReplace
 * @param {String/Array} Either string or array of strings representing the keywords to be removed.
 */
SSML.prototype.removeReplace = function removeReplace(items) {
    if (_.isArray(items)) {
        for (var i = 0; i < items.length; i++) {
            delete this._replace[items[i]];
        }
    } else {
        delete this._replace[items];
    }
    return this;
}

/**
 * @method clearReplace
 */
SSML.prototype.clearReplace = function clearReplace() {
    this._replace = {};
    return this;
}

/**
 * @method toString
 * @param {Object} An object containing options. Options are similar to those used by xmlBuilder.end().
 *                 Object can also contain 2 more options:
 *                 * minimal: If set to true, the resulting XML will have no headers, nor will the root element have attributes required for a valid SSML document.
 *                 * full: If set to true, the root element will include optional XML attributes, such as xsi:schemaLocation.
 */
SSML.prototype.toString = function toString(options) {
    var element;
    if (options && options.minimal)
        element = xmlBuilder.create('speak', null, null, { headless: true });
    else {
        element = xmlBuilder.create('speak');
        element.att('xmlns', 'http://www.w3.org/2001/10/synthesis');
        element.att('version', '1.0');
        element.att('xml:lang', this._options.language);
        if (options && options.full) {
            element.att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
            element.att('xsi:schemaLocation', 'http://www.w3.org/TR/speech-synthesis/synthesis.xsd');
        }
    }
    for (var index = 0; index < this._elements.length; index++) {
        var item = this._elements[index];
        if (item.isValid()) {
            element = item.renderInto(element, this._replace);
        } else {
            console.log('invalid element');
        }
    }
    return element.end(options);
}

module.exports = SSML;
