# Installation

Use npm to install all the required modules.

```bash
npm install
```

From here, the application should be properly configured; however, if not the following steps should assist in getting the app to run.

# Usage

To run the application, simply

```bash
npm start
```

# Additional Configuration

## Certificates

Create self-signed certificates as normal.

In ./bin/wwww, replace line 9 - 22 with the following code

```javascript
var https = require('https');

/**
 * Credentials, certificates
 */

const fs = require('fs');
const privateKey = fs.readFileSync('/etc/ssl/private/node-selfsigned.key', 'utf8');
const certificate = fs.readFileSync('/etc/ssl/certs/node-selfsigned.crt', 'utf8');
const credentials = {
  key: privateKey,
  cert: certificate
};

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '443');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = https.createServer(credentials,app);
```

## Database setup

Ensuring you have MySQL installed, navigate to the directory containing the VolcanoesDump.sql file run the following commands.

```bash
mysql -u root -p
```

Enter your MySQL password, and you should be greeted with a mysql terminal. Enter the following command.

```bash
source VolcanoesDump.sql
```

Make sure to configure the knexfile to match your MySQL configuration, notably ensuring the password is correct.

```javascript
module.exports = {
  client: "mysql2",
  connection: {
    host: "127.0.0.1",
    database: "volcanoes",
    user: "root",
    password: "******", // Ensure you enter your own password here.
  },
  timezone: "+10:00",
};
```

## .env setup

Ensure that you properly set up the .env file, with the constants PORT and SECRET_KEY. PORT should be 443 by default as we are serving https.

```env
PORT=****
SECRET_KEY="****"
```