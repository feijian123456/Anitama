<template>
    <div id='home-page'>
        <div id="header"></div>
        <div id='mainer' v-if="display">
          <div id='inner' style="width: 1120px; margin: 0 auto;">
            <div id="area-top-channel">
              <div id="nav-top-channel">
                <a @click="routeToChannel()" :class="$route.query.channel === undefined ? 'active' : ''" style="font-size: 14px; font-weight: bold;">全部文章</a>
                <a @click="update(channel, page)" style="font-size: 14px; font-weight: bold;">更新本地存储</a>
              </div>
              <div id="area-channel-channel" class="area">
                <div class="bar">
                  精彩频道
                  <a :class="[expandedChannels ? 'expanded' : 'unexpanded', 'right']" id="btn-toggle-channel" @click="expandedChannels = !expandedChannels">
                    <i class="icon icon-arrow-down before" v-if="!expandedChannels"></i>
                    <i class="icon icon-arrow-up after" v-else></i>
                  </a>
                </div>
                <div :class="[expandedChannels ? '' : 'status-folded', 'inner']">
                  <a class="item" v-for="(channel, index) in channels" :key="index" @click="routeToChannel(channel.id)" v-show="checkExpandChannel(index)">
                    <p class="title overflow">{{ channel.name }}</p>
                    <p class="desc overflow">{{ channel.desc }}</p>
                  </a>
                </div>
              </div>
            </div>
            <div id="area-bottom-channel" class='clear'>
              <div class="bar">
                {{ getChannelName() }}
                <a class='right' id='btn-calendar-channel'>暂时没有按时间筛选这个操作</a>
              </div>
              <div class="inner" v-if="pageCount > 0">
                <a class="item" v-for="(article, index) in articles" :key="index" @click="openArticleLink(article.hash)">
                  <h1 class="title overflow">{{ article.title }}</h1>
                  <h3 class="subtitle overflow">{{ article.subTitle }}</h3>
                  <p class="info-article-channel clear">
                    <span class="channel">{{ article.channel }}</span>
                    |
                    <span class="author">{{ article.author }}</span>
                    |
                    <span class="time">{{ parseArticleDate(article.publishTime) }}</span>
                  </p>
                  <p class="desc">{{ article.excerpt }}</p>
                </a>
                <div class="area-pager">
                  <a class="pager pager-first" v-if="page > 1" @click="routeToPage(1)">
                    <i class="icon icon-skip-previous"></i>
                  </a>
                  <a class="pager pager-hinds" v-for="p in pageHinds" :key='p' @click="routeToPage(p)">{{ p }}</a>
                  <a class="pager pager-here active">{{ page }}</a>
                  <a class="pager pager-fores" v-for="p in pageFores" :key="p" @click="routeToPage(p)">{{ p }}</a>
                  <a class="pager pager-last" v-if="page < pageCount" @click="routeToPage(pageCount)">
                    <i class="icon icon-skip-next"></i>
                  </a>
                  <span class="hint">{{ page }} / {{ pageCount }}页</span>
                  <!-- page > 1, 有<<按钮 -->
                  <!-- page < pageCount, 有>>按钮 -->
                  <!-- page - 4 ~ page ~ page + 4 -->
                </div>  
              </div>
              <div class="inner" v-else>
                <p class='alert'>暂无数据。</p>
              </div>
            </div>
          </div>
        </div>
    </div>
