""" All utils functions """
import urllib

""" Encode an object into a utf-8 string. """
def encode_str(obj):
    if isinstance(obj, basestring):
        return obj.encode("utf-8") if isinstance(obj, unicode) else obj
    return str(obj)

""" Return a encoded string from dict """
def encode_params(**params):
    return '&'.join(['%s=%s' % (key, urllib.quote(encode_str(value)))
              for key, value in params.iteritems()])