# Background

Reading is among the most important tasks for any dedicated language learner. I have written an English-Chinese learning/card-marking chrome extension - [Anki Dict Helper](https://github.com/ninja33/anki-dict-helper) in 2016, which was inspired by [readlang.com](https://readlang.com/) and [Foosoft/yomichan](https://github.com/FooSoft/yomichan).
Here is how that extension works. Reading through a web page via Google Chrome or Firefox, the user can move the mouse cursor to any given word, press <kbd>shift</kbd> key. A pop-up window would subsequently show up with the word's En-Chinese dictionary definitions on display. It supports the making of an Anki flashcard note filling fields with **word**, **definition** and **context** (the sentence in its original web page context with the selected word included). In a word, it's a personalized  web vocabulary builder which also serves as a En-Ch dictionary.

## The idea

That first extension works perfectly for English-Mandarin language learners. However, as the userbase grows, I've got lots of requests, asking whether it's possible to add other dictionaries/support for more languages, at least for Latin-alphabet-based language similar to English which could serve as the source language.

Well, here goes the same reason as Foosoft/yomichan mentioned in his project [FAQ](https://github.com/FooSoft/yomichan#frequently-asked-questions) page.
First off, I, a pure mortal/coder, have no knowledge of any foreign languages other than English. Second, it's almost mission impossible for just one man to get all those dictionary files, converting them to usable formats and then incorporating them in the chrome extension.

Fortunately, we are at this great Internet age with increasing amounts of online resources. There are hundreds and thousands of dictionaries online for searching. Therefore, any given user can just scrape the definition from online dictionary, leave word and sentence untouched, make it popup and make a note for Anki as usual.
Basically, here is the idea.

- Anki Dict Helper: popup window [word, **built-in definition**, sentence] --> Anki
- Anki Online Dict Helper: popup window [word, **online definition**, sentence] --> Anki

The **online definition** part is run by customized javascript which could be written by you or your friend and hosted on Github.com. That will hugely extend the ability of this extension to meet your specified requirement.

If you are a Javascript programmer and are interested in enhancing this tool, please check [development guide](development.md).

---

## Why ODHT? — Extending ODH for serious readers

*The following section describes the motivation behind the ODHT fork.*

When reading foreign language publications — *The Economist*, *The New York Times*, *The Guardian* — for vocabulary building, two pain points kept coming back:

### Pain Point 1: A word alone isn't enough

You look up "hold", but what you actually need to learn is **"hold accountable"** or **"hold off"**. The collocations and phrases surrounding a word are often more valuable than the word itself. The original ODH could only look up one selected word at a time. To look up a phrase, you had to manually re-select the exact boundaries — and if the dictionary didn't have a compound entry, you were out of luck.

**ODHT's solution: Selection Expand + Smart Phrase Detection**

Double-click any word, then tap ◀/▶ to grow the selection one word at a time. If the expanded text happens to match a phrase in the dictionary, it's automatically suggested as a clickable link — one click to look up the full phrase and add it to Anki.

### Pain Point 2: I want the translation saved with the note

After looking up a word and adding it to Anki, I'd come back days later during review and see the original sentence — but have no idea what it meant. I'd have to paste it into a translator every single time. What if the translation was just *there*, permanently saved in the note?

**ODHT's solution: LLM Auto-Translation**

The context sentence is automatically translated and saved as an `autotranslation` field in your Anki note. The translation is powered by [**Doubao Seed Translation** (豆包·翻译模型)](https://console.volcengine.com/ark/region:ark+cn-beijing/model/detail?Id=doubao-seed-translation) — a dedicated translation model from Volcano Engine:

- Covers **28 languages** for mutual translation
- Chinese-English quality approaching DeepSeek-R1; multilingual quality matching or exceeding GPT-4o / Gemini-2.5-Pro
- Free of "translationese" — delivers natural, faithful translations
- Excels across scenarios: news reading, professional documents, literature, slang, and technical content

The result: every Anki card now carries **word + definition + original sentence + translation**, making spaced repetition far more effective.
