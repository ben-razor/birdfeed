#!/usr/bin/env python
import feed_reader
import asyncio
import logging
import datetime as dt
from datetime import datetime
import pytz
from bs4 import BeautifulSoup
from flask import Flask, request, url_for, render_template, jsonify
from flask_cors import CORS
import urllib
from tabulate import tabulate
from google.cloud import *

loop = asyncio.get_event_loop()
app = Flask(__name__)
CORS(app)

def process_feeds(feeds):
    """Modify feed data before passing to rendering"""
    prev_source = ''
    prev_date_str = ''
    for feed in feeds:
        summary_raw = feed["summary"]
        soup = BeautifulSoup(summary_raw, "html5lib")
        summary = soup.get_text() # Strip html from summary
 
        date = datetime.strptime(feed["date"], "%a, %d %b %Y %H:%M:%S %z")
        LOCAL_TIMEZONE = datetime.now(dt.timezone.utc).astimezone().tzinfo
        date = date.astimezone(LOCAL_TIMEZONE)
        date_str = date.strftime('%a %d %b')
        time_str = date.strftime("%H:%M")

        if(date_str == prev_date_str):
            date_time_str = ''
        else:
            date_time_str = date.strftime('%a %d %b')

        prev_date_str = date_str

        source = feed["source"]
        if source == prev_source:
            if not date_time_str:
                source = ''
        else:
            prev_source = source
        
        feed['summary'] = summary
        feed['time_str'] = time_str
        feed['date_time_str'] = date_time_str

    return feeds

@app.route('/')
def simple_web_page(): 
    response = ''
    try:
        feeds = feed_reader.get_stored_feeds(loop)
        print('-- feeds --')
        print(feeds)
        print('-- ---- --')
        feeds = process_feeds(feeds)
        response = render_template('feeds.html', feeds=feeds) 
    except Exception as e:
        msg = 'Sorry, feeds cannot be loaded at the moment.'
        details = 'Please try again later.'
        response = render_template('error.html', msg=msg, details=details)
        print(e)
    return response

@app.route('/api/feed')
def feed_json():
    reload = request.args.get('reload')

    if reload:
        feeds = feed_reader.get_feeds_async(loop)
        feed_reader.store_feeds(feeds)
    else:
        feeds = feed_reader.get_stored_feeds(loop)

    response = jsonify(feeds)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/api/feed_urls', methods=['GET', 'POST', 'DELETE'])
def feed_urls():
    """API endpoint for managing list of feed urls.

        Returns json in format: {
            'success': true/false,
            'reason': string,
            'data': [string, string, ...]
        }

        GET reason: ok
        POST reason: ok, no-data-from-feed, url-exists, max-feeds-10, timeout
        DELETE reason: ok, url-does-not-exist
    """
    status = 200
    success = True
    reason = 'ok'
    resp = {}
    if request.method == 'GET':
        feed_url_group = request.args.get('feed_url_group', '')
        resp = feed_reader.get_feed_urls(loop, feed_url_group)
    elif request.method == 'POST':
        logging.debug(request.json)
        body = request.json
        feed_url = body['feed_url']
        feed_url_group = body.get('feed_url_group', '')
        resp, success, reason = feed_reader.add_feed_url(loop, feed_url, feed_url_group)
        
        if success:
            status = 201
        else:
            status = 400

    elif request.method == 'DELETE':
        body = request.json
        feed_url = body['feed_url']
        feed_url_group = body.get('feed_url_group', '')
        resp, success, reason = feed_reader.delete_feed_url(loop, feed_url)
        
        if not success:
            status = 400

    response = jsonify({'success': success, 'reason': reason, 'data': resp})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response, status

if __name__ == '__main__':
    app.run(debug=True)