</template>
<script>
import { mapState, mapActions } from 'vuex'
import config from '../config'
import path from 'path'
import { parseDate } from '../utils/format'
export default {
  name: 'home-page',
  data () {
    return {
      channel: null,
      page: 1,
      expandedChannels: false,
      display: false
    }
  },
  computed: {
    ...mapState({
      articles: ({ Client }) => Client.articles,
      channels: ({ Client }) => Client.channels,
      pageCount: ({ Client }) => Client.pageCount
    }),
    pageHinds () {
      const page = this.page
      if (page < 5) {
        const hinds = []
        let i = page - 1
        while (i > 0) {
          hinds.unshift(i)
          i--
        }
        return hinds
      } else {
        return [page - 4, page - 3, page - 2, page - 1]
      }
    },
    pageFores () {
      const page = this.page
      if (this.pageCount - page >= 4) {
        return [page + 1, page + 2, page + 3, page + 4]
      } else {
        const fores = []
        let i = this.pageCount - page
        while (i > 0) {
          fores.unshift(page + i)
          i--
        }
        return fores
      }
    }
  },
  methods: {
    ...mapActions(['readArticles', 'getChannels', 'getPageCount', 'updateArticles', 'updateChannels']),
    routeToChannel (channelId = null) {
      this.update(channelId, 1)
    },
    routeToPage (page) {
      this.update(this.channel, page).then(() => {
        window.scrollTo(0, 0)
      })
    },
    checkExpandChannel (index) {
      if (index <= 4) return true
      return this.expandedChannels
    },
    openArticleLink (hash) {
      this.$electron.shell.openExternal(path.join(config.savedDir, hash, 'index.html'))
    },
    getChannelName () {
      return this.$route.query.channel === undefined ? 'All Channel' : this.channels.find(e => e.id === parseInt(this.$route.query.channel)).name
    },
    update (channel, page) {
      this.channel = channel
      this.page = page
      return Promise.all([this.getChannels(), this.readArticles({ channel, page }), this.getPageCount({ channel })]).then(data => {
        console.log('data', data)
      }).catch(err => {
        console.log(err)
      })
    },
    parseArticleDate (d) {
      return parseDate(d)
    }
  },
  created () {
    // /home?channel=xxx&page=xxx
    // channel 默认为all page 默认为1
    this.channel = this.$route.query.channel || null
    this.page = this.$route.query.page || 1
    Promise.all([this.getChannels(), this.readArticles({ channel: this.channel, page: this.page }), this.getPageCount({ channel: this.channel })]).then(data => {
      console.log('data', data)
      this.display = true
    }).catch(err => {
      console.log(err)
    })
  }
}
</script>
<style lang="scss">
// @import url('~@/assets/header.png');
@import "~@/assets/core.css";
body {
  margin: 0;
  padding: 0;
  color: #3e3a39;
  font-size: 14px;
}
a {
  cursor: pointer;
  text-decoration: none;
  color: #3e3a39;
  &:visited {
    color: #727171;
  }
}
.right {
  float: right;
}
.item {
  position: relative;
}
.title, .desc, .subtitle {
  overflow: hidden;
}
.overflow {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.clear:after, .area:after, .nav:after, .inner:after, .group:after, .item:after {
  content: '';
  display: block;
  clear: both;
}
div#home-page {
  div#header {
    width: 100%;
    height: 300px;
    background: url(../assets/header.jpg) center top no-repeat;
  }
  div#mainer {
    margin-top: -135px;
    padding-top: 5px;
    text-align: center;
    background: url(../assets/background.png) center top no-repeat;
  }
  div#area-top-channel {
    border-top: 1px solid #eee;
    position: relative;
    padding-top: 90px;
    margin-top: -1px;
    div#nav-top-channel {
      position: absolute;
      left: 50%;
      width: 100px;
      margin-left: -50px;
      top: 0;
      height: 40px;
      line-height: 40px;
      color: #595757;
      font-size: 0; 
      text-align: center;
      a {
        font-size: 12px;
        display: inline-block;
        width: 100px;
        margin: 0;
        padding: 0;
        &.active {
          color: #f33;
        }
      }
    }
    div#area-channel-channel {
      margin: 0 45px 45px;
      .bar {
        height: 30px;
        font-size: 14px;
        line-height: 30px;
        color: #3e3a39;
        text-align: left;
        &:before {
          content: '';
          display: block;
          float: left;
          width: 6px;
          height: 14px;
          margin-right: 5px;
          margin-top: 8px;
          border-radius: 3px;
          background-image: -webkit-linear-gradient(left, #f3c759, #ff719b);
          background-image: -moz-linear-gradient(left, #f3c759, #ff719b);
          background-image: linear-gradient(to right, #f3c759, #ff719b);
        }
        .right {
          cursor: pointer;
          font-size: 12px;
          color: #727171;
        }
        .expanded:before {
          content: '收起';
        }
        .unexpanded:before {
          content: '展开';
        }
      }
      .inner {
        font-size: 0;
        text-align: left;
        color: #3e3a39;
        overflow: hidden;
        margin-top: 15px;
      }
      .inner.status-folded {
        height: 45px !important;
      }
      .item {
        float: left;
        height: 45px;
        line-height: 45px;
        // padding-left: 55px;
        width: 200px;
        -webkit-box-sizing: border-box;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
        font-size: 0;
        margin-bottom: 20px;
        // padding-right: 10px;
      }
      .title {
        line-height: 20px;
        font-size: 14px;
        margin-top: 2.5px;
        text-align: center;
      }
      .desc {
        line-height: 20px;
        font-size: 12px;
        color: #979696;
        text-align: center;
      }
    }
  }
  div#area-bottom-channel {
    padding: 0 45px;
    .bar {
      height: 40px;
      line-height: 40px;
      border-bottom: 4px solid #efefef;
      text-align: left;
      font-size: 16px;
    }
    div#btn-calendar-channel {
      font-size: 12px;
      color: #727171;
      -webkit-transition: color 300ms ease;
      -moz-transition: color 300ms ease;
      transition: color 300ms ease;
    }
    .alert {
      margin-top: 40px;
      margin-bottom: 40px;
    }
    .item {
      padding: 35px 0;
      text-align: left;
      display: block;
      height: 231px;
      float: left;
      width: 50%;
      border-bottom: 1px solid #eee;
      -webkit-box-sizing: border-box;
      -moz-box-sizing: border-box;
      box-sizing: border-box;
      &:visited {
        color: #727171;
      }
      .title {
        font-size: 20px;
        color: #3e3a39;
        line-height: 1.5;
      }
      .subtitle {
        font-size: 14px;
        color: #595757;
        line-height: 1.5;
        margin-top: 5px;
      }
      .info-article-channel {
        font-size: 12px;
        color: #979696;
        line-height: 1.5;
        margin-top: 10px;
        .channel {
          color: #a6790a;
          cursor: pointer;
          margin-right: 5px;
        }
        .author {
          margin-left: 5px;
        }
        .time {
          color: #727171;
        }
      }
      .desc {
        width: 333px;
        font-size: 12px;
        line-height: 20px;
        color: #727171;
        position: absolute;
        left: 0;
        bottom: 35px;
        max-height: 60px;
      }
    }
    .area-pager {
      margin-top: 30px;
      margin-bottom: 20px;
      float: left;
      width: 100%;
      .pager.pager-first, .pager.pager-last {
        font-size: 16px;
      }
    }
  }
}
</style>
