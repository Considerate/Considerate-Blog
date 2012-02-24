#!/bin/sh

server="localhost"
port="9997"

# Delete the index from before
curl -XDELETE    "$server:$port/gogoindex"
curl -XDELETE    "$server:$port/_river"

# Create the index
curl -XPUT    "$server:$port/gogoindex"

# Create the mapping
curl -XPUT    "$server:$port/gogoindex/gogotype/_mapping" -d '
{
    "gogotype" : {
        "properties" : {
            "type" : {"type" : "string", "index":"not_analyzed"},
            "language" : {"type" : "string", "index":"not_analyzed"}
        }
    }
}
'

# Configure the river
curl -XPUT "$server:$port/_river/gogoindex/_meta" -d '{
    "type" : "couchdb",
    "couchdb" : {
        "host" : "localhost",
        "port" : 5984,
        "db" : "gogoblog",
        "filter":null
    },
    "index" : {
        "index" : "gogoindex",
        "type" : "gogotype"
    }
}'