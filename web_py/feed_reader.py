import os, hashlib
import feedparser, json
from urllib.parse import urlencode
import asyncio, aiohttp, async_timeout
import logging
from tabulate import tabulate
from datetime import *
from dateutil import parser
from dateutil.relativedelta import relativedelta
import re
from collections import Counter
import html
try:
    from google.cloud import storage
except ImportError:
    from mocks import storage

BUCKET_URL='https://storage.googleapis.com/birdfeed-01000101.appspot.com/'
rss_date_format = "%a, %d %b %Y %H:%M:%S %z"

def iso_date_to_rss(iso_date_str):
    """Convert an ISO 8601 date string to an rss/atom date string."""
    d = parser.parse(iso_date_str)
    return d.strftime(rss_date_format)

def add_timezone_field(date):
    """The RSS standard has timezone in the date, but not all feeds do. This adds it."""
    date = parser.parse(date)
    date_str = date.strftime(rss_date_format)
    return date_str

selected_groups = [
    'UK News', 'News', 'Crypto', 'Science', 'Finance', 'Crypto Tech', 'World News',
    'Technology', 'Business', 'Dev' 
]

locked_groups = [
    '', 'The Menagerie', 'UK News', 'News', 'Crypto', 'Science', 'Finance', 'Crypto Tech', 'World News',
    'Technology', 'Tech', 'Business', 'Dev' 
]

def is_selected_group(group):
    """Check if a group is selected (groups/feeds will be shown as suggestions)"""
    return group in selected_groups

def is_locked_group(group):
    """Check if a group is locked (feeds cannot be added or removed)"""
    return group in locked_groups

def is_locker(pw):
    digest = os.environ.get('LOCKER_DIGEST')
    salt = os.environ.get('LOCKER_SALT')

    return password_match(pw, digest, salt)

def hash_pw(pw, salt=None):
    """"Takes a plaintext pw and an optional supplied salt as a hex string
    
    Returns a digest and a salt as hex strings"""
    salt = bytes.fromhex(salt) if salt is not None else os.urandom(32)
    digest = hashlib.pbkdf2_hmac('sha256', pw.encode('utf-8'), salt, 100000)
    return digest.hex(), salt.hex()

def password_match(pw, pw_hash, salt):
    digest, salt = hash_pw(pw, salt)
    return digest == pw_hash

def get_unique_feed_urls(feed_url_groups, get_twitter_handles=False):
    """Takes a dict { group_name => [feeds...], ...} and returns a list of unique feeds
    
    :param get_twitter_handles: true => return urls starting with @, false => return not starting with @
    """
    feed_urls = []

    for g in feed_url_groups:
        urls = feed_url_groups[g]['feeds']
        for url in urls:
            if url not in feed_urls:
                wanted = get_twitter_handles == url.startswith('@')
                if wanted:
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

def get_most_recent_tweet_id(feeds):
    """Search a list of sorted feeds. Return the ID of the most recent tweet."""
    tweet_id = None

    for feed in feeds:
        if is_twitter_handle(feed['source']):
            tweet_id = feed['link'].split('/')[-1:][0]
            break

    return tweet_id

