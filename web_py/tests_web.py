import requests
import unittest
import json

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

if __name__ == '__main__':
	unittest.main()
