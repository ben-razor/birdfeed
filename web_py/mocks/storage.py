class Blob():
	def __init__(self):
		self.cache_control = ''
	def upload_from_string(self, data):
		pass
	def make_public(self):
		pass

class Bucket():
	def get_blob(self, file_name):
		return Blob()

class Client():
	def bucket(self, bucket_url):
		return Bucket()
