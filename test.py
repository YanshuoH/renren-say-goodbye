from lib.APIClient import APIClient

apiClient = APIClient(client_id='ce4eda46cdc144cb85e747654cc5cd25',
                      app_secret='b97cfad9ef8c4403b04ff23b82d5e1fe',
                      redirect_uri='')

print apiClient.get_request_url()