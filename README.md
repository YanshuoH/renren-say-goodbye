# renren-say-goodbye
Store photos/blogs/status before leaving it, using SocketIO, RabbitMQ, Cheerio etc...

## This project is more a Proof Of Concept than a working tool

## Thoughts
The core idea is quite simple:
* make requests to renren api
* parse the response
* save to a specific/recognizable format

## What I've done:
User login with renren Oauth.

Every API requests will be transfered to a delay queue of RabbitMQ, then after several seconds, the delay queue will transfer the messages to another queue called normal queue, and if the request failed, move message to delay queue (retry later).

```

AlbumProducer ->                                                                                -> Blog Consumer
PhotoProducer -> messages -> RabbitHub (exchange) -> RabbitDispacher (dispatches the consumers) -> Album Consumer
BlogProducer  ->                      |                   |                                     -> Photo Consumer
                                     Delay Queue  -> Normal Queue
```

All server logs will be pushed to frontend(explorer) using SocketIO, with its type/namespace and necesarry info, in order to construct a pretty logger system.

## BUT, QUOTA KILLS AND SERVER ERROR 500 KILLS
It's a little f*cked up when you see 50% requests returns server busy (error 500), you understand directly this site will be dead soon.

## Then
Unfortunately, I won't waste my time to Renren's shitty API and it's time to move on.

But further thoughts would be:
* Ignoring quota: use selenium for scrapping contents
* Manage server error: save scrapping status in a databases, make a RabbitMQ producer/consumer system to the error raws in databases, retry them.
* Frontend logger: use polymer or reactjs ?

## Here's a memo for installation:
* Requirements:
  * NodeJS
  * MongoDB
  * RabbitMQ
  * OpenSSL
* ``` git clone https://github.com/YanshuoH/renren-say-goodbye.git ```
* Go to project dir
* Modify config.js.example to config.js and its contents with correct clientID, clientSecret etc.
* ``` npm install ```
* Since Renren Oauth requires a window of login, it is important to make a page with https (event it's a fake one)
```
 $ openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out key-cert.pem -config [path-to-openssl-cnf-file]
```
* Run a little mongod for user storage: ``` mongod --dbpath [path-you-want-to-store-data] ```
* Launch server: ``` node app.js ```
* Navigation: ``` https://127.0.0.1:3000/ ```
 * Login, grant the access, then you'll be redirected to /console
* Open a console: just type some ajax commands like
```
$.ajax({
  url: '/blogs'
})
```

  * This will save all blogs into the directory defined in config.js files, eg: ./output/blogs/*

## That's all, not very interested but something educative 
