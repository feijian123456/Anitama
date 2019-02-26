import request from '../../utils/request'
import req from 'request'
import { formatDate } from '../../utils/format'
import cheerio from 'cheerio'
import config from '../../config'
// import { remote } from 'electron'
import { mkdir, writeFile } from '../../utils/fs'
import fs from 'fs'
import path from 'path'
import { Article, Channel } from '../../utils/db'

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
  completedArticlesCount: 0,
  searched: false,
  saved: false
}

const mutations = {
  SEARCHING (state) {
    state.searched = false
  },
  SEARCH_COMPLETE (state) {
    state.searched = true
  },
  SAVING (state) {
    state.saved = false
  },
  SAVE_COMPLETE (state) {
    state.saved = true
  },
  GET_ARTICLES (state, articles) {
    state.articles = articles
  },
  COMPLETE_ARTICLE (state) {
    state.completedArticlesCount += 1
  }
}

const actions = {
  async getArticles ({ commit }) {
    // commit('SEARCHING')
    let end = false
    let i = 1
    let data = []
    let count
    while (!end) {
      try {
        const url = i === 1 ? 'http://www.anitama.cn/channel' : `http://www.anitama.cn/channel/all/${i}`
        const body = await request({ url })
        const $ = cheerio.load(body)
        const articleElms = $('#area-article-channel a.item')
        if (i === 1) {
          count = parseInt($('a.pager.pager-first').attr('data-page'))
          await downloadResource('http://img.animetamashi.cn/favicon.ico', path.join(config.savedDir, 'share', 'favicon.ico'))
          await downloadResource('http://www.anitama.cn/static/core/style/core.css?salt=9n0sfbck', path.join(config.savedDir, 'share', 'core.css'))
          await downloadResource('http://www.anitama.cn/static/index/style/article.css?salt=9n0sfbck', path.join(config.savedDir, 'share', 'article.css'))
          await downloadResource('http://www.anitama.cn/static/lib/script/lib.min.js?salt=9n0sfbck', path.join(config.savedDir, 'share', 'lib.min.js'))
          await downloadResource('http://www.anitama.cn/static/core/script/core.js?salt=9n0sfbck', path.join(config.savedDir, 'share', 'core.js'))
          await downloadResource('http://www.anitama.cn/static/index/script/article.js?salt=9n0sfbck', path.join(config.savedDir, 'share', 'article.js'))

          // 先删除原有数据
          await new Promise((resolve, reject) => {
            Channel.remove({}, { multi: true }, (err, numRemoved) => {
              if (err) reject(err)
              else resolve()
            })
          })
          let channels = []
          const channelElms = $('#area-channel-channel a.item')
          channelElms.each(function (i, elm) {
            channels.push({
              name: $(this).find('p.title').text(),
              id: parseInt($(this).attr('href').substr($(this).attr('href').lastIndexOf('/') + 1)),
              desc: $(this).find('p.desc').text()
            })
          })
          for (let key in channels) {
            await new Promise((resolve, reject) => {
              Channel.insert(channels[key], (err, newItem) => {
                if (err) reject(err)
                else resolve()
              })
            })
          }
        }

        if (articleElms && articleElms.length > 0) {
          const articles = []
          articleElms.each(function (i, elm) {
            articles.push({
              hash: $(this).attr('href').substr($(this).attr('href').lastIndexOf('/') + 1),
              title: $(this).find('h1.title').text(),
              subTitle: $(this).find('h3.subtitle').text(),
              author: $(this).find('span.author').text(),
              channel: $(this).find('span.channel').text(),
              channelId: parseInt($(this).find('span.channel').attr('data-cid')),
              publishTime: formatDate($(this).find('span.time').text()),
              publishTimeFormat: $(this).find('span.time').text(),
              excerpt: $(this).find('p.desc').text()
            })
          })
          data = [...data, ...articles]
          i++
        } else if (i === count) {
          end = true
        } else {
          i++
        }
      } catch (e) {
        throw e
      }
    }
    commit('GET_ARTICLES', data)
    commit('SEARCH_COMPLETE')
    return data.length
  },
  async saveArticles ({ commit, state }) {
    // C:\Users\aonosora\AppData\Roaming\Electron\Anitama
    // commit('SAVING')
    // 删除db原有数据
    await new Promise((resolve, reject) => {
      Article.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) reject(err)
        else resolve()
      })
    })
    for (let i = 0; i < state.articles.length; i++) {
      try {
        await mkdir(path.join(config.savedDir, state.articles[i].hash))
        let content = JSON.stringify(state.articles[i])
        await writeFile(path.join(config.savedDir, state.articles[i].hash, 'config.json'), content)
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve()
          }, 50)
        })
        const body = await request({ url: `http://www.anitama.cn/article/${state.articles[i].hash}` })
        const $ = cheerio.load(body)

        const blur = $('#header')
        let [, blurUrl, blurImg] = blur.css('background-image').match(/url\((.*?(.{6}?-blur))\)/)
        await downloadResource(blurUrl, path.join(config.savedDir, state.articles[i].hash, `${blurImg}.jpg`))
        // const blurBgImg = path.join(config.savedDir, state.articles[i].hash, `${blurImg}.jpg`).replace(/\\/g, '/')
        blur.css('background-image', `url(./${blurImg}.jpg)`)

        const top = $('#area-top-article')
        let [, topUrl, topImg] = top.css('background-image').match(/url\((.*?(.{6}?-origin))\)/)
        await downloadResource(topUrl, path.join(config.savedDir, state.articles[i].hash, `${topImg}.jpg`))
        // const topBgImg = path.join(config.savedDir, state.articles[i].hash, `${topImg}.jpg`).replace(/\\/g, '/')
        top.css('background-image', `url(./${topImg}.jpg)`)

        const preivews = $('#area-content-article img')

        for (let j = 0; j < preivews.length; j++) {
          const url = $(preivews[j]).attr('data-src')
          // 修复某些文章没有图片实际链接的情况(见hash 58626dd5ebc6d7bd)
          const imgName = url.match(/.{6}?-preview/) ? url.match(/.{6}?-preview/)[0] : (url.match(/.{6}?$/) ? url.match(/.{6}?$/)[0] : null)
          if (imgName !== null) {
            const newUrl = path.join(config.savedDir, state.articles[i].hash, `${imgName}.jpg`)
            await downloadResource(url, newUrl)
            $(preivews[j]).attr('src', `./${imgName}.jpg`)
            $(preivews[j]).attr('data-src', `./${imgName}.jpg`)
          }
          // $(preivews[j]).attr('src', newUrl)
          // $(preivews[j]).attr('data-src', newUrl)
        }

        $('#bar').remove()
        $('#area-related-article').remove()
        if ($('#area-series-article')) $('#area-series-article').remove()
        $('#area-reply').remove()
        $('#comment').remove()
        $('#footer').remove()

        $('link[href="/static/core/style/core.css?salt=9n0sfbck"]').attr('href', path.join('..', 'share', 'core.css'))
        $('link[href="/static/index/style/article.css?salt=9n0sfbck"]').attr('href', path.join('..', 'share', 'article.css'))
        $('link[rel="shortcut icon"]').attr('href', path.join(config.savedDir, 'share', 'favicon.ico'))
        $('link[href="http://bdimg.share.baidu.com/static/api/css/share_style0_16.css?v=8105b07e.css"]').remove()
        $('script[src="/static/lib/script/lib.min.js?salt=9n0sfbck"]').attr('src', path.join('..', 'share', 'lib.min.js'))
        $('script[src="/static/core/script/core.js?salt=9n0sfbck"]').attr('src', path.join('..', 'share', 'core.js'))
        $('script[src="/static/index/script/article.js?salt=9n0sfbck"]').attr('src', path.join('..', 'share', 'article.js'))
        $('script[src="//hm.baidu.com/hm.js?8d009a2184bc44535c95921b63be5cc7"]').remove()

        await writeFile(path.join(config.savedDir, state.articles[i].hash, 'index.html'), $.html())

        await new Promise((resolve, reject) => {
          Article.insert(state.articles[i], (err, newItem) => {
            if (err) reject(err)
            else resolve()
          })
        })

        commit('COMPLETE_ARTICLE')
      } catch (e) {
        throw e
      }
    }
    commit('SAVE_COMPLETE')
  }
}

export default {
  state,
  mutations,
  actions
}
