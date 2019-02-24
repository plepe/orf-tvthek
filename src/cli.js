const ArgumentParser = require('argparse').ArgumentParser
const request = require('request')
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

  segments.forEach(segment => downloadSegment(segment, () => {}))
})

function downloadSegment (data, callback) {
  console.log(data)
}
