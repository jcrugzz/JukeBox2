/**
 *
 * User: leon
 * Date: 5/30/13
 * Time: 12:38 AM
 *
 */

'use strict';

var g;

exports.setGlobals = function(globals) {
    g = globals;
}


exports.list = function(req, res) {
    console.log('songs.list() start');

    console.log(g.songs);

    var songs = [];
    for (var i = 0; i < g.songs.length; ++i) {
        var songPtr = g.songs[i];
        var song = g.meta[songPtr.i];
        //console.log(i, song);
        songs.push(song);
    }
    res.render('songs', { songs: songs });

    console.log('songs.list() end');
}

