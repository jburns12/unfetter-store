const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    name: {
        type: String,
        required: [true, 'name is required']
    },
    description: {
        type: String
    },
    aliases: [String],
    type: {
        type: String,
        enum: ['intrusion-set']
    }
};

const IntrusionSet = mongoose.model('IntrusionSet', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = IntrusionSet;
