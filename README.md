# ODHT - Online Dictionary Helper for Translators

[[中文版说明](README.zh_CN.md)]

**Based on [ODH](https://github.com/ninja33/ODH) by [ninja33](https://github.com/ninja33)** — forked with new features for translators.

ODHT is a Chrome extension (Manifest V3) that shows dictionary definitions in a popup when you select words on any webpage, with **LLM-powered sentence translation** and **Anki flashcard creation** support.

## Why ODHT?

When reading foreign language articles (e.g. *The Economist*, *NYT*, *Guardian*), two things always bothered me:

1. **A word alone isn't enough.** You look up "hold", but what you really need is the phrase "hold accountable" or "hold off". The context around the word matters just as much as the word itself. ODH only let you look up one word at a time — you had to manually re-select the phrase, guess the boundaries, and often the dictionary wouldn't even have the compound entry.

2. **I want the translation saved too.** After looking up a word and adding it to Anki, I'd come back days later and see the sentence field but have no idea what it meant. I'd have to re-translate it every time I reviewed the card. What if the translation was just there, baked into the note?

ODHT addresses both:

- **Selection Expand & Phrase Detection** — Double-click a word, then tap ◀/▶ to grow the selection word by word. If the extended text matches a known dictionary phrase, it's suggested automatically. One click to look up the full phrase and add it to Anki.
- **LLM Auto-Translation** — The context sentence is automatically translated and saved as an `autotranslation` field in your Anki note, powered by [Doubao Seed Translation](https://www.volcengine.com/product/doubao-translation) — a dedicated translation model covering 28 languages with quality rivaling GPT-4o and Gemini-2.5-Pro, free of "translationese".

## What's New in ODHT

- **Manifest V3** — Compatible with latest Chrome, no more MV2 deprecation issues
- **LLM Translation** — Auto-translates the context sentence via Volcano Engine Doubao API, shown below the dictionary popup
- **Auto Translation field** — New Anki field `autotranslation` to save the LLM-translated sentence to your Anki notes
- **Selection Expand** — Use ◀/▶ buttons to expand/shrink the selected word range for phrase lookup
- **Smart Phrase Detection** — Suggests known multi-word phrases when they match adjacent text

## How to Install (Developer Mode)

1. Clone or download this repository
2. Open Chrome → `chrome://extensions` → Enable **Developer mode** (top right)
3. Click **Load unpacked** → select the `src/` folder
4. The extension icon should appear in your toolbar

## How to Use

1. Open any webpage, **double-click** or **drag-select** a word
2. A popup appears showing the dictionary definition
3. If LLM translation is enabled, the sentence translation appears below the definition
4. Use ◀/▶ buttons to expand the selection to nearby words
5. Click the green **(+)** button to add a note to Anki

## The Options Page

### General Options
- **Enabled** — Turn the extension on/off
- **Mouse Sel.** — Enable mouse selection lookup
- **AutoSel. Hotkey** — Key to trigger word selection (Shift/Ctrl/Alt)
- **Max Context** — Number of context sentences extracted
- **Max Example** — Number of example sentences from dictionary

### AnkiConnect Options
Setup Anki deck/type name, and map note fields: **expression**, **reading**, **definition**, **sentence**, **url**, **autotranslation**, etc.

### LLM Translation Options
- **Enable LLM Translation** — Toggle auto-translation
- **API URL** — Default: `https://ark.cn-beijing.volces.com/api/v3`
- **API Key** — Your Volcano Engine API key
- **Model** — Default: `doubao-seed-translation-250915`

### Dictionary Options
- Load custom dictionary scripts
- Select active dictionary from the list

## Development

### Getting Started
The source code does not contain offline dictionary data. Download the extension from Chrome Web Store or extract the JSON data files from the CRX.

### Use Existing Scripts or Develop Your Own

1. Use existing dictionary scripts from the [dictionaries list](doc/scriptlist.md)
2. Develop your own script following the [development guide](doc/development.md)
3. Open an [issue](https://github.com/ninja33/ODH/issues) for help

### Pull Requests

Pull requests are welcome.

- Extension source: [/src](src/)
- Dictionary scripts: [/src/dict](src/dict/)

## Credits

- **Original ODH** by [Zhenyu Huang (ninja33)](https://github.com/ninja33) — [github.com/ninja33/ODH](https://github.com/ninja33/ODH)
- Licensed under the [MIT License](LICENSE)
