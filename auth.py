import requests

CLIENT_ID = ""
CLIENT_SECRET = ""

SCOPE = "https://gosh-fhir-synth.azurehealthcareapis.com/.default"
 
payload = "grant_type=client_credentials&client_id={}&client_secret={}&scope={}".format(CLIENT_ID, CLIENT_SECRET, SCOPE)
url = "https://login.microsoftonline.com/ca254449-06ec-4e1d-a3c9-f8b84e2afe3f/oauth2/v2.0/token"
headers = { 'content-type': "application/x-www-form-urlencoded" }
print(url)
res = requests.post(url, payload, headers=headers)
if res.status_code == 200:
   access_token = res.json().get('access_token', None)
   print(access_token);
else:
    print("Fail")
