/**
 *
 * User: leon
 * Date: 6/1/13
 * Time: 6:08 PM
 *
 */

'use strict';

var async = require('async');


var g;

exports.setGlobals = function(globals) {
    g = globals;
}


exports.queue = function(req, res) {
    console.log('queue.queue() called');

    var index = req.param('i');
    var redis = g.redis;
    var queue_name = g.queue_name;
    var queueLength;
    var metaEntry;

    console.log('i = ' + index);

    async.series([
        function (cb) {
            if ( ! index) return cb(new Error('missing i'));
            metaEntry = g.meta[index];
            if ( ! metaEntry) return cb(new Error('empty metaEntry at # ' + index));
            cb();
        },
        function (cb) {
            redis.rpush(queue_name, JSON.stringify(metaEntry), function (err) {
                return cb();
            });
        },
        function (cb) {
            redis.llen(queue_name, function (err, len) {
                console.log('Queue length is NOW = ', len);
                queueLength = len;
                cb();
            });
        }
    ],
    function (err) {
        if (err) {
            res.send('PROBLEM');
        } else {
            res.send('OK, queue is now ' + queueLength + ' long');
        }
    });
}
