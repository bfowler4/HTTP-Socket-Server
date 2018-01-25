const net = require(`net`);
let indexFile = require(`./assets/index.js`);
let hydrogenFile = require(`./assets/hydrogen.js`);
let heliumFile = require(`./assets/helium.js`);
let notFoundFile = require(`./assets/404.js`);
let stylesFile = require(`./assets/styles.js`);
const files = {
  [`/`]: indexFile,
  [`/index.html`]: indexFile,
  [`/hydrogen.html`]: hydrogenFile,
  [`/helium.html`]: heliumFile,
  [`/404.html`]: notFoundFile,
  [`/css/styles.css`]: stylesFile
};
const server = net.createServer((client) => {
  console.log(`client connected`);
  client.setEncoding(`utf8`);

  client.on(`end`, () => {
    console.log(`client disconnected`);
  });

  client.on(`data`, (data) => {
    doRequest(data, client);
    client.end();
  });
});

server.listen(8080, () => {
  console.log(`server listening on port 8080`);
});

function doRequest(data, client) {
  let requestLine = data.split(`\n`)[0].split(` `);
  let requestType = requestLine[0];
  let path = requestLine[1];
  let httpVersion = requestLine[2];
  let date = new Date().toUTCString();
  let responseHeaders = `Server: Brandon\nDate: ${date}`;
  let statusLine;
  let body;
  if (requestType === `GET`) {
    if (files.hasOwnProperty(path)) {
      statusLine = `HTTP/1.1 200 OK`;
      body = files[path];
    } else {
      statusLine = `HTTP/1.1 404 NOT FOUND`;
      body = `<h1>404 - File was not found</h1>`;
    }
    let message = `${statusLine}\n${responseHeaders}\n\n${body}`;
    client.write(message);
  } else if (requestType === `PUT`) {
    console.log(data);
  } else {
  }
}