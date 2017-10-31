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
                console.log(deletedRelationship);
                // Confirm we have two IDs to query for
                if (sourceId && targetId) {
                    stixSchemaless.find({$or: [{_id: sourceId}, {_id: targetId}]}, (err, results) => {
                        if (results.length === 2) {
                            stixSchemaless.findById({ _id: sourceId }, (err, result) => {
                                const resultObj = result.toObject();
                                const metaProperty = {};
                                metaProperty.deleted = new Date();
                                metaProperty.created = deletedRelationship.stix.created;
                                metaProperty.ref = deletedRelationship.stix.target_ref;
                                if (resultObj.metaProperties !== undefined && resultObj.metaProperties.mitreId !== undefined) {
                                    metaProperty.id = resultObj.metaProperties.mitreId;
                                }

                                if(resultObj.metaProperties === undefined){
                                    resultObj.metaProperties = {};
                                }
                                if(resultObj.metaProperties['deletedRelationships'] === undefined) {
                                    resultObj.metaProperties['deletedRelationships'] = [];
                                }
                                resultObj.metaProperties['deletedRelationships'].push(metaProperty);

                                stixSchemaless.findOneAndUpdate({ _id: sourceId }, resultObj, { new: true }, (errUpdate, resultUpdate) => {
                                  console.log(resultUpdate);
                                });
                            });
                            stixSchemaless.findById({ _id: targetId }, (err, result) => {
                                const resultObj = result.toObject();
                                const metaProperty = {};
                                metaProperty.deleted = new Date();
                                metaProperty.created = deletedRelationship.stix.created;
                                metaProperty.ref = deletedRelationship.stix.source_ref;
                                if (resultObj.metaProperties !== undefined && resultObj.metaProperties.mitreId !== undefined) {
                                    metaProperty.id = resultObj.metaProperties.mitreId;
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
