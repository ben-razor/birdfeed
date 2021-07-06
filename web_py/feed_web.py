#!/usr/bin/env python3
import os, logging
import feed_reader
import asyncio
import datetime as dt
from datetime import datetime
import pytz
from bs4 import BeautifulSoup
from flask import Flask, request, url_for, render_template, jsonify
from flask_httpauth import HTTPBasicAuth
from flask_cors import CORS
import urllib
from tabulate import tabulate

loop = asyncio.get_event_loop()
app = Flask(__name__)
CORS(app)
auth = HTTPBasicAuth()

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

        feed_url_group = request.args.get('feed_url_group', '')
        if feed_url_group is not None:
            feeds = feed_reader.limit_feeds_to_group(loop, feeds, feed_url_group)

        print('-- feeds --')
        print(feeds)
        print('-- ---- --')
        feeds = process_feeds(feeds)
        response = render_template('feeds.html', feeds=feeds) 
    except Exception as e:
        msg = 'Sorry, feeds cannot be loaded at the moment.'
        details = 'Please try again later.'
        response = render_template('error.html', msg=msg, details=details)
    return response

@app.route('/api/feed')
def feed_json():
    reload = request.args.get('reload')
    feed_url_group = request.args.get('feed_url_group', '')

    if reload:
        feeds, feed_info = feed_reader.get_feeds_async(loop)
        feed_reader.store_feeds(feeds)
        feed_reader.store_feed_info(feed_info)
    else:
        feeds = feed_reader.get_stored_feeds(loop)

    if feed_url_group is not None:
        feeds = feed_reader.limit_feeds_to_group(loop, feeds, feed_url_group)

    response = jsonify(feeds)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/api/feed_groups', methods=['GET', 'POST'])
def feed_groups():
    """API endpoint for managing named groups of feed urls.
    
    GET returns the group info minus the feeds

    POST is used to clone an existing feed url group. It is only possible
    to clone to a group that doesn't already exist.

    params:
        feed_url_group - The group to clone
        new_group_name - The new group name to clone to
    """
    status = 200
    success = True
    reason = 'ok'
    resp = {}

    user = auth.username()

    if request.method == 'GET':
        get_selected_groups = request.args.get('get_selected_groups', False)

        if get_selected_groups:
            feed_url_groups = feed_reader.get_feed_url_groups(loop)
            
            group_info = {}

            for group in feed_reader.selected_groups:
                if group in feed_url_groups:
                    group_info[group] = feed_url_groups[group]
                    if feed_reader.is_locked_group(group) and not feed_reader.is_locker(user):
                        group_info[group]['locked'] = True
                    else:
                        group_info[group]['locked'] = False
        else:
            feed_url_group = request.args.get('feed_url_group', '')
            feed_url_groups = feed_reader.get_feed_url_groups(loop)
            group_info = feed_url_groups.get(feed_url_group)

            if group_info:
                feeds = group_info['feeds']
                feed_info = feed_reader.get_feed_info(loop)
                group_info['feed_info'] = feed_info

                if feed_reader.is_locked_group(feed_url_group) and not feed_reader.is_locker(user):
                    group_info['locked'] = True
                else:
                    group_info['locked'] = False
            else:
                success = False
                status = 400
                reason = 'url-group-does-not-exist'

    elif request.method == 'POST':
        body = request.json

        feed_url_group = body.get('feed_url_group', '')
        feed_url_groups = feed_reader.get_feed_url_groups(loop)
        group_info = feed_url_groups.get(feed_url_group)

        new_group_name = body.get('new_group_name', '')
        new_group_exists = new_group_name in feed_url_groups
        new_group_is_locked = feed_reader.is_locked_group(new_group_name) and not feed_reader.is_locker(user)

        if new_group_exists:
            success = False
            status = 400
            reason = 'new-url-group-already-exists'
        elif new_group_is_locked:
            success = False
            status = 400
            reason = 'new-url-group-is-locked'
        else:
            group_info, success, reason = feed_reader.clone_group(feed_url_groups, 
                                                                       feed_url_group, 
                                                                       new_group_name)

    response = jsonify({'success': success, 'reason': reason, 'data': group_info})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response, status

@app.route('/api/feed_urls', methods=['GET', 'POST', 'DELETE'])
def feed_urls():
    """API endpoint for managing list of feed urls.

        Takes a feed_url_group string to determine which group to add the feed to.

        Returns json in format: {
            'success': true/false,
            'reason': string,
            'data': [string, string, ...]
        }

        GET reason: ok
        POST reason: ok, no-data-from-feed, url-exists, max-feeds-10, timeout, url-group-does-not-exist
        DELETE reason: ok, url-does-not-exist, url-group-does-not-exist
    """
    status = 200
    success = True
    reason = 'ok'
    resp = {}

    user = auth.username()

    if request.method == 'GET':
        feed_url_group = request.args.get('feed_url_group', '')
        resp = feed_reader.get_feed_urls(loop, feed_url_group)
    elif request.method == 'POST':
        body = request.json
        feed_url = body['feed_url']
        feed_url_group = body.get('feed_url_group', '')

        feed, feed_infos, success, reason = feed_reader.add_feed_url(loop, feed_url, feed_url_group, user)

        resp['feeds'] = feed
        resp['feed_info'] = feed_infos

        if success:
            status = 201
        else:
            status = 400

    elif request.method == 'DELETE':
        body = request.json
        feed_url = body['feed_url']
        feed_url_group = body.get('feed_url_group', '')
        resp, success, reason = feed_reader.delete_feed_url(loop, feed_url, feed_url_group, user)
        
        if not success:
            status = 400

    response = jsonify({'success': success, 'reason': reason, 'data': resp})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response, status

if __name__ == '__main__':
    app.run(debug=True)
