/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var _ = require('lodash');

function extractMetaData(params) {
    return _.chain(params)
        .pairs()
        .filter(function(pair) {
            return /^meta\./.test(pair[0]);
        })
        .map(function(pair) {
            return [
                pair[0].substring(5),
                pair[1]
            ];
        })
        .reduce(function(meta, pair) {
            meta[pair[0]] = pair[1];
            return meta;
        }, {})
        .value();
}

var Fetcher = {
    name: 'fake_fetcher',

    // ------------------------------------------------------------------
    // CRUD Methods
    // ------------------------------------------------------------------

    /**
     * read operation (read as in CRUD).
     * @method read
     * @param {Object} req  The request object from connect/express
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    read: function (req, resource, params, context, callback) {
        callback(null, {
            operation: 'read',
            args: {
                resource: resource,
                params: params,
                context: context
            }
        }, extractMetaData(params));
    },
    /**
     * create operation (create as in CRUD).
     * @method create
     * @param {Object} req  The request object from connect/express
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} body      The JSON object that contains the resource data that is being created
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    create: function (req, resource, params, body, context, callback) {
        callback(null, {
            operation: 'create',
            args: {
                resource: resource,
                params: params,
                context: context
            }
        }, extractMetaData(params));
    },
    /**
     * update operation (update as in CRUD).
     * @method update
     * @param {Object} req  The request object from connect/express
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} body      The JSON object that contains the resource data that is being updated
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    update: function (req, resource, params, body, context, callback) {
        callback(null, {
            operation: 'update',
            args: {
                resource: resource,
                params: params,
                context: context
            }
        }, extractMetaData(params));
    },
    /**
     * delete operation (delete as in CRUD).
     * @method del
     * @param {Object} req  The request object from connect/express
     * @param {String} resource  The resource name
     * @param {Object} params    The parameters identify the resource, and along with information
     *                           carried in query and matrix parameters in typical REST API
     * @param {Object} [context={}] The context object.  It can contain "config" for per-request config data.
     * @param {Function} callback callback convention is the same as Node.js
     * @static
     */
    del: function (req, resource, params, context, callback) {
        callback(null, {
            operation: 'del',
            args: {
                resource: resource,
                params: params,
                context: context
            }
        }, extractMetaData(params));
    }

};

module.exports = Fetcher;
