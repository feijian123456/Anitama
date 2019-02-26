import moment from 'moment'

export const formatDate = (d) => {
  if (d.indexOf('昨天') !== -1) {
    const [, hour, minute] = d.match(/(\d+)时(\d+)分/)
    return moment(`${hour}:${minute}`, 'H:mm').subtract('days', 1).toDate()
  } else if (d.indexOf('前天') !== -1) {
    const [, hour, minute] = d.match(/(\d+)时(\d+)分/)
    return moment(`${hour}:${minute}`, 'H:mm').subtract('days', 2).toDate()
  } else if (d.indexOf('小时前') !== -1) {
    return moment().subtract('hours', parseInt(d.substr(0, d.indexOf('小时前')))).toDate()
  } else if (d.indexOf('今天') !== -1) {
    const [, hour, minute] = d.match(/(\d+)时(\d+)分/)
    return moment(`${hour}:${minute}`, 'H:mm').toDate()
  }

  const parse = /(\d{4})?年?(\d+)月(\d+)日 (\d+)时(\d+)分/
  const [, year, month, day, hour, minute] = d.match(parse)
  return year ? moment(`${year} ${month} ${day} ${hour}:${minute}`, 'YYYY M D H:mm').toDate() : moment(`${month} ${day} ${hour}:${minute}`, 'M D H:mm').toDate()
}