async def get_twitter_feed_async(handles, feed_data=[], feed_info={}, since_id=None):
    """Read a twitter feeds asynchronously. Store the data in feed_data.
    
    Handles must be in format ['@ben_razor', '@solana', ...].

    Can deal with up to 10 handles at a time due to restrictions on the
    twitter API.
    """
    handles = handles[:10] 
    endpoint_URL = 'https://api.twitter.com/2/tweets/search/recent'
    token = os.environ.get('TWITTER_BEARER_TOKEN')
    
    headers = {
        "User-Agent": "v2RecentSearchJS",
        "authorization": f'Bearer {token}'
    }

    query = ' OR '.join(map(lambda x: 'from:' + x[1:], handles))

    params = { 
        'query': f'({query})',
        'tweet.fields': 'id,text,created_at', 
        'user.fields': 'id',
        'expansions': 'author_id',
        'max_results': 100
    }

    if since_id:
        params['since_id'] = since_id

    query = urlencode(params)
    url = endpoint_URL + '?' + query

    image = {'href': ''}
    for handle in handles:
        feed_info[handle] = {
            "title": handle,
            "desc": handle,
            "image": image,
            "ttl": 86400,
            "lastUpdate": 'Sun, 01 Jan 2020 12:00:00 GMT'
        }

    result_json = await fetch(url, headers)
    d = json.loads(result_json)

    if 'data' in d:
        tweets = d['data']
        users = d['includes']['users']
        users_dict = {}
        for user in users:
            users_dict[user['id']] = user
        for entry in tweets:
            author_id = entry['author_id']
            source = '@' + users_dict[author_id]['username']
            link = f'https://twitter.com/ben_razor/status/{entry["id"]}'
            title = summary = html.unescape(entry.get('text'))
            date_str = add_timezone_field(iso_date_to_rss(entry['created_at']))

            feed_data.append({
                'title': title, 'source': source, 'image': image,'summary': summary, 'link': link,
                'date': date_str, 'source_url': source 
            })

    return feed_data

async def get_feed_async(feed, feed_data=[], feed_info={}):
    """Read a single rss feed asynchronously. Store the data in feed_data"""
    feed_xml = await fetch(feed)
    d = feedparser.parse(feed_xml)
    feed_details = d['feed']
    source = feed_details.get('title', '')
    desc = feed_details.get('desc', '')
    image = feed_details.get('image', {'href': ''})
    ttl = feed_details.get('ttl', 86400)
    lastUpdate = feed_details.get('lastBuildDate', 'Sun, 01 Jan 2020 12:00:00 GMT')

    feed_info[feed] = {
        "title": source,
        "desc": desc,
        "image": image,
        "ttl": ttl,
        "lastUpdate": lastUpdate
    }

    for entry in d['entries']: 
        title = entry['title']
        summary = entry.get('summary')
        date_str = add_timezone_field(entry['published'])

        feed_data.append({
            'title': title, 'source': source, 'image': image,'summary': summary, 'link': entry['link'],
            'date': date_str, 'source_url': feed
        })

    return feed_data

def create_handle_request_groups(twitter_handles, max_handles_per_req=10):
    """Takes an array of twitter handles. Returns an array of arrays of twitter handles of
    length that can be handled in a single twitter api request.
    """
    num_handles = len(twitter_handles)
    handle_groups = [
        twitter_handles[i:i+max_handles_per_req] for i in range(0, num_handles, max_handles_per_req)
    ]
    return handle_groups

def get_feeds_async(loop, feed_url_groups):
    """Read a number of feeds asynchronously and then sort them by date"""
    feed_data = []
    feed_info = {}
    feed_urls = get_unique_feed_urls(feed_url_groups) 

    tasks = [get_feed_async(feed, feed_data, feed_info) for feed in feed_urls]
    loop.run_until_complete(asyncio.wait(tasks, return_when=asyncio.ALL_COMPLETED))

    feed_data.sort(key = lambda f: datetime.strptime(f['date'], rss_date_format), reverse=True)
    return feed_data, feed_info

def get_twitter_feeds_async(loop, feed_url_groups):
    """Takes a feed groups object where some entries will be twitter handles.
    
    Gets tweets more recent than the most recently stored tweet.
    """
    feed_info = {}
    feed_data = get_stored_feeds(loop)
    feed_data = list(filter(lambda x: is_twitter_handle(x['source']), feed_data))
    since_id = get_most_recent_tweet_id(feed_data)

    twitter_handles = get_unique_feed_urls(feed_url_groups, get_twitter_handles=True)
    handle_groups = create_handle_request_groups(twitter_handles)
    tasks = [get_twitter_feed_async(handles, feed_data, feed_info, since_id) for handles in handle_groups]
    loop.run_until_complete(asyncio.wait(tasks, return_when=asyncio.ALL_COMPLETED))

    feed_data.sort(key = lambda f: datetime.strptime(f['date'], rss_date_format), reverse=True)
    return feed_data, feed_info

