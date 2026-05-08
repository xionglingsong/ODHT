# ODHT - 译者的词典助手

**基于 [ninja33](https://github.com/ninja33) 的 [ODH](https://github.com/ninja33/ODH) 开发**，增加了面向译者的新功能。

ODHT 是一个 Chrome 扩展（Manifest V3），在网页上划词即可弹出词典释义，并支持 **LLM 句子翻译** 和 **Anki 制卡**。

## 为什么做 ODHT？

读外刊（《经济学人》《纽约时报》《卫报》）查词学习时，有两个长期困扰我的痛点：

1. **光查单词不够，前后的短语更值得记。** 查到 "hold"，但真正需要的是 "hold accountable" 或 "hold off"。上下文中的搭配和短语，往往比孤立的单词更有学习价值。原来的 ODH 只能逐词查询，要手动重新选短语、猜边界，而且很多复合词条词典里根本没有。

2. **查完词想顺便把翻译也存下来。** 查完词加入 Anki 后，过几天复习时看到原句却忘了什么意思，又得重新翻译一遍。如果翻译能直接写入笔记就好了。

ODHT 针对这两个痛点：

- **选区扩展 & 智能短语检测** — 双击查一个词，然后用 ◀/▶ 逐词扩展选区。如果扩展后的文本正好是词典中的短语，会自动提示。一键查完整短语并加入 Anki。
- **LLM 自动翻译** — 上下文原句自动翻译并保存为 Anki 笔记的 `autotranslation` 字段。翻译引擎采用 [豆包·翻译模型 (Doubao Seed Translation)](https://www.volcengine.com/product/doubao-translation)，覆盖 28 种语言互译，中英翻译效果逼近 DeepSeek-R1，通用多语言翻译超越或持平 GPT-4o / Gemini-2.5-Pro，告别"翻译腔"。

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
- **API 地址** — 默认：`https://ark.cn-beijing.volces.com/api/v3`
- **API Key** — 你的火山引擎 API 密钥
- **模型** — 默认：`doubao-seed-translation-250915`

### 词典选项
- 加载自定义词典脚本
- 从列表中选择当前使用的词典

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