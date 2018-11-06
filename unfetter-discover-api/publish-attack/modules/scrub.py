import re
from modules import download, lookup

def append_custom_fields(json_blob):
    """Append x_mitre custom fields to Description."""
    for obj in json_blob:
        if 'x_mitre_collections' in obj['attributes']:
            del obj['attributes']['x_mitre_collections']

    return json_blob

def filter_identity(json_blob):
    for obj in json_blob:
        if 'sectors' in obj['attributes']:
            del obj['attributes']['sectors']
        if 'x_mitre_collections' in obj['attributes']:
            del obj['attributes']['x_mitre_collections']

    return json_blob

def filter_by_id(json_blob, lookup):
    """Copy objects with valid source_name properties into a new JSON blob."""
    valid_sources = ['mitre-attack', 'mitre-pre-attack', 'mitre-mobile-attack']
    output = []
    for obj in json_blob:
        if obj['type'] != 'relationship':
            try:
                for ext_ref in obj['attributes']['external_references']:
                    if ext_ref['source_name'] in valid_sources and ext_ref['external_id']:
                        output.append(obj)
            except KeyError as ex:
                pass 
        else:
            if (obj['attributes']['source_ref'] in lookup and obj['attributes']['target_ref'] in lookup):
                output.append(obj)
   
    return output

def remove_empty_fields(json_blob):
    """Remove dictionary keys with values of "" or []."""
    for obj in json_blob:
        high_level_keys_to_delete = []
        for key, value in obj['attributes'].items():
            if key == 'external_references':
                if len(value) == 0:
                    high_level_keys_to_delete.append(key)
                for i in range(len(value)):
                    keys_to_delete = []
                    for ext_k, ext_v in obj['attributes'][key][i].items():
                        if type(ext_v) is not list:
                            if ext_v == '':
                                keys_to_delete.append(ext_k)
                        else:
                            if len(ext_v) == 0:
                                keys_to_delete.append(ext_k)
                    for key_to_delete in keys_to_delete:
                        del obj['attributes'][key][i][key_to_delete]
            # Loop through internal dictionaries.
            elif type(value) is dict:
                keys_to_delete = []
                for k, v in value.items():
                    if type(v) is not list:
                        if v == '':
                            keys_to_delete.append(k)
                    else:
                        if len(v) == 0:
                            keys_to_delete.append(k)
                for key_to_delete in keys_to_delete:
                    del obj['attributes'][key][key_to_delete]
            elif type(value) is list:
                if len(value) == 0:
                    high_level_keys_to_delete.append(key)
            else:
                if value == '':
                    high_level_keys_to_delete.append(key)
        for key_to_delete in high_level_keys_to_delete:
            del obj['attributes'][key_to_delete]
                
    return json_blob

def transform_text(json_blob, attack_to_md_lookup):
    """Convert [[Citation: foo]] to (Citation: foo), [[Tactic]] to Tactic and {{LinkById|x}} to ID name."""
    tactics = lookup.create_tactics_list()

    for obj in json_blob:
        if obj['type'] == 'relationship' and 'description' in obj['attributes']:
            obj['attributes']['description'] = re.sub(' \[\[(Citation:.*?)\]\]', '', obj['attributes']['description'], flags=re.MULTILINE)
            obj['attributes']['description'] = re.sub('\[\[(Citation:.*?)\]\]', '', obj['attributes']['description'], flags=re.MULTILINE)
        else:
            if 'description' in obj['attributes']:
                obj['attributes']['description'] = re.sub('\[\[(Citation:.*?)\]\]', r'(\1)', obj['attributes']['description'], flags=re.MULTILINE)
            if 'x_mitre_detection' in obj['attributes']:
                obj['attributes']['x_mitre_detection'] = re.sub('\[\[(Citation:.*?)\]\]', r'(\1)', obj['attributes']['x_mitre_detection'], flags=re.MULTILINE)
        for tactic in tactics:
            if 'description' in obj['attributes']:
                obj['attributes']['description'] = re.sub('\[\[('+ tactic + ')\]\]', r'\1', obj['attributes']['description'], flags=re.IGNORECASE)
            if 'x_mitre_detection' in obj['attributes']:
                obj['attributes']['x_mitre_detection'] = re.sub('\[\[('+ tactic + ')\]\]', r'\1', obj['attributes']['x_mitre_detection'], flags=re.IGNORECASE)
        if 'description' in obj['attributes']:
            attack_ids = re.findall('\{\{LinkById\|(.*?)\}\}', obj['attributes']['description'])
            for attack_id in attack_ids:
                obj['attributes']['description'] = obj['attributes']['description'].replace('{{LinkById|' + attack_id + '}}', attack_to_md_lookup[attack_id])
        if 'x_mitre_detection' in obj['attributes']:
            attack_ids_detection = re.findall('\{\{LinkById\|(.*?)\}\}', obj['attributes']['x_mitre_detection'])
            for attack_id_detection in attack_ids_detection:
                obj['attributes']['x_mitre_detection'] = obj['attributes']['x_mitre_detection'].replace('{{LinkById|' + attack_id_detection + '}}', attack_to_md_lookup[attack_id_detection])
        if 'external_references' in obj['attributes']:
            for idx, val in enumerate(obj['attributes']['external_references']):
                if 'description' in obj['attributes']['external_references'][idx]:
                    obj['attributes']['external_references'][idx]['description'] = re.sub('\[\[(Citation:.*?)\]\]', r'(\1)', obj['attributes']['external_references'][idx]['description'], flags=re.MULTILINE)


    return json_blob 