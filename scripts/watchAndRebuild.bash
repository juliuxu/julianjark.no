#/bin/bash

intervalInSeconds=10
baseUrl=https://julianjark.no

S=S
lastCheck=$(date -v-$intervalInSeconds$S -u +"%Y-%m-%dT%H:%M:%SZ")

while true
do
echo "Checking"
curl -H 'Cache-Purge: 1' -X POST --fail $baseUrl/api/cache-purge?onlyEditedSinceDate=$lastCheck
lastCheck=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "waiting $intervalInSeconds seconds"
sleep $intervalInSeconds
done