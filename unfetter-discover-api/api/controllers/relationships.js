const mongoose = require('mongoose');
const lodash = require('lodash');

const relationshipModel = require('../models/relationship');
const stixSchemaless = require('../models/schemaless');
const BaseController = require('./shared/basecontroller');

const apiRoot = 'https://localhost/api';

const controller = new BaseController('relationship');

module.exports = {
    get: controller.get(),
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteByIdCb((req, res, id) => {

        relationshipModel.findByIdAndRemove(id, (err, result) => {
            if (err) {
                res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            } else if (!result) {
                return res.status(404).json({ message: `Unable to delete the item.  No item found with id ${id}` });
            } else {
                const deletedRelationship = result.toObject();
                const sourceId = deletedRelationship.stix.source_ref;
                const targetId = deletedRelationship.stix.target_ref;
                // Confirm we have two IDs to query for
                if (sourceId && targetId) {
                    stixSchemaless.find({$or: [{_id: sourceId}, {_id: targetId}]}, (err, results) => {
                        if (results.length === 2) {
                            stixSchemaless.findById({ _id: targetId }, (err, origResult) => {
                                if (origResult !== undefined) {
                                    let origResultObj = origResult.toObject();
                                    stixSchemaless.findById({ _id: sourceId }, (err, result) => {
                                        if (result !== undefined) {
                                            const resultObj = result.toObject();
                                            const metaProperty = {};
                                            metaProperty.deleted = new Date();
                                            metaProperty.created = deletedRelationship.stix.created;
                                            metaProperty.ref = deletedRelationship.stix.target_ref;
                                            metaProperty.id = deletedRelationship.stix.id;
                                            metaProperty.name = origResultObj.stix.name
                                            if (origResultObj.stix.external_references !== undefined) {
                                                for (let i = 0; i < origResultObj.stix.external_references.length; i++) {
                                                    if (origResultObj.stix.external_references[i].external_id !== undefined) {
                                                        metaProperty.name = origResultObj.stix.external_references[i].external_id;
                                                    }
                                                }
                                            }

                                            if (resultObj.metaProperties !== undefined && resultObj.metaProperties.mitreId !== undefined) {
                                                metaProperty.created_id = resultObj.metaProperties.mitreId;
                                            }
                                            if (req.user !== undefined && req.user.identity !== undefined && req.user.identity.id !== undefined, req.user.identity.name !== undefined) {
                                            metaProperty.deleted_id = {'id': req.user.identity.id, 'name': req.user.identity.name};
                                            }
                                            if(resultObj.metaProperties === undefined){
                                                resultObj.metaProperties = {};
                                            }
                                            if(resultObj.metaProperties['deletedRelationships'] === undefined) {
                                                resultObj.metaProperties['deletedRelationships'] = [];
                                            }
                                            resultObj.metaProperties['deletedRelationships'].push(metaProperty);

                                            stixSchemaless.findOneAndUpdate({ _id: sourceId }, resultObj, { new: true }, (errUpdate, resultUpdate) => {
                                            });
                                        }
                                    });
                                }
                            });
                            stixSchemaless.findById({ _id: sourceId}, (err, origResult) => {
                                let origResultObj = origResult.toObject();
                                if (origResult !== undefined) {
                                    stixSchemaless.findById({ _id: targetId }, (err, result) => {
                                        if (result !== undefined) {
                                            const resultObj = result.toObject();
                                            const metaProperty = {};
                                            metaProperty.deleted = new Date();
                                            metaProperty.created = deletedRelationship.stix.created;
                                            metaProperty.ref = deletedRelationship.stix.source_ref;
                                            metaProperty.id = deletedRelationship.stix.id;
                                            metaProperty.name = origResultObj.stix.name;
                                            if (origResultObj.stix.external_references !== undefined) {
                                                for (let i = 0; i < origResultObj.stix.external_references.length; i++) {
                                                    if (origResultObj.stix.external_references[i].external_id !== undefined) {
                                                        metaProperty.name = origResultObj.stix.external_references[i].external_id;
                                                    }
                                                }
                                            }
                                            if (resultObj.metaProperties !== undefined && resultObj.metaProperties.mitreId !== undefined) {
                                                metaProperty.created_id = resultObj.metaProperties.mitreId;
                                            }
                                            if (req.user !== undefined && req.user.identity !== undefined && req.user.identity.id !== undefined, req.user.identity.name !== undefined) {
                                            metaProperty.deleted_id = {'id': req.user.identity.id, 'name': req.user.identity.name};
                                            }
                                            if(resultObj.metaProperties === undefined){
                                                resultObj.metaProperties = {};
                                            }
                                            if(resultObj.metaProperties['deletedRelationships'] === undefined) {
                                                resultObj.metaProperties['deletedRelationships'] = [];
                                            }
                                            resultObj.metaProperties['deletedRelationships'].push(metaProperty);
                                            stixSchemaless.findOneAndUpdate({ _id: targetId }, resultObj, { new: true }, (errUpdate, resultUpdate) => {
                                            });
                                        }
                                    });
                                }
                            });
                            return res.status(200).json({ data: { type: 'Success', message: `Deleted id ${id}` } });
                        } else {
                            return res.status(200).json({ data: { type: 'Success', message: `Deleted id ${id}` } });
                        }
                    });
                } else {
                    return res.status(200).json({ data: { type: 'Success', message: `Deleted id ${id}` } });
                }
            }
        });
    })
};
