module.exports = {
  appId: 'com.monkeyCode.desktoppet',
  productName: '独有桌宠',
  directories: {
    output: 'release',
  },

  files: [
    'dist/**/*',
    'dist-electron/**/*',
    'electron/preload/**/*',
  ],

  // Windows 配置
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    icon: 'resources/icon.ico',
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: '独有桌宠',
  },

  // macOS 配置
  mac: {
    target: ['dmg'],
    icon: 'resources/icon.icns',
    category: 'public.app-category.entertainment',
    hardenedRuntime: true,
    gatekeeperAssess: false,
  },

  // Linux 配置
  linux: {
    target: ['AppImage'],
    icon: 'resources',
    category: 'Utility',
  },

  // 发布配置
  publish: {
    provider: 'github',
    releaseType: 'release',
  },
}
