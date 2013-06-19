/**
 *
 * JukeBox2 - metaMonitor.js
 *
 * License: see included copyright.txt
 * User: leon
 * Date: 5/31/13
 * Time: 6:24 PM
 *
 *
 * Currently knows how to gather the meta data for a single directory of music
 * and store what it finds in redis.  It needs to:
 *  - work on multiple directories
 *  - monitor for changes
 *  - publish update events when things change
 *
 */

'use strict';

var config        = require('./config').config;

var fs            = require('fs');
var async         = require('async');
var mediainfo     = require("mediainfo");
var redis         = require('redis');


var path          = '/Volumes/Files0/HCHS 83 music';
var files         = [];

var good          = 0;
var bad           = 0;
var none          = 0;

var formats       = {};


var redisClient = redis.createClient(
    config.REDIS_PORT,
    config.REDIS_SERVER,
    config.REDIS_OPTIONS
);

if (config.REDIS_AUTH) redisClient.auth(config.REDIS_AUTH, function () {
    console.log('processed Redis auth');
});


function getMediaInfo(index, fileNamePath, fileName, cb) {
    var boom = false;
    var boomCount = 0;

    do {
        try {
            mediainfo(fileNamePath, function(err, res) {
                if (err) return cb(err, index, fileName);

                boom = false;
                return cb(undefined, index, fileName, res);
            });
        } catch (e) {
            boom = true;
            ++boomCount;
        }
    } while (boom && boomCount < 3);

    if (boom) return cb(new Error('Too Many Booms!'), index, fileName)
}


fs.readdir(path, function (err, fileNames) {
    console.log('err = ', err);
    console.log('count = ', fileNames.length);

    var index = 0;

    // use async to meter walking the files...
    async.eachLimit(fileNames, 1, function (fileName, cb) {
        // examine a file name
        // cb() when done

        var fileNamePath = path + '/' + fileName;

        fs.lstat(fileNamePath, function(err, stats) {
            //stats.isDirectory()
            if (stats.isFile()) {

                getMediaInfo(++index, fileNamePath, fileName, function (err, index, fileName, infos) {
                    var r;
                    var info;

                    if (err) {
                        r = err;
                        ++bad;
                    } else if ( ! infos) {
                        r = 'No Infos';
                        ++none;
                    } else if (infos.length > 0 && infos[0]) {
                        info = infos[0];
                        r = 'OK';
                        ++good;
                    } else {
                        r = 'Empty Infos';
                        ++none;
                    }

                    if (info) {
                        var formatCount = formats[info.format];
                        formats[info.format] = formatCount ? formatCount + 1 : 1;

                        console.log('' + index + ': ' + fileName + ' (' + stats.size + ') ' + r);

                        //if (info.format === 'MPEG-4') {
                        //if (info.format === 'MPEG Audio') {
                        if (info.format === 'MPEG-4' || info.format === 'MPEG Audio') {
                            //console.dir(info);

                            var partNames = {};

                            var duration = info.duration;  // 7mn 24s
                            if (duration) {
                                var dParts = duration.split(' ');
                                var secs = 0;
                                for (var p = 0; p < dParts.length; ++p) {
                                    var dPart = dParts[p];
                                    var pName = dPart.replace (/[\d]/g, "");
                                    var c = partNames[pName];
                                    partNames[pName] = c ? c + 1 : 1;

                                    var n = parseFloat(dPart);
                                    switch(pName) {
                                        case 'mn': secs += n * 60; break;
                                        case 's':  secs += n; break;
                                    }
                                }
                                var len = '?';
                                if (secs) len = Math.floor(secs / 60) + ':' + secs % 60;
                                if (len === '?') console.log('no len, info.duration = "' + info.duration + '"');
                                //console.log(duration + ' -> ' + secs);

                                var artist = info.performer ? info.performer : info.album_performer;

                                var year = '?';
                                if (info.recorded_date) {
                                    year = info.recorded_date.replace(/.*(\d{4}).*/, '$1');
                                    if ( ! year) year = '?';
                                }

                                if (year === '?') console.log('no year, info.recorded_date = "' + info.recorded_date + '"');

                                var needed = {
                                    name: fileName,
                                    complete_name: info.complete_name,
                                    //duration: info.duration,
                                    len: len,
                                    secs: secs,
                                    album: info.album,
                                    artist: artist,
                                    song: info.track_name,
                                    genre: info.genre,
                                    //recorded_date: info.recorded_date
                                    year: year
                                    //perfomer: info.perfomer,
                                    //album_performer: info.album_performer
                                };

                                //console.log(needed);

                                //files.push(needed);
                                var fileKey = config.MUSIC_META_FILE + needed.complete_name;

                                async.parallel([
                                    function (cb) {
                                        redisClient.set(fileKey , JSON.stringify(needed), function (err) {
                                            cb(err);
                                        });
                                    },
                                    function (cb) {
                                        redisClient.sadd(config.MUSIC_META_FILES, fileKey, function (err) {
                                            cb(err);
                                        });
                                    },
                                    function (cb) {
                                        redisClient.sadd(config.MUSIC_META_SONG + needed.song, fileKey, function (err) {
                                            cb(err);
                                        });
                                    },
                                    function (cb) {
                                        redisClient.zadd(config.MUSIC_META_SONGS, 0, needed.song, function (err) {
                                            cb(err);
                                        });
                                    },
                                    function (cb) {
                                        redisClient.sadd(config.MUSIC_META_ARTIST + needed.song, fileKey, function (err) {
                                            cb(err);
                                        });
                                    },
                                    function (cb) {
                                        redisClient.zadd(config.MUSIC_META_ARTISTS, 0, needed.artist, function (err) {
                                            cb(err);
                                        });
                                    }
                                ], function (err) {

                                    if (err) console.log('err = ', err);

                                });
                            }
                        }
                    }

                    cb(undefined);
                });
            }
        });

    }, function(err) {
        // if any of the saves produced an error, err would equal that error

        console.log('done, err = ', err);
        console.log('good = ', good);
        console.log('none = ', none);
        console.log('bad  = ', bad);

        /*
        console.log('\nformats:');
        console.dir(formats);

        fs.writeFile('musicfiles.json', JSON.stringify(files), function (err) {
            console.log('wrote file, err = ', err);
        });
        */
    });
});


