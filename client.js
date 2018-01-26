const net = require(`net`);
const fs = require(`fs`);
const nodePath = require(`path`);
const client = new net.Socket();
watcher();
let header = {};
client.setEncoding(`utf8`);
let args = parseArgs();
console.log(args);
let connected = false;

client.connect({ host: args.host, port: args.port }, () => {
  console.log(`Connected to server`);
  connected = true;
  let request = createRequest(args);
  client.write(request);
});

client.on(`data`, (data) => {
  getHeaderFromResponse(data);
  checkForStatusError();

  if (args.headersOnly) {
    if (args.fileToSaveTo === ``) {
      console.log(headerToString());
    } else {
      saveToFile(headerToString(), args.fileToSaveTo);
    }
  } else {
    if (args.fileToSaveTo === ``) {
      console.log(data);
    } else {
      saveToFile(data, args.fileToSaveTo);
    }
  }
});

client.on(`error`, (error) => {
  if (error.code === `ENOTFOUND`) {
    console.log(`Host was not found.`);
  } else {
    console.log(error);
  }
});

client.on(`end`, () => {
  console.log(`Disconnected from server`);
});

function createHeader(args) {
  let requestLine = `${args.requestType} ${args.uri} HTTP/1.1`;
  let date = new Date().toUTCString();
  return `${requestLine}\nHost: ${args.host}\nDate: ${date}\nUser-Agent: Brandon\r\n\r\n`;
}

function createRequest(args) {
  let header = createHeader(args);
  let body = ``;
  if (args.requestType === `POST` || args.requestType === `PUT`) {
    body = readDataFromFileSynchronously(args.fileToReadFrom);
  }

  return `${header}${body}`;
}

function getHeaderFromResponse(data) {
  let headerArray = data.split(`\n\n`)[0].split(`\n`);
  header.statusLine = headerArray[0];
  headerArray.slice(1).forEach((curr) => {
    let key = curr.split(`: `)[0];
    let value = curr.split(`: `).slice(1).join(` `);
    header[key] = value;
  });
}

function checkForStatusError() {
  let statusCode = parseInt(header.statusLine.split(` `)[1]);
  if (statusCode >= 400 && statusCode < 500) {
    console.log(`Error: Some kind of 400+ code: ${header.statusLine}`);
    client.end();
  } else if (statusCode >= 500 && statusCode <= 600) {
    console.log(`Error: Some kind of 500+ code: ${header.statusLine}`);
    cliet.end();
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const results = {
    host: ``,
    uri: ``,
    requestType: `GET`,
    headersOnly: false,
    port: 8080,
    fileToSaveTo: ``,
    fileToReadFrom: ``
  };

  if (args.length >= 1) {
    let url = args[0];
    let beginning = ``;
    if (args[0].startsWith(`http://`) || args[0].startsWith(`https://`)) {
      beginning = url.split(`//`)[0] + `//`;
      url = url.split(`//`)[1];
    }
    url = url.split(`/`);
    results.host = beginning + url[0];
    if (url.length === 1 || url[1] === ``) {
      results.uri = `/`;
    } else {
      results.uri = `/${url.slice(1).join(`/`)}`;
    }

    if (args.includes(`--post`) && args.includes(`--put`)) {
      console.log(`Error: Both --post and --put were included. Choose 1.`);
      process.exit();
    } else if (args.includes(`--post`) || args.includes(`--put`)) {
      let flag = ``;
      if (args.includes(`--post`)) {
        results.requestType = `POST`;
        flag = `--post`;
      } else {
        results.requestType = `PUT`;
        flag = `--put`;
      }
      let path = args[args.indexOf(flag) + 1];
      if (path === undefined) {
        console.log(`Error: No file path given with ${flag} flag`);
        process.exit();
      } else {
        results.fileToReadFrom = path;
      }
    }

    if (args.includes(`--header`)) {
      results.headersOnly = true;
    }

    if (args.includes(`--save`)) {
      let path = args[args.indexOf(`--save`) + 1];
      console.log(path);
      if (path === undefined) {
        console.log(`Error: No save path given`);
        process.exit();
      } else {
        results.fileToSaveTo = path;
      }
    }

    if (args.includes(`--port`)) {
      let newPort = parseInt(args[args.indexOf(`--port`) + 1]);
      if (typeof newPort !== `number` || isNaN(newPort)) {
        console.log(`Error: Invalid port number or no port number was specified with --port flag`);
        process.exit();
      } else {
        results.port = newPort;
      }
    }
    return results;
  } else {
    console.log(`Error: No host/url was given.`);
    process.exit();
  }
}

function watcher() {
  setTimeout(() => {
    if (connected === false) {
      console.log(`Error: Host is not listening on port ${args.port}`);
      process.exit();
    }
  }, 5000);
}

function saveToFile(data, path) {
  fs.writeFile(path, data, (err) => {
    if (err) {
      console.log(err);
    }
    console.log(`Saved response to ${path}`);
    process.exit();
  });
}

function readDataFromFileSynchronously(path) {
  return fs.readFileSync(path, `utf8`);
}

function headerToString() {
  return Object.keys(header).reduce((accum, curr) => {
    accum += `${curr}: ${header[curr]}\n`;
    return accum;
  }, ``);
}