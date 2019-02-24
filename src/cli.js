const ArgumentParser = require('argparse').ArgumentParser
const request = require('request')
const async = require('async')
const fs = require('fs')
const child_process = require('child_process')
const DOMParser = require('xmldom').DOMParser

var parser = new ArgumentParser({
  addHelp: true,
  description: 'Download videos from ORF TVThek'
})

parser.addArgument('url', {
  help: 'URL of a tvthek broadcast'
})

let args = parser.parseArgs()

request(args.url, (err, response, body) => {
  let document = new DOMParser().parseFromString(body)

  let segments = []
  let lis = document.getElementsByTagName('li')
  for (let i = 0; i < lis.length; i++) {
    let li = lis[i]

    if (li.hasAttribute('data-jsb')) {
      let data = JSON.parse(li.getAttribute('data-jsb'))
      if (data.video) {
        segments.push(data.video)
      }
    }
  }

  segments.forEach(segment => downloadSegment(segment, () => { console.log('done')}))
})

function downloadSegment (data, callback) {
  let src = data.sources.filter(src => src.quality === 'Q4A' && src.delivery === 'hls')[0]

  request(src.src, (err, response, body) => {
    let m3u8Urls = body.split(/\n/g).filter(str => !str.match(/^(#.*|)$/))

    downloadM3u8(data.id, m3u8Urls[0], callback)
  })
}

function downloadM3u8 (id, url, callback) {
  let files = []

  request(url, (err, response, body) => {
    let mp4Urls = body.split(/\n/g).filter(str => !str.match(/^(#.*|)$/))
    async.eachOf(mp4Urls, (url, index, done) => {
      let file = '/tmp/' + id + '-' + index + '.mp4'
      files.push(file)

      request({
        method: 'GET',
        url,
        encoding: null
      }, url, (err, response, body) => {
        fs.writeFile(file, body, done)
      })
    }, () => {
      console.log(id + ': starting ffmpeg')
      let cmd = 'ffmpeg -i "concat:' + files.join('|') + '" -c copy -bsf:a aac_adtstoasc -y ' + id + '.mp4'
      child_process.exec(cmd, (err, stdout, stderr) => {
        console.log('* Wrote file ' + id + '.mp4')
        callback()
      })
    })
  })
}
