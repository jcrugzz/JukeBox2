/**
 *
 * JukeBox2 - musicPlayer.js
 *
 * License: see included copyright.txt
 * User: leon
 * Date: 6/1/13
 * Time: 2:19 PM
 *
 */

'use strict';

var config        = require('./config').config;

var async         = require('async');
var redis         = require('redis');
var mplayer       = require('simple-mplayer');
var events        = require('events');


var MODE_WAITING  = 'waiting';
var MODE_PLAYING  = 'playing';
var MODE_PAUSED   = 'paused';


var mode          = MODE_WAITING;
var music;

var redisClient = redis.createClient(
    config.REDIS_PORT,
    config.REDIS_SERVER,
    config.REDIS_OPTIONS
);

if (config.REDIS_AUTH) redisClient.auth(config.REDIS_AUTH, function () {
    console.log('processed Redis auth');
});


function newSong(song) {
    if ( ! song) {
        console.error('Error: newSong() called with no song!');
        return;
    }

    console.log('newSong(): ', song);

    var musicFile = song.complete_name;
    if ( ! musicFile) {
        console.error('Error: newSong() called with a song with no complete_name!');
    }

    music = new mplayer(musicFile);
    mode = MODE_PLAYING;

    music.once('complete', function () {
        music = undefined;
        songDone(song);
    });

    music.play();

    go();
}


function songDone(song) {
    console.log('song done');
    mode = MODE_WAITING;

    go();
}


function checkQueue() {
    redisClient.lpop(config.MUSIC_QUEUE, function (err, songString) {
        var song = null;

        if (err) {
            console.error('Can NOT talk to REDIS!');
        } else {
            if (songString) {
                song = JSON.parse(songString);
                if (song) newSong(song);
            }
        }

        if ( ! song) setTimeout(go, 1000);
    });
}


function go() {
    console.log('go()', new Date(), mode);

    switch (mode) {
        case MODE_WAITING:
            checkQueue();
            break;

        case MODE_PLAYING:
            break;

        case MODE_PAUSED:
            break;

        default:
            console.error('Internal Error: mode "' + mode + '" is not recognized!');
            break;
    }
}


go();


/*
// with ability to pause/resume/stop:
var music = new mplayer(musicFile);

music.once('complete', function (music) {
    console.log('got "complete"');
});


//music.play({loop: 0}); // send "-loop 0" to MPlayer to loop the soundtrack forever
music.play();

setTimeout(function () {
    music.pause(); // pause the music after one seconds
}, 3000);

setTimeout(function () {
    music.resume(); // and resume it two seconds after pausing
}, 5000);

setTimeout(function () {
    music.stop(); // and stop definitely seven seconds after resuming
}, 10000);
*/