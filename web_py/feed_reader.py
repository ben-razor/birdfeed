import feedparser, json
import asyncio, aiohttp, async_timeout
import logging
from tabulate import tabulate
from datetime import *
from dateutil import parser
import re
from collections import Counter
try:
    from google.cloud import storage
except ImportError:
    pass

BUCKET_URL='https://storage.googleapis.com/birdfeed-01000101.appspot.com/'

def add_timezone_field(date):
    """The RSS standard has timezone in the date, but not all feeds do. This adds it."""
    rss_date_format = "%a, %d %b %Y %H:%M:%S %z"
    date = parser.parse(date)
    date_str = date.strftime(rss_date_format)
    return date_str

async def get_feed_async(feed, feed_data=[]):
    """Read a single rss feed asynchronously. Store the data in feed_data"""
    feed_xml = await fetch(feed)
    d = feedparser.parse(feed_xml)
    if 'tele' in feed:
        print(d)
    source = d['feed'].get('title', '')
    image = d['feed'].get('image', {'href': ''})

    for entry in d['entries']: 
        title = entry['title']
        summary = entry.get('summary')
        date_str = add_timezone_field(entry['published'])

        feed_data.append({
            'title': title, 'source': source, 'image': image,'summary': summary, 'link': entry['link'],
            'date': date_str, 'source_url': feed
        })

    return feed_data

def get_unique_feed_urls(feed_url_groups):
    """Takes a dict { group_name => [feeds...], ...} and returns a list of unique feeds"""
    feed_urls = []

    for g in feed_url_groups:
        urls = feed_url_groups[g]['feeds']
        for url in urls:
            if url not in feed_urls:
                feed_urls.append(url)
    return feed_urls 

def get_feed_url_counts(feed_url_groups):
    """Takes a dict { group_name => [feeds...], ...} and returns a dict with urls as 
    keys and number of groups they appear in as values"""

    c = Counter()
    for g in feed_url_groups:
        urls = feed_url_groups[g]['feeds']
        c.update(urls)

    return c

def get_feeds_async(loop):
    """Read a number of feeds asynchronously and then sort them by date"""
    feed_data = []
    feed_url_groups = get_feed_url_groups(loop)
    feed_urls = get_unique_feed_urls(feed_url_groups) 

    tasks = [get_feed_async(feed, feed_data) for feed in feed_urls]
    loop.run_until_complete(asyncio.wait(tasks, return_when=asyncio.ALL_COMPLETED))
    feed_data.sort(key = lambda f: datetime.strptime(f['date'], "%a, %d %b %Y %H:%M:%S %z"), reverse=True)
    return feed_data

async def fetch(url, timeout=10):
    """Fetch a response from a url asynchronously"""
    with async_timeout.timeout(timeout):
        headers = {
            "Accept": "application/rss+xml, application/rdf+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8", 
            "Content-Type": "application/rss+xml",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36", 
        }
        async with aiohttp.ClientSession(skip_auto_headers=['User-Agent', 'Accept', 'Content-Type'], headers=headers) as session:
            async with session.get(url) as response:
                if 'tele' in url:
                    print('-- headers --')
                    print(response.status)
                    print(response.headers)
                    print('-- end headers --')
                resp_str = await response.read()
    return resp_str

def get_feeds():
    """Read in feeds synchronously from the sources and sort them by time"""
    feed_data = []
    feed_url_groups = get_feed_url_groups(loop)
    feeds = get_unique_feed_urls(feed_url_groups) 

    for feed in feeds:
        d = feedparser.parse(feed)
        source = d['feed']['title']
        image = d['feed'].get('image', {'href': ''})

        for entry in d['entries']: 
            title = entry['title']
            summary = entry.get('summary')
            date_str = add_timezone_field(entry['published'])

            feed_data.append({
                'title': title, 'source': source, 'image': image,'summary': summary, 'link': entry['link'],
                'date': date_str
            })

    feed_data.sort(key = lambda f: datetime.strptime(f['date'], "%a, %d %b %Y %H:%M:%S %z"), reverse=True)

    return feed_data 

def get_stored_feeds(loop):
    return get_obj(loop, 'feed-data.json')

def get_feed_urls(loop, feed_url_group):
    feed_url_groups = get_feed_url_groups(loop)
    feed_urls = []
    if feed_url_group in feed_url_groups:
        feed_urls = feed_url_groups[feed_url_group]['feeds']
    return feed_urls

def get_feed_url_groups(loop):
    o = get_obj(loop, 'feed-url-groups.json')
    return o['feed_url_groups']

