import feed_reader
import unittest
import json

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
		f = open('../data/feed-url-groups.json')
		feed_url_groups = json.load(f)['feed_url_groups']
		group_info, success, reason = feed_reader.clone_group(feed_url_groups, 'Crypto', 'Crypto 2')
		self.assertEqual(reason, 'ok')
		self.assertTrue(success)

if __name__ == '__main__':
	unittest.main()