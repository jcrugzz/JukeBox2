/**
 *
 *
 * JukeBox2 - app.js
 *
 * License: see included copyright.txt
 * User: leon
 * Date: 6/1/13
 * Time: 1:26 PM
 *
 */


var config        = require('./config').config;

var express      = require('express');
var http         = require('http');
var path         = require('path');
var fs           = require('fs');
var async        = require('async');
var redis        = require('redis');
var events       = require('events');
var socketIO     = require('socket.io');

var routes       = require('./routes');
var user         = require('./routes/user');
var songs        = require('./routes/songs');
var queue        = require('./routes/queue');
var socketiotest = require('./routes/socketiotest');


var app = express();

var redisClient = redis.createClient(
    config.REDIS_PORT,
    config.REDIS_SERVER,
    config.REDIS_OPTIONS
);

if (config.REDIS_AUTH) redisClient.auth(config.REDIS_AUTH, function () {
    console.log('processed Redis auth');
});


function songSort(a, b) {
    if (a.song < b.song) return -1;
    if (a.song > b.song) return 1;
    return 0;
}


function readMeta(cb) {
    redisClient.smembers(config.MUSIC_META_FILES, function (err, fileRefs) {
        if (err) {
            console.error('reading files list from redis:', err);
            return cb(err);
        }

        var files = [];
        var songs = [];
        var artistsTmp = {};
        var genreTmp = {};
        var i = 0;

        async.forEach(fileRefs,
            function (fileRef, cb) {
                redisClient.get(fileRef, function (err, jsonSongMeta) {
                    if (err) {
                        console.error('reading metadata for file from redis:', err);
                        return cb(err);
                    }

                    var meta = JSON.parse(jsonSongMeta);
                    meta.i = i;
                    files.push(meta);
                    songs.push({ song: meta.song, i: i });
                    if (meta.artist) artistsTmp[meta.artist] = true;
                    if (meta.genre) genreTmp[meta.genre] = true;

                    ++i;

                    cb(err);
                });
            },
            function (err) {
                if (err) {
                    console.error(err);
                    return cb();
                }

                songs.sort(songSort);

                var artists = [];
                for (var k in artistsTmp) {
                    artists.push(k);
                }
                artists.sort();

                var genres = [];
                for (var k in genreTmp) {
                    genres.push(k);
                }
                genres.sort();

                return cb(null, {
                    meta: files,
                    songs: songs,
                    artists: artists,
                    genres: genres,
                    redis: redisClient,
                    queue_name: config.MUSIC_QUEUE
                });
            }
        );
    });
}

readMeta(function (err, results) {
    var g = results;

    songs.setGlobals(g);
    queue.setGlobals(g);

    app.set('port', process.env.PORT || 3000);

    var server = app.listen(app.get('port'));
    var io = socketIO.listen(server);

    app.configure(function () {
        app.set('views', __dirname + '/views');
        app.set('view engine', 'hjs');
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.cookieParser('your secret here'));
        app.use(express.session());
        app.use(app.router);
        app.use(express.static(path.join(__dirname, 'public')));
    });

    app.configure('development', function() {
        app.use(express.errorHandler());
    });

    app.get('/', routes.index);
    app.get('/users', user.list);
    app.get('/songs', songs.list);
    app.get('/queue', queue.queue);
    app.get('/socketiotest', socketiotest.list);


    io.sockets.on('connection', function (socket) {
        socket.emit('news', { hello: 'world' });
        socket.on('my other event', function (data) {
            console.log(data);
        });
    });

    console.log('ready.');
});

