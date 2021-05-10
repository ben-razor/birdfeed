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
    'https://dailyhodl.com/altcoins/feed/'
]

def add_timezone_field(date):
    """The RSS standard has timezone in the date, but not all feeds do. This adds it."""
    rss_date_format = "%a, %d %b %Y %H:%M:%S %z"
    date = parser.parse(date)
    date_str = date.strftime(rss_date_format)
    return date_str


feed_data = []
def get_feed(feed):
    global feed_data
    print('get_feed')
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
    print(len(feed_data))
    
async def get_feed_async(feed):
    feed_xml = await fetch(feed)
    d = feedparser.parse(feed_xml)
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

def get_feeds_async(loop):
    tasks = [get_feed_async(feed) for feed in feeds]
    loop.run_until_complete(asyncio.wait(tasks, return_when=asyncio.ALL_COMPLETED))
    feed_data.sort(key = lambda f: datetime.strptime(f['date'], "%a, %d %b %Y %H:%M:%S %z"), reverse=True)
    return feed_data

async def fetch(url, timeout=10):
    with async_timeout.timeout(timeout):
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                html = await response.read()
    return html

def get_feeds():
    """Read in feeds from the sources and sort them by time"""

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
    get_feeds_async(loop)
    print('after get_feeds ' + str(len(feed_data)))
