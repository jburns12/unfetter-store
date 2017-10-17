const mongoose = require('mongoose');
const BaseSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

const StixSchema = {
    id: String,
    labels: [String],
    name: {
        type: String,
        required: [true, 'name is required']
    },
    description: {
        type: String
    },
    type: {
        type: String,
        enum: ['tool'],
        default: 'tool'
    },
};

const Tool = mongoose.model('Tool', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = Tool;
