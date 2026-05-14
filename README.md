# OpenSerial - 开源跨平台串口调试助手

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

OpenSerial 是嵌入式工程师打造的开源免费跨平台串口调试助手。核心特性：多窗口多串口同时连接，每个窗口独立配置波特率、校验位等参数，独立管理收发数据；无广告、无付费功能、界面现代简洁；针对嵌入式与自动化场景优化，完美替代传统老旧串口工具。

### 核心特性

- ✅ **完全开源免费** - MIT 开源协议，代码透明，无任何隐藏费用
- ✅ **跨平台支持** - 支持 Windows、macOS、Linux 主流操作系统
- ✅ **多窗口多串口** - 同时连接多个串口，每个窗口独立配置参数
- ✅ **收发格式统一** - HEX/ASCII 格式切换，收发同步显示
- ✅ **CRC 校验** - 内置 CRC8/CRC16/XOR/LRC 校验算法
- ✅ **循环发送** - 支持定时循环发送预设数据
- ✅ **预设管理** - 99 条预设数据槽位，每个窗口独立管理
- ✅ **界面可折叠** - 连接参数和预设面板可折叠，最大化数据显示区
- ✅ **无广告无付费** - 纯净体验，所有功能完全免费

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

**4. 构建生产版本**

```bash
npm run build
```

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
- 选择发送格式（HEX / ASCII）
- 点击"发送"按钮或启用循环发送
- 接收到的数据将显示在上方的数据展示区域

**4. 预设管理**

- 点击发送区的"预设"按钮打开预设面板
- 支持 99 条预设数据槽位
- 每条预设可独立设置格式（HEX/ASCII）和发送延迟
- 支持循环发送选中的预设数据

---

## 功能截图

> TODO: 后续版本将添加功能截图

---

## 开发指南

### 项目架构

```
openSerial/
├── src/
│   ├── main/                 # 主进程代码
│   │   ├── app/             # 应用入口管理
│   │   │   ├── TrayManager.ts    # 系统托盘管理
│   │   │   ├── WindowManager.ts  # 窗口管理
│   │   │   └── index.ts
│   │   ├── services/        # 核心服务
│   │   │   ├── config.ts    # 配置服务
│   │   │   ├── serial.ts    # 串口服务
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
│           │   ├── useCyclicSend.ts       # 循环发送
│           │   └── useTabs.ts             # 标签页管理
│           ├── types/      # TypeScript 类型定义
│           └── App.vue      # 根组件
├── electron.vite.config.ts  # electron-vite 配置
├── package.json             # 项目配置和依赖
└── tsconfig.json           # TypeScript 配置
```

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

本项目基于 [MIT License](LICENSE) 开源。

---

## 联系方式

- **官网**: [www.kiradana.cn](https://www.kiradana.cn)
- **GitHub**: [https://github.com/KiraDana/OpenSeria](https://github.com/KiraDana/OpenSeria)

---

**OpenSerial** - 让串口调试更简单！
