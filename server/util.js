exports.merge = function() {
    var result = {},
        length = arguments.length,
        object = null,
        key    = null;

    if ( length < 2 ) {
        throw "Must merge two or more objects";
    }

    for ( var i=0; i<length; ++i ) {
        object = arguments[i];
        for ( var key in object ) {
            if ( !object.hasOwnProperty(key) ) { continue; }
            result[key] = object[key];
        }
    }
    return result;
};