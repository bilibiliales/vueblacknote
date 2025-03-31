# 小黑记事本 (Vue.js 项目)

> 小黑记事本是一款基于 Vue 开发的简洁风格的程序，支持 Markdown 编辑、标签分类、深色模式，并提供备份与恢复功能。


## 🚀 功能特性

标签分类：可为笔记添加颜色标签。

深色模式：切换深色或浅色主题。

数据存储：数据默认存储在本地localStorage中。

数据备份与恢复：支持 JSON 格式的数据导入与导出。

加密存储：笔记内容可选 AES 加密存储，使用SHA-256生成加密私钥。

回收站：已删除的笔记会贴上已删除的标签，可以在回收站分类中看到它们。（需关闭强制删除）

任务管理：支持笔记状态标记，如待办、已完成等。



---

## 🔧 构建与运行

环境依赖

Node.js ≥ 16.x

npm ≥ 8.x


本地开发
``` bash
# 安装依赖
npm install

# 启动开发服务器 (localhost:8080)
npm run dev

# 构建生产环境版本
npm run build

# 构建并查看 Bundle 分析报告
npm run build --report
```

---

# 📁 数据备份与恢复

## ✅ 备份方法

在应用菜单中选择 文件 → 导出

生成 .json 格式的备份文件，包含所有笔记、标签和设置数据


## 🔄 恢复方法

选择 文件 → 导入

选择备份的 JSON 文件即可恢复数据


---

## 📄 备份文件的数据结构

在一些情况下可以通过修改备份文件再导入的方式来突破一些前端限制，例如设置启动时页面为某一标签页、根目录(root)、回收站(trash)等。

注意：在对json的数据结构不太了解的情况下不建议直接修改备份文件
``` bash
{
  "settings": {
    "dark": false,               # 是否启用深色模式
    "view": 1,                  # 视图模式: 1=列表视图，2=卡片视图
    "item_color": "#FF5733",     # 主题色
    "homepage": MainView,          # 启动时显示页面：MainView=主页面，pending=待完成，completed=已完成
    "background_img": 1,           # 背景图片编号
    "remove_warning": true,        # 删除前警告
    "remove_force": false            # 强制删除（删除后不放入回收站）
  },
  "tags": [                         # 标签列表
    { "id": "1", "name": "工作", "color": "#FF0000" },
    { "id": "2", "name": "学习", "color": "#00FF00" }
  ],
  "notes": [                        # 笔记列表
    {
      "title": "Vue.js 学习任务",     # 标题
      "content": "SGVsbG8gd29ybGQ=",  # base64编码的笔记内容，开头加入了盐值："BLACKNOTE@"
      "encrypted": false,              # 是否加密
      "tags": ["1", "2"],             # 标签ID数组
      "created_at": "2025-03-27T14:35:00Z",  # 创建时间
      "updated_at": "2025-03-27T15:10:00Z",  # 更新时间
      "status": "todo"                # 任务状态: todo（待完成）, done（已完成）, remove（标记删除）
    },
    {
      "id": "n2",
      "title": "日常待办",
      "content": "To536l2gsOqy1XKJ8cZIFBe80y/g/FDOK4vrNOSBJwc=",    # AES加密的笔记内容，密码默认为空
      "encrypted": true,
      "tags": ["2"],
      "created_at": "2025-03-26T10:00:00Z",
      "updated_at": "2025-03-26T11:20:00Z",
      "status": "done"
    }
  ]
}
```
### 加密特别说明

本程序的加密解密流程如下：

加密：
原文本-》加盐-》Base64编码-》输入密码-》SHA-256将密码转换为私钥-》使用私钥加密Base64编码

解密：
输入密码-》SHA-256将密码转换为私钥-》使用私钥解密Base64编码-》Base64解码-》输出文本

## 🔥 后续优化方向
在指定目录下增加标题搜索功能（SPA对索引似乎有一些心有余而力不足，正在研究如何检索元素）

支持自定义背景图片（正在研究，本地文件需要require固定的路径才能作为背景图片，所以可能做不到响应式设置）

支持备份文件的云端同步功能

支持基础的Markdown文本显示与编辑

开发手机H5网页版本
