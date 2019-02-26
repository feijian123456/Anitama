import fs from 'fs'
import path from 'path'

// TODO: use bluebird

export const stat = function (filePath, options = { bigint: false }) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, options, (err, stat) => {
      if (err) reject(err)
      else resolve(stat.isDirectory())
    })
  })
}

export const mkdir = function (filePath, options = { recursive: false, mode: 0o777 }) {
  return new Promise((resolve, reject) => {
    fs.mkdir(filePath, options, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

// TODO: 删除原有文件夹
export const rmDirFiles = async function (filePath) {
  try {
    const files = fs.readdirSync(filePath)
    files.forEach(async file => {
      let stat = fs.statSync(path.join(filePath, file))
      if (stat.isDirectory()) {
        await rmDirFiles(path.join(filePath, file))
        await new Promise((resolve, reject) => {
          fs.rmdir(path.join(filePath, file), err => {
            if (err) reject(err)
            else resolve()
          })
        })
      } else {
        fs.unlinkSync(path.join(filePath, file))
      }
    })
  } catch (e) {
    throw e
  }
}

export const rmdir = function (filePath) {
  return new Promise((resolve, reject) => {
    fs.rmdir(filePath, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export const writeFile = function (file, data, options = { encoding: 'utf8', mode: 0o666, flag: 'w' }) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}
