const mongoose = require('mongoose');
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
  tactic_refs: [String],
  type: {
    type: String,
    enum: ['x-mitre-matrix'],
    default: 'x-mitre-matrix'
  }
};

const XMitreMatrix = mongoose.model('XMitreMatrix', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = XMitreMatrix;