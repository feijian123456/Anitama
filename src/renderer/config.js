import path from 'path'
import { remote } from 'electron'

export default process.env.NODE_ENV === 'development' ? {
  savedDir: path.join(remote.app.getPath('userData'), 'Anitama'),
  dataBaseDir: path.join(remote.app.getPath('userData'), 'AnitamaDB')
} : {
  savedDir: path.join(remote.app.getPath('exe'), '..', 'Anitama'),
  dataBaseDir: path.join(remote.app.getPath('exe'), '..', 'AnitamaDB')
}
