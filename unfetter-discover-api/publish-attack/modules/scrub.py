import re
from modules import download, lookup

def append_custom_fields(json_blob):
    """Append x_mitre custom fields to Description."""
    try:
        for obj in json_blob:
            if (obj['attributes']['description']):
                attributes = ['x_mitre_detection', 'x_mitre_platforms',
                 'x_mitre_data_sources', 'x_mitre_effective_permissions',
                'x_mitre_defense_bypassed', 'x_mitre_permissions_required',
                'x_mitre_system_requirements', 'x_mitre_remote_support',
                'x_mitre_network_requirements', 'x_mitre_contributors',
                'x_mitre_aliases', 'x_mitre_collections']

                description = ''
                for attribute in attributes:
                    try:
                        if (obj['attributes'][attribute]):
                            if (attribute == 'x_mitre_detection'):
                                description += '\n\nDetection: {0}'.format(obj['attributes'][attribute])
                                del obj['attributes'][attribute]
                            elif (attribute == 'x_mitre_platforms'):
                                description += '\n\nPlatforms: '
                                for platform in obj['attributes'][attribute]:
                                    description += platform + ', '
                                description = description[0:-2]
                            elif (attribute == 'x_mitre_data_sources'):
                                description += '\n\nData Sources: '
                                for data_source in obj['attributes'][attribute]:
                                    description += data_source + ', '
                                description = description[0:-2]
                            elif (attribute == 'x_mitre_effective_permissions'):
                                description += '\n\nEffective Permissions: '
                                for effective_permission in obj['attributes'][attribute]:
                                    description += effective_permission + ', '
                                description = description[0:-2]
                            elif (attribute == 'x_mitre_defense_bypassed'):
                                description += '\n\nDefense Bypassed: '
                                for defense_bypassed in obj['attributes'][attribute]:
                                    description += defense_bypassed + ', '
                                description = description[0:-2]
                            elif (attribute == 'x_mitre_permissions_required'):
                                description += '\n\nPermissions Required: '
                                for permissions_required in obj['attributes'][attribute]:
                                    description += permissions_required + ', '
                                description = description[0:-2]
                            elif (attribute == 'x_mitre_system_requirements'):
                                description += '\n\nSystem Requirements: '
                                for system_requirement in obj['attributes'][attribute]:
                                    description += system_requirement + ', '
                                description = description[0:-2]
                            elif (attribute == 'x_mitre_remote_support'):
                                description += '\n\nRemote Support: {0}'.format(obj['attributes'][attribute])
                            elif (attribute == 'x_mitre_network_requirements'):
                                description += '\n\nNetwork Requirements: {0}'.format(obj['attributes'][attribute])
                            elif (attribute == 'x_mitre_contributors'):
                                description += '\n\nMITRE Contributors: '
                                for mitre_contributor in obj['attributes'][attribute]:
                                    description += mitre_contributor + ', '
                                description = description[0:-2]
                            elif (attribute == 'x_mitre_aliases'):
                                description += '\n\nAliases: '
                                for alias in obj['attributes'][attribute]:
                                    description += alias + ', '
                                description = description[0:-2]
                            elif (attribute == 'x_mitre_collections'):
                                del obj['attributes'][attribute]
                    except KeyError as ex:
                        pass 

            obj['attributes']['description'] += description
    except KeyError as ex:
        pass

    return json_blob

def filter_by_id(json_blob, lookup):
    """Copy objects with valid source_name properties into a new JSON blob."""
    valid_sources = ['mitre-attack']
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
        for key, value in obj.items():
            if value:
                # Loop through internal dictionaries.
                if type(value) is dict:
                    for k, v in list(value.items()):
                        if not v:
                            del obj[key][k]
            else:
                del obj[key]
                
    return json_blob

def transform_text(json_blob, attack_to_name_lookup):
    """Convert [[Citation: foo]] to (Citation: foo), [[Tactic]] to Tactic and {{LinkById|x}} to ID name."""
    tactics = lookup.create_tactics_list()

    for obj in json_blob:
        try:
            obj['attributes']['description'] = re.sub('\[\[(Citation:.*?)\]\]', r'(\1)', obj['attributes']['description'], flags=re.MULTILINE)
            for tactic in tactics:
                obj['attributes']['description'] = re.sub('\[\[('+ tactic + ')\]\]', r'\1', obj['attributes']['description'])
            #print(obj['attributes']['description'])
            attack_ids = re.findall('\{\{LinkById\|(.*?)\}\}', obj['attributes']['description'])
            for attack_id in attack_ids:
                obj['attributes']['description'] = obj['attributes']['description'].replace('{{LinkById|' + attack_id + '}}', attack_to_name_lookup[attack_id])
        except KeyError as ex:
            pass

    return json_blob 