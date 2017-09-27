const mongoose = require('mongoose');
const StixSchema = require('./stix-base');
const stixCommons = require('./stix-commons');

const AttackPatternSchema = {
  id: String,
  name: {
    type: String,
    required: [true, 'name is required']
  },
  description: {
    type: String
  },
  kill_chain_phases: [stixCommons['kill_chain_phases']],
  x_mitre_system_requirements: {
    type: String
  },
  x_mitre_platforms: [String],
  x_mitre_contributors: [String],
  x_mitre_data_sources: [String],
  x_mitre_permissions_required: [String],
  x_mitre_effective_permissions: [String],
  x_mitre_detection: {
    type: String
  },
  x_mitre_remote_support: {
    type: Boolean
  },
  x_mitre_defense_bypassed: {
    type: String
  },
  x_mitre_network_requirements: {
    type: Boolean
  },
  type: {
    type: String,
    enum: ['attack-pattern'],
    default: 'attack-pattern'
  }
};

const AttackPattern = mongoose.model('AttackPattern', stixCommons['makeSchema'](AttackPatternSchema), 'stix');

module.exports = AttackPattern;
