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
  x_mitre_shortname: String,
  type: {
    type: String,
    enum: ['x-mitre-tactic'],
    default: 'x-mitre-tactic'
  }
};

const XMitreTactic = mongoose.model('XMitreTactic', stixCommons['makeSchema'](StixSchema), 'stix');

module.exports = XMitreTactic;