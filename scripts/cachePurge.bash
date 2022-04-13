#/bin/bash

baseUrl=https://julianjark.no

echo "🌍 Fetching sitemap"
response=$(curl -H 'Cache-Purge: 1' -s --fail $baseUrl/sitemap.list)
if [ $? -ne 0 ]; then
    echo "❌ Failed fetching sitemap"
    exit 1
fi

for url in $response; do
    echo "🔥 Purging: $url"
    curl $url -H 'Cache-Purge: 1' -I -s & > /dev/null
done

sleep 1
echo "✅ Done"
