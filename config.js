/**
 *
 * JukeBox2 - config.js
 *
 * License: see included copyright.txt
 * User: leon
 * Date: 6/1/13
 * Time: 2:19 PM
 *
 */


var config = {};

// Redis Server
config.REDIS_PORT         = null;               // default port, 6379
config.REDIS_SERVER       = null;               // default server, localhost
config.REDIS_OPTIONS      = null;               // default options
config.REDIS_AUTH         = null;               // defaults to no auth required

// Redis Collections
config.MUSIC_META         = 'musicMeta';        // meta data storage prefix
config.MUSIC_META_FILE    = config.MUSIC_META + ':file:';   // actual file meta data
config.MUSIC_META_FILES   = config.MUSIC_META + ':files';   // set file names
config.MUSIC_META_SONG    = config.MUSIC_META + ':song:';   // sets of meta pointers by song
config.MUSIC_META_SONGS   = config.MUSIC_META + ':songs';   // sorted set of all songs
config.MUSIC_META_ARTIST  = config.MUSIC_META + ':artist:'; // sets of meta points by artist
config.MUSIC_META_ARTISTS = config.MUSIC_META + ':artists'; // sorted set of all artists

config.MUSIC_QUEUE        = 'musicQueue';       // music queue storage name

// Redis Pub/Sub

// Socket.io


exports.config = config;
