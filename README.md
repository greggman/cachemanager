CacheManager
=============

A very simple cache manager

[![Build Status](https://travis-ci.org/greggman/cachemanager.svg?branch=master)](https://travis-ci.org/greggman/cachemanager)

CacheManager's sole point is to keep track of how much memory is cached and remove
things from the cache when new things are added and there's no more space.

Usage
-----

    var CacheManager = require('cachemanager');
    var cacheManager = new CacheManager();

    var id = "foo";
    var content = "bar";
    cacheManager.cache(id, content);

    var cachedContent = cacheManager.get(id);


API
---

*   `Cache(options)`

    options are optional

    *    `cacheSizeLimit`

         the number of bytes the cache can hold. Defaults to 64 meg.

*   `Cache.cache(id, content, opt_size)`

    Adds content to the cache. Content is assumed to be some object with a 'length' field but
    if not you can pass in a size as the 3rd argument. For example to cache strings you might
    want to do

        cacheManager.cache(id, someString, someString.length * 2)

    Since strings in JavaScript used at least 2 bytes per character.


*   `Cache.uncache(id)`

    allows you to remove an a specific object from the cache. `id` can be a single id
    or an array of ids.

*   `Cache.setCacheLimit`

    Changes the cache's size limit. If it's over this limit
    things will be removed from the cache until it's under the limit.

*   `Cache.clear`

    clears the cache


