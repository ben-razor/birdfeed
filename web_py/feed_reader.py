import feedparser
import asyncio, aiohttp, async_timeout
from tabulate import tabulate
from datetime import *
from dateutil import parser
import re

feeds = [
    'https://cointelegraph.com/rss',
    'https://www.newsbtc.com/feed',
    'https://blog.coinbase.com/feed',
    'https://dailyhodl.com/altcoins/feed/',
    'https://news.bitcoin.com/feed/',
    'https://bitcoinmagazine.com/.rss/full/'
]

def add_timezone_field(date):
    """The RSS standard has timezone in the date, but not all feeds do. This adds it."""
    rss_date_format = "%a, %d %b %Y %H:%M:%S %z"
    date = parser.parse(date)
    date_str = date.strftime(rss_date_format)
    return date_str

async def get_feed_async(feed, feed_data):
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
            'date': date_str
        })

def get_feeds_async(loop):
    feed_data = []
    """Read a number of feeds asynchronously and then sort them by date"""
    tasks = [get_feed_async(feed, feed_data) for feed in feeds]
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
    """Read in feeds from the sources and sort them by time"""
    feed_data = []

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

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    feed_data = get_feeds_async(loop)
    print('after get_feeds ' + str(len(feed_data)))
