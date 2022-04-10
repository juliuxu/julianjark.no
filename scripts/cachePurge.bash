#/bin/bash

baseUrl=https://julianjark.no

# Manual list of routes to purge caches on 
routes=(
    "/"
    "/cacheme"
)

for route in ${routes[@]}; do
    url=$baseUrl$route
    echo "Purging 🔥: $url"
    curl $url -H 'Cache-Purge: 1' -I -s &
done

sleep 1
echo "✅ Done"