def get_all_feeds(loop, feed_url_groups, more_recent_than=48):
    """Gets RSS/Atom feeds, then twitter feeds.
    
    Combines them, removes entries older than a specfied date and sorts by date.
    """
    feed_data, feed_info = get_feeds_async(loop, feed_url_groups)
    t_feed_data, t_feed_info = get_twitter_feeds_async(loop, feed_url_groups)

    feed_data.extend(t_feed_data)
    feed_info.update(t_feed_info)

    feed_data = list(filter(lambda x: rss_date_more_recent_than(x['date'], more_recent_than), feed_data))
    feed_data.sort(key = lambda f: datetime.strptime(f['date'], rss_date_format), reverse=True)

    return feed_data, feed_info

def rss_date_more_recent_than(rss_date_str, hours=1, now=None):
    """Takes an RSS format date string and finds if it is more recent than a given number of hours"""
    now = now or datetime.utcnow()
    d = datetime.strptime(rss_date_str, rss_date_format) 
    d_now = now.replace(tzinfo=timezone.utc)
    d_past = d_now - relativedelta(hours=hours)
    return d > d_past

async def fetch(url, ex_headers={}, timeout=10):
    """Fetch a response from a url asynchronously"""
    with async_timeout.timeout(timeout):
        headers = {
            "Accept": "application/rss+xml, application/rdf+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8", 
            "Content-Type": "application/rss+xml",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36", 
        }
        headers.update(ex_headers)

        async with aiohttp.ClientSession(skip_auto_headers=['User-Agent', 'Accept', 'Content-Type'], headers=headers) as session:
            async with session.get(url) as response:
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

    feed_data.sort(key = lambda f: datetime.strptime(f['date'], rss_date_format), reverse=True)

    return feed_data 

def get_feed_info(loop):
    return get_obj(loop, 'feed-info.json')

def get_stored_feeds(loop):
    return get_obj(loop, 'feed-data.json')

def get_feed_urls(loop, feed_url_group):
    feed_url_groups = get_feed_url_groups(loop)
    feed_urls = []
    if feed_url_group in feed_url_groups:
        feed_urls = feed_url_groups[feed_url_group]['feeds']
    return feed_urls

def is_valid_group_name(group_name):
    group_name = group_name.strip()
    p = re.compile('[a-zA-Z0-9 ]{2,20}')
    valid = bool(p.match(group_name))
    return valid

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

def is_twitter_url(feed_url):
    """Check if url supplied is from twitter..."""
    return 'twitter.com/' in feed_url

def url_to_twitter_handle(feed_url):
    """If a url is supplied in form https://twitter.com/handle/... then
    returns handle in form @handle. Otherwise, return original url"""
    if is_twitter_url(feed_url):
        parts = feed_url.split('/')
        if len(parts) > 3:
            twitter_handle = parts[3]
            feed_url = f'@{twitter_handle}'
    return feed_url

def is_twitter_handle(url):
    """Checks if passed string starts with @"""
    return url.startswith('@')

