JukeBox
=======

A server provides playings music tracks from a music queue.
Users can watch the queue and act on the queue.
Actions can include adding a song to the queue, pausing, continuing, skipping, etc.


License
-------
See included copyright.txt file.


ToDo
----
- [ ] Move to common file for config info
- [ ] Move to Redis for music "database"
- [ ] Add music file size and last mod date to music database
- [ ] Start using Redis for pub / sub of events
- [ ] Add events for starting, ending, queuing, dequeuing
- [ ] Talk to client solely through Socket.io
- [ ] Render client solely through Angular
- [ ] Track users to limit plays, charge for plays, etc
- [ ] Support various user classes to allow for more or less control
- [ ] Allow for multiple music directories
- [ ] Create test cases / continuous integration
- [ ] Monitor music directories for changes
- [ ] Allow storing of music in Redis
- [ ] Allow uploading of music from user's devices to the server
- [ ] Get album art work
- [ ] Make it all prettier


Prerequisites
-------------
- Redis (2.X+), http://redis.io/
- Node.js (0.8.X+)
- Socket.io, http://socket.io/
- MPlayer, http://www.mplayerhq.hu/
- MediaInfo (command line, not GUI), http://mediainfo.sourceforge.net/
- Express (3.X+), $ npm info express version
- jQuery (1.X+) (via Google's CDM)
- jQuery-ui (maybe) (via Google's CDM)
- Angular (via Google's CDM)


Running It
----------
Assuming this will run on a single server, laptop, or Raspberry Pi...

- Start Redis
-

If this will run on multiple servers or Redis is on a different machine...

- Review and edit config.js
- Start Redis (if not already running)
-