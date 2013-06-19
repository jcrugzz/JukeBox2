/**
 *
 *
 * JukeBox2 - musicPlayer.js
 *
 * License: see included copyright.txt
 * User: leon
 * Date: 6/1/13
 * Time: 1:26 PM
 *
 */

var config        = require('./config').config;

var async         = require('async');
var redis         = require('redis');
var events        = require('events');
var fs            = require('fs');


var redisClient = redis.createClient(
    config.REDIS_PORT,
    config.REDIS_SERVER,
    config.REDIS_OPTIONS
);

if (config.REDIS_AUTH) redisClient.auth(config.REDIS_AUTH, function () {
    console.log('processed Redis auth');
});


var metaEntry;


redisClient.on("error", function (err) {
    console.error("Redis Error:", err);
});


async.series([
    function (cb) {
        // report about the queue at start up
        redisClient.llen(config.MUSIC_QUEUE, function (err, len) {
            console.log('Queue length = ', len);
            cb();
        });
    },
    function (cb) {
        // get a random song
        redisClient.srandmember(config.MUSIC_META_FILES, function (err, musicFileRef) {
            if (err) {
                return cb(err);
            }

            console.log('picked: ', musicFileRef);

            redisClient.get(musicFileRef, function (err, jsonSongMeta) {
                if (err) {
                    return cb(err);
                }

                metaEntry = JSON.parse(jsonSongMeta);

                if ( ! metaEntry) {
                    return cb(new Error('bad entry, ' + jsonSongMeta));
                }

                console.log('metaEntry:', metaEntry);

                return cb();
            });
        });
    },
    function (cb) {
        // queue the song
        redisClient.rpush(config.MUSIC_QUEUE, JSON.stringify(metaEntry), function (err) { return cb(); });
    },
    function (cb) {
        // report about the queue at end
        redisClient.llen(config.MUSIC_QUEUE, function (err, len) {
            console.log('Queue length is NOW = ', len);
            cb();
        });
    }
], function (err) {
    console.log('queuing done, err = ', err);
    redisClient.quit();
});
