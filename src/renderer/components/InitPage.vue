<template>
    <div id='init-page'>
      <div v-if="total !== null" class="container">
        <p class="desc" v-if="!searched">正在检索文章中...</p>
        <p class="desc" v-else>检索完成!</p>
        <p class="desc" v-if="!saved">正在获取保存文章, 进度: {{ progress }}%</p>
        <p class="desc" v-else>保存完成!3秒后进入主页面</p>
      </div>
    </div>
</template>
<script>
import { mapState, mapActions } from 'vuex'
import config from '../config'
import { stat, mkdir, rmDirFiles, rmdir } from '../utils/fs'
import path from 'path'
export default {
  name: 'init-page',
  data () {
    return {
      total: null
    }
  },
  computed: {
    ...mapState({
      completedArticlesCount: ({ Data }) => Data.completedArticlesCount,
      searched: ({ Data }) => Data.searched,
      saved: ({ Data }) => Data.saved
    }),
    progress () {
      if (!this.total) return null
      return parseInt(((this.completedArticlesCount / this.total) * 100))
    }
  },
  watch: {
    completedArticlesCount (val) {
      if (val === this.total) {
        localStorage.setItem('savedDir', config.savedDir)
        setTimeout(() => {
          this.$router.push({
            name: 'home-page'
          })
        }, 3000)
      }
    }
  },
  methods: {
    ...mapActions(['getArticles', 'saveArticles'])
  },
  created () {
    stat(config.savedDir).then(() => {
      rmDirFiles(config.savedDir).then(() => {
        return rmdir(config.savedDir)
      }).then(() => {
        return mkdir(config.savedDir)
      }).then(() => {
        return mkdir(path.join(config.savedDir, 'share'))
      }).then(() => {
        return this.getArticles()
      }).then(count => {
        this.total = count
        return this.saveArticles()
      }).catch(err => {
        console.log(err)
      })
    }).catch(() => {
      mkdir(config.savedDir).then(() => {
        return mkdir(path.join(config.savedDir, 'share'))
      }).then(() => {
        return this.getArticles()
      }).then(count => {
        this.total = count
        this.saveArticles()
      }).catch(err => {
        console.log(err)
      })
    })
  }
}
</script>
<style lang="scss">
div#init-page {
  div.container {
    p.desc {
      text-align: center;
      font-size: 2em;
      text-shadow: 0 1px 10px #47456d;
    }
  }
}
</style>
