import utils

class APIClient:
    """ API client class, OAuth connect """
    #Oauth URI
    OAUTH_URI = 'https://graph.renren.com/oauth/'

    ## initial OAuth request params
    def __init__(self, client_id, app_secret, redirect_uri,
                 response_type = 'code', version = 2):
        self.client_id = client_id
        self.app_secret = app_secret
        self.redirect_uri = redirect_uri
        self.response_type = response_type
        self.access_token = None
        self.version = version

    def get_request_url(self):
        print self.client_id
        params = dict(
            client_id=self.client_id,
            redirect_uri=self.redirect_uri,
            response_type=self.response_type
        )
        
        return '%s%s?%s' % (APIClient.OAUTH_URI, 'authorize', utils.encode_params(**params))