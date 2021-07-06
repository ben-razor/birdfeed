import requests
import unittest
import json
import feed_reader
import asyncio

loop = asyncio.get_event_loop()

class TestFeedReaderWeb(unittest.TestCase):

	def test_groups(self):
		url = 'http://localhost:3001/api/feed_groups'
		myobj = {
			'feed_url_group': 'Crypto',
			'new_group_name': 'Crypto 3'
		}

		r = requests.post(url, json = myobj)
		print('HELLO', r.text)
		resp = r.json()

		self.assertEqual(resp['reason'], 'ok')
		self.assertTrue(resp['success'])

		url = 'http://localhost:3001/api/feed_groups?feed_url_group=The Menagerie'
		r = requests.get(url)
		resp = r.json()

		self.assertEqual(resp['data']['locked'], True)

		url = 'http://localhost:3001/api/feed_groups?feed_url_group=Test7382054'
		r = requests.get(url)
		resp = r.json()

		self.assertEqual(resp['data']['locked'], False)

		url = 'http://localhost:3001/api/feed_groups?get_selected_groups=1'
		r = requests.get(url)
		resp = r.json()

		self.assertTrue('UK News' in resp['data'].keys())

	def test_feeds(self):
		url = 'http://localhost:3001/api/feed_urls'
		myobj = {
			'feed_url': 'http://feeds.bbci.co.uk/news/rss.xml?edition=uk',
			'feed_url_group': 'Test 12345',
		}

		r = requests.post(url, json = myobj)
		resp = r.json()

		self.assertEqual(resp['reason'], 'ok')
		self.assertTrue(resp['success'])

		myobj = {
			'feed_url': 'http://feeds.bbci.co.uk/news/rss.xml?edition=uk',
			'feed_url_group': 'World News',
		}

		r = requests.post(url, json = myobj)
		resp = r.json()

		self.assertEqual(resp['reason'], 'group-is-locked')
		self.assertFalse(resp['success'])

		myobj = {
			'feed_url': 'http://feeds.bbci.co.uk/news/rss.xml?edition=uk',
			'feed_url_group': 'World News',
		}

		r = requests.delete(url, json = myobj)
		resp = r.json()

		self.assertEqual(resp['reason'], 'group-is-locked')
		self.assertFalse(resp['success'])

	def test_rss(self):
		feed_data = []
		feed_info = {}
		test_url = 'https://www.theregister.com/headlines.rss'
		future = feed_reader.get_feed_async(test_url, feed_data, feed_info)
		feed_data = loop.run_until_complete(future)
		self.assertGreater(len(feed_data), 0)
		self.assertTrue(test_url in feed_info)
		self.assertTrue('title' in feed_info[test_url])

if __name__ == '__main__':
	unittest.main()
