import os
import requests
import unittest
import json
import feed_reader
import asyncio
import yaml

loop = asyncio.get_event_loop()
dir_path = os.path.dirname(os.path.realpath(__file__))
os.chdir(dir_path)

class TestFeedReaderWeb(unittest.TestCase):

	def test_groups(self):
		url = 'http://localhost:3001/api/feed_groups'
		myobj = {
			'feed_url_group': 'Crypto',
			'new_group_name': 'Crypto 3'
		}

		r = requests.post(url, json = myobj)
		resp = r.json()

		self.assertEqual(resp['reason'], 'ok')
		self.assertTrue(resp['success'])

		url = 'http://localhost:3001/api/feed_groups'
		myobj = {
			'feed_url_group': 'Crypto',
			'new_group_name': 'C'
		}

		r = requests.post(url, json = myobj)
		resp = r.json()

		self.assertEqual(resp['reason'], 'group-name-is-invalid')
		self.assertFalse(resp['success'])

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

class TestTwitter(unittest.TestCase):
	def test_tweets(self):
		with open(os.path.join(dir_path, "env_variables.yaml"), 'r') as stream:
			try:
				data = yaml.safe_load(stream)
				bearer_token = data['env_variables']['TWITTER_BEARER_TOKEN']
				os.environ['TWITTER_BEARER_TOKEN'] = bearer_token
			except yaml.YAMLError as exc:
				print(exc)

		feed_data = []
		feed_info = {}
		future = feed_reader.get_tweets_async('@elonmusk', feed_data, feed_info)
		feeds = loop.run_until_complete(future)

		self.assertTrue(len(feeds) > 0)
		self.assertTrue('title' in feeds[0])

		with open('data/tweets_em.json', 'w') as f:
			f.write(json.dumps({"data": feeds}))

if __name__ == '__main__':
	unittest.main(TestTwitter())
