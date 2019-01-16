import requests
import sys

def stix(endpoint, endpoints):
    """Get STIX data from https://attackgui.mitre.org."""
    res = None
    if endpoint in endpoints:
        try:
            res = requests.get('https://attackgui.mitre.org/api/{0}'
                               .format(endpoint), verify=False)
        except requests.exceptions.RequestException as ex:
            raise RequestException("""Error connecting to
            https://attackgui.mitre.org/api/{0}""".format(endpoint))
    else:
        raise ValueError("""https://attackgui.mitre.org/api/{0} is not
        a valid API endpoint""".format(endpoint))
        sys.exit(1)

    blob = res.json()['data']
    if endpoint != 'identities' and endpoint != 'relationships':
        blob = sorted(blob, key=lambda k: k['attributes']['name'])
    return blob