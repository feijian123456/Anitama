import request from 'request'
import https from 'https'
import http from 'http'

// 随机改变user-agent
// const userAgentList = [
//   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36',
//   'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/22.0.1207.1 Safari/537.1',
//   'Mozilla/5.0 (X11; CrOS i686 2268.111.0) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/20.0.1132.57 Safari/536.11',
//   'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1092.0 Safari/536.6',
//   'Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1090.0 Safari/536.6',
//   'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/19.77.34.5 Safari/537.1',
//   'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.9 Safari/536.5',
//   'Mozilla/5.0 (Windows NT 6.0) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.36 Safari/536.5',
//   'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3',
//   'Mozilla/5.0 (Windows NT 5.1) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3',
//   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_0) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3'
// ]

const req = async function (options, retry = 0) {
  try {
    const body = await new Promise((resolve, reject) => {
      request(options, (err, res, body) => {
        if (err) {
          reject(err)
        } else {
          resolve(body)
        }
      })
    })
    return body
  } catch (e) {
    if ((e.message === 'ETIMEDOUT' || e.message === 'ESOCKETTIMEDOUT') && retry < 5) {
      await new Promise((resolve, reject) => {
        resolve()
      }, 50)
      console.log('retry request')
      const body = await req(options, retry + 1)
      return body
    } else {
      console.log(e)
      throw e
    }
  }
}

export default async function (options) {
  const pool = options.url.indexOf('https') === -1 ? new http.Agent({ keepAlive: true, maxSockets: 100 }) : new https.Agent({ keepAlive: true, maxSockets: 100 })
  const config = {
    // timeout: 30000,
    agent: pool
    // agent: false,
    // pool: {
    //   maxSockets: 100
    // }
  }

  // const randUserAgent = userAgentList[Math.floor(Math.random() * userAgentList.length)]
  if (options.headers) {
    // options.headers['User-Agent'] = randUserAgent
  } else {
    config.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36',
      'Connection': 'keep-alive',
      'Cookie': 'Hm_lvt_8d009a2184bc44535c95921b63be5cc7=1550986956,1551013284,1551069088,1551089933; Hm_lpvt_8d009a2184bc44535c95921b63be5cc7=1551108401'
    }
  }

  const body = await req(Object.assign({}, options, config))
  return body

  // return new Promise((resolve, reject) => {
  //   request(Object.assign({}, options, config), (err, res, body) => {
  //     if (err) {
  //       console.log('err', err, options.url)
  //       reject(err)
  //     } else {
  //       if (res.statusCode === 200) {
  //         resolve(body)
  //       } else if (res.statusCode === 429) {
  //         console.log(res.statusMessage, options.url)
  //         resolve(res.statusMessage)
  //       } else {
  //         console.log('res', res)
  //         reject(res.statusMessage)
  //       }
  //     }
  //   })
  // })
}
