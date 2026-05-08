# ODHT - Online Dictionary Helper for Translators

[[中文版说明](README.zh_CN.md)]

**Based on [ODH](https://github.com/ninja33/ODH) by [ninja33](https://github.com/ninja33)** — forked with new features for translators.

ODHT is a Chrome extension (Manifest V3) that shows dictionary definitions in a popup when you select words on any webpage, with **LLM-powered sentence translation** and **Anki flashcard creation** support.

## Why ODHT?

ODH is the classic lookup-and-card tool — select a word, get the definition in a popup, click + and it's in Anki. I've used it for years, building up a foreign-press vocabulary vault one card at a time. **ODH reduces mechanical friction, not cognitive friction.** It does that well.

But over time, two problems kept nagging me.

### Can't look up phrases

You look up *mush* and get "soft, pulpy mass". But what clicks is **turning your brain to mush**. You look up *crop* and see "harvest". But here it means a **crop of studies** — a batch of emerging research. You look up *hold* — what you really need is **hold accountable**.

**You look up a word, know what it means, but what you should actually learn is the collocation next to it. Those phrases are the most valuable part of reading.** ODH only handles single words — you'd have to manually re-select, guess the boundaries, and the dictionary might not even have the entry.

### Where's the translation?

When I read an English sentence, I mentally do a sight translation first, then want to check a reference version and see where I fall short. **That comparison is where translation skill improves at the finest grain.**

Even better: if the Anki card has both the original sentence and the translation, you can reverse-translate from Chinese back to English during review and compare against the original — a proven method for improving writing fluency. But doing this manually? Translate yourself, open a translation tool, compare side by side… too much friction. Nobody keeps that up.

### Which friction to reduce, which to keep

**Mechanical friction — reduce it.** Re-selecting words, copy-pasting, manually building cards. This drains your patience, not your brain.

**Cognitive friction — keep it.** Parsing sentence structures, guessing word meanings, reading dictionary definitions. That struggle *is* the learning. Skip it, and you skip the step that makes knowledge stick.

What ODHT does: **reduce the friction that shouldn't be there, preserve the friction that should.**

- **Selection Expand & Phrase Detection** — Double-click a word, then tap ◀/▶ to grow the selection word by word. If the extended text matches a known dictionary phrase, it's suggested automatically. One click to look up the full phrase and add it to Anki.
- **LLM Auto-Translation** — The context sentence is automatically translated and saved as an `autotranslation` field in your Anki note, powered by [Doubao Seed Translation](https://console.volcengine.com/ark/region:ark+cn-beijing/model/detail?Id=doubao-seed-translation) — a dedicated translation model covering 28 languages with quality rivaling DeepSeek-R1, free of "translationese".

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
- **API Type** — Uses the OpenAI **Responses API** (`/responses` endpoint), not the Chat Completions API
- **API URL** — Default: `https://ark.cn-beijing.volces.com/api/v3`
- **API Key** — Your Volcano Engine API key
- **Model** — Default: `doubao-seed-translation-250915`

### Dictionary Options
- Load custom dictionary scripts
- Select active dictionary from the list

## Auto Translation Setup Guide

To enable the LLM auto-translation feature and display the translated sentence on your Anki card, follow these steps to modify the ODH card template.

### Step 1: Add the `autotranslation` field in Anki

1. Import the `ODH.apkg` template file into Anki
2. Go to **Browse** → select an ODH note → click **Fields**
3. In the *Fields for ODH* dialog, click **Add**
4. Enter `autotranslation` in the *Field name* input, then click **Save**

### Step 2: Update the Back Template

1. In the Anki card editor, go to **Cards** → select *Card Types for ODH*
2. In the **Template** tab, replace the **Back Template** with the following:

```
{{FrontSide}}

<div class="section">
<div id="back" class="items">{{glossary}}</div>

{{#sentence}}
<hr><div id="back-extra1" class="items">{{sentence}}</div>
{{/sentence}}

{{#autotranslation}}
<hr><div id="back-extra1" class="items">{{autotranslation}}</div>
{{/autotranslation}}

{{#extrainfo}}
<hr><div id="back-extra2" class="items">{{extrainfo}}</div>
{{/extrainfo}}

</div>
```

This renders the `autotranslation` field on the back of the card.

### Step 3: Configure the Chrome extension

1. Open the ODHT **Extension Options** page
2. Under **LLM Translation**, enable **Auto Translation**
3. Fill in **API URL**, **API Key**, and **Model** (see *LLM Translation Options* above)
4. Under **Services Options**, enter `autotranslation` in the input field next to **Translation**

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
