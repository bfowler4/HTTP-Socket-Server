const net = require(`net`);
const files = {
  [`/`]: require(`./assets/index.js`),
  [`/index.html`]: require(`./assets/index.js`),
  [`/hydrogen.html`]: require(`./assets/hydrogen.js`),
  [`/helium.html`]: require(`./assets/helium.js`),
  [`/404.html`]: require(`./assets/404.js`),
  [`/css/styles.css`]: require(`./assets/styles.js`)
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
  const requestLine = data.split(`\n`)[0].split(` `);
  const requestType = requestLine[0];
  const path = requestLine[1];
  const httpVersion = requestLine[2];
  const date = new Date().toUTCString();
  const responseHeaders = `Server: Brandon\nDate: ${date}`;
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
  } else if (requestType === `PUT` || requestType === `POST`) {
    const created = !files.hasOwnProperty(path);
    body = data.split(`\r\n\r\n`).slice(1).join(`\r\n\r\n`);
    statusLine = created ? `HTTP/1.1 201 Created` : `HTTP/1.1 200 OK`;
    files[path] = body;
    client.write(`${statusLine}\n${responseHeaders}\n\n`);
  } else {
    if (files.hasOwnProperty(path)) {
      delete files[path];
      client.write(`HTTP/1.1 200 OK\n${responseHeaders}\n\n`);
    } else {
      client.write(`HTTP/1.1 404 NOT FOUND\n\n`);
    }
  }
}