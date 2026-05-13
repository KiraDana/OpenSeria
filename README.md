# OpenSerial - 开源跨平台串口调试工具

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-orange" alt="Platform">
</p>

<p align="center">
  <a href="https://www.kiradana.cn">www.kiradana.cn</a>
</p>

---

## 项目简介

**OpenSerial** 是一款完全开源免费的跨平台串口调试工具，由嵌入式工程师为嵌入式和自动化行业量身打造。我们深知开发者在使用传统串口工具时遇到的痛点：付费软件功能受限、广告弹窗干扰、界面老旧、缺乏针对性功能、无法自定义扩展。

OpenSerial 致力于为开发者提供一款纯净、高效、专业的串口调试体验，让您的开发和调试工作更加顺畅。

### 核心特性

- ✅ **完全开源免费** - MIT 开源协议，代码透明，无任何隐藏费用
- ✅ **跨平台支持** - 支持 Windows、macOS、Linux 主流操作系统
- ✅ **串口通信** - 支持标准串口通信，可配置波特率、数据位、停止位、校验位等参数
- ✅ **TCP/UDP 通信** - 内置 TCP 和 UDP 协议支持，满足网络通信调试需求
- ✅ **循环发送** - 支持定时循环发送数据，方便进行自动化测试
- ✅ **CRC 校验** - 内置多种 CRC 校验算法，确保数据完整性
- ✅ **多标签页** - 支持多标签页管理，可同时调试多个连接
- ✅ **预设管理** - 支持保存和加载常用配置，提高工作效率

---

## 技术栈

### 核心技术

| 技术 | 版本 | 说明 |
|------|------|------|
| **Electron** | 28.0.0 | 跨平台桌面应用框架 |
| **Vue 3** | 3.4.0 | 渐进式 JavaScript 框架 |
| **TypeScript** | 5.3.0 | JavaScript 的超集，提供类型支持 |
| **Vite** | 5.0.0 | 新一代前端构建工具 |
| **electron-vite** | 2.0.0 | 针对 Electron 优化的 Vite 构建工具 |

### 核心依赖

| 依赖 | 版本 | 说明 |
|------|------|------|
| **serialport** | 13.0.0 | 跨平台串口通信库 |
| **@serialport/bindings-cpp** | 13.0.1 | SerialPort 原生绑定 |
| **@serialport/parser-readline** | 13.0.0 | 串口数据解析器 |
| **Element Plus** | 2.5.0 | 基于 Vue 3 的组件库 |

### 开发工具

| 工具 | 版本 | 说明 |
|------|------|------|
| **electron-builder** | 24.9.0 | Electron 应用打包工具 |
| **@electron/rebuild** | 3.6.0 | Electron 原生模块重新编译工具 |
| **vue-tsc** | 1.8.0 | Vue 3 TypeScript 类型检查工具 |

### 项目架构

```
openSerial/
├── src/
│   ├── main/                 # 主进程代码
│   │   ├── app/             # 应用入口管理
│   │   │   ├── TrayManager.ts    # 系统托盘管理
│   │   │   ├── WindowManager.ts  # 窗口管理
│   │   │   └── index.ts
│   │   ├── ipc/             # 进程间通信
│   │   │   └── index.ts
│   │   ├── services/        # 核心服务
│   │   │   ├── config.ts    # 配置服务
│   │   │   ├── serial.ts    # 串口服务
│   │   │   ├── tcp.ts       # TCP 服务
│   │   │   └── udp.ts       # UDP 服务
│   │   ├── utils/           # 工具函数
│   │   │   └── crc.ts       # CRC 校验算法
│   │   └── index.ts         # 主进程入口
│   ├── preload/             # 预加载脚本
│   │   └── index.ts
│   └── renderer/            # 渲染进程代码 (前端)
│       └── src/
│           ├── components/  # Vue 组件
│           │   ├── ConnectionPanel.vue   # 连接面板
│           │   ├── DataPanel.vue          # 数据面板
│           │   ├── StatusBar.vue          # 状态栏
│           │   ├── TabBar.vue             # 标签栏
│           │   └── Toolbar.vue            # 工具栏
│           ├── composables/  # Vue Composables
│           │   ├── useConnection.ts       # 连接逻辑
│           │   ├── useSerial.ts           # 串口逻辑
│           │   ├── useTcp.ts              # TCP 逻辑
│           │   ├── useUdp.ts              # UDP 逻辑
│           │   ├── useCyclicSend.ts       # 循环发送
│           │   ├── usePresets.ts          # 预设管理
│           │   └── useTabs.ts             # 标签页管理
│           ├── types/      # TypeScript 类型定义
│           └── App.vue      # 根组件
├── electron.vite.config.ts  # electron-vite 配置
├── package.json             # 项目配置和依赖
└── tsconfig.json           # TypeScript 配置
```

