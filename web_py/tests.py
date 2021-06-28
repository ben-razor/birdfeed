import feed_reader
import unittest

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


if __name__ == '__main__':
	unittest.main()