def limit_feeds_to_group(loop, feeds, feed_url_group=''):
    """Takes a list of feed entries and returns those with urls in the feed_url_group"""
    feed_urls = get_feed_urls(loop, feed_url_group)
    matching_feeds = []
    for feed in feeds:
        if feed['source_url'] in feed_urls:
            matching_feeds.append(feed)

    return matching_feeds

def add_feed_url(loop, feed_url, feed_url_group=''):
    """Add a feed url and attempt to get and store new feeds.

    Returns:
        A tuple (feed_urls, success, reason)

        feed_urls: updated array of feed_urls
        success: boolean
        reason: ok, no-data-from-feed, url-exists, max-feeds-10, timeout
    """
    success = True 
    reason = 'ok'
    feed_url_groups = get_feed_url_groups(loop)
    if feed_url_group not in feed_url_groups:
        feed_url_groups[feed_url_group] = {'feeds': []}

    feed_urls = feed_url_groups[feed_url_group]['feeds']

    feed_url_counts = get_feed_url_counts(feed_url_groups)
    feed_already_exists = feed_url_counts.get(feed_url, 0) > 0

    if len(feed_urls) >= 10:
        success = False
        reason = 'max-feeds-10'
    elif feed_url not in feed_urls:
        try:
            if feed_already_exists:
                feed_urls.append(feed_url)
                store_feed_url_groups(feed_url_groups)
            else:
                feeds = get_stored_feeds(loop)
                new_feeds = loop.run_until_complete(asyncio.wait_for(get_feed_async(feed_url, []), timeout=5))
                if new_feeds and len(new_feeds):
                    feeds.extend(new_feeds)
                    feeds.sort(key = lambda f: datetime.strptime(f['date'], "%a, %d %b %Y %H:%M:%S %z"), reverse=True)
                    feed_urls.append(feed_url)
                    store_feeds(feeds)
                    store_feed_url_groups(feed_url_groups)
                else:
                    success = False
                    reason = 'no-data-from-feed'
        except TimeoutError:
            success = False
            reason = 'timeout'
    else:
        success = False
        reason = 'url-exists'

    return feed_urls, success, reason

def delete_feed_url(loop, feed_url, feed_url_group=''):
    """Delete a feed url and remove feeds for that url.

    Returns:
        A tuple (feed_urls, success, reason)

        feed_urls: updated array of feed_urls
        success: boolean
        reason: ok, url-does-not-exist
    """
    success = True
    reason = 'ok'
    feed_url_groups = get_feed_url_groups(loop)
    feed_url_counts = get_feed_url_counts(feed_url_groups)
    feed_still_in_use = feed_url_counts.get(feed_url, 0) > 1

    if feed_url_group not in feed_url_groups:
        success = False
        reason = 'url-group-does-not-exist'
    else:
        feed_urls = feed_url_groups.get(feed_url_group)['feeds']
        if feed_url in feed_urls:
            feed_urls.remove(feed_url)
            store_feed_url_groups(feed_url_groups)
            
            if not feed_still_in_use:
                feeds = get_stored_feeds(loop)
                feeds = list(filter(lambda x: x['source_url'] != feed_url, feeds))
                store_feeds(feeds)
        else:
            success = False
            reason = 'url-does-not-exist'

    return feed_urls, success, reason

def store_feeds(feeds):
    store_obj(feeds, 'feed-data.json', is_cached=False)

def store_feed_urls(feed_urls):
    store_obj(feed_urls, 'feed-url-groups.json', is_cached=False)

def store_feed_url_groups(feed_url_groups):
    store_obj({'feed_url_groups': feed_url_groups}, 'feed-url-groups.json', is_cached=False)

def store_obj(obj, file_name, is_public=True, is_cached=True):
    """JSONify an object and upload to google cloud storage. Setting public 
    and no-cache/no-store if needed.
    """
    client = storage.Client()
    bucket = client.bucket('birdfeed-01000101.appspot.com')
    blob = bucket.get_blob(file_name)
    if not is_cached:
        blob.cache_control = 'no-cache,no-store'
    blob.upload_from_string(json.dumps(obj))
    if is_public:
        blob.make_public()

def get_obj(loop, file_name):
    url = BUCKET_URL + file_name
    print(url)
    data = loop.run_until_complete(fetch(url))
    data_obj = {}
    print(data[0:1000])
    try:
        data_obj = json.loads(data)
    except Exception as e:
        print("Exceptional!")
    return data_obj

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    feed_data = get_feeds_async(loop)
    #feed_data = get_stored_feeds(loop)
    print('after get_feeds ' + str(len(feed_data)))