---

## 下载安装

### 方式一：下载预编译版本（推荐）

1. 访问 [GitHub Releases](https://github.com/KiraDana/OpenSeria/releases) 页面
2. 下载最新版本的安装包：
   - **Windows**: `OpenSerial_x.x.x_setup.exe`
   - **macOS**: `OpenSerial-x.x.x.dmg`
   - **Linux**: `OpenSerial-x.x.x.AppImage`

3. 运行安装程序，按照提示完成安装

### 方式二：从源码构建

#### 环境要求

- **Node.js**: 18.0.0 或更高版本
- **npm**: 9.0.0 或更高版本（通常随 Node.js 一起安装）
- **Git**: 用于克隆代码仓库

#### 构建步骤

**1. 克隆项目**

```bash
git clone https://github.com/KiraDana/OpenSeria.git
cd OpenSeria
```

**2. 安装依赖**

```bash
npm install
```

> 注意：由于项目使用了原生模块（serialport），在安装过程中可能需要编译原生 C++ 代码。请确保您的系统已安装：
> - **Windows**: Visual Studio Build Tools 或 MinGW
> - **macOS**: Xcode Command Line Tools
> - **Linux**: build-essential、gcc、g++ 等编译工具

**3. 开发模式运行**

```bash
npm run dev
```

项目将会在开发模式下启动，您可以在浏览器中实时预览和调试。

**4. 类型检查**

```bash
npm run typecheck
```

运行 TypeScript 类型检查，确保代码类型安全。

**5. 代码检查**

```bash
npm run lint
```

使用 ESLint 检查代码规范。

**6. 构建生产版本**

```bash
# Windows
npm run build:win

# 或者通用构建命令
npm run build
```

构建完成后，安装包将生成在 `dist-electron` 目录下。

---

## 使用说明

### 基本使用流程

**1. 启动应用**

安装完成后，双击桌面快捷方式或在开始菜单中找到 OpenSerial 并启动。

**2. 连接串口**

- 在左侧连接面板中，选择对应的串口号
- 配置串口参数（波特率、数据位、停止位、校验位）
- 点击"打开"按钮建立连接

**3. 发送和接收数据**

- 在数据发送区域输入要发送的数据
- 选择发送格式（ASCII、HEX 等）
- 点击"发送"按钮或启用循环发送
- 接收到的数据将显示在上方的数据展示区域

**4. TCP/UDP 通信**

- 切换到相应的协议模式
- 输入目标 IP 地址和端口号
- 按照相同的方式进行数据收发

### 高级功能

**预设管理**

- 支持保存常用配置为预设
- 快速加载预设，提高工作效率
- 预设包含：连接参数、数据格式、发送内容等

**CRC 校验**

- 内置多种 CRC 校验算法
- 自动计算和验证数据校验值
- 确保数据传输的可靠性

**循环发送**

- 设置发送间隔时间
- 自动周期性发送数据
- 适用于自动化测试场景

---

## 功能截图

> TODO: 后续版本将添加功能截图

---

## 开发指南

### 项目结构说明

项目采用 electron-vite 架构，分为三个主要部分：

- **Main Process (主进程)**: 负责应用生命周期管理、系统交互、原生 API 调用
- **Preload (预加载脚本)**: 安全的桥接层，在渲染进程和主进程之间传递消息
- **Renderer Process (渲染进程)**: 前端界面，基于 Vue 3 构建

### 添加新功能

1. 在 `src/renderer/src/components/` 中创建新的 Vue 组件
2. 使用 Composable 模式管理组件逻辑（参考 `composables/` 目录）
3. 在主进程中实现底层逻辑（`services/` 目录）
4. 通过 IPC 进行进程间通信

### 构建说明

修改 `electron.vite.config.ts` 可以自定义构建配置。

在 `package.json` 的 `build` 字段中可以配置打包选项，包括应用图标、安装程序设置等。

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 许可证

本项目基于 [MIT License](LICENSE) 开源，您可以自由使用、修改和分发本项目。

---

## 联系方式

- **网站**: [www.kiradana.cn](https://www.kiradana.cn)
- **GitHub**: [https://github.com/KiraDana/OpenSeria](https://github.com/KiraDana/OpenSeria)

---

**OpenSerial** - 让串口调试更简单！
