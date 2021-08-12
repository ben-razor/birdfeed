import os, sys, unittest, json
import asyncio
import feed_reader
from datetime import *

cur_dir = os.path.dirname(sys.argv[0])
loop = asyncio.get_event_loop()

class TestFeedReaderUtils(unittest.TestCase):

	def test_get_feed_url_counts(self):
		feed_url_groups = {
			'UK News': {'feeds': [
				'http://feeds.bbci.co.uk/news/rss.xml',
				'https://theguardian.com/uk/rss'
			]},
			'Crypto': {'feeds': [
				'https://cointelegraph.com/rss',
			]},
			'Mix': {'feeds': [
				'https://theguardian.com/uk/rss',
				'https://cointelegraph.com/rss'
			]}
		}

		feed_url_counts = feed_reader.get_feed_url_counts(feed_url_groups)

		self.assertEqual(feed_url_counts['https://theguardian.com/uk/rss'], 2)
		self.assertEqual(feed_url_counts['https://cointelegraph.com/rss'], 2)
		self.assertEqual(feed_url_counts['http://feeds.bbci.co.uk/news/rss.xml'], 1)

	def test_clone_group(self):
		with open(os.path.join(cur_dir, '../data/feed-url-groups.json')) as f:
			feed_url_groups = json.load(f)['feed_url_groups']
			group_info, success, reason = feed_reader.clone_group(feed_url_groups, 'Crypto', 'Crypto 2')
			self.assertEqual(reason, 'ok')
			self.assertTrue(success)

	def test_pw(self):
		pw = 'greatpassword'
		digest, salt = feed_reader.hash_pw(pw)
		match = feed_reader.password_match(pw, digest, salt)
		self.assertEqual(len(salt), 64)
		self.assertEqual(len(digest), 64)
		self.assertTrue(match)

	def test_get_feed_async(self):
		url = 'https://www.proactiveinvestors.co.uk/companies/rss/'
		feed_data = []
		feed_infos = {}
		feed_data = loop.run_until_complete(feed_reader.get_feed_async(url, feed_data, feed_infos))

		self.assertTrue('title' in feed_infos[url])
		self.assertTrue(len(feed_data) > 0)

	def test_get_unique_feed_urls(self):
		feed_url_groups = feed_reader.get_feed_url_groups(loop)
		feed_urls = feed_reader.get_unique_feed_urls(feed_url_groups) 
		url = 'https://www.proactiveinvestors.co.uk/companies/rss/'
		self.assertTrue(url in feed_urls)
		self.assertTrue(len(set(feed_urls)) == len(feed_urls))

		test_group = {
			'TestGroup1': {'feeds': ['https://a.com', '@solana', '@ben_razor']},
			'TestGroup2': {'feeds': ['@ben_razor']}
		}
		feed_urls = feed_reader.get_unique_feed_urls(test_group, True) 
		self.assertEqual(len(feed_urls), 2)
		self.assertTrue('@solana' in feed_urls)
		self.assertFalse('https://a.com' in feed_urls)

	def test_is_valid_group_name(self):
		is_valid = feed_reader.is_valid_group_name('a')
		self.assertFalse(is_valid)

		is_valid = feed_reader.is_valid_group_name('aA')
		self.assertTrue(is_valid)

		is_valid = feed_reader.is_valid_group_name(' a ')
		self.assertFalse(is_valid)

	def test_twitter_handles(self):
		h = feed_reader.is_twitter_url('https://twitter.com/solana/status/1416174316362735616')
		self.assertTrue(h)

		h = feed_reader.is_twitter_url('https://www.coingecko.com/en')
		self.assertFalse(h)

		h = feed_reader.url_to_twitter_handle('https://twitter.com/solana/status/1416174316362735616')
		self.assertEqual(h, '@solana')

		h = feed_reader.url_to_twitter_handle('https://www.coingecko.com/en')
		self.assertEqual(h, 'https://www.coingecko.com/en')

	def test_get_most_recent_tweet_id(self):
		with open(cur_dir + '/data/feed_data_1.json') as f:
			feed_data = json.load(f)
			id = feed_reader.get_most_recent_tweet_id(feed_data)
			self.assertEqual(id, '1417825690678972416')

		with open(cur_dir + '/data/feed_data_2.json') as f:
			feed_data = json.load(f)
			id = feed_reader.get_most_recent_tweet_id(feed_data)
			self.assertIsNone(id)

	def test_limit_feeds_to_group(self):
		test_group = {
			'TestGroup1': {'feeds': ['https://a.com', '@Solana', '@ben_razor']},
		}

		with open(cur_dir + '/data/feed_data_3.json') as f:
			feed_data = json.load(f)
			feeds = feed_reader.limit_feeds_to_group(loop, feed_data, test_group['TestGroup1']['feeds'])
			self.assertEqual(len(feeds), 1)

	def test_rss_date(self):
		now = datetime(2021, 7, 21, 15)
		r = feed_reader.rss_date_more_recent_than('Wed, 21 Jul 2021 13:16:26 +0000', 24, now=now)
		self.assertTrue(r)

		r = feed_reader.rss_date_more_recent_than('Wed, 19 Jul 2021 13:16:26 +0000', 24, now=now)
		self.assertFalse(r)


		with open(cur_dir + '/data/feed_data_2.json') as f:
			feed_data = json.load(f)
			self.assertEqual(len(feed_data), 3)

			feed_data = list(filter(lambda x: feed_reader.rss_date_more_recent_than(x['date'], 48, now=now), feed_data))
			self.assertEqual(len(feed_data), 2)

if __name__ == '__main__':
	unittest.main()