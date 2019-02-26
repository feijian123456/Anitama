import { Article, Channel } from '../../utils/db'

import request from '../../utils/request'
import req from 'request'
import { formatDate } from '../../utils/format'
import cheerio from 'cheerio'
import { mkdir, writeFile } from '../../utils/fs'
import config from '../../config'
import path from 'path'
import fs from 'fs'

async function downloadResource (url, saveTo) {
  return new Promise((resolve, reject) => {
    req(url).on('error', err => {
      reject(err)
    }).pipe(fs.createWriteStream(saveTo))
    resolve()
  })
}

const state = {
  articles: [],
  channels: [],
  pageCount: null
}

const mutations = {
  READ_ARTICLES (state, articles) {
    state.articles = articles
  },
  GET_CHANNELS (state, channels) {
    state.channels = channels
  },
  GET_PAGE_COUNT (state, count) {
    state.pageCount = count
  },
  UPDATE_ARTICLES (state) {

  },
  UPDATE_CHANNELS (state) {

  }
}

const actions = {
  async readArticles ({ commit }, { channel, page }) {
    try {
      if (channel === null) {
        const articles = await new Promise((resolve, reject) => {
          Article.find({}).sort({ publishTime: -1 }).skip((page - 1) * 20).limit(20).exec((err, docs) => {
            if (err) {
              reject(err)
            } else {
              commit('READ_ARTICLES', docs)
              resolve(docs)
            }
          })
        })
        return articles
      } else {
        const articles = await new Promise((resolve, reject) => {
          Article.find({ channelId: channel }).sort({ publishTime: -1 }).skip((page - 1) * 20).limit(20).exec((err, docs) => {
            if (err) {
              reject(err)
            } else {
              commit('READ_ARTICLES', docs)
              resolve(docs)
            }
          })
        })
        return articles
      }
    } catch (e) {
      throw e
    }
  },
  async getChannels ({ commit }) {
    try {
      const channels = await new Promise((resolve, reject) => {
        Channel.find({}, (err, docs) => {
          if (err) reject(err)
          else {
            commit('GET_CHANNELS', docs)
            resolve(docs)
          }
        })
      })
      return channels
    } catch (e) {
      throw e
    }
  },
  async getPageCount ({ commit }, { channel }) {
    try {
      if (channel === null) {
        const pageCount = await new Promise((resolve, reject) => {
          Article.count({}, (err, count) => {
            if (err) {
              reject(err)
            } else {
              commit('GET_PAGE_COUNT', Math.ceil(count / 20))
              resolve(Math.ceil(count / 20))
            }
          })
        })
        return pageCount
      } else {
        const pageCount = await new Promise((resolve, reject) => {
          Article.count({ channelId: channel }, (err, count) => {
            if (err) {
              reject(err)
            } else {
              commit('GET_PAGE_COUNT', Math.ceil(count / 20))
              resolve(Math.ceil(count / 20))
            }
          })
        })
        return pageCount
      }
    } catch (e) {
      throw e
    }
  },
  async updateArticles ({ commit }) {
    let end = false
    let i = 1
    while (!end) {
      try {
        const url = i === 1 ? 'http://www.anitama.cn/channel' : `http://www.anitama.cn/channel/all/${i}`
        const body = await request({ url })
        const $ = cheerio.load(body)
        const articleElms = $('#area-article-channel a.item')
        if (articleElms && articleElms.length > 0) {
          for (let j = 0; j < articleElms.length; j++) {
            const hash = $(articleElms[j]).attr('href').substr($(articleElms[j]).attr('href').lastIndexOf('/') + 1)
            const num = await new Promise((resolve, reject) => {
              Article.find({ hash }, (err, docs) => {
                if (err) reject(err)
                else resolve(docs.length)
              })
            })
            if (num === 0) {
              const article = {
                hash,
                title: $(articleElms[j]).find('h1.title').text(),
                subTitle: $(articleElms[j]).find('h3.subtitle').text(),
                author: $(articleElms[j]).find('span.author').text(),
                channel: $(articleElms[j]).find('span.channel').text(),
                channelId: parseInt($(articleElms[j]).find('span.channel').attr('data-cid')),
                publishTime: formatDate($(articleElms[j]).find('span.time').text()),
                publishTimeFormat: $(articleElms[j]).find('span.time').text(),
                excerpt: $(articleElms[j]).find('p.desc').text()
              }

              await mkdir(path.join(config.savedDir, hash))
              let content = JSON.stringify(article)
              await writeFile(path.join(config.savedDir, hash, 'config.json'), content)
              await new Promise((resolve, reject) => {
                setTimeout(() => {
                  resolve()
                }, 50)
              })
              const body = await request({ url: `http://www.anitama.cn/article/${hash}` })
              const $$ = cheerio.load(body)

              const blur = $$('#header')
              let [, blurUrl, blurImg] = blur.css('background-image').match(/url\((.*?(.{6}?-blur))\)/)
              await downloadResource(blurUrl, path.join(config.savedDir, hash, `${blurImg}.jpg`))
              blur.css('background-image', `url(./${blurImg}.jpg)`)

              const top = $$('#area-top-article')
              let [, topUrl, topImg] = top.css('background-image').match(/url\((.*?(.{6}?-origin))\)/)
              await downloadResource(topUrl, path.join(config.savedDir, hash, `${topImg}.jpg`))
              top.css('background-image', `url(./${topImg}.jpg)`)

              const preivews = $$('#area-content-article img')

              for (let j = 0; j < preivews.length; j++) {
                const url = $$(preivews[j]).attr('data-src')
                const imgName = url.match(/.{6}?-preview/) ? url.match(/.{6}?-preview/)[0] : (url.match(/.{6}?$/) ? url.match(/.{6}?$/)[0] : null)
                if (imgName !== null) {
                  const newUrl = path.join(config.savedDir, hash, `${imgName}.jpg`)
                  await downloadResource(url, newUrl)
                  $$(preivews[j]).attr('src', `./${imgName}.jpg`)
                  $$(preivews[j]).attr('data-src', `./${imgName}.jpg`)
                }
              }

              $$('#bar').remove()
              $$('#area-related-article').remove()
              if ($$('#area-series-article')) $$('#area-series-article').remove()
              $$('#area-reply').remove()
              $$('#comment').remove()
              $$('#footer').remove()

              $$('link[href="/static/core/style/core.css?salt=9n0sfbck"]').attr('href', path.join('..', 'share', 'core.css'))
              $$('link[href="/static/index/style/article.css?salt=9n0sfbck"]').attr('href', path.join('..', 'share', 'article.css'))
              $$('link[rel="shortcut icon"]').attr('href', path.join(config.savedDir, 'share', 'favicon.ico'))
              $$('link[href="http://bdimg.share.baidu.com/static/api/css/share_style0_16.css?v=8105b07e.css"]').remove()
              $$('script[src="/static/lib/script/lib.min.js?salt=9n0sfbck"]').attr('src', path.join('..', 'share', 'lib.min.js'))
              $$('script[src="/static/core/script/core.js?salt=9n0sfbck"]').attr('src', path.join('..', 'share', 'core.js'))
              $$('script[src="/static/index/script/article.js?salt=9n0sfbck"]').attr('src', path.join('..', 'share', 'article.js'))
              $$('script[src="//hm.baidu.com/hm.js?8d009a2184bc44535c95921b63be5cc7"]').remove()

              await writeFile(path.join(config.savedDir, hash, 'index.html'), $$.html())
              await new Promise((resolve, reject) => {
                Article.insert(article, (err, newItem) => {
                  if (err) reject(err)
                  else resolve()
                })
              })
            } else {
              end = true
              break
            }
          }
          if (!end) i++
        } else {
          end = true
        }
      } catch (e) {
        throw e
      }
    }
  },
  async updateChannels ({ commit }) {
    try {
      const body = await request({ url: 'http://www.anitama.cn/channel' })
      const $ = cheerio.load(body)
      const channelElms = $('#area-channel-channel a.item')
      for (let i = 0; i < channelElms.length; i++) {
        const channelId = parseInt($(channelElms[i]).attr('href').substr($(channelElms[i]).attr('href').lastIndexOf('/') + 1))
        const num = await new Promise((resolve, reject) => {
          Channel.find({ id: channelId }, (err, docs) => {
            if (err) reject(err)
            else resolve(docs.length)
          })
        })
        if (num === 0) {
          await new Promise((resolve, reject) => {
            Channel.insert({
              name: $(channelElms[i]).find('p.title').text(),
              id: channelId,
              desc: $(channelElms[i]).find('p.desc').text()
            }, (err, newItem) => {
              if (err) reject(err)
              else resolve()
            })
          })
        }
      }
    } catch (e) {
      throw e
    }
  }
}

export default {
  state,
  mutations,
  actions
}