/*
    MP4a
 > complete_name: '/Volumes/Files0/Dropbox/HCHS playlist/01 A Night to Remember.m4a',
   format: 'MPEG-4',
   format_profile: 'Apple audio with iTunes info',
   codec_id: 'M4A ',
   file_size: '10.2 MiB',
 > duration: '5mn 12s',
   overall_bit_rate_mode: 'Variable',
   overall_bit_rate: '273 Kbps',
 > album: 'Friends',
 > album_performer: 'Shalamar',
   part_position: '1',
   part_total: '1',
 > track_name: 'A Night to Remember',
   track_name_position: '1',
   track_name_total: '12',
 > performer: 'Shalamar',
   composer: 'Charmaine Elaine Sylvers/Dana Meyers/Mick Jones/Nidra Beard',
 > genre: 'R&B/Soul',
 > recorded_date: 'UTC 1982-01-01 08:00:00',
 > recorded_date: '1977',

 MP3
 > complete_name: '/Volumes/Files0/Dropbox/HCHS playlist/(Disc 2) 09 - The Magnificent Seven.mp3',
   format: 'MPEG Audio',
   file_size: '9.63 MiB',
 > duration: '5mn 33s',
   overall_bit_rate_mode: 'Variable',
   overall_bit_rate: '241 Kbps',
 > album: 'The Essential Clash',
 > album_performer: 'The Clash',
   part_position: '2',
   part_total: '2',
 > track_name: 'The Magnificent Seven',
   track_name_position: '9',
   track_name_total: '20',
 > performer: 'The Clash',
   composer: 'P. Simonon',
 > genre: 'Punk/New Wave',
 > recorded_date: '1980',

 */
