import Datastore from 'nedb'
import path from 'path'
import config from '../config'

export const Article = new Datastore({
  autoload: true,
  filename: path.join(config.dataBaseDir, 'article.db')
})

// Article.ensureIndex({ fieldName: 'identify', unique: true })

export const Channel = new Datastore({
  autoload: true,
  filename: path.join(config.dataBaseDir, 'channel.db')
})
