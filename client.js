const net = require(`net`);
const client = new net.Socket();
let header = {};
client.setEncoding(`utf8`);
let args = parseArgs();
if (!args) {
  process.exit();
}

client.connect(8080, () => {
  console.log(`Connected to server`);
  client.write(createRequest(args));
});

client.on(`data`, (data) => {
  let headerArray = data.split(`\n\n`)[0].split(`\n`);
  header.statusLine = headerArray[0];
  headerArray.slice(1).forEach((curr) => {
    let key = curr.split(` `)[0];
    let value = curr.split(` `)[1];
    header[key] = value;
  });
  if (args.headersOnly) {
    console.log(header);
  } else {
    console.log(data);
  }
  client.end();
});

client.on(`end`, () => {
  console.log(`Disconnected from server`);
});

function createRequest(args) {
  let header = createHeader(args);
  let body = ``;

  return `${header}${body}`;
}

function createHeader(args) {
  let requestLine = `${args.requestType} ${args.uri} HTTP/1.1`;
  let date = new Date().toUTCString();
  return `${requestLine}\nHost: ${args.host}\nDate: ${date}\nUser-Agent: Brandon\n\n`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const results = {
    host: ``,
    uri: ``, 
    requestType: `GET`,
    headersOnly: false,
    newPort: false
  };

  if (args.length >= 1) {
    let url = args[0].split(`/`);
    results.host = url[0];
    if (url.length === 1 || url[1] === ``) {
      results.uri = `/`;
    } else {
      results.uri = `/${url.slice(1).join(`/`)}`;
    }

    if (args.includes(`--post`) && args.includes(`--put`)) {
      console.log(`Error: Both --post and --put were included. Choose 1.`);
      return false;
    } else if (args.includes(`--post`)) {
      results.requestType = `POST`;
    } else if (args.includes(`--put`)) {
      results.requestType = `PUT`;
    } 
    
    if (args.includes(`--header`)) {
      results.headersOnly = true;
    }
    
    if (args.includes(`--port`)) {
      let port = parseInt(args[args.indexOf(`--port`) + 1]);
      if (typeof port !== `number` || isNaN(port) || port < 1025) {
        console.log(`Error: Invalid port number or no port number was specified with --port flag`);
        return false;
      } else {
        results.newPort = port;
      }
    }
    return results;
  } else {
    console.log(`Error: No host/url was given.`);
    return false;
  }
}