def add_feed_url(loop, feed_url, feed_url_group='', user=''):
    """Add a feed url and attempt to get and store new feeds.

    Accepts twitter urls in form https://twitter.com/handle/...

    If url is twitter, will parse the handle as @handle and store it like that.

    :param feed_url: An RSS/Atom or twitter url

    Returns:
        A tuple (feed_urls, success, reason)

        feed_urls: updated array of feed_urls
        success: boolean
        reason: ok, no-data-from-feed, url-exists, max-feeds-10, timeout, group-is-locked
    """
    success = True 
    reason = 'ok'

    feed_url_groups = get_feed_url_groups(loop)
    if feed_url_group not in feed_url_groups:
        feed_url_groups[feed_url_group] = {'feeds': []}

    feed_urls = feed_url_groups[feed_url_group]['feeds']

    if is_twitter_url(feed_url):
        feed_url = url_to_twitter_handle(feed_url)

    feed_url_counts = get_feed_url_counts(feed_url_groups)
    feed_already_exists = feed_url_counts.get(feed_url, 0) > 0
    feed_infos = get_feed_info(loop)
    feed_info = {}

    group_is_locked = is_locked_group(feed_url_group)

    if group_is_locked and not is_locker(user):
        success = False
        reason = "group-is-locked"
    elif len(feed_urls) >= 10:
        success = False
        reason = 'max-feeds-10'
    elif feed_url not in feed_urls:
        try:
            if feed_already_exists:
                feed_urls.append(feed_url)
                store_feed_url_groups(feed_url_groups)
            else:
                feeds = get_stored_feeds(loop)

                if is_twitter_handle(feed_url):
                    new_feeds = loop.run_until_complete(asyncio.wait_for(get_twitter_feed_async([feed_url], [], feed_info), timeout=5))
                else:
                    new_feeds = loop.run_until_complete(asyncio.wait_for(get_feed_async(feed_url, [], feed_info), timeout=5))

                if new_feeds and len(new_feeds):
                    feeds.extend(new_feeds)
                    feeds.sort(key = lambda f: datetime.strptime(f['date'], "%a, %d %b %Y %H:%M:%S %z"), reverse=True)
                    feed_urls.append(feed_url)
                    feed_infos.update(feed_info)

                    store_feeds(feeds)
                    store_feed_url_groups(feed_url_groups)
                    store_feed_info(feed_infos)
                else:
                    success = False
                    reason = 'no-data-from-feed'
        except TimeoutError:
            success = False
            reason = 'timeout'
    else:
        success = False
        reason = 'url-exists'

    return feed_urls, feed_infos, success, reason

def delete_feed_url(loop, feed_url, feed_url_group='', user=''):
    """Delete a feed url and remove feeds for that url.

    Returns:
        A tuple (feed_urls, success, reason)

        feed_urls: updated array of feed_urls
        success: boolean
        reason: ok, url-does-not-exist, group-is-locked, url-group-does-not-exist
    """
    success = True
    reason = 'ok'
    feed_urls = []
    feed_url_groups = get_feed_url_groups(loop)
    feed_url_counts = get_feed_url_counts(feed_url_groups)
    feed_still_in_use = feed_url_counts.get(feed_url, 0) > 1
    group_is_locked = is_locked_group(feed_url_group)

    if group_is_locked and not is_locker(user):
        success = False
        reason = "group-is-locked"
    elif feed_url_group not in feed_url_groups:
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

def clone_group(feed_url_groups, from_group, to_group):
    """Get the feed urls associated with one group id and copy them to 
    a new group with a new id."""
    success = True
    reason = 'ok'

    group_info = feed_url_groups.get(from_group)

    if group_info:
        group_info.pop('locked', None)

        feed_url_groups[to_group] = group_info

        store_feed_url_groups(feed_url_groups)
    else:
        success = False
        reason = 'group-to-clone-does-not-exist'
    
    return group_info, success, reason

def store_feed_info(feed_info):
    store_obj(feed_info, 'feed-info.json', is_cached=False)

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
    data = loop.run_until_complete(fetch(url))
    data_obj = {}
    data_obj = json.loads(data)
    return data_obj

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    feed_url_groups = get_feed_url_groups(loop)
    feed_data, feed_info = get_all_feeds(loop, feed_url_groups)
    #feed_data = get_stored_feeds(loop)
    print('after get_feeds ' + str(len(feed_data)))
    print('after get_feeds ', feed_info)
