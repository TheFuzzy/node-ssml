declare module 'ssml' {

  interface Options {
    language: string;
  }

  interface SayOptions {
    interpretAs?: string;
    format?: string;
    detail?: string;
  }

  interface SayOptionsText extends SayOptions {
    text: string;
  }

  interface BreakOptions {
    strength?: string;
  }

  interface BreakOptionsTime extends BreakOptions {
    time: StringOrNumber;
  }

  interface ProsodyOptions {
    pitch?: StringOrNumber;
    rate?: StringOrNumber;
    range?: StringOrNumber;
    volume?: StringOrNumber;
    contour?: string;
  }

  interface AudioOptions {
    alt?: string;
  }

  interface AudioOptionsSource {
    src: string;
  }

  interface ToStringOptions {
    minimal?: boolean;
    full?: boolean;
    pretty?: boolean;
    indent?: string;
    offset?: number;
    newline?: string;
    spacebeforeslash?: string;
  }

  type StringOrNumber = string | number;

  class SSML {
    constructor(options?: Options);

    /** Produces basic text output. */
    say(text: string, options?: SayOptions): this;
    say(options: SayOptionsText): this

    /** Represents a pause in the speech. */
    break(time: StringOrNumber, options?: BreakOptions): this;
    break(options: BreakOptionsTime): this;

    /** Represents a speech adjustment. */
    prosody(options: ProsodyOptions): this;

    /** Represents an audio resource */
    audio(src: string, options?: AudioOptions): this;
    audio(options: AudioOptionsSource): this;

    /**
     * Sets the internal context to the previous level in XML.
     * If there is no previous level, the function does nothing.
     * 
     * This is a mutable operation affecting the SSML document object, and cannot be reversed.
     */
    up(): this;

    /** Clears all elements from the SSML document object. */
    clear(): this;

    /** Replace all instances of the word(s) with another word/set of words. */
    replace(wordToReplace: string, replaceWith: string): this;
    replace(keyValues: { [wordToReplace: string]: string }): this;

    /** Removes the key(s) from the internal dictionary. */
    removeReplace(key: string): this;
    removeReplace(keys: string[]): this;

    /** Clear all keys from the internal dictionary. */
    clearReplace(): this;
    
    /** Render the SSML document as a string. */
    toString(options?: ToStringOptions): string;
  }

  export = SSML;
}