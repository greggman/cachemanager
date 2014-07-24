/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

var debug = require('debug')('inmemcache');
var path = require('path');

/**
 * @typedef {Object} CacheManager~Options
 * @properties {number?} cacheSizeLimit
 */

/**
 * An in memory cache manager.
 *
 * @constructor
 * @param {CacheManager~Options?} options number of bytes the
 *        cache can hold.
 */
var CacheManager = function(options) {
  options = options || {};

  var g_cacheSize = 0;
  var g_cacheSizeLimit = options.cacheSizeLimit || 64 * 1024 * 1024;
  var g_itemLRUList = [];
  var g_cachedItems = { };

  /**
   * Removes on item from cache
   */
  var remove = function(id) {
    var entry = g_cachedItems[id];
    if (entry.size) {
      g_cacheSize -= entry.size;
    }
    delete g_cachedItems[id];
    var index = g_itemLRUList[id];
    if (index >= 0) {
      g_itemLRUList.splice(index, 1);
    }
  };

  /**
   * Removes a bunch of ids from the cache.
   * @param {string[]} idsToRemove
   */
  var removeById = function(idsToRemove) {
    if (!(idsToRemove instanceof Array)) {
      remove(idsToRemove);
    } else {
      idsToRemove.forEach(remove);
    }
    debug("g_cacheSize: " + g_cacheSize);
  };

  /**
   * Make sure there's space in the cache
   *
   * Note: passing in a number larger than the
   * cache's size limit will not increase the limit
   *
   * @param {number} number of bytes to make available.
   */
  var makeSpaceInCache = function(spaceNeeded) {
    var targetSize = Math.max(0, g_cacheSizeLimit - spaceNeeded);
    while (g_cacheSize > targetSize) {
      removeById(g_itemLRUList.splice(0, 1));
    }
  };

  var getContentFromCache = function(id) {
    var content;
    var entry = g_cachedItems[id];
    if (entry !== undefined) {
      content = entry.data;
      debug("from cache: " + id);
      var index = g_itemLRUList.indexOf(id);
      if (index < 0) {
        console.error("index should not be missing");
      } else {
        g_itemLRUList.splice(index, 1);
        g_itemLRUList.push(id);
      }
    }
    return content;
  };

  var cacheContent = function(id, data, opt_size) {
    var size = opt_size || data.length;
    if (size <= g_cacheSizeLimit) {
      makeSpaceInCache(size);
      g_cachedItems[id] = { data: data, size: size };
      g_cacheSize += size;
      g_itemLRUList.push(id);
      debug("cached: " + id);
      debug("g_cacheSize: " + g_cacheSize);
      return true;
    } else {
      debug("file too big for cache: " + filename + ", size: " + data.length);
      return false;
    }
  };

  /**
   * Clear the cache
   */
  var clear = function() {
    g_cachedItems = {};
    g_cacheSize = 0;
    g_itemLRUList = [];
    debug("cleared cache");
  };

  /**
   * Set the cache size limit
   * @param {number} numBytes number of bytes allowed in the
   *        cache.
   */
  var setCacheSizeLimit = function(numBytes) {
    g_cacheSizeLimit = Math.max(0, numBytes);
    makeSpaceInCache(0);
  };

  /**
   * @typedef {Object} CacheManager~Info
   * @property {number} cacheSize number of bytes in the cache
   */

  /**
   * Get various internal info. Mostly for testing.
   * @returns {CacheManager~Info}
   */
  var getInfo = function() {
    return {
      cacheSize: g_cacheSize,
    };
  };


  /**
   * Clears the cache.
   */
  this.clear = clear;

  /**
   * cache content
   *
   * @param {string} id
   * @param {??} content to cache. Must have a `length` field for
   *        size or you can supply the size as the 3rd argument.
   * @param {Number?} opt_size
   * @return {boolean} true if content was cached.
   */
  this.cache = cacheContent;

  /**
   * remove content from cache
   *
   * This has the exact same usage as fs.readFileSync
   * @param {string[]|string} ids ids to remove
   */
  this.uncache = removeById

  /**
   * get content from cache
   * @param {string} id id of content
   * @returns {??} content or undefined
   */
  this.get = getContentFromCache;

  /**
   * Lets you change the cache limit.
   * If there is more in the cache than the new limit
   * the cache will be immediately emptied until it's
   * under the new limit.
   * @param {number} numBytes the number of bytes allowed in the
   *        cache.
   */
  this.setCacheSizeLimit = setCacheSizeLimit;

  /**
   * Get various internal info. Mostly for testing.
   * @returns {CacheManager~Info}
   */
  this.getInfo = getInfo;
};

module.exports = CacheManager;

