#/bin/bash

intervalInSeconds=20
baseUrl=https://julianjark.no

curl $baseUrl/api/cache-purge-watcher-stream?watchInterval=$(( intervalInSeconds * 1000 ))