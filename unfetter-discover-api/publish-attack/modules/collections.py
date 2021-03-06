def set_collections(stix_objects, domain_ids, domain_to_uuid_lookup):
    valid_sources = ['attack-patterns', 'course-of-actions', 'intrusion-sets', 'malwares', 'tools']
    valid_targets = ['malwares', 'tools']
    for rel in stix_objects['relationships']:
        if rel['attributes']['relationship_type'] != 'revoked-by':
            target_id = rel['attributes']['target_ref']
            target_obj = next((y for y in stix_objects['attack-patterns'] if y['id'] == target_id), None)
            source_id = rel['attributes']['source_ref']
            for source in valid_sources:
                source_obj = next((z for z in stix_objects[source] if z['id'] == source_id), None)
                if source_obj is not None:
                    break
            if target_obj is not None:
                for collection in target_obj['attributes']['x_mitre_collections']:
                    domain_ids[domain_to_uuid_lookup[collection]].append(rel['id'])
                    if source_obj is not None and source_obj['attributes']['type'] != 'attack-pattern':
                        domain_ids[domain_to_uuid_lookup[collection]].append(source_obj['id'])
    for rel in stix_objects['relationships']:
        if rel['attributes']['relationship_type'] != 'revoked-by':
            source_id = rel['attributes']['source_ref']
            source_obj = next((y for y in stix_objects['intrusion-sets'] if y['id'] == source_id), None)
            target_id = rel['attributes']['target_ref']
            for source in valid_targets:
                target_obj = next((z for z in stix_objects[source] if z['id'] == target_id), None)
                if target_obj is not None:
                    break
            if source_obj is not None and target_obj is not None:
                for collection in target_obj['attributes']['x_mitre_collections']:
                    domain_ids[domain_to_uuid_lookup[collection]].append(rel['id'])
                    if source_obj['attributes']['type'] != 'attack-pattern':
                        domain_ids[domain_to_uuid_lookup[collection]].append(source_obj['id'])

    for rel in stix_objects['relationships']:
        if rel['attributes']['relationship_type'] == 'revoked-by':
            source_id = rel['attributes']['source_ref']
            for source in valid_sources:
                source_obj = next((y for y in stix_objects[source] if y['id'] == source_id), None)
                if source_obj is not None:
                    break
            target_id = rel['attributes']['target_ref']
            for target in valid_sources:
                target_obj = next((z for z in stix_objects[target] if z['id'] == target_id), None)
                if target_obj is not None:
                    break
            if source_obj is not None and target_obj is not None:
                for collection in target_obj['attributes']['x_mitre_collections']:
                    domain_ids[domain_to_uuid_lookup[collection]].append(rel['id'])
                    domain_ids[domain_to_uuid_lookup[collection]].append(source_obj['id'])
    
    for technique in stix_objects['attack-patterns']:
        for collection in technique['attributes']['x_mitre_collections']:
            domain_ids[domain_to_uuid_lookup[collection]].append(technique['id'])
    
    for identity in stix_objects['identities']:
        for domain in domain_to_uuid_lookup:
            domain_ids[domain_to_uuid_lookup[domain]].append(identity['id'])

    for matrix in stix_objects['x-mitre-matrices']:
        for ref in matrix['attributes']['external_references']:
            if ref['source_name'] == 'mitre-attack':
                domain_ids[ref['external_id']].append(matrix['id'])
                for tactic in matrix['attributes']['tactic_refs']:
                    domain_ids[ref['external_id']].append(tactic)

    return domain_ids