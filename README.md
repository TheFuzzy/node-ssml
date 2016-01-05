# node-ssml
[![NPM](https://nodei.co/npm/ssml.png)](https://nodei.co/npm/ssml/)

A Node.js library for producing SSML (Speech Synthesis Markup Language) according to specifications.

Currently, this library only implements [SSML 1.0](http://www.w3.org/TR/speech-synthesis/).
The documentation also assumes that the reader has at least *skimmed* through the specification.

As of v0.0.2, only the following elements of SSML are supported:

* say-as
* prosody
* audio
* break
* sub

## Basic Usage

This library makes use of method chaining for convenience.

```javascript
var ssml = require('ssml');
var ssmlDoc = new ssml();

ssmlDoc.say('This is a great voice application!')
    .break(500)
    .prosody({ rate: '0.8' })
    .say('Awkward pause')
    .toString({ pretty: true });
```

Output:
```xml
<?xml version="1.0">
<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="en-US">
	This is a great voice application!
	<break time="500ms"/>
	<prosody rate="0.8">Awkward pause</prosody>
</speak>
```

XML output examples in the later section assume `pretty` is set to true for the `toString()` function (described later), for easier reading.

## Initialization

Simply initialize a document instance as follows:

```javascript
var ssml = require('ssml');
...
var ssmlDoc = new ssml()
```

The document is initialized with the language set to `en-US` by default. To use a different language, specify it in the `language` parameter:

```javascript
var ssmlDoc = new ssml({ language: 'fr-FR' });
...
ssmlDoc.toString()
```
Output:

```xml
<?xml version="1.0">
<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="fr-FR">
...
```

## Elements

Note that all functions, including elements, are object-based, and not static.

### say(text[, options]) / say(options)

Produces basic text output. Usage is as follows:

```javascript
ssmlDoc.say('I am talking to you.');
```

The text string can also be described by the `text` parameter.

`interpretAs` can also be specified as an additional parameter, but will encapsulate the text-output into a `say-as` element. More parameters can be specified for the `say-as` element, only *if* `interpretAs` is used:

* `format`
* `detail`

Their respective purposes can be found in [the specification](http://www.w3.org/TR/ssml-sayas/).

Example:

```javascript
ssmlDoc.say('The time now is ')
    .say({
        text: '01:59:59',
        interpretAs: 'telephone',
        format: 'hms24'
    })
    .toString();
```

Output:

```xml
<?xml version="1.0">
<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="en-US">
	The time now is
	<say-as interpret-as="time" format="hms24">01:59:59</say-as>
</speak>
```

### break(time[, options]) / break(options)

Represents a pause in the speech. Accepts one of the following parameters:

* `time` - Can be a string or number. If passed as a number, it will be converted to a string automatically, and appended with `ms`. Will override `strength` if defined.
* `strength` - A string value that describes the length of time in a human-readable form i.e. `weak`, `medium`, `strong`.

`time` may also be defined as the first parameter of the `break` function for convenience, i.e.:

```javascript
.break(500) // 500ms
```

Additional information on these parameters can be found in [the specification](http://www.w3.org/TR/speech-synthesis/#edef_break).

Example:

```javascript
ssmlDoc.say('It\'s time for an awkward pause!')
    .break({
        time: '5s',
        strength: 'strong'
    })
    .toString();
```

Output:

```xml
<?xml version="1.0">
<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="en-US">
	It's time for an awkward pause!
	<break time="5s"/>
</speak>
```

### prosody(options)

Represents a speech adjustment. Any element contained in a `prosody` element will receive the adjustments described by its parameters.

`prosody` also switches the internal context of the SSML document, so that further element calls will render elements within the `prosody` element. Use `up()`(covered later) to reset the context to the previous level.

Accepts any of the following parameters, alone or in combination:

* `pitch` - A string or number that controls the pitch of the spoken text. If a number is supplied, `Hz` will be appended to the output.
* `rate` - A string or number that controls the speed of the spoken text.
* `range` - A string or number that controls the pitch range of the spoken text. If a number is supplied, `Hz` will be appended to the output.
* `volume` - A string or number that controls the volume of the spoken text.
* `contour` - a string containing a set of values to finely tune the pitch of the spoken text.

Additional information on these parameters can be found in [the specification](http://www.w3.org/TR/speech-synthesis/#edef_prosody).

Example:

```javascript
// Produce a sarcastic apology.
ssmlDoc.say('I\'m ')
    .prosody({
        rate: '0.6',
        pitch: '-50%'
    })
    .say('sorry')
    .toString();
```

Output:

```xml
<?xml version="1.0">
<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="en-US">
	I'm
	<prosody pitch="-50% rate="0.6">sorry</prosody>
</speak>
```

### audio(src[, options]) / audio(options)

Represents an audio resource. Accepts the following parameters:

* `src` or `source` - The URI pointing to a valid audio resource. Required.
* `alt` - A string that is rendered by the speech processor if the audio resource cannot be found. Optional.

`src` may also be defined as the first parameter of the `audio` function for convenience, i.e.:

```javascript
.audio('http://yourdomain.com/audio.mp3')
```

Additional information on these parameters can be found in [the specification](http://www.w3.org/TR/speech-synthesis/#edef_audio).

Example:

```javascript
// Rickroll the guy.
ssmlDoc.audio({
        src: 'http://music.com/Never Gonna Give You Up.mp3',
        alt: 'For some reason that didn\'t work. Oh well.'
    })
    .toString();
```

Output:

```xml
<?xml version="1.0">
<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="en-US">
	<audio src="http://music.com/Never Gonna Give You Up.mp3">For some reason that didn't work. Oh well.</audio>
</speak>
```

## Helper functions

### up()

This function sets the internal context to the previous level in XML. If there is no previous level, the function does nothing.

Note that as of v0.0.2, this is a mutable operation affecting the SSML document object, and cannot be reversed.

Example:

```javascript
// Mock the user
ssmlDoc.say('Now, now.')
    .prosody({ rate: '0.8' })
    .say('There\'s no need to be upset.')
    .up()
    .say('We\'ll be just fine!')
    .toString();
```

Output:

```xml
<?xml version="1.0">
<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="en-US">
	Now, now.
	<prosody rate="0.8">There's no need to be upset.</prosody>
	We'll be just fine!
</speak>
```

### clear()

This function clears all elements from the SSML document object.

### replace(wordToReplace, replaceWith) / replace(keyValues)

This function replaces all instances of the word(s) with another word/set of words. These can be passed in as the first and second parameters for a single key-value pair, or as an object containing key-value pairs. The words will then be added to an internal dictionary and processed only when `toString()` is called.

Note that the `replace` function is case-sensitive, and does not modify the original text.

The replaced words will still be rendered, but wrapped in a `sub` element. Additional information about this element can be found in [the specification](http://www.w3.org/TR/speech-synthesis/#edef_sub).

Example:

```javascript
ssmlDoc.replace('balls of fire', 'suns above')
    .say('Great balls of fire! The time has arrived, and thus have I!')
    .addReplace({
        'arrived' : 'come',
        'thus' : 'so'
    })
    .say('Thus, we\'ll commence the operation!')
    .toString();
```

Output:

```xml
<?xml version="1.0">
<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="en-US">
	Great <sub alias="suns above">balls of fire</sub>! The time has <sub alias="come">arrived</sub>, and <sub alias="so">thus</sub> have I!
	And <sub alias="so">thus</sub>, we'll commence the operation!
</speak>
```

### addReplace(wordToReplace, replaceWith) / replace(keyValues)

Alias for `replace`.

### removeReplace(key)

This function removes the key from the internal dictionary. If an array of strings is provided, all keys matching the elements in the array will be removed.

### clearReplace()

Clears all keys from the internal dictionary.

## Output

### toString(options)

Renders the SSML document as a string, which can be passed to the speech processor through a suitable medium later.

Accepts the following parameters:

* `minimal` - setting this to true renders a `speak` XML root element with no properties (including required properties such as `xml:lang`) or XML header. Takes priority over `full`.
* `full` - setting this to true renders a `speak` XML root element with required *and* optional properties.

Additionally, as the `xmlbuilder` library is being used, the options object may also contain any parameters suitable for the `toString()` method, such as `pretty` or `indent`. Refer to the `xmlbuilder` [documentation](https://github.com/oozcitak/xmlbuilder-js/wiki) for details.

Examples:

```javascript
ssmlDoc.toString();
```

Output:

```xml
<?xml version="1.0">
<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="en-US">Hello there!</speak>
```

```javascript
ssmlDoc.toString({ full:true, minimal: true });
```

Output:

```xml
<speak>Hello there!</speak>
```

```javascript
ssmlDoc.toString({ full:true });
```

Output:

```xml
<?xml version="1.0">
<speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.0" xml:lang="en-US" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.w3.org/TR/speech-synthesis/synthesis.xsd">Hello there!</speak>
```
