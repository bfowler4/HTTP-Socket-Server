const net = require(`net`);
const client = new net.Socket();
client.setEncoding(`utf8`);

client.connect(8080, () => {
  console.log(`Connected to server`);
  client.write(createRequest());
});

client.on(`data`, (data) => {
  console.log(data);
  client.end();
});

client.on(`end`, () => {
  console.log(`Disconnected from server`);
});

function createRequest() {
  let args = process.argv.slice(2);
  if (args.length > 0) {
    let header = createHeader(args[0]);
    return header;
  }
}

function createHeader(url) {
  let uri = url.split(`/`).length > 1 ? url.split(`/`).slice(1).join(`/`) : `/`;
  let requestLine = `GET ${uri} HTTP/1.1`;
  let host = url.split(`/`)[0];
  let date = new Date().toUTCString();
  return `${requestLine}\nHost: ${host}\nDate: ${date}\nUser-Agent: Brandon\n\n`;
}