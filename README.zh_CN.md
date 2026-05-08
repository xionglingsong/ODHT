# ODHT - 译者的词典助手

**基于 [ninja33](https://github.com/ninja33) 的 [ODH](https://github.com/ninja33/ODH) 开发**，增加了面向译者的新功能。

ODHT 是一个 Chrome 扩展（Manifest V3），在网页上划词即可弹出词典释义，并支持 **LLM 句子翻译** 和 **Anki 制卡**。

## 为什么做 ODHT？

ODH 是查词制卡的老牌工具，鼠标一划，释义弹出来，点一下加号就进了 Anki。用了好多年，Anki 里攒了一座外刊生词库。**ODH 降低的是机械操作的摩擦，不是思考的摩擦。** 这件事做得很好。

但走着走着，发现两个问题一直没解决。

### 查不了短语

查到 mush，释义告诉你"糊状物"。但让你恍然大悟的，是 **turning your brain to mush**——脑子变成一团浆糊。查到 crop，你认识"庄稼"，但这儿是一批涌现的研究——**crop of studies**。查到 hold，真正该记的是 **hold accountable**，追究责任。

**你查到一个词，知道它什么意思了，但你真正该学的，往往是它旁边的搭配。这些短语，才是阅读里最值钱的东西。** 但 ODH 只能查一个词，你得手动重新选、猜边界，词典里还不一定有。

### 查完词，翻译呢？

读到一句英文，脑子里先做一遍视译，然后想看参考译文，对比差距在哪。**这个对比的过程，就是翻译能力提升最细的时候。**

更进一步，如果 Anki 卡片上同时有原句和翻译，复习时可以看着中文回译成英文，再和原句对比——这是提升写作地道性特别有效的方法。但以前做不到，自己翻一遍再开翻译软件翻一遍，手动对比，太麻烦。

### 哪些摩擦该降，哪些不该

**机械操作的摩擦，该降。** 重新选词、复制粘贴、手动建卡片，这些在消耗你的耐心，不是在锻炼你的大脑。

**但理解上的摩擦，不该降。** 你自己拆句子、猜词义、查词典看释义的过程，这个挣扎就是学习本身。你跳过它，就跳过了让知识粘住你的那一步。

ODHT 做的事：**降低不该有的机械摩擦，保留该有的认知摩擦。**

- **选区扩展 & 智能短语检测** — 双击查一个词，然后用 ◀/▶ 逐词扩展选区。如果扩展后的文本正好是词典中的短语，会自动提示。一键查完整短语并加入 Anki。
- **LLM 自动翻译** — 上下文原句自动翻译并保存为 Anki 笔记的 `autotranslation` 字段。翻译引擎采用 [豆包·翻译模型 (Doubao Seed Translation)](https://console.volcengine.com/ark/region:ark+cn-beijing/model/detail?Id=doubao-seed-translation)，覆盖 28 种语言互译，中英效果逼近 DeepSeek-R1，没有翻译腔。

## ODHT 新增功能

- **Manifest V3** — 兼容最新 Chrome，不再受 MV2 废弃影响
- **LLM 翻译** — 通过火山引擎豆包 API 自动翻译上下文句子，显示在弹窗下方
- **自动翻译字段** — 新增 Anki 字段 `autotranslation`，可将 LLM 翻译结果保存到 Anki 笔记
- **选区扩展** — 使用 ◀/▶ 按钮扩大/缩小选词范围，方便查询短语
- **智能短语检测** — 自动检测相邻文本是否构成已知短语并提供建议

## 安装方法（开发者模式）

1. 克隆或下载本仓库
2. 打开 Chrome → `chrome://extensions` → 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序** → 选择 `src/` 文件夹
4. 扩展图标应出现在工具栏中

## 使用说明

1. 打开任意网页，**双击**或**拖选**一个单词
2. 弹窗显示词典释义
3. 如已启用 LLM 翻译，句子翻译会显示在释义下方
4. 使用 ◀/▶ 按钮扩展选区到相邻单词
5. 点击绿色 **(+)** 按钮将笔记添加到 Anki

## 选项设定

### 通用选项
- **开关插件** — 开启/关闭扩展
- **启用鼠标** — 启用鼠标划词查询
- **取词热键** — 触发选词的快捷键（Shift/Ctrl/Alt）
- **原句数量** — 从上下文中提取的最大句子数
- **例句数量** — 词典中显示的最大例句数

### AnkiConnect 选项
设定 Anki 牌组/模板名称，映射笔记字段：**单词**、**音标**、**释义**、**原句**、**来源网址**、**自动翻译**等。

### LLM 翻译选项
- **启用 LLM 翻译** — 开关自动翻译
- **API 类型** — 使用 OpenAI **Responses API**（`/responses` 端点），非 Chat Completions API
- **API 地址** — 默认：`https://ark.cn-beijing.volces.com/api/v3`
- **API Key** — 你的火山引擎 API 密钥
- **模型** — 默认：`doubao-seed-translation-250915`

### 词典选项
- 加载自定义词典脚本
- 从列表中选择当前使用的词典

## 自动翻译功能设置指南

要启用 LLM 自动翻译并在 Anki 卡片上显示翻译结果，需按以下步骤改造 ODH 卡片模板。

### 步骤一：在 Anki 中添加 `autotranslation` 字段

1. 在 Anki 中导入 `ODH.apkg` 模板文件
2. 进入 **Browse** → 选中一张 ODH 笔记 → 点击 **Fields**
3. 在 *Fields for ODH* 窗口中点击 **Add**
4. 在 *Field name* 输入框中填写 `autotranslation`，然后点击 **Save**

### 步骤二：修改卡片背面模板

1. 在 Anki 卡片编辑器中，进入 **Cards** → 选择 *Card Types for ODH*
2. 在 **Template** 选项卡中，将 **Back Template** 替换为以下内容：

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

这样即可在卡片背面显示 `autotranslation` 字段内容。

### 步骤三：配置 Chrome 扩展

1. 打开 ODHT **Extension Options** 配置页面
2. 在 **LLM Translation** 区域，开启 **Auto Translation** 功能
3. 填写 **API URL**、**API Key** 和 **Model**（参见上方"LLM 翻译选项"）
4. 在 **Services Options** 区域，找到 **Translation** 旁边的输入框，填写 `autotranslation`

## 开发

### 快速开始
源码中不包含离线词典数据。可从 Chrome 商店下载扩展或从 CRX 中提取 JSON 数据文件。

### 使用或开发词典脚本

1. 使用[脚本清单](doc/scriptlist.md)中的现有脚本
2. 参照[开发指南](doc/development.md)自行开发
3. 如有问题可提交 [issue](https://github.com/ninja33/ODH/issues)

## 致谢

- **原始 ODH 项目** — [Zhenyu Huang (ninja33)](https://github.com/ninja33) — [github.com/ninja33/ODH](https://github.com/ninja33/ODH)
- 采用 [MIT License](LICENSE) 开源协议