'use strict'

import { app, BrowserWindow, Menu, Tray, dialog, globalShortcut } from 'electron'
import path from 'path'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

let tray

function createWindow () {
  /**
   * Initial window options
   */

  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    height: 600,
    useContentSize: true,
    width: 1366,
    minWidth: 1366
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('close', (event) => {
    const index = dialog.showMessageBox({
      type: 'info',
      title: 'Anitama',
      message: '选是退出程序, 选否最小化系统托盘',
      buttons: ['是', '否']
    })
    if (index !== 0) {
      mainWindow.hide()
      mainWindow.setSkipTaskbar(true)
      event.preventDefault()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (process.env.NODE_ENV !== 'development') {
    // mainWindow.webContents.openDevTools()
    globalShortcut.register('Control+Alt+Shift+D', () => {
      if (!mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.openDevTools({ mode: 'detach' })
      }
    })
  }

  let image = process.env.NODE_ENV === 'development' ? path.join(__dirname, '../../build/icons/icon.ico') : path.join(__static, 'icon.ico')
  tray = new Tray(image)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出程序',
      click: () => {
        mainWindow.destroy()
        app.quit()
      }
    }
  ])
  // 点击X图标最小化到系统托盘, 点击系统托盘呼出界面, 右击系统托盘选择"退出"则退出程序
  tray.setToolTip('Anitama')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (!mainWindow.isVisible()) {
      mainWindow.show()
      mainWindow.setSkipTaskbar(false)
    }
  })
}

// 防止多开
const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    } else if (!mainWindow.isVisible()) {
      mainWindow.show()
    }
    mainWindow.focus()
  }
})

if (shouldQuit) {
  app.quit()
} else {
  app.on('ready', createWindow)
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })
}

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
