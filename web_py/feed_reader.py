import feedparser
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
    data = get_feeds()
    print(len(data))
