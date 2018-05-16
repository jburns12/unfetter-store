import requests
from modules import download
from titlecase import titlecase

def create_stix_to_attack_dict():
    """Generate a lookup table of STIX ID -> ATT&CK ID."""
    lookup = {}
    endpoints = ['attack-patterns', 'course-of-actions', 'intrusion-sets', 'malwares', 'tools']
    
    for endpoint in endpoints:
        json_blob = download.stix(endpoint)
        for obj in json_blob:
            lookup[obj['attributes']['id']] = obj['attributes']['external_references'][0]['external_id']
    
    return lookup

def create_attack_to_name_dict():
    """Generate a lookup table of ATT&CK ID -> name."""
    lookup = {}
    endpoints = ['attack-patterns', 'course-of-actions', 'intrusion-sets', 'malwares', 'tools']

    for endpoint in endpoints:
        json_blob = download.stix(endpoint)
        for obj in json_blob:
            lookup[obj['attributes']['external_references'][0]['external_id']] = obj['attributes']['name']

    return lookup

def create_tactics_list():
    tactics = []
    json_blob = requests.get('https://attackgui.mitre.org/api/config', verify=False).json()['data']
    for obj in json_blob:
        for config_obj in obj['attributes']['configValue']:
            if type(config_obj) is str:
                pass
            else:
                try:
                    if config_obj['tactic'] not in tactics:
                        tactics.append(titlecase(config_obj['tactic'].replace('-', ' ')))
                except KeyError as ex:
                    pass
    return tactics

def create_domain_to_uuid_dict():
    lookup = {}
    lookup['enterprise-attack'] = '95ecc380-afe9-11e4-9b6c-751b66dd541e'
    lookup['pre-attack'] = '062767bd-02d2-4b72-84ba-56caef0f865'
    lookup['mobile-attack'] = '2f669986-b40b-4423-b720-4396ca6a462b'
    return lookup