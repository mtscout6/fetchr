/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
/**
 * list of registered fetchers
 */
var OP_READ = 'read',
    OP_CREATE = 'create',
    OP_UPDATE = 'update',
    GET = 'GET',
    qs = require('querystring');

/**
 * @module createFetcherClass
 * @param {object} options
 */

    var debug = require('debug')('Fetchr');

    /**
     * @class Fetcher
     * @param {Object} options congiguration options for Fetcher
     * @param {Object} [options.req] The request object.  It can contain per-request/context data.
     * @param {string} [options.xhrPath="/api"] The path for XHR requests. Will be ignored serverside.
     * @constructor
     */
    function Fetcher(options) {
        this.options = options || {};
        this.req = this.options.req || {};
    }

    Fetcher.fetchers = {};

    /**
     * @method registerFetcher
     * @param {Function} fetcher
     */
    Fetcher.registerFetcher = function (fetcher) {
        var name = fetcher.name || null;
        //Store fetcher by name
        if (!(fetcher && name)) {
            throw new Error('Fetcher is not defined correctly');
        }

        Fetcher.fetchers[name] = fetcher;
        debug('fetcher ' + name + ' added');
        return;
    };

    /**
     * @method getFetcher
     * @param {String} name
     * @returns {Function} fetcher
     */
    Fetcher.getFetcher = function (name) {
        //Access fetcher by name
        if (!name || !Fetcher.fetchers[name]) {
            throw new Error('Fetcher could not be found');
        }
        return Fetcher.fetchers[name];
    };

    /**
     * @method middleware
     * @returns {Function} middleware
     *     @param {Object} req
     *     @param {Object} res
     *     @param {Object} next
     */
    Fetcher.middleware = function () {
        return function (req, res, next) {
            var request;

            if (req.method === GET) {
                var path = req.path.substr('/resource/'.length).split(';');
                request = {
                    req: req,
                    resource: path.shift(),
                    operation: OP_READ,
                    params: qs.parse(path.join('&')),
                    config: {},
                    callback: function (err, data, meta) {
                        if (err) {
                            res.status(err.statusCode || 400).send(err.message || 'request failed');
                            return;
                        }
                        meta = meta || {};

                        if (meta.headers) {
                            res.set(meta.headers);
                        }

                        res.status(meta.statusCode || 200).json(data);
                    }
                };
            } else {
                var requests = req.body.requests;

                if (!requests || Object.keys(requests).length === 0) {
                    res.status(400).end();
                    return;
                }

                var DEFAULT_GUID = 'g0',
                    singleRequest = requests[DEFAULT_GUID];
                request = {
                    req: req,
                    resource: singleRequest.resource,
                    operation: singleRequest.operation,
                    params: singleRequest.params,
                    body: singleRequest.body || {},
                    config: singleRequest.config,
                    callback: function(err, data, meta) {
                        if(err) {
                            res.status(err.statusCode || 400).send(err.message || 'request failed');
                            return;
                        }
                        meta = meta || {};
                        var responseObj = {};
                        responseObj[DEFAULT_GUID] = {data: data};
                        res.status(meta.statusCode || 200).json(responseObj);
                    }
                };
            }

            Fetcher.single(request);
            //TODO: Batching and multi requests
        };
    };


    // ------------------------------------------------------------------
    // Data Access Wrapper Methods
    // ------------------------------------------------------------------

    /**
     * Execute a single request.
     * @method single
     * @param {Object} request
     * @param {String} request.req       The req object from express/connect
     * @param {String} request.resource  The resource name
     * @param {String} request.operation The CRUD operation name: 'create|read|update|delete'.
     * @param {Object} request.params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} request.body      The JSON object that contains the resource data that is being updated. Not used
     *                           for read and delete operations.
     * @param {Object} request.config The config object.  It can contain "config" for per-request config data.
     * @param {Function} request.callback callback convention is the same as Node.js
     * @protected
     * @static
     */
    Fetcher.single = function (request) {
        debug(request.resource);
        var fetcher = Fetcher.getFetcher(request.resource.split('.')[0]),
            op = request.operation,
            req = request.req,
            resource = request.resource,
            params = request.params,
            body = request.body,
            config = request.config,
            callback = request.callback,
            args;

        if (typeof config === 'function') {
            callback = config;
            config = {};
        }

        args = [req, resource, params, config, callback];

        if ((op === OP_CREATE) || (op === OP_UPDATE)) {
            args.splice(3, 0, body);
        }

        fetcher[op].apply(fetcher, args);
    };


    // ------------------------------------------------------------------
    // CRUD Methods
    // ------------------------------------------------------------------

    /**
     * read operation (read as in CRUD).
     * @method read
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} [config={}] The config object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    Fetcher.prototype.read = function (resource, params, config, callback) {
        var request = {
            req: this.req,
            resource: resource,
            operation: 'read',
            params: params,
            config: config,
            callback: callback
        };
        Fetcher.single(request);
    };
    /**
     * create operation (create as in CRUD).
     * @method create
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} body      The JSON object that contains the resource data that is being created
     * @param {Object} [config={}] The config object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    Fetcher.prototype.create = function (resource, params, body, config, callback) {
        var request = {
            req: this.req,
            resource: resource,
            operation: 'create',
            params: params,
            body: body,
            config: config,
            callback: callback
        };
        Fetcher.single(request);
    };
    /**
     * update operation (update as in CRUD).
     * @method update
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} body      The JSON object that contains the resource data that is being updated
     * @param {Object} [config={}] The config object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    Fetcher.prototype.update = function (resource, params, body, config, callback) {
        var request = {
            req: this.req,
            resource: resource,
            operation: 'update',
            params: params,
            body: body,
            config: config,
            callback: callback
        };
        Fetcher.single(request);
    };
    /**
     * delete operation (delete as in CRUD).
     * @method del
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} [config={}] The config object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    Fetcher.prototype.del = function (resource, params, config, callback) {
        var request = {
            req: this.req,
            resource: resource,
            operation: 'del',
            params: params,
            config: config,
            callback: callback
        };
        Fetcher.single(request);
    };

    module.exports = Fetcher;
