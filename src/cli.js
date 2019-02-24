const ArgumentParser = require('argparse').ArgumentParser
var parser = new ArgumentParser({
  addHelp: true,
  description: 'Download videos from ORF TVThek'
})

parser.addArgument('url', {
  help: 'URL of a tvthek broadcast'
})

let args = parser.parseArgs()
