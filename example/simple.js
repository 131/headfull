"use strict";

const headfull = require('headfull');
const Tray     = require('trayicon');


const http = require('http');

class foo {

  async run() {

    this.tray = await Tray.create({
      action : () => this.openSettings(),
      title : "foo de bar",
    });

    let quit     = this.tray.item("Exit", () => this.close());
    let settings = this.tray.item("Open settings", () => this.openSettings());
    this.tray.setMenu(settings, quit);


    let host = '127.0.0.1';
    this.server = http.createServer(this.dispatch);
    await new Promise(resolve => this.server.listen(0, host, resolve));
    let port = this.server.address().port;
    this.serverURL = `http://${host}:${port}/`;

    this.tray.notify("Simple", "I'm ready");
  }


  close() {
    if(this.tray)
      this.tray = this.tray.kill(), null;

    if(this.settings)
      this.settings = this.settings.close(), null;

    if(this.server)
      this.server = this.server.close(), null;
  }


  async dispatch(req, res) {
    let body = `
      <html>
        <body>
          <pre> This is gui</pre>
        </body>
      </html>
    `;
    res.end(body);
  }

  async openSettings() {
    this.settings = await headfull.open(this.serverURL, {
      x : 100,
      y : 100,
      width : 600,
      height : 400,
    });
  }

}


module.exports = foo;
